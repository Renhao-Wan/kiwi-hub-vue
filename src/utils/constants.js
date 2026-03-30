/**
 * 项目全局常量定义
 */

// ==================== 分页默认值 ====================
export const DEFAULT_PAGE_NUM = 1
export const DEFAULT_PAGE_SIZE = 10
export const SHORT_LINK_HISTORY_PAGE_SIZE = 5

// ==================== 数据上限 ====================
export const MAX_SHORT_LINK_HISTORY = 50
export const MAX_TAGS_COUNT = 10
export const MAX_BIO_LENGTH = 200
export const MAX_TAG_INPUT_LENGTH = 20

// ==================== 本地存储 Key ====================
export const STORAGE_KEY_SESSION_HINT = 'kiwi_session_hint'
export const STORAGE_KEY_SHORT_LINK_HISTORY = 'short_link_history'

// ==================== 文章搜索排序方式 ====================
export const SORT_BY = {
  RELEVANCE: 'RELEVANCE',
  TIME: 'TIME',
  VIEW_COUNT: 'VIEW_COUNT',
  LIKE_COUNT: 'LIKE_COUNT'
}

// ==================== 文章搜索模式 ====================
export const SEARCH_MODE = {
  FULL_TEXT: 'FULL_TEXT'
}

// ==================== 排序方向 ====================
export const SORT_ORDER = {
  ASC: 'ASC',
  DESC: 'DESC'
}

// ==================== 响应状态码 ====================
export const RESPONSE_CODE = {
  SUCCESS: 20000,
  UNAUTHORIZED: 401
}
