import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import App from './pages/App';
import Login from './pages/login/Login';
import Timetable from './pages/studyroom/roomId/Timetable';
import SelectRoom from './pages/studyroom/SelectRoom';

const Router = () => {
  return (
    <BrowserRouter basename={process.env.REACT_APP_BASEURL || '/'}>
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} /> {/* 소개 페이지 */}
        <Route path="/login" element={<Login />} /> {/* 로그인 페이지 */}
        <Route path="/rooms" element={<SelectRoom />} /> {/* Room 목록 */}
        <Route path="/rooms/:roomId/" element={<Timetable />} /> {/* 특정 Room */}
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
