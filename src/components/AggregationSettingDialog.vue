<template>
  <div class="aggregation-setting-dialog">
    <div class="setting-content">
      <!-- 指标信息显示 -->
      <div class="indicator-info" v-if="currentIndicator">
        <h3>指标信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">指标名称：</span>
            <span class="value">{{ currentIndicator.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">指标描述：</span>
            <span class="value">{{ currentIndicator.description }}</span>
          </div>
          <div class="info-item">
            <span class="label">来源表：</span>
            <span class="value">{{ currentIndicator.sourceTable }}</span>
          </div>
          <div class="info-item">
            <span class="label">公式：</span>
            <span class="value">{{ currentIndicator.formula }}</span>
          </div>
        </div>
      </div>
      
      <!-- 汇总方式选择 -->
      <div class="aggregation-selection">
        <h3>选择汇总方式</h3>
        <div class="aggregation-options">
          <div class="option-group">
            <h4>基础汇总</h4>
            <el-radio-group v-model="selectedAggregation">
              <div class="option-row">
                <el-radio label="sum">
                  <div class="option-content">
                    <span class="option-title">求和 (SUM)</span>
                    <span class="option-desc">计算数值的总和</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="avg">
                  <div class="option-content">
                    <span class="option-title">平均值 (AVG)</span>
                    <span class="option-desc">计算数值的平均值</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="min">
                  <div class="option-content">
                    <span class="option-title">最小值 (MIN)</span>
                    <span class="option-desc">找出数值的最小值</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="max">
                  <div class="option-content">
                    <span class="option-title">最大值 (MAX)</span>
                    <span class="option-desc">找出数值的最大值</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="count">
                  <div class="option-content">
                    <span class="option-title">计数 (COUNT)</span>
                    <span class="option-desc">计算记录的数量</span>
                  </div>
                </el-radio>
              </div>
            </el-radio-group>
          </div>
          
          <div class="option-group">
            <h4>高级汇总</h4>
            <el-radio-group v-model="selectedAggregation">
              <div class="option-row">
                <el-radio label="median">
                  <div class="option-content">
                    <span class="option-title">中位数 (MEDIAN)</span>
                    <span class="option-desc">计算数值的中位数</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="stddev">
                  <div class="option-content">
                    <span class="option-title">标准差 (STDDEV)</span>
                    <span class="option-desc">计算数值的标准差</span>
                  </div>
                </el-radio>
              </div>
              <div class="option-row">
                <el-radio label="variance">
                  <div class="option-content">
                    <span class="option-title">方差 (VARIANCE)</span>
                    <span class="option-desc">计算数值的方差</span>
                  </div>
                </el-radio>
              </div>
            </el-radio-group>
          </div>
        </div>
      </div>
      
      <!-- 汇总设置选项 -->
      <div class="aggregation-settings" v-if="selectedAggregation">
        <h3>汇总设置</h3>
        <div class="setting-options">
          <div class="setting-item">
            <span class="label">显示名称：</span>
            <el-input 
              v-model="displayName" 
              placeholder="请输入汇总结果的显示名称"
              style="width: 300px;"
            />
          </div>
          <div class="setting-item">
            <span class="label">精度设置：</span>
            <el-input-number 
              v-model="precision" 
              :min="0" 
              :max="10" 
              controls-position="right"
              placeholder="小数位数"
            />
            <span class="hint">（0-10位小数）</span>
          </div>
          <div class="setting-item">
            <span class="label">空值处理：</span>
            <el-radio-group v-model="nullHandling">
              <el-radio label="ignore">忽略空值</el-radio>
              <el-radio label="zero">视为0</el-radio>
              <el-radio label="error">报错</el-radio>
            </el-radio-group>
          </div>
          <div class="setting-item" v-if="selectedAggregation === 'count'">
            <span class="label">计数方式：</span>
            <el-radio-group v-model="countType">
              <el-radio label="all">所有记录</el-radio>
              <el-radio label="distinct">去重计数</el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>
      
      <!-- 预览区域 -->
      <div class="preview-section" v-if="selectedAggregation">
        <h3>预览</h3>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-label">SQL表达式：</span>
            <code class="preview-sql">{{ generateSQLExpression() }}</code>
          </div>
          <div class="preview-item">
            <span class="preview-label">显示名称：</span>
            <span class="preview-value">{{ displayName || generateDefaultDisplayName() }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="dialog-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button 
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
  currentIndicator: {
    type: Object,
    default: null
  },
  currentAggregation: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel'])

// 选择的汇总方式
const selectedAggregation = ref('sum')

// 汇总设置
const displayName = ref('')
const precision = ref(2)
const nullHandling = ref('ignore')
const countType = ref('all')

// 是否可以确认
const canConfirm = computed(() => {
  return selectedAggregation.value !== ''
})

// 生成SQL表达式
const generateSQLExpression = () => {
  if (!props.currentIndicator) return ''
  
  const baseExpression = props.currentIndicator.formula
  // 从基础表达式中提取字段名，并确保使用[表名.字段名]格式
  let fieldName = baseExpression.match(/\((.*?)\)/)?.[1] || 'field'
  
  // 如果字段名不是[表名.字段名]格式，尝试转换为该格式
  if (!fieldName.startsWith('[') || !fieldName.endsWith(']')) {
    // 假设字段名是直接字段名，需要添加表名信息
    // 这里需要根据实际情况获取表名，暂时使用默认表名
    const tableName = '表名' // 这里需要根据实际情况获取正确的表名
    fieldName = `[${tableName}.${fieldName}]`
  }
  
  const aggregationMap = {
    sum: `SUM(${fieldName})`,
    avg: `AVG(${fieldName})`,
    min: `MIN(${fieldName})`,
    max: `MAX(${fieldName})`,
    count: countType.value === 'distinct' ? `COUNT(DISTINCT ${fieldName})` : `COUNT(${fieldName})`,
    median: `MEDIAN(${fieldName})`,
    stddev: `STDDEV(${fieldName})`,
    variance: `VARIANCE(${fieldName})`
  }
  
  return aggregationMap[selectedAggregation.value] || `SUM(${fieldName})`
}

// 生成默认显示名称
const generateDefaultDisplayName = () => {
  if (!props.currentIndicator) return ''
  
  const aggregationMap = {
    sum: '总和',
    avg: '平均值',
    min: '最小值',
    max: '最大值',
    count: '计数',
    median: '中位数',
    stddev: '标准差',
    variance: '方差'
  }
  
  const aggregationName = aggregationMap[selectedAggregation.value] || '汇总'
  return `${props.currentIndicator.name}${aggregationName}`
}

// 方法
const handleConfirm = () => {
  if (!canConfirm.value) {
    ElMessage.warning('请选择汇总方式')
    return
  }
  
  const settingData = {
    aggregation: selectedAggregation.value,
    displayName: displayName.value || generateDefaultDisplayName(),
    precision: precision.value,
    nullHandling: nullHandling.value,
    countType: countType.value,
    sqlExpression: generateSQLExpression()
  }
  
  emit('confirm', settingData)
}

const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  // 如果当前有汇总设置，初始化数据
  if (props.currentAggregation) {
    selectedAggregation.value = props.currentAggregation.aggregation || 'sum'
    displayName.value = props.currentAggregation.displayName || ''
    precision.value = props.currentAggregation.precision || 2
    nullHandling.value = props.currentAggregation.nullHandling || 'ignore'
    countType.value = props.currentAggregation.countType || 'all'
  }
})
</script>

<style scoped>
.aggregation-setting-dialog {
  padding: 20px;
}

.setting-content {
  max-height: 600px;
  overflow-y: auto;
}

.indicator-info {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.indicator-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
  word-break: break-all;
}

.aggregation-selection {
  margin-bottom: 30px;
}

.aggregation-selection h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.aggregation-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.option-group {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.option-group h4 {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.option-row {
  margin-bottom: 15px;
}

.option-content {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
}

.option-title {
  font-weight: 500;
  color: #303133;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.aggregation-settings {
  margin-bottom: 30px;
}

.aggregation-settings h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.setting-options {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.setting-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.setting-item .hint {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.preview-section {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.preview-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.preview-item {
  display: flex;
  margin-bottom: 15px;
}

.preview-label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.preview-sql {
  background-color: #f1f3f4;
  padding: 4px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #d63384;
}

.preview-value {
  color: #303133;
  font-weight: 500;
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