<template>
  <div class="multi-formula-editor">
    <div class="formula-list">
      <div 
        v-for="(formula, index) in formulaList" 
        :key="index"
        class="formula-item"
      >
        <div class="formula-header">
          <span class="formula-title">公式 {{ index + 1 }}</span>
          <el-button 
            v-if="formulaList.length > 1"
            type="danger" 
            icon="Delete" 
            circle 
            size="small"
            @click="removeFormula(index)"
          />
        </div>
        <el-input
          v-model="formulaList[index]"
          placeholder="请输入公式，例如: [销售明细表.销售金额] + [销售明细表.折扣金额]"
          type="textarea"
          :rows="3"
          class="formula-input"
        />
      </div>
    </div>
    
    <div class="formula-actions">
      <el-button 
        type="primary" 
        plain 
        icon="Plus" 
        @click="addFormula"
      >
        添加公式
      </el-button>
    </div>
    
    <div class="formula-preview-section">
      <h4>公式预览:</h4>
      <div class="preview-content">
        <div 
          v-for="(formula, index) in formulaList" 
          :key="index"
          class="preview-item"
        >
          <strong>公式 {{ index + 1 }}:</strong>
          <pre v-if="formula">{{ formula }}</pre>
          <pre v-else class="empty-formula">暂无公式内容</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import filter from '@/utils/filter'

// 定义组件属性
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 公式列表
const formulaList = ref<string[]>([''])

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const lines = newValue.split('\n');
    formulaList.value = filter(lines, (f: string) => f.trim() !== '');
    if (formulaList.value.length === 0) {
      formulaList.value = ['']
    }
  } else {
    formulaList.value = ['']
  }
}, { immediate: true })

// 监听formulaList变化并更新modelValue
watch(formulaList, (newList) => {
  // 过滤掉空公式并用换行符连接
  const formulas = newList.filter(f => f.trim() !== '')
  const formulaString = formulas.join('\n')
  emit('update:modelValue', formulaString)
}, { deep: true })

// 添加公式
const addFormula = () => {
  formulaList.value.push('')
}

// 删除公式
const removeFormula = (index: number) => {
  if (formulaList.value.length > 1) {
    formulaList.value.splice(index, 1)
  }
}
</script>

<style scoped>
.multi-formula-editor {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.formula-list {
  margin-bottom: 20px;
}

.formula-item {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.formula-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.formula-title {
  font-weight: bold;
  color: #303133;
}

.formula-input {
  width: 100%;
}

.formula-actions {
  margin-bottom: 20px;
}

.formula-preview-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.formula-preview-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.preview-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.preview-item {
  margin-bottom: 15px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item pre {
  margin: 5px 0 0 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
}

.empty-formula {
  color: #909399;
  font-style: italic;
}
</style>