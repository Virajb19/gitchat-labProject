'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { createProjectSchema } from "~/lib/zod"
import { motion } from 'framer-motion'
import { Loader, ArrowRight, Info, FileText, Key } from 'lucide-react'
import { LuGithub } from "react-icons/lu";
import axios, { AxiosError } from 'axios'
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useProject } from "~/hooks/useProject"
import { useRouter } from "nextjs-toploader/app"
import { checkCredits } from "~/server/actions"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation } from "@tanstack/react-query"

type Input = z.infer<typeof createProjectSchema>

export default function CreatePage() {

  const form = useForm<Input>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: 'Project', repoURL: 'https://github.com/Virajb19/Portfolio'}
  })

  const [creditInfo, setCreditInfo] = useState({ fileCount: 0, userCredits: 0})

  const queryClient = useQueryClient()
  const { setProjectId } = useProject()
  const router = useRouter()

  const {data: session} = useSession()
  const userId = session?.user.id
  const credits = session?.user.credits

  const {mutateAsync: createProject, isPending, isError} = useMutation({
    mutationFn: async ({data, fileCount}: {data: Input, fileCount: number}) => {
      const {data : { projectId }} = await axios.post('/api/project', {...data, fileCount})
      return projectId
    },
    onSuccess: async (projectId: string) => {
      toast.success('Successfully created the project', {position: 'bottom-right'})
      form.setValue('name', '')
      form.setValue('repoURL', '')

     //  form.reset()

     await queryClient.refetchQueries({queryKey: ['getProjects', userId]})
     setProjectId(projectId)
     router.push('/dashboard')
    },

    onError: (err) => {
       console.error(err)
       if(err instanceof AxiosError) {
        toast.error(err.response?.data.msg || 'Something went wrong', {position: 'bottom-right'})
       } else toast.error('Something went wrong!!!')
    }
  })

  async function onSubmit(data: Input) {

       toast.info('Project creation might take some time due to Gemini rate limits.Consider trying with a small codebase.', {duration: 6000})
    
       // use credits from session object checkCredits does not need to return credits
       // there is some bug when you fetch credits server side it gives the updated value but when you fetch client side it does not 
       const { fileCount, userCredits } = await checkCredits(data.repoURL, data.githubToken)
       setCreditInfo({fileCount, userCredits}) 

       if(userCredits > fileCount) { 
         await createProject({data, fileCount})
        //  queryClient.refetchQueries({ queryKey: ['getProjects']})
       } else toast.error(`You need to buy ${fileCount - userCredits} more credits`, {position: 'bottom-right'})
   }

  return <div className="grow flex-center gap-3">
        <Image src={'/github.svg'} alt="github" width={300} height={300} className="mb:hidden"/>
        <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5, ease: 'easeInOut'}}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Link your Github Repository</CardTitle>
                    <CardDescription>Enter the URL of your Github Repository to link it to GitChat</CardDescription>
                </CardHeader>
                  <CardContent>
                     <Form {...form}>
                        <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
                            
                        <FormField
                          control={form.control}
                          name='name'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel>Project name</FormLabel>
                              <FormControl>
                                   <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                      <FileText />
                                      <input className='outline-none bg-transparent grow' placeholder='Enter your project name' {...field}/>                                      
                                   </div>
                              </FormControl>
                              <FormMessage />
                             </FormItem>
                          )}
                        />

                    <FormField
                          control={form.control}
                          name='repoURL'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel>Repo URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                   <LuGithub className="size-5"/>
                                   <input className='outline-none bg-transparent grow' placeholder='Enter your repo URL' {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage />
                             </FormItem>
                          )}
                        />

                    <FormField
                          control={form.control}
                          name='githubToken'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel>Github Token</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                  <Key />
                                  <input className='outline-none bg-transparent grow' placeholder='optional (for private repositories)' {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage />
                             </FormItem>
                          )}
                        />

                       {/* use credits from session object don't use state for it */}
                      {(creditInfo.fileCount > 0 || creditInfo.userCredits > 0) && (
                          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.4, ease: 'easeInOut'}}
                          className="border p-3 rounded-md bg-orange-100 dark:bg-orange-200/5 border-yellow-500">
                          <div className="flex gap-3 text-yellow-800">
                             <Info />
                             <p>You will be charged <strong>{creditInfo.fileCount}</strong> credits for this project</p>
                          </div>
                          <p className="text-blue-600 ml-9">You currently have <strong>{creditInfo.userCredits}</strong> in your account</p>
                       </motion.div>
                      )}

                       <button type="submit" disabled={form.formState.isSubmitting}
                        className="bg-blue-700 mx-auto group px-3 py-2 rounded-lg font-semibold text-white flex-center gap-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75">
                          {form.formState.isSubmitting && <Loader className="animate-spin"/>}
                           {form.formState.isSubmitting ? 'Please wait...' : <>
                             Create project <ArrowRight className="group-hover:translate-x-2 duration-200"/>
                           </>}                   
                       </button>
                      
                     </form>
                     </Form>
                  </CardContent>
            </Card>
        </motion.div>
  </div>
}