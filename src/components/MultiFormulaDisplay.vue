<template>
  <div class="multi-formula-display">
    <div class="formula-list">
      <div 
        v-for="(formula, index) in formulaList" 
        :key="index"
        class="formula-card"
      >
        <div class="formula-card-header">
          <div class="formula-type-badge">
            <el-tag 
              :type="getFormulaType(formula.content) === 'native' ? 'success' : 'warning'"
              size="small"
              effect="dark"
            >
              {{ getFormulaType(formula.content) === 'native' ? '原生指标' : '衍生指标' }}
            </el-tag>
          </div>
          <div class="formula-actions">
            <el-button 
              type="primary" 
              link 
              @click="editFormula(index)"
              size="small"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="formulaList.length > 1"
              type="danger" 
              link 
              @click="removeFormula(index)"
              size="small"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
        
        <div class="formula-content-section">
          <div class="formula-text">{{ formula.content || '暂无公式内容' }}</div>
          <!-- 已使用事实表显示区域 -->
          <div v-if="extractFactTablesFromFormula(formula.content).length > 0" class="fact-tables-section">
            <div class="fact-tables-label">
              <el-icon><Document /></el-icon>
              <span>已使用：</span>
            </div>
            <div class="fact-tables-list">
              <el-tag 
                v-for="tableName in extractFactTablesFromFormula(formula.content)" 
                :key="tableName"
                type="info"
                size="small"
              >
                {{ tableName }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="add-formula-button">
      <el-button 
        type="primary" 
        plain 
        @click="addFormula"
        size="small"
      >
        <el-icon><Plus /></el-icon>
        添加公式
      </el-button>
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
          <el-button size="small" type="primary" @click="openTableSelector">
            <el-icon><Document /></el-icon>
            插入表字段
          </el-button>
          
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
          
          <el-button size="small" @click="clearFormula">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="formula-textarea-container">
          <textarea
            ref="formulaTextarea"
            v-model="editingFormula"
            placeholder="请输入公式，例如: ${销售明细表.销售金额} + ${销售明细表.折扣金额}"
            class="formula-textarea"
            @focus="setCurrentFocusIndex"
            @click="handleFormulaClick"
            @input="handleFormulaInput"
          ></textarea>
        </div>
        
        <!-- 已使用事实表显示区域 -->
        <div v-if="extractFactTablesFromFormula(editingFormula).length > 0" class="used-fact-tables-section">
          <div class="fact-tables-header">
            <el-icon><Document /></el-icon>
            <span>已使用：</span>
          </div>
          <div class="fact-tables-container">
            <el-tag 
              v-for="tableName in extractFactTablesFromFormula(editingFormula)" 
              :key="tableName"
              type="success"
              size="small"
              class="fact-table-tag"
            >
              {{ tableName }}
            </el-tag>
          </div>
        </div>
        
        <div class="formula-help">
          <h4>函数帮助:</h4>
          <div class="help-content">
            <div v-if="currentFunctionHelp" class="function-help">
              <div class="function-name">{{ currentFunctionHelp.name }}</div>
              <div class="function-description">{{ currentFunctionHelp.description }}</div>
              <div class="function-usage" v-if="currentFunctionHelp.usage">
                <strong>用法:</strong> {{ currentFunctionHelp.usage }}
              </div>
              <div class="function-example" v-if="currentFunctionHelp.example">
                <strong>示例:</strong> {{ currentFunctionHelp.example }}
              </div>
            </div>
            <div v-else class="no-function-selected">
              请输入函数查看帮助信息
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveFormula">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 表选择弹窗 -->
    <el-dialog
      v-model="tableSelectorVisible"
      :title="isFieldConstraintEnabled ? '选择字段（字段引用约束已启用）' : '选择事实表'"
      width="600px"
      append-to-body
    >
      <!-- 字段引用约束提示 -->
      <div v-if="isFieldConstraintEnabled && firstFactTable" class="constraint-notice">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            <span>字段引用约束：后续字段必须来自同一个事实表（<strong>{{ firstFactTable.description }}</strong>）</span>
          </template>
        </el-alert>
      </div>
      
      <div class="table-search-container">
        <el-input
          v-model="tableSearchKeyword"
          placeholder="搜索表名..."
          size="small"
          clearable
          style="margin-bottom: 15px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="table-list-container">
        <div 
          v-for="table in filteredTables" 
          :key="table.id"
          class="table-item"
          @click="handleTableSelect(table)"
        >
          <span class="table-name">{{ table.description }}</span>
          <span class="table-type">
            <el-tag type="success" size="small">事实表</el-tag>
          </span>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tableSelectorVisible = false">关闭</el-button>
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
      <div class="field-search-container">
        <el-input
          v-model="fieldSearchKeyword"
          placeholder="搜索字段名..."
          size="small"
          clearable
          style="margin-bottom: 15px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="field-list-container">
        <div 
          v-for="field in filteredTableFields" 
          :key="field.id"
          class="field-item"
          @click="insertField(field)"
        >
          <span class="field-name">{{ field.name }}</span>
          <span class="field-type">
            <el-tag :type="getFieldTypeTagType(field.type)">
              {{ field.type }}
            </el-tag>
          </span>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fieldDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { getCoreTables, getTableFields } from '@/api/indicator'
import filter from '@/utils/filter'
import { ElMessage } from 'element-plus'
import { Edit, Plus, Document, Operation, Delete, MagicStick, Search } from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps<{
  modelValue?: string | Formula[]
  formulas?: Formula[]
  currentFactTable?: any // 当前正在编辑的事实表
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'formulaTypeDetected', type: string, formula: string): void
  (e: 'formulaSave', formulaData: { content: string }): void
}>()

