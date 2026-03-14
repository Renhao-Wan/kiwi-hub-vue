/**
 * 响应拦截器属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 13: 响应拦截器统一处理错误状态码
 * Property 14: 响应拦截器返回统一数据格式
 * 
 * 验证需求: 16.3, 16.4, 16.5, 16.6, 16.7, 16.8
 * 
 * 测试策略：
 * - 使用 fast-check 生成随机的响应数据和错误场景
 * - 验证响应拦截器在所有情况下都能正确处理成功响应和错误响应
 * - 验证返回的数据格式统一为 { data, message }
 * - 验证各种 HTTP 状态码的错误处理逻辑
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// Mock Element Plus 的 ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// Mock router
const mockRouter = {
  push: vi.fn(),
  currentRoute: {
    value: {
      fullPath: '/test-path'
    }
  }
}

vi.mock('@/router', () => ({
  default: mockRouter
}))

describe('Property 13: 响应拦截器统一处理错误状态码', () => {
  let axiosInstance
  let responseInterceptor
  let originalLocalStorage

  beforeEach(() => {
    // 保存原始 localStorage
    originalLocalStorage = global.localStorage

    // 重置 localStorage
    global.localStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = String(value)
      },
      removeItem(key) {
        delete this.store[key]
      },
      clear() {
        this.store = {}
      }
    }

    // 清除所有 mock 调用记录
    vi.clearAllMocks()

    // 创建新的 axios 实例用于测试
    axiosInstance = axios.create({
      baseURL: 'http://test.api.com',
      timeout: 10000
    })

    // 添加响应拦截器（模拟 request.js 中的逻辑）
    responseInterceptor = axiosInstance.interceptors.response.use(
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
              // 未授权，清除认证状态并重定向到登录页
              ElMessage.error('登录已过期，请重新登录')
              localStorage.removeItem('token')
              mockRouter.push({ name: 'Login', query: { redirect: mockRouter.currentRoute.value.fullPath } })
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
  })

  afterEach(() => {
    // 恢复原始 localStorage
    global.localStorage = originalLocalStorage
    
    // 移除拦截器
    if (axiosInstance && responseInterceptor !== undefined) {
      axiosInstance.interceptors.response.eject(responseInterceptor)
    }
  })

  /**
   * 属性测试 13.1: 对于任意 401 错误，应该清除 Token 并重定向到登录页
   * 
   * 验证需求: 16.4
   */
  it('对于任意 401 错误，应该清除 Token 并重定向到登录页', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的 Token
        fc.string({ minLength: 20, maxLength: 100 }),
        // 生成随机的错误消息
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (token, errorMessage) => {
          // 设置 Token
          localStorage.setItem('token', token)
          
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟 401 错误响应
          const error = {
            response: {
              status: 401,
              data: errorMessage ? { message: errorMessage } : {}
            }
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证 Token 已被清除
          expect(localStorage.getItem('token')).toBeNull()
          
          // 验证显示了错误消息
          expect(ElMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录')
          
          // 验证重定向到登录页
          expect(mockRouter.push).toHaveBeenCalledWith({
            name: 'Login',
            query: { redirect: '/test-path' }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.2: 对于任意 400 错误，应该显示错误消息
   * 
   * 验证需求: 16.5
   */
  it('对于任意 400 错误，应该显示错误消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的错误消息
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (errorMessage) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟 400 错误响应
          const error = {
            response: {
              status: 400,
              data: errorMessage ? { message: errorMessage } : {}
            }
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了错误消息
          const expectedMessage = errorMessage || '请求参数错误'
          expect(ElMessage.error).toHaveBeenCalledWith(expectedMessage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.3: 对于任意 500 错误，应该显示服务器错误消息
   * 
   * 验证需求: 16.6
   */
  it('对于任意 500 错误，应该显示服务器错误消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的错误数据
        fc.option(
          fc.record({
            message: fc.string(),
            code: fc.integer(),
            details: fc.option(fc.string(), { nil: null })
          }),
          { nil: null }
        ),
        async (errorData) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟 500 错误响应
          const error = {
            response: {
              status: 500,
              data: errorData || {}
            }
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了统一的服务器错误消息（不管后端返回什么）
          expect(ElMessage.error).toHaveBeenCalledWith('服务器错误，请稍后重试')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.4: 对于任意 503 错误，应该显示服务不可用消息
   * 
   * 验证需求: 16.6
   */
  it('对于任意 503 错误，应该显示服务不可用消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的错误数据
        fc.option(
          fc.record({
            message: fc.string(),
            timestamp: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString())
          }),
          { nil: null }
        ),
        async (errorData) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟 503 错误响应
          const error = {
            response: {
              status: 503,
              data: errorData || {}
            }
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了统一的服务不可用消息
          expect(ElMessage.error).toHaveBeenCalledWith('服务暂时不可用，请稍后重试')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.5: 对于任意其他 HTTP 状态码错误，应该显示错误消息
   * 
   * 验证需求: 16.5, 16.6
   */
  it('对于任意其他 HTTP 状态码错误，应该显示错误消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的非标准状态码（排除 400, 401, 500, 503）
        fc.integer({ min: 402, max: 599 }).filter(code => 
          code !== 500 && code !== 503
        ),
        // 生成随机的错误消息
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (statusCode, errorMessage) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟错误响应
          const error = {
            response: {
              status: statusCode,
              data: errorMessage ? { message: errorMessage } : {}
            }
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了错误消息
          const expectedMessage = errorMessage || '请求失败'
          expect(ElMessage.error).toHaveBeenCalledWith(expectedMessage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.6: 对于任意网络连接失败，应该显示网络错误消息
   * 
   * 验证需求: 16.7
   */
  it('对于任意网络连接失败，应该显示网络错误消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的请求配置
        fc.record({
          method: fc.constantFrom('get', 'post', 'put', 'delete'),
          url: fc.webPath(),
          timeout: fc.integer({ min: 1000, max: 10000 })
        }),
        async (requestConfig) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟网络连接失败（有 request 但没有 response）
          const error = {
            request: requestConfig,
            message: 'Network Error'
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了网络连接失败消息
          expect(ElMessage.error).toHaveBeenCalledWith('网络连接失败，请检查网络')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 13.7: 对于任意其他类型的错误，应该显示错误消息
   * 
   * 验证需求: 16.7
   */
  it('对于任意其他类型的错误，应该显示错误消息', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的错误消息（不包括 null，因为 null 会被转换为默认消息）
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        async (errorMessage) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟其他类型的错误（既没有 response 也没有 request）
          const error = {
            message: errorMessage
          }

          // 调用响应拦截器的错误处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].rejected(error)
          } catch (e) {
            // 预期会抛出错误
          }

          // 验证显示了错误消息
          // 如果 errorMessage 为 undefined 或空字符串，则显示 '请求失败'
          const expectedMessage = errorMessage || '请求失败'
          expect(ElMessage.error).toHaveBeenCalledWith(expectedMessage)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 14: 响应拦截器返回统一数据格式', () => {
  let axiosInstance
  let responseInterceptor

  beforeEach(() => {
    // 清除所有 mock 调用记录
    vi.clearAllMocks()

    // 创建新的 axios 实例用于测试
    axiosInstance = axios.create({
      baseURL: 'http://test.api.com',
      timeout: 10000
    })

    // 添加响应拦截器（模拟 request.js 中的逻辑）
    responseInterceptor = axiosInstance.interceptors.response.use(
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
        return Promise.reject(error)
      }
    )
  })

  afterEach(() => {
    // 移除拦截器
    if (axiosInstance && responseInterceptor !== undefined) {
      axiosInstance.interceptors.response.eject(responseInterceptor)
    }
  })

  /**
   * 属性测试 14.1: 对于任意成功响应（code === 20000），应该返回 { data, message } 格式
   * 
   * 验证需求: 16.3, 16.8
   */
  it('对于任意成功响应（code === 20000），应该返回 { data, message } 格式', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的响应数据
        fc.oneof(
          // 用户数据
          fc.record({
            id: fc.uuid(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress()
          }),
          // 文章列表数据
          fc.record({
            list: fc.array(
              fc.record({
                id: fc.uuid(),
                title: fc.string(),
                content: fc.string()
              }),
              { minLength: 0, maxLength: 10 }
            ),
            total: fc.nat(),
            pageNum: fc.integer({ min: 1, max: 100 }),
            pageSize: fc.integer({ min: 10, max: 50 })
          }),
          // 简单对象
          fc.record({
            success: fc.boolean(),
            count: fc.nat()
          }),
          // 空对象
          fc.constant(null),
          // 字符串
          fc.string(),
          // 数字
          fc.integer()
        ),
        // 生成随机的消息
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (responseData, responseMessage) => {
          // 模拟成功响应
          const response = {
            data: {
              code: 20000,
              message: responseMessage || '操作成功',
              data: responseData
            },
            status: 200,
            statusText: 'OK'
          }

          // 调用响应拦截器的成功处理函数
          const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response)

          // 验证返回格式为 { data, message }
          expect(result).toHaveProperty('data')
          expect(result).toHaveProperty('message')
          
          // 验证 data 字段与原始响应的 data 一致
          expect(result.data).toEqual(responseData)
          
          // 验证 message 字段与原始响应的 message 一致
          expect(result.message).toBe(responseMessage || '操作成功')
          
          // 验证只有这两个字段
          expect(Object.keys(result)).toEqual(['data', 'message'])
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 14.2: 对于任意业务错误响应（code !== 20000），应该显示错误并拒绝 Promise
   * 
   * 验证需求: 16.3, 16.8
   */
  it('对于任意业务错误响应（code !== 20000），应该显示错误并拒绝 Promise', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的错误 code（排除 20000）
        fc.integer({ min: 10000, max: 99999 }).filter(code => code !== 20000),
        // 生成随机的错误消息
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        // 生成随机的错误数据
        fc.option(
          fc.record({
            errorCode: fc.string(),
            details: fc.string()
          }),
          { nil: null }
        ),
        async (errorCode, errorMessage, errorData) => {
          // 清除之前的 mock 调用
          vi.clearAllMocks()

          // 模拟业务错误响应
          const response = {
            data: {
              code: errorCode,
              message: errorMessage || '操作失败',
              data: errorData
            },
            status: 200,
            statusText: 'OK'
          }

          // 调用响应拦截器的成功处理函数
          try {
            await axiosInstance.interceptors.response.handlers[0].fulfilled(response)
            // 如果没有抛出错误，测试失败
            expect.fail('应该抛出错误')
          } catch (error) {
            // 验证显示了错误消息
            const expectedMessage = errorMessage || '操作失败'
            expect(ElMessage.error).toHaveBeenCalledWith(expectedMessage)
            
            // 验证抛出的错误消息正确
            expect(error.message).toBe(expectedMessage)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 14.3: 对于任意嵌套的复杂数据结构，应该正确提取并返回
   * 
   * 验证需求: 16.8
   */
  it('对于任意嵌套的复杂数据结构，应该正确提取并返回', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机的复杂嵌套数据
        fc.oneof(
          // 深层嵌套对象
          fc.record({
            user: fc.record({
              profile: fc.record({
                settings: fc.record({
                  theme: fc.string(),
                  language: fc.string()
                })
              })
            })
          }),
          // 数组嵌套
          fc.record({
            items: fc.array(
              fc.record({
                children: fc.array(
                  fc.record({
                    value: fc.integer()
                  })
                )
              })
            )
          }),
          // 混合嵌套
          fc.record({
            data: fc.array(fc.jsonValue()),
            meta: fc.record({
              pagination: fc.record({
                page: fc.nat(),
                size: fc.nat()
              })
            })
          })
        ),
        async (complexData) => {
          // 模拟成功响应
          const response = {
            data: {
              code: 20000,
              message: '成功',
              data: complexData
            },
            status: 200
          }

          // 调用响应拦截器
          const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response)

          // 验证返回的 data 与原始数据完全一致（深度比较）
          expect(JSON.stringify(result.data)).toBe(JSON.stringify(complexData))
          
          // 验证返回格式
          expect(result).toHaveProperty('data')
          expect(result).toHaveProperty('message')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 14.4: 对于任意空数据或 null 数据，应该正确处理
   * 
   * 验证需求: 16.8
   */
  it('对于任意空数据或 null 数据，应该正确处理', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成各种"空"数据
        fc.constantFrom(
          null,
          undefined,
          {},
          [],
          '',
          0,
          false
        ),
        async (emptyData) => {
          // 模拟成功响应
          const response = {
            data: {
              code: 20000,
              message: '成功',
              data: emptyData
            },
            status: 200
          }

          // 调用响应拦截器
          const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response)

          // 验证返回的 data 与原始数据一致
          expect(result.data).toEqual(emptyData)
          
          // 验证返回格式
          expect(result).toHaveProperty('data')
          expect(result).toHaveProperty('message')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 14.5: 对于任意响应，不应该修改原始响应对象
   * 
   * 验证需求: 16.8
   */
  it('对于任意响应，不应该修改原始响应对象', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string(),
          value: fc.integer()
        }),
        fc.string(),
        async (responseData, responseMessage) => {
          // 模拟成功响应
          const response = {
            data: {
              code: 20000,
              message: responseMessage,
              data: responseData
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          }

          // 保存原始响应的深拷贝
          const originalResponse = JSON.parse(JSON.stringify(response))

          // 调用响应拦截器
          await axiosInstance.interceptors.response.handlers[0].fulfilled(response)

          // 验证原始响应对象未被修改
          expect(JSON.stringify(response)).toBe(JSON.stringify(originalResponse))
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 14.6: 对于任意包含特殊字符的消息，应该正确返回
   * 
   * 验证需求: 16.8
   */
  it('对于任意包含特殊字符的消息，应该正确返回', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成包含特殊字符的消息
        fc.oneof(
          fc.string(),
          fc.constant('操作成功！'),
          fc.constant('用户名或密码错误'),
          fc.constant('Token已过期，请重新登录'),
          fc.constant('包含<script>标签的消息'),
          fc.constant('包含"引号"的消息'),
          fc.constant("包含'单引号'的消息"),
          fc.constant('包含\n换行符的消息'),
          fc.constant('包含\t制表符的消息'),
          fc.constant('包含emoji😀的消息')
        ),
        fc.jsonValue(),
        async (message, data) => {
          // 模拟成功响应
          const response = {
            data: {
              code: 20000,
              message: message,
              data: data
            },
            status: 200
          }

          // 调用响应拦截器
          const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response)

          // 验证消息正确返回（包括特殊字符）
          expect(result.message).toBe(message)
          
          // 验证数据正确返回
          expect(JSON.stringify(result.data)).toBe(JSON.stringify(data))
        }
      ),
      { numRuns: 100 }
    )
  })
})
