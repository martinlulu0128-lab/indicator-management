<template>
  <div class="sidebar">
    <el-menu
      :default-active="activeIndex"
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
        <el-menu-item index="/indicator-management">指标明细表管理</el-menu-item>
        <el-menu-item index="/indicator-configuration">指标配置</el-menu-item>
        <el-menu-item index="/indicator-monitoring">指标监控</el-menu-item>
        <el-menu-item index="/indicator-theme-design">指标主题汇总表设计</el-menu-item>
        <el-menu-item index="/test-default-fields">测试默认字段</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="3">
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