// 公式列表（只包含内容的对象数组）
interface Formula {
  content: string
}
const formulaList = ref<Formula[]>([])

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
const tableSelectorVisible = ref(false)
const fieldDialogVisible = ref(false)

// 表搜索关键词
const tableSearchKeyword = ref('')

// 字段引用约束状态
const firstFactTable = ref<any>(null) // 第一个引用的字段所属的事实表
const isFieldConstraintEnabled = ref(false) // 是否启用字段引用约束

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

// 字段搜索关键词
const fieldSearchKeyword = ref('')

// 公式输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 当前焦点公式索引
const currentFocusIndex = ref(0)

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

// 过滤后的表列表（限定为事实表，并应用字段引用约束）
const filteredTables = computed(() => {
  let filtered = tables.value.filter(table => table.type === 'fact')
  
  // 如果提供了当前事实表，只显示该事实表
  if (props.currentFactTable) {
    filtered = filtered.filter(table => table.id === props.currentFactTable.id)
  } else {
    // 如果启用了字段引用约束，只显示与第一个字段相同的事实表
    if (isFieldConstraintEnabled.value && firstFactTable.value) {
      filtered = filtered.filter(table => table.id === firstFactTable.value.id)
    }
    
    // 如果没有启用字段引用约束，但当前有选中的表，则优先显示当前表
    if (!isFieldConstraintEnabled.value && selectedTable.value) {
      const currentTableIndex = filtered.findIndex(table => table.id === selectedTable.value.id)
      if (currentTableIndex > -1) {
        const currentTable = filtered.splice(currentTableIndex, 1)[0]
        filtered.unshift(currentTable)
      }
    }
  }
  
  if (!tableSearchKeyword.value) {
    return filtered
  }
  
  return filtered.filter(table => 
    table.name.toLowerCase().includes(tableSearchKeyword.value.toLowerCase()) ||
    table.description.toLowerCase().includes(tableSearchKeyword.value.toLowerCase())
  )
})

// 过滤后的字段列表
const filteredTableFields = computed(() => {
  const tableId = selectedTable.value?.id || 0
  const fields = tableFields.value[tableId] || []
  
  if (!fieldSearchKeyword.value) {
    return fields
  }
  
  return filter(fields, field => 
    field.name.toLowerCase().includes(fieldSearchKeyword.value.toLowerCase())
  )
})

