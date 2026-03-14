import request from '@/utils/request'

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {string} [data.bio] - 个人简介（可选）
 * @param {Array<string>} [data.tags] - 用户标签（可选）
 * @returns {Promise<{data: Object, message: string}>} 注册结果
 */
export const register = (data) => {
  return request.post('/users/register', data)
}

/**
 * 用户登录
 * @param {Object} data - 登录信息
 * @param {string} data.emailOrUsername - 邮箱或用户名
 * @param {string} data.password - 密码
 * @returns {Promise<{data: Object, message: string}>} 登录结果（后端使用 Session，data 为空对象）
 */
export const login = (data) => {
  return request.post('/users/login', data)
}

/**
 * 用户登出
 * @returns {Promise<{data: Object, message: string}>} 登出结果
 */
export const logout = () => {
  return request.post('/users/logout')
}

/**
 * 获取当前用户信息
 * @returns {Promise<{data: Object, message: string}>} 用户信息
 */
export const getCurrentUser = () => {
  return request.get('/users/me')
}

/**
 * 更新用户资料
 * @param {Object} data - 更新的资料信息
 * @param {string} [data.bio] - 个人简介
 * @param {Array<string>} [data.tags] - 用户标签
 * @returns {Promise<{data: Object, message: string}>} 更新结果
 */
export const updateProfile = (data) => {
  return request.put('/users/me/profile', data)
}

/**
 * 关注用户
 * @param {string} followUserId - 要关注的用户 ID
 * @returns {Promise<{data: Object, message: string}>} 关注结果
 */
export const followUser = (followUserId) => {
  return request.post('/users/follow', null, { params: { followUserId } })
}

/**
 * 取消关注用户
 * @param {string} followUserId - 要取消关注的用户 ID
 * @returns {Promise<{data: Object, message: string}>} 取消关注结果
 */
export const unfollowUser = (followUserId) => {
  return request.delete('/users/follow', { params: { followUserId } })
}

/**
 * 获取关注列表
 * @param {number} [pageNum=1] - 页码
 * @param {number} [pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 关注列表
 */
export const getFollowingList = (pageNum = 1, pageSize = 10) => {
  return request.get('/users/following', { params: { pageNum, pageSize } })
}

/**
 * 获取粉丝列表
 * @param {number} [pageNum=1] - 页码
 * @param {number} [pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 粉丝列表
 */
export const getFollowersList = (pageNum = 1, pageSize = 10) => {
  return request.get('/users/followers', { params: { pageNum, pageSize } })
}
