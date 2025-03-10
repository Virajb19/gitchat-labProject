import {
    getServerSession,
    type DefaultSession,
    type NextAuthOptions,
  } from "next-auth";
  import { db } from "~/server/db"
  import CredentialsProvider from "next-auth/providers/credentials";
  import GitHubProvider from "next-auth/providers/github";
  import GoogleProvider from "next-auth/providers/google";
  import { SignInSchema } from "~/lib/zod";
  import bcrypt from 'bcrypt'
  
  declare module "next-auth" {
    interface Session extends DefaultSession {
      user: {
        id: number,
        credits: number,
        emailVerified: boolean
      } & DefaultSession["user"];
    }
  }
  
  declare module 'next-auth/jwt' {
    interface JWT {
        id: number,
        credits: number,
        emailVerified: boolean
    }
  }
  
  export const authOptions: NextAuthOptions = {
    callbacks: {
      jwt: async ({user, token, trigger}) => {
        // if(user) {
        //   const existingUser = await db.user.findFirst({where: { OR: [{OauthId: user.id}, { id: parseInt(user.id)}]}, select: {id: true, credits: true}})
        //   if(existingUser) {
        //     token.id = existingUser.id
        //     token.credits = existingUser.credits
        //   }
        // } else {
        //   const db_User = await db.user.findUnique({ where: { id: token.id}, select: { credits: true}})
        //   if(db_User) token.credits = db_User.credits
        // }
         if(token && token.sub) {
          const existingUser = await db.user.findFirst({where: { OR: [{OauthId: token.sub}, { id: parseInt(token.sub)}]}, select: {id: true, credits: true, emailVerified: true}})
          if(existingUser) {
            token.id = existingUser.id
            token.credits = existingUser.credits
            token.emailVerified = !!existingUser.emailVerified
          }
         }
         return token
      },
      session: async ({session, token}) => {
        if(token && session && session.user) {
          session.user.name = token.name
          session.user.id = token.id 
          session.user.credits = token.credits
          session.user.emailVerified = token.emailVerified
        }
        return session
      },
      signIn: async ({ user, account, profile}) => {
       try {
          
         if(account?.provider && profile) {
  
          const provider = account.provider === 'github' ? 'GITHUB' : 'GOOGLE'
           
           const existingUser = await db.user.findFirst({where: { OR: [{email: user.email!}, {OauthId: user.id}]}, select: {id: true}})
           if(existingUser) {
             await db.user.update({
              where: {id: existingUser.id},
              data: {lastLogin: new Date(), username: user.name ?? undefined, email: user.email ?? undefined, ProfilePicture: user.image, OauthProvider: provider, OauthId: user.id}
             })
           } else {
              await db.user.create({
                data: {
                  username: user.name ?? "unknown",
                  email: user.email ?? "unknown",
                  emailVerified: new Date(),
                  ProfilePicture: user.image,
                  OauthId: user.id,
                  OauthProvider: provider
                }
              })
           }     
         }
  
          return true
       } catch(e) {
        console.log(e)
        return false
       }
    },
  },
    providers: [
       CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: {label: 'email',type: 'text',placeholder: 'email'},
          password: {label: 'password', type: 'password', placeholder: 'password'}
        },
         authorize: async (credentials: any) => {
      try {
          if (!credentials) {
            throw new Error("No credentials provided")
          }

          const {email,password} = credentials
  
          const parsedData = SignInSchema.safeParse({email,password})
          if(!parsedData.success) throw new Error('Invalid Credentials. try again !')
            
          const user = await db.user.findUnique({where: {email}})
          if(!user) throw new Error('User not found. Please check your email !')
         
          if (!user.emailVerified) {
            throw new Error("Email not verified. Please check your email.");
          } 
          
          const isMatch = await bcrypt.compare(password, user.password as string)     
          if(!isMatch) throw new Error('Incorrect password. Try again !!!')
  
          await db.user.update({where: {id: user.id}, data: {lastLogin: new Date()}})
  
          return {id: user.id.toString(), name: user.username, email: user.email}
  
  } catch(e) {
    console.error(e)
    if(e instanceof Error) throw new Error(e.message)
    else throw new Error('Something went wrong!!!')
  }
        }
       }) ,
       GitHubProvider({
        clientId: process.env.GITHUB_ID || "",
        clientSecret: process.env.GITHUB_SECRET || ""
       }),
       GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
      })
    ],
    session: {
      strategy: 'jwt',
      maxAge: 2 * 24 * 60 * 60
    },
    jwt: {
      secret: process.env.NEXTAUTH_SECRET || 'secret',
      maxAge: 60 * 60
    },
    pages: {
      signIn: '/signin'
    },
    secret: process.env.NEXTAUTH_SECRET || 'secret'
  } satisfies NextAuthOptions;
  
  export const getServerAuthSession = () => getServerSession(authOptions)