// 监听属性变化，支持modelValue和formulas
watch(() => props.modelValue || props.formulas, (newValue) => {
  if (newValue) {
    if (Array.isArray(newValue)) {
      // 如果newValue是对象数组，直接使用（移除name字段）
      formulaList.value = newValue.map(formula => ({
        content: formula.content || ''
      }));
    } else {
      // 如果newValue是字符串，按原逻辑处理
      const stringValue = String(newValue);
      const lines = stringValue.split('\n');
      // 将字符串数组转换为公式对象数组（移除name字段）
      formulaList.value = filter(lines, f => f.trim() !== '').map(content => ({
        content: content
      }));
    }
  } else {
    formulaList.value = [{ content: '' }]
  }
}, { immediate: true })

// 格式化公式预览
const formattedFormula = computed(() => {
  if (!editingFormula.value) return '暂无公式'
  return editingFormula.value
})

// 函数帮助信息
const currentFunctionHelp = computed(() => {
  if (!editingFormula.value) return null
  
  // 查找当前光标位置附近的函数
  const cursorPosition = formulaTextarea.value?.selectionStart || 0
  const textBeforeCursor = editingFormula.value.substring(0, cursorPosition)
  const textAfterCursor = editingFormula.value.substring(cursorPosition)
  
  // 查找光标前最近的函数名
  const functionMatchBefore = textBeforeCursor.match(/([A-Z]+)\s*$/)
  // 查找光标后最近的函数名
  const functionMatchAfter = textAfterCursor.match(/^([A-Z]+)\s*\(/)
  
  let funcName = null
  if (functionMatchBefore) {
    funcName = functionMatchBefore[1]
  } else if (functionMatchAfter) {
    funcName = functionMatchAfter[1]
  }
  
  // 如果在光标前后都没有找到函数名，则查找整个文本中的函数
  if (!funcName) {
    // 查找包含光标位置的函数
    const fullText = editingFormula.value
    let foundFunc = null
    let foundFuncStart = -1
    let foundFuncEnd = -1
    
    // 遍历所有可能的函数
    for (let i = 0; i < fullText.length; i++) {
      const match = fullText.substring(i).match(/^([A-Z]+)\s*\(/)
      if (match) {
        const functionName = match[1]
        const functionStart = i
        const functionEnd = i + functionName.length + 1 // +1 for the opening parenthesis
        
        // 检查光标是否在函数名范围内或紧随其后
        if (cursorPosition >= functionStart && cursorPosition <= functionEnd + 1) {
          // 找到最近的函数
          if (!foundFunc || Math.abs(cursorPosition - (functionStart + functionName.length/2)) < 
              Math.abs(cursorPosition - (foundFuncStart + foundFunc.length/2))) {
            foundFunc = functionName
            foundFuncStart = functionStart
            foundFuncEnd = functionEnd
          }
        }
      }
    }
    
    if (foundFunc) {
      funcName = foundFunc
    }
  }
  
  if (funcName) {
    const func = functionList.value.find(f => f.name === funcName)
    if (func) {
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
          example: 'AVG(${销售明细表.销售金额}, ${销售明细表.订单数量})'
        },
        'COUNT': {
          name: 'COUNT',
          description: '计算数值的个数',
          usage: 'COUNT(数值1, 数值2, ...)',
          example: 'COUNT(${销售明细表.订单ID})'
        },
        'MAX': {
          name: 'MAX',
          description: '返回一组数值中的最大值',
          usage: 'MAX(数值1, 数值2, ...)',
          example: 'MAX(${销售明细表.销售金额})'
        },
        'MIN': {
          name: 'MIN',
          description: '返回一组数值中的最小值',
          usage: 'MIN(数值1, 数值2, ...)',
          example: 'MIN(${销售明细表.销售金额})'
        },
        'IF': {
          name: 'IF',
          description: '条件判断函数，根据条件返回不同的值',
          usage: 'IF(条件, 值1, 值2)',
          example: 'IF(${销售明细表.销售金额} >= 1000, "高价值", "普通价值")'
        },
        'ROUND': {
          name: 'ROUND',
          description: '将数值四舍五入到指定的小数位数',
          usage: 'ROUND(数值, 小数位数)',
          example: 'ROUND(${销售明细表.销售金额}, 2)'
        },
        'ABS': {
          name: 'ABS',
          description: '返回数值的绝对值',
          usage: 'ABS(数值)',
          example: 'ABS(${销售明细表.折扣金额})'
        },
        'SQRT': {
          name: 'SQRT',
          description: '返回数值的平方根',
          usage: 'SQRT(数值)',
          example: 'SQRT(${销售明细表.销售金额})'
        },
        'POWER': {
          name: 'POWER',
          description: '返回数值的指定次幂',
          usage: 'POWER(底数, 指数)',
          example: 'POWER(${销售明细表.销售金额}, 2)'
        },
        'WHERE': {
          name: 'WHERE',
          description: '添加过滤条件，筛选满足条件的数据',
          usage: 'WHERE(${表名.字段名} 运算符 值)',
          example: 'WHERE(${销售明细表.销售金额} >= 1000)'
        }
      }
      
      return helpInfo[funcName] || {
        name: func.name,
        description: func.description
      }
    }
  }
  
  return null
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

// 从公式内容中提取引用的所有事实表
const extractFactTablesFromFormula = (formula: string): string[] => {
  if (!formula || formula.trim() === '') {
    return []
  }
  
  // 匹配所有字段引用格式：[表名.字段名]
  const fieldReferences = formula.match(/\[([^\]]+)\.([^\]]+)\]/g) || []
  
  // 提取表名并去重
  const tableNames = fieldReferences.map(ref => {
    const match = ref.match(/\[([^\.]+)\.([^\]]+)\]/)
    return match ? match[1] : null
  }).filter((tableName): tableName is string => tableName !== null)
  
  // 去重并返回
  return [...new Set(tableNames)]
}

