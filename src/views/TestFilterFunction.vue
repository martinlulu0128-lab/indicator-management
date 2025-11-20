<template>
  <div class="test-filter-function">
    <h2>Filter函数测试</h2>
    
    <div class="test-section">
      <h3>基础过滤测试</h3>
      <p>原始数据: {{ testData }}</p>
      <p>过滤条件: 年龄大于25</p>
      <p>过滤结果: {{ filteredData1 }}</p>
    </div>
    
    <div class="test-section">
      <h3>函数条件过滤测试</h3>
      <p>原始数据: {{ testData }}</p>
      <p>过滤条件: 姓名包含"三"</p>
      <p>过滤结果: {{ filteredData2 }}</p>
    </div>
    
    <div class="test-section">
      <h3>操作符过滤测试</h3>
      <p>原始数据: {{ testData }}</p>
      <p>过滤条件: 年龄大于等于30</p>
      <p>过滤结果: {{ filteredData3 }}</p>
    </div>
    
    <div class="test-section">
      <h3>filterEmpty函数测试</h3>
      <p>原始数据: {{ arrayWithEmpty }}</p>
      <p>过滤结果: {{ filteredEmptyData }}</p>
    </div>
    
    <div class="test-section">
      <h3>filterMultiple函数测试 (AND逻辑)</h3>
      <p>原始数据: {{ testData }}</p>
      <p>过滤条件: 年龄大于25 且 姓名包含"三"</p>
      <p>过滤结果: {{ filteredMultipleData }}</p>
    </div>
    
    <div class="test-section">
      <h3>filterMultipleOr函数测试 (OR逻辑)</h3>
      <p>原始数据: {{ testData }}</p>
      <p>过滤条件: 年龄小于20 或 姓名包含"四"</p>
      <p>过滤结果: {{ filteredMultipleOrData }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { filter, filterEmpty, filterMultiple, filterMultipleOr } from '@/utils/filter'

// 测试数据
const testData = ref([
  { name: '张三', age: 25, city: '北京' },
  { name: '李四', age: 30, city: '上海' },
  { name: '王五', age: 20, city: '广州' },
  { name: '赵六', age: 35, city: '深圳' },
  { name: '钱七', age: 28, city: '杭州' }
])

// 包含空值的数组
const arrayWithEmpty = ref([1, '', null, 'hello', undefined, 0, 'world', [], {}])

// 基础过滤测试 (年龄大于25)
const filteredData1 = computed(() => {
  return filter(testData.value, item => item.age > 25)
})

// 函数条件过滤测试 (姓名包含"三")
const filteredData2 = computed(() => {
  return filter(testData.value, { name: (value: string) => value.includes('三') })
})

// 操作符过滤测试 (年龄大于等于30)
const filteredData3 = computed(() => {
  return filter(testData.value, { age: { operator: 'gte', value: 30 } })
})

// filterEmpty函数测试
const filteredEmptyData = computed(() => {
  return filterEmpty(arrayWithEmpty.value)
})

// filterMultiple函数测试 (AND逻辑)
const filteredMultipleData = computed(() => {
  return filterMultiple(testData.value, [
    item => item.age > 25,
    item => item.name.includes('三')
  ])
})

// filterMultipleOr函数测试 (OR逻辑)
const filteredMultipleOrData = computed(() => {
  return filterMultipleOr(testData.value, [
    item => item.age < 20,
    item => item.name.includes('四')
  ])
})
</script>

<style scoped>
.test-filter-function {
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