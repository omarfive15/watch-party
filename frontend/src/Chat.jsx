import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Chat({ socket, username, roomID }) {
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const handleNewMessage = (msg) => {
            setChatLog((prevLog) => [...prevLog, { ...msg, key: msg.id || uuidv4() }]);
        };
        const handleUserJoined = (msgText) => {
            setChatLog((prevLog) => [...prevLog, { user: 'System', message: msgText, key: uuidv4() }]);
        };
        const handleChatHistory = (history) => {
            setChatLog(history.map(msg => ({ ...msg, key: msg.id || uuidv4() })));
        };

        socket.on('SERVER_NEW_MESSAGE', handleNewMessage);
        socket.on('SERVER_USER_JOINED', handleUserJoined);
        socket.on('SERVER_CHAT_HISTORY', handleChatHistory);

        return () => {
            socket.off('SERVER_NEW_MESSAGE', handleNewMessage);
            socket.off('SERVER_USER_JOINED', handleUserJoined);
            socket.off('SERVER_CHAT_HISTORY', handleChatHistory);
        };
    }, [socket]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            socket.emit('CLIENT_CHAT_MESSAGE', {
                roomID,
                user: username,
                message: message
            });
            setMessage('');
        }
    };

    return (
        <>
            <h4 style={{ margin: '0 0 10px 0', color: '#bb86fc' }}>الدردشة</h4>
            <div className="chat-log">
                {chatLog.map((msg) => (
                    <div key={msg.key} className="chat-message">
                        <strong style={{ color: msg.user === 'System' ? '#03dac6' : '#bb86fc' }}>
                            {msg.user}:
                        </strong>
                        <span className={msg.user === 'System' ? 'system-msg' : ''}> {msg.message}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                />
                <button type="submit">إرسال</button>
            </form>
        </>
    );
}
export default Chat;
