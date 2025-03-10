import { Project } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useMemo } from "react"
import { toast } from "sonner"
import { useLocalStorage } from "usehooks-ts"

export const useProject = () => {

 const {data: session} = useSession()
 const userId = session?.user.id

 const [projectId, setProjectId] = useLocalStorage<string>('projectId', '')

 const {data: projects,isLoading, isError} = useQuery<Project[]>({
  queryKey: ['getProjects', userId],
  queryFn: async () => {
      const { data: { projects }} = await axios.get('/api/project')
      return projects
  },
  enabled: !!userId
 })

 // USE DATA DIRECTLY FROM THE QUERY DON'T CREATE A LOCAL STATE FOR THE DATA FETCHED

 const project = useMemo(() => {
    return projects?.find(project => project.id === projectId)
 }, [projects, projectId])

 if(isError) toast.error('Some error occured')

    return { projects, projectId, setProjectId, project, isLoading}
}