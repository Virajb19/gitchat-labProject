import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { pollCommits } from "~/lib/github";
import { indexGithubRepo } from "~/lib/github-loader";
import { createProjectSchema } from "~/lib/zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { z } from 'zod'

const bodySchema = createProjectSchema.extend({
  fileCount: z.number()
})

export async function POST(req: NextRequest) {
try {

    const session = await getServerAuthSession()
    if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})
    const userId = session.user.id

    const body = await req.json()

    const user = await db.user.findUnique({ where: { id: userId}, select: { credits: true}})
    if(!user) return NextResponse.json({msg: 'user not found'}, { status: 404})
    
    const parsedData = bodySchema.safeParse(body)
    if(!parsedData.success) return NextResponse.json({msg: 'Invalid inputs', errors: parsedData.error.flatten().fieldErrors}, { status: 400})
    const { name, repoURL, githubToken, fileCount } = parsedData.data

    if(fileCount > user.credits) return NextResponse.json({msg: 'Insufficient credits'}, { status: 403})

    const existingProject = await db.project.findFirst({where: {repoURL,userId}})
    if(existingProject) return NextResponse.json({msg: 'You already have a project with this repo URL'}, {status: 409})

    const project = await db.project.create({data: {name,repoURL,githubToken,userId}})

    try {
      await pollCommits(project.id)
      await indexGithubRepo(project.id,project.repoURL)
    } catch(err) {
        console.error(err)
        await db.project.delete({where: {id: project.id}})
        return NextResponse.json({msg: 'Error creating the project'}, { status: 500})
    }

    await db.user.update({where: {id: userId}, data: {credits: {decrement: fileCount}}})

    return NextResponse.json({msg: 'Project created successfully', projectId: project.id}, { status: 201})

} catch(err: any) {
    console.error(err)
    if(err instanceof Prisma.PrismaClientKnownRequestError) {
      if(err.code === 'P2002') {
        return NextResponse.json({msg: 'You already have a project with this repo URL'}, {status: 409})
      }
    }
    return NextResponse.json({msg: 'Error creating the project'}, { status: 500})    
  }
}

export async function GET() {
  try {
      const session = await getServerAuthSession()
      if(!session?.user) return NextResponse.json({msg: 'Unauthorized'}, { status: 401})
      const userId = session.user.id

      const projects = await db.project.findMany({ where: { userId, deletedAt: null}, orderBy: { createdAt: 'desc'}})

      return NextResponse.json({projects}, { status: 200})
  } catch(err) {
      console.error(err)
      return NextResponse.json({msg: 'Error getting the projects'},{ status: 500})
  }
}