<template>
  <div class="about">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>关于我们</span>
        </div>
      </template>
      <div class="content">
        <p>ToB管理后台框架是一个基于Vue 3和Element Plus构建的后台管理系统。</p>
        <p>该框架提供了常见的后台管理功能，包括但不限于：</p>
        <ul>
          <li>用户认证和权限管理</li>
          <li>菜单和路由管理</li>
          <li>数据展示和报表功能</li>
          <li>系统配置和参数设置</li>
        </ul>
        <p>您可以基于此框架快速开发您的业务系统。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  font-size: 20px;
  font-weight: bold;
}

.content {
  font-size: 16px;
  line-height: 1.6;
}

.content ul {
  padding-left: 20px;
}

.content li {
  margin-bottom: 10px;
}
</style>