'use client'

import { useProject } from "~/hooks/useProject"
import { ExternalLink, ArrowUp} from 'lucide-react'
import Link from "next/link"
import CommitLogComponent from "~/components/commit-log"
import AskQuestionCard from "~/components/ask-question-card"
import ArchiveButton from "~/components/Archive-button"
import { LuGithub } from "react-icons/lu";
import PollCommitsButton from "~/components/PollCommitsButton"
import MeetingCard from "~/components/MeetingCard"

export default function DashBoard() {

  const { project } = useProject()

  return <div id="dashboard" className="w-full flex flex-col gap-1 p-3 mb:p-0">
    <div className="flex flex-wrap gap-3 p-1 items-center justify-between">
      <div className="flex justify-between gap-3 items-center bg-blue-700 rounded-sm px-5 py-3 text-white/80">
        <LuGithub className="size-6" />
        <p className="flex flex-wrap items-center gap-2 font-semibold">This project is linked to
          <Link target="_blank" rel="noopener noreferrer" href={project?.repoURL ?? '#'} className="text-sm text-white/80 hover:underline inline-flex items-center font-light gap-1">
          {project?.repoURL || 'No repository link'}
          <ExternalLink className="size-4"/>
          </Link>
        </p>
      </div>

         <div className="flex gap-2 items-center">
            <PollCommitsButton />
            <ArchiveButton />
         </div>
    </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 mt-1">
          <AskQuestionCard />
          <MeetingCard />
      </div>

       <CommitLogComponent />
       
       {/* <button onClick={() => {
          const dashboard = document.getElementById('dashboard')
          if(dashboard) dashboard.scrollTo({ behavior: 'smooth', top: 0})
       }} className="flex items-center gap-2 group p-2 rounded-md mx-auto bg-blue-600 font-bold">
           <ArrowUp className="group-hover:-translate-y-1 duration-200"/> Return to top
       </button> */}
  </div>
}