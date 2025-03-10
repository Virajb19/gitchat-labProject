import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { generateEmbedding, summarizeCode } from './gemini'
import { db } from '~/server/db'

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
   const docsToSummarize = docs.filter(doc => !docsWithoutSummary.some(docWithoutSummary => docWithoutSummary.filename.toLowerCase() == doc.metadata.source.toLowerCase()))

   //filename is filePath which is unique 
   const existingFilepaths = new Set(docsWithoutSummary.map(d => d.filename))
   const docstoSummarize = docs.filter(doc => existingFilepaths.has(doc.metadata.source))

  //  console.log('Docs to summarize',docsToSummarize.length)
  //  return
   if(docsToSummarize.length === 0) return

  //  const batchSize = 13
  //  const summaries: string[] = []

  //  for(let i=0 ; i < docsToSummarize.length; i += batchSize) {
  //    const batch = docsToSummarize.slice(i, i + batchSize)
  //    const responses = await Promise.allSettled(batch.map(async doc => {
  //       const summary = await summarizeCode(doc).catch(err => {
  //         console.error('Error summarizing code', err)
  //         return ''
  //       })
  //       return summary
  //    }))

  //    const batchSummaries = responses.map(response => response.status === 'fulfilled' ? response.value : '')
  //    summaries.push(...batchSummaries)

  //     console.log('waiting...')
  //     if(docsToSummarize.length > batchSize) {
  //       await new Promise(resolve => setTimeout(resolve, 1000 * 20))
  //     }
  //  }
   
  let summaries: string[] = []
  if(docsToSummarize.length < 13) {
        const responses = await Promise.allSettled(docsToSummarize.map(async doc => {
        const summary = await summarizeCode(doc).catch(err => {
          console.error('Error summarizing code', err)
          return ''
        })
        return summary
        }))
      summaries = responses.map(response => response.status === 'fulfilled' ? response.value : '')
  } else {
      for (const doc of docsToSummarize) {
        const summary = await summarizeCode(doc).catch(err => {
          console.error('Error crearing summary', err)
          return ''
        })

        summaries.push(summary)

        if(summary === '') {
          console.log('waiting...')
          await new Promise(r => setTimeout(r, 12 * 1000))
        }
      }
  }

   // USE THEN CATCH
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

  // NO RATE LIMITING IN EMBEDDING MODEL 
  await Promise.allSettled(embeddings.map(async (embedding) => {
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
        where: { filename_projectId: {filename: embedding.filename, projectId}},
        update: { summary: embedding.summary},
        create: {
          sourceCode: embedding.sourceCode,
          filename: embedding.filename,
          summary: embedding.summary,
          projectId
        }
       })

       await db.$executeRaw`
       UPDATE "SourceCodeEmbedding"
       SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
       WHERE id = ${sourceCodeEmbedding.id}
       `
  }))

}
