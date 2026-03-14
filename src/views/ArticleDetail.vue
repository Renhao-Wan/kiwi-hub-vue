<template>
  <div class="article-detail-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- 文章内容 -->
    <template v-else-if="article">
      <el-card class="article-card">
        <!-- 文章头部：作者信息 -->
        <div class="article-header">
          <el-avatar :src="article.authorAvatar" :size="48">
            {{ article.authorName?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="author-info">
            <span class="author-name">{{ article.authorName }}</span>
            <span class="publish-time">{{ formatTime(article.createdAt) }}</span>
          </div>
        </div>

        <!-- 文章标题 -->
        <h1 class="article-title">{{ article.title }}</h1>

        <!-- 文章标签 -->
        <div class="article-tags" v-if="article.tags && article.tags.length > 0">
          <el-tag
            v-for="tag in article.tags"
            :key="tag"
            size="small"
            type="info"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 文章正文 -->
        <div class="article-content">{{ article.content }}</div>

        <!-- 互动区 -->
        <div class="article-actions">
          <!-- 点赞按钮 -->
          <div
            class="action-item like-btn"
            :class="{ liked: article.isLiked }"
            @click="handleLike"
          >
            <el-icon :size="20">
              <StarFilled v-if="article.isLiked" />
              <Star v-else />
            </el-icon>
            <span>{{ formatNumber(article.likeCount) }}</span>
          </div>

          <!-- 评论数 -->
          <div class="action-item">
            <el-icon :size="20"><ChatDotRound /></el-icon>
            <span>{{ formatNumber(article.commentCount) }}</span>
          </div>

          <!-- 浏览数 -->
          <div class="action-item">
            <el-icon :size="20"><View /></el-icon>
            <span>{{ formatNumber(article.viewCount) }}</span>
          </div>
        </div>
      </el-card>
    </template>

    <!-- 加载失败 -->
    <el-empty v-else description="文章不存在或已被删除">
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </el-empty>

    <!-- 评论区 -->
    <CommentList v-if="article" :article-id="String(article.id)" />

    <!-- 登录对话框 -->
    <LoginDialog v-model="loginDialogVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Star, StarFilled, ChatDotRound, View } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { getArticleDetail, toggleLike } from '@/api/content'
import { formatTime, formatNumber } from '@/utils/formatters'
import LoginDialog from '@/components/business/LoginDialog.vue'
import CommentList from '@/components/business/CommentList.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const article = ref(null)
const loading = ref(false)
const loginDialogVisible = ref(false)

/**
 * 获取文章详情
 */
const fetchArticle = async () => {
  loading.value = true
  try {
    const { data } = await getArticleDetail(route.params.id)
    // 初始化前端维护的点赞状态
    article.value = { ...data, isLiked: data.isLiked ?? false }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
    article.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 处理点赞/取消点赞（乐观更新）
 */
const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    loginDialogVisible.value = true
    return
  }

  // 乐观更新：立即更新 UI
  const prevLiked = article.value.isLiked
  const prevCount = article.value.likeCount
  article.value.isLiked = !prevLiked
  article.value.likeCount = prevLiked ? prevCount - 1 : prevCount + 1

  try {
    await toggleLike(article.value.id, article.value.authorId)
  } catch (error) {
    // API 失败时回滚 UI 状态
    article.value.isLiked = prevLiked
    article.value.likeCount = prevCount
    ElMessage.error('操作失败，请稍后重试')
  }
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #909399;
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
}

.article-card {
  margin-bottom: 20px;
}

.article-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.author-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.publish-time {
  font-size: 13px;
  color: #909399;
  margin-top: 3px;
}

.article-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 32px;
  min-height: 100px;
}

.article-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;
  cursor: default;
}

.like-btn {
  cursor: pointer;
  transition: color 0.2s;
  user-select: none;
}

.like-btn:hover {
  color: #f5a623;
}

.like-btn.liked {
  color: #f5a623;
}

@media (max-width: 768px) {
  .article-detail-page {
    padding: 12px;
  }

  .article-title {
    font-size: 20px;
  }

  .article-content {
    font-size: 15px;
  }
}
</style>
