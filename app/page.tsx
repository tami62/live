"use client";

import { useState, useRef, useEffect } from "react";
//import Webcam from "react-webcam";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
//import Peer, { Instance } from 'simple-peer';
import Peer from 'simple-peer';
import { useSearchParams } from "next/navigation";
import LiveStreamViewer from "./PeerLiveStream";

Amplify.configure(amplifyConfig, { ssr: true });

export default function Home() {

 
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  useState<boolean>(false);
  const [screen, setScreen] = useState<string>("1212121");

  const searchParams = useSearchParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const dahlingRef = useRef<Peer.Instance | null>(null);

  interface LiveViewerRefType {
    callsendInitSignal: (incomingSignal:string) => void;
  }
 
  const liveViewerRef = useRef<LiveViewerRefType | null>(null);
  
  useEffect(() => {
     const sc = searchParams.get("sc");
    setScreen(sc?sc:"1212121");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
       }
     
      const dahlingPeer = new Peer({
        initiator: false,
        stream: stream,
        trickle: false,
        offerOptions: { 
            offerToReceiveVideo: false,
            offerToReceiveAudio: false,
        }
      }); 
      dahlingRef.current = dahlingPeer;
      dahlingPeer?.on("signal", (data) => {
        const initSignal = JSON.stringify(data);
        console.log("Signal", initSignal);
        sendSignal(screen, "LIVE_READY_POPLAR", initSignal);
        setIsLiveConnection(true);
      });
      dahlingPeer.on("error", (err) => {
        console.error("Peer error", err);
      });

      dahlingPeer.on("connect", () => {
        console.log("CONNECTED");
      });
      })

    const subscribeToPartyRoom = async () => {
      const channel = await events.connect(`/game/${screen}`, {
        authMode: "iam",
      });

      setIsConnected(true);

      const sub = channel.subscribe({
        next: async (data) => {
          console.log("event received", data.event.type);
             if (data?.event?.type === "LIVE_READY_DAHLING") {
            console.log(
              "Live peer ready signal received from dahling",
              data?.event?.payload?.message
            );
            dahlingRef.current?.signal(data?.event?.payload?.message);
            setIsLiveConnection(true);
          }
          if (data?.event?.type === "LIVE_READY_POPLAR") {
            console.log(
              "Live peer ready signal received from poplar",
              data?.event?.payload?.message
            );
            liveViewerRef.current?.callsendInitSignal(data?.event?.payload?.message);
            setIsLiveConnection(true);
          }
        },
        error: async (err) => {
          console.log("Connection error", err);
          console.log("Failed to connect to the game");
        },
      });
      return sub;
    };

    const subPromise = subscribeToPartyRoom();
    console.log("subscription to party room completed",screen);
    console.log("sub promise",subPromise);
    console.log("localstream active",localStream?.active);

  
    return () => {
      Promise.resolve(subPromise).then((sub) => {
        if (!sub) return;
        console.log("closing the connection");
        sub.unsubscribe();
      });
      dahlingRef.current?.destroy();
    };
     }, []);

  

  const sendSignal = async (
    screenCode: string,
    eventType: string,
    message: string
  ) => {
    console.log("sendSignal",screenCode,eventType,message);
    events.post(
      `/game/${screenCode}`,
      {
        type: eventType,
        payload: { message: message },
      },
      { authMode: "iam" }
    );
  };

  return (
     <div>
   <video ref={localVideoRef} autoPlay muted playsInline />
   <LiveStreamViewer screenCode={screen} ref={liveViewerRef} />


    <video ref={localVideoRef} autoPlay muted playsInline />
  <span>screen code:{screen}</span>
 <span>Room Connection:{isConnected}</span>
 <span>Live Connection:{isLiveConnection}</span>

  </div>
     );
}
