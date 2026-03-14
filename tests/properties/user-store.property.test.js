/**
 * 用户状态管理属性测试
 * Feature: kiwi-hub-vue-frontend
 * 
 * 本测试文件验证以下属性：
 * - Property 2: 认证状态持久化与恢复（Session 机制）
 * - Property 6: 登出操作清除所有认证状态
 * 
 * 验证需求: 3.6, 3.7, 3.10, 18.5, 18.6
 * 
 * 注意：后端使用 Session 机制，无需管理 Token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import fc from 'fast-check'
import * as userApi from '@/api/user'

// Mock API 模块
vi.mock('@/api/user', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn()
}))

describe('用户状态管理属性测试', () => {
  beforeEach(() => {
    // 每次测试前重置 Pinia 实例
    setActivePinia(createPinia())
    // 重置所有 mock
    vi.clearAllMocks()
  })

  /**
   * Property 2: 认证状态持久化与恢复（Session 机制）
   * 
   * 对于任意登录会话，当用户成功登录后，应该标记登录状态为 true；
   * 当应用重新启动时，应该能够通过调用用户信息接口验证 Session 是否有效。
   * 
   * 验证需求: 3.6, 3.7, 18.5, 18.6
   */
  describe('Property 2: 认证状态持久化与恢复（Session 机制）', () => {
    it('对于任意有效的登录凭证，登录后应该标记登录状态并加载用户信息', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机用户信息
          fc.record({
            id: fc.uuid(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            profile: fc.record({
              avatarUrl: fc.webUrl(),
              bio: fc.string({ maxLength: 200 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
            })
          }),
          async (userInfo) => {
            // Mock 登录 API 返回（Session 机制下 data 为空对象）
            userApi.login.mockResolvedValue({
              data: {}
            })
            
            // Mock 获取用户信息 API 返回
            userApi.getCurrentUser.mockResolvedValue({
              data: userInfo
            })

            const store = useUserStore()

            // 执行登录操作
            await store.login({
              emailOrUsername: userInfo.email,
              password: 'test-password'
            })

            // 验证登录状态已标记
            expect(store.isLoggedIn).toBe(true)
            expect(store.isAuthenticated).toBe(true)

            // 验证用户信息已加载
            expect(store.userInfo).toEqual(userInfo)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意有效的 Session，应用启动时应该能够恢复登录状态', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机用户信息
          fc.record({
            id: fc.uuid(),
            username: fc.string({ minLength: 3, maxLength: 20 }),
            email: fc.emailAddress(),
            profile: fc.record({
              avatarUrl: fc.webUrl(),
              bio: fc.string({ maxLength: 200 })
            })
          }),
          async (userInfo) => {
            // Mock 获取用户信息 API 返回（验证 Session 有效性）
            userApi.getCurrentUser.mockResolvedValue({
              data: userInfo
            })

            // 创建新的 Store 实例（模拟应用重启）
            const store = useUserStore()

            // 调用 restoreAuth 恢复登录状态
            await store.restoreAuth()

            // 验证登录状态已恢复
            expect(store.isLoggedIn).toBe(true)
            expect(store.userInfo).toEqual(userInfo)
            expect(store.isAuthenticated).toBe(true)

            // 验证调用了用户信息接口
            expect(userApi.getCurrentUser).toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意失效的 Session，restoreAuth 应该清除本地状态', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机错误消息
          fc.string({ minLength: 1, maxLength: 100 }),
          async (errorMessage) => {
            // Mock 获取用户信息 API 返回 401 错误（Session 失效）
            userApi.getCurrentUser.mockRejectedValue(
              new Error(errorMessage)
            )

            const store = useUserStore()

            // 调用 restoreAuth
            await store.restoreAuth()

            // 验证失效 Session 导致状态被清除
            expect(store.isLoggedIn).toBe(false)
            expect(store.userInfo).toBeNull()
            expect(store.isAuthenticated).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意多次登录操作，登录状态应该正确更新', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成多个随机用户信息（模拟多次登录）
          fc.array(
            fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 }),
              email: fc.emailAddress()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (userInfoList) => {
            const store = useUserStore()

            for (const userInfo of userInfoList) {
              // Mock 登录 API
              userApi.login.mockResolvedValue({
                data: {}
              })

              // Mock 用户信息 API
              userApi.getCurrentUser.mockResolvedValue({
                data: userInfo
              })

              // 执行登录
              await store.login({
                emailOrUsername: userInfo.email,
                password: 'password'
              })

              // 验证登录状态正确
              expect(store.isLoggedIn).toBe(true)
              expect(store.userInfo).toEqual(userInfo)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 6: 登出操作清除所有认证状态
   * 
   * 对于任意登出操作，应该调用后端 logout 接口，清除 Pinia Store 中的
   * 用户信息，并将登录状态设置为 false。
   * 
   * 验证需求: 3.10
   */
  describe('Property 6: 登出操作清除所有认证状态', () => {
    it('对于任意已登录状态，登出应该清除所有认证状态', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机登录状态
          fc.record({
            userInfo: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 }),
              email: fc.emailAddress(),
              profile: fc.record({
                avatarUrl: fc.webUrl(),
                bio: fc.string({ maxLength: 200 }),
                tags: fc.array(fc.string(), { maxLength: 5 })
              }),
              socialStats: fc.record({
                articleCount: fc.nat({ max: 1000 }),
                followingCount: fc.nat({ max: 1000 }),
                followerCount: fc.nat({ max: 1000 })
              })
            })
          }),
          async (loginState) => {
            const store = useUserStore()

            // 设置已登录状态
            store.userInfo = loginState.userInfo
            store.isLoggedIn = true

            // 验证登录状态
            expect(store.isAuthenticated).toBe(true)

            // Mock 登出 API
            userApi.logout.mockResolvedValue({ data: null })

            // 执行登出操作
            await store.logout()

            // 验证所有认证状态已清除
            expect(store.userInfo).toBeNull()
            expect(store.isLoggedIn).toBe(false)
            expect(store.isAuthenticated).toBe(false)

            // 验证调用了登出 API
            expect(userApi.logout).toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意登出操作，即使后端 API 失败也应该清除本地状态', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机登录状态
          fc.record({
            userInfo: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 })
            })
          }),
          // 生成随机错误消息
          fc.string({ minLength: 1, maxLength: 100 }),
          async (loginState, errorMessage) => {
            const store = useUserStore()

            // 设置已登录状态
            store.userInfo = loginState.userInfo
            store.isLoggedIn = true

            // Mock 登出 API 失败
            userApi.logout.mockRejectedValue(new Error(errorMessage))

            // 执行登出操作（不应该抛出异常）
            await expect(store.logout()).resolves.not.toThrow()

            // 验证即使 API 失败，本地状态也已清除
            expect(store.userInfo).toBeNull()
            expect(store.isLoggedIn).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意登出操作，应该清除所有用户相关的 getters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机用户信息
          fc.record({
            userInfo: fc.record({
              username: fc.string({ minLength: 3, maxLength: 20 }),
              profile: fc.record({
                avatarUrl: fc.webUrl()
              })
            })
          }),
          async (loginState) => {
            const store = useUserStore()

            // 设置已登录状态
            store.userInfo = loginState.userInfo
            store.isLoggedIn = true

            // 验证 getters 有值
            expect(store.username).toBe(loginState.userInfo.username)
            expect(store.avatar).toBe(loginState.userInfo.profile.avatarUrl)
            expect(store.isAuthenticated).toBe(true)

            // Mock 登出 API
            userApi.logout.mockResolvedValue({ data: null })

            // 执行登出
            await store.logout()

            // 验证所有 getters 已清空
            expect(store.username).toBe('')
            expect(store.avatar).toBe('')
            expect(store.isAuthenticated).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意连续的登录-登出操作序列，状态应该正确切换', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的登录-登出操作序列
          fc.array(
            fc.record({
              action: fc.constantFrom('login', 'logout'),
              userInfo: fc.record({
                id: fc.uuid(),
                username: fc.string({ minLength: 3 })
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (operations) => {
            const store = useUserStore()

            for (const op of operations) {
              if (op.action === 'login') {
                // Mock 登录 API
                userApi.login.mockResolvedValue({
                  data: {}
                })
                userApi.getCurrentUser.mockResolvedValue({
                  data: op.userInfo
                })

                await store.login({
                  emailOrUsername: 'test@example.com',
                  password: 'password'
                })

                // 验证登录状态
                expect(store.isLoggedIn).toBe(true)
                expect(store.userInfo).toEqual(op.userInfo)
              } else {
                // Mock 登出 API
                userApi.logout.mockResolvedValue({ data: null })

                await store.logout()

                // 验证登出状态
                expect(store.isLoggedIn).toBe(false)
                expect(store.userInfo).toBeNull()
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
