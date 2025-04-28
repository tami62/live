"use client";

import { useState, useRef, useEffect } from "react";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
import Peer from "simple-peer";
import { useSearchParams } from "next/navigation";

Amplify.configure(amplifyConfig, { ssr: true });

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [screen, setScreen] = useState<string>("1212121");

  const searchParams = useSearchParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [, setLocalStream] = useState<MediaStream | null>(null);
  const dahlingRef = useRef<Peer.Instance | null>(null);
  const [, setLastSentSignal] = useState<string>("");

  interface LiveViewerRefType {
    callsendInitSignal: (incomingSignal: string) => void;
  }
  const liveViewerRef = useRef<LiveViewerRefType | null>(null);

  const createNewHostPeer = (stream: MediaStream) => {
    if (dahlingRef.current) {
      console.log("Destroying old Host Peer...");
      dahlingRef.current.destroy();
    }

    const newPeer = new Peer({
      initiator: true,
      stream: stream,
      trickle: false,
      offerOptions: {
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      },
    });

    newPeer.on("signal", (data) => {
      const initSignal = JSON.stringify(data);
      console.log("New Signal from Host", initSignal);
      setLastSentSignal(initSignal);
      sendSignal(screen, "LIVE_READY_POPLAR", initSignal);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error", err);
    });

    newPeer.on("connect", () => {
      console.log("Host CONNECTED to viewer");
    });

    dahlingRef.current = newPeer;
  };

  useEffect(() => {
    const setup = async () => {
      try {
        const sc = searchParams.get("sc");
        const screenCode = sc ? sc : "1212121";
        setScreen(screenCode);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play();
        }

        const dahlingPeer = new Peer({
          initiator: true,
          stream: stream,
          trickle: false,
          offerOptions: {
            offerToReceiveVideo: false,
            offerToReceiveAudio: false,
          },
        });

        dahlingRef.current = dahlingPeer;

        dahlingPeer.on("signal", async (data) => {
          const initSignal = JSON.stringify(data);
          console.log("Host offer signal:", initSignal);
          setLastSentSignal(initSignal);
          await sendSignal(screenCode, "LIVE_READY_POPLAR", initSignal);
          setIsLiveConnection(true);
        });

        dahlingPeer.on("connect", () => {
          console.log("Host connected with peer!");
        });

        dahlingPeer.on("error", (err) => {
          console.error("Peer error:", err);
        });

        const channel = await events.connect(`/game/${screenCode}`, {
          authMode: "iam",
        });
        setIsConnected(true);

        const sub = channel.subscribe({
          next: async (data) => {
            console.log("Received event:", data.event.type);
            if (data?.event?.type === "LIVE_READY_DAHLING") {
              const incomingSignal = data?.event?.payload?.message;
              console.log("Received viewer answer:", incomingSignal);
              dahlingRef.current?.signal(incomingSignal);
            }
            if (data?.event?.type === "LIVE_READY_POPLAR") {
              const incomingSignal = data?.event?.payload?.message;
              console.log("Received another host offer:", incomingSignal);
              if (liveViewerRef.current) {
                liveViewerRef.current.callsendInitSignal(incomingSignal);
              } else {
                console.warn("ViewerRef not ready yet.");
              }
            }
            if (data?.event?.type === "POP_JOINED") {
              console.log("Receiver (Poplar) joined, re-sending my offer");
              if (stream) {
                createNewHostPeer(stream);
              }
            }
          },
          error: async (err) => {
            console.error("Subscription error:", err);
          },
        });

        // Clean-up
        return () => {
          sub.unsubscribe();
          dahlingPeer.destroy();
        };
      } catch (err) {
        console.error("Setup error:", err);
      }
    };

    setup();
  }, []);

  const sendSignal = async (
    screenCode: string,
    eventType: string,
    message: string
  ) => {
    console.log("Sending Signal:", screenCode, eventType, message);
    try {
      await events.post(
        `/game/${screenCode}`,
        { type: eventType, payload: { message } },
        { authMode: "iam" }
      );
    } catch (err) {
      console.error("Failed to send signal", err);
    }
  };

  return (
    <div>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "50vh", border: "1px solid green" }}
      />

      {/* <LiveStreamViewer screenCode={screen} ref={liveViewerRef} /> */}

      <div>
        <p>Screen Code: {screen}</p>
        <p>Room Connected: {isConnected ? "Yes" : "No"}</p>
        <p>Live Connection: {isLiveConnection ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}
