"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"

interface StreamFormProps {
  onSubmit: (streamData: {
    title: string
    description: string
    streamerName: string
  }) => void
  isSubmitting: boolean
}

export default function StreamForm({ onSubmit, isSubmitting }: StreamFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [streamerName, setStreamerName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, streamerName })
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Stream Information</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streamerName">Your Name</Label>
            <Input
              id="streamerName"
              value={streamerName}
              onChange={(e) => setStreamerName(e.target.value)}
              placeholder="Enter your name"
              required
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your stream"
              required
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your stream (optional)"
              rows={3}
              className="bg-gray-700 border-gray-600"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                Setting up...
              </>
            ) : (
              "Start Streaming"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
