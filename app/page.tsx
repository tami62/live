"use client";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import Peer from "simple-peer";
import { events } from "aws-amplify/api";

interface LiveStreamHostProps {
  screenCode: string;
}
interface HostRefType {
  callsendInitSignal: (incomingSignal: string) => void;
}

const LiveStreamHost = forwardRef<HostRefType, LiveStreamHostProps>(({ screenCode }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [hostSignal, setHostSignal] = useState<string>("");

  useImperativeHandle(ref, () => ({
    callsendInitSignal: sendInitSignal,
  }));

  useEffect(() => {
    const getStreamAndCreatePeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const peer = new Peer({
          initiator: true,
          stream: stream,
          trickle: false,
        });

        peer.on("signal", (signalData) => {
          const signalString = JSON.stringify(signalData);
          console.log("Host created offer signal:", signalString);
          setHostSignal(signalString);

          sendSignal(screenCode, "LIVE_READY_DAHLING", signalString);
        });

        peer.on("connect", () => {
          console.log("Host Peer connected");
          peer.send("Hello from host");
        });

        peer.on("data", (data) => {
          console.log("Host received data:", data.toString());
        });

        peer.on("error", (err) => {
          console.error("Host Peer error:", err);
        });

        peerRef.current = peer;
      } catch (err) {
        console.error("Host getUserMedia error:", err);
      }
    };

    getStreamAndCreatePeer();

    return () => {
      peerRef.current?.destroy();
      setScreenStream(null);
    };
  }, [screenCode]);

  const sendInitSignal = (incomingSignal: string) => {
    if (!peerRef.current) {
      console.error("No peer instance to signal");
      return;
    }

    try {
      peerRef.current.signal(incomingSignal);
      console.log("Host received viewer signal and connected");
    } catch (err) {
      console.error("Host signal error:", err);
    }
  };

  const sendSignal = async (screenCode: string, eventType: string, message: string) => {
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
    <div className="items-start gap-3 md:gap-4 tv-gap">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100vh", border: "1px solid #00c853" }}
      ></video>
    </div>
  );
});
LiveStreamHost.displayName = "LiveStreamHost";

export default LiveStreamHost;
