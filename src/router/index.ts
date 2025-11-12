import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首页'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: '关于'
      }
    },
    {
      path: '/indicator-management',
      name: 'indicator-management',
      component: () => import('../views/IndicatorManagement.vue'),
      meta: {
        title: '指标明细表管理'
      }
    },
    {
      path: '/indicator-configuration',
      name: 'indicator-configuration',
      component: () => import('../views/IndicatorConfiguration.vue'),
      meta: {
        title: '指标配置'
      }
    },
    {
      path: '/indicator-monitoring',
      name: 'indicator-monitoring',
      component: () => import('../views/IndicatorMonitoring.vue'),
      meta: {
        title: '指标监控'
      }
    },
    {
    path: '/indicator-theme-design',
    name: 'indicator-theme-design',
    component: () => import('../views/IndicatorThemeList.vue'),
    meta: { title: '指标主题汇总表设计' }
  },
  {
    path: '/indicator-theme-design/editor/:id',
    name: 'indicator-theme-design-editor',
    component: () => import('../views/IndicatorThemeDesign.vue'),
    meta: { title: '指标主题汇总表设计编辑' }
  },
  {
    path: '/test-default-fields',
    name: 'test-default-fields',
    component: () => import('../views/TestDefaultFields.vue'),
    meta: { title: '测试默认字段' }
  },
    
    
    {
      path: '/user-management',
      name: 'user-management',
      component: () => import('../views/UserManagement.vue'),
      meta: {
        title: '用户管理'
      }
    },
    {
      path: '/role-management',
      name: 'role-management',
      component: () => import('../views/RoleManagement.vue'),
      meta: {
        title: '角色管理'
      }
    },
    {
      path: '/permission-management',
      name: 'permission-management',
      component: () => import('../views/PermissionManagement.vue'),
      meta: {
        title: '权限管理'
      }
    }
  ]
})

export default router