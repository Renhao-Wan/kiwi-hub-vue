import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import AppLayout from '@/layout/AppLayout.vue'

/**
 * 路由配置
 * 使用懒加载优化首屏加载性能
 */
const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { 
          title: '首页',
          requiresAuth: false
        }
      },
      {
        path: 'article/:id',
        name: 'ArticleDetail',
        component: () => import('@/views/ArticleDetail.vue'),
        meta: { 
          title: '文章详情',
          requiresAuth: false
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { 
          title: '个人主页',
          requiresAuth: true
        }
      },
      {
        path: 'short-link',
        name: 'ShortLink',
        component: () => import('@/views/ShortLink.vue'),
        meta: { 
          title: '短链接工具',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { 
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { 
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局前置导航守卫
 * 处理认证检查和路由重定向逻辑
 */
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - KiwiHub`
  }
  
  // 检查需要认证的路由
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 未登录用户访问需要认证的路由，重定向到登录页
    // 保存原始目标路径，登录后可以重定向回来
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    })
    return
  }
  
  // 已登录用户访问登录页或注册页，重定向到首页
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isLoggedIn) {
    next({ name: 'Home' })
    return
  }
  
  // 正常放行
  next()
})

export default router
