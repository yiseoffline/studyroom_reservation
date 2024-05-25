import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { HiInformationCircle } from 'react-icons/hi';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { addMinutes, format } from 'date-fns';
import { ko } from 'date-fns/locale';

import 'react-datepicker/dist/react-datepicker.css';

import Button from '../../../components/button/Button';

const timeTableConfig = {
  startTime: {
    hour: 8,
    minute: 30,
  },
  endTime: {
    hour: 22,
    minute: 30,
  },
  intervalMinute: 30,
  maxReservationSlots: 4,
};

// table 만드는 함수
const createTimeTable = config => {
  const { startTime, endTime, intervalMinute } = config;
  const start = new Date();
  start.setHours(startTime.hour, startTime.minute, 0, 0);

  const end = new Date();
  end.setHours(endTime.hour, endTime.minute, 0, 0);

  const timeTable = [];

  let currentTime = start;
  while (currentTime <= end) {
    timeTable.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, intervalMinute);
  }

  if (timeTable[timeTable.length - 1] !== format(end, 'HH:mm')) {
    timeTable[timeTable.length - 1] = format(end, 'HH:mm');
  }

  return timeTable;
};

const RoomPage = () => {
  // 현재 시간
  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const currentDay = formatDate(today);

  const [selectedPartition, setSelectedPartition] = useState(null);
  const [startTimeIndex, setStartTimeIndex] = useState(null);
  const [endTimeIndex, setEndTimeIndex] = useState(null);
  const [slotsArr, setSlotsArr] = useState([]);
  const times = useMemo(() => createTimeTable(timeTableConfig), []);

  const [reservedSlots, setReservedSlots] = useState({
    room1: [],
    room2: [],
  });

  // 슬롯이 선택되었는지 확인하는 함수
  const getSlotSelected = useCallback(
    (partition, timeIndex) => {
      if (!startTimeIndex || !endTimeIndex) return false;
      if (selectedPartition !== partition) return false;
      if (!(startTimeIndex <= timeIndex && timeIndex <= endTimeIndex))
        return false;

      return true;
    },
    [startTimeIndex, endTimeIndex, selectedPartition],
  );

  // 슬롯의 상태 토글하는 함수
  const toggleSlot = useCallback(
    (partition, timeIndex) => {
      const isExist = getSlotSelected(partition, timeIndex);

      if (!startTimeIndex && !endTimeIndex) {
        setSelectedPartition(partition);
        setStartTimeIndex(timeIndex);
        setEndTimeIndex(timeIndex);
        return;
      }

      if (selectedPartition !== partition) {
        setSelectedPartition(partition);
        setStartTimeIndex(timeIndex);
        setEndTimeIndex(timeIndex);
        return;
      }

      if (startTimeIndex === endTimeIndex) {
        if (
          Math.abs(startTimeIndex - timeIndex) + 1 >
          timeTableConfig.maxReservationSlots
        ) {
          return (
            <Alert color="failure" icon={HiInformationCircle}>
              <span className="font-medium">경고!</span> 예약은 최대 두시간
              까지만 가능합니다.
            </Alert>
          );
        }
        if (startTimeIndex === timeIndex) {
          setSelectedPartition(null);
          setStartTimeIndex(null);
          setEndTimeIndex(null);
        } else if (startTimeIndex < timeIndex) {
          setEndTimeIndex(timeIndex);
        } else {
          setStartTimeIndex(timeIndex);
          setEndTimeIndex(timeIndex);
        }
        return;
      }

      setSelectedPartition(partition);
      setStartTimeIndex(timeIndex);
      setEndTimeIndex(timeIndex);

      // 시간과 날짜를 포함한 ISO 8601 형식으로 변환
      const formattedDate = formatDate(new Date(selectedDate));
      const startDateTime = `${formattedDate}T${times[startTimeIndex]}:00.000Z`;
      const endDateTime = `${formattedDate}T${times[endTimeIndex]}:00.000Z`;
      console.log({
        partition,
        startDateTime,
        endDateTime,
        isExist,
        selectedDate: formattedDate,
      }); // 인덱스 대신 시간 형식을 출력
    },
    [
      getSlotSelected,
      setStartTimeIndex,
      setEndTimeIndex,
      selectedPartition,
      times,
      startTimeIndex,
      endTimeIndex,
    ],
  );

  // 최대 예약 시간에 부합하는지 계산하는 함수
  const handleCellClick = (partition, timeIndex) => {
    const clickedTime = times[timeIndex + 1];
    const currentTime = format(today, 'yyyy-MM-dd HH:mm'); // 현재 시간과 날짜를 포함한 문자열
    const selectedDateTime =
      format(selectedDate, 'yyyy-MM-dd') + ' ' + clickedTime; // 선택한 날짜와 시간을 포함한 문자열

    if (selectedDateTime < currentTime) {
      alert('과거의 시간에 예약을 할 수는 없습니다.');
      return;
    }

    toggleSlot(partition, timeIndex);
  };

  // date-picker 설정
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableDate, setAvailabelDate] = useState([]);
  registerLocale('ko', ko);

  // 현재로부터 예약 가능한 방들의 날짜 목록 가져오기
  useEffect(() => {
    const getDate = async () => {
      const date_response = await axios.get(
        'https://api.studyroom.jisub.kim/schedules/available-dates',
      );
      setAvailabelDate(date_response.data.data.items);
    };
    getDate();
  }, []);

  // date-picker에서 날짜 선택할 때마다 실행되는 함수
  const handleDateChange = date => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    console.log(formattedDate); //2024-05-23
    fetchReservation(formattedDate);
  };

  //예약 정보 가져오기
  const fetchReservation = async date => {
    try {
      const response = await axios.get(
        `https://api.studyroom.jisub.kim/reservations/by-date?date=${date}`,
      );
      const roomNames = response.data.data.items.map(item => item.roomName);
      console.log(roomNames);
      console.log(response.data.data.items.map(item => item.roomId));
      setSlotsArr(roomNames);
      console.log('done');
    } catch (error) {
      console.error('fetch error : ', error);
    }
  };
  // 자신의 예약 생성
  const handleReservation = async () => {
    const res = await axios.post(
      'https://api.studyroom.jisub.kim/users/reservations/user/reservation',
      {
        roomId: selectedPartition,
        startDateTime: startTimeIndex,
        endDateTime: endTimeIndex,
      },
    );
    console.log(res.data);
  };

  return (
    <>
      <div id="container">
        <div id="head-container">
          <Typography
            marginTop="50px"
            variant="h5"
            fontWeight={600}
            component="div"
            align="center">
            일자별 세미나실 예약 현황
          </Typography>
          <div
            className="mt-5 mb-10 justify-center text-center"
            style={{ color: '#9D9FA2' }}>
            아래 예약 현황의 예약가능 시간을 선택하시면 해당 세미나실을 대관할
            수 있습니다.
          </div>
          {/* date-picker 부분 */}
          <div className="flex justify-center">
            <DatePicker
              selected={selectedDate}
              locale={ko}
              minDate={availableDate[0]}
              maxDate={availableDate[availableDate.length - 1]}
              onChange={handleDateChange}
              dateFormat="yyyy년 MM월 dd일"
              showIcon
            />
          </div>
        </div>

        <div id="squares" className="flex p-4">
          <div
            className="w-6 h-6 mt-10"
            style={{ backgroundColor: '#F1EEE9' }}></div>
          <div className="mt-10 ml-2">예약 가능</div>
          <div
            className="w-6 h-6 mt-10 ml-5"
            style={{ backgroundColor: '#7599BA' }}></div>
          <div className="mt-10 ml-2">예약 선택</div>
          <div
            className="w-6 h-6 mt-10 ml-5"
            style={{ backgroundColor: '#002D56' }}></div>
          <div className="mt-10 ml-2">예약 완료</div>
        </div>

        {/* timeTable 시작 */}
        <div>
          <TableContainer
            sx={{
              overflowX: 'auto',
              width: '100%',
              marginTop: '20px',
              '@media (max-width : 1300px)': {
                overflowX: 'scroll',
              },
            }}>
            <Table>
              <TableHead
                className="fixedPartitions"
                sx={{ borderBottom: 'none' }}>
                <TableRow>
                  <TableCell align="center" width={100} />
                  {times.map((time, timeIndex) => (
                    <TableCell
                      key={timeIndex}
                      align="center"
                      width={200}
                      className="fixedPartitions relative">
                      <div style={{ width: 20, height: 30 }}>
                        <span className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                          {time}
                        </span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {slotsArr.map(partition => (
                  <TableRow key={partition}>
                    <TableCell>{partition}</TableCell>
                    {times.map((time, timeIndex) => {
                      const isSelected = getSlotSelected(partition, timeIndex);
                      const isSelectable = true;
                      const isReserved =
                        reservedSlots[partition]?.includes(timeIndex);
                      return (
                        <TableCell
                          key={timeIndex}
                          onClick={() => handleCellClick(partition, timeIndex)}
                          className={isSelected ? 'selected' : ''}
                          style={{
                            padding: 30,
                            backgroundColor: isReserved
                              ? '#002D56'
                              : isSelected
                                ? '#7599BA'
                                : '#F1EEE9',
                            borderRight: '1px solid #ccc',
                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                          }}></TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className="p-10 flex justify-end">
          <Button onClick={handleReservation} text="예약하기" />
        </div>
      </div>
    </>
  );
};

export default RoomPage;
