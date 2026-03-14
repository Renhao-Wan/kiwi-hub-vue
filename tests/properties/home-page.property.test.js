/**
 * 首页组件属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 7: UI 组件渲染所有必需字段
 * Property 8: 文章卡片点击跳转到详情页
 * 
 * 验证需求: 4.3, 4.4, 4.7
 * 
 * 测试策略：
 * - 使用 fast-check 生成各种文章数据结构
 * - 验证 ArticleCard 组件渲染所有必需字段
 * - 验证文章卡片点击时正确跳转到详情页
 * - 覆盖各种边界情况（空数组、空字符串、极大数字等）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import ArticleCard from '@/components/common/ArticleCard.vue'
import { formatTime, formatNumber } from '@/utils/formatters'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock Element Plus icons
vi.mock('@element-plus/icons-vue', () => ({
  View: { name: 'View' },
  Star: { name: 'Star' },
  ChatDotRound: { name: 'ChatDotRound' }
}))

describe('Property 7: UI 组件渲染所有必需字段', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  /**
   * 属性测试 7.1: 对于任意文章数据，ArticleCard 应该渲染所有必需字段
   * 
   * 验证需求: 4.3, 4.4
   * 
   * 必需字段包括：
   * - 作者头像 (authorAvatar)
   * - 作者昵称 (authorName)
   * - 发布时间 (createdAt)
   * - 文章标题 (title)
   * - 文章摘要 (summary)
   * - 点赞数 (likeCount)
   * - 评论数 (commentCount)
   * - 浏览数 (viewCount)
   */
  it('对于任意文章数据，ArticleCard 应该渲染所有必需字段', () => {
    fc.assert(
      fc.property(
        // 生成随机文章数据
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          // 确保作者名称不是纯空格
          authorName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          authorAvatar: fc.webUrl(),
          // 确保标题不是纯空格
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          // 确保摘要不是纯空格
          summary: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 5 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat({ max: 1000000 }),
          likeCount: fc.nat({ max: 100000 }),
          commentCount: fc.nat({ max: 10000 })
        }),
        (article) => {
          // 挂载组件
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': {
                  template: '<div class="el-card" @click="$emit(\'click\')"><slot /></div>'
                },
                'el-avatar': {
                  template: '<div class="el-avatar" :data-src="src"></div>',
                  props: ['src', 'size']
                },
                'el-tag': {
                  template: '<span class="el-tag"><slot /></span>',
                  props: ['size', 'type', 'effect']
                },
                'el-icon': {
                  template: '<i class="el-icon"><slot /></i>'
                }
              }
            }
          })

          const html = wrapper.html()
          const text = wrapper.text()

          // 验证作者昵称已渲染（HTML 会压缩连续空格，所以需要规范化比较）
          const normalizedText = text.replace(/\s+/g, ' ')
          const normalizedName = article.authorName.replace(/\s+/g, ' ').trim()
          expect(normalizedText).toContain(normalizedName)

          // 验证文章标题已渲染
          expect(text).toContain(article.title.trim())

          // 验证文章摘要已渲染
          expect(text).toContain(article.summary.trim())

          // 验证作者头像已渲染（检查 data-src 属性）
          const avatar = wrapper.find('.el-avatar')
          expect(avatar.exists()).toBe(true)

          // 验证发布时间已渲染（格式化后的时间）
          const formattedTime = formatTime(article.createdAt)
          expect(text).toContain(formattedTime)

          // 验证统计数据已渲染
          expect(text).toContain(formatNumber(article.viewCount))
          expect(text).toContain(formatNumber(article.likeCount))
          expect(text).toContain(formatNumber(article.commentCount))

          // 验证标签已渲染（如果有标签）
          if (article.tags && article.tags.length > 0) {
            article.tags.forEach(tag => {
              expect(text).toContain(tag)
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 7.2: 对于任意包含空标签数组的文章，ArticleCard 应该正确处理
   * 
   * 验证需求: 4.3
   */
  it('对于任意包含空标签数组的文章，ArticleCard 应该正确处理', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.constant([]), // 空标签数组
          // 使用有效的时间戳范围生成日期
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat(),
          likeCount: fc.nat(),
          commentCount: fc.nat()
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': { template: '<div class="el-card"><slot /></div>' },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          // 组件应该正常渲染，不抛出错误
          expect(wrapper.exists()).toBe(true)
          
          // 标签区域不应该显示（或为空）
          const tags = wrapper.findAll('.el-tag')
          expect(tags.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 7.3: 对于任意极大的统计数字，ArticleCard 应该正确格式化显示
   * 
   * 验证需求: 4.4
   */
  it('对于任意极大的统计数字，ArticleCard 应该正确格式化显示（K/M 单位）', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.array(fc.string(), { maxLength: 3 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat({ max: 10000000 }), // 最大 1000 万
          likeCount: fc.nat({ max: 1000000 }),  // 最大 100 万
          commentCount: fc.nat({ max: 100000 }) // 最大 10 万
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': { template: '<div class="el-card"><slot /></div>' },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          const text = wrapper.text()

          // 验证数字已格式化（使用 K 或 M 单位）
          const formattedView = formatNumber(article.viewCount)
          const formattedLike = formatNumber(article.likeCount)
          const formattedComment = formatNumber(article.commentCount)

          expect(text).toContain(formattedView)
          expect(text).toContain(formattedLike)
          expect(text).toContain(formattedComment)

          // 验证格式化逻辑正确
          if (article.viewCount >= 1000000) {
            expect(formattedView).toMatch(/\d+\.\d+M/)
          } else if (article.viewCount >= 1000) {
            expect(formattedView).toMatch(/\d+\.\d+K/)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 7.4: 对于任意零值的统计数字，ArticleCard 应该正确显示
   * 
   * 验证需求: 4.4
   */
  it('对于任意零值的统计数字，ArticleCard 应该正确显示', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.array(fc.string(), { maxLength: 3 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.constant(0),
          likeCount: fc.constant(0),
          commentCount: fc.constant(0)
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': { template: '<div class="el-card"><slot /></div>' },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          const text = wrapper.text()

          // 验证零值正确显示为 "0"
          expect(text).toContain('0')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 7.5: 对于任意不同时间的文章，ArticleCard 应该正确格式化时间显示
   * 
   * 验证需求: 4.3
   */
  it('对于任意不同时间的文章，ArticleCard 应该正确格式化时间显示', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.array(fc.string(), { maxLength: 3 }),
          createdAt: fc.oneof(
            // 刚刚（30秒前）
            fc.constant(new Date(Date.now() - 30 * 1000).toISOString()),
            // 10分钟前
            fc.constant(new Date(Date.now() - 10 * 60 * 1000).toISOString()),
            // 5小时前
            fc.constant(new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()),
            // 3天前
            fc.constant(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
            // 30天前
            fc.constant(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            // 1年前
            fc.constant(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          ),
          viewCount: fc.nat(),
          likeCount: fc.nat(),
          commentCount: fc.nat()
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': { template: '<div class="el-card"><slot /></div>' },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          const text = wrapper.text()
          const formattedTime = formatTime(article.createdAt)

          // 验证时间已格式化并渲染
          expect(text).toContain(formattedTime)

          // 验证时间格式符合预期
          const patterns = [
            /刚刚/,
            /\d+分钟前/,
            /\d+小时前/,
            /\d+天前/,
            /\d{2}-\d{2}/,      // MM-DD 格式
            /\d{4}-\d{2}-\d{2}/ // YYYY-MM-DD 格式
          ]

          const matchesAnyPattern = patterns.some(pattern => pattern.test(formattedTime))
          expect(matchesAnyPattern).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 7.6: 对于任意包含特殊字符的文章数据，ArticleCard 应该正确转义和显示
   * 
   * 验证需求: 4.3, 4.4
   */
  it('对于任意包含特殊字符的文章数据，ArticleCard 应该正确转义和显示', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.oneof(
            fc.constant('用户<script>alert("xss")</script>'),
            fc.constant('用户&nbsp;&lt;&gt;'),
            fc.constant('用户"引号"\'单引号\'')
          ),
          authorAvatar: fc.webUrl(),
          title: fc.oneof(
            fc.constant('标题<b>加粗</b>'),
            fc.constant('标题&amp;&lt;&gt;'),
            fc.constant('标题"引号"\'单引号\'')
          ),
          summary: fc.oneof(
            fc.constant('摘要<script>alert("xss")</script>'),
            fc.constant('摘要&nbsp;&lt;&gt;'),
            fc.constant('摘要"引号"\'单引号\'')
          ),
          tags: fc.array(fc.constant('<tag>'), { maxLength: 2 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat(),
          likeCount: fc.nat(),
          commentCount: fc.nat()
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': { template: '<div class="el-card"><slot /></div>' },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          // 组件应该正常渲染，不抛出错误
          expect(wrapper.exists()).toBe(true)

          // Vue 会自动转义文本内容，防止 XSS
          const html = wrapper.html()
          
          // 验证 script 标签被转义（不会作为实际的 script 标签执行）
          // Vue 的文本插值会自动转义，所以 <script> 会变成 &lt;script&gt;
          expect(html).not.toContain('<script>alert')
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 8: 文章卡片点击跳转到详情页', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  /**
   * 属性测试 8.1: 对于任意文章，点击 ArticleCard 应该跳转到对应的详情页
   * 
   * 验证需求: 4.7
   */
  it('对于任意文章，点击 ArticleCard 应该跳转到对应的详情页', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.array(fc.string(), { maxLength: 3 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat(),
          likeCount: fc.nat(),
          commentCount: fc.nat()
        }),
        (article) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': {
                  template: '<div class="el-card" @click="$emit(\'click\')"><slot /></div>'
                },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          // 点击文章卡片
          wrapper.find('.el-card').trigger('click')

          // 验证路由跳转被调用（至少一次）
          expect(mockPush).toHaveBeenCalled()

          // 验证最后一次跳转参数正确
          expect(mockPush).toHaveBeenLastCalledWith({
            name: 'ArticleDetail',
            params: { id: article.id }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 8.2: 对于任意文章 ID 格式，ArticleCard 应该正确传递到路由参数
   * 
   * 验证需求: 4.7
   */
  it('对于任意文章 ID 格式，ArticleCard 应该正确传递到路由参数', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.uuid(),                                    // UUID 格式
          fc.integer({ min: 1, max: 999999 }).map(String), // 数字 ID
          fc.string({ minLength: 10, maxLength: 20 })   // 随机字符串 ID
        ),
        (articleId) => {
          const article = {
            id: articleId,
            authorId: 'author-123',
            authorName: 'Test Author',
            authorAvatar: 'https://example.com/avatar.jpg',
            title: 'Test Title',
            summary: 'Test Summary',
            tags: ['tag1'],
            createdAt: new Date().toISOString(),
            viewCount: 100,
            likeCount: 10,
            commentCount: 5
          }

          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': {
                  template: '<div class="el-card" @click="$emit(\'click\')"><slot /></div>'
                },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          mockPush.mockClear()
          wrapper.find('.el-card').trigger('click')

          // 验证路由跳转参数包含正确的文章 ID
          expect(mockPush).toHaveBeenCalledWith({
            name: 'ArticleDetail',
            params: { id: articleId }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 8.3: 对于任意文章，多次点击 ArticleCard 应该多次触发路由跳转
   * 
   * 验证需求: 4.7
   */
  it('对于任意文章，多次点击 ArticleCard 应该多次触发路由跳转', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          authorId: fc.uuid(),
          authorName: fc.string({ minLength: 1, maxLength: 20 }),
          authorAvatar: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 200 }),
          tags: fc.array(fc.string(), { maxLength: 3 }),
          createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
          viewCount: fc.nat(),
          likeCount: fc.nat(),
          commentCount: fc.nat()
        }),
        fc.integer({ min: 1, max: 5 }), // 点击次数
        (article, clickCount) => {
          const wrapper = mount(ArticleCard, {
            props: { article },
            global: {
              stubs: {
                'el-card': {
                  template: '<div class="el-card" @click="$emit(\'click\')"><slot /></div>'
                },
                'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                'el-icon': { template: '<i class="el-icon"><slot /></i>' }
              }
            }
          })

          mockPush.mockClear()

          // 多次点击
          for (let i = 0; i < clickCount; i++) {
            wrapper.find('.el-card').trigger('click')
          }

          // 验证路由跳转被调用了至少 clickCount 次
          expect(mockPush.mock.calls.length).toBeGreaterThanOrEqual(clickCount)

          // 验证每次调用的参数都包含正确的文章 ID
          mockPush.mock.calls.forEach(call => {
            expect(call[0]).toEqual({
              name: 'ArticleDetail',
              params: { id: article.id }
            })
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 8.4: 对于任意文章列表，每个 ArticleCard 应该跳转到各自的详情页
   * 
   * 验证需求: 4.7
   */
  it('对于任意文章列表，每个 ArticleCard 应该跳转到各自的详情页', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            authorId: fc.uuid(),
            authorName: fc.string({ minLength: 1, maxLength: 20 }),
            authorAvatar: fc.webUrl(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            summary: fc.string({ minLength: 1, maxLength: 200 }),
            tags: fc.array(fc.string(), { maxLength: 3 }),
            // 使用有效的时间戳范围生成日期
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
            viewCount: fc.nat(),
            likeCount: fc.nat(),
            commentCount: fc.nat()
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (articles) => {
          // 为每篇文章创建一个 ArticleCard 组件
          const wrappers = articles.map(article => 
            mount(ArticleCard, {
              props: { article },
              global: {
                stubs: {
                  'el-card': {
                    template: '<div class="el-card" @click="$emit(\'click\')"><slot /></div>'
                  },
                  'el-avatar': { template: '<div class="el-avatar"></div>', props: ['src', 'size'] },
                  'el-tag': { template: '<span class="el-tag"><slot /></span>' },
                  'el-icon': { template: '<i class="el-icon"><slot /></i>' }
                }
              }
            })
          )

          mockPush.mockClear()

          // 点击每个文章卡片
          wrappers.forEach((wrapper, index) => {
            wrapper.find('.el-card').trigger('click')
          })

          // 验证路由跳转被调用了至少 articles.length 次
          expect(mockPush.mock.calls.length).toBeGreaterThanOrEqual(articles.length)

          // 验证每篇文章的 ID 都出现在调用参数中
          const calledIds = mockPush.mock.calls.map(call => call[0].params.id)
          articles.forEach(article => {
            expect(calledIds).toContain(article.id)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
