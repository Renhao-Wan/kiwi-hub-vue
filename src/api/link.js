import request from '@/utils/request'

/**
 * 生成短链接
 * @param {string} articleId - 文章 ID
 * @returns {Promise<{data: Object, message: string}>} 生成的短链接信息
 */
export const generateShortLink = (articleId) => {
  return request.post('/links/generate', null, { params: { articleId } })
}

/**
 * 获取长链接（通过短链接代码）
 * @param {string} code - 短链接代码
 * @returns {Promise<{data: Object, message: string}>} 长链接信息
 */
export const getLongLink = (code) => {
  return request.get(`/links/s/${code}`)
}
