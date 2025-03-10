'use server'

import { SignUpSchema } from "~/lib/zod"
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid';
import { cookies } from 'next/headers';
import { db } from "~/server/db"
import { z } from 'zod'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from "~/lib/gemini"
import { getServerAuthSession } from "./auth"
import Stripe from 'stripe'
import { redirect } from "next/navigation"
import { Octokit } from "octokit"
import { sendConfirmationEmail } from "~/utils/email";

type formData = z.infer<typeof SignUpSchema>

export async function signup(formData: formData) {
 try {
    const parsedData = SignUpSchema.safeParse(formData)
    if(!parsedData.success) return {success: false, errors: parsedData.error.flatten().fieldErrors, msg: 'Invalid inputs'}
    const {username, email, password} = parsedData.data

    // const userExists = await db.user.findFirst({where: {OR: [{email}, {username}]}})
    
    const userExists = await db.user.findUnique({where: {email}})
    if(userExists) return {success: false, msg: 'user already exists'}

    const hashedPassword = await bcrypt.hash(password,10)
    const user = await db.user.create({data: {username,email,password: hashedPassword}, select: {id: true, email: true}})

    const verificationToken = await db.verificationToken.create({data: {identifier: user.id, token: uuid(), type: 'EMAIL_VERIFICATION', expiresAt: new Date(Date.now() + 60 * 60 * 1000)}})
    
    const confirmationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${verificationToken.token}`
    await sendConfirmationEmail(user.email, confirmationLink, verificationToken.type)

    cookies().set('USER_ID', user.id.toString(), {
        maxAge: 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    })
 
    return {success: true, msg: 'Signed up successfully. Welcome to GitChat !!!'}
} catch(err) {
    console.error('Error while signing up',err)
    return {success: false, msg: 'Something went wrong !!!'}
 }
}

export async function verifyEmail(token: string) {
   try {
       
    const verificationToken = await db.verificationToken.findFirst({where: {token, expiresAt: {gt: new Date()}}, select: {identifier: true}})
    if(!verificationToken) return {success: false, msg: 'Invalid or expired token'}

    const user = await db.user.findUnique({where: {id: verificationToken.identifier}, select: {id: true, emailVerified: true}})
    if(!user) return { success: false, msg: 'user not found'}

    if (user.emailVerified) return { success: false, msg: 'Email already verified' }

    await db.$transaction(async tx => {
        await tx.user.update({where: {id: user.id}, data: {emailVerified: new Date()}})
        await tx.verificationToken.delete({where: {token_identifier: {token,identifier: verificationToken.identifier}}})
    })

     // It can be modified only in Server action or route handler
    // cookies().delete('USER_ID')
    return {success: true, msg: 'Email verified successfully'}

   } catch(err) {
     console.error(err)
     return {success: false, msg: 'Something went wrong !!!'}
   }
}

export async function resendVerificationLink(prevToken: string) {
    try {
       // Make userId a string as cuid() in schema
       const userId = parseInt(cookies().get('USER_ID')?.value as string)
    //    if (!userId) return { success: false, msg: 'No Id found in cookies' }

       const user = await db.user.findUnique({where: {id: userId}, select: {id: true, email: true, emailVerified: true}})
       if (!user) return { success: false, msg: 'User not found' }
    //    if (user.emailVerified) return { success: false, msg: 'Email already verified' }
       
       await db.verificationToken.delete({where: {token_identifier: {token: prevToken, identifier: user.id}}})

       const verificationToken = await db.verificationToken.create({data: {identifier: user.id, token: uuid(), type: 'EMAIL_VERIFICATION', expiresAt: new Date(Date.now() + 60 * 60 * 1000)}})
    
       const confirmationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${verificationToken.token}`
       await sendConfirmationEmail(user.email, confirmationLink, verificationToken.type)

       return { success: true, msg: 'Verification link resent'}
       
    } catch(err) {
        console.error(err)
        return {success: false, msg: 'Something went wrong !!!'}
    }
}

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY as string})

