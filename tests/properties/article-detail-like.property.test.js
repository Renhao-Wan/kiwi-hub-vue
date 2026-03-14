/**
 * 文章详情页属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 12: 点赞操作立即更新 UI 状态
 *
 * 验证需求: 7.3, 7.6
 *
 * 测试策略：
 * - 使用 fast-check 生成各种文章数据（不同点赞数、不同点赞状态）
 * - 模拟 handleLike 核心逻辑（乐观更新 + 回滚）
 * - 验证点击点赞后 UI 立即更新（不等待 API 响应）
 * - 验证 API 失败时 UI 回滚到原始状态并显示错误提示
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
  toggleLike: vi.fn()
}))

/**
 * 模拟 ArticleDetail.vue 中的 handleLike 核心逻辑
 * 乐观更新：先更新 UI，再调用 API；失败时回滚
 */
async function simulateHandleLike(article, isLoggedIn) {
  // 未登录时不执行点赞，返回特殊标记
  if (!isLoggedIn) {
    return { loginRequired: true, article }
  }

  // 记录原始状态（用于回滚）
  const prevLiked = article.isLiked
  const prevCount = article.likeCount

  // 乐观更新：立即更新 UI
  article.isLiked = !prevLiked
  article.likeCount = prevLiked ? prevCount - 1 : prevCount + 1

  // 记录乐观更新后的状态
  const optimisticLiked = article.isLiked
  const optimisticCount = article.likeCount

  try {
    await contentApi.toggleLike(article.id, article.authorId)
    return {
      success: true,
      article,
      optimisticLiked,
      optimisticCount,
      prevLiked,
      prevCount
    }
  } catch (error) {
    // API 失败时回滚 UI 状态
    article.isLiked = prevLiked
    article.likeCount = prevCount
    ElMessage.error('操作失败，请稍后重试')
    return {
      success: false,
      article,
      optimisticLiked,
      optimisticCount,
      prevLiked,
      prevCount
    }
  }
}