// 获取公式类型：原生指标或衍生指标
const getFormulaType = (formula: string): 'native' | 'derived' => {
  if (!formula || formula.trim() === '') {
    return 'native' // 空公式默认为原生指标
  }
  
  // 清理公式，移除空格和换行
  const cleanFormula = formula.replace(/\s+/g, '')
  
  // 检测是否为单个字段引用（原生指标）
  // 单个字段引用格式：[表名.字段名]
  const singleFieldPattern = /^\[[^\]]+\.[^\]]+\]$/
  
  if (singleFieldPattern.test(cleanFormula)) {
    return 'native'
  }
  
  // 检测是否包含多个字段引用
  const fieldReferences = cleanFormula.match(/\[[^\]]+\.[^\]]+\]/g) || []
  if (fieldReferences.length > 1) {
    return 'derived'
  }
  
  // 检测是否包含运算符（+、-、*、/）
  const operators = ['+', '-', '*', '/']
  const hasOperator = operators.some(op => cleanFormula.includes(op))
  if (hasOperator) {
    return 'derived'
  }
  
  // 检测是否包含函数调用（函数名后跟括号）
  const functionPattern = /[A-Z]+\s*\(/
  if (functionPattern.test(cleanFormula)) {
    return 'derived'
  }
  
  // 检测是否包含过滤条件（WHERE函数或其他条件表达式）
  const conditionPatterns = [
    /WHERE\s*\(/,  // WHERE函数
    />=/,           // 大于等于
    /<=/,           // 小于等于
    />/,            // 大于
    /</,            // 小于
    /=/,            // 等于
    /!=/            // 不等于
  ]
  
  const hasCondition = conditionPatterns.some(pattern => pattern.test(cleanFormula))
  if (hasCondition) {
    return 'derived'
  }
  
  // 默认情况下，如果公式不是单个字段引用，则认为是衍生指标
  return fieldReferences.length === 1 ? 'native' : 'derived'
}

// 添加公式
const addFormula = () => {
  formulaList.value.push({ content: '' })
  // 自动打开最后一个公式进行编辑
  editFormula(formulaList.value.length - 1)
}

// 删除公式
const removeFormula = (index: number) => {
  if (formulaList.value.length > 1) {
    formulaList.value.splice(index, 1)
    
    // 更新父组件数据
    const formulas = filter(formulaList.value, f => f.content.trim() !== '');
    
    // 根据props.modelValue的类型决定如何更新
    if (Array.isArray(props.modelValue)) {
      // 如果modelValue是对象数组，直接传递包含名称的公式对象数组
      emit('update:modelValue', formulas)
    } else {
      // 如果modelValue是字符串，用换行符连接公式内容
      const formulaString = formulas.map(f => f.content).join('\n')
      emit('update:modelValue', formulaString)
    }
    
    ElMessage.success('公式删除成功')
  } else {
    ElMessage.warning('至少需要保留一个公式')
  }
}

// 编辑公式
const editFormula = (index: number) => {
  editingIndex.value = index
  const formula = formulaList.value[index] || { content: '' }
  editingFormula.value = formula.content
  dialogVisible.value = true
  
  // 编辑公式时检查现有字段引用并设置约束状态
  checkAndSetFieldConstraint(editingFormula.value)
}

// 检查并设置字段引用约束
const checkAndSetFieldConstraint = (formula: string) => {
  const fieldReferences = formula.match(/\[[^\]]+\.[^\]]+\]/g) || []
  
  if (fieldReferences.length === 0) {
    // 如果没有字段引用，重置约束
    resetFieldConstraint()
    return
  }
  
  // 如果提供了当前事实表，直接使用该表作为约束
  if (props.currentFactTable) {
    if (!firstFactTable.value || firstFactTable.value.id !== props.currentFactTable.id) {
      firstFactTable.value = props.currentFactTable
      isFieldConstraintEnabled.value = true
      // 显示当前事实表约束提示
      ElMessage.info(`字段引用约束已启用：所有字段必须来自当前事实表（${firstFactTable.value.description}）`)
    }
    return
  }
  
  // 如果没有提供当前事实表，使用原来的逻辑（从第一个字段引用中提取表名）
  const firstFieldRef = fieldReferences[0]
  const match = firstFieldRef.match(/\[([^.]+)\.([^\]]+)\]/)
  if (match) {
    const tableDescription = match[1]
    // 查找对应的事实表
    const factTable = tables.value.find(table => 
      table.type === 'fact' && table.description === tableDescription
    )
    if (factTable) {
      // 只有当事实表发生变化时才更新
      if (!firstFactTable.value || firstFactTable.value.id !== factTable.id) {
        firstFactTable.value = factTable
        isFieldConstraintEnabled.value = true
        // 显示约束提示
        ElMessage.info(`字段引用约束已启用：后续字段必须来自同一个事实表（${firstFactTable.value.description}）`)
      }
    }
  }
}

