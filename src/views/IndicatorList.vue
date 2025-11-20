<template>
  <div class="indicator-list">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>指标清单</span>
        </div>
      </template>
      
      <!-- 功能按钮 -->
      <div class="toolbar" style="margin-bottom: 20px;">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="primary" @click="handleCreateCommand('auto')">创建新指标</el-button>
      </div>
      
      <!-- 查询条件 -->
      <el-card class="filter-card" shadow="never">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input 
              v-model="filters.name" 
              placeholder="指标名称" 
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-input 
              v-model="filters.owner" 
              placeholder="负责人" 
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="filters.categories" 
              multiple
              filterable
              clearable
              placeholder="分类标签"
              style="width: 100%"
            >
              <el-option
                v-for="category in categoryOptions"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input 
              v-model="filters.formulaName" 
              placeholder="公式名称" 
              clearable
            />
          </el-col>
        </el-row>
      </el-card>
      
      <!-- 结果清单 -->
      <el-table 
        :data="paginatedIndicators" 
        style="width: 100%; margin-top: 20px;" 
        border
        v-loading="loading"
      >
        <el-table-column prop="name" label="指标名称" width="150" />
        <el-table-column prop="categories" label="分类标签" width="200">
          <template #default="scope">
            <div v-if="scope.row.categories && scope.row.categories.length > 0" class="categories-container">
              <el-tag 
                v-for="category in scope.row.categories" 
                :key="category"
                type="info" 
                size="small"
                class="category-tag"
              >
                {{ category }}
              </el-tag>
            </div>
            <span v-else class="no-category">未分类</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="formulas" label="公式列表" width="350">
          <template #default="scope">
            <div class="formulas-cell">
              <div v-if="scope.row.formulas && scope.row.formulas.length > 0">
                <div v-for="formula in scope.row.formulas" :key="formula.id" class="formula-item">
                  <div class="formula-header">
                    <el-tag 
                      :type="formula.type === 'native' ? 'success' : 'warning'" 
                      size="small"
                    >
                      {{ formula.type === 'native' ? '原生' : '衍生' }}
                    </el-tag>
                    <span class="formula-name">{{ formula.name || '未命名公式' }}</span>
                    <!-- 显示已使用的事实表 -->
                    <div v-if="formula.content" class="fact-tables-section">
                      <div class="fact-tables-label">已使用：</div>
                      <div class="fact-tables-container">
                        <el-tag 
                          v-for="table in extractFactTablesFromFormula(formula.content)" 
                          :key="table"
                          type="info"
                          size="small"
                          class="fact-table-tag"
                        >
                          {{ table }}
                        </el-tag>
                        <span v-if="extractFactTablesFromFormula(formula.content).length === 0" class="no-fact-tables">
                          未引用事实表
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="formula-content">{{ formatFormulaContent(formula.content) || '暂无内容' }}</div>
                </div>
              </div>
              <div v-else class="no-formulas">
                暂无公式
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="modifyTime" label="最后修改时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredIndicators.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right;"
      />
    </el-card>
    
    <!-- 创建/编辑指标对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="800px"
    >
      <el-form 
        :model="currentIndicator" 
        :rules="formRules" 
        ref="indicatorForm" 
        label-width="100px"
      >
        <el-form-item label="指标名称" prop="name">
          <el-input v-model="currentIndicator.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="currentIndicator.description" type="textarea" />
        </el-form-item>
        
        <el-form-item label="分类标签" prop="categories">
          <el-select 
            v-model="currentIndicator.categories" 
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入分类标签"
            style="width: 100%"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <!-- 多公式管理区域 -->
        <el-form-item label="公式管理">
          <MultiFormulaDisplay 
            v-model="currentIndicator.formulas"
            @formulaSave="handleFormulaSave"
          />
        </el-form-item>
        
        <el-form-item label="负责人" prop="owner">
          <el-select 
            v-model="currentIndicator.owner" 
            filterable
            clearable
            placeholder="请选择负责人"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveIndicator">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 表选择弹窗 -->
    <TableSelectorDialog
      v-model="tableSelectorVisible"
      :tables="tableData"
      @confirm="handleTableSelect"
    />
    
    <!-- 字段选择弹窗 -->
    <FieldSelectorDialog
      v-model="fieldSelectorVisible"
      :selected-table="selectedTable"
      :fields="currentTableFields"
      @confirm="handleFieldSelect"
    />
    
    <!-- 公式编辑弹窗 - 已集成到MultiFormulaDisplay组件中 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'

