import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import axios from 'axios';
import { authState } from './authState';

const useAuth = () => {
  const [auth, setAuth] = useRecoilState(authState);

  const isTokenValid = token => token !== 'undefined' && token !== null;

  const loggedIn = auth.isAuthenticated;

  const login = useCallback(async ({ id, password }) => {
    try {
      const response = await axios.post(
        'https://api.studyroom.computer.hufs.ac.kr/auth/login',
        {
          username: id,
          password: password,
        }
      );
      const access_token = response.data.data.access_token;
      const refresh_token = response.data.data.refresh_token;

      if (!isTokenValid(access_token) || !isTokenValid(refresh_token)) {
        throw new Error('유효하지 않는 토큰');
      }

      setAuth({
        isAuthenticated: true,
        accessToken: access_token,
        refreshToken: refresh_token,
      });

      return true; // 성공 시 true 반환
    } catch (error) {
      throw new Error(error.response?.data?.errorMessage || '로그인에 실패했습니다.');
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    setAuth({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
    // navigate('/login'); // 리다이렉트가 필요하다면 사용
  }, [setAuth]);

  return { ...auth, loggedIn, login, logout };
};

export default useAuth;
