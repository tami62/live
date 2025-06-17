"use client"

import { useState, useEffect } from "react" 
import { Amplify } from "aws-amplify"
import amplifyConfig from "../amplify_outputs.json"
import StreamerDashboard from "./components/streamer-dashboard"
import { Authenticator } from "@aws-amplify/ui-react"

Amplify.configure(amplifyConfig, { ssr: true })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for Amplify configuration
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (

      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Initializing Stream...</h2>
        </div>
      </div>
    )
  }

  return (
    <Authenticator>
      <StreamerDashboard />
    </Authenticator>
  )
}
