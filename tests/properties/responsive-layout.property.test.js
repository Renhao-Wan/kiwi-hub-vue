/**
 * 响应式布局属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 18: 响应式布局适配移动端
 *
 * 验证需求: 20.2, 20.3, 20.5
 *
 * 测试策略：
 * - 使用 fast-check 生成各种视口宽度分类
 * - 通过解析 CSS 文件内容验证媒体查询规则的存在性和正确性
 * - 验证移动端（< 768px）时导航栏调整为移动端布局（需求 20.2）
 * - 验证移动端（< 768px）时文章卡片宽度为 100%（需求 20.3）
 * - 验证所有交互元素在移动端的最小点击区域 44x44px（需求 20.5）
 *
 * 注意：happy-dom 不支持完整的 CSSOM，无法通过 getComputedStyle 验证媒体查询效果，
 * 因此采用 CSS 源码解析策略，直接验证规则的存在性。
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---- 读取响应式 CSS 文件内容 ----
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const responsiveCssPath = path.resolve(__dirname, '../../src/assets/styles/responsive.css')
const responsiveCssContent = fs.readFileSync(responsiveCssPath, 'utf-8')

// ---- 移动端断点和最小点击区域常量 ----
const MOBILE_BREAKPOINT = 767
const MIN_TOUCH_TARGET = 44

/**
 * 检查 CSS 文件中是否在 max-width: 767px 的媒体查询上下文内包含指定关键字序列。
 *
 * 策略：将整个 CSS 文件按 @media 块拆分，只在 max-width: 767px 的块中搜索。
 * 使用字符串计数大括号来定位块边界，避免正则无法处理多选择器的问题。
 *
 * @param {string} css - CSS 文件全文
 * @param {...string} keywords - 需要同时出现在同一媒体查询块中的关键字
 * @returns {boolean}
 */
function mobileMediaContains(css, ...keywords) {
  // 找出所有 @media screen and (max-width: 767px) 的起始位置
  const mediaPattern = /@media\s+screen\s+and\s+\(max-width:\s*767px\)/g
  let match
  while ((match = mediaPattern.exec(css)) !== null) {
    // 从 @media 声明后找到第一个 '{'
    const blockStart = css.indexOf('{', match.index)
    if (blockStart === -1) continue

    // 用大括号计数找到对应的 '}'
    let depth = 0
    let blockEnd = blockStart
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') {
        depth--
        if (depth === 0) {
          blockEnd = i
          break
        }
      }
    }

    const blockContent = css.slice(blockStart, blockEnd + 1)

    // 检查所有关键字是否都在这个块中出现
    if (keywords.every(kw => blockContent.includes(kw))) {
      return true
    }
  }
  return false
}

