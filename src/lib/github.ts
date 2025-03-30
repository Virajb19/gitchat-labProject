import { Octokit } from 'octokit'
import { summarizeCode, summarizeCommit } from './gemini'
import axios from 'axios'
import { db } from '~/server/db'

const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN
 })

type Response = {
   message: string,
   hash: string,
   authorName: string,
   authorAvatar: string,
   date: string
}

export async function getCommits(githubURL: string): Promise<Response[]> {

   const [owner, repo] = githubURL.split('/').slice(-2)
   if(!owner || !repo) throw new Error('Invalid Github URL')
       
    const { data } = await octokit.rest.repos.listCommits({owner,repo})

    const sortedCommits = data.sort((a: any,b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())

       const commits = sortedCommits.slice(0,15).map(commit => ({
        message: commit.commit.message,
        hash: commit.sha,
        authorName: commit.commit.author?.name ?? '',
        authorAvatar: commit.author?.avatar_url ?? '',
        date: commit.commit.author?.date ?? ''
    }))
 
    return commits
 }

export async function pollCommits(projectId: string) {
   const project = await db.project.findUnique({ where: { id: projectId}, select: { repoURL: true, id: true}})
   if(!project?.repoURL) throw new Error('Project has no github URL')

   const commits = await getCommits(project.repoURL)

   // existingCommits
   const processedCommits = await db.commit.findMany({ where: { projectId}, orderBy: { date: 'desc'}, select: { hash: true}})  

   const existingHashes = new Set(processedCommits.map(c => c.hash))
   const newCommits = commits.filter(commit => !existingHashes.has(commit.hash))

   // newCommits
   const unprocessedCommits = commits.filter(commit => !processedCommits.some((processedCommit) => processedCommit.hash === commit.hash))
   
   if(unprocessedCommits.length === 0) return 0

   const responses = await Promise.allSettled(unprocessedCommits.map(async (commit) => {
      const { data } = await axios.get(`${project.repoURL}/commit/${commit?.hash}.diff`, {
       headers: {
          Accept: 'application/vnd.github.v3.diff'
       }
      })
      const summary = await summarizeCommit(data) || ""
      return summary
   }))

   const summaries = responses.map(response => {
       if(response.status === 'fulfilled') return response.value
       else return ""
   })

   const commitsToDelete = await db.commit.findMany({where: {projectId}, orderBy: {date: 'asc'}, select: { id: true}, take: unprocessedCommits.length})
   await db.commit.deleteMany({where: {id: { in: commitsToDelete.map(commit => commit.id)}}})

   // await updateFiles(newCommits, project.repoURL, project.id)

  const Commits = await db.commit.createMany({
      data: unprocessedCommits.map((commit, i) => ({
         message: commit.message,
         hash: commit.hash,
         authorName: commit.authorName,
         authorAvatar: commit.authorAvatar,
         date: commit.date,
         summary: summaries[i] ?? '',
         projectId
      }))
   })
   return Commits.count
}

// async function updateFiles(newCommits: Response[], repoURL: string, projectId: string) {

//    const [owner, repo] = repoURL.split('/').slice(-2)
//    if(!owner || !repo) throw new Error('Invalid Github URL')

//     const responses = await Promise.allSettled(newCommits.map(async commit => {
//       const { data: diff } = await axios.get(`${repoURL}/commit/${commit?.hash}.diff`, {
//          headers: {
//             Accept: 'application/vnd.github.v3.diff'
//          }
//         })
//         return diff as string
//     }))

//     const commitDiffs = responses.filter(res => res.status === 'fulfilled').map(res => res.value)

//     await Promise.all(commitDiffs.map(async diff => {
//          const changedFiles = diff.split('\n').filter(line => line.startsWith('+++ b/')).map(line => line.replace('+++ b/', ''))

//          await Promise.all(changedFiles.map(async filename => {
//              const { data } = await octokit.rest.repos.getContent({
//                owner,
//                repo,
//                path: filename
//              })

//              if('content' in data) {
//                 const summary = await summarizeCode({ pageContent: data.content, metadata: { source: filename}})
//                 db.sourceCodeEmbedding.upsert({ 
//                   where: { filename_projectId: { filename, projectId}}, 
//                   update: { sourceCode: data.content, summary}, 
//                   create: { filename, sourceCode: data.content, summary, projectId}
//                })
//              }            
//          }))

//     }))
// }
