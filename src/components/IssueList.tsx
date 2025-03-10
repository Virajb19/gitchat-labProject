'use client'

import { Issue } from "@prisma/client";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { useMemo, useState } from "react";
import { useSearchQuery } from "~/lib/store";
import { motion } from 'framer-motion'

export default function IssueList({ issues }: { issues: Issue[]}) {

    let { query } = useSearchQuery()

    const filteredIssues = useMemo(() => {
        query = query.toLowerCase().trim()
        const words = query.split(' ')
        return issues.filter(issue => {
           const matchesGist = words.every(word => issue.gist.toLowerCase().includes(word))
           const matchesHeadline = words.every(word => issue.headline.toLowerCase().includes(word))
           return matchesGist || matchesHeadline
       })
    }, [issues,query])

  return  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 gap-3 grow p-3 lg:w-[75vw]">
         {filteredIssues.map((issue, i) => {
             return <IssueCard key={issue.id} issue={issue} idx={i}/>
      })}
</div>
}

function IssueCard({ issue, idx }: { issue: Issue, idx: number}) {

    const [open, setOpen] = useState(false)

  return <>
       <Dialog open={open} onOpenChange={setOpen}>
             <DialogContent className="font-semibold">
                  <DialogHeader>
                      <DialogTitle>{issue.gist}</DialogTitle>
                      <DialogDescription className="text-lg">{new Date(issue.createdAt).toLocaleDateString()}</DialogDescription>
                      <p className="text-gray-400">{issue.headline}</p>
                      <blockquote className="mt-3 border-l-2 border-gray-300 bg-secondary p-3">
                         <span className="">
                             {issue.start} - {issue.end}
                         </span>
                         <p className="text-base italic leading-relaxed text-start">
                            {issue.summary}
                         </p>
                      </blockquote>
                  </DialogHeader>
             </DialogContent>
       </Dialog>
        <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.3, delay: 0.1 * idx, type: 'spring', bounce: 0.5}}
        className="flex flex-col items-start justify-between gap-2 p-3 bg-card border rounded-lg font-semibold">
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-2xl text-start border-b-2 border-gray-600">{issue.gist}</h3>
                    <p className="text-base text-gray-500">{issue.headline}</p>
                </div>
                <button onClick={() => setOpen(true)} className="p-2 rounded-lg bg-blue-600 text-white hover:opacity-80 duration-200">
                    Details
                </button>
        </motion.div>
  </>
}