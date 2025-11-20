<template>
  <div class="indicator-theme-design">
    <div class="design-content">
      <!-- 弹窗头部 -->
      <div class="design-header">
        <h2>指标主题汇总表设计</h2>
        <div class="header-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </div>

      <!-- 弹窗组件 -->
      <el-dialog
        v-model="indicatorDesignDialogVisible"
        title="指标设计"
        width="800px"
        :before-close="handleIndicatorDesignCancel"
      >
        <IndicatorDesignDialog
          :current-column="currentDesignColumn"
          :selected-indicators="selectedIndicators"
          @confirm="handleIndicatorDesignConfirm"
          @cancel="handleIndicatorDesignCancel"
        />
      </el-dialog>

      <el-dialog
        v-model="dimensionDesignDialogVisible"
        title="维度设计"
        width="900px"
        :before-close="handleDimensionDesignCancel"
      >
        <DimensionDesignDialog
          :current-column="currentDesignColumn"
          :selected-fact-table="selectedFactTable"
          :selected-indicators="selectedIndicators"
          @confirm="handleDimensionDesignConfirm"
          @cancel="handleDimensionDesignCancel"
        />
      </el-dialog>

      <el-dialog
        v-model="aggregationSettingDialogVisible"
        title="汇总设置"
        width="700px"
        :before-close="handleAggregationSettingCancel"
      >
        <AggregationSettingDialog
          :current-indicator="currentAggregationIndicator"
          :current-aggregation="currentAggregationSetting"
          @confirm="handleAggregationSettingConfirm"
          @cancel="handleAggregationSettingCancel"
        />
      </el-dialog>

      <!-- 设计流程选择 -->
      <div class="design-process-selection">
        <el-radio-group v-model="designProcess" @change="handleProcessChange">
          <el-radio-button label="process1">报表设计-流程1：定义结果列再构建实现逻辑</el-radio-button>
          <el-radio-button label="process2">报表设计-流程2：基于指标事实表构建报表</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 主体内容区域 -->
      <div class="main-content">
        <!-- 流程1：定义结果列再构建实现逻辑 -->
        <div v-if="designProcess === 'process1'" class="process1-content">
          <!-- 左侧：结果表区域 -->
          <div class="result-area">
            <div class="result-header">
              <div class="result-title">结果表</div>
              <div class="result-actions">
                <el-button type="primary" @click="fetchData">
                  <el-icon><Search /></el-icon>
                  获取数据/运算
                </el-button>
              </div>
            </div>
            
            <!-- 结果表格 -->
            <el-table 
              :data="resultData" 
              class="result-table" 
              border
            >
              <el-table-column 
                v-for="(column, index) in selectedColumns" 
                :key="column.id"
                :prop="column.fieldName"
                :label="column.displayName"
                :width="column.width"
              >
                <template #header="{ column }">
                  <div class="column-header">
                    <span>{{ column.label }}</span>
                    <div class="column-actions">
                      <el-icon class="delete-icon" @click="removeColumn(index)"><Delete /></el-icon>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 数据统计 -->
            <div class="result-summary">
              显示前20条记录，共 {{ totalRecords }} 条记录
            </div>
          </div>

          <!-- 右侧容器：已选择字段区域 + 报表基本信息 & 字段选择区域 -->
          <div class="right-container">
            <!-- 已选择字段区域 -->
            <div class="selected-fields-area">
              <div class="selected-fields-header">
                <h3 class="selected-fields-title">已选择字段</h3>
                <el-button 
                  v-if="selectedColumns.length > 0" 
                  type="danger" 
                  plain 
                  size="small" 
                  @click="clearAllColumns"
                  class="clear-all-btn"
                >
                  清空所有
                </el-button>
              </div>
              
              <!-- 已选择字段列表 -->
              <div class="selected-fields-list">
                <div 
                  v-for="(column, index) in selectedColumns" 
                  :key="column.id"
                  class="selected-field-item"
                >
                  <div class="field-info">
                    <div class="field-name">{{ column.displayName }}</div>
                    <div class="field-details">
                      <el-tag :type="getFieldTypeTagType(column.type)" size="small">
                        {{ column.type === 'indicator' ? '指标列' : '维度列' }}
                      </el-tag>
                      <span class="source-table">{{ column.sourceTable || '未设置' }}</span>
                    </div>
                  </div>
                  <div class="field-actions">
                    <el-button 
                      v-if="column.type === 'indicator'" 
                      size="small" 
                      @click="openIndicatorDesign(column)"
                    >
                      设计
                    </el-button>
                    <el-button 
                      v-if="column.type === 'dimension'" 
                      size="small" 
                      @click="openDimensionDesign(column)"
                    >
                      设计
                    </el-button>
                    <el-icon class="delete-icon" @click="removeColumn(index)"><Delete /></el-icon>
                  </div>
                </div>
                <div v-if="selectedColumns.length === 0" class="no-fields">
                  暂无已选择字段
                </div>
              </div>
            </div>

            <!-- 报表基本信息 & 字段选择区域 -->
            <div class="info-field-area">
              <el-tabs v-model="activeTab" class="info-field-tabs">
                <!-- 报表基本信息 Tab -->
                <el-tab-pane label="报表基本信息" name="basicInfo">
                  <div class="basic-info-form">
                    <el-form :model="basicInfoForm" label-width="100px" label-position="top">
                      <el-form-item label="报表名称">
                        <el-input v-model="basicInfoForm.name" />
                      </el-form-item>
                      <el-form-item label="报表别名">
                        <el-input v-model="basicInfoForm.alias" />
                      </el-form-item>
                      <el-form-item label="描述">
                        <el-input 
                          v-model="basicInfoForm.description" 
                          type="textarea" 
                          :rows="3"
                        />
                      </el-form-item>
                    </el-form>
                  </div>
                </el-tab-pane>

                <!-- 字段定义 Tab -->
                <el-tab-pane label="字段定义" name="fieldDefinition">
                  <div class="field-definition">
                    <!-- 步骤1：定义结果列 -->
                    <div class="definition-step">
                      <h4>1. 定义结果列</h4>
                      <div class="column-definition">
                        <el-input 
                          v-model="newColumnName" 
                          placeholder="输入列名称" 
                          style="width: 200px; margin-right: 10px;"
                        />
                        <el-select 
                          v-model="newColumnType" 
                          placeholder="选择列类型"
                          style="width: 120px; margin-right: 10px;"
                        >
                          <el-option label="指标列" value="indicator" />
                          <el-option label="维度列" value="dimension" />
                        </el-select>
                        <el-button 
                          type="primary" 
                          @click="addNewColumn"
                          :disabled="!newColumnName || !newColumnType"
                        >
                          添加列
                        </el-button>
                      </div>
                    </div>
                    
                    <!-- 步骤2：批量设置指标列 -->
                    <div class="definition-step" v-if="hasIndicatorColumns">
                      <h4>2. 批量设置指标列数据来源</h4>
                      <div class="batch-actions">
                        <el-button type="primary" @click="batchDesignIndicators">
                          批量设计指标列
                        </el-button>
                        <span class="batch-tip">可批量设置多个指标列的数据来源</span>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>

        <!-- 流程2：基于指标事实表构建报表 -->
        <div v-if="designProcess === 'process2'" class="process2-content">
          <!-- 上面：报表基本信息 -->
          <div class="basic-info-top">
            <div class="section-title">报表基本信息</div>
            <el-form :model="basicInfoForm" label-width="100px" label-position="left" class="basic-info-form">
              <el-form-item label="报表名称">
                <el-input v-model="basicInfoForm.name" />
              </el-form-item>
              <el-form-item label="报表别名">
                <el-input v-model="basicInfoForm.alias" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input 
                  v-model="basicInfoForm.description" 
                  type="textarea" 
                  :rows="3"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 主体内容区域 -->
          <div class="main-content-area">
            <!-- 左边（大）：结果表区域 -->
            <div class="result-area-large">
              <div class="result-header">
                <div class="result-title">结果表</div>
                <div class="result-actions">
                  <el-button type="primary" @click="fetchData">
                    <el-icon><Search /></el-icon>
                    获取数据/运算
                  </el-button>
                </div>
              </div>
              
              <!-- 结果表格 -->
              <el-table 
                :data="resultData" 
                class="result-table" 
                border
              >
                <el-table-column 
                  v-for="(column, index) in selectedColumns" 
                  :key="column.id"
                  :prop="column.fieldName"
                  :label="column.displayName"
                  :width="column.width"
                >
                  <template #header="{ column }">
                    <div class="column-header">
                      <span>{{ column.label }}</span>
                      <div class="column-actions">
                        <el-button 
                          v-if="column.type === 'indicator'" 
                          size="small" 
                          @click="openAggregationSetting(column)"
                        >
                          汇总设置
                        </el-button>
                        <el-icon class="delete-icon" @click="removeColumn(index)"><Delete /></el-icon>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 数据统计 -->
              <div class="result-summary">
                显示前20条记录，共 {{ totalRecords }} 条记录
              </div>
            </div>

            <!-- 右边（小）：字段选择区域 -->
            <div class="field-selection-area-small">
              <!-- 核心主题表选择 -->
              <div class="core-table-section">
                <div class="section-title">核心主题表</div>
                <el-select 
                  v-model="selectedFactTable" 
                  placeholder="请选择指标明细表" 
                  @change="loadFactTableFields"
                  style="width: 100%; margin-bottom: 15px;"
                >
                  <el-option
                    v-for="table in factTables"
                    :key="table.id"
                    :label="table.description"
                    :value="table.id"
                  />
                </el-select>
              </div>

              <!-- 字段选择 -->
              <div v-if="selectedFactTable" class="field-selection-section">
                <div class="section-title">字段选择</div>
                
                <!-- 类型筛选 -->
                <div class="field-type-filter" style="margin-bottom: 15px;">
                  <el-checkbox-group v-model="fieldFilter" size="small">
                    <el-checkbox-button
                      v-for="item in fieldTypeOptions"
                      :key="item.value"
                      :label="item.value"
                    >
                      {{ item.label }}
                    </el-checkbox-button>
                  </el-checkbox-group>
                </div>
                
                <!-- 搜索框 -->
                <div class="field-search-wrapper">
                  <el-input 
                    v-model="fieldSearchKeyword" 
                    placeholder="搜索字段..."
                    prefix-icon="Search"
                  />
                </div>
                
                <!-- 字段列表 -->
                <div class="field-list">
                  <div 
                    v-for="field in filteredFactTableFields" 
                    :key="field.id"
                    class="field-item"
                    :class="{ 'field-item-added': isFieldAdded(field.id) }"
                    @click="addFieldFromFactTable(field)"
                  >
                    <div class="field-content">
                      <div class="field-name">{{ field.name }}</div>
                      <div class="field-type">
                        <el-tag :type="getFieldTypeTagType(field.type)" size="small">
                          {{ getFieldTypeDisplayName(field.type) }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="field-status">
                      <el-icon v-if="isFieldAdded(field.id)" class="added-icon"><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 指标设计弹窗 -->
    <el-dialog
      v-model="indicatorDesignDialogVisible"
      :title="indicatorDesignTitle"
      width="800px"
      append-to-body
    >
      <IndicatorDesignDialog
        v-if="indicatorDesignDialogVisible"
        :current-column="currentDesignColumn"
        :selected-indicators="selectedIndicators"
        @confirm="handleIndicatorDesignConfirm"
        @cancel="handleIndicatorDesignCancel"
      />
    </el-dialog>

    <!-- 维度设计弹窗 -->
    <el-dialog
      v-model="dimensionDesignDialogVisible"
      :title="dimensionDesignTitle"
      width="600px"
      append-to-body
    >
      <DimensionDesignDialog
        v-if="dimensionDesignDialogVisible"
        :current-column="currentDesignColumn"
        :selected-fact-tables="selectedFactTables"
        @confirm="handleDimensionDesignConfirm"
        @cancel="handleDimensionDesignCancel"
      />
    </el-dialog>

    <!-- 汇总设置弹窗 -->
    <el-dialog
      v-model="aggregationSettingDialogVisible"
      title="汇总设置"
      width="600px"
      append-to-body
    >
      <AggregationSettingDialog
        v-if="aggregationSettingDialogVisible"
        :current-indicator="currentAggregationIndicator"
        :current-setting="currentAggregationSetting"
        @confirm="handleAggregationSettingConfirm"
        @cancel="handleAggregationSettingCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Check } from '@element-plus/icons-vue'
import IndicatorDesignDialog from '@/components/IndicatorDesignDialog.vue'
import DimensionDesignDialog from '@/components/DimensionDesignDialog.vue'
import AggregationSettingDialog from '@/components/AggregationSettingDialog.vue'

// 路由
const router = useRouter()
const route = useRoute()

// 设计流程选择
const designProcess = ref('process1') // process1 或 process2

// Tabs 控制
const activeTab = ref('basicInfo')

// 报表基本信息表单
const basicInfoForm = ref({
  name: '',
  alias: '',
  description: ''
})

// 流程1相关数据
const newColumnName = ref('')
const newColumnType = ref('')

// 流程2相关数据
const factTables = ref([
  { id: 1, name: 'sales_detail', description: '销售明细表' },
  { id: 2, name: 'user_behavior', description: '用户行为表' },
  { id: 3, name: 'product_info', description: '产品信息表' },
  { id: 4, name: 'order_summary', description: '订单汇总表' },
  { id: 5, name: 'customer_profile', description: '客户画像表' }
])
const selectedFactTable = ref('')
const factTableFields = ref([])

// 字段搜索关键字
const fieldSearchKeyword = ref('')

// 字段类型选项
const fieldTypeOptions = ref([
  { value: 'native_indicator', label: '原生指标' },
  { value: 'derived_indicator', label: '衍生指标' },
  { value: 'dimension', label: '维度' },
  { value: 'derived_dimension', label: '衍生维度' }
])

// 字段类型筛选
const fieldFilter = ref(['native_indicator', 'derived_indicator', 'dimension', 'derived_dimension'])

// 已选择的列
const selectedColumns = ref([])

// 结果数据
const resultData = ref([])
const totalRecords = ref(0)

// 弹窗控制
const indicatorDesignDialogVisible = ref(false)
const dimensionDesignDialogVisible = ref(false)
const aggregationSettingDialogVisible = ref(false)
const currentDesignColumn = ref(null)
const currentAggregationIndicator = ref(null)
const currentAggregationSetting = ref(null)

// 已选择的指标和事实表
const selectedIndicators = ref([])
const selectedFactTables = ref([])

// 计算属性
const hasIndicatorColumns = computed(() => {
  return selectedColumns.value.some(col => col.type === 'indicator' && !col.designComplete)
})

const filteredFactTableFields = computed(() => {
  if (!selectedFactTable.value) return []
  
  return factTableFields.value.filter(field => {
    // 筛选当前表的字段
    if (field.tableId !== parseInt(selectedFactTable.value)) return false
    
    // 根据字段类型筛选
    if (fieldFilter.value.length > 0 && !fieldFilter.value.includes(field.type)) return false
    
    // 根据搜索关键字筛选
    if (fieldSearchKeyword.value) {
      return field.name.includes(fieldSearchKeyword.value)
    }
    
    return true
  })
})

// 方法
const handleProcessChange = (process) => {
  // 清空已选择的数据
  selectedColumns.value = []
  resultData.value = []
  totalRecords.value = 0
  selectedIndicators.value = []
  selectedFactTables.value = []
}

const addNewColumn = () => {
  const newColumn = {
    id: Date.now(),
    displayName: newColumnName.value,
    fieldName: newColumnName.value.toLowerCase().replace(/\s+/g, '_'),
    type: newColumnType.value,
    width: 150,
    designComplete: false,
    sourceTable: '',
    aggregation: ''
  }
  
  selectedColumns.value.push(newColumn)
  
  // 清空输入
  newColumnName.value = ''
  newColumnType.value = ''
  
  ElMessage.success(`已添加${newColumnType.value === 'indicator' ? '指标' : '维度'}列: ${newColumn.displayName}`)
}

const removeColumn = (index) => {
  const column = selectedColumns.value[index]
  selectedColumns.value.splice(index, 1)
  
  // 如果删除的是指标列，从已选择指标中移除
  if (column.type === 'indicator' && column.indicatorId) {
    const indicatorIndex = selectedIndicators.value.findIndex(ind => ind.id === column.indicatorId)
    if (indicatorIndex !== -1) {
      selectedIndicators.value.splice(indicatorIndex, 1)
    }
  }
  
  resultData.value = []
  totalRecords.value = 0
}

const clearAllColumns = () => {
  ElMessageBox.confirm(
    '确定要清空所有已选择的字段吗？此操作不可恢复。',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedColumns.value = []
    selectedIndicators.value = []
    selectedFactTables.value = []
    resultData.value = []
    totalRecords.value = 0
    ElMessage.success('已清空所有字段')
  }).catch(() => {
    // 用户取消操作
  })
}

