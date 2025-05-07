"use client";

import { Eye, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { StreamData } from "../actions/streams";

interface StreamCardProps {
  stream: StreamData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (stream: any) => void;
}

export default function StreamCard({ stream, onSelect }: StreamCardProps) {
  const formatTime = (dateString: string) => {
    const startTime = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
  };

  return (
    <Card
      className="bg-gray-800 border-gray-700 overflow-hidden hover:border-purple-500 transition-all cursor-pointer"
      onClick={() => onSelect(stream)}
    >
      <div className="relative aspect-video overflow-hidden">
        {stream.thumbnail ? (
          <img
            src={stream.thumbnail || "/placeholder.svg"}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">No thumbnail</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
          LIVE
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
          <Eye className="h-3 w-3 mr-1" />
          {stream.viewerCount}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg line-clamp-1">{stream.title}</h3>
        <div className="flex items-center text-sm text-gray-400 mt-1">
          <User className="h-3 w-3 mr-1" />
          {stream.streamerName}
        </div>
        {stream.description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {stream.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 border-t border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Started {formatTime(stream.startedAt as string)}
        </span>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          Watch Now
        </Button>
      </CardFooter>
    </Card>
  );
}
