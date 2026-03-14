// 数据格式化工具

/**
 * 格式化时间为相对时间或绝对时间
 * @param {string} dateString - ISO 8601 格式的时间字符串
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 小于 1 分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于 1 小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 小于 24 小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 小于 7 天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 超过 7 天，显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day}`
  }
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化数字为 K/M 单位
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return String(num)
}

/**
 * 防抖函数：在最后一次调用后等待指定时间再执行
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒），默认 300ms
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数：在指定时间内最多执行一次
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 间隔时间（毫秒），默认 200ms
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, interval = 200) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