const openIndicatorDesign = (column) => {
  currentDesignColumn.value = column
  indicatorDesignDialogVisible.value = true
}

const openDimensionDesign = (column) => {
  currentDesignColumn.value = column
  dimensionDesignDialogVisible.value = true
}

const openAggregationSetting = (column) => {
  currentAggregationIndicator.value = {
    name: column.displayName,
    description: column.description || '',
    sourceTable: column.sourceTable || '',
    formula: column.formula || ''
  }
  currentAggregationSetting.value = {
    aggregation: column.aggregation || 'sum',
    displayName: column.displayName,
    precision: column.precision || 2,
    nullHandling: column.nullHandling || 'ignore',
    countType: column.countType || 'all'
  }
  aggregationSettingDialogVisible.value = true
}

const batchDesignIndicators = () => {
  const indicatorColumns = selectedColumns.value.filter(col => col.type === 'indicator' && !col.designComplete)
  if (indicatorColumns.length === 0) {
    ElMessage.warning('没有需要设计的指标列')
    return
  }
  
  // 打开第一个指标列的设计弹窗
  openIndicatorDesign(indicatorColumns[0])
}

const loadFactTableFields = () => {
  // 模拟加载事实表字段数据
  factTableFields.value = [
    // 销售明细表字段 (tableId: 1)
    { id: 1, name: '订单ID', type: 'dimension', tableId: 1 },
    { id: 2, name: '客户ID', type: 'dimension', tableId: 1 },
    { id: 3, name: '产品ID', type: 'dimension', tableId: 1 },
    { id: 4, name: '销售金额', type: 'native_indicator', tableId: 1 },
    { id: 5, name: '订单数量', type: 'native_indicator', tableId: 1 },
    { id: 6, name: '折扣金额', type: 'native_indicator', tableId: 1 },
    { id: 7, name: '客户等级', type: 'derived_dimension', tableId: 1 },
    { id: 8, name: '客单价', type: 'derived_indicator', tableId: 1 },
  ]
}

