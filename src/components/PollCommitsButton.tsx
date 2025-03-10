import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { GitGraph, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTransition } from 'react';

export default function PollCommitsButton() {

  // const [isRefetching, setIsRefetching] = useState(false)
  const [isPending, startTransition] = useTransition();

  const queryClient = useQueryClient()

  // const isFetching = useIsFetching({ queryKey: ['getCommits']})

  // const handleClick = async () => {
  //     setIsRefetching(true)
  //     await queryClient.refetchQueries({ queryKey: ['getCommits']})
  //     setIsRefetching(false)
  // }

  const handleClick = () => {
    startTransition(async () => {
       await queryClient.refetchQueries({ queryKey: ['getCommits']})
    })
  }

  return <button disabled={isPending} onClick={handleClick}
      className='bg-blue-700 px-3 py-2 flex items-center gap-2 text-base text-gray-300 hover:text-gray-100 duration-300 font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70'>
        {isPending ? (
          <>
            <RefreshCw className='animate-spin size-5'/> Polling...
          </>
        ) : (
           <>
           <GitGraph className='size-5'/> Poll Commits
           </>
        )}
  </button>
}