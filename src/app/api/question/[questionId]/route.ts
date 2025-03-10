import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function DELETE(req: NextRequest, { params } : { params: { questionId: string}}) {
    try {
        
        const session = await getServerAuthSession()
        if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})

        // await new Promise(r => setTimeout(r, 7000))

        const { questionId } = params
        const question = await db.question.findUnique({ where: { id: questionId}, select: { id: true}})
        if(!question) return NextResponse.json({ msg: 'question not found'}, { status: 404})

        await db.question.delete({ where: { id: question.id}})

        return NextResponse.json({msg: 'Deleted'}, { status: 200})

    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Error deleting question'}, { status: 500})
    }
}