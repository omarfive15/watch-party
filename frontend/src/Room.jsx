import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';
import Chat from './Chat';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'\;
const socket = io(SERVER_URL);

function Room() {
    const { roomID } = useParams();
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    
    const [playerState, setPlayerState] = useState({ url: "", playing: false, time: 0 });
    const [tempVideoUrl, setTempVideoUrl] = useState("");
    const playerRef = useRef(null);
    const isSyncing = useRef(false);

    useEffect(() => {
        if (!username) {
            alert("يجب تحديد اسم مستخدم أولاً");
            navigate('/');
            return;
        }

        socket.emit('JOIN_ROOM', { roomID, username });

        socket.on('SERVER_SYNC_STATE', (state) => {
            console.log("[frosty] Received sync:", state);
            isSyncing.current = true;
            setPlayerState(state);
            
            if (playerRef.current) {
                const timeDiff = Math.abs(playerRef.current.getCurrentTime() - state.time);
                if (timeDiff > 1.5) {
                    playerRef.current.seekTo(parseFloat(state.time));
                }
            }
            setTimeout(() => { isSyncing.current = false; }, 200);
        });

        return () => {
            socket.off('SERVER_SYNC_STATE');
        };
    }, [roomID, username, navigate]);

    const sendStateToServer = (newState) => {
        if (isSyncing.current) return;
        socket.emit('CLIENT_SYNC_STATE', { roomID, state: newState });
    };

    const handlePlay = () => {
        const newState = { ...playerState, playing: true };
        setPlayerState(newState);
        sendStateToServer(newState);
    };

    const handlePause = () => {
        const newState = { ...playerState, playing: false, time: playerRef.current.getCurrentTime() };
        setPlayerState(newState);
        sendStateToServer(newState);
    };

    const handleSeek = (seconds) => {
        const newState = { ...playerState, time: seconds };
        setPlayerState(newState);
        sendStateToServer(newState);
    };

    const handleChangeVideo = () => {
        if (!tempVideoUrl) return;
        socket.emit('CLIENT_CHANGE_VIDEO', { roomID, videoUrl: tempVideoUrl, username });
        setTempVideoUrl("");
    };

    return (
        <div className="room-container">
            <h2>Room: {roomID} (مرحباً, {username})</h2>
            <div className="room-layout">
                <div className="video-container">
                    <div className="url-input">
                        <input 
                            type="text" 
                            placeholder="أدخل رابط فيديو (YouTube, .mp4, ...)"
                            value={tempVideoUrl}
                            onChange={(e) => setTempVideoUrl(e.target.value)}
                        />
                        <button onClick={handleChangeVideo}>تغيير</button>
                    </div>
                    <div className="video-wrapper">
                        <ReactPlayer
                            ref={playerRef}
                            className="react-player"
                            url={playerState.url}
                            playing={playerState.playing}
                            controls={true}
                            width="100%"
                            height="100%"
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onSeek={handleSeek}
                        />
                    </div>
                </div>
                <div className="chat-container">
                    <Chat socket={socket} username={username} roomID={roomID} />
                </div>
            </div>
        </div>
    );
}
export default Room;
