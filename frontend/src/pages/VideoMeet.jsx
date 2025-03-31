import React , { useEffect, useRef, useState } from 'react';
import {Badge, containerClasses, IconButton, TextField} from '@mui/material';
import Button from '@mui/material/Button';
import { io } from 'socket.io-client'
import styles from "../styles/VideoComponent.module.css";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'


const server_url =  "http://localhost:8080";

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        {"urls": "stun:stun.l.google.com:19302"}
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    
    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();

    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState(true);
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    let [videos, setVideos] = useState([]);
    
    const videoRef = useRef([]);

    // if(isChrome() === false) {

    // }

    useEffect(() => {
        getPermissions();
    }, [])

    const getPermissions = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
            if(videoPermission) {
                setVideoAvailable(true);
                console.log("Video Permission Granted!!");
            } else {
                setVideoAvailable(false);
                console.log("Video Permission Denied!!");
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});
            if(audioPermission) {
                setAudioAvailable(true);
                console.log("Audio Permission Granted!!");
            } else {
                setAudioAvailable(false);
                console.log("Audio Permission Denied!!");
            }   

            if(navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true)
            } else {
                setScreenAvailable(false)
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});

                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        } catch(error) {
            console.log(error)
        }
    }

    

    let getUserMediaSuccess = (stream) => {
        try{
            window.localStream.getTracks().forEach(track => track.stop());

        } catch(e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer()
                .then((description)=> {
                    connections[id].setLocalDescription(description)
                        .then(()=> {
                            socketIdRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                        })
                        .catch(e=>console.log(e))
                })
                .catch(e=>console.log(e))
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false)

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop());
            } catch(e) {console.log(e)}

            // TODO BlackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connections) {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description)=> {
                    connections[id].setLocalDescription(description)
                        .then(()=> {socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))})
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
    }

    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext('2d').fillRect(0, 0, width, height);

        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});
    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
                .then(getUserMediaSuccess) 
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch(err){
                console.log(err)
            }
        }
    }

    useEffect(() => {
        if(video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if(fromId !== socketIdRef.current) {
            if(signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if(signal.sdp.type === "offer") {
                            connections[fromId].createAnswer()
                            .then((description) => {
                                connections[fromId].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", fromId, JSON.stringify({'sdp': connections[fromId].localDescription}))
                                }).catch(e => console.log(e))
                            }).catch(e => console.log(e))
                        }
                    }).catch(e => console.log(e))
            }

            if(signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        
        socketRef.current = io.connect(server_url, {secure: false});

        socketRef.current.on('signal', gotMessageFromServer)
        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message", addMessage);
            socketRef.current.on("user-left", (id) => {
                setVideo((videos) => videos.filter((video) => video.socketId !== id))
            })
            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    // wait for the ice candidate
                    connections[socketListId].onicecandidate = (event) => {
                        if(event.candidate != null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice': event.candidate}))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId)

                        if(videoExists) {
                            setVideo(videos => {
                                const updatedVideos = videos.map(video => 
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {
                            let newVideo = {
                                socketId : socketListId,
                                stream : event.stream,
                                autoPlay : true,
                                playsInline : true
                            }

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                    }

                    if(window.localStream !== undefined  && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        // TODO blackSilence
                        // let blackSilence

                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if(id === socketIdRef.current) {
                    for(let id2 in connections) {
                        if(id2 === socketIdRef.current) continue;

                        try{
                            connections[id2].addStream(window.localStream);
                        } catch(err) {
                            console.log(err);
                        }

                        connections[id2].createOffer()
                            .then((description) => {
                                connections[id2].setLocalDescription(description)
                                    .then(() => {
                                        socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].setLocalDescription}))
                                    })
                                    .catch(e => console.log(e));
                            })
                    }
                }
            })
        })
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, {sender: sender, data:data}])

        if(socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessages) => prevMessages+1)
        }
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        // connectToSocketServer();
    }
    const connect = () => {
        setAskForUsername(false);
        getMedia();
    };
  return (
    <div>
        { askForUsername === true ? 
            <div>

                <h2>Enter into Lobby</h2>
                <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>
                <div>
                    <video ref={localVideoRef} autoPlay muted ></video>
                </div>

            </div> : 
            <div className={styles.meetVideoContainer}>

                <div className={styles.buttonContainer}>
                    <IconButton style={{color: "white"}}>
                        {(video===true) ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>
                    <IconButton style={{color: "red"}}>
                        <CallEndIcon />
                    </IconButton>
                    <IconButton style={{color: "white"}}>
                        {(audio===true) ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>

                    {screenAvailable === true ?
                        <IconButton style={{color: "white"}}>
                        {(screen===true) ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                    </IconButton>
                    : <></>}

                    <Badge badgeContent={newMessages}>
                        <IconButton style={{color: "blue"}}>
                            <ChatIcon />
                        </IconButton>
                    </Badge>
                </div>

                <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
                {videos.map((video)=>(
                    <div className={styles.conferenceView} key={video.socketId}>
                        <h2>{video.socketId}</h2>
                        <video 
                        data-socket={video.socketId} 
                        ref={ref => {
                            if(ref && video.stream) {
                                ref.srcObject = video.stream
                            }
                        }}
                        autoPlay 
                        ></video>
                    </div>
                ))}
            </div>
        } 
    </div>
  )
}