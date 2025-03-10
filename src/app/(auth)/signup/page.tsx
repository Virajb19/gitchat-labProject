import { redirect } from "next/navigation";
import SignUp from "~/components/auth/SignUp";
import { getServerAuthSession } from "~/server/auth";

export default async function SignInPage() {
  
    const session = await getServerAuthSession()
    if(session?.user) {
        redirect('/')
    }
    return <SignUp />
}