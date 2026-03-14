<template>
  <el-header class="app-header">
    <div class="header-content">
      <!-- Logo 和应用名称 -->
      <div class="logo-section">
        <router-link to="/" class="logo-link">
          <span class="logo-text">KiwiHub</span>
        </router-link>
      </div>

      <!-- 导航链接 -->
      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/short-link" class="nav-link">短链接工具</router-link>
      </nav>

      <!-- 用户操作区 -->
      <div class="user-actions">
        <!-- 未登录状态 -->
        <template v-if="!userStore.isLoggedIn">
          <el-button type="primary" @click="showLogin">登录</el-button>
          <el-button @click="showRegister">注册</el-button>
        </template>

        <!-- 已登录状态 -->
        <template v-else>
          <el-button type="primary" @click="showPublish">发布</el-button>
          <el-dropdown @command="handleCommand">
            <el-avatar :src="userStore.avatar" :size="40">
              {{ userStore.username.charAt(0).toUpperCase() }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>

    <!-- 登录对话框 -->
    <LoginDialog
      v-model="loginDialogVisible"
      @switch-to-register="switchToRegister"
    />

    <!-- 注册对话框 -->
    <RegisterDialog
      v-model="registerDialogVisible"
      @switch-to-login="switchToLogin"
      @register-success="handleRegisterSuccess"
    />

    <!-- 发布文章对话框 -->
    <PublishDialog v-model="publishDialogVisible" />
  </el-header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import LoginDialog from '@/components/business/LoginDialog.vue'
import RegisterDialog from '@/components/business/RegisterDialog.vue'
import PublishDialog from '@/components/business/PublishDialog.vue'

const router = useRouter()
const userStore = useUserStore()

// 对话框显示状态
const loginDialogVisible = ref(false)
const registerDialogVisible = ref(false)
const publishDialogVisible = ref(false)

/**
 * 显示登录对话框
 */
const showLogin = () => {
  loginDialogVisible.value = true
}

/**
 * 显示注册对话框
 */
const showRegister = () => {
  registerDialogVisible.value = true
}

/**
 * 从登录切换到注册
 */
const switchToRegister = () => {
  loginDialogVisible.value = false
  registerDialogVisible.value = true
}

/**
 * 从注册切换到登录
 */
const switchToLogin = () => {
  registerDialogVisible.value = false
  loginDialogVisible.value = true
}

/**
 * 注册成功后自动打开登录对话框
 */
const handleRegisterSuccess = () => {
  registerDialogVisible.value = false
  loginDialogVisible.value = true
}

/**
 * 显示发布对话框
 * 未登录时唤起登录弹窗
 */
const showPublish = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再发布文章')
    loginDialogVisible.value = true
    return
  }
  publishDialogVisible.value = true
}

/**
 * 处理下拉菜单命令
 */
const handleCommand = async (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }
}
</script>

<style scoped>
.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0;
  height: 60px;
  line-height: 60px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.logo-section {
  flex-shrink: 0;
}

.logo-link {
  text-decoration: none;
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.logo-text {
  color: #409eff;
}

.nav-links {
  display: flex;
  gap: 30px;
  margin-left: 50px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #409eff;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-dropdown {
  cursor: pointer;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  
  .nav-links {
    display: none;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .user-actions {
    gap: 5px;
  }
  
  .user-actions .el-button {
    padding: 8px 15px;
    font-size: 14px;
  }
}
</style>
