<template>
  <div class="register-page">
    <el-card class="register-card">
      <div class="card-header">
        <router-link to="/" class="logo-link">KiwiHub</router-link>
        <h2>创建账号</h2>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-width="0"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名（3-20个字符）"
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
            v-model="registerForm.email"
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
            v-model="registerForm.password"
            type="password"
            placeholder="密码（6-12位，包含字母和数字）"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
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
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer-links">
        <span class="hint-text">已有账号？</span>
        <router-link to="/login" class="link">去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { isValidEmail, isValidPassword, isValidUsername } from '@/utils/validators'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请输入用户名'))
      else if (!isValidUsername(value)) callback(new Error('用户名必须为3-20个字符'))
      else callback()
    },
    trigger: 'blur'
  }],
  email: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请输入邮箱地址'))
      else if (!isValidEmail(value)) callback(new Error('请输入有效的邮箱地址'))
      else callback()
    },
    trigger: 'blur'
  }],
  password: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请输入密码'))
      else if (!isValidPassword(value)) callback(new Error('密码必须为6-12位，且包含字母和数字'))
      else callback()
    },
    trigger: 'blur'
  }],
  confirmPassword: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请再次输入密码'))
      else if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'))
      else callback()
    },
    trigger: 'blur'
  }]
}

const handleRegister = async () => {
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.register-card {
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
