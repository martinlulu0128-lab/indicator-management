<template>
  <div class="test-filter-simple">
    <h2>简单Filter函数测试</h2>
    
    <div class="test-section">
      <h3>字符串数组过滤测试</h3>
      <p>原始数据: {{ stringArray }}</p>
      <p>过滤条件: 非空字符串</p>
      <p>过滤结果: {{ filteredStringArray }}</p>
    </div>
    
    <div class="test-section">
      <h3>数字数组过滤测试</h3>
      <p>原始数据: {{ numberArray }}</p>
      <p>过滤条件: 大于10</p>
      <p>过滤结果: {{ filteredNumberArray }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import filter from '@/utils/filter'

// 字符串数组测试
const stringArray = ref(['', 'hello', ' ', 'world', null, 'test'])

// 数字数组测试
const numberArray = ref([5, 10, 15, 20, 25, 30])

// 字符串数组过滤测试
const filteredStringArray = computed(() => {
  return filter(stringArray.value, (item: string) => item && item.trim() !== '')
})

// 数字数组过滤测试
const filteredNumberArray = computed(() => {
  return filter(numberArray.value, (item: number) => item > 10)
})
</script>

<style scoped>
.test-filter-simple {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.test-section h3 {
  margin-top: 0;
}

.test-section p {
  margin: 5px 0;
}
</style>