<template>
  <div class="test-function-insert">
    <h2>测试添加函数功能</h2>
    
    <div class="test-section">
      <h3>FormulaPopupEditor测试</h3>
      <FormulaPopupEditor v-model="testFormula" />
      <div class="result">
        <h4>结果:</h4>
        <pre>{{ testFormula }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FormulaPopupEditor from '@/components/FormulaPopupEditor.vue'

const testFormula = ref('')
</script>

<style scoped>
.test-function-insert {
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

.result {
  margin-top: 20px;
}

.result h4 {
  margin-bottom: 10px;
}

.result pre {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>