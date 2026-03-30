import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/user'

// localStorage key，用于记录用户是否曾经登录过
// 仅作为"是否需要探测 Session"的提示，不作为认证凭据
const SESSION_HINT_KEY = 'kiwi_session_hint'

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
     * @param {string} credentials.username - 用户名
     * @param {string} credentials.email - 邮箱
     * @param {string} credentials.password - 密码
     * @returns {Promise<void>}
     */
    async login(credentials) {
      await loginApi(credentials)
      // 写入 Session 提示标记，下次刷新页面时才会尝试恢复登录状态
      localStorage.setItem(SESSION_HINT_KEY, '1')
      this.isLoggedIn = true
      await this.fetchUserInfo()
    },

    /**
     * 用户登出
     * @returns {Promise<void>}
     */
    async logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout API failed:', error)
      } finally {
        // 清除 Session 提示标记，下次刷新页面不再探测
        localStorage.removeItem(SESSION_HINT_KEY)
        this.userInfo = null
        this.isLoggedIn = false
      }
    },

    /**
     * 获取当前用户信息
     * @param {boolean} [silent=false] - 静默模式：跳过全局 401 错误提示，用于应用启动时的 Session 探测
     * @returns {Promise<void>}
     */
    async fetchUserInfo(silent = false) {
      const { data } = await getCurrentUser(silent)
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
     * 应用启动时调用。仅当本地存在 Session 提示标记时才发起 /users/me 请求，
     * 避免未登录用户每次访问页面都产生无意义的认证请求。
     * @returns {Promise<void>}
     */
    async restoreAuth() {
      // 没有登录提示标记，说明用户从未登录或已主动登出，直接跳过
      if (!localStorage.getItem(SESSION_HINT_KEY)) {
        return
      }
      try {
        // 静默探测 Session 有效性，401 不触发全局错误提示
        await this.fetchUserInfo(true)
        this.isLoggedIn = true
      } catch (error) {
        // Session 已过期，清除提示标记，下次刷新不再探测
        localStorage.removeItem(SESSION_HINT_KEY)
        this.userInfo = null
        this.isLoggedIn = false
      }
    }
  }
})