const addFieldFromFactTable = (field) => {
  const columnType = field.type.includes('indicator') ? 'indicator' : 'dimension'
  
  const newColumn = {
    id: Date.now(),
    displayName: field.name,
    fieldName: field.name.toLowerCase().replace(/\s+/g, '_'),
    type: columnType,
    width: 150,
    designComplete: columnType === 'dimension', // 维度列默认设计完成
    sourceTable: factTables.value.find(t => t.id === field.tableId)?.description || '',
    aggregation: columnType === 'indicator' ? 'sum' : '',
    fieldId: field.id,
    // 为指标字段添加更多属性
    precision: columnType === 'indicator' ? 2 : undefined,
    nullHandling: columnType === 'indicator' ? 'ignore' : undefined,
    countType: columnType === 'indicator' ? 'all' : undefined
  }
  
  selectedColumns.value.push(newColumn)
  
  // 如果是维度列，自动添加到已选择事实表
  if (columnType === 'dimension' && !selectedFactTables.value.includes(field.tableId)) {
    selectedFactTables.value.push(field.tableId)
  }
  
  // 如果是指标列，自动打开汇总设置弹窗
  if (columnType === 'indicator') {
    setTimeout(() => {
      openAggregationSetting(newColumn)
    }, 300)
  } else {
    ElMessage.success(`已添加维度列: ${field.name}`)
  }
}

