import React , { useRef, useState } from 'react';
import "../styles/VideoComponent.css";


const server_url =  "http://localhost:8080";
var connections = {};

const peerConfigConnections = {
    "iceServers": [
        {"urls": "stun:stun.l.google.com:19302"}
    ]
}

export default function VideoMeetComponent() {

    var scoketRef = useRef();
    let socketIdRef = useRef();
    
    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();

    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    let [videos, setVideos] = useState([]);
    
    const videoRef = useRef([]);

    // if(isChrome() === false) {

    // }

  return (
    <div>
        { askForUsername === true ? 
            <div>

                

            </div> : <></>
        } 
    </div>
  )
}