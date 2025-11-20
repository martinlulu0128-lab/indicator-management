<template>
  <div class="formula-editor">
    <div class="formula-editor-header">
      <h3>公式编辑器</h3>
      <el-button type="primary" @click="addNewExpression" size="small">
        <el-icon><Plus /></el-icon>
        添加表达式
      </el-button>
    </div>
    
    <div class="formula-expressions">
      <div 
        v-for="(expression, index) in expressions" 
        :key="index" 
        class="expression-item"
      >
        <div class="expression-header">
          <span>表达式 {{ index + 1 }}</span>
          <el-button 
            type="danger" 
            link 
            @click="removeExpression(index)"
            :disabled="expressions.length <= 1"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        
        <div class="expression-content">
          <!-- 琛ㄩ€夋嫨 -->
          <div class="form-group">
            <label>数据表</label>
              <el-select 
                v-model="expression.table" 
                placeholder="请选择数据表"
                @change="onTableChange(expression)"
              >
              <el-option
                v-for="table in tables"
                :key="table.id"
                :label="table.name"
                :value="table.id"
              />
            </el-select>
          </div>
          
          <!-- 瀛楁閫夋嫨 -->
          <div class="form-group">
            <label>字段:</label>
              <el-select 
                v-model="expression.field" 
                placeholder="请选择字段"
                :disabled="!expression.table"
              >
              <el-option
                v-for="field in getFieldsByTable(expression.table)"
                :key="field.id"
                :label="field.name"
                :value="field.id"
              />
            </el-select>
          </div>
          
          <!-- 杩愮畻绗﹂€夋嫨 -->
          <div class="form-group">
            <label>运算符</label>
              <el-select 
                v-model="expression.operator" 
                placeholder="请选择运算符"
              >
              <el-option label="计数(COUNT)" value="COUNT" />
                <el-option label="计数去重(COUNT DISTINCT)" value="COUNT_DISTINCT" />
                <el-option label="求和(SUM)" value="SUM" />
                <el-option label="平均值(AVG)" value="AVG" />
                <el-option label="最大值(MAX)" value="MAX" />
                <el-option label="最小值(MIN)" value="MIN" />
            </el-select>
          </div>
          
          <!-- 鏉′欢杩囨护 -->
          <div class="filter-section">
            <div class="filter-header">
              <el-checkbox v-model="expression.useFilter">添加条件过滤</el-checkbox>
            </div>
            
            <div v-if="expression.useFilter" class="filter-content">
              <div class="filter-row" v-for="(filter, filterIndex) in expression.filters" :key="filterIndex">
                <el-select v-model="filter.field" placeholder="字段" size="small">
                  <el-option
                    v-for="field in getFieldsByTable(expression.table)"
                    :key="field.id"
                    :label="field.name"
                    :value="field.id"
                  />
                </el-select>
                
                <el-select v-model="filter.operator" placeholder="运算符" size="small">
                  <el-option label="等于" value="=" />
                <el-option label="不等于" value="!=" />
                <el-option label="大于" value=">" />
                <el-option label="小于" value="<" />
                <el-option label="大于等于" value=">=" />
                <el-option label="小于等于" value="<=" />
                <el-option label="包含" value="LIKE" />
                </el-select>
                
                <el-input v-model="filter.value" placeholder="值" size="small" />
                
                <el-button 
                  type="danger" 
                  link 
                  @click="removeFilter(expression, filterIndex)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
              <el-button 
                type="primary" 
                link 
                @click="addFilter(expression)"
                v-if="expression.useFilter"
              >
                <el-icon><Plus /></el-icon>
                添加条件
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 鍏紡棰勮 -->
    <div class="formula-preview">
      <h4>公式预览:</h4>
      <div class="preview-content">
        <pre>{{ formulaPreview }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'
import filter from '@/utils/filter'

// 定义组件属性
interface Expression {
  id: number
  table: number | null
  field: number | null
  operator: string
  useFilter: boolean
  filters: Array<{
    field: number | null
    operator: string
    value: string
  }>
}

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})

