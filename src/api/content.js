import request from '@/utils/request'

/**
 * 获取文章列表
 * @param {number} [pageNum=1] - 页码
 * @param {number} [pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 文章列表
 */
export const getArticleList = (pageNum = 1, pageSize = 10) => {
  return request.get('/articles/s', { params: { pageNum, pageSize } })
}

/**
 * 获取文章详情
 * @param {string} articleId - 文章 ID
 * @returns {Promise<{data: Object, message: string}>} 文章详情
 */
export const getArticleDetail = (articleId) => {
  return request.get(`/articles/${articleId}`)
}

/**
 * 发布文章
 * @param {Object} data - 文章信息
 * @param {string} data.title - 文章标题
 * @param {string} data.content - 文章内容
 * @param {string} [data.contentType] - 内容类型
 * @param {Array<string>} [data.tags] - 文章标签
 * @returns {Promise<{data: Object, message: string}>} 发布结果
 */
export const publishArticle = (data) => {
  return request.post('/articles', data)
}

/**
 * 删除文章
 * @param {string} articleId - 文章 ID
 * @returns {Promise<{data: Object, message: string}>} 删除结果
 */
export const deleteArticle = (articleId) => {
  return request.delete('/articles', { params: { articleId } })
}

/**
 * 获取当前用户文章列表
 * @param {number} [pageNum=1] - 页码
 * @param {number} [pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 用户文章列表
 */
export const getMyArticles = (pageNum = 1, pageSize = 10) => {
  return request.get('/articles/me', { params: { pageNum, pageSize } })
}

/**
 * 搜索文章
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {string} [params.searchMode='FULL_TEXT'] - 搜索模式
 * @param {string} [params.sortBy='RELEVANCE'] - 排序方式（RELEVANCE/TIME/VIEW_COUNT/LIKE_COUNT）
 * @param {string} [params.sortOrder='DESC'] - 排序顺序（ASC/DESC）
 * @param {number} [params.pageNum=1] - 页码
 * @param {number} [params.pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 搜索结果
 */
export const searchArticles = (params) => {
  return request.get('/search/articles', { params })
}

/**
 * 点赞/取消点赞文章
 * @param {string} articleId - 文章 ID
 * @param {string} authorId - 文章作者 ID
 * @returns {Promise<{data: Object, message: string}>} 点赞结果
 */
export const toggleLike = (articleId, authorId) => {
  return request.post('/interactions/like', null, { 
    params: { articleId, authorId } 
  })
}

/**
 * 发布评论
 * @param {Object} data - 评论信息
 * @param {string} data.articleId - 文章 ID
 * @param {string} data.content - 评论内容
 * @param {string} [data.parentId] - 父评论 ID（回复时传入）
 * @param {string} [data.rootId] - 根评论 ID（楼中楼回复时传入）
 * @returns {Promise<{data: Object, message: string}>} 发布结果
 */
export const publishComment = (data) => {
  return request.post('/comments', data)
}

/**
 * 获取一级评论列表
 * @param {string} articleId - 文章 ID
 * @param {number} [pageNum=1] - 页码
 * @param {number} [pageSize=10] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 一级评论列表
 */
export const getRootComments = (articleId, pageNum = 1, pageSize = 10) => {
  return request.get('/comments/roots', { 
    params: { articleId, pageNum, pageSize } 
  })
}

/**
 * 获取楼中楼回复列表
 * @param {string} rootId - 根评论 ID
 * @param {string} [cursor=null] - 游标（用于分页）
 * @param {number} [pageSize=20] - 每页大小
 * @returns {Promise<{data: Object, message: string}>} 楼中楼回复列表
 */
export const getReplies = (rootId, cursor = null, pageSize = 20) => {
  return request.get('/comments/replies', { 
    params: { rootId, cursor, pageSize } 
  })
}

/**
 * 删除评论
 * @param {string} commentId - 评论 ID
 * @returns {Promise<{data: Object, message: string}>} 删除结果
 */
export const deleteComment = (commentId) => {
  return request.delete(`/comments/${commentId}`)
}
