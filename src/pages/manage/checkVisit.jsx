import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useReservationsByRooms,
  useRooms,
  useCheckIn,
} from '../../api/user.api';

const CheckVisit = () => {
  const location = useLocation();
  const [roomIds, setRoomIds] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [fetchParams, setFetchParams] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { mutate: doCheckIn } = useCheckIn();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomIdsParam = params.get('roomIds[]');
    if (roomIdsParam) {
      const roomIdsArray = roomIdsParam.split(',').map(id => parseInt(id, 10));
      setRoomIds(roomIdsArray);
    }
  }, [location.search]);

  const { data: rooms } = useRooms(roomIds);
  const { data: reservations, refetch } = useReservationsByRooms(
    fetchParams || {},
  );

  // input 변화 감지
  const handleChange = e => {
    let value = e.target.value.replace(/-/g, '');
    if (value.length > 8) {
      value = value.slice(0, 8); // 최대 8자리까지만 허용
    }

    const formattedValue = formatInputValue(value);
    setInputValue(formattedValue);
  };

  // 입력되는 날짜 포맷팅
  const formatInputValue = value => {
    if (value.length < 5) return value;
    if (value.length < 7) return `${value.slice(0, 4)}-${value.slice(4)}`;
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  };

  // 출석 조회
  const handleFetchReservations = async () => {
    if (inputValue.length === 10) {
      try {
        setFetchParams({ date: inputValue, roomIds });
        refetch();
        setError(null);
      } catch (err) {
        setError('Failed to fetch reservations');
        console.error(err);
      }
    } else {
      setError('Invalid date format. Please enter a date in YYYYMMDD format.');
    }
  };

  // 큐알코드 스캐너 입력 처리
  const handleQrCode = async verificationCode => {
    console.log({ verificationCode, roomIds });
    try {
      await doCheckIn({ verificationCode, roomIds });
      setSuccessMessage(`${verificationCode}님, 출석 확인 되었습니다.`);
      setErrorMessage('');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      console.log('checked');
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setErrorMessage(error.response.data.message);
        setSuccessMessage('');
        setTimeout(() => {
          setErrorMessage('');
        }, 5000);
      } else {
        console.error(error);
      }
    }
  };

  const handleQrKeyDown = useCallback(
    e => {
      if (e.code === 'Enter') {
        handleQrCode(e.target.value);
        e.target.value = '';
      }
    },
    [roomIds],
  );

  return (
    <div className="flex flex-col md:flex-row border-r md:border-r-2 border-gray-300">
      <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-gray-300">
        {rooms?.map(room => (
          <p key={room.roomId}>{room.roomName}</p>
        ))}
        <div>출석 일자</div>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="YYYYMMDD"
        />
        <button onClick={handleFetchReservations}>조회</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {reservations && (
          <table className="mt-4 border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">
                  Reservation ID
                </th>
                <th className="border border-gray-300 px-4 py-2">Room ID</th>
                <th className="border border-gray-300 px-4 py-2">Room Name</th>
                <th className="border border-gray-300 px-4 py-2">User ID</th>
                <th className="border border-gray-300 px-4 py-2">Start Time</th>
                <th className="border border-gray-300 px-4 py-2">End Time</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
                <tr key={reservation.reservationId}>
                  <td className="border border-gray-300 px-4 py-2">
                    {reservation.reservationId}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {reservation.roomId}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {reservation.roomName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {reservation.userId}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(reservation.startDateTime).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(reservation.endDateTime).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="w-full md:w-1/2 p-4">
        <h3>QR Code Verification:</h3>
        <input
          type="text"
          onKeyDown={handleQrKeyDown}
          placeholder="Scan QR Code"
        />
        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 text-green-700">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-100 text-red-700">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default CheckVisit;
