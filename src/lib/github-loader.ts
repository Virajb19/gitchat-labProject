import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { generateEmbedding, summarizeCode, summarizeFilesBatch } from './gemini'
import { Document } from '@langchain/core/documents'
import { db } from '~/server/db'

const BATCH_SIZE = 20
const MAX_RUNS = 7

export async function loadGithubRepo(githubURL: string, githubToken?: string) {

  const loader = new GithubRepoLoader(githubURL, {
    accessToken: githubToken ?? process.env.GITHUB_ACCESS_TOKEN,
    branch: 'main',
    ignoreFiles: ['pnpm-lock.yaml','package-lock.json','migration.sql'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  })

  const docs = await loader.load()
  return docs
}

export async function indexGithubRepo(projectId: string, githubURL: string, githubToken?: string) {
  
   const docs = await loadGithubRepo(githubURL, githubToken)
   const docsWithoutSummary = await db.sourceCodeEmbedding.findMany({where: {projectId, summary: ''}, select: {filename: true}})
  //  const docsToSummarize = docsWithoutSummary.length === 0 ? docs : docs.filter(doc => docsWithoutSummary.some(docWithoutSummary => docWithoutSummary.filename == doc.metadata.source))

   //filename is filePath which is unique 
   // using Set for filtering is faster
   const unprocessedDocs = new Set(docsWithoutSummary.map(d => d.filename))
   const docsToSummarize = unprocessedDocs.size === 0 ? docs : docs.filter(doc => unprocessedDocs.has(doc.metadata.source))

   if(docsToSummarize.length === 0) {
    clearInterval(interval)
    return
   }

  // if(docsToSummarize.length < 13) {
  //       const responses = await Promise.allSettled(docsToSummarize.map(async doc => {
  //       const summary = await summarizeCode(doc).catch(err => {
  //         console.error('Error summarizing code', err)
  //         return ''
  //       })
  //       return summary
  //       }))
  //     summaries = responses.map(response => response.status === 'fulfilled' ? response.value : '')
  // } else {
  //     for (const doc of docsToSummarize) {
  //       const summary = await summarizeCode(doc).catch(err => {
  //         console.error('Error creating summary', err)
  //         return ''
  //       })

  //       summaries.push(summary)

  //       if(summary === '') {
  //         console.log('waiting...')
  //         await new Promise(r => setTimeout(r, 12 * 1000))
  //       }
  //     }
  // }

  // Maintain order of docs and summaries
  let summaries: string[] = []

  for(let i=0; i < docsToSummarize.length; i += 10) {
     const batch = docsToSummarize.slice(i, i + 10)

     const batchSummaries = await summarizeFilesBatch(batch)
    //  await processBatch(batchSummaries, batch)
     summaries.push(...batchSummaries)

    //  if(batchSummaries.length === 0) await new Promise(r => setTimeout(r, 20 * 1000))

     if(batchSummaries.every(summary => summary === '')) await new Promise(r => setTimeout(r, 20 * 1000))
  }

  const embeddings = await Promise.all(docsToSummarize.map(async (doc,i) => {
      const embedding = await generateEmbedding(summaries[i] ?? '').catch(err => {
         console.error(err)
         return []
      })

      return {
         summaryEmbedding: embedding,
         sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
         filename: doc.metadata.source,
         summary: summaries[i] ?? ''
      }
  }))

  await Promise.allSettled(embeddings.map(async (embedding) => {
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
        where: { filename_projectId: {filename: embedding.filename, projectId}},
        update: { summary: embedding.summary},
        create: {
          sourceCode: embedding.sourceCode,
          filename: embedding.filename,
          summary: embedding.summary,
          projectId
        },
        select: { id: true}
       })

       await db.$executeRaw`
       UPDATE "SourceCodeEmbedding"
       SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
       WHERE id = ${sourceCodeEmbedding.id}
       `
  }))

}

