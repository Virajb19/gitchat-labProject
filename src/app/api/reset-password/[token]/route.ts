import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "~/lib/zod";
import { db } from "~/server/db";
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest, {params}: {params: {token: string}}) {
    try {

        const { token } = params

        const resetToken = await db.verificationToken.findFirst({where: {token, expiresAt: {gt: new Date()}}, select: {identifier: true}})
        if(!resetToken) return NextResponse.json({msg: 'Invalid or expired token'}, {status: 400})

        const user = await db.user.findUnique({where: {id: resetToken.identifier}, select: {id: true}})
        if(!user) return NextResponse.json({msg: 'user not found'}, { status: 404})

        const parsedData = resetPasswordSchema.safeParse(await req.json())
        if(!parsedData.success) return NextResponse.json({msg: 'Invalid inputs', errors: parsedData.error.flatten().fieldErrors}, { status: 400})
        const { newPassword, confirmPassword } = parsedData.data

        // if(newPassword !== confirmPassword) return NextResponse.json({msg: "Passwords don't match"}, { status: 403})

        const hashedPassword = await bcrypt.hash(newPassword,10)

        // user is not logged in so we can't access session.user.id since session object is null
        // That is why we need to generate a token and send an email to the user to get userId
        // server does not know from which user request came
        // changing password when user is logged in is very simple

        await db.$transaction(async tx => {
            await tx.user.update({where: {id: user.id}, data: {password: hashedPassword}})
            await tx.verificationToken.delete({where: {token_identifier: {token,identifier: resetToken.identifier}}})
        })

        return NextResponse.json({msg: 'Password reset successfully'}, {status: 201})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
}