// 设置当前焦点索引
const setCurrentFocusIndex = () => {
  currentFocusIndex.value = editingIndex.value
}

// 打开表选择弹窗
const openTableSelector = () => {
  tableSearchKeyword.value = ''
  tableSelectorVisible.value = true
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  tableSelectorVisible.value = false
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!formulaTextarea.value || !selectedTable.value) return
  
  // 检查字段引用约束
  if (props.currentFactTable) {
    // 如果提供了当前事实表，严格限制只能插入该事实表的字段
    if (selectedTable.value.id !== props.currentFactTable.id) {
      ElMessage.warning(`字段引用约束：所有字段必须来自当前事实表（${props.currentFactTable.description}）`)
      return
    }
  } else if (isFieldConstraintEnabled.value && firstFactTable.value) {
    // 如果没有提供当前事实表，但启用了约束，检查当前选择的表是否与第一个字段的表一致
    if (selectedTable.value.id !== firstFactTable.value.id) {
      ElMessage.warning(`字段引用约束：后续字段必须来自同一个事实表（${firstFactTable.value.description}）`)
      return
    }
  }
  
  const fieldName = `\${${selectedTable.value.description}.${field.name}}`
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入字段名
  editingFormula.value = 
    editingFormula.value.substring(0, cursorPosition) + 
    fieldName + 
    editingFormula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 检查并设置字段引用约束
  checkAndSetFieldConstraint(editingFormula.value)
  
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

