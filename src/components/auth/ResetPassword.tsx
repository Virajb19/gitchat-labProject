'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { resetPasswordSchema } from '~/lib/zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Key } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'nextjs-toploader/app'
import { toast } from 'sonner'

type Input = z.infer<typeof resetPasswordSchema>

export default function ResetPassword({token}: {token: string}) {

     const router = useRouter()

     const form = useForm<Input>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: ''}
     })

     const {mutateAsync: resetPassword, isPending} = useMutation({
        mutationFn: async (data: Input) => {
            const res = await axios.post(`/api/reset-password/${token}`, data)
            return res.data
        },
        onSuccess: () => {
            form.reset()
            router.push('/signin')
            toast.success('Password changed')
        },
        onError: (err) => {
           console.error(err)
           if(err instanceof AxiosError) toast.error(err.response?.data.msg || 'Something went wrong!')
        }
     })

     async function onSubmit(data: Input) {
        // if(data.confirmPassword !== data.newPassword) return
        await resetPassword(data)
     }

  return <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{duration: 0.7, ease: 'easeInOut', type: 'spring', damping: '10'}} 
     className="w-[90%] lg:w-1/3 sm:w-[70%] max-w-3xl z-30">
            <Card>
                <CardHeader className='text-center'>
                     <CardTitle className='text-3xl sm:text-4xl'>Reset Password</CardTitle>
                     <CardDescription className='sm:text-lg font-semibold'>Enter a new Password</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form className='space-y-3' onSubmit={form.handleSubmit(onSubmit)}>
                             <FormField
                                control={form.control}
                                name='newPassword'
                                render={({ field }) => (
                                    <FormItem className='flex flex-col gap-1'>
                                        <FormLabel className='text-xl font-semibold'>New Password</FormLabel>
                                        <FormControl>
                                            <div  className='flex items-center px-2 py-1 gap-2 overflow-hidden border rounded-md focus:border-transparent focus-within:ring-[3px] focus-within:ring-blue-600 duration-200'>
                                                <span className='p-2'><Key className='text-blue-500'/></span>
                                               <input type='password' className='dark:bg-black grow placeholder:text-base sm:placeholder:text-lg placeholder:font-semibold focus:outline-none' placeholder='password' {...field}/>                                     
                                            </div>
                                        </FormControl>
                                        <FormMessage className='font-semibold text-red-600'/>
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name='confirmPassword'
                                render={({ field }) => (
                                    <FormItem className='flex flex-col gap-1'>
                                        <FormLabel className='text-xl font-semibold'>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div  className='flex items-center px-2 py-1 gap-2 overflow-hidden border rounded-md focus:border-transparent focus-within:ring-[3px] focus-within:ring-blue-600 duration-200'>
                                                <span className='p-2'><Key className='text-blue-500'/></span>
                                               <input type='password' className='dark:bg-black grow placeholder:text-base sm:placeholder:text-lg placeholder:font-semibold focus:outline-none' placeholder='password' {...field}/>                                     
                                            </div>
                                        </FormControl>
                                        <FormMessage className='font-semibold text-red-500'/>
                                    </FormItem>
                                )}
                                />

                                <button type='submit' disabled={form.formState.isSubmitting} className='flex-center group gap-2 w-full bg-blue-700 hover:bg-blue-600 duration-200 rounded-lg py-2 px-5 text-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed'>
                                   {form.formState.isSubmitting ? (
                                        <>
                                        <div className='size-5 border-[3px] border-white/50 border-t-white rounded-full animate-spin'/> Creating...
                                        </>
                                    ) : (
                                      <>
                                          Set New Password
                                      </>
                                    )}
                                </button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
  </motion.div>
}