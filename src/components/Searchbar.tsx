'use client'

import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import UserAccountNav from "./UserAccountNav";
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X ,Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from "react";
import { useProject } from "~/hooks/useProject";
import { twMerge } from "tailwind-merge";
import { useRouter } from 'nextjs-toploader/app';
import { useMediaQuery } from 'usehooks-ts'
import SearchInput from "./SearchInput";
import SearchInputMobile from "./SearchInputMobile";
import { getEmbeddings } from "~/server/actions";
import { toast } from "sonner";

export default function Searchbar() {

const [isOpen, setIsOpen] = useState(false)
const { projects , setProjectId, projectId} = useProject()

const router = useRouter()
const sidebarRef = useRef<HTMLDivElement>(null)

const [showModal, setShowModal] = useState(false)
const isLargeScreen = useMediaQuery('(min-width: 640px)')

useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if(sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)

  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  return <motion.div initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{duration: 0.8, type: 'spring', damping: 15, stiffness: 200, bounce: 0.3}}  className="dark:bg-transparent border-[3px] border-transparent dark:border-gray-800 bg-muted flex px-2 py-1 items-center justify-between rounded-lg">
       <div className="flex items-center gap-3">
          <Image src={'/favicon.ico'} alt='logo' width={40} height={40} />
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-foreground/60 hover:dark:bg-[#191919] hover:bg-gray-100 border p-2.5 rounded-2xl duration-200">
            {isOpen ? <X /> : <Menu />}
          </button>

           {isLargeScreen && <SearchInput />}
          <Search onClick={() => setShowModal(true)} className="sm:hidden cursor-pointer"/>
              
       </div>

      <div className="flex items-center gap-3 sm:mr-4">
         <ThemeToggle />
         <UserAccountNav />
      </div>

    <AnimatePresence>
        {isOpen && (
             <motion.div ref={sidebarRef} initial={{x: '-100%'}} animate={{x: 0}} exit={{x: '-100%'}} transition={{duration: 0.4, ease: 'circInOut'}}
             className="lg:hidden absolute left-0 right-16 bottom-16 max-w-[500px] top-20 z-[200] rounded-tr-xl border-t-2 border-r-2 border-gray-700 bg-background flex flex-col gap-3 p-4">
                    <button onClick={() => {
                        router.push('/create')
                        setIsOpen(false)
                    }} className="flex-center gap-2 py-2 border-2 border-dashed border-zinc-600 rounded-lg hover:border-zinc-400 duration-200"><Plus />New</button>
                    
                    <div className="flex flex-col gap-3 max-h-[calc(90vh-7rem)] overflow-y-scroll">
                        {projects?.map((project, i) => {
                        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: i * 0.3, ease: 'easeOut' }} key={i} 
                          onClick={() => {
                            setProjectId(project.id)
                            // setIsOpen(false)
                          }}
                          className={twMerge("flex items-center gap-2 p-2 rounded-lg cursor-pointer border border-blue-900/2", project.id === projectId ? "bg-blue-600/15 border-blue-900" : "hover:bg-blue-600/15 duration-200")}>
                          <span className={twMerge("px-3 py-1 border rounded-sm bg-accent", project.id === projectId && "bg-blue-500 transition-colors")}>{project.name[0]}</span>
                          <p className={twMerge("truncate text-base", project.id === projectId && "text-blue-600")}>{project.name}</p>
                        </motion.div>
                      })}
                      {/* <div className="bg-red-900 h-[900px] shrink-0"></div> */}
                </div>
            </motion.div>
        )}

        {showModal && (
           <SearchInputMobile onClose={() => setShowModal(false)}/>
        )}
      </AnimatePresence>

      <button onClick={async () => {
        const embeddings = await getEmbeddings(projectId)
        toast.success(embeddings)
        }} className="absolute top-1/2 left-1/2 z-50 rounded-lg p-4 bg-red-900">
                Click
            </button>
  </motion.div>
}
