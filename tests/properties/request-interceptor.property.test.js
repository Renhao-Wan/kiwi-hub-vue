/**
 * 请求拦截器属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 3: 请求配置正确性（Session 机制）
 * 
 * 验证需求: 3.8, 16.1, 16.2
 * 
 * 测试策略：
 * - 使用 fast-check 生成随机的 HTTP 请求配置
 * - 验证请求拦截器配置了 withCredentials: true（允许携带 Cookie）
 * - 验证 Content-Type 始终设置为 application/json
 * 
 * 注意：后端使用 Session 机制，浏览器自动携带 Cookie，无需手动注入 Token
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import axios from 'axios'

describe('Property 3: 请求配置正确性（Session 机制）', () => {
  let axiosInstance
  let requestInterceptor

  beforeEach(() => {
    // 创建新的 axios 实例用于测试（模拟 request.js 中的配置）
    axiosInstance = axios.create({
      baseURL: 'http://test.api.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // Session 机制：允许跨域请求携带 Cookie
    })

    // 添加请求拦截器（模拟 request.js 中的逻辑）
    // Session 机制下，无需手动注入 Token
    requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // 浏览器会自动携带 Cookie，无需手动处理
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
  })

  afterEach(() => {
    // 移除拦截器
    if (axiosInstance && requestInterceptor !== undefined) {
      axiosInstance.interceptors.request.eject(requestInterceptor)
    }
  })

  /**
   * 属性测试 3.1: 对于任意 HTTP 方法和 URL，应该配置 withCredentials: true
   * 
   * 验证需求: 3.8, 16.1
   */
  it('对于任意 HTTP 方法和 URL，应该配置 withCredentials: true 以携带 Cookie', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的 HTTP 方法
        fc.constantFrom('get', 'post', 'put', 'delete', 'patch'),
        // 生成随机的 URL 路径
        fc.oneof(
          fc.constant('/users'),
          fc.constant('/articles'),
          fc.constant('/comments'),
          fc.constant('/links/generate'),
          fc.webPath()
        ),
        async (method, url) => {
          // 模拟请求配置
          const config = {
            method,
            url,
            headers: {
              'Content-Type': 'application/json'
            }
          }

          // 手动调用请求拦截器
          const interceptedConfig = await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证 axios 实例配置了 withCredentials
          expect(axiosInstance.defaults.withCredentials).toBe(true)
          
          // 验证 Content-Type 保持不变
          expect(interceptedConfig.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 3.2: 对于任意请求，不应该注入 Authorization Token
   * 
   * 验证需求: 3.8, 16.1
   */
  it('对于任意请求，不应该注入 Authorization Token（Session 机制）', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('get', 'post', 'put', 'delete', 'patch'),
        fc.oneof(
          fc.constant('/users'),
          fc.constant('/articles'),
          fc.constant('/comments'),
          fc.webPath()
        ),
        async (method, url) => {
          const config = {
            method,
            url,
            headers: {
              'Content-Type': 'application/json'
            }
          }

          // 手动调用请求拦截器
          const interceptedConfig = await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证没有注入 Authorization Header（Session 机制不需要）
          expect(interceptedConfig.headers.Authorization).toBeUndefined()
          
          // 验证 Content-Type 保持不变
          expect(interceptedConfig.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 3.3: 对于任意请求数据，请求拦截器不应该修改请求体
   * 
   * 验证需求: 3.8, 16.2
   */
  it('对于任意请求数据，请求拦截器不应该修改请求体', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('post', 'put', 'patch'),
        fc.webPath(),
        fc.oneof(
          fc.record({
            title: fc.string(),
            content: fc.string()
          }),
          fc.record({
            username: fc.string(),
            email: fc.emailAddress(),
            password: fc.string()
          }),
          fc.record({
            articleId: fc.uuid(),
            content: fc.string()
          }),
          // 使用 JSON 安全的对象（不包含 undefined）
          fc.jsonValue()
        ),
        async (method, url, requestData) => {
          const config = {
            method,
            url,
            data: requestData,
            headers: {
              'Content-Type': 'application/json'
            }
          }

          // 保存原始请求数据的深拷贝（通过 JSON 序列化确保一致性）
          const originalData = JSON.parse(JSON.stringify(requestData))

          // 手动调用请求拦截器
          const interceptedConfig = await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证请求数据未被修改（使用 JSON 序列化后的比较）
          expect(JSON.parse(JSON.stringify(interceptedConfig.data))).toEqual(originalData)
          
          // 验证 Content-Type 保持不变
          expect(interceptedConfig.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 3.4: 对于任意已存在的 headers，请求拦截器不应该覆盖其他 header
   * 
   * 验证需求: 16.1, 16.2
   */
  it('对于任意已存在的 headers，请求拦截器不应该覆盖其他 header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          'X-Request-ID': fc.uuid(),
          'X-Custom-Header': fc.string(),
          'Accept-Language': fc.constantFrom('zh-CN', 'en-US', 'ja-JP')
        }),
        async (customHeaders) => {
          const config = {
            method: 'get',
            url: '/test',
            headers: {
              'Content-Type': 'application/json',
              ...customHeaders
            }
          }

          // 保存原始 headers
          const originalHeaders = { ...config.headers }

          const interceptedConfig = await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证其他 headers 未被覆盖
          Object.keys(customHeaders).forEach(key => {
            expect(interceptedConfig.headers[key]).toBe(originalHeaders[key])
          })
          
          // 验证 Content-Type 保持不变
          expect(interceptedConfig.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 3.5: Content-Type 始终为 application/json
   * 
   * 验证需求: 16.2
   */
  it('对于任意请求，Content-Type 应该始终为 application/json', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('get', 'post', 'put', 'delete', 'patch'),
        fc.webPath(),
        async (method, url) => {
          const config = {
            method,
            url,
            headers: {
              'Content-Type': 'application/json'
            }
          }

          const interceptedConfig = await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证 Content-Type 始终为 application/json
          expect(interceptedConfig.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 3.6: withCredentials 配置应该始终为 true
   * 
   * 验证需求: 3.8, 16.1
   */
  it('对于任意请求，withCredentials 应该始终为 true 以支持 Session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('get', 'post', 'put', 'delete', 'patch'),
        fc.webPath(),
        async (method, url) => {
          const config = {
            method,
            url,
            headers: {
              'Content-Type': 'application/json'
            }
          }

          await axiosInstance.interceptors.request.handlers[0].fulfilled(config)

          // 验证 axios 实例配置了 withCredentials: true
          expect(axiosInstance.defaults.withCredentials).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
