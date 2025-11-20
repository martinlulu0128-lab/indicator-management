<template>
  <div class="dimension-design-dialog">
    <!-- 步骤1：选择维度来源 -->
    <div class="design-step" v-if="currentStep === 1">
      <h3 class="step-title">1. 选择维度来源</h3>
      <div class="step-content">
        <div class="source-selection">
          <el-radio-group v-model="dimensionSource" @change="handleSourceChange">
            <el-radio label="factTable">指标事实表维度字段</el-radio>
            <el-radio label="relatedTable">关联维度表字段</el-radio>
          </el-radio-group>
          
          <!-- 事实表维度选择 -->
          <div v-if="dimensionSource === 'factTable'" class="fact-table-dimensions">
            <h4>选择事实表维度字段</h4>
            <div class="table-info">
              <div class="info-item">
                <span class="label">当前事实表：</span>
                <span class="value">{{ selectedFactTable }}</span>
              </div>
            </div>
            
            <div class="field-selection">
              <el-table 
                :data="factTableFields" 
                style="width: 100%"
                @selection-change="handleFactTableSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="字段名称" />
                <el-table-column prop="type" label="类型" />
                <el-table-column prop="description" label="描述" />
              </el-table>
            </div>
          </div>
          
          <!-- 关联维度表选择 -->
          <div v-if="dimensionSource === 'relatedTable'" class="related-table-dimensions">
            <h4>选择关联维度表</h4>
            <div class="table-selection">
              <el-select 
                v-model="selectedRelatedTable" 
                placeholder="请选择关联维度表"
                style="width: 100%; margin-bottom: 20px;"
                @change="handleRelatedTableChange"
              >
                <el-option
                  v-for="table in relatedTables"
                  :key="table.name"
                  :label="table.name"
                  :value="table.name"
                />
              </el-select>
              
              <div v-if="selectedRelatedTableInfo" class="table-info">
                <div class="info-item">
                  <span class="label">表名：</span>
                  <span class="value">{{ selectedRelatedTableInfo.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">描述：</span>
                  <span class="value">{{ selectedRelatedTableInfo.description }}</span>
                </div>
              </div>
              
              <div class="field-selection">
                <el-table 
                  :data="relatedTableFields" 
                  style="width: 100%"
                  @selection-change="handleRelatedTableSelectionChange"
                >
                  <el-table-column type="selection" width="55" />
                  <el-table-column prop="name" label="字段名称" />
                  <el-table-column prop="type" label="类型" />
                  <el-table-column prop="description" label="描述" />
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 步骤2：确认维度设置 -->
    <div class="design-step" v-if="currentStep === 2">
      <h3 class="step-title">2. 确认维度设置</h3>
      <div class="step-content">
        <div class="dimension-confirmation">
          <h4>已选择的维度字段</h4>
          <div class="selected-dimensions">
            <el-table :data="selectedDimensionsList" style="width: 100%">
              <el-table-column prop="name" label="字段名称" />
              <el-table-column prop="source" label="来源" />
              <el-table-column prop="table" label="所属表" />
              <el-table-column prop="type" label="类型" />
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button 
                    link 
                    type="danger" 
                    @click="removeDimension(scope.$index)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="dimension-settings">
            <h4>维度设置</h4>
            <div class="setting-item">
              <span class="label">维度名称：</span>
              <el-input 
                v-model="dimensionName" 
                placeholder="请输入维度显示名称"
                style="width: 300px;"
              />
            </div>
            <div class="setting-item">
              <span class="label">维度描述：</span>
              <el-input 
                v-model="dimensionDescription" 
                placeholder="请输入维度描述"
                style="width: 300px;"
                type="textarea"
                :rows="2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="dialog-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button v-if="currentStep > 1" @click="previousStep">上一步</el-button>
      <el-button 
        v-if="currentStep < 2" 
        type="primary" 
        @click="nextStep"
        :disabled="!canProceed"
      >
        下一步
      </el-button>
      <el-button 
        v-if="currentStep === 2" 
        type="primary" 
        @click="handleConfirm"
        :disabled="!canConfirm"
      >
        确认
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  currentColumn: {
    type: Object,
    default: null
  },
  selectedFactTable: {
    type: String,
    default: ''
  },
  selectedIndicators: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel'])

// 当前步骤
const currentStep = ref(1)

// 维度来源
const dimensionSource = ref('factTable')

// 事实表字段数据
const factTableFields = ref([
  { name: 'order_date', type: 'date', description: '订单日期' },
  { name: 'customer_id', type: 'string', description: '客户ID' },
  { name: 'product_id', type: 'string', description: '产品ID' },
  { name: 'region', type: 'string', description: '区域' },
  { name: 'sales_channel', type: 'string', description: '销售渠道' }
])

// 关联维度表数据
const relatedTables = ref([
  { 
    name: 'customer_dim', 
    description: '客户维度表',
    fields: [
      { name: 'customer_id', type: 'string', description: '客户ID' },
      { name: 'customer_name', type: 'string', description: '客户名称' },
      { name: 'customer_level', type: 'string', description: '客户等级' },
      { name: 'customer_region', type: 'string', description: '客户区域' }
    ]
  },
  { 
    name: 'product_dim', 
    description: '产品维度表',
    fields: [
      { name: 'product_id', type: 'string', description: '产品ID' },
      { name: 'product_name', type: 'string', description: '产品名称' },
      { name: 'product_category', type: 'string', description: '产品分类' },
      { name: 'product_brand', type: 'string', description: '产品品牌' }
    ]
  },
  { 
    name: 'time_dim', 
    description: '时间维度表',
    fields: [
      { name: 'date_key', type: 'date', description: '日期键' },
      { name: 'year', type: 'string', description: '年份' },
      { name: 'quarter', type: 'string', description: '季度' },
      { name: 'month', type: 'string', description: '月份' },
      { name: 'week', type: 'string', description: '周' }
    ]
  }
])

// 选择的关联表
const selectedRelatedTable = ref('')
const selectedRelatedTableInfo = ref(null)
const relatedTableFields = ref([])

// 选择的维度字段
const selectedFactTableFields = ref([])
const selectedRelatedTableFields = ref([])

// 维度设置
const dimensionName = ref('')
const dimensionDescription = ref('')

// 已选择的维度列表
const selectedDimensionsList = computed(() => {
  const dimensions = []
  
  // 添加事实表维度
  selectedFactTableFields.value.forEach(field => {
    dimensions.push({
      name: field.name,
      source: '事实表',
      table: props.selectedFactTable,
      type: field.type,
      originalField: field
    })
  })
  
  // 添加关联表维度
  selectedRelatedTableFields.value.forEach(field => {
    dimensions.push({
      name: field.name,
      source: '关联表',
      table: selectedRelatedTable.value,
      type: field.type,
      originalField: field
    })
  })
  
  return dimensions
})

// 是否可以继续下一步
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    if (dimensionSource.value === 'factTable') {
      return selectedFactTableFields.value.length > 0
    } else {
      return selectedRelatedTable.value && selectedRelatedTableFields.value.length > 0
    }
  }
  return true
})

