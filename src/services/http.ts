/**
 * http.ts - HTTP 请求封装
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: '', // 使用相对路径，Vite 代理会处理
  timeout: 60000, // 60秒超时（AI 请求可能较慢）
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 未授权，可以跳转到登录页
      console.error('Unauthorized');
    }
    return Promise.reject(error);
  }
);

export { http };
export default http;
