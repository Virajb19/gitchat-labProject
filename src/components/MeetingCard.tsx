import { Presentation, Upload } from 'lucide-react'
import { useState } from 'react'
import { useDropzone } from "react-dropzone"
import { toast } from 'sonner'
import { uploadFile } from '~/lib/appwrite'
import { AnimatedCircularProgressBar } from "~/components/ui/animated-circular-progress-bar";
import { useRouter } from 'nextjs-toploader/app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useProject } from '~/hooks/useProject'
import { usePathname } from 'next/navigation'
import { z } from 'zod'
import { createMeetingSchema } from '~/lib/zod'
import { useSession } from 'next-auth/react'

export default function MeetingCard() {

    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const { projectId } = useProject()

    const {data: session, status, update} = useSession()
    const credits = session?.user.credits

   //  toast.success(credits)

    const pathname = usePathname()
    const queryClient = useQueryClient()

    const router = useRouter()

    const processMeeting = useMutation({
      mutationKey:  ['processMeeting'],
      mutationFn: async ({ meetingId, fileUrl }: { meetingId: string, fileUrl: string }) => {
          const res = await axios.post( `/api/meeting/${meetingId}`, { fileUrl, projectId })
          return res.data
      },
      onError: (err) => {
         console.error(err)
         toast.error('Error processing meeting')
      },
      onSettled: () => queryClient.refetchQueries({ queryKey: ['getMeetings', projectId]}),
    })

    const {mutateAsync: createMeeting, isPending} = useMutation({
       mutationFn: async (data: z.infer<typeof createMeetingSchema>) => {
         const res = await axios.post(`/api/meetings/${projectId}`, data)
         return res.data.meetingId
      },
      onError: (err) => {
        console.error(err)
        if(err instanceof AxiosError) toast.error(err.response?.data.msg || 'Error creating meeting')
      },
      onSettled: () => {
        queryClient.refetchQueries({ queryKey: ['getMeetings', projectId]})
      }
    })

    const { getRootProps, getInputProps} = useDropzone({
       accept: {
         'audio/*': ['.mp3', '.wav', '.m4a'],
       },
       multiple: false,
       maxFiles: 1,
       maxSize: 50_000_000,
       onDrop: async (files: File[]) => {
            try {
               const file = files[0]

               if(!file) return

               if(file && file.size > 50 * 1024 * 1024) {
                  toast.error('Please upload a file less than 50MB')
                  return
               }
               
               if(credits && credits < 50) {
                  toast.error('Insufficient credits!. You need 50 credits to create a meeting')
                  return
               }

               toast.info('You will be charged 50 credits per meeting', { position: 'bottom-right'})

               setUploading(true)
               const { fileKey, fileUrl} = await uploadFile(file, setProgress)
               await createMeeting({name: file.name, url: fileUrl}, {
                  onSuccess: (meetingId: string) => {
                     toast.success('Uploaded')
                     if(pathname === '/dashboard') router.push('/meetings')
                     processMeeting.mutate({meetingId, fileUrl})
                  },
               })
            } catch(err) {
                console.error(err)
                toast.error('File upload failed. Try again!!')
            } finally {
                setUploading(false)
                setProgress(0)
            } 
       }
    })

  return <div className="col-span-2 bg-card rounded-lg flex flex-col items-center justify-between gap-2 py-7 border">
         {uploading ? (
            <>
            <AnimatedCircularProgressBar value={progress} min={0} max={100} className='size-28' gaugePrimaryColor='rgb(59, 130, 246)' gaugeSecondaryColor='rgba(59, 130, 246, 0.1)'/>
            <p className='text-gray-500 font-semibold animate-pulse'>Uploading your meeting</p>
          </>
         ) : (
            <>
                <Presentation className='size-10 animate-bounce'/>
                <h4 className='font-bold text-lg'>Create a new Meeting</h4>
                <p className='text-center text-base font-semibold text-gray-400'>Analyse your meeting with GitChat <br /> Powered by AI</p>
            </>
         )}
         <button disabled={uploading} className='flex-center group py-2 px-4 text-white rounded-lg bg-blue-700 font-semibold gap-3 disabled:cursor-not-allowed disabled:opacity-70' {...getRootProps()}>
            <Upload className='size-5 group-hover:-translate-y-1 duration-200'/> Upload meeting <input className='hidden' {...getInputProps()}/>
         </button>
  </div>
}