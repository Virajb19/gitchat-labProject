import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import EmailVerificationFailed from "~/components/auth/EmailVerificationFailed"
import { verifyEmail } from "~/server/actions"
import { db } from "~/server/db"

export default async function EmailVerifiedPage({params: {token}}: { params: { token: string}}) {

  const verificationToken = await db.verificationToken.findFirst({where: {token, expiresAt: {gt: new Date()}}, select: {identifier: true}})
  if(!verificationToken) return notFound()

  // No need to create a button to verify email
  const res = await verifyEmail(token)

  if(res.success) return redirect('/signin')
  
  // Try verification with ShadCN InputOTP and Form with [error,setError] state
  return <div className="w-full min-h-screen flex-center">
            {/* {res.success ? (
              <>
                 <h2 className="text-lg sm:text-2xl">Your email has been successfully verified. You can now access your account.</h2>
                 <Link href={'/signin'} className="group flex-center gap-3 rounded-lg bg-blue-600 py-2 px-4 font-semibold"><ArrowLeft className="group-hover:-translate-x-1 duration-300"/>Back to login</Link>
                 </>
            ) : (
              <> */}
                 <EmailVerificationFailed token={token}/>
              {/* </>
            )} */}
  </div>
}
