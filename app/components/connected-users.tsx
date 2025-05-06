"use client"

import type { ConnectedUser } from "./streamer-dashboard"
 import { PhoneOff, Users } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"

interface ConnectedUsersProps {
  users: ConnectedUser[]
  onDisconnect: (userId: string) => void
}

export default function ConnectedUsers({ users, onDisconnect }: ConnectedUsersProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <Users className="h-12 w-12 mb-4 text-gray-500" />
            <p>No connected viewers</p>
            <p className="text-sm mt-1">Accept viewer requests to see them here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Viewer</TableHead>
                <TableHead className="text-gray-300">Screen Code</TableHead>
                <TableHead className="text-gray-300">Connected At</TableHead>
                <TableHead className="text-right text-gray-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-700">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.screenCode}</TableCell>
                  <TableCell>{formatTime(user.connectionTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-800 hover:bg-red-900 hover:text-white"
                      onClick={() => onDisconnect(user.id)}
                    >
                      <PhoneOff className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