// 是否可以确认
const canConfirm = computed(() => {
  return selectedDimensionsList.value.length > 0 && dimensionName.value
})

// 方法
const handleSourceChange = () => {
  // 重置选择
  selectedFactTableFields.value = []
  selectedRelatedTableFields.value = []
  selectedRelatedTable.value = ''
  selectedRelatedTableInfo.value = null
  relatedTableFields.value = []
}

const handleFactTableSelectionChange = (selection) => {
  selectedFactTableFields.value = selection
}

const handleRelatedTableChange = (tableName) => {
  selectedRelatedTableInfo.value = relatedTables.value.find(table => table.name === tableName)
  relatedTableFields.value = selectedRelatedTableInfo.value?.fields || []
  selectedRelatedTableFields.value = []
}

const handleRelatedTableSelectionChange = (selection) => {
  selectedRelatedTableFields.value = selection
}

const removeDimension = (index) => {
  const dimension = selectedDimensionsList.value[index]
  
  if (dimension.source === '事实表') {
    selectedFactTableFields.value = selectedFactTableFields.value.filter(
      field => field.name !== dimension.name
    )
  } else {
    selectedRelatedTableFields.value = selectedRelatedTableFields.value.filter(
      field => field.name !== dimension.name
    )
  }
}

const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleConfirm = () => {
  if (!canConfirm.value) {
    ElMessage.warning('请完成所有设置')
    return
  }
  
  const designData = {
    dimensions: selectedDimensionsList.value.map(dim => ({
      name: dim.name,
      displayName: dimensionName.value,
      description: dimensionDescription.value,
      source: dim.source,
      table: dim.table,
      type: dim.type,
      originalField: dim.originalField
    }))
  }
  
  emit('confirm', designData)
}

const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  // 如果当前列已经有维度信息，初始化数据
  if (props.currentColumn && props.currentColumn.dimensions) {
    // 初始化维度数据
    dimensionName.value = props.currentColumn.dimensionName || ''
    dimensionDescription.value = props.currentColumn.dimensionDescription || ''
  }
})
</script>

<style scoped>
.dimension-design-dialog {
  padding: 20px;
}

.design-step {
  margin-bottom: 30px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.step-content {
  padding: 0 20px;
}

.source-selection {
  margin-bottom: 20px;
}

.source-selection .el-radio {
  display: block;
  margin-bottom: 15px;
}

.table-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
}

.field-selection {
  margin-top: 20px;
}

.field-selection h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.dimension-confirmation {
  padding: 20px;
}

.selected-dimensions {
  margin-bottom: 30px;
}

.dimension-settings {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>