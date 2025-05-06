"use client"

import { useRef, useEffect } from "react"
import { VideoOff } from "lucide-react"

interface VideoStreamProps {
  stream: MediaStream | null
  isStreaming: boolean
}

export default function VideoStream({ stream, isStreaming }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {stream ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400">Camera not available</p>
        </div>
      )}

      {!isStreaming && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
          <VideoOff className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-xl font-medium text-gray-300">Stream is not active</p>
          <p className="text-sm text-gray-400 mt-2">Click &quot;Start Streaming&quot; to begin</p>
        </div>
      )}

      <div className="absolute top-4 left-4 flex items-center gap-2">
        {isStreaming && (
          <>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded">LIVE</span>
          </>
        )}
      </div>
    </div>
  )
}
