import { redirect } from "next/navigation";
import SignIn from "~/components/auth/SignIn";
import { getServerAuthSession } from "~/server/auth";

export default async function SignInPage() {

    const session = await getServerAuthSession()

    if(session?.user) {
        redirect('/')
    }

    return <SignIn />
}