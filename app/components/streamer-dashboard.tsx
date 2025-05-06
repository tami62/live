"use client";

import { useState, useEffect } from "react";
import { events } from "aws-amplify/api";
import Peer from "simple-peer";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle } from "lucide-react";
import StreamControls from "./stream-controls";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent } from "./ui/card";
import VideoStream from "./video-stream";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ViewerRequests from "./viewer-requests";
import ConnectedUsers from "./connected-users";

// Types
export interface ViewerRequest {
  id: string;
  name: string;
  screenCode: string;
  timestamp: number;
  signal: string;
}

export interface ConnectedUser {
  id: string;
  name: string;
  screenCode: string;
  connectionTime: number;
  peer: Peer.Instance;
}

export default function StreamerDashboard() {
  // State
  const [streamId] = useState<string>(uuidv4().substring(0, 8));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [viewerRequests, setViewerRequests] = useState<ViewerRequest[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize stream and event subscription
  useEffect(() => {
    const initializeStream = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);

        // Connect to Amplify events
        const channel = await events.connect(`/game/${streamId}`, {
          authMode: "iam",
        });

        setIsConnected(true);

        // Subscribe to events
        const subscription = channel.subscribe({
          next: (data) => handleIncomingEvent(data),
          error: (err) => {
            console.error("Subscription error:", err);
            setError("Connection error. Please refresh and try again.");
          },
        });

        return () => {
          subscription.unsubscribe();
          stream.getTracks().forEach((track) => track.stop());
          connectedUsers.forEach((user) => user.peer.destroy());
        };
      } catch (err) {
        console.error("Setup error:", err);
        setError(
          "Failed to access camera and microphone. Please check permissions."
        );
      }
    };

    initializeStream();
  }, [streamId]);

  // Handle incoming events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleIncomingEvent = (data: any) => {
    const eventType = data?.event?.type;
    const payload = data?.event?.payload;

    switch (eventType) {
      case "VIEWER_REQUEST":
        handleViewerRequest(payload);
        break;
      case "VIEWER_SIGNAL":
        handleViewerSignal(payload);
        break;
      default:
        console.log("Unknown event type:", eventType);
    }
  };

  // Handle viewer connection request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewerRequest = (payload: any) => {
    const { id, name, screenCode, signal } = payload;

    // Add to viewer requests
    setViewerRequests((prev) => [
      ...prev,
      {
        id,
        name,
        screenCode,
        signal,
        timestamp: Date.now(),
      },
    ]);
  };

  // Handle viewer signal (for established connections)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewerSignal = (payload: any) => {
    const { id, signal } = payload;

    // Find the connected user and signal their peer
    const user = connectedUsers.find((u) => u.id === id);
    if (user && user.peer) {
      try {
        user.peer.signal(signal);
      } catch (err) {
        console.error("Error signaling peer:", err);
      }
    }
  };

  // Accept a viewer request
  const acceptViewerRequest = (request: ViewerRequest) => {
    if (!localStream) return;

    try {
      // Create a new peer
      const peer = new Peer({
        initiator: false,
        stream: localStream,
        trickle: false,
      });

      // Handle peer signals
      peer.on("signal", (signal) => {
        sendSignal(request.screenCode, "STREAMER_SIGNAL", {
          id: streamId,
          signal: JSON.stringify(signal),
        });
      });

      // Handle peer connection
      peer.on("connect", () => {
        console.log("Peer connected:", request.id);
      });

      // Handle peer errors
      peer.on("error", (err) => {
        console.error("Peer error:", err);
        removeConnectedUser(request.id);
      });

      // Signal the peer with the viewer's signal
      peer.signal(request.signal);

      // Add to connected users
      setConnectedUsers((prev) => [
        ...prev,
        {
          id: request.id,
          name: request.name,
          screenCode: request.screenCode,
          connectionTime: Date.now(),
          peer,
        },
      ]);

      // Remove from viewer requests
      setViewerRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error("Error accepting viewer:", err);
    }
  };

  // Reject a viewer request
  const rejectViewerRequest = (requestId: string) => {
    setViewerRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Disconnect a connected user
  const disconnectUser = (userId: string) => {
    const user = connectedUsers.find((u) => u.id === userId);
    if (user && user.peer) {
      user.peer.destroy();
    }
    removeConnectedUser(userId);
  };

  // Remove a connected user from state
  const removeConnectedUser = (userId: string) => {
    setConnectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Send a signal through Amplify events
  const sendSignal = async (
    screenCode: string,
    eventType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any
  ) => {
    try {
      await events.post(
        `/game/${screenCode}`,
        { type: eventType, payload },
        { authMode: "iam" }
      );
    } catch (err) {
      console.error("Failed to send signal", err);
    }
  };

  // Start or stop streaming
  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Live Stream Dashboard</h1>
            <p className="text-gray-400">Stream ID: {streamId}</p>
          </div>
          <StreamControls
            isStreaming={isStreaming}
            onToggleStream={toggleStreaming}
            isConnected={isConnected}
          />
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <VideoStream stream={localStream} isStreaming={isStreaming} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Tabs defaultValue="requests">
              <TabsList className="w-full bg-gray-800">
                <TabsTrigger value="requests" className="flex-1">
                  Viewer Requests{" "}
                  {viewerRequests.length > 0 && `(${viewerRequests.length})`}
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex-1">
                  Connected{" "}
                  {connectedUsers.length > 0 && `(${connectedUsers.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="mt-4">
                <ViewerRequests
                  requests={viewerRequests}
                  onAccept={acceptViewerRequest}
                  onReject={rejectViewerRequest}
                />
              </TabsContent>

              <TabsContent value="connected" className="mt-4">
                <ConnectedUsers
                  users={connectedUsers}
                  onDisconnect={disconnectUser}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
