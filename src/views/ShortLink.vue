<template>
  <div class="short-link-page">
    <!-- 生成短链接卡片 -->
    <el-card class="generate-card">
      <template #header>
        <div class="card-header">
          <el-icon><Link /></el-icon>
          <span>短链接生成工具</span>
        </div>
      </template>

      <div class="generate-form">
        <el-input
          v-model="articleId"
          placeholder="请输入文章 ID 或完整文章 URL"
          size="large"
          clearable
          @keyup.enter="handleGenerate"
        >
          <template #prefix>
            <el-icon><Document /></el-icon>
          </template>
        </el-input>

        <el-button
          type="primary"
          size="large"
          :loading="generating"
          :disabled="!articleId.trim()"
          @click="handleGenerate"
        >
          生成短链接
        </el-button>
      </div>

      <!-- 生成结果展示 -->
      <div v-if="generatedLink" class="result-area">
        <el-divider />
        <div class="result-label">生成的短链接：</div>
        <div class="result-link-row">
          <el-input
            v-model="generatedLink"
            readonly
            size="large"
          />
          <el-button
            type="success"
            size="large"
            @click="copyToClipboard(generatedLink)"
          >
            <el-icon><CopyDocument /></el-icon>
            一键复制
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 历史记录卡片 -->
    <el-card v-if="historyList.length > 0" class="history-card">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>历史记录</span>
          <el-button
            type="danger"
            text
            size="small"
            @click="clearHistory"
          >
            清空记录
          </el-button>
        </div>
      </template>

      <div class="history-list">
        <div
          v-for="(item, index) in pagedHistory"
          :key="index"
          class="history-item"
        >
          <div class="history-info">
            <div class="history-original">
              <span class="history-label">原始 ID：</span>
              <span class="history-value">{{ item.originalInput }}</span>
            </div>
            <div class="history-short">
              <span class="history-label">短链接：</span>
              <a :href="item.shortUrl" target="_blank" class="history-link">
                {{ item.shortUrl }}
              </a>
            </div>
            <div class="history-time">
              <el-icon><Timer /></el-icon>
              {{ formatTime(item.createdAt) }}
            </div>
          </div>
          <el-button
            type="primary"
            plain
            size="small"
            @click="copyToClipboard(item.shortUrl)"
          >
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="historyList.length > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="historyList.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </el-card>

    <!-- 无历史记录提示 -->
    <el-card v-else class="history-card empty-card">
      <el-empty description="暂无历史记录，快去生成第一条短链接吧" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, Document, CopyDocument, Clock, Timer } from '@element-plus/icons-vue'
import { generateShortLink } from '@/api/link'
import { formatTime } from '@/utils/formatters'

// 历史记录存储 key
const HISTORY_STORAGE_KEY = 'short_link_history'

// 从 localStorage 加载历史记录
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 保存历史记录到 localStorage
const saveHistory = (list) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list))
}

const articleId = ref('')
const generating = ref(false)
const generatedLink = ref('')
const historyList = ref(loadHistory())

// 分页
const currentPage = ref(1)
const pageSize = 5

const pagedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return historyList.value.slice(start, start + pageSize)
})

/**
 * 从输入中提取文章 ID
 * 支持直接输入 ID 或完整 URL（如 /article/xxx）
 */
const extractArticleId = (input) => {
  const trimmed = input.trim()
  // 尝试从 URL 中提取 ID（匹配 /article/xxx 格式）
  const urlMatch = trimmed.match(/\/article\/([^/?#]+)/)
  if (urlMatch) return urlMatch[1]
  return trimmed
}

/**
 * 生成短链接
 */
const handleGenerate = async () => {
  const input = articleId.value.trim()
  if (!input) return

  const id = extractArticleId(input)
  generating.value = true
  generatedLink.value = ''

  try {
    const { data } = await generateShortLink(id)
    // 后端返回短链接代码，拼接完整 URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const shortUrl = data.startsWith('http') ? data : `${baseUrl}/links/s/${data}`
    generatedLink.value = shortUrl

    // 添加到历史记录（最多保留 50 条）
    const newRecord = {
      originalInput: input,
      shortUrl,
      createdAt: new Date().toISOString()
    }
    historyList.value = [newRecord, ...historyList.value].slice(0, 50)
    saveHistory(historyList.value)
    currentPage.value = 1
  } catch {
    // 错误已由响应拦截器处理
  } finally {
    generating.value = false
  }
}

/**
 * 复制到剪贴板
 */
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}

/**
 * 清空历史记录
 */
const clearHistory = () => {
  historyList.value = []
  saveHistory([])
  currentPage.value = 1
}
</script>

<style scoped>
.short-link-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.card-header .el-button {
  margin-left: auto;
}

.generate-form {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.generate-form .el-input {
  flex: 1;
}

.result-area {
  margin-top: 4px;
}

.result-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.result-link-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.result-link-row .el-input {
  flex: 1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  gap: 12px;
}

.history-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-original,
.history-short {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  overflow: hidden;
}

.history-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.history-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-link {
  color: var(--el-color-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-link:hover {
  text-decoration: underline;
}

.history-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.empty-card :deep(.el-card__body) {
  padding: 40px;
}

@media (max-width: 768px) {
  .generate-form {
    flex-direction: column;
  }

  .generate-form .el-button {
    width: 100%;
  }

  .result-link-row {
    flex-direction: column;
    align-items: stretch;
  }

  .result-link-row .el-button {
    width: 100%;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-item .el-button {
    width: 100%;
  }
}
</style>
