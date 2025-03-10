import { twMerge } from "tailwind-merge";
import { useProject } from "~/hooks/useProject";
import { motion } from 'framer-motion'
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useEffect, useRef } from "react";

export default function Projects({ isCollapsed }: { isCollapsed: boolean }) {

  const { projects, setProjectId, projectId, isLoading } = useProject()

  const projectRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
      if(projectRefs) {
        const selectedProjectRef = projectRefs.current.find((ref,i) => projects && projects[i]?.id === projectId)
        if(selectedProjectRef) {
            selectedProjectRef.scrollIntoView({ behavior: 'smooth', block: 'center'})
        }
      }
  }, [projects, projectId])

  // useEffect(() => {
  //    const selectedProject = document.querySelector('.projects.bg-blue-500')
  //    if(selectedProject) selectedProject.scrollIntoView({ behavior: 'smooth', block: 'center'})
  // }, [projectId])

  if (isLoading || !projects) return <div className="flex flex-col gap-2 p-2 max-h-[45vh] border-4 border-blue-600 rounded-xl">
    {Array.from({ length: 3 }).map((_, i) => {
      return <Skeleton key={i} className="w-full h-12" />
    })}
  </div>

  if(projects.length === 0 && !isCollapsed) return <div className="flex-center gap-2 p-2 h-40 border-4 border-blue-600 rounded-xl">
        <span className="text-2xl font-bold">Create a project</span>
</div>

  return <div className={twMerge("flex flex-col gap-2 p-2 max-h-[40vh] min-h-[20vh] border-4 border-blue-600 rounded-xl overflow-y-scroll", isCollapsed && "border-none p-1")}>
    {!isCollapsed ? (
      <>
        {projects.map((project, i) => {
          return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1}} transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.1 }} key={i} ref={el => {projectRefs.current[i] = el}}
            onClick={() => setProjectId(project.id)}
            className={twMerge("projects flex items-center gap-2 p-2 rounded-lg cursor-pointer border border-blue-900/2", project.id === projectId ? "bg-blue-600/15 border-blue-900" : "hover:bg-blue-600/15 duration-200")}>
            <span className={twMerge("px-3 py-1 border rounded-sm bg-accent", project.id === projectId && "bg-blue-500 transition-colors")}>{project.name[0]}</span>
            <p className={twMerge("truncate text-base", project.id === projectId && "text-blue-600")}>{project.name}</p>
          </motion.div>
        })}
      </>
    ) : (
      <>
        {projects?.map((project, i) => {
          return <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span onClick={() => setProjectId(project.id)}
                  className={twMerge("px-3 py-1 border rounded-sm bg-accent cursor-pointer text-xl", project.id === projectId && "bg-blue-500 transition-colors")}>{project.name[0]}</span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p>{project.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        })}
      </>
    )}
  </div>
}