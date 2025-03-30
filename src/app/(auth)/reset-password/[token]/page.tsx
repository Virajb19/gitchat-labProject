import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import ResetPassword from "~/components/auth/ResetPassword"
import { db } from "~/server/db"
import { ArrowLeft } from 'lucide-react'

export default async function ResetPasswordPage({params: {token}}: { params: { token: string}}) {

    const resetToken = await db.verificationToken.findFirst({where: {token}, select: {expiresAt: true, identifier: true}})
    if(!resetToken) return notFound()
   
    const isExpired = new Date() > resetToken.expiresAt

    const user = await db.user.findUnique({where: {id: resetToken.identifier}, select: {id: true}})
    if(!user) return redirect('/signin')

  return <div className="w-full min-h-screen flex-center">
       {isExpired ? (
         <div className="w-[90%] lg:w-1/3 sm:w-[70%] max-w-3xl z-30 bg-card shadow-lg shadow-blue-600 rounded-lg p-4 flex flex-col text-center gap-4">
            <h2 className="text-lg sm:text-2xl font-bold">Link expired!. Please request a new one</h2>
            <Link href={'/signin'} className="group flex-center gap-3 rounded-lg bg-blue-600 py-2 px-4 font-semibold"><ArrowLeft className="group-hover:-translate-x-1 duration-300"/>Back to login</Link>
        </div>
       ) : (
        <ResetPassword token={token}/> 
       )}
  </div>
}