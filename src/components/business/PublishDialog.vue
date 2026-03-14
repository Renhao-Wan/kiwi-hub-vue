<template>
  <el-dialog
    v-model="dialogVisible"
    title="发布文章"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="publishFormRef"
      :model="publishForm"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handlePublish"
    >
      <el-form-item label="文章标题" prop="title">
        <el-input
          v-model="publishForm.title"
          placeholder="请输入文章标题（最多100字符）"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="文章内容" prop="content">
        <el-input
          v-model="publishForm.content"
          type="textarea"
          placeholder="请输入文章内容"
          :rows="10"
          clearable
        />
      </el-form-item>

      <el-form-item label="文章标签" prop="tags">
        <el-input
          v-model="tagsInput"
          placeholder="请输入标签，多个标签用逗号分隔"
          clearable
        />
        <div v-if="publishForm.tags.length > 0" class="tags-preview">
          <el-tag
            v-for="(tag, index) in publishForm.tags"
            :key="index"
            closable
            @close="removeTag(index)"
            style="margin-right: 8px; margin-top: 8px"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          native-type="submit"
          style="width: 100%"
        >
          发布文章
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { publishArticle } from '@/api/content'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const publishFormRef = ref(null)
const loading = ref(false)

// 对话框显示状态
const dialogVisible = ref(props.modelValue)

// 发布表单数据
const publishForm = reactive({
  title: '',
  content: '',
  tags: []
})

// 标签输入框（用于输入标签字符串）
const tagsInput = ref('')

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 100, message: '标题长度不能超过100字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
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

// 监听标签输入，自动解析标签
watch(tagsInput, (newVal) => {
  if (newVal) {
    // 按逗号分隔标签
    const tags = newVal.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 去重
    publishForm.tags = [...new Set(tags)]
  } else {
    publishForm.tags = []
  }
})

/**
 * 移除标签
 * @param {number} index - 标签索引
 */
const removeTag = (index) => {
  publishForm.tags.splice(index, 1)
  // 更新标签输入框
  tagsInput.value = publishForm.tags.join(', ')
}

/**
 * 处理发布提交
 */
const handlePublish = async () => {
  // 验证表单
  const valid = await publishFormRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  loading.value = true
  try {
    // 调用发布文章 API
    const { data } = await publishArticle({
      title: publishForm.title,
      content: publishForm.content,
      contentType: 'TEXT', // 默认文本类型
      tags: publishForm.tags
    })

    ElMessage.success('文章发布成功')
    
    // 关闭对话框
    dialogVisible.value = false
    
    // 重置表单
    resetForm()
    
    // 跳转到文章详情页
    if (data && data.id) {
      router.push({ name: 'ArticleDetail', params: { id: data.id } })
    } else {
      // 如果没有返回文章 ID，跳转到首页
      router.push({ name: 'Home' })
    }
  } catch (error) {
    console.error('Publish article failed:', error)
    ElMessage.error(error.message || '文章发布失败，请重试')
  } finally {
    loading.value = false
  }
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
  publishForm.title = ''
  publishForm.content = ''
  publishForm.tags = []
  tagsInput.value = ''
  publishFormRef.value?.clearValidate()
}
</script>

<style scoped>
.tags-preview {
  margin-top: 8px;
}

:deep(.el-dialog__header) {
  text-align: center;
  font-weight: bold;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
}
</style>
