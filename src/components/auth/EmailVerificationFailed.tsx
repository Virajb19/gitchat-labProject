'use client'

import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { resendVerificationLink } from "~/server/actions"

export default function EmailVerificationFailed({token}: {token: string}) {

  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleClick = async () => {
      setLoading(true)
      const res = await resendVerificationLink(token)
      setLoading(false)

      if(res.success) {
        toast.success('Email sent')
        setEmailSent(true)
      } else toast.error('Something went wrong!')
  }
  
  // Apply RESENT_TIME to avoid spamming or abuse 
 // can we ask for user email here to resend link??
  return <div className="w-[90%] lg:w-1/3 sm:w-[70%] max-w-3xl z-30 bg-card rounded-lg p-4 flex flex-col text-center gap-4">
      {emailSent ? (
           <h3 className="font-bold">Email sent.Check your inbox</h3>
      ) : (
         <>
            <h2 className="text-lg sm:text-2xl">The verification link you used is invalid or expired</h2>
                <button onClick={handleClick} disabled={loading} className="flex-center gap-3 rounded-lg bg-blue-600 hover:bg-blue-500 duration-200 py-2 px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-70">
                    {loading ? (
                        <>
                        <Loader2 className="animate-spin"/> Sending...
                        </>
                    ) : (
                        'Resend the link'
                    )}
                </button>
         </>
      )}
  </div>
}