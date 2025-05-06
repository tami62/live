"use client"

import { Suspense } from "react"
import ViewerPage from "../components/viewer-page"
import { Amplify } from "aws-amplify"
import amplifyConfig from "./../../amplify_outputs.json"

Amplify.configure(amplifyConfig, { ssr: true })

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white">Loading Viewer...</h2>
          </div>
        </div>
      }
    >
      <ViewerPage />
    </Suspense>
  )
}
