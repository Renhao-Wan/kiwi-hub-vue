import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/user'

/**
 * 用户状态管理模块
 * 管理用户认证状态、用户信息和相关操作
 * 注意：后端使用 Session 机制，浏览器自动携带 Cookie，无需手动管理 Token
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息对象
    userInfo: null,
    // 登录状态标识
    isLoggedIn: false
  }),

  getters: {
    /**
     * 是否已认证（基于登录状态标识）
     * @param {Object} state - 当前状态
     * @returns {boolean} 是否已认证
     */
    isAuthenticated: (state) => state.isLoggedIn,

    /**
     * 获取用户昵称
     * @param {Object} state - 当前状态
     * @returns {string} 用户昵称，未登录返回空字符串
     */
    username: (state) => state.userInfo?.username || '',

    /**
     * 获取用户头像 URL
     * @param {Object} state - 当前状态
     * @returns {string} 头像 URL，未登录返回空字符串
     */
    avatar: (state) => state.userInfo?.profile?.avatarUrl || ''
  },

  actions: {
    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证
     * @param {string} credentials.emailOrUsername - 邮箱或用户名
     * @param {string} credentials.password - 密码
     * @returns {Promise<void>}
     */
    async login(credentials) {
      // 调用登录接口，后端通过 Set-Cookie 设置 Session
      await loginApi(credentials)
      // 标记为已登录
      this.isLoggedIn = true
      // 登录成功后立即获取用户信息
      await this.fetchUserInfo()
    },

    /**
     * 用户登出
     * @returns {Promise<void>}
     */
    async logout() {
      try {
        // 调用后端登出接口，清除服务端 Session
        await logoutApi()
      } catch (error) {
        // 即使后端登出失败，也要清除本地状态
        console.error('Logout API failed:', error)
      } finally {
        // 清除所有认证状态
        this.userInfo = null
        this.isLoggedIn = false
      }
    },

    /**
     * 获取当前用户信息
     * @returns {Promise<void>}
     */
    async fetchUserInfo() {
      const { data } = await getCurrentUser()
      this.userInfo = data
    },

    /**
     * 更新用户信息（本地状态）
     * @param {Object} info - 要更新的用户信息
     */
    updateUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
    },

    /**
     * 恢复登录状态
     * 应用启动时调用，通过尝试获取用户信息来验证 Session 是否有效
     * @returns {Promise<void>}
     */
    async restoreAuth() {
      try {
        // 尝试获取用户信息验证 Session 有效性
        await this.fetchUserInfo()
        this.isLoggedIn = true
      } catch (error) {
        // Session 失效或未登录
        console.error('Session validation failed:', error)
        this.userInfo = null
        this.isLoggedIn = false
      }
    }
  }
})
