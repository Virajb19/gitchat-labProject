import { NextRequest, NextResponse } from "next/server"
import { processMeeting } from "~/lib/assembly"
import { processMeetingSchema } from "~/lib/zod"
import { getServerAuthSession } from "~/server/auth"
import { db } from "~/server/db"
import { downloadFile } from '~/lib/appwrite-server'
import { z } from 'zod'

// const bodySchema = z.object({ projectId: z.string()})

export async function POST(req: NextRequest, { params }: { params: { id: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})
        const userId = session.user.id

        if(session.user.credits < 50) return NextResponse.json({msg: 'Insufficients credits'}, { status: 403})

        const { id } = params
        const meeting = await db.meeting.findUnique({ where: { id }, select: { id: true, url: true}})
        if(!meeting) return NextResponse.json({ msg: 'meeting not found'}, { status: 404})

        // const projectId = await db.meeting.findUnique({ where: { id: meeting.id}, include: { project: { select: { id: true}}})

        const parsedData = processMeetingSchema.safeParse(await req.json())
        if(!parsedData.success) return NextResponse.json({msg: 'Invalid inputs', errors: parsedData.error.flatten().fieldErrors}, { status: 400})
        const { fileUrl, projectId } = parsedData.data

        // const filePath = await downloadFile(fileKey)

        // USE MEETING.URL
        const { summaries } = await processMeeting(meeting.url) 
            
        await db.issue.createMany({ data: summaries.map(summary => {
            return {
                start: summary.start,
                end: summary.end,
                gist: summary.gist,
                headline: summary.headline,
                summary: summary.summary,
                meetingId: meeting.id,
                projectId
            }
        })})

        await db.meeting.update({ where: { id: meeting.id}, data: { status: 'PROCESSED', name: summaries[0]!.headline}})
        await db.user.update({ where: { id: userId}, data: { credits: { decrement: 50}}})

        return NextResponse.json({ success: true}, { status: 200})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})

        const { id } = params
        const meeting = await db.meeting.findUnique({ where: { id }, select: { id: true}})
        if(!meeting) return NextResponse.json({ msg: 'meeting not found'}, { status: 404})

        await db.meeting.delete({ where: { id: meeting.id}})

        return NextResponse.json({msg: 'deleted'}, { status: 200})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
}