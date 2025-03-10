import { NextRequest, NextResponse } from "next/server";
import { createMeetingSchema } from "~/lib/zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function GET(req: NextRequest, { params } : { params: { projectId: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})

        const { projectId } = params
        const project = await db.project.findUnique({ where: { id: projectId}, select: { id: true}})
        if(!project) return NextResponse.json({msg: 'project not found'}, { status: 404})
      
        const meetings = await db.meeting.findMany({ where: { projectId: project.id}, orderBy: { createdAt: 'desc'}, include: { issues: { select: { id: true}}}})
    
        return NextResponse.json({meetings}, { status: 200})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
}

export async function POST(req: NextRequest, { params } : { params: { projectId: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})
        const userId = session.user.id

        if(session.user.credits < 50) return NextResponse.json({msg: 'Insufficients credits'}, { status: 403})

        const { projectId } = params
        const project = await db.project.findUnique({ where: { id: projectId}, select: { id: true}})
        if(!project) return NextResponse.json({msg: 'project not found'}, { status: 404})

        const parsedData = createMeetingSchema.safeParse(await req.json())
        if(!parsedData.success) return NextResponse.json({msg: 'Invalid inputs', errors: parsedData.error.flatten().fieldErrors}, { status: 400})
        const { name, url } = parsedData.data
            
        const meeting = await db.meeting.create({ data: {name, url, status: 'PROCESSING', projectId, userId}, select: { id: true}})

        return NextResponse.json({meetingId: meeting.id}, { status: 200})
        
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
} 

