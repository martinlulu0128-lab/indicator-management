<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 侧边栏 -->
      <el-aside 
        width="200px" 
        class="sidebar-container"
        :class="{ 'is-collapse': isCollapse }"
      >
        <Sidebar :is-collapse="isCollapse" />
      </el-aside>

      <el-container>
        <!-- 顶部导航栏 -->
        <el-header 
          style="background-color: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between;"
        >
          <div style="display: flex; align-items: center;">
            <el-icon style="cursor: pointer; font-size: 24px;" @click="toggleSidebar">
              <Menu />
            </el-icon>
            <h2 style="margin-left: 15px;">ToB管理后台</h2>
          </div>
          <div>
            <el-dropdown>
              <span class="el-dropdown-link" style="color: white; cursor: pointer;">
                管理员 <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人信息</el-dropdown-item>
                  <el-dropdown-item>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主内容区域 -->
        <el-main class="main-container">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Menu, ArrowDown } from '@element-plus/icons-vue'
import Sidebar from './components/Sidebar.vue'

// 侧边栏折叠状态
const isCollapse = ref(false)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style>
#app {
  height: 100%;
}

.el-header {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-aside {
  background-color: #304156;
  color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}
</style>