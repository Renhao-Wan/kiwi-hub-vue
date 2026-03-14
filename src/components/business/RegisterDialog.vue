<template>
  <el-dialog
    v-model="dialogVisible"
    title="注册"
    width="450px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
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

      <div class="footer-links">
        <span class="link-text">已有账号？</span>
        <el-link type="primary" @click="goToLogin">去登录</el-link>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { isValidEmail, isValidPassword, isValidUsername } from '@/utils/validators'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'switch-to-login', 'register-success'])

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

// 对话框显示状态
const dialogVisible = ref(props.modelValue)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 自定义验证器 - 用户名
const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (!isValidUsername(value)) {
    callback(new Error('用户名必须为3-20个字符'))
  } else {
    callback()
  }
}

// 自定义验证器 - 邮箱
const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入邮箱地址'))
  } else if (!isValidEmail(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 自定义验证器 - 密码
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (!isValidPassword(value)) {
    callback(new Error('密码必须为6-12位，且包含字母和数字'))
  } else {
    callback()
  }
}

// 自定义验证器 - 确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [{ validator: validateUsername, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
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
 * 处理注册提交
 */
const handleRegister = async () => {
  // 验证表单
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  loading.value = true
  try {
    // 调用注册 API
    await register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })

    ElMessage.success('注册成功，请登录')
    
    // 关闭对话框
    dialogVisible.value = false
    
    // 重置表单
    resetForm()
    
    // 通知父组件注册成功，切换到登录对话框
    emit('register-success')
  } catch (error) {
    console.error('Register failed:', error)
    ElMessage.error(error.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}

/**
 * 切换到登录对话框
 */
const goToLogin = () => {
  dialogVisible.value = false
  emit('switch-to-login')
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
  registerForm.username = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerFormRef.value?.clearValidate()
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
