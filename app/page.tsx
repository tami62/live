"use client";

import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
import Peer, { Instance } from 'simple-peer';
import DataTable from 'react-data-table-component';
import { useSearchParams } from "next/navigation";



export default function Home() {

 
  const dahlingWebCamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [isAudioPeerConnection, setIsAudioPeerConnection] = useState<boolean>(false);
  const [screen,setScreen] = useState<string>("");
  const [connectedScreen,setConnectedScreen] = useState<string>("");
  const [dahlingPeer,setDahlingPeer] = useState<Instance|null>(null);
  const [memiPeer, setMemiPeer] = useState<Instance|null>(null);
  const memiAudioRef = useRef<HTMLAudioElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {

    const sc = searchParams.get("sc");
    setScreen(sc?sc:"");
    Amplify.configure(amplifyConfig, { ssr: true });
 
  }, []);

  const columns = [
    {
      name: 'Requester',
      selector: (row: { title: string; }) => row.title,
    },
    {
      name: 'Year',
      selector: (row: { time: string; }) => row.time,
    },
    {
      name: 'content',
      selector: (row: { content: string; }) => row.content,
    },
  ];
  
  const data = [
      {
      id: 1,
      title: 'Requestor',
      time: '12/12/2025 5:00PM',
      content: 'This new song'
    },
    {
      id: 2,
      title: 'Ghostbusters',
      time: '12/12/2025 7:00PM',
      content: 'that new song'
    },
  ]

  const onCamera = (stream:MediaStream ) => {
    console.log('Stream started:', stream);
    if (screen!=connectedScreen) {
      try {
        dahlingPeer?.destroy();
        memiPeer?.destroy();
        setConnectedScreen(screen);
        setDahlingPeer(new Peer({ initiator: true, stream:stream })); // Both audio and video out to Dahling
        setMemiPeer(new Peer({ initiator: true})); // no audior out video out on Memi for now, used for audio in only.
    
        dahlingPeer?.on("signal",(data) => {
          
          const initSignal = JSON.stringify(data);
          console.log("Signal", initSignal)
          sendSignal(screen,"LIVE_READY_POPLAR",initSignal);
          setIsLiveConnection(true);
          console.log(isLiveConnection);
        }
      )
      memiPeer?.on("Stream",(remoteStream) => {
        setIsAudioPeerConnection(true);
          console.log("is audio connection",isAudioPeerConnection);
          if (memiAudioRef.current) {
              memiAudioRef.current.srcObject = remoteStream;
          }
        }
      )
      waitForPeerSignal();
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }
  };

  const waitForPeerSignal = async () => {
 
    try {
      const subscribeToPartyRoom= async () => {
        const channel = await events.connect(`/game/${screen}`, {
          authMode: "iam",
        });

         setIsConnected(true);
        
        const sub = channel.subscribe({
          next: async (data) => {
            console.log(data.event.type);
            if (data?.event?.type === "LIVE_READY_DAHLING") {
              console.log("Live peer ready signal received",data?.event?.type);
              dahlingPeer?.signal(data?.event?.payload?.message);
              setIsLiveConnection(true);
            }

            if (data?.event?.type === "LIVE_READY_MEMI") {
              console.log("Audio Peer ready signal received",data?.event?.type);
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

      const subPromise = await subscribeToPartyRoom();
      console.log(subPromise);
    } catch (err) {
      console.log(err);
    }
  };

  const sendSignal = async (screenCode:string,eventType:string, message:string) => {
    console.log("send event");
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
      <Webcam
        ref={dahlingWebCamRef}
        className="w-full max-w-lg border border-gray-600 rounded-lg"
        onUserMedia={onCamera}
      />
   
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

  
  <DataTable
			columns={columns}
			data={data}
		/>
  </div>
     );
}