export async function processBatch(batchSummaries: string[], batch: Document[], projectId: string) {
   const embeddings = await Promise.all(batch.map(async (doc,i) => {
        const embedding = await generateEmbedding(batchSummaries[i] ?? '')

        return {
          summaryEmbedding: embedding,
          sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
          filename: doc.metadata.source,
          summary: batchSummaries[i] ?? ''
        }
   }))

   await Promise.allSettled(embeddings.map(async embedding => {
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            sourceCode: embedding.sourceCode,
            filename: embedding.filename,
            summary: embedding.summary,
            projectId
          },
          select: { id: true}
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        WHERE id = ${sourceCodeEmbedding.id}
        SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
        `
   }))
}

export function startIndexing(projectId: string, githubURL: string) {

  let runCount = 0

   async function indexGithubRepo() {
      try {
        runCount++
        console.log('Indexing repository')

        // const docs = await loadGithubRepo(githubURL)
        const docsWithoutSummary = await db.sourceCodeEmbedding.findMany({where: {projectId, summary: ''}, select: {filename: true}})

        console.log('docs without summary', docsWithoutSummary.length)

        const docsCount = await db.sourceCodeEmbedding.count({where: { projectId }})
        const isAlldocsSummarized = docsWithoutSummary.length === 0 && docsCount > 0

        if(isAlldocsSummarized) {
          console.log('All documents are summarized. Stopping recursion.')
          return
        }
 
        // Load repo only after checking if all docs are processed
        const docs = await loadGithubRepo(githubURL)
    
        const unprocessedDocs = new Set(docsWithoutSummary.map(d => d.filename))
        const docsToSummarize = unprocessedDocs.size === 0 ? docs : docs.filter(doc => unprocessedDocs.has(doc.metadata.source))
     
        console.log(`Docs to summarize: ${docsToSummarize.length}`)

        if(docsToSummarize.length === 0) {
         console.log('No more documents to summarize. Stopping recursion.')
         return
        }
     
       let summaries: string[] = []
     
       for(let i=0; i < docsToSummarize.length; i += BATCH_SIZE) {
          const batch = docsToSummarize.slice(i, i + BATCH_SIZE)

          console.log('Summarizing the batch', i, ' - ', i + BATCH_SIZE)
          const batchSummaries = await summarizeFilesBatch(batch)

          // console.log('Processing the batch',i, ' - ', i + BATCH_SIZE)
          // await processBatch(batchSummaries, batch, projectId)
          summaries.push(...batchSummaries)
     
          // if(batchSummaries.length === 0) {
          //   console.log('waiting...')
          //   await new Promise(r => setTimeout(r, 20 * 1000))
          // }
     
          if(batchSummaries.every(summary => summary === '')) {
            console.log('waiting...')
            await new Promise(r => setTimeout(r, 20 * 1000))
          }
       }
     
       const embeddings = await Promise.all(docsToSummarize.map(async (doc,i) => {
           const embedding = await generateEmbedding(summaries[i] ?? '').catch(err => {
              console.error(err)
              return []
           })
     
           return {
              summaryEmbedding: embedding,
              sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
              filename: doc.metadata.source,
              summary: summaries[i] ?? ''
           }
       }))
     
       await Promise.allSettled(embeddings.map(async (embedding) => {
           const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
             where: { filename_projectId: {filename: embedding.filename, projectId}},
             update: { summary: embedding.summary},
             create: {
               sourceCode: embedding.sourceCode,
               filename: embedding.filename,
               summary: embedding.summary,
               projectId
             },
             select: { id: true}
            })
     
            await db.$executeRaw`
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
            WHERE id = ${sourceCodeEmbedding.id}
            `
       }))   

          if (runCount < MAX_RUNS) {
            console.log('Waiting for 15 seconds before next run...')
            await new Promise(r => setTimeout(r, 1000 * 15))
            indexGithubRepo()
          } else {
            console.log('Maximum run count reached. Stopping indexing.')
            return
          }

      } catch(err) {
         console.error('Error indexing repo', err)
         return 
      }
   }

   indexGithubRepo()
} 