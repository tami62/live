"use client";

import { useState, useEffect } from "react";
import StreamCard from "./stream-card";
import ViewerPage from "./viewer-page";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, Tv } from "lucide-react";
import { getActiveStreams, type StreamData } from "@/app/actions/streams";

export default function StreamBrowser() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [ , setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    fetchStreams();

    // Set up polling for live updates
    const interval = setInterval(() => {
      fetchStreams(false);
    }, 30000); // Poll every 30 seconds

    setPollingInterval(interval);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const fetchStreams = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const activeStreams = await getActiveStreams();
      setStreams(activeStreams);
    } catch (err) {
      console.error("Error fetching streams:", err);
      setError("Failed to load streams. Please try again.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleStreamSelect = (stream: StreamData) => {
    setSelectedStream(stream);
  };

  const handleBackToBrowse = () => {
    setSelectedStream(null);
  };

  const filteredStreams = streams.filter(
    (stream) =>
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.streamerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.description &&
        stream.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (selectedStream) {
    return (
      <ViewerPage
        streamId={selectedStream.streamId}
        streamTitle={selectedStream.title}
        streamerName={selectedStream.streamerName}
        onBack={handleBackToBrowse}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Live Streams</h1>
          <p className="text-gray-400">
            Watch and interact with live streamers
          </p>
        </header>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
          <Button
            onClick={() => fetchStreams(true)}
            variant="outline"
            className="border-gray-700"
          >
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="all">All Streams</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recently Started</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading streams...</p>
              </div>
            ) : filteredStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStreams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    onSelect={handleStreamSelect}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Tv className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-medium mb-2">
                    No streams available
                  </h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No streams match your search. Try different keywords."
                      : "There are no active streams right now. Check back later!"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="popular" className="mt-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading streams...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStreams
                  .sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
                  .filter((stream) => (stream.viewerCount || 0) > 0)
                  .map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      onSelect={handleStreamSelect}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading streams...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStreams
                  .sort(
                    (a, b) =>
                      new Date(b.startedAt || b.createdAt || "").getTime() -
                      new Date(a.startedAt || a.createdAt || "").getTime()
                  )
                  .map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      onSelect={handleStreamSelect}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
