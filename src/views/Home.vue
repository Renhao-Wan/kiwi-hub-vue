<template>
  <div class="home-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文章..."
        clearable
        class="search-input"
        @input="handleSearchInput"
        @keyup.enter="handleSearch"
        @clear="handleClearSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="sortBy"
        class="sort-select"
        placeholder="排序方式"
      >
        <el-option label="相关度" value="RELEVANCE" />
        <el-option label="最新时间" value="TIME" />
        <el-option label="浏览量" value="VIEW_COUNT" />
        <el-option label="点赞数" value="LIKE_COUNT" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button v-if="isSearchMode" @click="handleClearSearch">清除</el-button>
    </div>

    <!-- 搜索模式提示 -->
    <div v-if="isSearchMode" class="search-hint">
      搜索 "<strong>{{ activeKeyword }}</strong>" 的结果，共 {{ total }} 篇
    </div>

    <!-- 文章列表 -->
    <div v-if="!loading && articles.length > 0" class="article-list">
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="isSearchMode ? applyHighlight(article) : article"
      />
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && articles.length === 0"
      :description="isSearchMode ? '未找到相关文章' : '暂无文章'"
      :image-size="200"
    />

    <!-- 分页器 -->
    <div v-if="!loading && total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Search } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import { getArticleList, searchArticles } from '@/api/content'
import { debounce, throttle } from '@/utils/formatters'

// 文章列表数据
const articles = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索相关状态
const searchKeyword = ref('')
const activeKeyword = ref('') // 当前生效的搜索词
const sortBy = ref('RELEVANCE')
const isSearchMode = ref(false)

/**
 * 高亮关键词工具函数
 * @param {string} text - 原始文本
 * @param {string} keyword - 关键词
 * @returns {string} 包含高亮标签的 HTML 字符串
 */
const highlightKeyword = (text, keyword) => {
  if (!text || !keyword) return text || ''
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

/**
 * 对文章数据的标题和摘要应用关键词高亮
 * @param {Object} article - 文章对象
 * @returns {Object} 带高亮的文章对象副本
 */
const applyHighlight = (article) => {
  if (!activeKeyword.value) return article
  return {
    ...article,
    title: highlightKeyword(article.title, activeKeyword.value),
    summary: highlightKeyword(article.summary, activeKeyword.value),
    _highlighted: true
  }
}

/**
 * 获取普通文章列表
 */
const fetchArticles = async () => {
  loading.value = true
  try {
    const { data } = await getArticleList(currentPage.value, pageSize.value)
    if (data && data.list) {
      articles.value = data.list
      total.value = data.total || 0
    } else {
      articles.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    ElMessage.error('获取文章列表失败，请稍后重试')
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 执行搜索
 */
const fetchSearchResults = async () => {
  loading.value = true
  try {
    const { data } = await searchArticles({
      keyword: activeKeyword.value,
      searchMode: 'FULL_TEXT',
      sortBy: sortBy.value,
      sortOrder: 'DESC',
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    if (data && data.list) {
      articles.value = data.list
      total.value = data.total || 0
    } else {
      articles.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('搜索文章失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 统一的数据加载入口
 */
const loadData = () => {
  if (isSearchMode.value) {
    fetchSearchResults()
  } else {
    fetchArticles()
  }
}

/**
 * 触发搜索
 */
const handleSearch = () => {
  const kw = searchKeyword.value.trim()
  if (!kw) {
    handleClearSearch()
    return
  }
  activeKeyword.value = kw
  isSearchMode.value = true
  currentPage.value = 1
  fetchSearchResults()
}

/**
 * 搜索输入框防抖处理（输入停止 500ms 后自动触发搜索）
 */
const handleSearchInput = debounce(() => {
  const kw = searchKeyword.value.trim()
  if (kw) {
    handleSearch()
  }
}, 500)

/**
 * 清除搜索，回到普通列表
 */
const handleClearSearch = () => {
  searchKeyword.value = ''
  activeKeyword.value = ''
  isSearchMode.value = false
  currentPage.value = 1
  fetchArticles()
}

/**
 * 处理每页大小变化
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadData()
}

/**
 * 处理当前页变化（节流：200ms 内只响应一次）
 */
const handleCurrentChange = throttle((newPage) => {
  currentPage.value = newPage
  loadData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}, 200)

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.search-input {
  flex: 1;
}

.sort-select {
  width: 130px;
  flex-shrink: 0;
}

/* 搜索提示 */
.search-hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
  padding: 0 4px;
}

.article-list {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 关键词高亮样式（全局，因为 v-html 渲染的内容不受 scoped 影响） */
:deep(.highlight) {
  background-color: #fff3cd;
  color: #856404;
  border-radius: 2px;
  padding: 0 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 12px;
  }

  .search-bar {
    flex-wrap: wrap;
    padding: 12px;
  }

  .search-input {
    width: 100%;
    flex: none;
  }

  .sort-select {
    flex: 1;
  }

  .pagination-container {
    overflow-x: auto;
  }

  .pagination-container :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-container :deep(.el-pagination__sizes) {
    margin-bottom: 8px;
  }
}
</style>
