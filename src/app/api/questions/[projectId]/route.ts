import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function GET(req: NextRequest, { params } : { params: { projectId: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})

        const { projectId } = params
        const project = await db.project.findUnique({ where: {id: projectId}, select: {id: true, repoURL: true}})
        if(!project) return NextResponse.json({msg: 'Project not found!!'}, { status: 404})
  
        const questions = await db.question.findMany({where: {projectId}, orderBy: { createdAt: 'desc'}, include: {user: { select: {ProfilePicture: true}}}})
        
        return NextResponse.json({questions}, { status: 200})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{ status: 500})
    }
}