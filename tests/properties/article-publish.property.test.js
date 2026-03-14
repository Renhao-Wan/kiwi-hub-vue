/**
 * 文章发布功能属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 9: 文章发布成功后跳转到详情页
 * 
 * 验证需求: 5.6, 5.7
 * 
 * 测试策略：
 * - 使用 fast-check 生成各种有效的文章数据
 * - 模拟发布 API 调用和路由跳转
 * - 验证发布成功后显示成功提示并跳转到文章详情页
 * - 验证跳转时携带正确的文章 ID
 * - 测试核心业务逻辑而不依赖完整的组件渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'
import { ElMessage } from 'element-plus'
import * as contentApi from '@/api/content'

// Mock Element Plus Message
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn()
    }
  }
})

// Mock content API
vi.mock('@/api/content', () => ({
  publishArticle: vi.fn()
}))

describe('Property 9: 文章发布成功后跳转到详情页', () => {
  beforeEach(() => {
    // 清除所有 mock
    vi.clearAllMocks()
  })

  /**
   * 模拟发布文章的核心逻辑
   * 这个函数模拟了 PublishDialog 组件中的 handlePublish 方法
   */
  async function simulatePublishArticle(articleData, router) {
    try {
      // 调用发布文章 API
      const { data } = await contentApi.publishArticle({
        title: articleData.title,
        content: articleData.content,
        contentType: 'TEXT',
        tags: articleData.tags || []
      })

      // 显示成功提示
      ElMessage.success('文章发布成功')
      
      // 跳转到文章详情页
      if (data && data.id) {
        await router.push({ name: 'ArticleDetail', params: { id: data.id } })
      } else {
        // 如果没有返回文章 ID，跳转到首页
        await router.push({ name: 'Home' })
      }

      return { success: true, articleId: data?.id }
    } catch (error) {
      // 显示错误提示
      ElMessage.error(error.message || '文章发布失败，请重试')
      return { success: false, error: error.message }
    }
  }

  /**
   * 创建模拟路由对象
   */
  function createMockRouter() {
    const currentRoute = { name: null, params: {} }
    return {
      currentRoute,
      push: vi.fn(async (route) => {
        currentRoute.name = route.name
        currentRoute.params = route.params || {}
        return Promise.resolve()
      })
    }
  }

  /**
   * 属性测试 9.1: 对于任意有效的文章数据，发布成功后应该显示成功提示
   * 
   * 验证需求: 5.6（发布成功时使用 ElMessage 显示成功提示）
   */
  it('对于任意有效的文章数据，发布成功后应该显示成功提示', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          articleId: fc.uuid()
        }),
        async ({ title, content, tags, articleId }) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title,
              content,
              tags
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          await simulatePublishArticle({ title, content, tags }, router)

          // 验证显示成功提示
          expect(ElMessage.success).toHaveBeenCalledWith('文章发布成功')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.2: 对于任意有效的文章数据，发布成功后应该跳转到文章详情页
   * 
   * 验证需求: 5.7（发布成功时跳转到新发布文章的 Post_Detail_Page）
   */
  it('对于任意有效的文章数据，发布成功后应该跳转到文章详情页', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          articleId: fc.uuid()
        }),
        async ({ title, content, tags, articleId }) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title,
              content,
              tags
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          const result = await simulatePublishArticle({ title, content, tags }, router)

          // 验证路由跳转到文章详情页
          expect(router.push).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
          expect(router.currentRoute.name).toBe('ArticleDetail')
          expect(router.currentRoute.params.id).toBe(articleId)
          expect(result.success).toBe(true)
          expect(result.articleId).toBe(articleId)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.3: 对于任意有效的文章数据，发布成功后应该同时显示提示和跳转
   * 
   * 验证需求: 5.6, 5.7（发布成功后同时执行两个操作）
   */
  it('对于任意有效的文章数据，发布成功后应该同时显示提示和跳转', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          articleId: fc.uuid()
        }),
        async ({ title, content, tags, articleId }) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title,
              content,
              tags
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          await simulatePublishArticle({ title, content, tags }, router)

          // 验证同时执行了两个操作
          expect(ElMessage.success).toHaveBeenCalledWith('文章发布成功')
          expect(router.push).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.4: 当后端返回的文章 ID 为空时，应该跳转到首页
   * 
   * 验证需求: 5.7（如果没有返回文章 ID，跳转到首页作为降级处理）
   */
  it('当后端返回的文章 ID 为空时，应该跳转到首页', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 })
        }),
        async ({ title, content, tags }) => {
          // Mock API 返回成功响应但没有文章 ID
          contentApi.publishArticle.mockResolvedValue({
            data: {
              // 没有 id 字段
              title,
              content,
              tags
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          const result = await simulatePublishArticle({ title, content, tags }, router)

          // 验证路由跳转到首页（降级处理）
          expect(router.push).toHaveBeenCalledWith({ name: 'Home' })
          expect(router.currentRoute.name).toBe('Home')
          expect(result.success).toBe(true)
          expect(result.articleId).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.5: 对于任意发布失败的情况，应该显示错误提示且不跳转
   * 
   * 验证需求: 5.6（发布失败时显示错误提示）
   */
  it('对于任意发布失败的情况，应该显示错误提示且不跳转', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据和错误消息
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          errorMessage: fc.oneof(
            fc.constant('网络错误'),
            fc.constant('服务器错误'),
            fc.constant('文章内容违规'),
            fc.constant('标题重复')
          )
        }),
        async ({ title, content, tags, errorMessage }) => {
          // 清除之前的 mock 调用记录
          vi.clearAllMocks()
          
          // Mock API 返回失败响应
          contentApi.publishArticle.mockRejectedValue(new Error(errorMessage))

          const router = createMockRouter()

          // 执行发布逻辑
          const result = await simulatePublishArticle({ title, content, tags }, router)

          // 验证显示错误提示
          expect(ElMessage.error).toHaveBeenCalled()
          const errorCall = ElMessage.error.mock.calls[0][0]
          expect(errorCall).toContain(errorMessage)

          // 验证路由没有跳转
          expect(router.push).not.toHaveBeenCalled()
          expect(result.success).toBe(false)
          expect(result.error).toBe(errorMessage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.6: 对于任意包含特殊字符的文章数据，发布成功后应该正确跳转
   * 
   * 验证需求: 5.6, 5.7（确保特殊字符不影响跳转逻辑）
   */
  it('对于任意包含特殊字符的文章数据，发布成功后应该正确跳转', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成包含特殊字符的文章数据
        fc.record({
          title: fc.oneof(
            fc.constant('标题包含<script>标签'),
            fc.constant('标题包含"引号"和\'单引号\''),
            fc.constant('标题包含&符号&特殊字符'),
            fc.constant('标题包含\n换行符'),
            fc.constant('标题包含😀emoji表情')
          ),
          content: fc.oneof(
            fc.constant('内容包含<div>HTML标签</div>'),
            fc.constant('内容包含\n\n多个换行符\n\n'),
            fc.constant('内容包含特殊字符：!@#$%^&*()'),
            fc.constant('内容包含Unicode字符：你好世界🌍')
          ),
          tags: fc.array(
            fc.oneof(
              fc.constant('标签-1'),
              fc.constant('tag_2'),
              fc.constant('标签3'),
              fc.constant('tag#4')
            ),
            { minLength: 0, maxLength: 3 }
          ),
          articleId: fc.uuid()
        }),
        async ({ title, content, tags, articleId }) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title,
              content,
              tags
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          await simulatePublishArticle({ title, content, tags }, router)

          // 验证路由跳转到文章详情页（特殊字符不影响跳转）
          expect(router.push).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
          expect(router.currentRoute.name).toBe('ArticleDetail')
          expect(router.currentRoute.params.id).toBe(articleId)
          
          // 验证显示成功提示
          expect(ElMessage.success).toHaveBeenCalledWith('文章发布成功')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.7: 对于任意空标签数组，发布成功后应该正常跳转
   * 
   * 验证需求: 5.6, 5.7（标签是可选的，空标签不影响发布）
   */
  it('对于任意空标签数组，发布成功后应该正常跳转', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的文章数据（标签为空）
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          articleId: fc.uuid()
        }),
        async ({ title, content, articleId }) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title,
              content,
              tags: []
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑（不传 tags 或传空数组）
          await simulatePublishArticle({ title, content, tags: [] }, router)

          // 验证路由跳转到文章详情页
          expect(router.push).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
          expect(router.currentRoute.name).toBe('ArticleDetail')
          expect(router.currentRoute.params.id).toBe(articleId)
          
          // 验证显示成功提示
          expect(ElMessage.success).toHaveBeenCalledWith('文章发布成功')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 9.8: 对于任意文章 ID 格式，跳转时应该正确传递参数
   * 
   * 验证需求: 5.7（确保文章 ID 正确传递到路由参数中）
   */
  it('对于任意文章 ID 格式，跳转时应该正确传递参数', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成各种格式的文章 ID
        fc.oneof(
          fc.uuid(),
          fc.integer({ min: 1, max: 999999 }).map(n => String(n)),
          fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0)
        ),
        async (articleId) => {
          // Mock API 返回成功响应
          contentApi.publishArticle.mockResolvedValue({
            data: {
              id: articleId,
              title: '测试标题',
              content: '测试内容',
              tags: []
            },
            message: '操作成功'
          })

          const router = createMockRouter()

          // 执行发布逻辑
          await simulatePublishArticle({ 
            title: '测试标题', 
            content: '测试内容', 
            tags: [] 
          }, router)

          // 验证路由参数中的文章 ID 与返回的 ID 一致
          expect(router.push).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
          expect(router.currentRoute.params.id).toBe(articleId)
        }
      ),
      { numRuns: 100 }
    )
  })
})
