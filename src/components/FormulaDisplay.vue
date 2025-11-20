<template>
  <div class="formula-display">
    <div class="formula-content">
      <div 
        v-for="(formula, index) in formulaList" 
        :key="index"
        class="formula-item"
      >
        <div class="formula-text">{{ formula || '暂无公式内容' }}</div>
        <el-button 
          type="primary" 
          link 
          @click="editFormula(index)"
          class="edit-button"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>
    
    <!-- 公式编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑公式"
      width="700px"
      append-to-body
    >
      <div class="formula-editor-container">
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
          
          <el-button size="small" @click="clearFormula">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="formula-textarea-container">
          <textarea
            ref="formulaTextarea"
            v-model="editingFormula"
            placeholder="请输入公式，例如: [销售明细表.销售金额] + [销售明细表.折扣金额]"
            class="formula-textarea"
            @focus="setCurrentFocusIndex"
          ></textarea>
        </div>
        
        <div class="formula-preview">
          <h4>公式预览:</h4>
          <div class="preview-content">
            <pre>{{ formattedFormula }}</pre>
          </div>
        </div>
      </div>
      
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
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFormula">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Edit, Document, Operation, Delete } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'
import filter from '@/utils/filter'

// 定义组件属性
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 公式列表
const formulaList = ref<string[]>([])

// 弹窗可见性
const dialogVisible = ref(false)

// 正在编辑的公式索引
const editingIndex = ref(0)

// 正在编辑的公式内容
const editingFormula = ref('')

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})
const selectedTable = ref<any>(null)
const fieldDialogVisible = ref(false)

// 公式输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 当前焦点公式索引
const currentFocusIndex = ref(0)

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const lines = newValue.split('\n');
    formulaList.value = filter(lines, f => f.trim() !== '');
  } else {
    formulaList.value = []
  }
}, { immediate: true })

// 格式化公式预览
const formattedFormula = computed(() => {
  if (!editingFormula.value) return '暂无公式'
  return editingFormula.value
})

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

// 编辑公式
const editFormula = (index: number) => {
  editingIndex.value = index
  editingFormula.value = formulaList.value[index] || ''
  dialogVisible.value = true
}

// 设置当前焦点索引
const setCurrentFocusIndex = () => {
  currentFocusIndex.value = editingIndex.value
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!formulaTextarea.value || !selectedTable.value) return
  
  const fieldName = `[${selectedTable.value.description}.${field.name}]`
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入字段名
  editingFormula.value = 
    editingFormula.value.substring(0, cursorPosition) + 
    fieldName + 
    editingFormula.value.substring(formulaTextarea.value.selectionEnd)
  
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
  editingFormula.value = 
    editingFormula.value.substring(0, cursorPosition) + 
    operator + 
    editingFormula.value.substring(formulaTextarea.value.selectionEnd)
  
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

// 清空公式
const clearFormula = () => {
  editingFormula.value = ''
}

// 保存公式
const saveFormula = () => {
  // 更新公式列表
  formulaList.value[editingIndex.value] = editingFormula.value
  
  // 过滤掉空公式并用换行符连接
  const formulas = filter(formulaList.value, f => f.trim() !== '');
  const formulaString = formulas.join('\n')
  emit('update:modelValue', formulaString)
  
  // 关闭弹窗
  dialogVisible.value = false
}

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
</script>

<style scoped>
.formula-display {
  width: 100%;
}

.formula-content {
  min-height: 40px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
}

.formula-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.formula-item:last-child {
  border-bottom: none;
}

.formula-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

.edit-button {
  margin-left: 10px;
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

.formula-preview {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.formula-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.preview-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  min-height: 60px;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #606266;
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