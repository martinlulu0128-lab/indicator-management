<template>
  <div class="formula-popup-editor">
    <!-- 公式编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="公式编辑"
      width="800px"
      :before-close="handleClose"
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
                <el-input 
                  v-model="tableSearchKeyword" 
                  placeholder="搜索表..." 
                  size="small"
                  clearable
                  style="padding: 5px 10px;"
                />
                <el-dropdown-item 
                  v-for="table in filteredTables" 
                  :key="table.id" 
                  :command="table"
                >
                  {{ table.description }}
                </el-dropdown-item>
                <el-dropdown-item v-if="filteredTables.length === 0" disabled>
                  未找到匹配的表
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
              <el-icon><MagicStick /></el-icon>
              添加函数
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-input 
                  v-model="functionSearchKeyword" 
                  placeholder="搜索函数..." 
                  size="small"
                  clearable
                  style="padding: 5px 10px;"
                />
                <el-dropdown-item 
                  v-for="func in filteredFunctions" 
                  :key="func.name" 
                  :command="func.name"
                >
                  {{ func.name }} - {{ func.description }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button size="small" @click="clearCurrentFormula">
            <el-icon><Delete /></el-icon>
            清空当前公式
          </el-button>
        </div>
        
        <!-- 多公式编辑区域 -->
        <div class="multi-formula-container">
          <div 
            v-for="(formulaItem, index) in formulaList" 
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
            <textarea
              v-model="formulaList[index]"
              placeholder="请输入公式，例如: ${销售明细表.销售金额} + ${销售明细表.折扣金额}"
              class="formula-textarea"
              @focus="currentFocusIndex = index"
            ></textarea>
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
        </div>
        
        <!-- 函数帮助预览 -->
        <div class="function-help-section" v-if="currentFunctionHelp">
          <h4>函数帮助:</h4>
          <div class="help-content">
            <div class="function-name">{{ currentFunctionHelp.name }}</div>
            <div class="function-description">{{ currentFunctionHelp.description }}</div>
            <div class="function-usage">
              <strong>用法:</strong> {{ currentFunctionHelp.usage }}
            </div>
            <div class="function-example" v-if="currentFunctionHelp.example">
              <strong>示例:</strong> {{ currentFunctionHelp.example }}
            </div>
          </div>
        </div>
        
        <!-- 公式预览 -->
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
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveFormulas">保存</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Document, Operation, Delete, Edit, MagicStick } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'
import filter from '@/utils/filter'

// 定义组件属性
const props = defineProps<{
  modelValue: string
  dialogVisible?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:dialogVisible', value: boolean): void
}>()

// 弹窗可见性
const dialogVisible = ref(false)

// 监听外部dialogVisible变化
watch(() => props.dialogVisible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    openFormulaDialog()
  }
})

// 监听内部dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:dialogVisible', newVal)
})

// 公式列表
const formulaList = ref<string[]>([''])

// 当前焦点公式索引
const currentFocusIndex = ref(0)

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})
const selectedTable = ref<any>(null)
const fieldDialogVisible = ref(false)

// 表搜索关键词
const tableSearchKeyword = ref('')

// 过滤后的表列表
const filteredTables = computed(() => {
  if (!tableSearchKeyword.value) {
    return tables.value
  }
  return filter(tables.value, table => 
    table.name.toLowerCase().includes(tableSearchKeyword.value.toLowerCase()) ||
    table.description.toLowerCase().includes(tableSearchKeyword.value.toLowerCase())
  )
})

// 函数列表
const functionList = ref([
  { name: 'SUM', description: '求和' },
  { name: 'AVG', description: '平均值' },
  { name: 'COUNT', description: '计数' },
  { name: 'MAX', description: '最大值' },
  { name: 'MIN', description: '最小值' },
  { name: 'IF', description: '条件判断' },
  { name: 'ROUND', description: '四舍五入' },
  { name: 'ABS', description: '绝对值' },
  { name: 'SQRT', description: '平方根' },
  { name: 'POWER', description: '幂运算' },
  { name: 'WHERE', description: '条件过滤' }
])

// 函数搜索关键词
const functionSearchKeyword = ref('')

// 过滤后的函数列表
const filteredFunctions = computed(() => {
  if (!functionSearchKeyword.value) {
    return functionList.value
  }
  return filter(functionList.value, func => 
    func.name.toLowerCase().includes(functionSearchKeyword.value.toLowerCase()) ||
    func.description.toLowerCase().includes(functionSearchKeyword.value.toLowerCase())
  )
})

