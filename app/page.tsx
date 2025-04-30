"use client";

import { useState, useRef,  useEffect } from "react";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
import Peer from "simple-peer";
import { useSearchParams } from "next/navigation";
import LiveStreamViewer  from "./PeerLiveStream";
Amplify.configure(amplifyConfig, { ssr: true });


export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [screen, setScreen] = useState<string>('');

  const searchParams = useSearchParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isStreamStarted, setIsStreamStarted] = useState<boolean>(false);
  const dahlingRef = useRef<Peer.Instance | null>(null);
  const [, setLastSentSignal] = useState<string>("");

  interface LiveViewerRefType {
    callsendInitSignal: (incomingSignal: string) => void;
    checkViewerStatus: ()=>void;
  }
  const liveViewerRef = useRef<LiveViewerRefType | null>(null);

  

  useEffect(() => {
    const sc = searchParams.get("sc");
    console.log("sc:",sc);
    const screenCode = sc ? sc : "1212121";
    setScreen(screenCode);
    const setup = async (screenIn:string) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play();
        }
        const dahlingPeer = new Peer({
          initiator: false,
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
        console.log("Connecting for subsription:", screenIn,screen);
        const channel = await events.connect(`/game/${screenIn}`, {
          authMode: "iam",
        });
        setIsConnected(true);

        const sub = channel.subscribe({
          next: async (data) => {
            console.log("Received event:", data.event.type);
            if (data?.event?.type === "LIVE_READY_DAHLING") {
              setIsStreamStarted(true);
              const incomingSignal = data?.event?.payload?.message;
              console.log("Received viewer answer:");
              dahlingRef.current?.signal(incomingSignal);
            }
            if (data?.event?.type === "LIVE_READY_POPLAR") {
              setIsStreamStarted(true);
              const incomingSignal = data?.event?.payload?.message;
              console.log("Received another host offer:");
              if (liveViewerRef.current) {
                liveViewerRef.current.callsendInitSignal(incomingSignal);
              } else {
                console.warn("ViewerRef not ready yet.");
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
    console.log("screen before setup",screen,screenCode,sc);
    setup(screenCode);
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

  const checkStatus = () => {
    console.log("check viewer status isStreamStarted", isStreamStarted);
    if (!isStreamStarted) {
      liveViewerRef.current?.checkViewerStatus();
    }
  }
  
  return (
    <div>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "50vh", border: "1px solid green" }}
      />

      <LiveStreamViewer screenCode={screen} subscriptionStarted={isConnected} ref={liveViewerRef} /> 

      <button onClick={checkStatus}>checkStatus</button>

      <div>
        <p>Screen Code: {screen}</p>
        <p>Room Connected: {isConnected ? "Yes" : "No"}</p>
        <p>Live Connection: {isLiveConnection ? "Yes" : "No"}</p>
        <p>Stream Started: {isStreamStarted ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}
