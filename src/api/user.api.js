import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

import { queryClient } from '../index';
import axios from 'axios';

// id, pw 확인할 때 쓰려고
const fetchAllUsers = async () => {
  const allUser_res = await apiClient.get('/users/search');
  return allUser_res.data.data.items;
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: fetchAllUsers,
  });
};

// 자신의 정보 조회
const fetchMyInfo = async () => {
  try {
    const myInfo_res = await apiClient.get('/users/me');
    return myInfo_res.data.data;
  } catch (e) {
    return false;
  }
};

export const useMyInfo = () => {
  return useQuery({
    queryKey: ['myInfo'],
    queryFn: fetchMyInfo,
  });
};

// 관리자인지 아닌지
export const fetchServiceRole = async () => {
  try {
    const isAdmin_res = await apiClient.get('/users/me');
    return isAdmin_res.data.data.serviceRole;
  } catch (e) {
    return false;
  }
};

export const useServiceRole = () => {
  return useQuery({
    queryKey: ['serviceRole'],
    queryFn: fetchServiceRole,
  });
};

// 자신의 예약 생성
export const useReserve = () => {
  return useMutation({
    mutationFn: async ({ roomPartitionId, startDateTime, endDateTime }) => {
      const res = await apiClient.post('/reservations', {
        roomPartitionId,
        startDateTime,
        endDateTime,
      });

      return res.data; // 명시적으로 반환
    },
  });
};

// 현재로부터 예약 가능한 방들의 날짜 목록 가져오기
export const fetchDate = async departmentId => {
  const date_response = await apiClient.get(
    `/schedules/available-dates/${departmentId}`,
  );
  const dates = date_response.data.data.availableDates.map(
    date => new Date(date),
  );
  return dates;
};

// 특정 날짜, 특정 partition들 모든 예약 상태 확인 (1차원, checkVisit에 사용)
export const fetchReservationsByPartitions = async ({ date, partitionIds }) => {
  const params = new URLSearchParams();
  params.append('date', date);
  partitionIds.forEach(id => params.append('partitionIds', id));

  const response = await apiClient.get(
    `/reservations/partitions/by-date?${params.toString()}`,
  );
  return response.data.data.reservationInfoResponses;
};

export const useReservationsByPartitions = ({ date, partitionIds }) =>
  useQuery({
    queryKey: ['reservationsByPartitions', date, partitionIds],
    queryFn: () => fetchReservationsByPartitions({ date, partitionIds }),
  });

// 특정 날짜, 특정 부서가 관리하는 모든 파티션의 예약 상태 조회
export const fetchReservations = async ({ date, departmentId }) => {
  const url = `/reservations/by-date/${departmentId}?date=${date}`;
  const response = await apiClient.get(url);
  const data = response.data.data.partitionReservationInfos;

  return data;
};

export const useReservations = ({ date, departmentId }) =>
  useQuery({
    queryKey: ['reservationsByRooms', date, departmentId],
    queryFn: () => fetchReservations({ date, departmentId }),
    enabled: !!departmentId,
  });