const isFieldAdded = (fieldId) => {
  return selectedColumns.value.some(column => column.fieldId === fieldId)
}

const getFieldTypeTagType = (type) => {
  switch (type) {
    case 'indicator':
    case 'native_indicator':
    case 'derived_indicator':
      return 'success'
    case 'dimension':
    case 'derived_dimension':
      return 'primary'
    default:
      return 'info'
  }
}

const getFieldTypeDisplayName = (type) => {
  switch (type) {
    case 'native_indicator':
      return '原生指标'
    case 'derived_indicator':
      return '衍生指标'
    case 'dimension':
      return '维度'
    case 'derived_dimension':
      return '衍生维度'
    default:
      return type
  }
}

const fetchData = () => {
  if (selectedColumns.value.length === 0) {
    ElMessage.warning('请先选择字段')
    return
  }
  
  // 数据校验
  const validationErrors = []
  
  // 检查是否至少有一个指标字段
  const hasIndicator = selectedColumns.value.some(column => column.type === 'indicator')
  if (!hasIndicator) {
    validationErrors.push('至少需要选择一个指标字段')
  }
  
  // 检查是否至少有一个维度字段
  const hasDimension = selectedColumns.value.some(column => column.type === 'dimension')
  if (!hasDimension) {
    validationErrors.push('至少需要选择一个维度字段')
  }
  
  // 检查流程1的指标列是否都已完成设计
  if (designProcess.value === 'process1') {
    const incompleteIndicators = selectedColumns.value.filter(
      col => col.type === 'indicator' && !col.designComplete
    )
    if (incompleteIndicators.length > 0) {
      validationErrors.push('请先完成所有指标列的设计')
    }
  }
  
  // 如果有校验错误，显示错误信息
  if (validationErrors.length > 0) {
    ElMessage.error(`数据校验失败: ${validationErrors.join(', ')}`)
    return
  }
  
  // 根据选择的字段生成模拟数据
  const mockData = []
  for (let i = 0; i < 20; i++) {
    const row = {}
    selectedColumns.value.forEach(column => {
      if (column.type === 'dimension') {
        row[column.fieldName] = `${column.displayName}_${i + 1}`
      } else if (column.type === 'indicator') {
        row[column.fieldName] = Math.floor(Math.random() * 1000)
      }
    })
    mockData.push(row)
  }
  resultData.value = mockData
  totalRecords.value = 100 // 模拟总记录数
  
  ElMessage.success('数据获取成功')
}

