'use client'

import { Issue, Meeting } from "@prisma/client";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import axios from "axios";
import MeetingCard from "~/components/MeetingCard";
import { useProject } from "~/hooks/useProject";
import { motion } from 'framer-motion'
import { Check, Loader2} from 'lucide-react'
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";
import { useSearchQuery } from "~/lib/store";
import { useCallback, useMemo, useState } from "react";
import MeetingDeleteButton from "~/components/MeetingDeleteButton";

type meeting = ( Meeting & { issues: Pick<Issue, "id"> []})

export default function MeetingPage() {

  const { projectId } = useProject()
  const { query } = useSearchQuery()

  const isMutating = useIsMutating({ mutationKey: ['deleteMeeting']})

  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

  const handlePendingChange = useCallback((meetingId: string, isPending: boolean) => {
        setIsDeleting(prev => ({...prev, [meetingId]: isPending}))
  }, [setIsDeleting])

  const { data: meetings, isLoading, isError} = useQuery<meeting[]>({
    queryKey: ['getMeetings', projectId],
    queryFn: async () => {
       try {
           const { data: { meetings }} = await axios.get(`/api/meetings/${projectId}`)
           return meetings
       } catch(err) {
          console.error(err)
          throw new Error('Error fetching meetings')
       }
    },
    staleTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  })

  const filteredMeetings = useMemo(() => {
     return meetings?.filter(meeting => meeting.name.toLowerCase().includes(query)) ?? []
  }, [meetings,query])

  if(isError) return <div className="flex flex-col grow mt-3 p-1">
     <MeetingCard />
     <span className="self-center my-auto text-2xl">No meetings found. Refresh!!!</span> 
</div>


  // when isLoading is true data is undefined
  if(isLoading || !meetings) return <div className="flex flex-col gap-2 grow p-2">
      <MeetingCard />
      <h3 className="font-bold underline text-3xl">All meetings</h3>
         {Array.from({length: 5}).map((_,i) => {
           return <Skeleton key={i} className="h-[10vh]"/>
      })}          
  </div>

  if(isError || meetings?.length === 0) return <div className="flex flex-col grow mt-3 p-1">
       <MeetingCard />
      <span className="self-center my-auto text-2xl">No meetings found. Refresh!!!</span> 
  </div>

  return <div className="w-full flex flex-col p-3 gap-2 mb:p-0">
          <MeetingCard />
          <h3 className="text-3xl underline font-bold">All Meetings</h3>
            <ul className="flex flex-col gap-2 p-1 grow">
               {filteredMeetings.map((meeting, i) => {
                  return <motion.li key={meeting.id} initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.3, ease: 'easeInOut', delay: i * 0.1}}
                    className="flex mb:flex-col mb:items-start items-center justify-between gap-2 p-2 rounded-lg border bg-white dark:bg-card">
                       <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-3">
                             <h4 className="text-lg text-wrap font-bold truncate">{meeting.name}</h4>
                               <span className={twMerge("flex items-center px-2 py-1 rounded-full text-white gap-1 text-sm font-semibold", meeting.status === 'PROCESSING' ? 'bg-amber-500' : 'bg-green-700')}>
                                   {meeting.status === 'PROCESSING' ? (
                                     <>
                                         <Loader2 className="animate-spin size-5"/> Processing...
                                     </>
                                   ) : (
                                     <>
                                         <Check /> Processed
                                     </>
                                   )}
                               </span>
                           </div>
                           <div className="flex items-center text-gray-500 gap-2">
                               <span className="whitespace-nowrap font-semibold">{new Date(meeting.createdAt).toLocaleDateString()}</span>
                               <p className="font-semibold">
                                 <span className="text-blue-500">{meeting.issues.length}</span> issues
                                </p>
                           </div>
                       </div>
                      <div className="flex items-center justify-between gap-2 mb:w-full">
                         {meeting.status === 'PROCESSED' && !isDeleting[meeting.id] && (
                             <Link href={`/meetings/${meeting.id}`} className="font-bold p-2 rounded-md bg-blue-800 text-white">
                               View meeting
                           </Link>
                         )}
                         {meeting.status === 'PROCESSED' && <MeetingDeleteButton meetingId={meeting.id} onPendingChange={handlePendingChange}/>}
                      </div>
                  </motion.li>
               })}
            </ul>
  </div>
}