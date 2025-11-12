<template>
  <div class="home">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用ToB管理后台</span>
        </div>
      </template>
      <div class="content">
        <p>这是一个基于Vue 3和Element Plus构建的ToB管理后台框架。</p>
        <p>您可以在此基础上开发您的业务功能。</p>
        <el-row :gutter="20" style="margin-top: 30px;">
          <el-col :span="8">
            <el-card class="feature-card">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#409EFF"><DataAnalysis /></el-icon>
                <h3>指标管理</h3>
                <p>管理业务指标和数据报表</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="feature-card">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#67C23A"><Setting /></el-icon>
                <h3>系统配置</h3>
                <p>管理系统参数和用户权限</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="feature-card">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#E6A23C"><House /></el-icon>
                <h3>数据分析</h3>
                <p>查看业务数据和趋势分析</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { DataAnalysis, Setting, House } from '@element-plus/icons-vue'
</script>

<style scoped>
.home {
  padding: 20px;
}

.welcome-card {
  max-width: 1200px;
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

.feature-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-content {
  padding: 20px 0;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.feature-card h3 {
  margin: 10px 0;
  font-size: 18px;
}

.feature-card p {
  color: #999;
  font-size: 14px;
}
</style>