import { createApp } from 'vue'
import ElementPlus, { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/index.css'
import App from './App.vue'
import router from './router'
import pinia from './store'
import { useUserStore } from './store/modules/user'

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.use(pinia)

// 应用启动时恢复登录状态
const userStore = useUserStore()
userStore.restoreAuth().then(() => {
  app.mount('#app')
})

// 全局 Vue 组件运行时错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 组件错误:', err, info)
  ElMessage.error('应用出现错误，请刷新页面重试')
}

// 全局未捕获 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未捕获的 Promise 错误:', event.reason)
  ElMessage.error('操作失败，请重试')
})