import MultiFormulaDisplay from '@/components/MultiFormulaDisplay.vue'
import MultiFormulaEditor from '@/components/MultiFormulaEditor.vue'
import FormulaDisplay from '@/components/FormulaDisplay.vue'
import TableSelectorDialog from '@/components/TableSelectorDialog.vue'
import FieldSelectorDialog from '@/components/FieldSelectorDialog.vue'

// 数据加载状态
const loading = ref(false)

// 路由
const router = useRouter()

// 筛选条件
const filters = reactive({
  name: '',
  owner: '',
  categories: [],
  formulaName: ''
})



// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditing = ref(false)

// 表单数据
const currentIndicator = reactive({
  id: 0,
  name: '',
  description: '',
  formulas: [],
  owner: '',
  categories: [],
  createTime: '',
  modifyTime: ''
})

// 公式编辑器相关
const formulaEditorRef = ref()
const currentEditingFormula = ref('')
const currentEditingFormulaIndex = ref(-1)

// 表选择弹窗可见性
const tableSelectorVisible = ref(false)

// 字段选择弹窗可见性
const fieldSelectorVisible = ref(false)

// 选中的表
const selectedTable = ref(null)

// 模拟表数据（实际应用中应从API获取）- 只包含指标事实表
const tableData = ref([
  { id: 1, name: 'sales_detail', description: '销售明细表', createTime: '2023-01-01', type: 'fact' },
  { id: 4, name: 'order_summary', description: '订单汇总表', createTime: '2023-01-04', type: 'fact' },
  { id: 6, name: 'revenue_fact', description: '收入事实表', createTime: '2023-01-06', type: 'fact' },
  { id: 7, name: 'inventory_fact', description: '库存事实表', createTime: '2023-01-07', type: 'fact' },
  { id: 8, name: 'customer_fact', description: '客户事实表', createTime: '2023-01-08', type: 'fact' }
])

