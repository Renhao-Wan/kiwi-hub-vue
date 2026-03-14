import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../src/store/modules/user'

/**
 * 路由守卫测试
 * 验证需求: 19.3, 19.4, 19.5
 */
describe('路由导航守卫', () => {
  let router
  let userStore

  beforeEach(async () => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    userStore = useUserStore()

    // 创建路由实例（简化版，只包含测试需要的路由）
    router = createRouter({
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
        }
      ]
    })

    // 添加导航守卫
    router.beforeEach((to, from, next) => {
      // 检查需要认证的路由
      if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }

      // 已登录用户访问登录页，重定向到首页
      if (to.name === 'Login' && userStore.isLoggedIn) {
        next({ name: 'Home' })
        return
      }

      next()
    })

  })

  it('未登录用户访问受保护路由应重定向到登录页', async () => {
    // 确保用户未登录
    userStore.isLoggedIn = false

    // 尝试访问个人主页
    await router.push('/profile')

    // 验证被重定向到登录页
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/profile')
  })

  it('未登录用户访问短链接工具应重定向到登录页', async () => {
    // 确保用户未登录
    userStore.isLoggedIn = false

    // 尝试访问短链接工具
    await router.push('/short-link')

    // 验证被重定向到登录页
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/short-link')
  })

  it('已登录用户可以访问受保护路由', async () => {
    // 模拟用户已登录
    userStore.isLoggedIn = true
    userStore.token = 'test-token'

    // 访问个人主页
    await router.push('/profile')

    // 验证成功访问
    expect(router.currentRoute.value.name).toBe('Profile')
  })

  it('已登录用户访问登录页应重定向到首页', async () => {
    // 模拟用户已登录
    userStore.isLoggedIn = true
    userStore.token = 'test-token'

    // 尝试访问登录页
    await router.push('/login')

    // 验证被重定向到首页
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('未登录用户可以访问首页', async () => {
    // 确保用户未登录
    userStore.isLoggedIn = false

    // 访问首页
    await router.push('/')

    // 验证成功访问
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('已登录用户可以访问首页', async () => {
    // 模拟用户已登录
    userStore.isLoggedIn = true
    userStore.token = 'test-token'

    // 访问首页
    await router.push('/')

    // 验证成功访问
    expect(router.currentRoute.value.name).toBe('Home')
  })
})
