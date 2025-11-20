<template>
  <div class="sidebar">
    <el-menu
      :default-active="$route.path"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      :collapse-transition="false"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <span>首页</span>
      </el-menu-item>
      
      <el-sub-menu index="2">
        <template #title>
          <el-icon><DataAnalysis /></el-icon>
          <span>指标管理</span>
        </template>
        <el-menu-item index="/indicator-management">指标事实表管理</el-menu-item>
        <el-menu-item index="/indicator-list">指标清单</el-menu-item>
        <el-menu-item index="/indicator-monitoring">指标监控</el-menu-item>
        <!-- 暂时隐藏指标主题汇总表设计菜单项 -->
        <!-- <el-menu-item index="/indicator-theme-design">指标主题汇总表设计</el-menu-item> -->
      </el-sub-menu>
      
      <el-sub-menu index="3">
      <template #title>
        <el-icon><Operation /></el-icon>
        <span>测试功能</span>
      </template>
      <el-menu-item index="/test-default-fields">测试默认字段</el-menu-item>
      <el-menu-item index="/test-edit-function">测试编辑功能</el-menu-item>
      <el-menu-item index="/test-filter-function">测试Filter函数</el-menu-item>
      <el-menu-item index="/test-filter-simple">简单Filter函数测试</el-menu-item>
      <el-menu-item index="/test-function-insert">测试添加函数功能</el-menu-item>
    </el-sub-menu>
      
      <el-sub-menu index="4">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item index="/user-management">用户管理</el-menu-item>
        <el-menu-item index="/role-management">角色管理</el-menu-item>
        <el-menu-item index="/permission-management">权限管理</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { House, DataAnalysis, Setting } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const $route = useRoute()

// 定义props
defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.sidebar {
  height: 100%;
}

.el-menu-vertical {
  height: 100%;
  border: none;
}

.el-menu-item:focus {
  outline: none;
}

.el-sub-menu .el-menu-item {
  background-color: #1f2d3d !important;
  min-width: 200px;
}

.el-sub-menu .el-menu-item:hover {
  background-color: #001528 !important;
}
</style>