// 根据选中的表获取字段数据（实际应用中应从API获取）- 只包含指标事实表的字段
const getFieldsByTable = (tableName) => {
  // 模拟不同事实表的字段数据
  const fieldsMap = {
    'sales_detail': [
      { fieldName: 'order_id', displayName: '订单ID', type: 'dimension', dataType: 'string', description: '订单唯一标识' },
      { fieldName: 'product_id', displayName: '产品ID', type: 'dimension', dataType: 'string', description: '产品唯一标识' },
      { fieldName: 'customer_id', displayName: '客户ID', type: 'dimension', dataType: 'string', description: '客户唯一标识' },
      { fieldName: 'quantity', displayName: '数量', type: 'metric', dataType: 'number', description: '销售数量' },
      { fieldName: 'price', displayName: '单价', type: 'metric', dataType: 'decimal', description: '产品单价' },
      { fieldName: 'sales_amount', displayName: '销售金额', type: 'metric', dataType: 'decimal', description: '订单销售金额' },
      { fieldName: 'discount', displayName: '折扣', type: 'metric', dataType: 'decimal', description: '折扣比例' },
      { fieldName: 'sale_date', displayName: '销售日期', type: 'dimension', dataType: 'date', description: '订单日期' }
    ],
    'order_summary': [
      { fieldName: 'summary_date', displayName: '统计日期', type: 'dimension', dataType: 'date', description: '汇总日期' },
      { fieldName: 'order_count', displayName: '订单数量', type: 'metric', dataType: 'number', description: '当日订单总数' },
      { fieldName: 'total_amount', displayName: '总金额', type: 'metric', dataType: 'decimal', description: '当日销售总金额' },
      { fieldName: 'avg_amount', displayName: '平均金额', type: 'metric', dataType: 'decimal', description: '订单平均金额' },
      { fieldName: 'customer_count', displayName: '客户数', type: 'metric', dataType: 'number', description: '下单客户数量' },
      { fieldName: 'product_count', displayName: '产品种类数', type: 'metric', dataType: 'number', description: '销售产品种类数' }
    ],
    'revenue_fact': [
      { fieldName: 'revenue_date', displayName: '收入日期', type: 'dimension', dataType: 'date', description: '收入统计日期' },
      { fieldName: 'product_id', displayName: '产品ID', type: 'dimension', dataType: 'string', description: '产品唯一标识' },
      { fieldName: 'region_id', displayName: '区域ID', type: 'dimension', dataType: 'string', description: '销售区域标识' },
      { fieldName: 'revenue_amount', displayName: '收入金额', type: 'metric', dataType: 'decimal', description: '产品收入金额' },
      { fieldName: 'cost_amount', displayName: '成本金额', type: 'metric', dataType: 'decimal', description: '产品成本金额' },
      { fieldName: 'profit_amount', displayName: '利润金额', type: 'metric', dataType: 'decimal', description: '产品利润金额' },
      { fieldName: 'margin_rate', displayName: '利润率', type: 'metric', dataType: 'decimal', description: '产品利润率' }
    ],
    'inventory_fact': [
      { fieldName: 'inventory_date', displayName: '库存日期', type: 'dimension', dataType: 'date', description: '库存统计日期' },
      { fieldName: 'product_id', displayName: '产品ID', type: 'dimension', dataType: 'string', description: '产品唯一标识' },
      { fieldName: 'warehouse_id', displayName: '仓库ID', type: 'dimension', dataType: 'string', description: '仓库标识' },
      { fieldName: 'opening_stock', displayName: '期初库存', type: 'metric', dataType: 'number', description: '期初库存数量' },
      { fieldName: 'ending_stock', displayName: '期末库存', type: 'metric', dataType: 'number', description: '期末库存数量' },
      { fieldName: 'stock_in', displayName: '入库数量', type: 'metric', dataType: 'number', description: '入库数量' },
      { fieldName: 'stock_out', displayName: '出库数量', type: 'metric', dataType: 'number', description: '出库数量' },
      { fieldName: 'turnover_rate', displayName: '周转率', type: 'metric', dataType: 'decimal', description: '库存周转率' }
    ],
    'customer_fact': [
      { fieldName: 'customer_id', displayName: '客户ID', type: 'dimension', dataType: 'string', description: '客户唯一标识' },
      { fieldName: 'customer_name', displayName: '客户名称', type: 'dimension', dataType: 'string', description: '客户姓名' },
      { fieldName: 'region', displayName: '地区', type: 'dimension', dataType: 'string', description: '客户所在地区' },
      { fieldName: 'total_spend', displayName: '总消费', type: 'metric', dataType: 'decimal', description: '累计消费金额' },
      { fieldName: 'order_count', displayName: '订单数', type: 'metric', dataType: 'number', description: '累计订单数量' },
      { fieldName: 'last_order_date', displayName: '最后下单日期', type: 'dimension', dataType: 'date', description: '最后下单日期' },
      { fieldName: 'customer_level', displayName: '客户等级', type: 'dimension', dataType: 'string', description: '客户等级' },
      { fieldName: 'lifetime_value', displayName: '客户终身价值', type: 'metric', dataType: 'decimal', description: '客户终身价值' }
    ]
  }
  
  return fieldsMap[tableName] || []
}

// 当前选中表的字段列表
const currentTableFields = ref([])

