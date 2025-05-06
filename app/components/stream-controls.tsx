"use client"

 import { Play, Square, Wifi, WifiOff } from "lucide-react"
import { Button } from "./ui/button"

interface StreamControlsProps {
  isStreaming: boolean
  isConnected: boolean
  onToggleStream: () => void
}

export default function StreamControls({ isStreaming, isConnected, onToggleStream }: StreamControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-2 w-2 relative">
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></span>
        </span>
        <span className="text-gray-400">
          {isConnected ? (
            <span className="flex items-center">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </span>
          ) : (
            <span className="flex items-center">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </span>
          )}
        </span>
      </div>

      <Button
        onClick={onToggleStream}
        disabled={!isConnected}
        className={isStreaming ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
      >
        {isStreaming ? (
          <>
            <Square className="h-4 w-4 mr-2" />
            Stop Streaming
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Streaming
          </>
        )}
      </Button>
    </div>
  )
}
