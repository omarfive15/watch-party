import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'\;

function Home() {
    const [username, setUsername] = useState('');
    const [roomID, setRoomID] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = async () => {
        if (!username) return alert('الرجاء إدخال اسم مستخدم');
        try {
            const res = await fetch(`${API_URL}/create-room`);
            const data = await res.json();
            localStorage.setItem('username', username);
            navigate(`/room/${data.roomID}`);
        } catch (error) {
            console.error('[frosty] Failed to create room', error);
        }
    };

    const handleJoinRoom = () => {
        if (!username || !roomID) return alert('الرجاء إدخال اسم مستخدم ومعرف الغرفة');
        localStorage.setItem('username', username);
        navigate(`/room/${roomID}`);
    };

    return (
        <div className="home-container">
            <h1>frosty Watch Party</h1>
            <div>
                <input
                    type="text"
                    placeholder="اسم المستخدم (Username)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <button onClick={handleCreateRoom}>إنشاء غرفة جديدة</button>
            </div>
            <hr style={{ margin: '20px', borderColor: '#333' }} />
            <div>
                <input
                    type="text"
                    placeholder="معرف الغرفة (Room ID)"
                    value={roomID}
                    onChange={(e) => setRoomID(e.target.value)}
                />
                <button onClick={handleJoinRoom}>الانضمام للغرفة</button>
            </div>
        </div>
    );
}
export default Home;
