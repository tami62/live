"use client";

import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
import Peer from "simple-peer";
import DataTable from 'react-data-table-component';


export default function Home() {

  useEffect(() => {
    Amplify.configure(amplifyConfig, { ssr: true });
 
  }, []);

  const dahlingWebCamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [audioInConnection, setAudioInConnection] = useState<boolean>(false);

  const memiAudioRef = useRef<HTMLAudioElement>(null);
 
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

  const startLiveCam = async (screenCode: string) => {

    try {
        const constraints = { video: true, audio: true };
        const userStream = await navigator.mediaDevices.getUserMedia(constraints);
        const dahlingPeer = new Peer({ initiator: true, stream:userStream }); // Both audio and video out to Dahling
        const memiPeer = new Peer({ initiator: true}); // no audior out video out on Memi for now, used for audio in only.
      
        dahlingPeer.on("signal",(data) => {
          
          const initSignal = JSON.stringify(data);
          console.log("Signal", initSignal)
          sendSignal(screenCode,"LIVE_READY_SIGNAL",initSignal);
          setIsLiveConnection(true);
          console.log(isLiveConnection);
        }
      )
      memiPeer.on("Stream",(remoteStream) => {
          setAudioInConnection(true);
          console.log("is audio connection",audioInConnection);
          if (memiAudioRef.current) {
              memiAudioRef.current.srcObject = remoteStream;
          }
        }
      )

        
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const waitForPeerSignal = async (screenCode:string) => {
 
    try {
      const subscribeToPartyRoom= async (screenCode: string) => {
        const channel = await events.connect(`/game/${screenCode}`, {
          authMode: "iam",
        });

         setIsConnected(true);
         startLiveCam("video");
        
        const sub = channel.subscribe({
          next: async (data) => {
            console.log(data.event.type);
            if (data?.event?.type === "LIVE_START_DAHLING") {
              console.log("IsLiveConnection set to True");
            //  dahlingPeer.signal(data?.event?.payload?.message);
              setIsLiveConnection(true);
            }

            if (data?.event?.type === "LIVE_START_MEMI") {
              console.log("IsLiveConnection set to True");
            //  memiPeer.signal(data?.event?.payload?.message);
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

      const subPromise = await subscribeToPartyRoom(screenCode);
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
              />
    <button
    onClick={() =>    waitForPeerSignal("N1ZOVR68")}
    disabled={!isConnected}
    className={`bg-indigo-400 p-3 rounded-lg flex justify-center md:justify-start items-center gap-2 hover:bg-blue-300 ${
      isConnected ? "" : "opacity-50 cursor-not-allowed"
    }`}
  >
    Stream
  </button>
  <button
    onClick={() =>    startLiveCam("N1ZOVR68")}
    disabled={!isConnected}
    className={`bg-indigo-500 p-3 rounded-lg flex justify-center md:justify-start items-center gap-2 hover:bg-blue-400 ${
      isConnected ? "" : "opacity-50 cursor-not-allowed"
    }`}
  >
    Signal
  </button>

  <audio   ref={memiAudioRef} src="null" controls className="mt-2"  />
  
  <DataTable
			columns={columns}
			data={data}
		/>
  </div>
     );
}