// 显示选中的字段信息
const selectedFieldInfo = computed(() => {
  if (!currentIndicator.formula) return ''
  
  // 查找当前选中的字段
  const field = currentTableFields.value.find(f => f.fieldName === currentIndicator.formula)
  if (field && selectedTable.value) {
    return `${selectedTable.value.name}.${field.displayName || field.fieldName}`
  }
  return currentIndicator.formula
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  description: [{ required: false, message: '请输入指标描述', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  categories: [
    { 
      type: 'array', 
      validator: (rule: any, value: any, callback: any) => {
        if (value && value.length > 5) {
          callback(new Error('最多只能选择5个分类标签'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ]
}

// 表格引用
const indicatorForm = ref()

// 原生字段数据
const nativeFields = ref([
  { id: 1, name: 'user_id', type: 'dimension' },
  { id: 2, name: 'order_id', type: 'dimension' },
  { id: 3, name: 'product_id', type: 'dimension' },
  { id: 4, name: 'quantity', type: 'metric' },
  { id: 5, name: 'price', type: 'metric' },
  { id: 6, name: 'discount', type: 'metric' }
])

// 用户数据列表
const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '孙七' },
  { id: 6, name: '周八' }
])

// 分类选项列表（已由动态计算的categoryOptions替代）

// 指标数据
const indicators = ref([
  {
    id: 1,
    name: '销售金额',
    description: '统计订单的实际销售金额',
    formulas: [
      { id: 1, name: '销售金额字段', content: '[销售明细表.销售金额]', type: 'native', description: '销售金额字段' }
    ],
    owner: '张三',
    categories: ['销售指标', '财务指标'],
    createTime: '2023-05-01 10:00:00',
    modifyTime: '2023-05-15 14:30:00'
  },
  {
    id: 2,
    name: '订单转化率',
    description: '衡量从浏览到下单的转化比例',
    formulas: [
      { id: 1, name: '基础转化率', content: 'COUNT([销售明细表.订单ID]) / COUNT([销售明细表.客户ID])', type: 'derived', description: '基础转化率公式' },
      { id: 2, name: '条件转化率', content: 'IF(COUNT([销售明细表.客户ID]) > 0, COUNT([销售明细表.订单ID]) / COUNT([销售明细表.客户ID]), 0)', type: 'derived', description: '带条件判断的转化率公式' }
    ],
    owner: '李四',
    categories: ['转化指标', '运营指标'],
    createTime: '2023-05-05 09:15:00',
    modifyTime: '2023-05-20 16:45:00'
  },
  {
    id: 3,
    name: '客户数量',
    description: '统计平台上的客户总数',
    formulas: [
      { id: 1, name: '客户ID计数', content: '[销售明细表.客户ID]', type: 'native', description: '客户ID字段' }
    ],
    owner: '王五',
    categories: ['客户指标'],
    createTime: '2023-05-10 11:20:00',
    modifyTime: '2023-05-25 13:10:00'
  },
  {
    id: 4,
    name: '平均客单价',
    description: '计算每个客户的平均消费金额',
    formulas: [
      { id: 1, name: '基础客单价', content: 'SUM([销售明细表.销售金额]) / COUNT(DISTINCT [销售明细表.客户ID])', type: 'derived', description: '基础客单价公式' },
      { id: 2, name: '四舍五入客单价', content: 'ROUND(SUM([销售明细表.销售金额]) / COUNT(DISTINCT [销售明细表.客户ID]), 2)', type: 'derived', description: '四舍五入客单价公式' }
    ],
    owner: '赵六',
    categories: ['客户指标', '销售指标'],
    createTime: '2023-05-12 14:20:00',
    modifyTime: '2023-05-26 15:10:00'
  },
  {
    id: 5,
    name: '多公式指标',
    description: '测试多公式的情况',
    formulas: [
      { id: 1, name: '收入金额', content: '[收入事实表.收入金额]', type: 'native', description: '收入金额字段' },
      { id: 2, name: '利润计算', content: '[收入事实表.收入金额] - [收入事实表.成本金额]', type: 'derived', description: '利润计算公式' }
    ],
    owner: '孙七',
    categories: ['测试指标', '财务指标'],
    createTime: '2023-05-15 09:00:00',
    modifyTime: '2023-05-30 10:00:00'
  }
])

// 计算过滤后的指标数据
const filteredIndicators = computed(() => {
  return indicators.value.filter(indicator => {
    // 指标名称筛选
    const nameMatch = filters.name === '' || indicator.name.includes(filters.name)
    
    // 负责人筛选
    const ownerMatch = filters.owner === '' || indicator.owner.includes(filters.owner)
    
    // 分类标签筛选（多选，只要包含任意一个选中的标签就匹配）
    const categoryMatch = filters.categories.length === 0 || 
      filters.categories.some(selectedCategory => 
        indicator.categories && indicator.categories.includes(selectedCategory)
      )
    
    // 公式名称筛选（在指标的所有公式中查找匹配的公式名称）
    const formulaNameMatch = filters.formulaName === '' || 
      (indicator.formulas && indicator.formulas.some(formula => 
        formula.name && formula.name.includes(filters.formulaName)
      ))
    
    return nameMatch && ownerMatch && categoryMatch && formulaNameMatch
  })
})

// 提取公式中使用的事实表
const extractFactTablesFromFormula = (content: string): string[] => {
  if (!content) return []
  
  // 正则表达式匹配 [表名.字段名] 格式
  const factTablePattern = /\[([^\]]+)\.([^\]]+)\]/g
  const matches = content.matchAll(factTablePattern)
  
  const factTables: string[] = []
  for (const match of matches) {
    const tableName = match[1]
    if (tableName && !factTables.includes(tableName)) {
      factTables.push(tableName)
    }
  }
  
  return factTables
}

// 格式化公式内容，将字段名转换为[表名.字段名]格式
const formatFormulaContent = (content: string) => {
  if (!content) return content
  
  // 定义字段名到表名的映射
  const fieldToTableMap = {
    'sales_amount': '销售明细表',
    'order_id': '销售明细表',
    'customer_id': '销售明细表',
    'quantity': '销售明细表',
    'price': '销售明细表',
    'discount': '销售明细表',
    'revenue_amount': '收入事实表',
    'cost_amount': '收入事实表',
    'profit_amount': '收入事实表',
    'margin_rate': '收入事实表',
    'opening_stock': '库存事实表',
    'ending_stock': '库存事实表',
    'stock_in': '库存事实表',
    'stock_out': '库存事实表',
    'turnover_rate': '库存事实表',
    'total_spend': '客户事实表',
    'customer_level': '客户事实表',
    'lifetime_value': '客户事实表',
    'order_count': '订单汇总表',
    'total_amount': '订单汇总表',
    'avg_amount': '订单汇总表',
    'customer_count': '订单汇总表',
    'product_count': '订单汇总表',
    'visitor_id': '订单汇总表'
  }
  
  // 替换字段名为[表名.字段名]格式
  let formattedContent = content
  Object.entries(fieldToTableMap).forEach(([fieldName, tableName]) => {
    // 使用正则表达式匹配独立的字段名（避免匹配到函数名或其他文本中的字段名）
    const regex = new RegExp(`\\b${fieldName}\\b`, 'g')
    formattedContent = formattedContent.replace(regex, `[${tableName}.${fieldName}]`)
  })
  
  return formattedContent
}

// 计算分页后的指标数据
const paginatedIndicators = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredIndicators.value.slice(start, end)
})

// 处理查询
const handleSearch = () => {
  pagination.currentPage = 1
  ElMessage.success('查询成功')
}

// 重置查询条件
const resetFilters = () => {
  filters.name = ''
  filters.owner = ''
  filters.categories = []
  filters.formulaName = ''
  pagination.currentPage = 1
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
}

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

// 处理创建命令
const handleCreateCommand = (command) => {
  // 设置为创建模式
  dialogTitle.value = '创建新指标'
  isEditing.value = false
  
  // 重置表单
  resetForm()
  
  // 设置默认负责人为当前创建者（这里假设为"张三"）
  currentIndicator.owner = '张三'
  
  // 显示对话框
  dialogVisible.value = true
}

// 打开创建对话框（兼容旧代码）
const openCreateDialog = () => {
  handleCreateCommand('native')
}

// 打开编辑对话框
const openEditDialog = (indicator) => {
  // 设置为编辑模式
  dialogTitle.value = '编辑指标'
  isEditing.value = true
  
  // 填充表单数据
  Object.assign(currentIndicator, indicator)
  
  // 显示对话框
  dialogVisible.value = true
}



// 重置表单
const resetForm = () => {
  Object.assign(currentIndicator, {
    id: 0,
    name: '',
    description: '',
    formulas: [],
    owner: '',
    category: '',
    createTime: '',
    modifyTime: ''
  })
  
  // 清除表单验证
  if (indicatorForm.value) {
    indicatorForm.value.resetFields()
  }
}



// 打开表选择弹窗
const openTableSelector = () => {
  tableSelectorVisible.value = true
}

// 处理表选择
const handleTableSelect = (table) => {
  selectedTable.value = table
  // 获取选中表的字段
  currentTableFields.value = getFieldsByTable(table.name)
  // 打开字段选择弹窗
  fieldSelectorVisible.value = true
}

// 处理字段选择
const handleFieldSelect = (field) => {
  currentIndicator.formula = field.fieldName
  ElMessage.success(`已选择字段: ${selectedTable.value.name}.${field.displayName || field.fieldName}`)
}

// 检测公式类型：单个字段引用为原生指标，其他为衍生指标
const detectFormulaType = (formula: string): string => {
  if (!formula.trim()) return ''
  
  // 检查是否为单个字段引用（格式：table.field 或 field）
  const fieldPattern = /^\s*[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?\s*$/
  
  if (fieldPattern.test(formula)) {
    return 'native'
  } else {
    return 'derived'
  }
}

// 处理公式类型检测
const handleFormulaTypeDetected = (type: string, formula: string) => {
  // 只有在创建新指标时才自动更新类型
  if (!isEditing.value) {
    // 重新检测公式类型
    const detectedType = detectFormulaType(formula)
    currentIndicator.type = detectedType
    
    // 根据检测到的类型显示相应提示
    if (detectedType === 'native') {
      ElMessage.info('检测到单个字段引用，已自动设置为原生指标')
    } else if (detectedType === 'derived') {
      ElMessage.info('检测到复杂公式，已自动设置为衍生指标')
    }
  }
}

// 添加原生指标公式
const addNativeFormula = () => {
  const newFormula = {
    id: Date.now(),
    name: '',
    content: '',
    type: 'native',
    description: '原生指标'
  }
  currentIndicator.formulas.push(newFormula)
  editFormula(newFormula, currentIndicator.formulas.length - 1)
}

// 添加衍生指标公式
const addDerivedFormula = () => {
  const newFormula = {
    id: Date.now(),
    name: '',
    content: '',
    type: 'derived',
    description: '衍生指标'
  }
  currentIndicator.formulas.push(newFormula)
  editFormula(newFormula, currentIndicator.formulas.length - 1)
}

// 添加公式（统一入口）
const addFormula = () => {
  const newFormula = {
    id: Date.now(),
    name: '',
    content: '',
    type: 'native', // 默认类型，后续会根据公式内容自动检测
    description: '新公式'
  }
  currentIndicator.formulas.push(newFormula)
  editFormula(newFormula, currentIndicator.formulas.length - 1)
}

// 编辑公式
const editFormula = (formula: any, index: number) => {
  // 设置当前编辑的公式
  currentEditingFormula.value = formula.content || ''
  currentEditingFormulaIndex.value = index
  
  // 打开公式编辑弹窗
  if (formulaEditorRef.value) {
    formulaEditorRef.value.showDialog()
  }
}

// 监听公式编辑器保存事件
const handleFormulaSave = (formulaData: any) => {
  if (currentEditingFormulaIndex.value >= 0) {
    const formula = currentIndicator.formulas[currentEditingFormulaIndex.value]
    
    // 更新公式内容
    formula.content = formulaData.content
    
    // 更新公式名称（如果提供了）
    if (formulaData.name !== undefined) {
      formula.name = formulaData.name
    }
    
    // 自动检测公式类型
    const detectedType = detectFormulaType(formulaData.content)
    if (detectedType && detectedType !== formula.type) {
      formula.type = detectedType
      ElMessage.success(`公式类型已自动检测为：${detectedType === 'native' ? '原生指标' : '衍生指标'}`)
    }
  }
}

// 删除公式
const removeFormula = (index: number) => {
  ElMessageBox.confirm('确定要删除这个公式吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    currentIndicator.formulas.splice(index, 1)
    ElMessage.success('公式删除成功')
  }).catch(() => {
    // 用户取消删除
  })
}

// 清除选中的字段
const clearSelectedField = () => {
  currentIndicator.formula = ''
  selectedTable.value = null
  currentTableFields.value = []
}

// 检查指标名称是否唯一
const checkIndicatorNameUnique = (name: string, excludeId: number = 0) => {
  return !indicators.value.some(indicator => 
    indicator.name === name && indicator.id !== excludeId
  )
}

// 检查公式是否被其他指标使用
const checkFormulaUsedByOtherIndicators = (formula: string, excludeId: number = 0) => {
  if (!formula.trim()) return []
  
  // 查找使用相同公式的其他指标
  return indicators.value.filter(indicator => 
    indicator.id !== excludeId && 
    indicator.formulas.some(f => f.content === formula)
  )
}

// 保存指标
const saveIndicator = async () => {
  try {
    // 表单验证
    await indicatorForm.value.validate()
    
    // 检查指标名称是否唯一
    if (!checkIndicatorNameUnique(currentIndicator.name, currentIndicator.id)) {
      ElMessage.error(`指标名称"${currentIndicator.name}"已存在，请使用其他名称`)
      return
    }
    
    // 指标可以没有公式，跳过公式为空检查
    
    // 检查每个公式的内容和唯一性
    for (const formula of currentIndicator.formulas) {
      if (!formula.content || formula.content.trim() === '') {
        ElMessage.error('所有公式都必须填写内容')
        return
      }
      
      // 检查公式是否被其他指标使用
      const duplicateIndicators = checkFormulaUsedByOtherIndicators(formula.content, currentIndicator.id)
      if (duplicateIndicators.length > 0) {
        const indicatorNames = duplicateIndicators.map(ind => ind.name).join('、')
        await ElMessageBox.confirm(
          `公式 "${formula.content}" 已被以下指标使用：${indicatorNames}。是否继续保存？`,
          '公式重复提醒',
          {
            confirmButtonText: '继续保存',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }
      
      // 自动检测公式类型
      const detectedType = detectFormulaType(formula.content)
      if (detectedType && detectedType !== formula.type) {
        // 如果公式类型有更改，显示提醒
        const typeNames = {
          native: '原生指标',
          derived: '衍生指标'
        }
        ElMessage.info(`公式"${formula.content}"已识别为"${typeNames[detectedType]}"`)
        formula.type = detectedType
      }
    }
    
    // 执行保存
    performSave()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存指标失败:', error)
      ElMessage.error('保存失败，请检查表单数据')
    }
  }
}

// 执行实际的保存操作
const performSave = () => {
  if (isEditing.value) {
    // 编辑逻辑
    const index = indicators.value.findIndex(item => item.id === currentIndicator.id)
    if (index !== -1) {
      indicators.value[index] = { 
        ...currentIndicator,
        modifyTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
      ElMessage.success('指标更新成功')
    }
  } else {
    // 新增逻辑
    const newId = Math.max(...indicators.value.map(item => item.id), 0) + 1
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    indicators.value.push({
      ...currentIndicator,
      id: newId,
      createTime: now,
      modifyTime: now
    })
    ElMessage.success('指标添加成功')
  }
  dialogVisible.value = false
}

// 删除指标
const handleDelete = (indicator: any) => {
  ElMessageBox.confirm(
    `确定要删除指标 "${indicator.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = indicators.value.findIndex(item => item.id === indicator.id)
    if (index !== -1) {
      indicators.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 组件挂载时的操作
onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style scoped>
.indicator-list {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  min-height: calc(100vh - 120px);
}

.toolbar {
  margin-bottom: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.formula-cell {
  white-space: pre-line;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
}

.formula-preview {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
  padding: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.field-selector-container {
  width: 100%;
}

.auto-detection-container {
  width: 100%;
}

.field-selector-section {
  margin-bottom: 10px;
}

.formula-editor-section {
  margin-top: 10px;
}

.type-detection-hint {
  margin-top: 10px;
}

.type-detection-hint .el-alert {
  margin-bottom: 5px;
}

.selected-field-info {
  padding: 8px 12px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #67c23a;
}

.clear-btn {
  color: #f56c6c;
}

.no-category {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 多公式管理样式 */
.formulas-management {
  width: 100%;
}

.formulas-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
}

.formula-item {
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.formula-item:last-child {
  margin-bottom: 0;
}

.formula-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.formula-content {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #606266;
  background-color: #ffffff;
  padding: 8px;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
  word-break: break-all;
}

.formula-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.add-formula-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.no-formulas {
  text-align: center;
  color: #c0c4cc;
  font-style: italic;
  padding: 20px;
}

.formulas-cell {
  max-height: 150px;
  overflow-y: auto;
}

.formulas-cell .formula-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 3px;
}

.formulas-cell .formula-item:last-child {
  margin-bottom: 0;
}

.formulas-cell .formula-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  justify-content: space-between;
}

.formulas-cell .formula-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.formulas-cell .formula-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.formulas-cell .formula-content {
  font-size: 12px;
  padding: 4px 6px;
  font-family: 'Courier New', monospace;
  background-color: #ffffff;
  border-radius: 2px;
  border: 1px solid #e4e7ed;
}

/* 事实表显示区域样式 */
.fact-tables-section {
  margin-left: auto !important;
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

.fact-tables-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.fact-table-tag {
  font-size: 10px;
  padding: 1px 6px;
  height: auto;
  line-height: 1.4;
}

.no-fact-tables {
  font-size: 11px;
  color: #c0c4cc;
  font-style: italic;
}

</style>