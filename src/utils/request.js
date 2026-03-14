/**
 * Axios 请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 * 注意：后端使用 Session 机制，浏览器自动携带 Cookie，无需手动注入 Token
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 创建 Axios 实例
 * 配置基础参数：baseURL、timeout、默认 headers
 * withCredentials: true 确保跨域请求携带 Cookie
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许跨域请求携带 Cookie（Session ID）
})

/**
 * 请求拦截器
 * 设置 Content-Type 为 application/json
 * 注意：无需手动注入 Token，浏览器会自动携带 Cookie
 */
request.interceptors.request.use(
  (config) => {
    // Session 机制下，浏览器会自动携带 Cookie
    // 无需手动注入 Authorization Token
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 统一处理成功响应和错误响应
 * 返回统一数据格式 { data, message }
 */
request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    
    // 成功响应（code === 20000）
    if (code === 20000) {
      return { data, message }
    }
    
    // 业务错误（code !== 20000）
    ElMessage.error(message || '操作失败')
    return Promise.reject(new Error(message || '操作失败'))
  },
  (error) => {
    // 网络错误或 HTTP 状态码错误
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，Session 失效，重定向到登录页
          ElMessage.error('登录已过期，请重新登录')
          
          // 动态导入 router 避免循环依赖
          import('@/router').then(({ default: router }) => {
            router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          })
          break
          
        case 400:
          // 请求参数错误
          ElMessage.error(data?.message || '请求参数错误')
          break
          
        case 500:
          // 服务器内部错误
          ElMessage.error('服务器错误，请稍后重试')
          break
          
        case 503:
          // 服务不可用
          ElMessage.error('服务暂时不可用，请稍后重试')
          break
          
        default:
          // 其他错误
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      // 网络连接失败
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      // 其他错误
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
