/**
 * 搜索功能属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 15: 搜索支持多种排序方式
 * Property 16: 搜索结果高亮显示关键词
 *
 * 验证需求: 15.4, 15.5
 *
 * 测试策略：
 * - Property 15: 验证搜索 API 调用时正确传递 sortBy 和 sortOrder 参数
 * - Property 16: 验证 highlightKeyword 工具函数对任意关键词和文本都能正确生成高亮标记
 * - 覆盖所有合法排序枚举值（RELEVANCE / TIME / VIEW_COUNT / LIKE_COUNT）
 * - 覆盖关键词高亮的边界情况（特殊字符、大小写、多次出现等）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

// ─── Mock request 模块 ───────────────────────────────────────────────────────
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import request from '@/utils/request'
import * as contentApi from '@/api/content'

// ─── 从 Home.vue 提取的高亮工具函数（与源码保持一致）────────────────────────
/**
 * 对文本中的关键词添加高亮标记
 * @param {string} text - 原始文本
 * @param {string} keyword - 关键词
 * @returns {string} 包含 <span class="highlight"> 标记的 HTML 字符串
 */
function highlightKeyword(text, keyword) {
  if (!text || !keyword) return text || ''
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// ─── 合法的排序枚举值 ─────────────────────────────────────────────────────────
const VALID_SORT_BY = ['RELEVANCE', 'TIME', 'VIEW_COUNT', 'LIKE_COUNT']
const VALID_SORT_ORDER = ['ASC', 'DESC']

// ─── Property 15: 搜索支持多种排序方式 ───────────────────────────────────────
describe('Property 15: 搜索支持多种排序方式', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.get.mockResolvedValue({ data: { list: [], total: 0 }, message: 'success' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * 属性测试 15.1: 对于任意合法的 sortBy 值，searchArticles 应该将其正确传递给后端
   *
   * 验证需求: 15.4（支持按相关度、时间、浏览量、点赞数排序）
   */
  it('对于任意合法的 sortBy 值，searchArticles 应该将其正确传递给后端', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_SORT_BY),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (sortBy, keyword) => {
          vi.clearAllMocks()

          const params = {
            keyword,
            searchMode: 'FULL_TEXT',
            sortBy,
            sortOrder: 'DESC',
            pageNum: 1,
            pageSize: 10
          }

          await contentApi.searchArticles(params)

          // 验证调用了正确的端点
          expect(request.get).toHaveBeenCalledWith('/search/articles', { params })

          // 验证 sortBy 参数被正确传递
          const calledParams = request.get.mock.calls[0][1].params
          expect(calledParams.sortBy).toBe(sortBy)
          expect(VALID_SORT_BY).toContain(calledParams.sortBy)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 15.2: 对于任意合法的 sortOrder 值，searchArticles 应该将其正确传递给后端
   *
   * 验证需求: 15.4（排序方向 ASC/DESC 应被正确传递）
   */
  it('对于任意合法的 sortOrder 值，searchArticles 应该将其正确传递给后端', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_SORT_ORDER),
        fc.constantFrom(...VALID_SORT_BY),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (sortOrder, sortBy, keyword) => {
          vi.clearAllMocks()

          const params = {
            keyword,
            searchMode: 'FULL_TEXT',
            sortBy,
            sortOrder,
            pageNum: 1,
            pageSize: 10
          }

          await contentApi.searchArticles(params)

          const calledParams = request.get.mock.calls[0][1].params
          expect(calledParams.sortOrder).toBe(sortOrder)
          expect(VALID_SORT_ORDER).toContain(calledParams.sortOrder)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 15.3: 对于任意 sortBy 和 sortOrder 的组合，searchArticles 应该同时传递两个参数
   *
   * 验证需求: 15.4（sortBy 和 sortOrder 必须同时传递，不能只传其中一个）
   */
  it('对于任意 sortBy 和 sortOrder 的组合，searchArticles 应该同时传递两个参数', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_SORT_BY),
        fc.constantFrom(...VALID_SORT_ORDER),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (sortBy, sortOrder, keyword) => {
          vi.clearAllMocks()

          const params = { keyword, sortBy, sortOrder, pageNum: 1, pageSize: 10 }
          await contentApi.searchArticles(params)

          const calledParams = request.get.mock.calls[0][1].params
          // 两个排序参数必须同时存在
          expect(calledParams).toHaveProperty('sortBy')
          expect(calledParams).toHaveProperty('sortOrder')
          expect(calledParams.sortBy).toBe(sortBy)
          expect(calledParams.sortOrder).toBe(sortOrder)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 15.4: 对于任意分页参数，搜索时应该正确传递 pageNum 和 pageSize
   *
   * 验证需求: 15.6（支持搜索结果的分页加载）
   */
  it('对于任意分页参数，搜索时应该正确传递 pageNum 和 pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        fc.constantFrom(...VALID_SORT_BY),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (pageNum, pageSize, sortBy, keyword) => {
          vi.clearAllMocks()

          const params = {
            keyword,
            searchMode: 'FULL_TEXT',
            sortBy,
            sortOrder: 'DESC',
            pageNum,
            pageSize
          }

          await contentApi.searchArticles(params)

          const calledParams = request.get.mock.calls[0][1].params
          expect(calledParams.pageNum).toBe(pageNum)
          expect(calledParams.pageSize).toBe(pageSize)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 15.5: 对于任意关键词，搜索时应该传递 searchMode 参数
   *
   * 验证需求: 15.3（支持全文搜索模式）
   */
  it('对于任意关键词，搜索时应该传递 searchMode 参数', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom('FULL_TEXT', 'TITLE_ONLY'),
        async (keyword, searchMode) => {
          vi.clearAllMocks()

          const params = {
            keyword,
            searchMode,
            sortBy: 'RELEVANCE',
            sortOrder: 'DESC',
            pageNum: 1,
            pageSize: 10
          }

          await contentApi.searchArticles(params)

          const calledParams = request.get.mock.calls[0][1].params
          expect(calledParams.searchMode).toBe(searchMode)
          expect(calledParams.keyword).toBe(keyword)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 16: 搜索结果高亮显示关键词 ─────────────────────────────────────
describe('Property 16: 搜索结果高亮显示关键词', () => {
  /**
   * 属性测试 16.1: 对于任意非空文本和关键词，高亮函数应该在结果中包含高亮标记
   *
   * 验证需求: 15.5（在搜索结果中高亮显示关键词）
   */
  it('对于任意非空文本和关键词，高亮函数应该在结果中包含高亮标记', () => {
    fc.assert(
      fc.property(
        // 生成不含正则特殊字符的普通关键词
        fc.string({ minLength: 1, maxLength: 20 }).filter(s =>
          s.trim().length > 0 && !/[.*+?^${}()|[\]\\]/.test(s)
        ),
        // 生成包含该关键词的文本
        fc.string({ minLength: 0, maxLength: 50 }),
        (keyword, prefix) => {
          const text = prefix + keyword + '后缀文字'
          const result = highlightKeyword(text, keyword)

          // 结果中应该包含高亮标记
          expect(result).toContain('<span class="highlight">')
          expect(result).toContain('</span>')
          // 关键词本身应该出现在高亮标记内
          expect(result).toContain(`<span class="highlight">${keyword}</span>`)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.2: 对于任意文本，高亮函数应该对关键词大小写不敏感
   *
   * 验证需求: 15.5（高亮匹配应不区分大小写）
   */
  it('对于任意文本，高亮函数应该对关键词大小写不敏感', () => {
    fc.assert(
      fc.property(
        // 只生成纯英文字母关键词，便于大小写测试
        fc.string({ minLength: 1, maxLength: 15 }).filter(s =>
          /^[a-zA-Z]+$/.test(s)
        ),
        (keyword) => {
          const lowerKeyword = keyword.toLowerCase()
          const upperKeyword = keyword.toUpperCase()
          const text = `前缀 ${lowerKeyword} 中间 ${upperKeyword} 后缀`

          const result = highlightKeyword(text, keyword)

          // 大写和小写形式都应该被高亮
          const highlightCount = (result.match(/<span class="highlight">/g) || []).length
          expect(highlightCount).toBeGreaterThanOrEqual(2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.3: 对于任意文本，高亮函数应该高亮所有出现的关键词（不只是第一个）
   *
   * 验证需求: 15.5（所有匹配位置都应高亮）
   */
  it('对于任意文本，高亮函数应该高亮所有出现的关键词', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s =>
          s.trim().length > 0 && !/[.*+?^${}()|[\]\\]/.test(s)
        ),
        fc.integer({ min: 2, max: 5 }),
        (keyword, repeatCount) => {
          // 构造包含多个关键词的文本
          const text = Array(repeatCount).fill(keyword).join(' 分隔符 ')
          const result = highlightKeyword(text, keyword)

          // 高亮标记的数量应该等于关键词出现的次数
          const highlightCount = (result.match(/<span class="highlight">/g) || []).length
          expect(highlightCount).toBe(repeatCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.4: 当关键词为空时，高亮函数应该返回原始文本
   *
   * 验证需求: 15.5（空关键词不应产生高亮标记）
   */
  it('当关键词为空时，高亮函数应该返回原始文本', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom('', null, undefined),
        (text, emptyKeyword) => {
          const result = highlightKeyword(text, emptyKeyword)

          // 不应该包含高亮标记
          expect(result).not.toContain('<span class="highlight">')
          // 应该返回原始文本
          expect(result).toBe(text)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.5: 当文本为空时，高亮函数应该返回空字符串
   *
   * 验证需求: 15.5（空文本不应导致错误）
   */
  it('当文本为空时，高亮函数应该返回空字符串', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', null, undefined),
        fc.string({ minLength: 1, maxLength: 20 }),
        (emptyText, keyword) => {
          const result = highlightKeyword(emptyText, keyword)
          expect(result).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.6: 对于包含正则特殊字符的关键词，高亮函数应该正确转义而不抛出错误
   *
   * 验证需求: 15.5（特殊字符关键词不应导致正则错误）
   */
  it('对于包含正则特殊字符的关键词，高亮函数应该正确转义而不抛出错误', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'C++',
          'price$100',
          'a.b.c',
          '(test)',
          '[array]',
          'a|b',
          'a*b',
          'a+b',
          'a?b',
          'a{2}',
          'a^b',
          'a\\b'
        ),
        (specialKeyword) => {
          const text = `这是一段包含 ${specialKeyword} 的文本`

          // 不应该抛出正则错误
          expect(() => highlightKeyword(text, specialKeyword)).not.toThrow()

          const result = highlightKeyword(text, specialKeyword)
          // 结果应该是字符串
          expect(typeof result).toBe('string')
          // 应该包含高亮标记（因为文本中确实包含该关键词）
          expect(result).toContain('<span class="highlight">')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.7: 对于任意文本，高亮函数不应该改变文本的实际内容（只添加标记）
   *
   * 验证需求: 15.5（高亮只添加标记，不修改原始文本内容）
   */
  it('对于任意文本，高亮函数不应该改变文本的实际内容', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s =>
          s.trim().length > 0 && !/[.*+?^${}()|[\]\\]/.test(s)
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s =>
          s.trim().length > 0 && !/[.*+?^${}()|[\]\\]/.test(s)
        ),
        (text, keyword) => {
          const result = highlightKeyword(text, keyword)

          // 去除高亮标记后，文本内容应该与原始文本一致（忽略大小写差异）
          const stripped = result
            .replace(/<span class="highlight">/g, '')
            .replace(/<\/span>/g, '')

          expect(stripped.toLowerCase()).toBe(text.toLowerCase())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 16.8: 对于任意搜索结果数据，applyHighlight 应该对标题和摘要都应用高亮
   *
   * 验证需求: 15.5（标题和摘要都需要高亮显示关键词）
   */
  it('对于任意搜索结果数据，applyHighlight 应该对标题和摘要都应用高亮', () => {
    /**
     * 模拟 Home.vue 中的 applyHighlight 函数
     */
    function applyHighlight(article, activeKeyword) {
      if (!activeKeyword) return article
      return {
        ...article,
        title: highlightKeyword(article.title, activeKeyword),
        summary: highlightKeyword(article.summary, activeKeyword),
        _highlighted: true
      }
    }

    fc.assert(
      fc.property(
        // 生成不含正则特殊字符的关键词
        fc.string({ minLength: 1, maxLength: 10 }).filter(s =>
          s.trim().length > 0 && !/[.*+?^${}()|[\]\\]/.test(s)
        ),
        (keyword) => {
          const article = {
            id: 'article-001',
            title: `这篇文章关于 ${keyword} 的介绍`,
            summary: `本文详细介绍了 ${keyword} 的使用方法和最佳实践`,
            authorName: '测试作者',
            createdAt: new Date().toISOString(),
            viewCount: 100,
            likeCount: 10,
            commentCount: 5
          }

          const highlighted = applyHighlight(article, keyword)

          // 标题和摘要都应该包含高亮标记
          expect(highlighted.title).toContain('<span class="highlight">')
          expect(highlighted.summary).toContain('<span class="highlight">')

          // 应该标记为已高亮
          expect(highlighted._highlighted).toBe(true)

          // 其他字段不应该被修改
          expect(highlighted.id).toBe(article.id)
          expect(highlighted.authorName).toBe(article.authorName)
          expect(highlighted.viewCount).toBe(article.viewCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})
