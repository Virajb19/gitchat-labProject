import SearchInput from "./SearchInput";
import { motion } from 'framer-motion'
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function SearchInputMobile({onClose}: { onClose: () => void}) {

    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if(modalRef.current && !modalRef.current.contains(e.target as Node)) {
              onClose()
            }
          }
          document.addEventListener('mousedown', handleClickOutside)

          const input = document.getElementById('search') as HTMLInputElement
          if(input) input.focus()
        
          return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

  return <div className="sm:hidden absolute inset-0 flex-center backdrop-blur-sm z-[99] will-change-contents">
            <motion.div ref={modalRef} className="flex flex-col gap-2 w-3/4 p-4 rounded-lg bg-card" initial={{scale: 0.8, opacity: 1}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.8, opacity: 0}} transition={{duration: 0.4, type: 'spring', bounce: 0.5}}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Search questions...</h3>
                <span onClick={() => onClose()} className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 duration-200 cursor-pointer">
                  <X className="size-5"/>
                </span>
            </div>
            <SearchInput />
    </motion.div>
</div>
}