// 예약 삭제하기
export const useDeleteReservation = () => {
  return useMutation({
    mutationFn: async reservationId => {
      const res = await apiClient.delete(`/reservations/me/${reservationId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries('userReservation');
    },
  });
};

// 관리자 예약 삭제
export const useAdminDeleteReservation = () => {
  return useMutation({
    mutationFn: async reservationId => {
      const adminDelete_res = await apiClient.delete(
        `/reservations/admin/${reservationId}`,
      );
      return adminDelete_res.data;
    },
  });
};

export const fetchUserReservation = async () => {
  const user_reservation_response = await apiClient.get('/reservations/me');
  return user_reservation_response.data.data.reservationInfoResponses.reverse();
};

export const useUserReservation = () =>
  useQuery({
    queryKey: ['userReservation'],
    queryFn: fetchUserReservation,
  });

export const fetchOtp = async () => {
  const otp_response = await apiClient.post('/check-in/otp');
  return otp_response.data.data.verificationCode;
};

export const useOtp = () =>
  useQuery({
    queryKey: ['otp'],
    queryFn: () => fetchOtp(),
  });

// partition 조회
export const fetchPartiiton = async partitonId => {
  const partition_res = await apiClient.get(`/partitions/${partitonId}`);
  return partition_res.data.data;
};

export const usePartition = partitionIds =>
  useQuery({
    queryKey: ['partitions', partitionIds],
    queryFn: async () => {
      if (!partitionIds) return [];
      const partitions = await Promise.all(
        partitionIds.map(partitionId => fetchPartiiton(partitionId)),
      );
      return partitions;
    },
  });

// room 조회
export const fetchRoom = async roomId => {
  const room_response = await apiClient.get(`/rooms/${roomId}`);
  return room_response.data.data;
};

export const useRooms = roomId =>
  useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: roomId !== null && roomId !== undefined,
  });

// 체크인 하기
export const useCheckIn = () => {
  return useMutation({
    mutationFn: async ({ verificationCode, roomId }) => {
      const check_in_res = await apiClient.post('/check-in', {
        verificationCode,
        roomId,
      });
      return check_in_res.data;
    },
  });
};

// 모든 room 조회
export const fetchAllRooms = async () => {
  const all_rooms_response = await apiClient.get('/rooms');
  return all_rooms_response.data.data.rooms;
};

export const useAllRooms = () => {
  return useQuery({
    queryKey: ['allRooms'],
    queryFn: fetchAllRooms,
  });
};

// 모든 partition 조회
export const fetchAllPartitions = async () => {
  const all_partitions_response = await apiClient.get('/partitions');
  return all_partitions_response.data.data.partitions;
};

export const useAllPartitions = () =>
  useQuery({
    queryKey: ['allPartitions'],
    queryFn: async () => {
      const allPartitions = await fetchAllPartitions();
      return allPartitions.map(partition => ({
        partitionId: partition.roomPartitionId,
        partitionNumber: partition.partitionNumber,
        roomName: partition.roomName,
        roomId: partition.roomId,
      }));
    },
  });

// roomId로 partition들 조회
export const fetchPartitionsByRoomIds = async roomIds => {
  const partitions = await Promise.all(
    roomIds.map(roomId => apiClient.get(`/partitions/rooms/${roomId}`)),
  );
  return partitions.flatMap(partition => partition.data.data.items);
};

export const usePartitionsByRoomIds = roomIds => {
  return useQuery({
    queryKey: ['partitionsByRoomIds', roomIds],
    queryFn: () => fetchPartitionsByRoomIds(roomIds),
    enabled: !!roomIds.length, // roomIds가 비어있지 않을 때만 쿼리 실행
  });
};

// 노쇼 횟수
const fetchNoShow = async () => {
  const noshow_res = await apiClient.get('/reservations/me/no-show');
  return noshow_res.data.data;
};

export const useNoShow = () => {
  return useQuery({
    queryKey: ['noShow'],
    queryFn: fetchNoShow,
  });
};

// 로그인 된 상태에서 비밀번호 수정
export const usePassword = () => {
  return useMutation({
    mutationFn: async ({ prePassword, newPassword }) => {
      try {
        const password_res = await apiClient.put('/users/me/password', {
          prePassword,
          newPassword,
        });
        return password_res.data;
      } catch (error) {
        // 에러 발생 시 에러 응답을 반환
        if (error.response && error.response.data) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    },
  });
};

// 로그아웃 상태에서 비밀번호 수정
export const useLoggedOutPassword = () => {
  return useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const loggedOutPW_res = await apiClient.post('/users/reset-password', {
        token,
        newPassword,
      });
      return loggedOutPW_res.data;
    },
  });
};

// 회원 가입
export const useSignUp = () => {
  return useMutation({
    mutationFn: async ({ username, password, serial, name, email }) => {
      const signUp_res = await apiClient.post('/users/sign-up', {
        username,
        password,
        serial,
        name,
        email,
      });
      return signUp_res.data;
    },
  });
};

// 이메일 전송
export const useEmailSend = () => {
  return useMutation({
    mutationFn: async username => {
      const email_res = await apiClient.post(
        `/auth/mail/send?username=${username}`,
      );
      return email_res.data.data;
    },
  });
};

// 이메일 검증
export const useEmailVerify = () => {
  return useMutation({
    mutationFn: async ({ email, verifyCode }) => {
      const verify_res = await apiClient.post('/auth/mail/verify', {
        email,
        verifyCode,
      });
      return verify_res.data;
    },
  });
};

// 모든 roomPolicy 조회
export const fetchAllPolicies = async () => {
  const all_policies_res = await apiClient.get('/policies');
  return all_policies_res.data;
};

export const useAllPolicies = () => {
  return useQuery({
    queryKey: ['allPolicies'],
    queryFn: fetchAllPolicies,
  });
};

// 스케줄 주입
export const useSchedules = () => {
  return useMutation({
    mutationFn: async ({
      roomIds,
      roomOperationPolicyId,
      policyApplicationDates,
    }) => {
      const schedules_policy = await apiClient.post('/schedules', {
        roomIds,
        roomOperationPolicyId,
        policyApplicationDates,
      });
      return schedules_policy.data;
    },
  });
};

// visited로 변경
export const useVisitedState = () => {
  return useMutation({
    mutationFn: async reservationId => {
      const changeState_res = await apiClient.patch(
        `/reservations/admin/${reservationId}`,
        {
          state: 'VISITED',
        },
      );
      return changeState_res.data;
    },
  });
};

// not_visited로 변경
export const useNotVisitedState = () => {
  return useMutation({
    mutationFn: async reservationId => {
      const changeState_res = await apiClient.patch(
        `/reservations/admin/${reservationId}`,
        {
          state: 'NOT_VISITED',
        },
      );
      return changeState_res.data;
    },
  });
};

// processed 변경
export const useProcessedState = () => {
  return useMutation({
    mutationFn: async reservationId => {
      const changeState_res = await apiClient.patch(
        `/reservations/admin/${reservationId}`,
        {
          state: 'PROCESSED',
        },
      );
      return changeState_res.data;
    },
  });
};

// [관리자] 블락당한 사용자들 조회
const fetchBlockedUser = async () => {
  const blockedUser_res = await apiClient.get('/users/blocked');
  return blockedUser_res.data.data.UserBlockedInfoResponses;
};

export const useBlockedUser = () => {
  return useQuery({
    queryKey: ['blockedUser'],
    queryFn: fetchBlockedUser,
  });
};

// [관리자] 블락 당한 사용자 블락 해제
export const useUnblocked = () => {
  return useMutation({
    mutationFn: async userId => {
      const unblocked_res = await apiClient.post(`/users/unblocked/${userId}`);
      return unblocked_res.data;
    },
  });
};

// [관리자] 학번으로 특정 회원 정보 조회
const fetchUserBySerial = async serial => {
  const userBySerial_res = await apiClient.get(
    `/users/search/by-serial?serial=${serial}`,
  );
  return userBySerial_res.data;
};

export const useUserBySerial = serial => {
  return useQuery({
    queryKey: ['userBySerial'],
    queryFn: () => fetchUserBySerial(serial),
    enabled: false,
  });
};

// [관리자] 이름으로 특정 회원 정보 조회
const fetchUserByName = async name => {
  const userByName_res = await apiClient.get(
    `/users/search/by-name?name=${name}`,
  );
  return userByName_res.data;
};

export const useUserByName = name => {
  return useQuery({
    queryKey: ['userByName'],
    queryFn: () => fetchUserByName(name),
    enabled: false,
  });
};

// [관리자] userId로 사용자의 예약들 조회
const fetchReservationsById = async userId => {
  const reservationById_res = await apiClient.get(
    `/reservations/admin/users/${userId}`,
  );
  return reservationById_res.data.data.reservationInfoResponses;
};

export const useReservationsById = userId => {
  return useQuery({
    queryKey: ['reservationsById'],
    queryFn: () => fetchReservationsById(userId),
  });
};

export const fetchBlockedPeriod = async () => {
  try {
    const blockedPreiod_res = await apiClient.get('/users/me/blocked-period');
    return blockedPreiod_res.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.warn('사용자가 블락 상태가 아님:', error.response.data.message);
      return undefined;
    }
  }
};

export const useBlockedPeriod = () => {
  return useQuery({
    queryKey: ['blockedPeriod'],
    queryFn: fetchBlockedPeriod,
  });
};

// 로그인 후, 자신의 이메일 수정 요청
export const useNewEmailSend = () => {
  return useMutation({
    mutationFn: async ({ password, newEmail }) => {
      const newEmailSend_res = await apiClient.post('/users/me/mail/send', {
        password,
        newEmail,
      });
      return newEmailSend_res.data;
    },
  });
};

// 로그인 후, 인증 코드 검증 후, 이메일 수정 처리
export const useNewEmailVerify = () => {
  return useMutation({
    mutationFn: async ({ email, verifyCode }) => {
      const newEmailVerify_res = await apiClient.post('/users/me/mail/verify', {
        email,
        verifyCode,
      });
      return newEmailVerify_res.data;
    },
  });
};
