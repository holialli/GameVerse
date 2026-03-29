import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config?._retry) {
      try {
        err.config._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const nextAccessToken = refreshResponse?.data?.accessToken;
        const nextRefreshToken = refreshResponse?.data?.refreshToken;
        if (nextAccessToken) {
          localStorage.setItem('accessToken', nextAccessToken);
          err.config.headers = err.config.headers || {};
          err.config.headers.Authorization = `Bearer ${nextAccessToken}`;
        }
        if (nextRefreshToken) {
          localStorage.setItem('refreshToken', nextRefreshToken);
        }

        return axiosInstance(err.config);
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
