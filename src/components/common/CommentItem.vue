<template>
  <div class="comment-item">
    <!-- 评论主体 -->
    <div class="comment-main">
      <el-avatar :src="comment.avatarUrl" :size="36">
        {{ comment.username?.charAt(0)?.toUpperCase() }}
      </el-avatar>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">{{ comment.username }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
        <div class="comment-actions">
          <el-button
            link
            size="small"
            class="action-btn"
            @click="handleReply"
          >
            回复
          </el-button>
          <el-button
            v-if="comment.replyCount > 0"
            link
            size="small"
            class="action-btn expand-btn"
            @click="toggleReplies"
          >
            {{ showReplies ? '收起回复' : `查看 ${comment.replyCount} 条回复` }}
          </el-button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReplyInput" class="reply-input-area">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="2"
            :placeholder="`回复 @${comment.username}`"
            :maxlength="500"
            show-word-limit
            resize="none"
          />
          <div class="reply-input-actions">
            <el-button size="small" @click="cancelReply">取消</el-button>
            <el-button
              type="primary"
              size="small"
              :loading="submitting"
              @click="submitReply"
            >
              发布
            </el-button>
          </div>
        </div>

        <!-- 楼中楼回复列表 -->
        <div v-if="showReplies" class="replies-container">
          <div v-if="loadingReplies" class="replies-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <template v-else>
            <div
              v-for="reply in replies"
              :key="reply.id"
              class="reply-item"
            >
              <el-avatar :src="reply.avatarUrl" :size="28">
                {{ reply.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="reply-body">
                <div class="reply-meta">
                  <span class="reply-author">{{ reply.username }}</span>
                  <span v-if="reply.replyToUsername" class="reply-to">
                    回复 <span class="reply-to-name">@{{ reply.replyToUsername }}</span>
                  </span>
                  <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                </div>
                <div class="reply-content">{{ reply.content }}</div>
                <el-button
                  link
                  size="small"
                  class="action-btn"
                  @click="handleNestedReply(reply)"
                >
                  回复
                </el-button>
              </div>
            </div>

            <!-- 加载更多回复 -->
            <div v-if="hasMoreReplies" class="load-more-replies">
              <el-button
                link
                size="small"
                :loading="loadingMoreReplies"
                @click="loadMoreReplies"
              >
                加载更多回复
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getReplies, publishComment } from '@/api/content'
import { useUserStore } from '@/store/modules/user'
import { formatTime } from '@/utils/formatters'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  articleId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['need-login', 'reply-published'])

const userStore = useUserStore()

// 回复输入框状态
const showReplyInput = ref(false)
const replyContent = ref('')
const submitting = ref(false)
// 当前回复目标（用于楼中楼嵌套回复）
const replyTarget = ref(null)

// 楼中楼回复状态
const showReplies = ref(false)
const loadingReplies = ref(false)
const loadingMoreReplies = ref(false)
const replies = ref([])
const nextCursor = ref(null)
const hasMoreReplies = ref(false)

/**
 * 点击回复按钮
 */
const handleReply = () => {
  if (!userStore.isLoggedIn) {
    emit('need-login')
    return
  }
  replyTarget.value = null
  showReplyInput.value = !showReplyInput.value
  if (!showReplyInput.value) {
    replyContent.value = ''
  }
}

/**
 * 点击楼中楼的回复按钮
 */
const handleNestedReply = (reply) => {
  if (!userStore.isLoggedIn) {
    emit('need-login')
    return
  }
  replyTarget.value = reply
  showReplyInput.value = true
  replyContent.value = ''
}

/**
 * 取消回复
 */
const cancelReply = () => {
  showReplyInput.value = false
  replyContent.value = ''
  replyTarget.value = null
}

/**
 * 提交回复
 */
const submitReply = async () => {
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  if (content.length > 500) {
    ElMessage.warning('回复内容不能超过 500 字符')
    return
  }

  submitting.value = true
  try {
    const commentData = {
      articleId: props.articleId,
      content,
      rootId: props.comment.id,
      // 如果是回复楼中楼，parentId 为被回复的评论 ID；否则为根评论 ID
      parentId: replyTarget.value ? replyTarget.value.id : props.comment.id
    }
    await publishComment(commentData)
    ElMessage.success('回复成功')
    cancelReply()
    emit('reply-published')
    // 如果回复列表已展开，刷新回复列表
    if (showReplies.value) {
      await refreshReplies()
    }
  } catch (error) {
    console.error('发布回复失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 展开/收起楼中楼回复
 */
const toggleReplies = async () => {
  showReplies.value = !showReplies.value
  if (showReplies.value && replies.value.length === 0) {
    await fetchReplies()
  }
}

/**
 * 获取楼中楼回复（首次加载）
 */
const fetchReplies = async () => {
  loadingReplies.value = true
  try {
    const { data } = await getReplies(props.comment.id, null, 20)
    replies.value = data.list || []
    nextCursor.value = data.nextCursor || null
    hasMoreReplies.value = !!data.nextCursor
  } catch (error) {
    console.error('获取回复失败:', error)
    ElMessage.error('获取回复失败')
  } finally {
    loadingReplies.value = false
  }
}

/**
 * 刷新回复列表（发布回复后调用）
 */
const refreshReplies = async () => {
  loadingReplies.value = true
  try {
    const { data } = await getReplies(props.comment.id, null, 20)
    replies.value = data.list || []
    nextCursor.value = data.nextCursor || null
    hasMoreReplies.value = !!data.nextCursor
  } catch (error) {
    console.error('刷新回复失败:', error)
  } finally {
    loadingReplies.value = false
  }
}

/**
 * 加载更多回复（游标分页）
 */
const loadMoreReplies = async () => {
  if (!nextCursor.value || loadingMoreReplies.value) return
  loadingMoreReplies.value = true
  try {
    const { data } = await getReplies(props.comment.id, nextCursor.value, 20)
    replies.value = [...replies.value, ...(data.list || [])]
    nextCursor.value = data.nextCursor || null
    hasMoreReplies.value = !!data.nextCursor
  } catch (error) {
    console.error('加载更多回复失败:', error)
    ElMessage.error('加载失败，请重试')
  } finally {
    loadingMoreReplies.value = false
  }
}
</script>

<style scoped>
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  font-size: 13px;
  color: #909399;
  padding: 0;
}

.action-btn:hover {
  color: #409eff;
}

.expand-btn {
  color: #409eff;
}

/* 回复输入框 */
.reply-input-area {
  margin-top: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 楼中楼回复列表 */
.replies-container {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid #e8e8e8;
}

.replies-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: #909399;
  font-size: 13px;
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-body {
  flex: 1;
  min-width: 0;
}

.reply-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.reply-to {
  font-size: 12px;
  color: #909399;
}

.reply-to-name {
  color: #409eff;
}

.reply-time {
  font-size: 12px;
  color: #909399;
}

.reply-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 4px;
}

.load-more-replies {
  padding: 8px 0;
  text-align: center;
}
</style>
