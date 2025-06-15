"use client"
import type { ViewerRequest } from "./streamer-dashboard" 
import { Check, X, Clock, User } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"

interface ViewerRequestsProps {
  requests: ViewerRequest[]
  onAccept: (request: ViewerRequest) => void
  onReject: (requestId: string) => void
}

export default function ViewerRequests({ requests, onAccept, onReject }: ViewerRequestsProps) {
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    return `${Math.floor(seconds / 60)}m ago`
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center text-gray-400">
            <div className="flex flex-col items-center justify-center py-6">
              <User className="h-12 w-12 mb-4 text-gray-500" />
              <p>No Party requests</p>
              <p className="text-sm mt-1">Waiting for viewers to connect</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} className="bg-gray-800 border-gray-700 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{request.name}</h3>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTime(request.timestamp)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Screen Code: {request.screenCode}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-800 hover:bg-red-900 hover:text-white"
                    onClick={() => onReject(request.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAccept(request)}>
                    <Check className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
