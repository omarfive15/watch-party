import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// التأكد من إزالة الخطأ
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'\;

function Home() {
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
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
            console.error('Failed to create room', error);
            alert('فشل إنشاء الغرفة. حاول مرة أخرى.');
        }
    };

    const handleJoinRoom = () => {
        if (!username) return alert('الرجاء إدخال اسم مستخدم');
        if (!roomID) return alert('الرجاء إدخال رمز الغرفة');
        localStorage.setItem('username', username);
        navigate(`/room/${roomID}`);
    };

    return (
        <div className="home-container">
            <h1>Watch Party</h1>
            <div className="form-group">
                <label htmlFor="username">اسم المستخدم:</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسمك..."
                />
            </div>

            <div className="room-actions">
                <div className="join-room">
                    <input
                        type="text"
                        value={roomID}
                        onChange={(e) => setRoomID(e.target.value)}
                        placeholder="أدخل رمز الغرفة..."
                    />
                    <button onClick={handleJoinRoom} disabled={!roomID || !username}>
                        انضمام لغرفة
                    </button>
                </div>
                <div className="create-room">
                    <button onClick={handleCreateRoom} disabled={!username}>
                        إنشاء غرفة جديدة
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;
