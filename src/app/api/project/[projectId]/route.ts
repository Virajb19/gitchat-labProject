import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string}}) {
    try {
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})

        const { projectId } = params

        const project = await db.project.findUnique({ where: { id: projectId}, select: { id: true}})
        if(!project) return NextResponse.json({msg: 'project not found'}, { status: 404})

        await db.project.update({ where: { id: project.id}, data: { deletedAt: new Date()}})
        // await db.project.delete({ where: { id: project.id}})

        return NextResponse.json({msg: 'Project deleted'}, { status: 200})

    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal server error'}, { status: 500})
    }
}