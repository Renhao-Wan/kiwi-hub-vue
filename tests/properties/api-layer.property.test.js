/**
 * API 接口层属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 10: API 调用使用正确的端点和参数
 * 
 * 验证需求: 3.2, 3.5, 4.1, 5.5, 6.1, 7.2, 8.2, 9.2, 9.4, 10.1, 11.3, 13.1, 13.6, 14.3, 15.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'

// Mock request 模块
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import request from '@/utils/request'
import * as userApi from '@/api/user'
import * as contentApi from '@/api/content'
import * as linkApi from '@/api/link'

describe('Property 10: API 调用使用正确的端点和参数', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.get.mockResolvedValue({ data: {}, message: 'success' })
    request.post.mockResolvedValue({ data: {}, message: 'success' })
    request.put.mockResolvedValue({ data: {}, message: 'success' })
    request.delete.mockResolvedValue({ data: {}, message: 'success' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('对于任意注册数据，register API 应该调用 POST /users/register', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 12 }),
          bio: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          tags: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined })
        }),
        async (registerData) => {
          vi.clearAllMocks()
          await userApi.register(registerData)
          expect(request.post).toHaveBeenCalledWith('/users/register', registerData)
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意登录凭证，login API 应该调用 POST /users/login', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          emailOrUsername: fc.oneof(fc.emailAddress(), fc.string({ minLength: 3, maxLength: 20 })),
          password: fc.string({ minLength: 6, maxLength: 12 })
        }),
        async (credentials) => {
          vi.clearAllMocks()
          await userApi.login(credentials)
          expect(request.post).toHaveBeenCalledWith('/users/login', credentials)
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意分页参数，getArticleList API 应该调用 GET /articles/s', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (pageNum, pageSize) => {
          vi.clearAllMocks()
          await contentApi.getArticleList(pageNum, pageSize)
          expect(request.get).toHaveBeenCalledWith('/articles/s', { params: { pageNum, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意文章数据，publishArticle API 应该调用 POST /articles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 1, maxLength: 5000 }),
          contentType: fc.option(fc.constantFrom('TEXT', 'MARKDOWN', 'HTML'), { nil: undefined }),
          tags: fc.option(fc.array(fc.string(), { maxLength: 10 }), { nil: undefined })
        }),
        async (articleData) => {
          vi.clearAllMocks()
          await contentApi.publishArticle(articleData)
          expect(request.post).toHaveBeenCalledWith('/articles', articleData)
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意文章 ID，getArticleDetail API 应该调用 GET /articles/{articleId}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (articleId) => {
          vi.clearAllMocks()
          await contentApi.getArticleDetail(articleId)
          expect(request.get).toHaveBeenCalledWith(`/articles/${articleId}`)
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意文章 ID 和作者 ID，toggleLike API 应该调用 POST /interactions/like', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (articleId, authorId) => {
          vi.clearAllMocks()
          await contentApi.toggleLike(articleId, authorId)
          expect(request.post).toHaveBeenCalledWith('/interactions/like', null, { params: { articleId, authorId } })
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意文章 ID 和分页参数，getRootComments API 应该调用 GET /comments/roots', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (articleId, pageNum, pageSize) => {
          vi.clearAllMocks()
          await contentApi.getRootComments(articleId, pageNum, pageSize)
          expect(request.get).toHaveBeenCalledWith('/comments/roots', { params: { articleId, pageNum, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意一级评论数据，publishComment API 不应该包含 parentId 和 rootId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          articleId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 500 })
        }),
        async (commentData) => {
          vi.clearAllMocks()
          await contentApi.publishComment(commentData)
          expect(request.post).toHaveBeenCalledWith('/comments', commentData)
          const calledData = request.post.mock.calls[0][1]
          expect(calledData).not.toHaveProperty('parentId')
          expect(calledData).not.toHaveProperty('rootId')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意回复评论数据，publishComment API 应该包含 parentId 和 rootId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          articleId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 500 }),
          parentId: fc.uuid(),
          rootId: fc.uuid()
        }),
        async (replyData) => {
          vi.clearAllMocks()
          await contentApi.publishComment(replyData)
          expect(request.post).toHaveBeenCalledWith('/comments', replyData)
          const calledData = request.post.mock.calls[0][1]
          expect(calledData.parentId).toBe(replyData.parentId)
          expect(calledData.rootId).toBe(replyData.rootId)
        }
      ),
      { numRuns: 100 }
    )
  })
})


  it('对于任意根评论 ID 和游标，getReplies API 应该调用 GET /comments/replies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.option(fc.string(), { nil: null }),
        fc.integer({ min: 1, max: 50 }),
        async (rootId, cursor, pageSize) => {
          vi.clearAllMocks()
          await contentApi.getReplies(rootId, cursor, pageSize)
          expect(request.get).toHaveBeenCalledWith('/comments/replies', { params: { rootId, cursor, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意文章 ID，generateShortLink API 应该调用 POST /links/generate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (articleId) => {
          vi.clearAllMocks()
          await linkApi.generateShortLink(articleId)
          expect(request.post).toHaveBeenCalledWith('/links/generate', null, { params: { articleId } })
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意评论 ID，deleteComment API 应该调用 DELETE /comments/{commentId}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (commentId) => {
          vi.clearAllMocks()
          await contentApi.deleteComment(commentId)
          expect(request.delete).toHaveBeenCalledWith(`/comments/${commentId}`)
          expect(request.delete).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意分页参数，getMyArticles API 应该调用 GET /articles/me', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (pageNum, pageSize) => {
          vi.clearAllMocks()
          await contentApi.getMyArticles(pageNum, pageSize)
          expect(request.get).toHaveBeenCalledWith('/articles/me', { params: { pageNum, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意资料数据，updateProfile API 应该调用 PUT /users/me/profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bio: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          tags: fc.option(fc.array(fc.string(), { maxLength: 10 }), { nil: undefined })
        }),
        async (profileData) => {
          vi.clearAllMocks()
          await userApi.updateProfile(profileData)
          expect(request.put).toHaveBeenCalledWith('/users/me/profile', profileData)
          expect(request.put).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意搜索参数，searchArticles API 应该调用 GET /search/articles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          keyword: fc.string({ minLength: 1, maxLength: 50 }),
          searchMode: fc.option(fc.constantFrom('FULL_TEXT', 'TITLE_ONLY'), { nil: undefined }),
          sortBy: fc.option(fc.constantFrom('RELEVANCE', 'TIME', 'VIEW_COUNT', 'LIKE_COUNT'), { nil: undefined }),
          sortOrder: fc.option(fc.constantFrom('ASC', 'DESC'), { nil: undefined }),
          pageNum: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          pageSize: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined })
        }),
        async (searchParams) => {
          vi.clearAllMocks()
          await contentApi.searchArticles(searchParams)
          expect(request.get).toHaveBeenCalledWith('/search/articles', { params: searchParams })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getCurrentUser API 应该调用 GET /users/me', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          vi.clearAllMocks()
          await userApi.getCurrentUser()
          expect(request.get).toHaveBeenCalledWith('/users/me')
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('logout API 应该调用 POST /users/logout', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          vi.clearAllMocks()
          await userApi.logout()
          expect(request.post).toHaveBeenCalledWith('/users/logout')
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('对于任意文章 ID，deleteArticle API 应该调用 DELETE /articles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (articleId) => {
          vi.clearAllMocks()
          await contentApi.deleteArticle(articleId)
          expect(request.delete).toHaveBeenCalledWith('/articles', { params: { articleId } })
          expect(request.delete).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意用户 ID，followUser API 应该调用 POST /users/follow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (followUserId) => {
          vi.clearAllMocks()
          await userApi.followUser(followUserId)
          expect(request.post).toHaveBeenCalledWith('/users/follow', null, { params: { followUserId } })
          expect(request.post).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意用户 ID，unfollowUser API 应该调用 DELETE /users/follow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (followUserId) => {
          vi.clearAllMocks()
          await userApi.unfollowUser(followUserId)
          expect(request.delete).toHaveBeenCalledWith('/users/follow', { params: { followUserId } })
          expect(request.delete).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意分页参数，getFollowingList API 应该调用 GET /users/following', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (pageNum, pageSize) => {
          vi.clearAllMocks()
          await userApi.getFollowingList(pageNum, pageSize)
          expect(request.get).toHaveBeenCalledWith('/users/following', { params: { pageNum, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意分页参数，getFollowersList API 应该调用 GET /users/followers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (pageNum, pageSize) => {
          vi.clearAllMocks()
          await userApi.getFollowersList(pageNum, pageSize)
          expect(request.get).toHaveBeenCalledWith('/users/followers', { params: { pageNum, pageSize } })
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于任意短链接代码，getLongLink API 应该调用 GET /links/s/{code}', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 10 }),
        async (code) => {
          vi.clearAllMocks()
          await linkApi.getLongLink(code)
          expect(request.get).toHaveBeenCalledWith(`/links/s/${code}`)
          expect(request.get).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })
