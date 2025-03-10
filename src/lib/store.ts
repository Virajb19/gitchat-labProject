import { create } from 'zustand'
import { Project } from "@prisma/client"
import axios from 'axios'
import { toast } from 'sonner'

type useSearchQuery = {
    query: string,
    setQuery: (query: string) => void
  }
  
export const useSearchQuery = create<useSearchQuery>((set, get) => ({
       query: '',
       setQuery: (query: string) => {
         set({query})
       }
  }))

type loadingState = {
    loading: boolean,
    setLoading: (value: boolean) => void
}

export const useLoadingState = create<loadingState>((set, get) => ({
     loading: false,
     setLoading: (value: boolean) => {
        set({ loading: value})
     }
}))
  
type useProjectStore = {
      projectId: string,
      setProjectId: (id: string) => void,
      projects: Project[],
      fetchProjects: () => Promise<void>,
      project: Project | null,
      isLoading: boolean,
      isError: boolean
  }

// export const useProjectStore = create<useProjectStore>((set, get) => ({
//       projectId: localStorage.getItem('projectId') || '',
//       setProjectId: (id: string) => {
//          localStorage.setItem('projectId', id)
//          set({ projectId: id})

//          get().fetchProjects()
//          const projects = get().projects
//          const project = projects.find(p => p.id === id)
//          set({ project })
//       },
//       isLoading: false,
//       isError: false,
//       project: null,
//       projects: [],
//       fetchProjects: async () => {
//           try {
//              set({ isLoading: true})
//              const { data } = await axios.get<{ projects: Project[]}>('/api/project')
//              set({ projects: data.projects })

//             //  const projectId = get().projectId
//              const { projectId, projects } = get()

//             const project = projects.find(project => project.id === projectId)
//             set({ project })
            
//           } catch(err) {
//               console.error(err)
//               set({ isError: true})
//               toast.error('Error fetching projects')
//           } finally {
//             set({ isLoading: false})
//           }
//       },
// }))