// 清空公式
const clearFormula = () => {
  editingFormula.value = ''
  // 清空公式时重置字段引用约束
  resetFieldConstraint()
}

// 重置字段引用约束
const resetFieldConstraint = () => {
  firstFactTable.value = null
  isFieldConstraintEnabled.value = false
}

// 处理公式输入变化
const handleFormulaInput = () => {
  // 触发字段引用约束检查
  checkAndSetFieldConstraint(editingFormula.value)
}

// 监听公式输入变化，触发函数帮助更新
watch(editingFormula, () => {
  // 由于currentFunctionHelp是计算属性，它会自动更新
  // 这里可以添加其他需要在公式变化时执行的逻辑
})

// 处理公式输入框点击事件
const handleFormulaClick = (event: MouseEvent) => {
  if (!formulaTextarea.value) return
  
  // 确保在下一个事件循环中触发计算属性更新
  setTimeout(() => {
    // 触发Vue的响应式更新
    const value = editingFormula.value
    editingFormula.value = value
  }, 0)
}

// 获取光标在textarea中的字符位置
const getCaretCharacterOffsetWithin = (element: HTMLTextAreaElement) => {
  let caretOffset = 0
  const doc = element.ownerDocument || document
  const win = doc.defaultView || window
  let sel
  if (typeof win.getSelection != "undefined") {
    sel = win.getSelection()
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }
  } else if (sel == document.selection && sel.type != "Control") {
    const textRange = sel.createRange()
    const preCaretTextRange = document.body.createTextRange()
    preCaretTextRange.moveToElementText(element)
    preCaretTextRange.setEndPoint("EndToEnd", textRange)
    caretOffset = preCaretTextRange.text.length
  }
  return caretOffset
}

// 处理函数选择
const handleFunctionSelect = (funcName: string) => {
  if (!formulaTextarea.value) return
  
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 特殊处理WHERE函数，使用不同的格式
  let insertText = '';
  let newPosition = cursorPosition;
  
  if (funcName === 'WHERE') {
    insertText = `WHERE()`
    newPosition = cursorPosition + 6 // 光标定位到括号内
  } else {
    insertText = `${funcName}()`
    newPosition = cursorPosition + funcName.length + 1 // 光标定位到括号内
  }
  
  // 在光标位置插入函数名
  editingFormula.value = 
    editingFormula.value.substring(0, cursorPosition) + 
    insertText + 
    editingFormula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 取消编辑
const cancelEdit = () => {
  dialogVisible.value = false
}

// 检测公式类型
const detectFormulaType = (formula: string) => {
  if (!formula.trim()) return 'native'
  
  // 正则表达式匹配单个字段引用（格式：[表名.字段名]）
  const singleFieldRegex = /^\s*\[([^\]]+\.[^\]]+)\]\s*$/;
  
  // 检查是否是单个字段引用
  if (singleFieldRegex.test(formula.trim())) {
    return 'native'
  }
  
  // 检查是否包含运算符、函数、多个字段引用等复杂结构
  const operators = ['+', '-', '*', '/', '(', ')']
  const hasOperator = operators.some(op => formula.includes(op))
  const hasFunction = /\b(SUM|AVG|COUNT|MAX|MIN|IF|ROUND|ABS|SQRT|POWER|WHERE)\s*\(/.test(formula)
  const multipleFields = (formula.match(/\[[^\]]+\.[^\]]+\]/g) || []).length > 1
  
  // 如果有运算符、函数或多个字段，则认为是衍生指标
  if (hasOperator || hasFunction || multipleFields) {
    return 'derived'
  }
  
  // 默认认为是原生指标
  return 'native'
}

