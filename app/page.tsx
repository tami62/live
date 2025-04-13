"use client";

import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import amplifyConfig from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";
//import Peer from "simple-peer";
import DataTable from 'react-data-table-component';

export default function Home() {

  useEffect(() => {
    Amplify.configure(amplifyConfig, { ssr: true });
 
  }, []);

  const webcamRef = useRef(null);
  const [playerId, setPlayerId] = useState("");
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
 //  const dahlingPeer = new Peer({ initiator: true });
 //  const memiPeer = new Peer({ initiator: true });
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
      year: '1988',
    },
    {
      id: 2,
      title: 'Ghostbusters',
      year: '1984',
    },
  ]

  const startRecording = async (type: string) => {

    try {
      const constraints =
        type === "video" ? { video: true, audio: true } : { audio: true };
      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      //   setStream(userStream);

      if (type === "video" && webcamRef.current) {
       // webcamRef.current.video.srcObject = userStream;
      }

      const recorder = new MediaRecorder(userStream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        // const blob = new Blob(chunks, {
        //   type: type === "video" ? "video/mp4" : "audio/wav",
        // });

        userStream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const connectClient = async () => {
    setPlayerId("PMXM40G8");
    try {
      const subscribeToGameState = async (roomId: string) => {
        const channel = await events.connect(`/game/${roomId}`, {
          authMode: "iam",
        });

         setIsConnected(true);
         startRecording("video");
        const sub = channel.subscribe({
          next: async (data) => {
            console.log(data.event.type);
            if (data?.event?.type === "LIVE_START") {
              console.log("IsLiveConnection set to True");
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

      const subPromise = await subscribeToGameState(playerId);
      console.log(subPromise);
    } catch (err) {
      console.log(err);
    }
  };

  const sendEvent = async () => {
    console.log("send event");
    events.post(
          `/game/${playerId}`,
          {
            type: "POPLAR_READY",
            payload: {"message":"connected"},
          },
          { authMode: "iam" }
        );
  }

  const sendPeerSignal = async () => {
    console.log("send peer signal");
    console.log(isLiveConnection);
  //   events.post(
  //     `/game/${playerId}`,
  //     {
  //       type: "POPLAR_READY",
  //       payload: initSignal,
  //     },
  //     { authMode: "iam" }
  //   );
  //   dahlingPeer.signal(data);
  //   memiPeer.signal(data);
  // });
  }

  return (
    <div>
    <Webcam
                ref={webcamRef}
                className="w-full max-w-lg border border-gray-600 rounded-lg"
              />
    <button
    onClick={() =>    connectClient()}
    disabled={!isConnected}
    className={`bg-indigo-400 p-3 rounded-lg flex justify-center md:justify-start items-center gap-2 hover:bg-blue-300 ${
      isConnected ? "" : "opacity-50 cursor-not-allowed"
    }`}
  >
    Stream
  </button>
  <button
    onClick={() =>    sendEvent()}
    disabled={!isConnected}
    className={`bg-indigo-500 p-3 rounded-lg flex justify-center md:justify-start items-center gap-2 hover:bg-blue-400 ${
      isConnected ? "" : "opacity-50 cursor-not-allowed"
    }`}
  >
    Event
  </button>

  <button
    onClick={() =>    sendPeerSignal()}
    disabled={!isConnected}
    className={`bg-indigo-600 p-3 rounded-lg flex justify-center md:justify-start items-center gap-2 hover:bg-blue-500 ${
      isConnected ? "" : "opacity-50 cursor-not-allowed"
    }`}
  >
    Signal
  </button>
  <DataTable
			columns={columns}
			data={data}
		/>
  </div>
     );
}