export async function askQuestion(question: string, projectId: string) {
    const stream = createStreamableValue()
 
    const queryEmbedding = await generateEmbedding(question)
    const vectorQuery = `[${queryEmbedding.join(',')}]`

    const result = await db.$queryRaw`
     SELECT "filename", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
     FROM "SourceCodeEmbedding"
     WHERE  1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
     AND "projectId" = ${projectId}
     ORDER BY similarity DESC
     LIMIT 10 
    ` as { filename: string, sourceCode: string, summary: string} []

    console.log(result.length)

    let context = ''

    for(const doc of result) {
         context += `source: ${doc.filename}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    (async () => {
         const { textStream } = streamText({
            model: google('gemini-1.5-flash'),
            prompt: `You are a AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is learning to work with the code
                 AI Assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert intelligence, helpfulness, cleverness and articulateness.
            AI is well-behaved and well mannered individual.
            AI is always friendly, kind and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
            AI has the sum of all knowledge in their brain and is able to accurately answer nearly any question about any topic in the world.
            If the question is about code or a specific file, AI will provide the detailed answer, giving step by step instructions about the code
            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            START QUESTION
            ${question}
            END OF QUESTION
            AI Assistant will take into account any CONTEXT BLOCK that is provided in a conversation
            If the context does not provide the answer to the question, the AI will say "I am sorry, but I dont know the answer of that question!!"
            AI Assistant will not apologize for the previous responses, but instead will indicated new information was gained.
            AI Assistant will not invent anything that is not drawn directly from the context.
            Answer in markdown syntax, with code snippets if needed. Be as detailed as possible while answering, make sure there is no wrong answer.

            MOST IMPORTANT 
            Give answers in points and new point should start from next line.
            Every point should have a serial number at the start 
            `,
         })

         for await (const text of textStream) {
            stream.update(text)
         }

         stream.done()
    })()

    return {
         output: stream.value,
         fileReferences: result
}
}

export async function saveQuestion(question: string, answer: string, projectId: string, filesReferences: any) {
    try {

     const session = await getServerAuthSession()
     if(!session?.user) return {success: false, msg: 'Unauthorized'}
     const userId = session.user.id

     const existingQuestion = await db.question.findFirst({where: {answer, projectId}})
     if(existingQuestion) return { success: false, msg: 'Question already saved'}

     await db.question.create({data: {question, answer, projectId, userId, filesReferences}})

     return {success: true, msg: 'Question saved successfully'}

    } catch(err) {
        console.error('Error saving question',err)
        return {success: false, error: 'Error saving question!'}
    }
}

export async function archiveProject(projectId: string) {
    try {

        const session = await getServerAuthSession()
        if(!session?.user) return {success: false, msg: 'Unauthorized'}

        const project = await db.project.findUnique({ where: {id: projectId}, select: { id: true}})
        if(!project) return { success: false, msg: 'Project not found!!'}

        await db.project.update({where: { id: projectId}, data: {deletedAt: new Date()}})
        // await db.project.delete({where: {id: projectId}})

        return { success: true }

    } catch(err) {
        console.error(err)
        return {success: false, msg: 'Failed to archive the project'}
    } 
}


export async function createCheckoutSession(credits: number) {
    const authSession = await getServerAuthSession()
    if(!authSession?.user) throw new Error('Unauthorized')
        const userId = authSession.user.id
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {apiVersion: '2024-11-20.acacia'})
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `${credits} Gitchat credits`
                    },
                    unit_amount: Math.round((credits / 50) * 100),
                }, 
                quantity: 1
            }
        ],
        customer_creation: 'always',
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        client_reference_id: userId.toString(),
        metadata: { credits } 
    })

    return redirect(session.url!)
}

const octokit = new Octokit({auth: process.env.GITHUB_ACCESS_TOKEN})

export async function checkCredits(githubURL: string, githubToken?: string) {

    const session = await getServerAuthSession()
    if(!session?.user) throw new Error('Unauthorized') 
    const userId = session?.user.id

    const [owner, repo] = githubURL.split('/').slice(-2)
    if(!owner || !repo) throw new Error('Invalid github url')
    const fileCount = await countFiles('', owner, repo)

    const user = await db.user.findUnique({where: {id: userId}, select: {credits: true}})
    
    return { fileCount, userCredits: user?.credits || 0}
}

async function countFiles(path: string, owner: string, repo: string, acc: number = 0) {

    const { data } = await octokit.rest.repos.getContent({owner, repo, path})

    if(!Array.isArray(data) && data.type === 'file') acc++

    if(Array.isArray(data)) {
      let fileCount: number = 0
      let directories: string[] = []

        for (const item of data) {
            if(item.type === 'dir') directories.push(item.path)
            else if(item.type === 'file') fileCount++
        }

        if(directories.length > 0) {
            const directoryCounts = await Promise.all(directories.map(async dir => {
                return await countFiles(dir, owner, repo)
            }))
            fileCount += directoryCounts.reduce((acc,count) => acc + count, 0)
        }
        return fileCount + acc
    }

    return acc
}

export async function getEmbeddings(projectId: string) {
    const embeddings = await db.sourceCodeEmbedding.count({ where: {projectId, summary: ''}})
    return embeddings
    // const embeddings = await db.sourceCodeEmbedding.findMany({ where: { projectId}, select: { summary: true}})
    // const largestSummary = embeddings.reduce((prev, curr) => {
    //     return curr.summary.length > prev?.length ? curr.summary : prev
    // }, embeddings[0]?.summary)

    // return largestSummary
}


