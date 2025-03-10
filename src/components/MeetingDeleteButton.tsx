import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

type Props = {meetingId: string, onPendingChange: (meetingId: string, isPending: boolean) => void}

export default function MeetingDeleteButton({meetingId, onPendingChange}: Props) {

    const queryClient = useQueryClient()
    // const isMutating = useIsMutating({ mutationKey: ['processMeeting']})
    // const isMutating = useIsMutating({ mutationKey: ['processMeeting', meetingId]})

   const {mutate: deleteMeeting, isPending} = useMutation({
        mutationKey: ['deleteMeeting', meetingId],
        mutationFn: async (meetingId: string) => {
            // await new Promise(r => setTimeout(r, 5000))
            const res = await axios.delete(`/api/meeting/${meetingId}`)
            return res.data
        },
        onMutate: () => {
           onPendingChange(meetingId, true)
        },
        onSuccess: () => {
             toast.success('Deleted', { position: 'bottom-left'})
        },
        onError: (err) => {
           console.error(err)
           toast.error('Something went wrong!')
        },
        onSettled: () => {
            queryClient.refetchQueries({ queryKey: ['getMeetings']})
            onPendingChange(meetingId,false)
        }
      })
    // disabled={isPending || isMutating > 0}
  return  <button onClick={(e) => {
             e.preventDefault()
             deleteMeeting(meetingId)
          }} disabled={isPending} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-500 duration-200 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit">
            {isPending ? (
                <div className="size-5 border-[3px] border-red-500/30 rounded-full animate-spin border-t-red-500"/>
            ) : (
                <Trash2 className="size-5"/>
            )}
</button>
}