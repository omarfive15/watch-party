import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Room from './Room';

function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomID" element={<Room />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
export default App;
