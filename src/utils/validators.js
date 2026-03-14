/**
 * 表单验证工具函数
 * 提供各种表单字段的验证规则
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度（6-12位，包含字母和数字）
 * @param {string} password - 密码
 * @returns {boolean} 是否符合密码强度要求
 */
export const isValidPassword = (password) => {
  if (!password || password.length < 6 || password.length > 12) {
    return false
  }
  // 必须包含字母和数字
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  return hasLetter && hasNumber
}

/**
 * 验证用户名（3-20个字符）
 * @param {string} username - 用户名
 * @returns {boolean} 是否为有效用户名
 */
export const isValidUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20
}

/**
 * Element Plus 表单验证规则 - 邮箱
 */
export const emailRule = {
  validator: (rule, value, callback) => {
    if (!value) {
      callback(new Error('请输入邮箱地址'))
    } else if (!isValidEmail(value)) {
      callback(new Error('请输入有效的邮箱地址'))
    } else {
      callback()
    }
  },
  trigger: 'blur'
}

/**
 * Element Plus 表单验证规则 - 密码
 */
export const passwordRule = {
  validator: (rule, value, callback) => {
    if (!value) {
      callback(new Error('请输入密码'))
    } else if (!isValidPassword(value)) {
      callback(new Error('密码必须为6-12位，且包含字母和数字'))
    } else {
      callback()
    }
  },
  trigger: 'blur'
}

/**
 * Element Plus 表单验证规则 - 用户名
 */
export const usernameRule = {
  validator: (rule, value, callback) => {
    if (!value) {
      callback(new Error('请输入用户名'))
    } else if (!isValidUsername(value)) {
      callback(new Error('用户名必须为3-20个字符'))
    } else {
      callback()
    }
  },
  trigger: 'blur'
}

/**
 * Element Plus 表单验证规则 - 必填项
 * @param {string} message - 错误提示信息
 * @returns {Object} 验证规则对象
 */
export const requiredRule = (message) => ({
  required: true,
  message,
  trigger: 'blur'
})
