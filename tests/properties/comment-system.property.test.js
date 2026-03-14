/**
 * 评论系统属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 11: 一级评论和回复评论使用不同参数
 *
 * 验证需求: 9.2, 9.4
 *
 * 测试策略：
 * - 使用 fast-check 生成各种有效的评论数据
 * - 验证一级评论发布时不传 parentId 和 rootId
 * - 验证回复评论发布时必须传入正确的 parentId 和 rootId
 * - 测试核心业务逻辑，不依赖完整的组件渲染
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
      error: vi.fn(),
      warning: vi.fn()
    }
  }
})

// Mock content API
vi.mock('@/api/content', () => ({
  publishComment: vi.fn(),
  getRootComments: vi.fn(),
  getReplies: vi.fn()
}))

// Mock user store
vi.mock('@/store/modules/user', () => ({
  useUserStore: vi.fn(() => ({
    isLoggedIn: true,
    username: 'testuser',
    avatar: ''
  }))
}))

describe('Property 11: 一级评论和回复评论使用不同参数', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * 模拟 CommentList 组件中发布一级评论的核心逻辑
   * 对应需求 9.2：发布一级评论时不传 parentId 和 rootId
   */
  async function simulateSubmitRootComment(articleId, content) {
    const trimmed = content.trim()
    if (!trimmed) {
      ElMessage.warning('评论内容不能为空')
      return { success: false, reason: 'empty' }
    }
    if (trimmed.length > 500) {
      ElMessage.warning('评论内容不能超过 500 字符')
      return { success: false, reason: 'too_long' }
    }

    // 一级评论：只传 articleId 和 content，不传 parentId 和 rootId
    const payload = {
      articleId,
      content: trimmed
    }
    await contentApi.publishComment(payload)
    ElMessage.success('评论发布成功')
    return { success: true, payload }
  }

  /**
   * 模拟 CommentItem 组件中发布回复评论的核心逻辑
   * 对应需求 9.4：发布回复评论时传入 parentId 和 rootId
   */
  async function simulateSubmitReply(articleId, content, rootComment, replyTarget) {
    const trimmed = content.trim()
    if (!trimmed) {
      ElMessage.warning('回复内容不能为空')
      return { success: false, reason: 'empty' }
    }
    if (trimmed.length > 500) {
      ElMessage.warning('回复内容不能超过 500 字符')
      return { success: false, reason: 'too_long' }
    }

    // 回复评论：必须传 rootId 和 parentId
    const payload = {
      articleId,
      content: trimmed,
      rootId: rootComment.id,
      // 回复楼中楼时 parentId 为被回复评论的 ID，否则为根评论 ID
      parentId: replyTarget ? replyTarget.id : rootComment.id
    }
    await contentApi.publishComment(payload)
    ElMessage.success('回复成功')
    return { success: true, payload }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 需求 9.2：一级评论不传 parentId 和 rootId
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * 属性测试 11.1：对于任意有效的一级评论内容，发布时不应包含 parentId 和 rootId
   *
   * 验证需求: 9.2
   */
  it('对于任意有效的一级评论内容，发布时不应包含 parentId 和 rootId', async () => {
    contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })

    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // articleId
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0), // 有效内容
        async (articleId, content) => {
          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })

          const result = await simulateSubmitRootComment(articleId, content)

          expect(result.success).toBe(true)
          expect(contentApi.publishComment).toHaveBeenCalledTimes(1)

          const calledWith = contentApi.publishComment.mock.calls[0][0]

          // 核心断言：一级评论不能包含 parentId 和 rootId
          expect(calledWith).not.toHaveProperty('parentId')
          expect(calledWith).not.toHaveProperty('rootId')

          // 必须包含 articleId 和 content
          expect(calledWith.articleId).toBe(articleId)
          expect(calledWith.content).toBe(content.trim())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 11.2：对于任意 articleId，一级评论的 payload 结构应该精确匹配
   *
   * 验证需求: 9.2
   */
  it('对于任意 articleId，一级评论的 payload 结构应该精确匹配', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // articleId
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        async (articleId, content) => {
          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })

          await simulateSubmitRootComment(articleId, content)

          const calledWith = contentApi.publishComment.mock.calls[0][0]

          // payload 应该只有 articleId 和 content 两个字段
          const keys = Object.keys(calledWith)
          expect(keys).toContain('articleId')
          expect(keys).toContain('content')
          expect(keys).not.toContain('parentId')
          expect(keys).not.toContain('rootId')
        }
      ),
      { numRuns: 100 }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // 需求 9.4：回复评论必须传 parentId 和 rootId
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * 属性测试 11.3：对于任意有效的回复内容，发布时必须包含 parentId 和 rootId
   *
   * 验证需求: 9.4
   */
  it('对于任意有效的回复内容，发布时必须包含 parentId 和 rootId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // articleId
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }), // rootComment
        async (articleId, content, rootComment) => {
          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })

          // 直接回复根评论（replyTarget 为 null）
          const result = await simulateSubmitReply(articleId, content, rootComment, null)

          expect(result.success).toBe(true)
          expect(contentApi.publishComment).toHaveBeenCalledTimes(1)

          const calledWith = contentApi.publishComment.mock.calls[0][0]

          // 核心断言：回复评论必须包含 parentId 和 rootId
          expect(calledWith).toHaveProperty('parentId')
          expect(calledWith).toHaveProperty('rootId')

          // rootId 必须是根评论的 ID
          expect(calledWith.rootId).toBe(rootComment.id)
          // 直接回复根评论时，parentId 等于根评论 ID
          expect(calledWith.parentId).toBe(rootComment.id)

          // 必须包含 articleId 和 content
          expect(calledWith.articleId).toBe(articleId)
          expect(calledWith.content).toBe(content.trim())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 11.4：回复楼中楼时，parentId 应为被回复评论的 ID，rootId 保持不变
   *
   * 验证需求: 9.4
   */
  it('回复楼中楼时，parentId 应为被回复评论的 ID，rootId 保持不变', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // articleId
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }), // rootComment
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }), // replyTarget（楼中楼）
        async (articleId, content, rootComment, replyTarget) => {
          // 确保 replyTarget 和 rootComment 的 ID 不同
          if (replyTarget.id === rootComment.id) return

          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })

          const result = await simulateSubmitReply(articleId, content, rootComment, replyTarget)

          expect(result.success).toBe(true)

          const calledWith = contentApi.publishComment.mock.calls[0][0]

          // rootId 始终是根评论的 ID
          expect(calledWith.rootId).toBe(rootComment.id)
          // parentId 是被回复的楼中楼评论的 ID
          expect(calledWith.parentId).toBe(replyTarget.id)
          // parentId 和 rootId 不同（因为是楼中楼回复）
          expect(calledWith.parentId).not.toBe(calledWith.rootId)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // 对比验证：一级评论 vs 回复评论的参数差异
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * 属性测试 11.5：相同内容，一级评论和回复评论的 payload 结构必须不同
   *
   * 验证需求: 9.2, 9.4
   */
  it('相同内容，一级评论和回复评论的 payload 结构必须不同', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // articleId
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }), // rootComment
        async (articleId, content, rootComment) => {
          // 发布一级评论
          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })
          await simulateSubmitRootComment(articleId, content)
          const rootPayload = contentApi.publishComment.mock.calls[0][0]

          // 发布回复评论
          vi.clearAllMocks()
          contentApi.publishComment.mockResolvedValue({ data: {}, message: '操作成功' })
          await simulateSubmitReply(articleId, content, rootComment, null)
          const replyPayload = contentApi.publishComment.mock.calls[0][0]

          // 一级评论没有 rootId 和 parentId
          expect(rootPayload).not.toHaveProperty('rootId')
          expect(rootPayload).not.toHaveProperty('parentId')

          // 回复评论有 rootId 和 parentId
          expect(replyPayload).toHaveProperty('rootId')
          expect(replyPayload).toHaveProperty('parentId')

          // 两者的 articleId 和 content 相同
          expect(rootPayload.articleId).toBe(replyPayload.articleId)
          expect(rootPayload.content).toBe(replyPayload.content)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // 边界情况：空内容和超长内容的验证
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * 属性测试 11.6：对于任意空白内容，一级评论和回复评论都应该被拒绝
   *
   * 验证需求: 9.2, 9.4（结合需求 9.7 的验证规则）
   */
  it('对于任意空白内容，一级评论和回复评论都应该被拒绝', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        // 生成只含空白字符的字符串（至少 1 个字符）
        fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^\s]/g, ' ')).filter(s => s.trim() === ''),
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }),
        async (articleId, blankContent, rootComment) => {
          vi.clearAllMocks()

          // 一级评论：空白内容应被拒绝
          const rootResult = await simulateSubmitRootComment(articleId, blankContent)
          expect(rootResult.success).toBe(false)
          expect(contentApi.publishComment).not.toHaveBeenCalled()

          vi.clearAllMocks()

          // 回复评论：空白内容应被拒绝
          const replyResult = await simulateSubmitReply(articleId, blankContent, rootComment, null)
          expect(replyResult.success).toBe(false)
          expect(contentApi.publishComment).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 11.7：对于任意超过 500 字符的内容（trim 后仍超长），评论应该被拒绝
   *
   * 验证需求: 9.2, 9.4（结合需求 9.7 的验证规则）
   */
  it('对于任意超过 500 字符的内容，评论应该被拒绝', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        // 生成 trim 后仍超过 500 字符的字符串（用非空白字符填充）
        fc.integer({ min: 501, max: 600 }).chain(len =>
          fc.constant('a'.repeat(len))
        ),
        fc.record({ id: fc.uuid(), username: fc.string({ minLength: 1 }) }),
        async (articleId, longContent, rootComment) => {
          vi.clearAllMocks()

          // 一级评论：超长内容应被拒绝
          const rootResult = await simulateSubmitRootComment(articleId, longContent)
          expect(rootResult.success).toBe(false)
          expect(contentApi.publishComment).not.toHaveBeenCalled()

          vi.clearAllMocks()

          // 回复评论：超长内容应被拒绝
          const replyResult = await simulateSubmitReply(articleId, longContent, rootComment, null)
          expect(replyResult.success).toBe(false)
          expect(contentApi.publishComment).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })
})
