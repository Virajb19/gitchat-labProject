'use client'

import { useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'

export default function CopyButton() {

    const [isCopied, setIsCopied] = useState(false)
    const [copiedText, copy] = useCopyToClipboard()

  return <button onClick={() => {
     copy(window.location.href)
     setIsCopied(true)
     setTimeout(() => setIsCopied(false), 2000)
  }} className="rounded-lg bg-blue-600 py-2 px-4 font-semibold">
        {isCopied ? 'Copied!' : 'Copy url'}
  </button>
}