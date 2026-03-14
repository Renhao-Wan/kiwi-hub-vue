/**
 * AppHeader 组件单元测试
 * 测试布局组件在不同登录状态下的显示行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppHeader from '@/layout/AppHeader.vue'
import { useUserStore } from '@/store/modules/user'

// Element Plus 组件 stub
const ElementPlusStubs = {
  'el-header': {
    template: '<header class="el-header"><slot /></header>'
  },
  'el-button': {
    template: '<button class="el-button"><slot /></button>',
    props: ['type']
  },
  'el-avatar': {
    template: '<div class="el-avatar"><slot /></div>',
    props: ['src', 'size']
  },
  'el-dropdown': {
    template: '<div class="el-dropdown"><slot /><slot name="dropdown" /></div>',
    props: ['command']
  },
  'el-dropdown-menu': {
    template: '<div class="el-dropdown-menu"><slot /></div>'
  },
  'el-dropdown-item': {
    template: '<div class="el-dropdown-item"><slot /></div>',
    props: ['command', 'divided']
  },
  'LoginDialog': {
    template: '<div class="login-dialog"></div>',
    props: ['modelValue']
  },
  'RegisterDialog': {
    template: '<div class="register-dialog"></div>',
    props: ['modelValue']
  }
}

// 创建测试路由
const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
      { path: '/register', name: 'Register', component: { template: '<div>Register</div>' } },
      { path: '/profile', name: 'Profile', component: { template: '<div>Profile</div>' } },
      { path: '/short-link', name: 'ShortLink', component: { template: '<div>ShortLink</div>' } }
    ]
  })
}

describe('AppHeader 组件单元测试', () => {
  let pinia
  let router

  beforeEach(() => {
    // 重置 Pinia 和 Router
    pinia = createPinia()
    setActivePinia(pinia)
    router = createTestRouter()
    
    // 清空 localStorage
    localStorage.clear()
  })

  describe('需求 2.4: 未登录状态显示登录/注册按钮', () => {
    it('应该在未登录时显示"登录"和"注册"按钮', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 验证显示登录和注册按钮
      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map(btn => btn.text())
      
      expect(buttonTexts).toContain('登录')
      expect(buttonTexts).toContain('注册')
    })

    it('应该在未登录时不显示用户头像和下拉菜单', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 验证不显示头像和下拉菜单
      const avatar = wrapper.find('.el-avatar')
      const dropdown = wrapper.find('.el-dropdown')
      
      expect(avatar.exists()).toBe(false)
      expect(dropdown.exists()).toBe(false)
    })

    it('应该在未登录时不显示"发布"按钮', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map(btn => btn.text())
      
      expect(buttonTexts).not.toContain('发布')
    })

    it('点击"登录"按钮应该打开登录对话框', async () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const loginButton = wrapper.findAll('button').find(btn => btn.text() === '登录')
      await loginButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证登录对话框显示状态为 true
      expect(wrapper.vm.loginDialogVisible).toBe(true)
    })

    it('点击"注册"按钮应该打开注册对话框', async () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const registerButton = wrapper.findAll('button').find(btn => btn.text() === '注册')
      await registerButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证注册对话框显示状态为 true
      expect(wrapper.vm.registerDialogVisible).toBe(true)
    })
  })

  describe('需求 2.5: 已登录状态显示用户头像和下拉菜单', () => {
    it('应该在已登录时显示用户头像和下拉菜单', () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 验证显示头像
      const avatar = wrapper.find('.el-avatar')
      expect(avatar.exists()).toBe(true)
      
      // 验证显示下拉菜单
      const dropdown = wrapper.find('.el-dropdown')
      expect(dropdown.exists()).toBe(true)
    })

    it('应该在已登录时显示"发布"按钮', () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map(btn => btn.text())
      
      expect(buttonTexts).toContain('发布')
    })

    it('应该在已登录时不显示"登录"和"注册"按钮', () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map(btn => btn.text())
      
      expect(buttonTexts).not.toContain('登录')
      expect(buttonTexts).not.toContain('注册')
    })

    it('应该在头像中显示用户名首字母（当没有头像时）', () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态，无头像
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          avatarUrl: ''
        }
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      const avatar = wrapper.find('.el-avatar')
      expect(avatar.text()).toBe('T') // testuser 的首字母大写
    })

    it('下拉菜单应该包含"个人中心"和"退出登录"选项', () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 验证下拉菜单项
      const dropdownItems = wrapper.findAll('.el-dropdown-item')
      const itemTexts = dropdownItems.map(item => item.text())
      
      expect(itemTexts).toContain('个人中心')
      expect(itemTexts).toContain('退出登录')
    })

    it('点击"个人中心"应该跳转到个人主页', async () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 触发下拉菜单命令
      await wrapper.vm.handleCommand('profile')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/profile')
    })

    it('点击"退出登录"应该清除登录状态并跳转到首页', async () => {
      const userStore = useUserStore()
      
      // 模拟已登录状态
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }

      // 模拟 logout 方法
      userStore.logout = vi.fn(async () => {
        userStore.userInfo = null
        userStore.isLoggedIn = false
      })

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 触发退出登录
      await wrapper.vm.handleCommand('logout')
      await router.isReady()

      // 验证调用了 logout 方法
      expect(userStore.logout).toHaveBeenCalled()
      
      // 验证跳转到首页
      expect(router.currentRoute.value.path).toBe('/')
      
      // 验证登录状态已清除
      expect(userStore.isLoggedIn).toBe(false)
    })
  })

  describe('边缘情况测试', () => {
    it('应该正确处理用户名为空的情况', () => {
      const userStore = useUserStore()
      
      // 模拟已登录但用户名为空
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: '',
        email: 'test@example.com'
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 应该不会崩溃，头像应该显示空字符串
      const avatar = wrapper.find('.el-avatar')
      expect(avatar.exists()).toBe(true)
    })

    it('应该正确处理头像 URL 为 null 的情况', () => {
      const userStore = useUserStore()
      
      // 模拟已登录但头像为 null
      userStore.isLoggedIn = true
      userStore.userInfo = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          avatarUrl: null
        }
      }

      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, router],
          stubs: ElementPlusStubs
        }
      })

      // 应该显示用户名首字母
      const avatar = wrapper.find('.el-avatar')
      expect(avatar.exists()).toBe(true)
      expect(avatar.text()).toBe('T')
    })
  })
})
