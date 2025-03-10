import { redirect } from "next/navigation";
import { ReactNode } from "react";
import FloatingShape from "~/components/Floating-shapes";
import { getServerAuthSession } from "~/server/auth";

export default async function AuthLayout({children}: {children: ReactNode}) {

   const session = await getServerAuthSession()
   if(session?.user) {
       redirect('/')
   }

   return <div className="relative overflow-hidden">
          <FloatingShape />
       {children}
   </div>
}