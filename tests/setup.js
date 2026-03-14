/**
 * Vitest 测试环境设置
 * 配置全局测试环境和模拟对象
 */

import { config } from '@vue/test-utils'

// 过滤掉 Element Plus 组件在测试环境中未注册的已知 Vue 警告（包括 el- 组件和图标组件）
const originalWarn = console.warn
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    msg.includes('Failed to resolve component') ||
    msg.includes('If this is a native custom element')
  ) return
  originalWarn(...args)
}

// 同样过滤 stderr 输出（Vue 内部警告有时直接写 stderr）
const originalError = console.error
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    msg.includes('Failed to resolve component') ||
    msg.includes('If this is a native custom element') ||
    msg.includes('Session validation failed') ||
    msg.includes('Logout API failed')
  ) return
  originalError(...args)
}

// 模拟 localStorage
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

// 模拟 Element Plus 的 ElMessage
global.ElMessage = {
  error: () => {},
  success: () => {},
  warning: () => {},
  info: () => {}
}

// 全局配置 Element Plus 组件 stub（el- 前缀组件）
config.global.stubs = {
  'el-header': {
    template: '<header class="el-header"><slot /></header>'
  },
  'el-button': {
    template: '<button class="el-button" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'disabled', 'loading', 'plain', 'round', 'circle', 'link']
  },
  'el-avatar': {
    template: '<div class="el-avatar"><slot /></div>',
    props: ['src', 'size', 'shape', 'fit']
  },
  'el-dropdown': {
    template: '<div class="el-dropdown" @command="$emit(\'command\', $event)"><slot /><slot name="dropdown" /></div>',
    props: ['command', 'trigger', 'placement']
  },
  'el-dropdown-menu': {
    template: '<div class="el-dropdown-menu"><slot /></div>'
  },
  'el-dropdown-item': {
    template: '<div class="el-dropdown-item" @click="$emit(\'click\')"><slot /></div>',
    props: ['command', 'divided', 'disabled', 'icon']
  },
  'el-dialog': {
    template: '<div class="el-dialog" v-if="modelValue"><slot /><slot name="footer" /></div>',
    props: ['modelValue', 'title', 'width', 'closeOnClickModal', 'destroyOnClose']
  },
  'el-form': {
    template: '<form class="el-form"><slot /></form>',
    props: ['model', 'rules', 'labelWidth', 'labelPosition'],
    methods: {
      validate: (cb) => cb && cb(true),
      resetFields: () => {}
    }
  },
  'el-form-item': {
    template: '<div class="el-form-item"><slot /></div>',
    props: ['label', 'prop', 'rules']
  },
  'el-input': {
    template: '<input class="el-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'type', 'placeholder', 'maxlength', 'showWordLimit', 'rows', 'autosize', 'clearable', 'showPassword'],
    emits: ['update:modelValue', 'input', 'change', 'blur', 'focus']
  },
  'el-tag': {
    template: '<span class="el-tag"><slot /></span>',
    props: ['type', 'size', 'closable', 'effect']
  },
  'el-card': {
    template: '<div class="el-card"><slot /><slot name="header" /></div>',
    props: ['shadow', 'bodyStyle']
  },
  'el-pagination': {
    template: '<div class="el-pagination"></div>',
    props: ['total', 'pageSize', 'currentPage', 'layout', 'pageSizes'],
    emits: ['update:currentPage', 'update:pageSize', 'current-change', 'size-change']
  },
  'el-select': {
    template: '<select class="el-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
    props: ['modelValue', 'placeholder', 'clearable'],
    emits: ['update:modelValue', 'change']
  },
  'el-option': {
    template: '<option class="el-option" :value="value">{{ label }}</option>',
    props: ['value', 'label']
  },
  'el-icon': {
    template: '<i class="el-icon"><slot /></i>',
    props: ['size', 'color']
  },
  'el-empty': {
    template: '<div class="el-empty"><slot /></div>',
    props: ['description', 'imageSize']
  },
  'el-loading': {
    template: '<div class="el-loading"><slot /></div>'
  },
  'el-divider': {
    template: '<hr class="el-divider" />'
  },
  'el-tooltip': {
    template: '<div class="el-tooltip"><slot /></div>',
    props: ['content', 'placement', 'effect']
  }
}

// 注册 Element Plus 图标组件 stub（非 el- 前缀，需用 components 注册）
const iconStub = { template: '<i class="ep-icon" />' }
config.global.components = {
  View: iconStub,
  Star: iconStub,
  ChatDotRound: iconStub,
  Edit: iconStub,
  Delete: iconStub,
  Plus: iconStub,
  Search: iconStub,
  Close: iconStub,
  Check: iconStub,
  ArrowDown: iconStub,
  ArrowUp: iconStub,
  ArrowLeft: iconStub,
  ArrowRight: iconStub,
  User: iconStub,
  Setting: iconStub,
  Link: iconStub,
  CopyDocument: iconStub,
  Share: iconStub,
  Like: iconStub,
  Comment: iconStub,
  Message: iconStub,
  Warning: iconStub,
  InfoFilled: iconStub,
  SuccessFilled: iconStub,
  CircleClose: iconStub,
  Upload: iconStub,
  Download: iconStub,
  Refresh: iconStub,
  Back: iconStub,
  Right: iconStub,
  Top: iconStub,
  Bottom: iconStub
}