// 当前焦点公式的输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 当前函数帮助信息
const currentFunctionHelp = computed(() => {
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  if (!currentFormula) return null
  
  // 查找当前公式中的函数
  const functionMatch = currentFormula.match(/([A-Z]+)\s*\(/)
  if (!functionMatch) return null
  
  const funcName = functionMatch[1]
  const func = functionList.value.find(f => f.name === funcName)
  if (!func) return null
  
  // 根据函数名返回详细的帮助信息
  const helpInfo: Record<string, any> = {
    'SUM': {
      name: 'SUM',
      description: '计算一组数值的总和',
      usage: 'SUM(数值1, 数值2, ...)',
      example: 'SUM(${销售明细表.销售金额}, ${销售明细表.折扣金额})'
    },
    'AVG': {
      name: 'AVG',
      description: '计算一组数值的平均值',
      usage: 'AVG(数值1, 数值2, ...)',
      example: 'AVG(${成绩表.数学成绩}, ${成绩表.英语成绩})'
    },
    'COUNT': {
      name: 'COUNT',
      description: '计算数值的个数',
      usage: 'COUNT(数值1, 数值2, ...)',
      example: 'COUNT(${用户表.用户ID})'
    },
    'MAX': {
      name: 'MAX',
      description: '返回一组数值中的最大值',
      usage: 'MAX(数值1, 数值2, ...)',
      example: 'MAX(${成绩表.数学成绩})'
    },
    'MIN': {
      name: 'MIN',
      description: '返回一组数值中的最小值',
      usage: 'MIN(数值1, 数值2, ...)',
      example: 'MIN(${价格表.商品价格})'
    },
    'IF': {
      name: 'IF',
      description: '条件判断函数，根据条件返回不同的值',
      usage: 'IF(条件, 值1, 值2)',
      example: 'IF(${成绩表.数学成绩} >= 60, "及格", "不及格")'
    },
    'ROUND': {
      name: 'ROUND',
      description: '将数值四舍五入到指定的小数位数',
      usage: 'ROUND(数值, 小数位数)',
      example: 'ROUND(${价格表.商品价格}, 2)'
    },
    'ABS': {
      name: 'ABS',
      description: '返回数值的绝对值',
      usage: 'ABS(数值)',
      example: 'ABS(${温度表.温度差值})'
    },
    'SQRT': {
      name: 'SQRT',
      description: '返回数值的平方根',
      usage: 'SQRT(数值)',
      example: 'SQRT(${几何表.面积})'
    },
    'POWER': {
      name: 'POWER',
      description: '返回数值的指定次幂',
      usage: 'POWER(底数, 指数)',
      example: 'POWER(${数据表.基数}, 2)'
    },
    'WHERE': {
      name: 'WHERE',
      description: '添加过滤条件，筛选满足条件的数据',
      usage: 'WHERE(${表名.字段名} 运算符 值)',
      example: 'WHERE(${用户表.年龄} >= 18)'
    }
  }
  
  return helpInfo[funcName] || {
    name: func.name,
    description: func.description
  }
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

// 打开公式编辑弹窗
const openFormulaDialog = () => {
  // 解析传入的公式值
  if (props.modelValue) {
    const lines = props.modelValue.split('\n');
    formulaList.value = filter(lines, (f) => f.trim() !== '');
    if (formulaList.value.length === 0) {
      formulaList.value = ['']
    }
  } else {
    formulaList.value = ['']
  }
  dialogVisible.value = true
}

// 关闭弹窗处理
const handleClose = (done: () => void) => {
  done()
}

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

// 清空当前公式
const clearCurrentFormula = () => {
  if (formulaList.value[currentFocusIndex.value]) {
    formulaList.value[currentFocusIndex.value] = ''
  }
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!selectedTable.value) return
  
  const fieldName = `\${${selectedTable.value.description}.${field.name}}`
  
  // 在当前焦点公式中插入字段名
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  formulaList.value[currentFocusIndex.value] = currentFormula + fieldName
  
  // 关闭对话框
  fieldDialogVisible.value = false
}

// 处理运算符选择
const handleOperatorSelect = (operator: string) => {
  // 在当前焦点公式中插入运算符
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  formulaList.value[currentFocusIndex.value] = currentFormula + operator
}

// 处理函数选择
const handleFunctionSelect = (funcName: string) => {
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  
  // 特殊处理WHERE函数，使用不同的格式
  let insertText = ''
  
  if (funcName === 'WHERE') {
    insertText = `WHERE()`
  } else {
    insertText = `${funcName}()`
  }
  
  formulaList.value[currentFocusIndex.value] = currentFormula + insertText
}

// 保存公式
const saveFormulas = () => {
  // 过滤掉空公式并用换行符连接
  const formulas = filter(formulaList.value, f => f.trim() !== '');
  const formulaString = formulas.join('\n')
  emit('update:modelValue', formulaString)
  dialogVisible.value = false
}

// 取消编辑
const cancelEdit = () => {
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

// 导出方法供父组件使用
defineExpose({
  open: openFormulaDialog
})
</script>

<style scoped>
.formula-popup-editor {
  display: inline-block;
}

.formula-editor-container {
  padding: 20px 0;
}

.formula-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.multi-formula-container {
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

.formula-textarea {
  width: 100%;
  min-height: 100px;
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

.formula-actions {
  margin-top: 10px;
}

.function-help-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  margin-bottom: 20px;
}

.function-help-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409eff;
}

.help-content {
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.function-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.function-description {
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.5;
}

.function-usage,
.function-example {
  margin-bottom: 8px;
  line-height: 1.5;
}

.function-usage strong,
.function-example strong {
  color: #409eff;
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