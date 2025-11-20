<template>
  <div class="indicator-design-dialog">
    <!-- 步骤1：选择指标 -->
    <div class="design-step" v-if="currentStep === 1">
      <h3 class="step-title">1. 选择指标</h3>
      <div class="step-content">
        <div class="indicator-selection">
          <el-select 
            v-model="selectedIndicator" 
            placeholder="请选择指标"
            style="width: 100%; margin-bottom: 20px;"
            @change="handleIndicatorChange"
          >
            <el-option
              v-for="indicator in availableIndicators"
              :key="indicator.id"
              :label="indicator.name"
              :value="indicator.id"
            />
          </el-select>
          
          <!-- 已选择指标信息 -->
          <div v-if="selectedIndicatorInfo" class="indicator-info">
            <div class="info-item">
              <span class="label">指标名称：</span>
              <span class="value">{{ selectedIndicatorInfo.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">指标描述：</span>
              <span class="value">{{ selectedIndicatorInfo.description }}</span>
            </div>
            <div class="info-item">
              <span class="label">指标事实表：</span>
              <span class="value">{{ selectedIndicatorInfo.factTable }}</span>
            </div>
          </div>
          
          <!-- 公式选择 -->
          <div v-if="selectedIndicatorInfo && selectedIndicatorInfo.formulas.length > 1" class="formula-selection">
            <h4>选择公式</h4>
            <el-radio-group v-model="selectedFormula" @change="handleFormulaChange">
              <el-radio 
                v-for="formula in selectedIndicatorInfo.formulas" 
                :key="formula.id"
                :label="formula.id"
                style="display: block; margin-bottom: 10px;"
              >
                {{ formula.expression }}
              </el-radio>
            </el-radio-group>
          </div>
          
          <!-- 事实表一致性检查 -->
          <div v-if="showFactTableWarning" class="warning-message">
            <el-alert 
              type="warning" 
              show-icon 
              :closable="false"
              title="指标事实表与其他已选指标的事实表不一致"
            >
              <template #description>
                当前指标事实表：{{ selectedIndicatorInfo.factTable }}<br>
                已选指标事实表：{{ selectedFactTables.join(', ') }}
              </template>
            </el-alert>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 步骤2：设置汇总要求 -->
    <div class="design-step" v-if="currentStep === 2">
      <h3 class="step-title">2. 设置汇总要求</h3>
      <div class="step-content">
        <div class="aggregation-setting">
          <el-radio-group v-model="selectedAggregation">
            <el-radio label="sum">求和 (SUM)</el-radio>
            <el-radio label="avg">平均值 (AVG)</el-radio>
            <el-radio label="min">最小值 (MIN)</el-radio>
            <el-radio label="max">最大值 (MAX)</el-radio>
            <el-radio label="count">计数 (COUNT)</el-radio>
            <el-radio label="median">中位数 (MEDIAN)</el-radio>
          </el-radio-group>
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
  selectedIndicators: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel'])

// 当前步骤
const currentStep = ref(1)

// 可用指标列表
const availableIndicators = ref([
  {
    id: 1,
    name: '销售金额',
    description: '产品销售的总金额',
    factTable: 'sales_detail',
    formulas: [
      { id: 1, expression: 'SUM([sales_detail.sales_amount])' }
    ]
  },
  {
    id: 2,
    name: '订单数量',
    description: '订单的总数量',
    factTable: 'sales_detail',
    formulas: [
      { id: 1, expression: 'COUNT([sales_detail.order_id])' }
    ]
  },
  {
    id: 3,
    name: '客单价',
    description: '平均每个客户的消费金额',
    factTable: 'sales_detail',
    formulas: [
      { id: 1, expression: 'SUM([sales_detail.sales_amount]) / COUNT(DISTINCT [sales_detail.customer_id])' },
      { id: 2, expression: 'AVG([sales_detail.order_amount])' }
    ]
  },
  {
    id: 4,
    name: '页面浏览量',
    description: '用户访问页面的总次数',
    factTable: 'user_behavior',
    formulas: [
      { id: 1, expression: 'SUM([user_behavior.page_views])' }
    ]
  },
  {
    id: 5,
    name: '活跃度评分',
    description: '用户活跃度的综合评分',
    factTable: 'user_behavior',
    formulas: [
      { id: 1, expression: 'AVG([user_behavior.activity_score])' },
      { id: 2, expression: 'MAX([user_behavior.activity_score])' }
    ]
  }
])

// 选择的指标
const selectedIndicator = ref('')
const selectedIndicatorInfo = ref(null)

// 选择的公式
const selectedFormula = ref('')

// 选择的汇总方式
const selectedAggregation = ref('sum')

// 已选择的事实表
const selectedFactTables = computed(() => {
  return props.selectedIndicators.map(ind => ind.sourceTable).filter(Boolean)
})

// 是否显示事实表警告
const showFactTableWarning = computed(() => {
  if (!selectedIndicatorInfo.value || selectedFactTables.value.length === 0) {
    return false
  }
  
  const currentFactTable = selectedIndicatorInfo.value.factTable
  return !selectedFactTables.value.includes(currentFactTable)
})

// 是否可以继续下一步
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedIndicator.value && !showFactTableWarning.value
  }
  return true
})

// 是否可以确认
const canConfirm = computed(() => {
  return selectedAggregation.value && selectedIndicator.value
})

// 方法
const handleIndicatorChange = (indicatorId) => {
  selectedIndicatorInfo.value = availableIndicators.value.find(ind => ind.id === indicatorId)
  
  // 自动选择第一个公式
  if (selectedIndicatorInfo.value && selectedIndicatorInfo.value.formulas.length > 0) {
    selectedFormula.value = selectedIndicatorInfo.value.formulas[0].id
  }
}

const handleFormulaChange = (formulaId) => {
  // 公式变更处理
  console.log('选择的公式ID:', formulaId)
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
    indicatorId: selectedIndicator.value,
    indicatorName: selectedIndicatorInfo.value.name,
    sourceTable: selectedIndicatorInfo.value.factTable,
    formula: selectedIndicatorInfo.value.formulas.find(f => f.id === selectedFormula.value)?.expression || '',
    aggregation: selectedAggregation.value
  }
  
  emit('confirm', designData)
}

const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  // 如果当前列已经有指标信息，初始化数据
  if (props.currentColumn && props.currentColumn.indicatorId) {
    selectedIndicator.value = props.currentColumn.indicatorId
    handleIndicatorChange(props.currentColumn.indicatorId)
    selectedAggregation.value = props.currentColumn.aggregation || 'sum'
  }
})
</script>

<style scoped>
.indicator-design-dialog {
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

.indicator-info {
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

.formula-selection {
  margin-top: 20px;
}

.formula-selection h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.warning-message {
  margin-top: 20px;
}

.aggregation-setting {
  padding: 20px;
}

.aggregation-setting .el-radio {
  display: block;
  margin-bottom: 15px;
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