const handleIndicatorDesignConfirm = (designData) => {
  // 更新指标列的设计信息
  if (currentDesignColumn.value) {
    currentDesignColumn.value.designComplete = true
    currentDesignColumn.value.sourceTable = designData.sourceTable
    currentDesignColumn.value.indicatorId = designData.indicatorId
    currentDesignColumn.value.formula = designData.formula
    currentDesignColumn.value.aggregation = designData.aggregation
    
    // 添加到已选择指标
    if (!selectedIndicators.value.some(ind => ind.id === designData.indicatorId)) {
      selectedIndicators.value.push({
        id: designData.indicatorId,
        name: designData.indicatorName,
        sourceTable: designData.sourceTable
      })
    }
    
    // 添加到已选择事实表
    if (!selectedFactTables.value.includes(designData.sourceTable)) {
      selectedFactTables.value.push(designData.sourceTable)
    }
  }
  
  indicatorDesignDialogVisible.value = false
  ElMessage.success('指标设计完成')
}

const handleIndicatorDesignCancel = () => {
  indicatorDesignDialogVisible.value = false
}

const handleDimensionDesignConfirm = (designData) => {
  // 更新维度列的设计信息
  if (currentDesignColumn.value) {
    currentDesignColumn.value.designComplete = true
    currentDesignColumn.value.sourceTable = designData.sourceTable
    currentDesignColumn.value.fieldName = designData.fieldName
  }
  
  dimensionDesignDialogVisible.value = false
  ElMessage.success('维度设计完成')
}

