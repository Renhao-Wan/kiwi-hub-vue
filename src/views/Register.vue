<template>
  <div class="register-page">
    <el-card class="register-card">
      <h1>注册</h1>
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
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.register-card {
  width: 400px;
  text-align: center;
}
</style>