// 表达式列表
const expressions = ref<Expression[]>([
  {
    id: Date.now(),
    table: null,
    field: null,
    operator: 'COUNT',
    useFilter: false,
    filters: []
  }
])

// 获取指定表的字段
const getFieldsByTable = (tableId: number | null) => {
  if (!tableId) return []
  return tableFields.value[tableId] || []
}

// 表选择变化时，清空字段选择
const onTableChange = (expression: Expression) => {
  expression.field = null
  expression.filters = []
}

// 添加新表达式
const addNewExpression = () => {
  expressions.value.push({
    id: Date.now(),
    table: null,
    field: null,
    operator: 'COUNT',
    useFilter: false,
    filters: []
  })
}

// 移除表达式
const removeExpression = (index: number) => {
  if (expressions.value.length > 1) {
    expressions.value.splice(index, 1)
  }
}

// 添加过滤条件
const addFilter = (expression: Expression) => {
  expression.filters.push({
    field: null,
    operator: '=',
    value: ''
  })
}

// 移除过滤条件
const removeFilter = (expression: Expression, index: number) => {
  expression.filters.splice(index, 1)
}

// 公式预览
const formulaPreview = computed(() => {
  return expressions.value.map(expr => {
    if (!expr.table || !expr.field) return ''
    
    // 获取表名和字段名
    const table = tables.value.find(t => t.id === expr.table)
    const field = getFieldsByTable(expr.table).find(f => f.id === expr.field)
    
    if (!table || !field) return ''
    
    // 构建基础公式
    let formula = ''
    switch (expr.operator) {
      case 'COUNT':
        formula = `COUNT([${table.description}.${field.name}])`
        break
      case 'COUNT_DISTINCT':
        formula = `COUNT(DISTINCT [${table.description}.${field.name}])`
        break
      case 'SUM':
        formula = `SUM([${table.description}.${field.name}])`
        break
      case 'AVG':
        formula = `AVG([${table.description}.${field.name}])`
        break
      case 'MAX':
        formula = `MAX([${table.description}.${field.name}])`
        break
      case 'MIN':
        formula = `MIN([${table.description}.${field.name}])`
        break
      default:
        formula = `[${table.description}.${field.name}]`
    }
    
    // 添加过滤条件
    if (expr.useFilter && expr.filters.length > 0) {
      const validFilters = filter(expr.filters, f => f.field && f.value);
      const conditions = validFilters
        .map(f => {
          const filterField = getFieldsByTable(expr.table!).find(field => field.id === f.field)
          if (!filterField) return ''
          
          if (f.operator === 'LIKE') {
            return `WHERE([${table.description}.${filterField.name}]=LIKE '%${f.value}%')`
          }
          return `WHERE([${table.description}.${filterField.name}]${f.operator}'${f.value}')`
        })
        .filter(condition => condition !== '')
      
      if (conditions.length > 0) {
        formula += ` ${conditions.join(' AND ')}`
      }
    }
    
    return formula
  }).filter(formula => formula !== '').join(' + ')
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

// 导出方法供父组件使用
defineExpose({
  getFormula: () => formulaPreview.value,
  setExpressions: (newExpressions: Expression[]) => {
    expressions.value = newExpressions
  },
  getExpressions: () => expressions.value
})
</script>

<style scoped>
.formula-editor {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.formula-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.formula-editor-header h3 {
  margin: 0;
}

.expression-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

.expression-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.expression-header span {
  font-weight: bold;
  color: #333;
}

.expression-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.filter-section {
  grid-column: 1 / -1;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-top: 10px;
}

.filter-header {
  margin-bottom: 10px;
}

.filter-content {
  padding-left: 20px;
}

.filter-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.filter-row .el-select,
.filter-row .el-input {
  flex: 1;
}

.formula-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.formula-preview h4 {
  margin-top: 0;
}

.preview-content {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  min-height: 60px;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 14px;
}
</style>