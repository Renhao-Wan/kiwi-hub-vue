<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="card-header">
        <router-link to="/" class="logo-link">KiwiHub</router-link>
        <h2>登录</h2>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="邮箱"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            native-type="submit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer-links">
        <span class="hint-text">还没有账号？</span>
        <router-link to="/register" class="link">去注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { isValidEmail, isValidUsername } from '@/utils/validators'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  email: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !isValidUsername(value)) callback(new Error('用户名必须为3-20个字符'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !isValidEmail(value)) callback(new Error('请输入有效的邮箱地址'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({
      username: loginForm.username,
      email: loginForm.email,
      password: loginForm.password
    })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect
    router.push(redirect || '/')
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请检查信息后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.login-card {
  width: 420px;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-link {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
  text-decoration: none;
}

.card-header h2 {
  margin: 8px 0 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.footer-links {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.hint-text {
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
