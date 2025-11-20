<template>
  <div class="test-edit-function">
    <h2>测试编辑功能</h2>
    <el-button @click="testEditFunction">测试编辑ID为1的报表</el-button>
    <el-button @click="checkLocalStorage">检查LocalStorage数据</el-button>
    <div v-if="localStorageData" class="local-storage-data">
      <h3>LocalStorage 数据:</h3>
      <pre>{{ localStorageData }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const localStorageData = ref('')

const testEditFunction = () => {
  // 跳转到编辑页面，编辑ID为1的报表
  router.push('/indicator-theme-design/editor/1')
}

const checkLocalStorage = () => {
  const data = localStorage.getItem('indicatorThemeReports')
  if (data) {
    localStorageData.value = JSON.stringify(JSON.parse(data), null, 2)
  } else {
    localStorageData.value = '暂无数据'
  }
}
</script>

<style scoped>
.test-edit-function {
  padding: 20px;
}

.local-storage-data {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>