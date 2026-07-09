import axios from 'axios'
import authConfig from 'src/configs/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
})

// Add global interceptor to inject Authorization header
api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

export default api