describe('Property 12: 点赞操作立即更新 UI 状态', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * 属性测试 12.1: 对于任意未点赞的文章，点赞后 isLiked 应立即变为 true，likeCount 加 1
   *
   * 验证需求: 7.3（点赞操作成功时立即更新点赞按钮的视觉状态和点赞数）
   */
  it('对于任意未点赞的文章，点赞后 isLiked 应立即变为 true，likeCount 加 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ max: 100000 }),
          isLiked: fc.constant(false) // 初始未点赞
        }),
        async (articleData) => {
          contentApi.toggleLike.mockResolvedValue({ data: {}, message: '操作成功' })

          const article = { ...articleData }
          const originalCount = article.likeCount

          const result = await simulateHandleLike(article, true)

          // 验证乐观更新立即生效
          expect(result.optimisticLiked).toBe(true)
          expect(result.optimisticCount).toBe(originalCount + 1)

          // 验证 API 成功后状态保持
          expect(article.isLiked).toBe(true)
          expect(article.likeCount).toBe(originalCount + 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.2: 对于任意已点赞的文章，取消点赞后 isLiked 应立即变为 false，likeCount 减 1
   *
   * 验证需求: 7.3（点赞操作成功时立即更新点赞按钮的视觉状态和点赞数）
   */
  it('对于任意已点赞的文章，取消点赞后 isLiked 应立即变为 false，likeCount 减 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ min: 1, max: 100000 }), // 至少 1，避免负数
          isLiked: fc.constant(true) // 初始已点赞
        }),
        async (articleData) => {
          contentApi.toggleLike.mockResolvedValue({ data: {}, message: '操作成功' })

          const article = { ...articleData }
          const originalCount = article.likeCount

          const result = await simulateHandleLike(article, true)

          // 验证乐观更新立即生效
          expect(result.optimisticLiked).toBe(false)
          expect(result.optimisticCount).toBe(originalCount - 1)

          // 验证 API 成功后状态保持
          expect(article.isLiked).toBe(false)
          expect(article.likeCount).toBe(originalCount - 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.3: 对于任意文章，API 调用失败时应回滚 isLiked 和 likeCount 到原始值
   *
   * 验证需求: 7.6（点赞操作失败时使用 ElMessage 显示错误提示并恢复原状态）
   */
  it('对于任意文章，API 调用失败时应回滚 isLiked 和 likeCount 到原始值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ max: 100000 }),
          isLiked: fc.boolean()
        }),
        async (articleData) => {
          contentApi.toggleLike.mockRejectedValue(new Error('网络错误'))

          const article = { ...articleData }
          const originalLiked = article.isLiked
          const originalCount = article.likeCount

          const result = await simulateHandleLike(article, true)

          // 验证 API 失败后 UI 回滚到原始状态
          expect(article.isLiked).toBe(originalLiked)
          expect(article.likeCount).toBe(originalCount)
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.4: 对于任意文章，API 调用失败时应显示错误提示
   *
   * 验证需求: 7.6（点赞操作失败时使用 ElMessage 显示错误提示）
   */
  it('对于任意文章，API 调用失败时应显示错误提示', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ max: 100000 }),
          isLiked: fc.boolean()
        }),
        async (articleData) => {
          vi.clearAllMocks()
          contentApi.toggleLike.mockRejectedValue(new Error('服务器错误'))

          const article = { ...articleData }

          await simulateHandleLike(article, true)

          // 验证显示了错误提示
          expect(ElMessage.error).toHaveBeenCalledWith('操作失败，请稍后重试')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.5: 对于任意文章，乐观更新后 API 失败时，回滚值应与原始值完全一致
   *
   * 验证需求: 7.6（恢复原状态，确保回滚的精确性）
   */
  it('对于任意文章，乐观更新后 API 失败时，回滚值应与原始值完全一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ max: 100000 }),
          isLiked: fc.boolean()
        }),
        async (articleData) => {
          contentApi.toggleLike.mockRejectedValue(new Error('超时'))

          const article = { ...articleData }
          const snapshotLiked = article.isLiked
          const snapshotCount = article.likeCount

          const result = await simulateHandleLike(article, true)

          // 乐观更新时状态应该发生了变化
          expect(result.optimisticLiked).toBe(!snapshotLiked)
          expect(result.optimisticCount).toBe(
            snapshotLiked ? snapshotCount - 1 : snapshotCount + 1
          )

          // 回滚后应与原始快照完全一致
          expect(article.isLiked).toBe(snapshotLiked)
          expect(article.likeCount).toBe(snapshotCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.6: 对于任意未登录用户，点击点赞不应调用 API 也不应修改文章状态
   *
   * 验证需求: 7.4（未登录时唤起登录弹窗，不执行点赞操作）
   */
  it('对于任意未登录用户，点击点赞不应调用 API 也不应修改文章状态', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ max: 100000 }),
          isLiked: fc.boolean()
        }),
        async (articleData) => {
          vi.clearAllMocks()

          const article = { ...articleData }
          const originalLiked = article.isLiked
          const originalCount = article.likeCount

          const result = await simulateHandleLike(article, false) // 未登录

          // 验证未调用 API
          expect(contentApi.toggleLike).not.toHaveBeenCalled()

          // 验证文章状态未被修改
          expect(article.isLiked).toBe(originalLiked)
          expect(article.likeCount).toBe(originalCount)

          // 验证返回了需要登录的标记
          expect(result.loginRequired).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 12.7: 对于任意文章，连续两次点赞操作应使状态回到初始值
   *
   * 验证需求: 7.3（点赞/取消点赞的幂等性验证）
   */
  it('对于任意文章，连续两次点赞操作应使状态回到初始值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          likeCount: fc.nat({ min: 1, max: 100000 }),
          isLiked: fc.boolean()
        }),
        async (articleData) => {
          contentApi.toggleLike.mockResolvedValue({ data: {}, message: '操作成功' })

          const article = { ...articleData }
          const originalLiked = article.isLiked
          const originalCount = article.likeCount

          // 第一次点赞
          await simulateHandleLike(article, true)
          // 第二次点赞（取消）
          await simulateHandleLike(article, true)

          // 两次操作后应回到初始状态
          expect(article.isLiked).toBe(originalLiked)
          expect(article.likeCount).toBe(originalCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})
