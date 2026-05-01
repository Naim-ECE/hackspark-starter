import axios from 'axios'
import { mockRequest } from './mocks'

const BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8000'
const MOCK = (import.meta.env.VITE_MOCK_API || 'false').toLowerCase() === 'true'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})

// Export an object that mimics axios methods but uses mocks when enabled
const api = {
  get(url, config) {
    if (MOCK) return mockRequest('get', url, config)
    return axiosInstance.get(url, config)
  },
  post(url, data, config) {
    if (MOCK) return mockRequest('post', url, { data, ...config })
    return axiosInstance.post(url, data, config)
  },
  put(url, data, config) {
    if (MOCK) return mockRequest('put', url, { data, ...config })
    return axiosInstance.put(url, data, config)
  },
  delete(url, config) {
    if (MOCK) return mockRequest('delete', url, config)
    return axiosInstance.delete(url, config)
  },
  // allow direct access to the instance for advanced use
  _instance: axiosInstance,
}

export default api
