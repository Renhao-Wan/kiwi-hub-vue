<template>
  <div class="login-page">
    <el-card class="login-card">
      <h1>登录</h1>
      <p>此页面将在后续任务中实现</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
  text-align: center;
}
</style>
