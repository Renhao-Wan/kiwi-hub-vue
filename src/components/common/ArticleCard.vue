<template>
  <el-card class="article-card" shadow="hover" @click="goToDetail">
    <!-- 文章头部：作者信息 -->
    <div class="article-header">
      <el-avatar :src="article.authorAvatar" :size="40" />
      <div class="author-info">
        <span class="author-name">{{ article.authorName }}</span>
        <span class="publish-time">{{ formatTime(article.createdAt) }}</span>
      </div>
    </div>

    <!-- 文章标题（搜索模式下用 v-html 渲染高亮） -->
    <h3
      class="article-title"
      v-if="article._highlighted"
      v-html="article.title"
    />
    <h3 class="article-title" v-else>{{ article.title }}</h3>

    <!-- 文章摘要（搜索模式下用 v-html 渲染高亮） -->
    <p
      class="article-summary"
      v-if="article._highlighted"
      v-html="article.summary"
    />
    <p class="article-summary" v-else>{{ article.summary }}</p>

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

    <!-- 文章统计数据 -->
    <div class="article-stats">
      <span class="stat-item">
        <el-icon><View /></el-icon>
        {{ formatNumber(article.viewCount) }}
      </span>
      <span class="stat-item">
        <el-icon><Star /></el-icon>
        {{ formatNumber(article.likeCount) }}
      </span>
      <span class="stat-item">
        <el-icon><ChatDotRound /></el-icon>
        {{ formatNumber(article.commentCount) }}
      </span>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { View, Star, ChatDotRound } from '@element-plus/icons-vue'
import { formatTime, formatNumber } from '@/utils/formatters'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const router = useRouter()

/**
 * 跳转到文章详情页
 */
const goToDetail = () => {
  router.push({ name: 'ArticleDetail', params: { id: props.article.id } })
}
</script>

<style scoped>
.article-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-2px);
}

.article-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
}

.publish-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.stat-item .el-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-title {
    font-size: 16px;
  }

  .article-summary {
    font-size: 13px;
  }

  .article-stats {
    gap: 12px;
  }

  .stat-item {
    font-size: 12px;
  }
}
</style>
