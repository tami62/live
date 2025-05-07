"use client";

import { useState, useRef, useEffect } from "react";
import { events } from "aws-amplify/api";
import Peer from "simple-peer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, ArrowLeft, Video, User } from "lucide-react";
import { getStreamByStreamId } from "@/app/actions/streams";

interface ViewerPageProps {
  streamId: string;
  streamTitle: string;
  streamerName: string;
  onBack: () => void;
}

export default function ViewerPage({
  streamId,
  streamTitle,
  streamerName,
  onBack,
}: ViewerPageProps) {
  const [name, setName] = useState<string>("");
  const [viewerId] = useState<string>(
    `viewer-${Math.random().toString(36).substring(2, 9)}`
  );
  const [status, setStatus] = useState<
    "idle" | "requesting" | "connected" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [checkingInterval, setCheckingInterval] =
    useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  // Subscribe to events for this stream
  useEffect(() => {
    if (isSubscribed) return;

    const subscribeToEvents = async () => {
      try {
        const channel = await events.connect(`/stream/${streamId}`, {
          authMode: "iam",
        });

        const subscription = channel.subscribe({
          next: (data) => handleIncomingEvent(data),
          error: (err) => {
            console.error("Subscription error:", err);
            setStatus("error");
            setErrorMessage("Connection error. Please try again.");
          },
        });

        setIsSubscribed(true);

        // Check if the stream is still active periodically
        const interval = setInterval(async () => {
          try {
            const stream = await getStreamByStreamId(streamId);
            if (!stream || !stream.isActive) {
              setStreamActive(false);
              if (status === "connected") {
                disconnect();
                setErrorMessage("The stream has ended.");
              }
            }
          } catch (error) {
            console.error("Error checking stream status:", error);
          }
        }, 30000); // Check every 30 seconds

        setCheckingInterval(interval);

        return () => {
          subscription.unsubscribe();
          if (peerRef.current) {
            peerRef.current.destroy();
          }
          if (checkingInterval) {
            clearInterval(checkingInterval);
          }
        };
      } catch (err) {
        console.error("Subscription error:", err);
        setStatus("error");
        setErrorMessage("Failed to connect to stream. Please try again.");
      }
    };

    subscribeToEvents();

    // Initial check for stream status
    checkStreamStatus();
  }, [streamId, isSubscribed]);

  // Check if stream is active
  const checkStreamStatus = async () => {
    try {
      const stream = await getStreamByStreamId(streamId);
      if (!stream || !stream.isActive) {
        setStreamActive(false);
        setErrorMessage("This stream is no longer active.");
      }
    } catch (error) {
      console.error("Error checking stream status:", error);
    }
  };

  // Handle incoming events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleIncomingEvent = (data: any) => {
    const eventType = data?.event?.type;
    const payload = data?.event?.payload;

    switch (eventType) {
      case "STREAMER_SIGNAL":
        handleStreamerSignal(payload);
        break;
      default:
        console.log("Unknown event type:", eventType);
    }
  };

  // Handle streamer signal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStreamerSignal = (payload: any) => {
    const { signal } = payload;

    if (status === "requesting" && peerRef.current) {
      try {
        peerRef.current.signal(signal);
      } catch (err) {
        console.error("Error signaling peer:", err);
        setStatus("error");
        setErrorMessage("Connection error. Please try again.");
      }
    }
  };

  // Request to join stream
  const requestStream = async () => {
    if (!name) {
      setErrorMessage("Please enter your name to join the stream.");
      return;
    }

    if (!streamActive) {
      setErrorMessage("This stream is no longer active.");
      return;
    }

    try {
      setStatus("requesting");
      setErrorMessage(null);

      // Create a new peer
      const peer = new Peer({
        initiator: true,
        trickle: false,
      });

      peerRef.current = peer;

      // Handle peer signals
      peer.on("signal", (signal) => {
        sendSignal(streamId, "VIEWER_REQUEST", {
          id: viewerId,
          name,
          screenCode: streamId,
          signal: JSON.stringify(signal),
        });
      });

      // Handle peer stream
      peer.on("stream", (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("connected");
      });

      // Handle peer connection
      peer.on("connect", () => {
        console.log("Connected to streamer");
      });

      // Handle peer errors
      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setStatus("error");
        setErrorMessage("Connection error. Please try again.");
      });

      // Handle peer close
      peer.on("close", () => {
        setStatus("idle");
        setErrorMessage("Stream ended by the host.");
      });
    } catch (err) {
      console.error("Error requesting stream:", err);
      setStatus("error");
      setErrorMessage("Failed to initialize connection. Please try again.");
    }
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
        `/stream/${screenCode}`,
        { type: eventType, payload },
        { authMode: "iam" }
      );
    } catch (err) {
      console.error("Failed to send signal", err);
      setStatus("error");
      setErrorMessage("Failed to send request. Please try again.");
    }
  };

  // Disconnect from stream
  const disconnect = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setStatus("idle");
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Streams
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{streamTitle}</h1>
            <div className="flex items-center text-gray-400 mt-1">
              <User className="h-4 w-4 mr-1" />
              {streamerName}
            </div>
          </div>
        </header>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!streamActive && status !== "connected" && (
          <Alert className="mb-6 border-yellow-600 bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-300">
              This stream is no longer active. Please go back to browse other
              streams.
            </AlertDescription>
          </Alert>
        )}

        {status === "connected" ? (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded">
                      CONNECTED
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button variant="destructive" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1"
                  >
                    Your Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-gray-700 border-gray-600"
                    disabled={status === "requesting" || !streamActive}
                  />
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={requestStream}
                  disabled={status === "requesting" || !streamActive}
                >
                  {status === "requesting" ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join Stream
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
