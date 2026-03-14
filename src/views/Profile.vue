<template>
  <div class="profile-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <template v-else-if="userInfo">
      <!-- 用户信息卡片 -->
      <el-card class="profile-card">
        <div class="profile-header">
          <el-avatar
            :src="userInfo.profile?.avatarUrl"
            :size="80"
            class="profile-avatar"
          >
            {{ userInfo.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>

          <div class="profile-info">
            <div class="profile-name-row">
              <h2 class="profile-username">{{ userInfo.username }}</h2>
              <el-button
                type="primary"
                plain
                size="small"
                @click="openEditDialog"
              >
                <el-icon><Edit /></el-icon>
                编辑资料
              </el-button>
            </div>

            <p class="profile-email">{{ userInfo.email }}</p>

            <p v-if="userInfo.profile?.bio" class="profile-bio">
              {{ userInfo.profile.bio }}
            </p>
            <p v-else class="profile-bio empty-bio">暂无个人简介</p>

            <div class="profile-tags" v-if="userInfo.profile?.tags?.length > 0">
              <el-tag
                v-for="tag in userInfo.profile.tags"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>

            <p class="profile-join-time">
              <el-icon><Calendar /></el-icon>
              注册于 {{ formatTime(userInfo.createdAt) }}
            </p>
          </div>
        </div>

        <!-- 社交统计 -->
        <div class="social-stats">
          <div class="stat-item">
            <span class="stat-value">{{ userInfo.socialStats?.articleCount ?? 0 }}</span>
            <span class="stat-label">文章</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ userInfo.socialStats?.followingCount ?? 0 }}</span>
            <span class="stat-label">关注</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ userInfo.socialStats?.followerCount ?? 0 }}</span>
            <span class="stat-label">粉丝</span>
          </div>
        </div>
      </el-card>

      <!-- 我的文章 -->
      <el-card class="articles-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>我的文章</span>
          </div>
        </template>

        <div v-if="articlesLoading" class="articles-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <template v-else-if="articles.length > 0">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
          />
          <div v-if="totalArticles > pageSize" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="totalArticles"
              layout="prev, pager, next"
              background
              @current-change="fetchArticles"
            />
          </div>
        </template>

        <el-empty v-else description="还没有发布过文章">
          <el-button type="primary" @click="router.push('/')">去首页看看</el-button>
        </el-empty>
      </el-card>
    </template>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑资料"
      width="480px"
      :close-on-click-modal="false"
      @closed="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-position="top"
      >
        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="4"
            placeholder="介绍一下自己吧（最多 200 字）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tag-input-area">
            <div class="tag-list" v-if="editForm.tags.length > 0">
              <el-tag
                v-for="(tag, index) in editForm.tags"
                :key="index"
                closable
                @close="removeTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="tag-add-row">
              <el-input
                v-model="tagInput"
                placeholder="输入标签后按回车添加"
                size="small"
                @keyup.enter="addTag"
                @blur="addTag"
              />
              <el-button size="small" @click="addTag">添加</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveProfile">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Edit, Calendar, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { getCurrentUser, updateProfile } from '@/api/user'
import { getMyArticles } from '@/api/content'
import { formatTime } from '@/utils/formatters'
import ArticleCard from '@/components/common/ArticleCard.vue'

const router = useRouter()
const userStore = useUserStore()

// 用户信息
const userInfo = ref(null)
const loading = ref(false)

// 文章列表
const articles = ref([])
const articlesLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const totalArticles = ref(0)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const saving = ref(false)
const tagInput = ref('')

const editForm = ref({
  bio: '',
  tags: []
})

const editRules = {
  bio: [
    { max: 200, message: '个人简介不能超过 200 字符', trigger: 'blur' }
  ]
}

/**
 * 获取用户信息
 */
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const { data } = await getCurrentUser()
    userInfo.value = data
  } catch (error) {
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 获取用户文章列表
 */
const fetchArticles = async (page = currentPage.value) => {
  articlesLoading.value = true
  try {
    const { data } = await getMyArticles(page, pageSize)
    articles.value = data.list || []
    totalArticles.value = data.total || 0
    currentPage.value = page
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    articlesLoading.value = false
  }
}

/**
 * 打开编辑对话框时初始化表单数据
 */
const openEditDialog = () => {
  editForm.value = {
    bio: userInfo.value?.profile?.bio || '',
    tags: [...(userInfo.value?.profile?.tags || [])]
  }
  editDialogVisible.value = true
}

/**
 * 重置编辑表单
 */
const resetEditForm = () => {
  editForm.value = { bio: '', tags: [] }
  tagInput.value = ''
  editFormRef.value?.clearValidate()
}

/**
 * 添加标签
 */
const addTag = () => {
  const tag = tagInput.value.trim()
  if (!tag) return
  if (editForm.value.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
    tagInput.value = ''
    return
  }
  if (editForm.value.tags.length >= 10) {
    ElMessage.warning('最多添加 10 个标签')
    return
  }
  editForm.value.tags.push(tag)
  tagInput.value = ''
}

/**
 * 删除标签
 */
const removeTag = (index) => {
  editForm.value.tags.splice(index, 1)
}

/**
 * 保存个人资料
 */
const handleSaveProfile = async () => {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await updateProfile({
      bio: editForm.value.bio,
      tags: editForm.value.tags
    })
    ElMessage.success('资料更新成功')
    editDialogVisible.value = false
    // 刷新用户信息
    await fetchUserInfo()
    // 同步更新 store 中的用户信息
    userStore.updateUserInfo(userInfo.value)
  } catch (error) {
    console.error('更新资料失败:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchArticles(1)
})
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* 用户信息卡片 */
.profile-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.profile-username {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.profile-email {
  font-size: 14px;
  color: #909399;
  margin: 0 0 10px 0;
}

.profile-bio {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.empty-bio {
  color: #c0c4cc;
  font-style: italic;
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.profile-join-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin: 0;
}

/* 社交统计 */
.social-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #f0f0f0;
}

/* 文章卡片区 */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.articles-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 编辑对话框 */
.tag-input-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-add-row .el-input {
  flex: 1;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-name-row {
    flex-direction: column;
    align-items: center;
  }

  .profile-tags {
    justify-content: center;
  }

  .profile-join-time {
    justify-content: center;
  }
}
</style>