// 检查公式是否重复
const checkFormulaDuplicate = (formula: string, excludeIndex: number = -1) => {
  if (!formula.trim()) return false
  
  // 检查除当前编辑公式外的其他公式是否有重复
  return formulaList.value.some((f, index) => {
    if (index === excludeIndex) return false
    return f.content.trim() === formula.trim()
  })
}

// 保存公式
const saveFormula = () => {
  // 检查公式是否重复
  if (checkFormulaDuplicate(editingFormula.value, editingIndex.value)) {
    ElMessage.warning('该公式已存在，请勿重复添加')
    return
  }
  
  // 检测公式类型
  const detectedType = detectFormulaType(editingFormula.value)
  const originalType = detectFormulaType(formulaList.value[editingIndex.value]?.content || '')
  
  // 如果公式类型有更改，显示提醒
  if (detectedType !== originalType) {
    const typeNames = {
      native: '原生指标',
      derived: '衍生指标'
    }
    ElMessage.info(`公式类型已识别为"${typeNames[detectedType]}"`)
  }
  
  // 更新公式列表
  formulaList.value[editingIndex.value] = {
    content: editingFormula.value
  }
  
  // 过滤掉空公式
  const formulas = filter(formulaList.value, f => f.content.trim() !== '');
  
  // 根据props.modelValue的类型决定如何更新
  if (Array.isArray(props.modelValue)) {
    // 如果modelValue是对象数组，直接传递公式对象数组（移除name字段）
    emit('update:modelValue', formulas)
  } else {
    // 如果modelValue是字符串，用换行符连接公式内容
    const formulaString = formulas.map(f => f.content).join('\n')
    emit('update:modelValue', formulaString)
  }
  
  // 检测公式类型并触发事件
  emit('formulaTypeDetected', detectedType, editingFormula.value)
  
  // 触发公式保存事件，传递公式数据（移除name字段）
  emit('formulaSave', {
    content: editingFormula.value
  })
  
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
.multi-formula-display {
  width: 100%;
}

.formula-list {
  margin-bottom: 10px;
}

.formula-card {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.formula-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #c0c4cc;
}

.formula-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.formula-type-badge {
  flex-shrink: 0;
}

.formula-actions {
  display: flex;
  gap: 8px;
}

.formula-content-section {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.formula-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  flex: 1;
}

.add-formula-button {
  margin-top: 10px;
}

.formula-editor-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.formula-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.formula-textarea-container {
  flex: 1;
}

.formula-textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.formula-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.formula-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f5f7fa;
}

.formula-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.preview-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
}

.field-list-container {
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
  margin-bottom: 8px;
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

.table-list-container {
  max-height: 400px;
  overflow-y: auto;
}

.table-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.table-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.table-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.table-type .el-tag {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.constraint-notice {
  margin-bottom: 15px;
}

.formula-help {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.formula-help h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.function-help .function-name {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.function-help .function-description {
  margin-bottom: 10px;
  color: #666;
}

.function-help .function-usage,
.function-help .function-example {
  margin-bottom: 8px;
  font-size: 14px;
}

.function-help strong {
  color: #333;
}

.no-function-selected {
  color: #999;
  font-style: italic;
}

/* 已使用事实表样式 */
.fact-tables-section {
  padding: 6px 10px;
  background-color: #f0f2f5;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.fact-tables-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.fact-tables-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.fact-table-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

/* 公式编辑弹窗中的事实表显示区域 */
.used-fact-tables-section {
  margin-top: 15px;
  padding: 6px 10px;
  background-color: #f0f2f5;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fact-tables-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.fact-tables-header .el-icon {
  color: #606266;
}

.fact-tables-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

/* 公式操作按钮样式 */
.formula-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.formula-actions .el-button {
  padding: 6px 8px;
  font-size: 12px;
}
</style>