describe('Property 18: 响应式布局适配移动端', () => {

  // ================================================================
  // 需求 20.2：屏幕宽度 < 768px 时，导航栏调整为移动端布局
  // ================================================================

  describe('需求 20.2：移动端导航栏布局', () => {

    /**
     * 属性测试 18.1：对于任意移动端视口宽度（1px ~ 767px），
     * CSS 中应存在隐藏桌面端导航链接的规则（display: none）
     *
     * 验证需求: 20.2
     */
    it('对于任意移动端视口宽度，CSS 应包含隐藏桌面端导航链接的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            // 验证在 max-width: 767px 块中存在隐藏 .nav-links 的规则
            const hasHideNavRule = mobileMediaContains(
              responsiveCssContent,
              '.nav-links',
              'display',
              'none'
            )
            expect(hasHideNavRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.2：对于任意移动端视口宽度，
     * CSS 应包含调整 .app-header 内边距的规则
     *
     * 验证需求: 20.2
     */
    it('对于任意移动端视口宽度，CSS 应包含调整导航栏内边距的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasHeaderPaddingRule = mobileMediaContains(
              responsiveCssContent,
              '.app-header',
              'padding'
            )
            expect(hasHeaderPaddingRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.3：对于任意桌面端视口宽度（>= 768px），
     * 移动端媒体查询断点（767px）确保不影响桌面端布局
     *
     * 验证需求: 20.2
     */
    it('对于任意桌面端视口宽度，移动端媒体查询断点应确保不影响桌面端', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 768, max: 2560 }),
          (viewportWidth) => {
            // 桌面端宽度必须 >= 768，不在 max-width: 767px 范围内
            expect(viewportWidth).toBeGreaterThanOrEqual(768)

            // CSS 中移动端断点必须是 767px（而非 768px），确保 768px 不受影响
            expect(responsiveCssContent).toContain('max-width: 767px')

            // CSS 中存在桌面端专用规则
            expect(responsiveCssContent).toContain('min-width: 1025px')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ================================================================
  // 需求 20.3：屏幕宽度 < 768px 时，文章卡片宽度为 100%
  // ================================================================

  describe('需求 20.3：移动端文章卡片宽度 100%', () => {

    /**
     * 属性测试 18.4：对于任意移动端视口宽度，
     * CSS 应包含 .article-card { width: 100% } 规则
     *
     * 验证需求: 20.3
     */
    it('对于任意移动端视口宽度，CSS 应包含文章卡片宽度 100% 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasFullWidthRule = mobileMediaContains(
              responsiveCssContent,
              '.article-card',
              'width',
              '100%'
            )
            expect(hasFullWidthRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.5：对于任意移动端视口宽度，
     * CSS 应包含禁用文章卡片 hover 动画的规则（transform: none）
     *
     * 验证需求: 20.3
     */
    it('对于任意移动端视口宽度，CSS 应包含禁用文章卡片 hover 动画的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasNoHoverRule = mobileMediaContains(
              responsiveCssContent,
              '.article-card:hover',
              'transform',
              'none'
            )
            expect(hasNoHoverRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.6：对于任意移动端视口宽度，
     * CSS 应包含隐藏文章卡片标签区域的规则（次要信息折叠）
     *
     * 验证需求: 20.3, 20.6
     */
    it('对于任意移动端视口宽度，CSS 应包含折叠文章卡片次要信息（标签）的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasHideTagsRule = mobileMediaContains(
              responsiveCssContent,
              '.article-tags',
              'display',
              'none'
            )
            expect(hasHideTagsRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ================================================================
  // 需求 20.5：所有交互元素在移动端的最小点击区域（44x44px）
  // ================================================================

  describe('需求 20.5：移动端交互元素最小点击区域 44x44px', () => {

    /**
     * 属性测试 18.7：对于任意移动端视口宽度，
     * CSS 应包含 .el-button min-height: 44px 规则
     *
     * 验证需求: 20.5
     */
    it('对于任意移动端视口宽度，CSS 应包含按钮最小高度 44px 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasMinHeightRule = mobileMediaContains(
              responsiveCssContent,
              '.el-button',
              'min-height',
              `${MIN_TOUCH_TARGET}px`
            )
            expect(hasMinHeightRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.8：对于任意移动端视口宽度，
     * CSS 应包含 .el-button min-width: 44px 规则
     *
     * 验证需求: 20.5
     */
    it('对于任意移动端视口宽度，CSS 应包含按钮最小宽度 44px 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasMinWidthRule = mobileMediaContains(
              responsiveCssContent,
              '.el-button',
              'min-width',
              `${MIN_TOUCH_TARGET}px`
            )
            expect(hasMinWidthRule).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.9：对于任意移动端视口宽度，
     * CSS 应包含 .nav-link min-height: 44px 规则
     *
     * 验证需求: 20.5
     */
    it('对于任意移动端视口宽度，CSS 应包含导航链接最小高度 44px 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasNavLinkMinHeight = mobileMediaContains(
              responsiveCssContent,
              '.nav-link',
              'min-height',
              `${MIN_TOUCH_TARGET}px`
            )
            expect(hasNavLinkMinHeight).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.10：对于任意移动端视口宽度，
     * CSS 应包含分页按钮最小尺寸 44px 的规则
     *
     * 验证需求: 20.5
     */
    it('对于任意移动端视口宽度，CSS 应包含分页按钮最小尺寸 44px 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasPaginationMinSize = mobileMediaContains(
              responsiveCssContent,
              '.el-pagination',
              `${MIN_TOUCH_TARGET}px`
            )
            expect(hasPaginationMinSize).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.11：对于任意移动端视口宽度，
     * CSS 应包含 .el-dropdown-menu__item min-height: 44px 规则
     *
     * 验证需求: 20.5
     */
    it('对于任意移动端视口宽度，CSS 应包含下拉菜单项最小高度 44px 的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            const hasDropdownMinHeight = mobileMediaContains(
              responsiveCssContent,
              '.el-dropdown-menu__item',
              'min-height',
              `${MIN_TOUCH_TARGET}px`
            )
            expect(hasDropdownMinHeight).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ================================================================
  // 综合验证：CSS 文件结构完整性
  // ================================================================

  describe('CSS 文件结构完整性验证', () => {

    /**
     * 属性测试 18.12：对于任意视口宽度分类（移动/平板/桌面），
     * CSS 文件应包含对应的媒体查询断点声明
     *
     * 验证需求: 20.2, 20.3, 20.5
     */
    it('对于任意视口宽度分类，CSS 文件应包含对应的媒体查询断点', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({
              category: fc.constant('mobile'),
              width: fc.integer({ min: 1, max: 767 }),
              expectedBreakpoint: fc.constant('max-width: 767px')
            }),
            fc.record({
              category: fc.constant('tablet'),
              width: fc.integer({ min: 768, max: 1024 }),
              expectedBreakpoint: fc.constant('min-width: 768px')
            }),
            fc.record({
              category: fc.constant('desktop'),
              width: fc.integer({ min: 1025, max: 2560 }),
              expectedBreakpoint: fc.constant('min-width: 1025px')
            })
          ),
          ({ category, width, expectedBreakpoint }) => {
            expect(responsiveCssContent).toContain(expectedBreakpoint)

            if (category === 'mobile') {
              expect(width).toBeLessThan(768)
            } else if (category === 'tablet') {
              expect(width).toBeGreaterThanOrEqual(768)
              expect(width).toBeLessThanOrEqual(1024)
            } else {
              expect(width).toBeGreaterThan(1024)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.13：对于任意移动端视口宽度，
     * CSS 文件中所有 max-width 媒体查询均使用统一断点 767px
     *
     * 验证需求: 20.2, 20.3, 20.5
     */
    it('对于任意移动端视口宽度，所有移动端媒体查询应使用统一断点 767px', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            // 提取所有 max-width 断点值
            const maxWidthPattern = /@media\s+screen\s+and\s+\(max-width:\s*(\d+)px\)/g
            const breakpoints = new Set()
            let match
            while ((match = maxWidthPattern.exec(responsiveCssContent)) !== null) {
              breakpoints.add(parseInt(match[1]))
            }

            // 所有 < 768 的断点必须统一为 767
            const mobileBreakpoints = [...breakpoints].filter(bp => bp < 768)
            expect(mobileBreakpoints.length).toBeGreaterThan(0)
            mobileBreakpoints.forEach(bp => {
              expect(bp).toBe(MOBILE_BREAKPOINT)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 属性测试 18.14：对于任意移动端视口宽度，
     * CSS 应同时覆盖导航栏、文章卡片、交互元素三个核心区域
     *
     * 验证需求: 20.2, 20.3, 20.5
     */
    it('对于任意移动端视口宽度，CSS 应同时覆盖导航栏、文章卡片、交互元素三个核心区域', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
          (_viewportWidth) => {
            // 需求 20.2：导航栏
            const coversNavbar = mobileMediaContains(responsiveCssContent, '.app-header')
            // 需求 20.3：文章卡片
            const coversArticleCard = mobileMediaContains(responsiveCssContent, '.article-card', 'width', '100%')
            // 需求 20.5：交互元素最小点击区域
            const coversInteractiveElements = mobileMediaContains(
              responsiveCssContent,
              '.el-button',
              `${MIN_TOUCH_TARGET}px`
            )

            expect(coversNavbar).toBe(true)
            expect(coversArticleCard).toBe(true)
            expect(coversInteractiveElements).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
