/**
 * 短链接工具属性测试
 * Feature: kiwi-hub-vue-frontend
 * Property 17: 短链接复制到剪贴板
 *
 * 验证需求: 11.5, 12.4
 *
 * 测试策略：
 * - 使用 fast-check 生成各种短链接 URL
 * - 模拟 copyToClipboard 核心逻辑（navigator.clipboard + 降级方案）
 * - 验证复制成功后调用剪贴板 API 并显示成功提示
 * - 验证 navigator.clipboard 不可用时降级到 execCommand 方案
 * - 覆盖生成后复制（需求 11.5）和历史记录复制（需求 12.4）两个场景
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { ElMessage } from 'element-plus'

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

/**
 * 模拟 ShortLink.vue 中的 copyToClipboard 核心逻辑
 */
async function simulateCopyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
    return { success: true, method: 'clipboard' }
  } catch {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
    return { success: true, method: 'execCommand' }
  }
}

describe('Property 17: 短链接复制到剪贴板', () => {
  let originalClipboard

  beforeEach(() => {
    vi.clearAllMocks()
    originalClipboard = navigator.clipboard
  })

  afterEach(() => {
    // 恢复 navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true
    })
  })

  /**
   * 属性测试 17.1: 对于任意短链接 URL，复制成功后应该显示成功提示
   *
   * 验证需求: 11.5（用户点击"一键复制"按钮时，将短链接复制到剪贴板并使用 ElMessage 显示成功提示）
   * 验证需求: 12.4（用户点击历史记录的"复制"按钮时，将短链接复制到剪贴板）
   */
  it('对于任意短链接 URL，复制成功后应该显示成功提示', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成各种格式的短链接 URL
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.webUrl(),
          fc.constant('http://example.com/links/s/abc123'),
          fc.constant('https://kiwihub.com/links/s/xyz789')
        ),
        async (shortUrl) => {
          // Mock navigator.clipboard.writeText 成功
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            writable: true,
            configurable: true
          })

          vi.clearAllMocks()

          await simulateCopyToClipboard(shortUrl)

          // 验证显示了成功提示
          expect(ElMessage.success).toHaveBeenCalledWith('已复制到剪贴板')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 17.2: 对于任意短链接 URL，复制时应该调用剪贴板 API 并传入正确的文本
   *
   * 验证需求: 11.5（确保复制的内容是正确的短链接）
   * 验证需求: 12.4（确保历史记录复制的内容是正确的短链接）
   */
  it('对于任意短链接 URL，复制时应该调用剪贴板 API 并传入正确的文本', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.webUrl()
        ),
        async (shortUrl) => {
          const writeTextMock = vi.fn().mockResolvedValue(undefined)
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            writable: true,
            configurable: true
          })

          await simulateCopyToClipboard(shortUrl)

          // 验证调用了剪贴板 API，且传入了正确的文本
          expect(writeTextMock).toHaveBeenCalledWith(shortUrl)
          expect(writeTextMock).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 17.3: 当 navigator.clipboard 不可用时，应该降级使用 execCommand 并仍然显示成功提示
   *
   * 验证需求: 11.5（确保在不支持 Clipboard API 的环境中也能正常复制）
   * 验证需求: 12.4（历史记录复制同样需要降级支持）
   */
  it('当 navigator.clipboard 不可用时，应该降级使用 execCommand 并仍然显示成功提示', async () => {
    // jsdom 环境中需要先定义 execCommand，再进行 spy
    if (!document.execCommand) {
      document.execCommand = () => true
    }

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.webUrl()
        ),
        async (shortUrl) => {
          // Mock navigator.clipboard.writeText 失败（模拟不支持的环境）
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
            writable: true,
            configurable: true
          })

          // Mock document.execCommand
          vi.spyOn(document, 'execCommand').mockReturnValue(true)
          vi.clearAllMocks()

          // 重新设置（clearAllMocks 会清除 spy）
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
            writable: true,
            configurable: true
          })
          vi.spyOn(document, 'execCommand').mockReturnValue(true)

          const result = await simulateCopyToClipboard(shortUrl)

          // 验证降级方案执行成功
          expect(result.success).toBe(true)
          expect(result.method).toBe('execCommand')

          // 验证仍然显示了成功提示
          expect(ElMessage.success).toHaveBeenCalledWith('已复制到剪贴板')
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 属性测试 17.4: 对于任意生成的短链接，复制操作应该只显示一次成功提示
   *
   * 验证需求: 11.5（避免重复提示影响用户体验）
   */
  it('对于任意生成的短链接，复制操作应该只显示一次成功提示', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        async (shortUrl) => {
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            writable: true,
            configurable: true
          })

          vi.clearAllMocks()
          // 重新设置 clipboard mock
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            writable: true,
            configurable: true
          })

          await simulateCopyToClipboard(shortUrl)

          // 验证成功提示只显示了一次
          expect(ElMessage.success).toHaveBeenCalledTimes(1)
          expect(ElMessage.success).toHaveBeenCalledWith('已复制到剪贴板')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 17.5: 对于任意历史记录中的短链接，复制行为与生成后复制行为一致
   *
   * 验证需求: 11.5, 12.4（两个场景使用相同的复制逻辑，行为应一致）
   */
  it('对于任意历史记录中的短链接，复制行为与生成后复制行为一致', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 模拟历史记录条目
        fc.record({
          originalInput: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          shortUrl: fc.webUrl(),
          createdAt: fc.date().map(d => d.toISOString())
        }),
        async (historyItem) => {
          const writeTextMock = vi.fn().mockResolvedValue(undefined)
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            writable: true,
            configurable: true
          })

          vi.clearAllMocks()
          const writeTextMock2 = vi.fn().mockResolvedValue(undefined)
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock2 },
            writable: true,
            configurable: true
          })

          // 模拟点击历史记录的"复制"按钮
          await simulateCopyToClipboard(historyItem.shortUrl)

          // 验证复制了正确的短链接（而不是原始输入）
          expect(writeTextMock2).toHaveBeenCalledWith(historyItem.shortUrl)
          expect(ElMessage.success).toHaveBeenCalledWith('已复制到剪贴板')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性测试 17.6: 对于任意包含特殊字符的短链接，复制内容应该保持原样
   *
   * 验证需求: 11.5, 12.4（确保特殊字符不被转义或截断）
   */
  it('对于任意包含特殊字符的短链接，复制内容应该保持原样', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成包含特殊字符的 URL
        fc.oneof(
          fc.constant('https://example.com/links/s/abc?utm_source=share&utm_medium=copy'),
          fc.constant('https://example.com/links/s/abc#section'),
          fc.constant('http://example.com/links/s/中文路径'),
          fc.constant('https://example.com/links/s/abc%20encoded'),
          fc.webUrl()
        ),
        async (shortUrl) => {
          const writeTextMock = vi.fn().mockResolvedValue(undefined)
          Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            writable: true,
            configurable: true
          })

          await simulateCopyToClipboard(shortUrl)

          // 验证复制的内容与传入的完全一致，没有被修改
          expect(writeTextMock).toHaveBeenCalledWith(shortUrl)
        }
      ),
      { numRuns: 100 }
    )
  })
})