const handleDimensionDesignCancel = () => {
  dimensionDesignDialogVisible.value = false
}

const handleAggregationSettingConfirm = (aggregationData) => {
  // 更新汇总设置
  if (currentDesignColumn.value) {
    currentDesignColumn.value.aggregation = aggregationData.aggregation
    currentDesignColumn.value.displayName = aggregationData.displayName
    currentDesignColumn.value.precision = aggregationData.precision
    currentDesignColumn.value.nullHandling = aggregationData.nullHandling
    currentDesignColumn.value.countType = aggregationData.countType
    currentDesignColumn.value.sqlExpression = aggregationData.sqlExpression
  }
  
  aggregationSettingDialogVisible.value = false
  ElMessage.success('汇总设置已更新')
}

const handleAggregationSettingCancel = () => {
  aggregationSettingDialogVisible.value = false
}

const handleClose = () => {
  router.back()
}

const handleSave = () => {
  if (!basicInfoForm.value.name) {
    ElMessage.warning('请输入报表名称')
    return
  }
  
  if (selectedColumns.value.length === 0) {
    ElMessage.warning('请至少选择一个字段')
    return
  }
  
  // 保存逻辑
  ElMessage.success('报表设计保存成功')
  router.back()
}

onMounted(() => {
  // 初始化数据
  loadFactTableFields()
})
</script>

<style scoped>
.indicator-theme-design {
  height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.design-content {
  height: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.design-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.design-header h2 {
  margin: 0;
  color: #303133;
}

.design-process-selection {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

/* 流程2特定样式 */
.process2-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  gap: 20px;
}

.process2-content .basic-info-top {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.process2-content .basic-info-top .section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.process2-content .main-content-area {
  display: flex;
  flex: 1;
  gap: 20px;
}

.process2-content .result-area-large {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.process2-content .field-selection-area-small {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.field-list {
  flex: 1;
  overflow-y: auto;
}

.field-item {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.field-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.field-item-added {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.field-content {
  display: flex;
  flex-direction: column;
}

.field-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.field-type {
  font-size: 12px;
}

.field-status .added-icon {
  color: #67c23a;
}

/* 流程1特定样式 */
.process1-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.result-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
}

.right-container {
  width: 400px;
  border-left: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.selected-fields-area {
  height: 50%;
  border-bottom: 1px solid #ebeef5;
  padding: 15px;
  overflow-y: auto;
}

.info-field-area {
  height: 50%;
  padding: 15px;
  overflow-y: auto;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-icon {
  cursor: pointer;
  color: #f56c6c;
}

.delete-icon:hover {
  color: #f56c6c;
}
</style>