import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useSnackbar } from 'react-simple-snackbar';
import { useIsAdminData } from './api/user.api';

import Footer from './components/footer/Footer';
import NavigationBar from './components/Navbar/NavigationBar';
import Check from './pages/check/CheckRoom';
import LoginPage from './pages/login/LoginPage';
import Notice from './pages/notice/notice';
import OtpPage from './pages/OtpPage/OtpPage';
import RoomPage from './pages/rooms/room/RoomPage';
import useAuth from './hooks/useAuth';
import CheckVisit from './pages/manage/checkVisit';
import SelectRoom from './pages/manage/SelectRoom';
import QrCheck from './pages/qrcheck/QrCheck';
import LoggedInPassword from './pages/password/LoggedInPassword';
import LoggedOutPassword from './pages/password/LoggedOutPassword';
import EmailVerify from './pages/password/EmailVerify';
import SignUp from './pages/signup/SignUp';
import SelectFloor from './pages/qrcheck/SelectFloor';
import Schedule from './pages/manage/Schedule';

const Router = () => {
  const { loggedIn } = useAuth();
  const { data: isAdmin } = useIsAdminData();
  const [openSnackbar] = useSnackbar({
    position: 'top-right',
    style: {
      backgroundColor: '#FF3333',
    },
  });

  const pwResetToken = sessionStorage.getItem('pwResetToken');

  return (
    <BrowserRouter basename={process.env.REACT_APP_BASEURL || '/'}>
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <div className="flex-grow">
          <Routes>
            <Route path="/password" element={<LoggedInPassword />} />
            <Route path="/email" element={<EmailVerify />} />
            <Route
              path="/email/pwreset"
              element={
                pwResetToken ? <LoggedOutPassword /> : <Navigate to="/" />
              }
            />
            <Route path="/" element={<Notice />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/roompage" element={<RoomPage />} />
            {isAdmin && (
              <>
                <Route path="/selectFloor" element={<SelectFloor />} />
                <Route path="/visit" element={<CheckVisit />} />
                <Route path="/selectRoom" element={<SelectRoom />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="qrcheck" element={<QrCheck />} />
              </>
            )}
            {loggedIn && (
              <>
                <Route path="/check" element={<Check />} />
                <Route path="/otp" element={<OtpPage />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <Footer showSnackbar={openSnackbar} />
      </div>
    </BrowserRouter>
  );
};

export default Router;
