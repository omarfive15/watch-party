import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';
import Chat from './Chat';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'\;

function Room() {
    const { roomID } = useParams();
    const [username, setUsername] = useState('');
    const [socket, setSocket] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [playing, setPlaying] = useState(false);
    const [urlToLoad, setUrlToLoad] = useState('');
    const playerRef = useRef(null);
    const isSeeking = useRef(false);

    // 1. تهيئة الـ Socket والحصول على اسم المستخدم
    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) {
            alert('اسم المستخدم غير موجود! الرجاء العودة للصفحة الرئيسية.');
            // يمكنك إضافة navigate('/') هنا إذا أردت
            return;
        }
        setUsername(storedUsername);

        const newSocket = io(API_URL);
        setSocket(newSocket);

        // الانضمام للغرفة
        newSocket.emit('join-room', { roomID, username: storedUsername });

        return () => {
            newSocket.disconnect();
        };
    }, [roomID]);

    // 2. إعداد مستمعي أحداث الـ Socket
    useEffect(() => {
        if (!socket) return;

        // استقبال رابط الفيديو الأولي عند الانضمام
        socket.on('sync-video-url', (url) => {
            setVideoUrl(url);
            setUrlToLoad(url);
        });

        // الاستماع لتغييرات حالة التشغيل
        socket.on('playback-control', (data) => {
            if (data.type === 'PLAY') {
                setPlaying(true);
            } else if (data.type === 'PAUSE') {
                setPlaying(false);
            }
        });

        // الاستماع لتغييرات التقديم/التأخير
        socket.on('seek-control', (time) => {
            if (playerRef.current) {
                isSeeking.current = true; // لمنع إرسال الحدث مرة أخرى
                playerRef.current.seekTo(parseFloat(time));
                setTimeout(() => (isSeeking.current = false), 500); // إعادة الضبط
            }
        });

        // الاستماع لرابط فيديو جديد
        socket.on('load-video', (url) => {
            setVideoUrl(url);
            setUrlToLoad(url);
        });

    }, [socket]);

    // --- متحكمات الفيديو ---

    const handleLoadVideo = () => {
        if (urlToLoad && socket) {
            socket.emit('load-video', { roomID, url: urlToLoad });
        }
    };

    const handlePlay = () => {
        setPlaying(true);
        socket.emit('playback-control', { roomID, type: 'PLAY' });
    };

    const handlePause = () => {
        setPlaying(false);
        socket.emit('playback-control', { roomID, type: 'PAUSE' });
    };

    const handleSeek = (time) => {
        if (!isSeeking.current && socket) {
            socket.emit('seek-control', { roomID, time: time });
        }
    };

    return (
        <div className="room-container">
            <h2>
                الغرفة: {roomID} (أهلاً، {username})
            </h2>
            <div className="main-content">
                <div className="video-player-container">
                    <div className="video-controls">
                        <input
                            type="text"
                            value={urlToLoad}
                            onChange={(e) => setUrlToLoad(e.target.value)}
                            placeholder="أدخل رابط فيديو (YouTube, etc.)"
                        />
                        <button onClick={handleLoadVideo}>تحميل</button>
                    </div>
                    <div className="player-wrapper">
                        <ReactPlayer
                            ref={playerRef}
                            url={videoUrl}
                            playing={playing}
                            controls={true}
                            width="100%"
                            height="100%"
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onSeek={handleSeek}
                            config={{
                                youtube: {
                                    playerVars: { showinfo: 1 }
                                }
                            }}
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
