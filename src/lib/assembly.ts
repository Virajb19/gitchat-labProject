import { AssemblyAI } from 'assemblyai'
import fs from 'fs/promises'

const client = new AssemblyAI({ apiKey : process.env.ASSEMBLY_API_KEY ?? ''})

function msToTime(ms: number) {
   const seconds = ms / 1000
   const minutes = Math.floor(seconds / 60)
   const remainingSeconds = Math.floor(seconds % 60)
   return `${minutes.toString().padStart(2,'0')}:${remainingSeconds.toString().padStart(2,'0')}`
}

export async function processMeeting(fileUrl: string) {

    // const fileData = await fs.readFile(filePath)
    // const fileurl = await client.files.upload(fileData)

    const transcript = await client.transcripts.transcribe({
        audio_url: fileUrl,
        auto_chapters: true
    })

    const summaries = transcript.chapters?.map(chapter => ({
        start: msToTime(chapter.start),
        end: msToTime(chapter.end),
        gist: chapter.gist,
        headline: chapter.headline, 
        summary: chapter.summary
    })) ?? []

    if(!transcript.text) throw new Error('No transcript found ')

    // await fs.unlink(filePath)

    return { summaries }
}