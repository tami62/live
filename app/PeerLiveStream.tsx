import React, { useRef, useEffect, useState,forwardRef,useImperativeHandle} from 'react';
import Peer from 'simple-peer';
import { events } from "aws-amplify/api";
//import Countdown from 'react-countdown';
//import DatePicker from 'react-datepicker';



interface LiveStreamViewerProps {
  screenCode: string;
}
interface LiveViewerRefType {
  callsendInitSignal: (incomingSignal:string) => void;
}
const LiveStreamViewer = forwardRef<LiveViewerRefType, LiveStreamViewerProps>(({ screenCode }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
 
  const [dahlingSignal,setDahlingSignal] = useState<string>("");
  const popPeer = new Peer({ initiator: false,trickle: false });

  useImperativeHandle(ref, () => ({
    callsendInitSignal: sendInitSignal,
  }));

  useEffect(() => {
    console.log("screen code",screenCode);
    if (!screenCode) return;
 
    popPeer.on('signal', (signal) => {
      const initSignal = JSON.stringify(signal);
      console.log("Signal on start", initSignal);
      //sendSignal(screenCode,"LIVE_READY_DAHLING",initSignal)
      setDahlingSignal(initSignal);
     });

    popPeer.on('stream', (remoteStream) => {
      console.log("peer on stream");
      if (videoRef) {
        console.log("peer on stream videoRef");
        if (videoRef.current) {
          console.log("peer on stream video ref current");
            videoRef.current.srcObject = remoteStream;
         //   videoRef.current.play();
        } 
      }
     });

    popPeer.on('connect', () => {
      console.log('CONNECT')
      popPeer.send("Hello from Poppeer");
    })

     popPeer.on('error', (err) => {
      console.error('Peer error', err);
    });

  


    return () => {
      popPeer.destroy();
    };
  }, [screenCode]);

  const sendInitSignal = (incomingSignal:string) => {
    popPeer.signal(incomingSignal);
    if (dahlingSignal.length>0) {
      console.log("sendInitSignal back",dahlingSignal);
      sendSignal(screenCode,"LIVE_READY_DAHLING",dahlingSignal);
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
    <div className=" items-start gap-3 md:gap-4 tv-gap">
      <video ref={videoRef} autoPlay playsInline  muted style={{  width: '50%', height: '70%',  border: '1px solid #ffa000' }}  >
   
   </video>
  </div>
  );
});
LiveStreamViewer.displayName = 'LiveStreamViewer';

export default LiveStreamViewer;