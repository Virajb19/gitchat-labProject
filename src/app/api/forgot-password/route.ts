import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "~/lib/zod";
import { db } from "~/server/db";
import crypto from 'crypto';
import { sendConfirmationEmail } from "~/utils/email";

export async function POST(req: NextRequest) {
    try {
       
        const parsedData = forgotPasswordSchema.safeParse(await req.json())
        if(!parsedData.success) return NextResponse.json({msg: 'Invalid inputs', errors: parsedData.error.flatten().fieldErrors}, { status: 400})
        const { email } = parsedData.data

        const user = await db.user.findUnique({where: {email}, select: {id: true}})
        if(!user) return NextResponse.json({msg: 'user not found'}, {status: 404})

        const token = crypto.randomBytes(32).toString('hex')
        
        const resetToken = await db.verificationToken.create({data: {identifier: user.id, token, type: 'RESET_PASSWORD',expiresAt: new Date(Date.now() + 10 * 60 * 1000)}})

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`

        try {
            await sendConfirmationEmail(email, resetLink, resetToken.type)
        } catch (emailError) {
            console.error("Failed to send email:", emailError)
            return NextResponse.json({ msg: "Failed to send password reset email" }, { status: 500 })
        }

        return NextResponse.json({msg: 'Password reset email sent'}, {status: 200})
    } catch(err) {
        console.error(err)
        return NextResponse.json({msg: 'Internal Server error'},{status: 500})
    }
}