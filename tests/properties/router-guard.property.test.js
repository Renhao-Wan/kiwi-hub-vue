/**
 * 路由守卫属性测试
 * Feature: kiwi-hub-vue-frontend
 * 
 * 本测试文件验证以下属性：
 * - Property 4: 未登录访问受保护资源触发重定向
 * - Property 5: 已登录用户访问登录页重定向到首页
 * 
 * 验证需求: 3.9, 19.4, 19.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import fc from 'fast-check'

describe('路由守卫属性测试', () => {
  let router
  let userStore

  /**
   * 创建测试用路由实例
   * 包含需要认证和不需要认证的路由
   */
  const createTestRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'Home',
          component: { template: '<div>Home</div>' },
          meta: { requiresAuth: false }
        },
        {
          path: '/profile',
          name: 'Profile',
          component: { template: '<div>Profile</div>' },
          meta: { requiresAuth: true }
        },
        {
          path: '/short-link',
          name: 'ShortLink',
          component: { template: '<div>ShortLink</div>' },
          meta: { requiresAuth: true }
        },
        {
          path: '/login',
          name: 'Login',
          component: { template: '<div>Login</div>' },
          meta: { requiresAuth: false }
        },
        {
          path: '/register',
          name: 'Register',
          component: { template: '<div>Register</div>' },
          meta: { requiresAuth: false }
        },
        {
          path: '/article/:id',
          name: 'ArticleDetail',
          component: { template: '<div>Article</div>' },
          meta: { requiresAuth: false }
        }
      ]
    })
  }

  /**
   * 添加导航守卫到路由实例
   */
  const addNavigationGuard = (router, userStore) => {
    router.beforeEach((to, from, next) => {
      // 检查需要认证的路由
      if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }

      // 已登录用户访问登录页或注册页，重定向到首页
      if ((to.name === 'Login' || to.name === 'Register') && userStore.isLoggedIn) {
        next({ name: 'Home' })
        return
      }

      next()
    })
  }

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    userStore = useUserStore()

    // 创建路由实例
    router = createTestRouter()

    // 添加导航守卫
    addNavigationGuard(router, userStore)
  })

  /**
   * Property 4: 未登录访问受保护资源触发重定向
   * 
   * 对于任意需要认证的路由或操作（个人主页、短链接工具、发布文章、点赞、评论），
   * 当用户未登录时，应该重定向到登录页面或唤起登录弹窗。
   * 
   * 验证需求: 3.9, 19.4
   */
  describe('Property 4: 未登录访问受保护资源触发重定向', () => {
    it('对于任意需要认证的路由，未登录用户应该被重定向到登录页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成需要认证的路由名称
          fc.constantFrom('Profile', 'ShortLink'),
          async (routeName) => {
            // 确保用户未登录
            userStore.isLoggedIn = false
            userStore.token = ''

            // 尝试访问受保护的路由
            await router.push({ name: routeName })

            // 验证被重定向到登录页
            expect(router.currentRoute.value.name).toBe('Login')
            
            // 验证 redirect 参数包含原始目标路径
            expect(router.currentRoute.value.query.redirect).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意需要认证的路由路径，未登录用户应该被重定向到登录页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成需要认证的路由路径
          fc.constantFrom('/profile', '/short-link'),
          async (routePath) => {
            // 确保用户未登录
            userStore.isLoggedIn = false
            userStore.token = ''
            userStore.userInfo = null

            // 尝试访问受保护的路由
            await router.push(routePath)

            // 验证被重定向到登录页
            expect(router.currentRoute.value.name).toBe('Login')
            
            // 验证 redirect 查询参数保存了原始路径
            expect(router.currentRoute.value.query.redirect).toBe(routePath)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意带参数的受保护路由，未登录用户应该被重定向并保留完整路径', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机查询参数
          fc.record({
            tab: fc.constantFrom('articles', 'following', 'followers'),
            page: fc.nat({ max: 100 })
          }),
          async (queryParams) => {
            // 确保用户未登录
            userStore.isLoggedIn = false

            // 尝试访问带查询参数的受保护路由
            await router.push({ 
              name: 'Profile', 
              query: queryParams 
            })

            // 验证被重定向到登录页
            expect(router.currentRoute.value.name).toBe('Login')
            
            // 验证 redirect 参数包含完整路径（包括查询参数）
            const redirectPath = router.currentRoute.value.query.redirect
            expect(redirectPath).toContain('/profile')
            expect(redirectPath).toContain(`tab=${queryParams.tab}`)
            expect(redirectPath).toContain(`page=${queryParams.page}`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意未登录状态，访问受保护路由应该始终触发重定向', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的未登录状态（token 为空或 isLoggedIn 为 false）
          fc.record({
            token: fc.constantFrom('', null, undefined),
            isLoggedIn: fc.constant(false),
            userInfo: fc.constantFrom(null, undefined)
          }),
          // 生成需要认证的路由
          fc.constantFrom('Profile', 'ShortLink'),
          async (userState, routeName) => {
            // 设置未登录状态
            userStore.token = userState.token || ''
            userStore.isLoggedIn = userState.isLoggedIn
            userStore.userInfo = userState.userInfo

            // 尝试访问受保护路由
            await router.push({ name: routeName })

            // 验证被重定向到登录页
            expect(router.currentRoute.value.name).toBe('Login')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意公开路由，未登录用户应该可以正常访问', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成公开路由名称
          fc.constantFrom('Home', 'ArticleDetail', 'Login', 'Register'),
          async (routeName) => {
            // 确保用户未登录
            userStore.isLoggedIn = false
            userStore.token = ''

            // 访问公开路由
            if (routeName === 'ArticleDetail') {
              // ArticleDetail 需要 id 参数
              await router.push({ name: routeName, params: { id: '123' } })
            } else {
              await router.push({ name: routeName })
            }

            // 验证成功访问，没有被重定向
            expect(router.currentRoute.value.name).toBe(routeName)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 5: 已登录用户访问登录页重定向到首页
   * 
   * 对于任意已登录用户，当尝试访问登录页面时，应该自动重定向到首页。
   * 
   * 验证需求: 19.5
   */
  describe('Property 5: 已登录用户访问登录页重定向到首页', () => {
    it('对于任意已登录状态，访问登录页应该重定向到首页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            userInfo: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 }),
              email: fc.emailAddress()
            })
          }),
          async (loginState) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.userInfo = loginState.userInfo
            userStore.isLoggedIn = true

            // 尝试访问登录页
            await router.push({ name: 'Login' })

            // 验证被重定向到首页
            expect(router.currentRoute.value.name).toBe('Home')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意已登录状态，访问注册页应该重定向到首页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            isLoggedIn: fc.constant(true)
          }),
          async (loginState) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.isLoggedIn = loginState.isLoggedIn

            // 尝试访问注册页
            await router.push({ name: 'Register' })

            // 验证被重定向到首页
            expect(router.currentRoute.value.name).toBe('Home')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意已登录状态，访问登录页或注册页都应该重定向到首页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            userInfo: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 })
            })
          }),
          // 生成登录或注册页
          fc.constantFrom('Login', 'Register'),
          async (loginState, authPage) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.userInfo = loginState.userInfo
            userStore.isLoggedIn = true

            // 尝试访问认证页面
            await router.push({ name: authPage })

            // 验证被重定向到首页
            expect(router.currentRoute.value.name).toBe('Home')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意已登录状态，访问其他公开路由应该正常访问', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            isLoggedIn: fc.constant(true)
          }),
          // 生成其他公开路由（排除登录和注册页）
          fc.constantFrom('Home', 'ArticleDetail'),
          async (loginState, routeName) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.isLoggedIn = loginState.isLoggedIn

            // 访问公开路由
            if (routeName === 'ArticleDetail') {
              await router.push({ name: routeName, params: { id: '123' } })
            } else {
              await router.push({ name: routeName })
            }

            // 验证成功访问，没有被重定向
            expect(router.currentRoute.value.name).toBe(routeName)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意已登录状态，访问受保护路由应该正常访问', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            userInfo: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 })
            })
          }),
          // 生成受保护路由
          fc.constantFrom('Profile', 'ShortLink'),
          async (loginState, routeName) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.userInfo = loginState.userInfo
            userStore.isLoggedIn = true

            // 访问受保护路由
            await router.push({ name: routeName })

            // 验证成功访问
            expect(router.currentRoute.value.name).toBe(routeName)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('对于任意带查询参数的登录页访问，已登录用户应该被重定向到首页', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的已登录状态
          fc.record({
            token: fc.string({ minLength: 20, maxLength: 100 }),
            isLoggedIn: fc.constant(true)
          }),
          // 生成随机查询参数
          fc.record({
            redirect: fc.constantFrom('/profile', '/short-link', '/article/123'),
            from: fc.constantFrom('header', 'sidebar', 'popup')
          }),
          async (loginState, queryParams) => {
            // 设置已登录状态
            userStore.token = loginState.token
            userStore.isLoggedIn = loginState.isLoggedIn

            // 尝试访问带查询参数的登录页
            await router.push({ name: 'Login', query: queryParams })

            // 验证被重定向到首页（忽略查询参数）
            expect(router.currentRoute.value.name).toBe('Home')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * 综合测试：验证登录状态变化时的路由行为
   */
  describe('综合测试：登录状态变化与路由守卫', () => {
    it('对于任意登录-登出状态序列，路由守卫应该正确响应', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成随机的状态变化序列
          fc.array(
            fc.record({
              isLoggedIn: fc.boolean(),
              targetRoute: fc.constantFrom('Home', 'Profile', 'Login', 'ShortLink')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (stateSequence) => {
            for (const state of stateSequence) {
              // 重新创建路由器以确保干净的状态
              router = createTestRouter()
              addNavigationGuard(router, userStore)
              
              // 设置登录状态
              userStore.isLoggedIn = state.isLoggedIn
              userStore.token = state.isLoggedIn ? 'test-token' : ''

              // 尝试访问目标路由
              try {
                await router.push({ name: state.targetRoute })
              } catch (error) {
                // 忽略导航错误（重复导航等）
              }

              // 等待路由导航完成
              await router.isReady()

              // 验证路由守卫的行为
              const currentRoute = router.currentRoute.value.name

              if (state.isLoggedIn) {
                // 已登录状态
                if (state.targetRoute === 'Login') {
                  // 访问登录页应该重定向到首页
                  expect(currentRoute).toBe('Home')
                } else {
                  // 其他路由应该正常访问
                  expect(currentRoute).toBe(state.targetRoute)
                }
              } else {
                // 未登录状态
                if (state.targetRoute === 'Profile' || state.targetRoute === 'ShortLink') {
                  // 访问受保护路由应该重定向到登录页
                  expect(currentRoute).toBe('Login')
                } else {
                  // 公开路由应该正常访问
                  expect(currentRoute).toBe(state.targetRoute)
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('对于任意路由跳转序列，redirect 参数应该正确保存原始目标', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成受保护路由序列
          fc.array(
            fc.constantFrom('Profile', 'ShortLink'),
            { minLength: 1, maxLength: 5 }
          ),
          async (protectedRoutes) => {
            // 确保用户未登录
            userStore.isLoggedIn = false
            userStore.token = ''

            for (const routeName of protectedRoutes) {
              // 尝试访问受保护路由
              await router.push({ name: routeName })

              // 等待路由导航完成
              await router.isReady()

              // 验证被重定向到登录页
              expect(router.currentRoute.value.name).toBe('Login')

              // 验证 redirect 参数正确保存
              const redirectPath = router.currentRoute.value.query.redirect
              expect(redirectPath).toBeDefined()
              
              // 根据路由名称生成预期的路径
              const expectedPath = routeName === 'Profile' ? '/profile' : '/short-link'
              expect(redirectPath).toBe(expectedPath)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
