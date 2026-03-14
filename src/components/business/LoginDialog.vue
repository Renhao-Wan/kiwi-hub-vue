<template>
  <el-dialog
    v-model="dialogVisible"
    title="登录"
    width="400px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="rules"
      label-width="0"
      @submit.prevent="handleLogin"
    >
      <el-form-item prop="emailOrUsername">
        <el-input
          v-model="loginForm.emailOrUsername"
          placeholder="邮箱或用户名"
          size="large"
          clearable
        >
          <template #prefix>
            <el-icon><User /></el-icon>
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

      <div class="footer-links">
        <span class="link-text">还没有账号？</span>
        <el-link type="primary" @click="goToRegister">去注册</el-link>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'switch-to-register'])

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

// 对话框显示状态
const dialogVisible = ref(props.modelValue)

// 登录表单数据
const loginForm = reactive({
  emailOrUsername: '',
  password: ''
})

// 表单验证规则
const rules = {
  emailOrUsername: [
    { required: true, message: '请输入邮箱或用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 监听 props 变化，同步对话框状态
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
})

// 监听对话框状态变化，同步到父组件
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

/**
 * 处理登录提交
 */
const handleLogin = async () => {
  // 验证表单
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  loading.value = true
  try {
    // 调用 User Store 的 login action
    await userStore.login({
      emailOrUsername: loginForm.emailOrUsername,
      password: loginForm.password
    })

    ElMessage.success('登录成功')
    
    // 关闭对话框
    dialogVisible.value = false
    
    // 重置表单
    resetForm()
    
    // 登录成功后跳转到首页或原页面
    const redirect = router.currentRoute.value.query.redirect
    if (redirect) {
      router.push(redirect)
    }
  } catch (error) {
    console.error('Login failed:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

/**
 * 切换到注册对话框
 */
const goToRegister = () => {
  dialogVisible.value = false
  emit('switch-to-register')
}

/**
 * 关闭对话框时重置表单
 */
const handleClose = () => {
  resetForm()
}

/**
 * 重置表单
 */
const resetForm = () => {
  loginForm.emailOrUsername = ''
  loginForm.password = ''
  loginFormRef.value?.clearValidate()
}
</script>

<style scoped>
.footer-links {
  text-align: center;
  margin-top: 10px;
}

.link-text {
  color: #909399;
  font-size: 14px;
  margin-right: 5px;
}

:deep(.el-dialog__header) {
  text-align: center;
  font-weight: bold;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
