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
const channel = await events.connect(`/game/1212121`, {
  authMode: "iam",
});

export default function Home() {

 
  //const dahlingWebCamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [isAudioPeerConnection, setIsAudioPeerConnection] = useState<boolean>(false);
  const [screen,setScreen] = useState<string>("");
  const [connectedScreen,setConnectedScreen] = useState<string>("");
  // const [dahlingPeer,setDahlingPeer] = useState<Instance|null>(null);
  // const [memiPeer, setMemiPeer] = useState<Instance|null>(null);
  const memiAudioRef = useRef<HTMLAudioElement>(null);
  const searchParams = useSearchParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  interface LiveViewerRefType {
    callsendInitSignal: (incomingSignal:string) => void;
  }
 
  const liveViewerRef = useRef<LiveViewerRefType | null>(null);
  
  useEffect(() => {

    const sc = searchParams.get("sc");
    setScreen(sc?sc:"");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
         }
        onCamera(stream);
      });

      const sub = channel.subscribe({
        next: async (data) => {
          console.log("received event:", data);
          if (data?.event?.type === "LIVE_READY_POPLAR") {
              liveViewerRef?.current?.callsendInitSignal(data?.event?.payload?.message);
              console.log("liveViewerRef",liveViewerRef);
              console.log("liveViewerRef.current",liveViewerRef?.current);
          } 
        },
        error: (err) => {
          console.error("Connection error", err);
          console.error("Failed to connect to the game");
        },
      }
    )
    return () => {
      Promise.resolve(sub).then((sub) => {
        if (!sub) return;
        console.log("closing the connection");
        sub.unsubscribe();
      });
    };
  }, []);





  const onCamera = (stream:MediaStream ) => {
    console.log('Stream started:', stream);
    console.log('screen code:',screen );
    console.log('connected Screen',connectedScreen );

    if (screen!=connectedScreen) {
      try {
   
        setConnectedScreen(screen);
        console.log('establishing peer connections:' );
        const dahlingPeer = new Peer({ initiator: true, stream:stream,trickle: false  }); // Both audio and video out to Dahling
        const memiPeer = new Peer({ initiator: true,trickle: false }); // no audior out video out on Memi for now, used for audio in only.
    
        dahlingPeer?.on("signal",(data) => {
          
          const initSignal = JSON.stringify(data);
          console.log("Signal", initSignal)
          sendSignal(screen,"LIVE_READY_POPLAR",initSignal);
          setIsLiveConnection(true);
        })
        dahlingPeer.on('error', (err) => {
          console.error('Peer error', err);
        });
    
        dahlingPeer.on('connect', () => {
          console.log('CONNECTED')
         })
    
        memiPeer?.on("Stream",(remoteStream) => {
          setIsAudioPeerConnection(true);
          console.log("is audio connection",isAudioPeerConnection);
          if (memiAudioRef.current) {
              memiAudioRef.current.srcObject = remoteStream;
          }
        })
        const subscribeToPartyRoom= async () => {
          const channel = await events.connect(`/game/${screen}`, {
            authMode: "iam",
          });
  
           setIsConnected(true);
          
          const sub = channel.subscribe({
            next: async (data) => {
              console.log(data.event.type);
              if (data?.event?.type === "LIVE_READY_DAHLING") {
                console.log("Live peer ready signal received",data?.event?.payload?.message);
                dahlingPeer?.signal(data?.event?.payload?.message);
                setIsLiveConnection(true);
              }
  
              if (data?.event?.type === "LIVE_READY_MEMI") {
                console.log("Audio Peer ready signal received",data?.event?.payload?.message);
                memiPeer?.signal(data?.event?.payload?.message);
                setIsAudioPeerConnection(true);
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
        console.log(subPromise);
        console.log(localStream?.active);
      
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
      
    }
  };

 
  const sendSignal = async (screenCode:string,eventType:string, message:string) => {
    events.post(
          `/game/${screenCode}`,
          {
            type: eventType,
            payload: {"message":message},
          },
          { authMode: "iam" }
    );
  }

  

  return (
     <div>
   <video ref={localVideoRef} autoPlay muted playsInline />
   <LiveStreamViewer screenCode={screen} ref={liveViewerRef} />


    <video ref={localVideoRef} autoPlay muted playsInline />
    
 <span>Connected:{isConnected}</span>
 <span>Live Connection:{isLiveConnection}</span>
 <span>Audio Connection:{isAudioPeerConnection}</span>
 <span>screen code:{screen}</span>

  <audio   ref={memiAudioRef} src="null" controls className="mt-2"  />
  <button onClick={()=> {
       setScreen("4AZMYYOX");
    }
  }
 >Set Screen Button </button>

  
 
  </div>
     );
}
