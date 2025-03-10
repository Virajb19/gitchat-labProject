'use client'

import { Commit } from "@prisma/client"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useProject } from "~/hooks/useProject"
import { Skeleton } from "./ui/skeleton"
import { formatDistanceToNow} from 'date-fns'
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { motion } from 'framer-motion'
import { toast } from "sonner"
import { useMemo } from "react"
import { useSearchQuery } from "~/lib/store"

export default function CommitLogComponent() {

  const { projectId, project } = useProject()

  let { query } = useSearchQuery()

  const {data: commits, isLoading, isError, isRefetching, isFetching } = useQuery<Commit[]>({
    queryKey: ['getCommits', projectId],
    queryFn: async () => {
         try {
            const { data : { commits }} = await axios.get(`/api/commits/${projectId}`) 
            return commits
         } catch(err) {
             throw new Error('Error fetching commits')
         }
    },
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 60 * 1000
  })

  // toast.success(isFetching ? '1' : '0')

  const filteredCommits = useMemo(() => {
      query = query.toLowerCase().trim()
      const words = query.split(' ')
      return commits?.filter(commit => {
          const matchesMessage = words.every(word => commit.message.toLowerCase().includes(word))
          const matchesAuthorName = commit.authorName.toLowerCase().includes(query)
          return matchesMessage || matchesAuthorName
      }) ?? []
  }, [commits,query])

  if(isError) return <div className="flex-center grow mt-3 p-1 text-2xl">
          No commits found. Refresh!!!
    </div>

  const showSkeletons = isLoading || isRefetching

  if(showSkeletons || !commits) return <div className="flex flex-col grow gap-2 mt-3 p-1">
         {Array.from({ length: 15}).map((_,i) => {
               return <div key={i} className="flex gap-7 p-2 m-1 grow">
                       <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex flex-col grow">
                        <Skeleton className="h-4" />
                        <Skeleton className="h-4" />
                        <Skeleton className="h-[125px] rounded-xl" />
                      </div>
                 </div>
            })}
  </div>

  if(commits.length === 0) return <div className="flex-center border text-3xl sm:text-7xl font-bold tracking-wide rounded-lg border-blue-700 grow">
        Select a Project
  </div>

  return <ul className="flex flex-col grow gap-2 mt-3 p-1">
        {filteredCommits.map((commit, i) => {
          return <motion.li initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.3, ease: 'easeInOut', delay: i * 0.1}}
                key={commit.id} className="flex items-start gap-4 p-1 justify-between">
                    <div className="flex items-start ml-2 mt-1">
                      <Image src={commit.authorAvatar} alt="userAvatar" width={50} height={50} className="rounded-full"/>     
                    </div>
                    <div className="flex flex-col gap-2 w-[70vw] bg-white dark:bg-card p-2 rounded-lg border border-accent overflow-scroll">
                      <div className="flex flex-wrap items-center justify-between">
                          <Link target="_blank"  rel="noopener noreferrer" href={`${project?.repoURL}/commits/${commit.hash}`} className="flex gap-3 items-center"> 
                                <span className="font-semibold text-lg underline">{commit.authorName}</span>
                                <span className="inline-flex items-center text-sm text-gray-500 hover:underline">committed</span>
                                <ExternalLink className="ml-1 size-4"/>
                              </Link>
                            <span className="">{formatDistanceToNow(new Date(commit.date), {addSuffix: true}).replace('about', '')}</span>
                      </div>
                          <p className="break-words whitespace-normal font-bold text-lg">{commit.message}</p>
                          <p className="flex flex-col gap-2 text-gray-500 dark:text-gray-400">
                            {commit.summary.split('*').filter(point => !(point.trim() === '')).map((point,i) => {
                              return <p key={i}>* {point.trim()}</p>
                            })}
                          </p> 
                    </div>
                </motion.li>
           })}       
     </ul>
  }


