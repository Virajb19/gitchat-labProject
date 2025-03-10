'use client'

import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { askQuestionSchema } from "~/lib/zod";
import { z } from "zod";
import { Loader2, Sparkles, Download, RefreshCw } from 'lucide-react';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form'
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { askQuestion, saveQuestion } from "~/server/actions";
import { useProject } from "~/hooks/useProject";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import MDEditor from '@uiw/react-md-editor'
import FileReference from "./file-reference";
import { useQueryClient } from "@tanstack/react-query"

type Input = z.infer<typeof askQuestionSchema>

export default function AskQuestionCard() {

   const { projectId } = useProject()
  const [open, setOpen] = useState(false)
  const [fileReferences, setFileReferences] = useState<{filename: string, sourceCode: string, summary: string}[]>([])
  const [answer,setAnswer] = useState('')
  const [loading,setLoading] = useState(false)

  const queryClient = useQueryClient()

  const form = useForm<Input>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: { question: ''}
  })

  async function OnSubmit(data: Input) {
     setAnswer('')
    try {
            const { output, fileReferences} = await askQuestion(data.question, projectId)
            setOpen(true)
            setFileReferences(fileReferences)

            for await (const text of readStreamableValue(output)) {
               if(text) setAnswer(ans => ans += text)
         }
      } catch (err) {
         setOpen(false)
         toast.error('Something went wrong. Try again!!!')
    } 
  }

   const handleClick = useCallback(async () => {

      const question = form.getValues('question')
       
      setLoading(true)
      const res = await saveQuestion(question,answer,projectId,fileReferences)
      setLoading(false)

      if(res.success) {
         toast.success('Question saved!', { position: 'bottom-left'})
         setOpen(false)
         queryClient.refetchQueries({queryKey: ['getQuestions']})
         form.setValue('question', '')
      }
      else toast.error(res.msg || 'Failed to save the answer. Try again!!!', { position: 'bottom-left'})
 }, [answer,fileReferences,form,projectId,queryClient]) 

   useEffect(() => {
   //   const button = document.getElementById('button') as HTMLButtonElement
     const handleKeyDown = (e: KeyboardEvent) => {
       if(e.ctrlKey && e.key === 'Enter') {
          e.preventDefault()
          buttonRef.current?.click()
         //  button.click()
       }
     }

     document.addEventListener('keydown', handleKeyDown)

     return () => document.removeEventListener('keydown', handleKeyDown)
   }, [])

   useEffect(() => {
     const editor = document.getElementById('editor')
     if(editor) {
        editor.scrollTo({
          top: editor.scrollHeight,
          behavior: 'smooth'
        })
     }
   }, [answer])

   const buttonRef = useRef<HTMLButtonElement>(null)

  return <>
    <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="sm:max-w-[70vw] z-[1000] my-1">
                   <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                       <Image src={'/favicon.ico'} alt='logo' width={40} height={40} />
                       <button onClick={handleClick} disabled={answer === '' || loading} className="bg-[#2657df] px-3 py-2 rounded-md flex-center gap-2 disabled:cursor-not-allowed disabled:opacity-75">
                        {loading ? <Loader2 className="size-5 animate-spin"/> : <Download className="size-5"/>} Save Answer
                        </button>
                      </DialogTitle>
                   </DialogHeader>
                     <div id="editor" className="max-h-[30vh] max-w-[70vw] mb:max-w-[90vw] overflow-scroll">
                       <MDEditor.Markdown source={answer}/>
                     </div>
                     <FileReference files={fileReferences}/>
                    <button onClick={() => setOpen(false)} className="bg-[#3760cf] rounded-sm py-2 text-lg font-bold hover:opacity-75 duration-100">Close</button>
              </DialogContent>
        </Dialog>
    <div className="flex-center col-span-3">
         <Card className="w-full relative">
            <CardHeader>
                <CardTitle className="text-lg">Ask a Question</CardTitle>
                <CardDescription>AI has the knowledge of the codebase</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...form}>
               <form onSubmit={form.handleSubmit(OnSubmit)}>

                     <FormField
                          control={form.control}
                          name='question'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormMessage className="text-base text-red-500"/>
                              <FormControl>
                                <textarea {...field} className="input-style resize-none min-h-20" placeholder="Which file should I edit to change the Homepage?"/>
                              </FormControl>
                             </FormItem>
                          )}
                        />

                     <button ref={buttonRef} type="submit" className="flex-center gap-2 bg-blue-700 hover:bg-blue-800 transition-colors duration-200 px-4 py-2 rounded-2xl mt-7 text-lg text-white disabled:cursor-not-allowed disabled:opacity-75" 
                        disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                           <>
                              <RefreshCw className="animate-spin"/> Asking...
                           </>
                        ) : (
                           <>
                             <Sparkles className="fill-amber-500 text-amber-500"/> Ask AI !
                           </>
                        )}
                     </button>
                 </form>
               </Form>
            </CardContent>
         </Card>
  </div>
  </>
}