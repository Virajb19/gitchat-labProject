import { Trash, Loader2 } from 'lucide-react'
import { useProject } from "~/hooks/useProject";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from "axios";
import { toast } from 'sonner';

export default function ArchiveButton() {

    const { projectId, setProjectId, projects } = useProject()

   const {mutate: archiveProject, isPending} = useMutation({
      mutationFn: async (projectId: string) => {
         const res = await axios.delete(`/api/project/${projectId}`)
         return res.data
      },
      onSuccess: () => {
         toast.success('Archived')
         // const projects = queryClient.getQueryData<Project[]>(['getProjects'])
         const nextProject = projects?.find(p => p.id !== projectId)
         if(projects?.length) {
            setProjectId(nextProject?.id ?? '')
         }
      },
      onError: (err) => {
         console.error(err)
         if(err instanceof AxiosError) {
            toast.error(err.response?.data.msg || 'Something went wrong!')
         }
      },
      onSettled: () => {
         queryClient.refetchQueries({queryKey: ['getProjects']})
         queryClient.refetchQueries({queryKey: ['getCommits']})
      }
   })

    const queryClient = useQueryClient()

  return <button onClick={() => {
              const confirm = window.confirm('Are you sure you want to archive this project?')
              if(confirm) archiveProject(projectId)
          }} 
          disabled={isPending} className="bg-red-800 px-3 py-2 flex items-center gap-2 text-base text-gray-300 hover:text-gray-100 duration-300 font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70">
        {isPending ? (
         <>
          <Loader2 strokeWidth={3} className="animate-spin size-5"/> Archiving...
         </>
      ) : (
         <>
            <Trash strokeWidth={3} className="size-5"/> Archive project
         </>
      )}
  </button>
}
