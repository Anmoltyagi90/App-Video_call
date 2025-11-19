import React, { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../../environment";

const server_url = server;
const connections = {};
const pendingCandidates = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const silence = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  ctx.resume();
  return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};

const black = ({ width = 640, height = 480 } = {}) => {
  const canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  });
  canvas.getContext("2d").fillRect(0, 0, width, height);
  const stream = canvas.captureStream();
  return Object.assign(stream.getVideoTracks()[0], { enabled: false });
};

const createFallbackStream = () => new MediaStream([black(), silence()]);
const deriveRoomId = () => {
  const cleanPath = window.location.pathname.replace(/\//g, "");
  return cleanPath || "main-room";
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoref = useRef(null);
  const remoteVideosRef = useRef([]);
  const showChatRef = useRef(true);
  const roomIdRef = useRef(deriveRoomId());

  // eslint-disable-next-line no-unused-vars
  const [videoAvailable, setVideoAvailable] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [audioAvailable, setAudioAvailable] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [screenAvailable, setScreenAvailable] = useState(false);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showModal, setModal] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [remoteVideos, setRemoteVideos] = useState([]);

  const attachLocalStream = useCallback(() => {
    if (localVideoref.current && window.localStream) {
      if (localVideoref.current.srcObject !== window.localStream) {
        localVideoref.current.srcObject = window.localStream;
      }
    }
  }, []);

  const cleanupConnections = () => {
    Object.values(connections).forEach((connection) => {
      connection.close();
    });
    Object.keys(connections).forEach((key) => delete connections[key]);
    Object.keys(pendingCandidates).forEach((key) => delete pendingCandidates[key]);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (window.localStream) {
      try {
        window.localStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setVideoAvailable(hasVideo);
      setAudioAvailable(hasAudio);
      setVideoEnabled(hasVideo);
      setAudioEnabled(hasAudio);
      setScreenAvailable(Boolean(navigator.mediaDevices.getDisplayMedia));

      window.localStream = stream;
      attachLocalStream();
    } catch (error) {
      console.log(error);
      setVideoAvailable(false);
      setAudioAvailable(false);
      setVideoEnabled(false);
      setAudioEnabled(false);
      setScreenAvailable(false);

      window.localStream = createFallbackStream();
      attachLocalStream();
    }
  }, [attachLocalStream]);

  useEffect(() => {
    showChatRef.current = showModal;
    if (showModal) {
      setNewMessages(0);
    }
  }, [showModal]);

  useEffect(() => {
    getPermissions();
    return () => {
      cleanupConnections();
    };
  }, [getPermissions]);

  const connectToSocketServer = () => {
    if (socketRef.current) return;

    const socket = io(server_url, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socketIdRef.current = socket.id;
    });

    socket.on("signal", gotMessageFromServer);
    socket.on("chat-message", handleIncomingMessage);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
  };

  const handleIncomingMessage = (sender, data) => {
    setMessages((prev) => [...prev, { sender, data }]);
    if (!showChatRef.current) {
      setNewMessages((count) => count + 1);
    }
  };

  const handleUserLeft = (payload) => {
    const id =
      typeof payload === "string"
        ? payload
        : payload?.socketId || payload?.id || payload?.userId;
    if (!id) return;

    const updatedVideos = remoteVideosRef.current.filter(
      (video) => video.socketId !== id
    );
    remoteVideosRef.current = updatedVideos;
    setRemoteVideos(updatedVideos);

    if (connections[id]) {
      connections[id].close();
      delete connections[id];
    }
    if (pendingCandidates[id]) {
      delete pendingCandidates[id];
    }
  };

  const createPeerConnection = (socketListId) => {
    const connection = new RTCPeerConnection(peerConfigConnections);
    connections[socketListId] = connection;
    pendingCandidates[socketListId] = [];

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({ ice: event.candidate })
        );
      }
    };

    connection.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;

      setRemoteVideos((videos) => {
        const exists = videos.find((video) => video.socketId === socketListId);
        const updated = exists
          ? videos.map((video) =>
              video.socketId === socketListId ? { ...video, stream } : video
            )
          : [...videos, { socketId: socketListId, stream }];

        remoteVideosRef.current = updated;
        return updated;
      });
    };

    if (window.localStream) {
      window.localStream
        .getTracks()
        .forEach((track) => connection.addTrack(track, window.localStream));
    } else {
      const fallback = createFallbackStream();
      fallback
        .getTracks()
        .forEach((track) => connection.addTrack(track, fallback));
    }

    return connection;
  };

  const flushPendingCandidates = (id) => {
    const candidates = pendingCandidates[id] || [];
    candidates.forEach((candidate) => {
      connections[id]
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => console.log(error));
    });
    pendingCandidates[id] = [];
  };

  const handleUserJoined = (arg1, arg2) => {
    let id = arg1;
    let clients = arg2;
    if (Array.isArray(arg1)) {
      clients = arg1;
      id = arg2;
    }
    if (!Array.isArray(clients)) {
      clients = [];
    }

    clients.forEach((socketListId) => {
      if (socketListId === socketIdRef.current) return;
      if (!connections[socketListId]) {
        createPeerConnection(socketListId);
      }
    });

    if (id === socketIdRef.current) {
      clients.forEach((clientId) => {
        if (clientId === socketIdRef.current) return;
        const connection = connections[clientId];
        if (!connection) return;

        connection
          .createOffer()
          .then((description) => connection.setLocalDescription(description))
          .then(() => {
            socketRef.current.emit(
              "signal",
              clientId,
              JSON.stringify({ sdp: connection.localDescription })
            );
          })
          .catch((error) => console.log(error));
      });
    }
  };

  const gotMessageFromServer = (fromId, message) => {
    if (!socketRef.current || fromId === socketIdRef.current) {
      return;
    }

    const signal = JSON.parse(message);

    if (!connections[fromId]) {
      createPeerConnection(fromId);
    }

    if (signal.sdp) {
      connections[fromId]
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          flushPendingCandidates(fromId);
          if (signal.sdp.type === "offer") {
            connections[fromId]
              .createAnswer()
              .then((description) =>
                connections[fromId].setLocalDescription(description)
              )
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({
                    sdp: connections[fromId].localDescription,
                  })
                );
              })
              .catch((error) => console.log(error));
          }
        })
        .catch((error) => console.log(error));
    }

    if (signal.ice) {
      if (
        connections[fromId].remoteDescription &&
        connections[fromId].remoteDescription.type
      ) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((error) => console.log(error));
      } else {
        if (!pendingCandidates[fromId]) pendingCandidates[fromId] = [];
        pendingCandidates[fromId].push(signal.ice);
      }
    }
  };

  const connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
    setMessages([]);
    setNewMessages(0);
    connectToSocketServer();
    if (socketRef.current) {
      socketRef.current.emit("join-call", {
        roomId: roomIdRef.current,
        username: username.trim(),
      });
    }
    if (window.localStream) {
      window.localStream
        .getTracks()
        .forEach((track) => (track.enabled = track.kind === "video" ? videoEnabled : audioEnabled));
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = () => {
    if (!socketRef.current) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    socketRef.current.emit("chat-message", trimmed, username || "You");
    setMessages((prev) => [...prev, { sender: username || "You", data: trimmed }]);
    if (!showChatRef.current) {
      setNewMessages((count) => count + 1);
    }
    setMessage("");
  };

  useEffect(() => {
    if (!askForUsername) {
      attachLocalStream();
    }
  }, [askForUsername, attachLocalStream]);

  const toggleVideo = () => {
    const nextValue = !videoEnabled;
    setVideoEnabled(nextValue);
    if (window.localStream) {
      window.localStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = nextValue));
    }
  };

  const toggleAudio = () => {
    const nextValue = !audioEnabled;
    setAudioEnabled(nextValue);
    if (window.localStream) {
      window.localStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = nextValue));
    }
  };

  const handleEndCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-call", {
        roomId: roomIdRef.current,
        username: username.trim() || socketIdRef.current,
      });
    }
    cleanupConnections();
    window.location.href = "/";
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex items-center justify-center">
      {askForUsername ? (
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col gap-4 w-[350px]">
          <h2 className="text-2xl font-bold text-center">Enter Lobby</h2>

          <input
            type="text"
            placeholder="Username"
            className="px-4 py-2 rounded bg-gray-700 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button
            onClick={connect}
            className="bg-blue-600 w-full py-2 rounded hover:bg-blue-500 disabled:bg-gray-600"
            disabled={!username.trim()}
          >
            Connect
          </button>

          <video ref={localVideoref} autoPlay muted className="w-full rounded mt-2" />
        </div>
      ) : (
        <div className="w-full h-full grid grid-cols-12 gap-2">
          {/* CHAT SIDEBAR */}
          {showModal && (
            <div className="col-span-3 bg-gray-800 p-4 flex flex-col">
              <h1 className="text-xl font-bold mb-4">Chat</h1>

              <div className="flex-grow overflow-y-auto space-y-3">
                {messages.length > 0 ? (
                  messages.map((item, i) => (
                    <div key={i} className="bg-gray-700 p-2 rounded">
                      <p className="font-bold text-blue-400">{item.sender}</p>
                      <p>{item.data}</p>
                    </div>
                  ))
                ) : (
                  <p>No Messages Yet</p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={message}
                  onChange={handleMessageChange}
                  className="flex-grow bg-gray-700 px-3 py-2 rounded outline-none"
                  placeholder="Type your message"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-4 rounded hover:bg-blue-500"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* MAIN VIDEO AREA */}
          <div className={`${showModal ? "col-span-9" : "col-span-12"} p-4 flex flex-col`}>
            {/* CONTROLS */}
            <div className="flex justify-center gap-4 mb-4">
              <button onClick={toggleVideo} className="p-3 bg-gray-700 rounded-full">
                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </button>

              <button onClick={handleEndCall} className="p-3 rounded-full bg-red-700">
                <CallEndIcon />
              </button>

              <button onClick={toggleAudio} className="p-3 bg-gray-700 rounded-full">
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </button>

              <button
                onClick={() => setModal(!showModal)}
                className="relative p-3 bg-gray-700 rounded-full"
              >
                <ChatIcon />
                {newMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newMessages}
                  </span>
                )}
              </button>
            </div>

            {/* LOCAL + REMOTE VIDEOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              <div className="flex flex-col items-center w-full max-w-xs">
                <video
                  className="w-full rounded shadow-lg mb-2 aspect-video object-cover"
                  ref={localVideoref}
                  autoPlay
                  muted
                />
                <p className="text-sm text-gray-200">{username || "You"}</p>
              </div>

              {remoteVideos.map((remoteVideo) => (
                <div
                  key={remoteVideo.socketId}
                  className="flex flex-col items-center w-full max-w-xs"
                >
                  <video
                    autoPlay
                    className="w-full rounded shadow mb-2 aspect-video object-cover"
                    ref={(ref) => {
                      if (ref && remoteVideo.stream && ref.srcObject !== remoteVideo.stream) {
                        ref.srcObject = remoteVideo.stream;
                      }
                    }}
                  />
                  <p className="text-sm text-gray-200">
                    {remoteVideo.displayName || `User ${remoteVideo.socketId.slice(0, 6)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
