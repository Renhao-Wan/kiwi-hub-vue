<template>
  <div class="comment-list">
    <h3 class="comment-section-title">
      评论 <span class="comment-count">{{ total }}</span>
    </h3>

    <!-- 发布一级评论输入框 -->
    <div class="comment-input-area">
      <el-avatar :src="userStore.avatar" :size="36">
        {{ userStore.username?.charAt(0)?.toUpperCase() || '?' }}
      </el-avatar>
      <div class="input-wrapper">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
          :maxlength="500"
          show-word-limit
          resize="none"
          @focus="handleInputFocus"
        />
        <div v-if="showSubmitBtn" class="submit-area">
          <el-button size="small" @click="cancelComment">取消</el-button>
          <el-button
            type="primary"
            size="small"
            :loading="submitting"
            @click="submitComment"
          >
            发布评论
          </el-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading && comments.length === 0" class="loading-container">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>加载评论中...</span>
    </div>

    <el-empty
      v-else-if="!loading && comments.length === 0"
      description="暂无评论，快来发表第一条评论吧"
      :image-size="80"
    />

    <template v-else>
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :article-id="articleId"
        @need-login="handleNeedLogin"
        @reply-published="handleReplyPublished"
      />

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="handlePageChange"
        />
      </div>
    </template>

    <!-- 登录对话框 -->
    <LoginDialog v-model="loginDialogVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getRootComments, publishComment } from '@/api/content'
import { useUserStore } from '@/store/modules/user'
import CommentItem from '@/components/common/CommentItem.vue'
import LoginDialog from '@/components/business/LoginDialog.vue'

const props = defineProps({
  articleId: {
    type: String,
    required: true
  }
})

const userStore = useUserStore()

// 评论列表状态
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

// 发布评论状态
const newComment = ref('')
const showSubmitBtn = ref(false)
const submitting = ref(false)

// 登录对话框
const loginDialogVisible = ref(false)

/**
 * 获取一级评论列表
 */
const fetchComments = async (page = 1) => {
  loading.value = true
  try {
    const { data } = await getRootComments(props.articleId, page, pageSize)
    comments.value = data.list || []
    total.value = data.total || 0
    currentPage.value = page
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('获取评论失败')
  } finally {
    loading.value = false
  }
}

/**
 * 输入框获得焦点时显示提交按钮
 */
const handleInputFocus = () => {
  if (!userStore.isLoggedIn) {
    loginDialogVisible.value = true
    return
  }
  showSubmitBtn.value = true
}

/**
 * 取消评论
 */
const cancelComment = () => {
  newComment.value = ''
  showSubmitBtn.value = false
}

/**
 * 提交一级评论
 */
const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    loginDialogVisible.value = true
    return
  }

  const content = newComment.value.trim()
  if (!content) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  if (content.length > 500) {
    ElMessage.warning('评论内容不能超过 500 字符')
    return
  }

  submitting.value = true
  try {
    // 一级评论不传 parentId 和 rootId
    await publishComment({
      articleId: props.articleId,
      content
    })
    ElMessage.success('评论发布成功')
    cancelComment()
    // 刷新评论列表，回到第一页
    await fetchComments(1)
  } catch (error) {
    console.error('发布评论失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 处理需要登录的事件
 */
const handleNeedLogin = () => {
  loginDialogVisible.value = true
}

/**
 * 回复发布成功后刷新评论数
 */
const handleReplyPublished = async () => {
  // 重新获取当前页评论以更新回复数
  await fetchComments(currentPage.value)
}

/**
 * 分页切换
 */
const handlePageChange = (page) => {
  fetchComments(page)
  // 滚动到评论区顶部
  document.querySelector('.comment-list')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-list {
  margin-top: 32px;
}

.comment-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.comment-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

/* 评论输入区 */
.comment-input-area {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.input-wrapper {
  flex: 1;
}

.submit-area {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
