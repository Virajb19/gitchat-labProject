'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { forgotPasswordSchema } from '~/lib/zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Send } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { useState } from 'react'

type Input = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {

    const [emailSent, setEmailSent] = useState(false)

    const form = useForm<Input>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: ''}
      })

      const forgotPassword = useMutation({
        mutationFn: async (data: Input) => {
            const res = await axios.post('/api/forgot-password', data)
            return res.data
        },
        onError: (err) => {
            console.error(err)
            toast.error('Error sending email')
        }
      })

    async function onSubmit(data: Input) {
      await forgotPassword.mutateAsync(data, {
        onSuccess: () => {
            setEmailSent(true)
            toast.success(`An email is sent to ${data.email}`)
        },
      })
    }

  return <div className="w-full min-h-screen flex-center">
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{duration: 0.7, ease: 'easeInOut', type: 'spring', damping: '10'}} 
         className="w-[90%] lg:w-1/3 sm:w-[70%] max-w-3xl z-30">
           <Card className='shadow-lg shadow-blue-600'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-3xl sm:text-4xl'>Reset Password</CardTitle>
                    <CardDescription className='sm:text-lg font-semibold'>
                        {emailSent ? 'Check your email for reset instructions' : 'Please enter your email'}
                      </CardDescription>   
                </CardHeader>
                <CardContent>
                      {emailSent ? (
                        <div className='flex flex-col gap-3 items-center'>
                              <span className='p-4 rounded-full bg-blue-600'><Mail className='size-8'/></span>
                              <p className='text-center font-semibold text-lg'>
                                You will shortly receive a password reset link to {form.getValues('email')}
                              </p>
                        </div>
                      ) : (
                        <Form {...form}>
                          <form className='space-y-3' onSubmit={form.handleSubmit(onSubmit)}>
                                <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem className='flex flex-col gap-1'>
                                        <FormLabel className='text-xl font-semibold'>Email</FormLabel>
                                        <FormControl>
                                            <div  className='flex items-center px-2 py-1 gap-2 overflow-hidden border rounded-md focus:border-transparent focus-within:ring-[3px] focus-within:ring-blue-600 duration-200'>
                                                <span className='p-2'><Mail className='text-blue-500'/></span>
                                               <input className='dark:bg-black grow placeholder:text-lg placeholder:font-semibold focus:outline-none' placeholder='name@gmail.com' {...field}/>                                     
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />

                                <button disabled={form.formState.isSubmitting} type='submit' className='flex-center group gap-2 w-full bg-blue-700 hover:bg-blue-600 duration-200 rounded-lg py-2 px-5 text-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed'>
                                    {form.formState.isSubmitting ? (
                                        <>
                                        <div className='size-5 border-[3px] border-white/50 border-t-white rounded-full animate-spin'/> Creating...
                                        </>
                                    ) : (
                                      <>
                                         <Send className='group-hover:translate-x-1 group-hover:-translate-y-1 duration-300'/> Send Reset Link
                                      </>
                                    )}
                                </button>
                          </form>
                      </Form>
                      )}
                </CardContent>
           </Card>
        </motion.div>
  </div>
}