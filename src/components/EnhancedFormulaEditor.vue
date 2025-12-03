<template>
  <!-- 主编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    title="公式编辑"
    width="700px"
    append-to-body
  >
    <div class="enhanced-formula-editor">
      <div class="formula-input-area">
        <div class="formula-toolbar">
          <el-dropdown @command="handleTableSelect" trigger="click">
            <el-button size="small" type="primary">
              <el-icon><Document /></el-icon>
              插入表字段
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-for="table in tables" 
                  :key="table.id" 
                  :command="table"
                >
                  {{ table.description }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-dropdown @command="handleOperatorSelect" trigger="click">
            <el-button size="small">
              <el-icon><Operation /></el-icon>
              运算符
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="+">加法 (+)</el-dropdown-item>
                <el-dropdown-item command="-">减法 (-)</el-dropdown-item>
                <el-dropdown-item command="*">乘法 (*)</el-dropdown-item>
                <el-dropdown-item command="/">除法 (/)</el-dropdown-item>
                <el-dropdown-item command="(">左括号 (</el-dropdown-item>
                <el-dropdown-item command=")">右括号 )</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-dropdown @command="handleFunctionSelect" trigger="click">
            <el-button size="small" type="success">
              <el-icon><DataAnalysis /></el-icon>
              插入函数
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="SUM">SUM(字段) - 求和</el-dropdown-item>
                <el-dropdown-item command="AVG">AVG(字段) - 平均值</el-dropdown-item>
                <el-dropdown-item command="COUNT">COUNT(字段) - 计数</el-dropdown-item>
                <el-dropdown-item command="MAX">MAX(字段) - 最大值</el-dropdown-item>
                <el-dropdown-item command="MIN">MIN(字段) - 最小值</el-dropdown-item>
                <el-dropdown-item command="DISTINCT">DISTINCT(字段) - 去重计数</el-dropdown-item>
                <el-dropdown-item command="IF">IF(条件, 真值, 假值) - 条件判断</el-dropdown-item>
                <el-dropdown-item command="FILTER">FILTER(字段, 条件) - 条件过滤</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button size="small" @click="clearFormula">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="formula-textarea-container">
          <textarea
            ref="formulaTextarea"
            v-model="formula"
            placeholder="请输入公式，例如: ${销售明细表.销售金额} + ${销售明细表.折扣金额}"
            class="formula-textarea"
            @input="onFormulaInput"
          ></textarea>
        </div>
        
        <div class="function-help">
        <h4>函数帮助:</h4>
        <div class="help-content">
          <div class="function-list">
            <div class="function-item">
              <strong>SUM(字段)</strong> - 对指定字段求和
            </div>
            <div class="function-item">
              <strong>AVG(字段)</strong> - 计算指定字段的平均值
            </div>
            <div class="function-item">
              <strong>COUNT(字段)</strong> - 统计指定字段的数量
            </div>
            <div class="function-item">
              <strong>MAX(字段)</strong> - 获取指定字段的最大值
            </div>
            <div class="function-item">
              <strong>MIN(字段)</strong> - 获取指定字段的最小值
            </div>
            <div class="function-item">
              <strong>DISTINCT(字段)</strong> - 去重统计指定字段
            </div>
            <div class="function-item">
              <strong>IF(条件, 真值, 假值)</strong> - 条件判断函数，根据条件返回不同值
            </div>
            <div class="function-item">
              <strong>FILTER(字段, 条件)</strong> - 条件过滤函数，根据条件过滤字段值
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 字段选择弹窗 -->
  <el-dialog
    v-model="fieldDialogVisible"
    :title="`选择${selectedTable?.description}的字段`"
    width="600px"
    append-to-body
  >
    <div class="field-list-container">
      <div 
        v-for="field in tableFields[selectedTable?.id || 0]" 
        :key="field.id"
        class="field-item"
        @click="insertField(field)"
      >
        <div class="field-name">{{ field.name }}</div>
        <div class="field-type">
          <el-tag :type="getFieldTypeTagType(field.type)">
            {{ field.type }}
          </el-tag>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="fieldDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Document, Operation, Delete, DataAnalysis } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'

// 弹窗可见性
const dialogVisible = ref(false)

// 定义props
const props = defineProps<{
  modelValue?: string
}>()

// 定义emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    formula.value = newVal
  }
})

// 定义组件属性
const formula = defineModel<string>({ default: '' })

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})
const selectedTable = ref<any>(null)
const fieldDialogVisible = ref(false)

// 公式输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 获取字段类型标签类型
const getFieldTypeTagType = (type: string) => {
  switch (type) {
    case '维度':
      return 'primary'
    case '指标':
      return 'success'
    case '衍生维度':
      return 'warning'
    case '衍生指标':
      return 'danger'
    default:
      return 'info'
  }
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!formulaTextarea.value || !selectedTable.value) return
  
  const fieldName = `\${${selectedTable.value.description}.${field.name}}`
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入字段名
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    fieldName + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 关闭对话框
  fieldDialogVisible.value = false
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到插入字段后
      const newPosition = cursorPosition + fieldName.length
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 处理运算符选择
const handleOperatorSelect = (operator: string) => {
  if (!formulaTextarea.value) return
  
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入运算符
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    operator + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到插入运算符后
      const newPosition = cursorPosition + operator.length
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 处理函数选择
const handleFunctionSelect = (functionName: string) => {
  if (!formulaTextarea.value) return
  
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入函数模板
  const functionTemplate = `${functionName}()`
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    functionTemplate + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到函数括号内，方便用户输入字段
      const newPosition = cursorPosition + functionName.length + 1
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 清空公式
const clearFormula = () => {
  formula.value = ''
}

// 公式输入处理
const onFormulaInput = () => {
  // 可以在这里添加实时验证或其他处理逻辑
}

// 格式化公式预览
const formattedFormula = computed(() => {
  if (!formula.value) return '暂无公式'
  return formula.value
})

// 初始化数据
const initializeData = async () => {
  try {
    // 获取表数据
    const tableData = await getCoreTables()
    tables.value = tableData
    
    // 获取每个表的字段数据
    for (const table of tableData) {
      const fields = await getTableFields(table.id)
      tableFields.value[table.id] = fields
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  initializeData()
})

// 处理函数

// 保存公式
const handleSave = () => {
  emit('update:modelValue', formula.value)
  dialogVisible.value = false
  emit('close')
}

// 取消编辑
const handleCancel = () => {
  dialogVisible.value = false
  emit('close')
}

// 导出方法供父组件使用
defineExpose({
  // 显示弹窗
  showDialog() {
    dialogVisible.value = true
  },
  // 隐藏弹窗
  hideDialog() {
    dialogVisible.value = false
  },
  getFormula: () => formula.value
})
</script>

<style scoped>
.enhanced-formula-editor {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.formula-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.formula-textarea-container {
  margin-bottom: 20px;
}

.formula-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.formula-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.function-help {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.function-help h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.help-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  min-height: 60px;
}

.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.function-item strong {
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.field-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.field-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.field-name {
  font-size: 14px;
  color: #303133;
  margin-right: 10px;
}

.field-type .el-tag {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>