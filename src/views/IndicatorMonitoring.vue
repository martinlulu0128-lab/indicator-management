<template>
  <div class="indicator-monitoring">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>指标监控</span>
        </div>
      </template>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input 
              v-model="filters.name" 
              placeholder="指标名称" 
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="filters.category" 
              placeholder="指标分类" 
              clearable 
              style="width: 100%"
            >
              <el-option label="销售类" value="sales" />
              <el-option label="用户类" value="user" />
              <el-option label="产品类" value="product" />
              <el-option label="财务类" value="finance" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="searchIndicators">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 图表展示区域 -->
      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>指标趋势图</span>
                </div>
              </template>
              <div ref="trendChartRef" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>指标对比图</span>
                </div>
              </template>
              <div ref="compareChartRef" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 指标数据表格 -->
      <el-table 
        :data="paginatedData" 
        style="width: 100%; margin-top: 20px;" 
        border
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="指标名称" width="180" />
        <el-table-column prop="code" label="指标编码" width="150" />
        <el-table-column prop="category" label="指标分类" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.category === 'sales' ? 'success' : 
                     scope.row.category === 'user' ? 'primary' : 
                     scope.row.category === 'product' ? 'warning' : 'info'"
            >
              {{
                scope.row.category === 'sales' ? '销售类' :
                scope.row.category === 'user' ? '用户类' :
                scope.row.category === 'product' ? '产品类' : '财务类'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentValue" label="当前值" width="120" />
        <el-table-column prop="yesterdayValue" label="昨日值" width="120" />
        <el-table-column prop="weekAvgValue" label="周均值" width="120" />
        <el-table-column prop="trend" label="趋势" width="120">
          <template #default="scope">
            <span :style="{ color: scope.row.trend === 'up' ? '#67C23A' : scope.row.trend === 'down' ? '#F56C6C' : '#909399' }">
              {{ scope.row.trend === 'up' ? '↑ 上升' : scope.row.trend === 'down' ? '↓ 下降' : '→ 持平' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'normal' ? 'success' : 
                     scope.row.status === 'warning' ? 'warning' : 'danger'"
            >
              {{
                scope.row.status === 'normal' ? '正常' :
                scope.row.status === 'warning' ? '警告' : '异常'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewDetails(scope.row)">查看详情</el-button>
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
    
    <!-- 指标详情对话框 -->
    <el-dialog 
      title="指标详情" 
      v-model="detailDialogVisible" 
      width="800px"
    >
      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="指标名称：">
                  <span>{{ selectedIndicator.name }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="指标编码：">
                  <span>{{ selectedIndicator.code }}</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="指标分类：">
                  <span>
                    {{
                      selectedIndicator.category === 'sales' ? '销售类' :
                      selectedIndicator.category === 'user' ? '用户类' :
                      selectedIndicator.category === 'product' ? '产品类' : '财务类'
                    }}
                  </span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态：">
                  <el-tag 
                    :type="selectedIndicator.status === 'normal' ? 'success' : 
                           selectedIndicator.status === 'warning' ? 'warning' : 'danger'"
                  >
                    {{
                      selectedIndicator.status === 'normal' ? '正常' :
                      selectedIndicator.status === 'warning' ? '警告' : '异常'
                    }}
                  </el-tag>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="指标描述：">
              <span>{{ selectedIndicator.description }}</span>
            </el-form-item>
            <el-form-item label="计算公式：">
              <span>{{ selectedIndicator.formula }}</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="历史数据" name="history">
          <div ref="historyChartRef" style="height: 300px;"></div>
          <el-table :data="historyData" style="width: 100%; margin-top: 20px;" border>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="value" label="指标值" width="120" />
            <el-table-column prop="yesterdayValue" label="昨日值" width="120" />
            <el-table-column prop="trend" label="趋势" width="120">
              <template #default="scope">
                <span :style="{ color: scope.row.trend === 'up' ? '#67C23A' : scope.row.trend === 'down' ? '#F56C6C' : '#909399' }">
                  {{ scope.row.trend === 'up' ? '↑ 上升' : scope.row.trend === 'down' ? '↓ 下降' : '→ 持平' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="预警记录" name="alerts">
          <el-table :data="alertData" style="width: 100%;" border>
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="type" label="预警类型" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'threshold' ? 'warning' : 'danger'">
                  {{ scope.row.type === 'threshold' ? '阈值预警' : '异常预警' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="value" label="触发值" width="120" />
            <el-table-column prop="threshold" label="阈值" width="120" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="status" label="处理状态" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'handled' ? 'success' : 'warning'">
                  {{ scope.row.status === 'handled' ? '已处理' : '未处理' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 数据加载状态
const loading = ref(false)

// 筛选条件
const filters = reactive({
  name: '',
  category: '',
  dateRange: []
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 对话框相关
const detailDialogVisible = ref(false)
const activeDetailTab = ref('basic')

// 图表引用
const trendChartRef = ref()
const compareChartRef = ref()
const historyChartRef = ref()

// 图表实例
let trendChart: any = null
let compareChart: any = null
let historyChart: any = null

// 当前选中的指标
const selectedIndicator = ref({
  id: 0,
  name: '',
  code: '',
  category: '',
  description: '',
  formula: '',
  currentValue: 0,
  yesterdayValue: 0,
  weekAvgValue: 0,
  trend: 'up',
  status: 'normal'
})

// 指标数据
const indicators = ref([
  {
    id: 1,
    name: '总销售额',
    code: 'total_sales_amount',
    category: 'sales',
    description: '统计周期内的销售总额',
    formula: 'SUM(sales_amount)',
    currentValue: 1250000,
    yesterdayValue: 1180000,
    weekAvgValue: 1200000,
    trend: 'up',
    status: 'normal'
  },
  {
    id: 2,
    name: '订单数量',
    code: 'order_count',
    category: 'sales',
    description: '统计周期内的订单总数',
    formula: 'COUNT(order_id)',
    currentValue: 2560,
    yesterdayValue: 2420,
    weekAvgValue: 2500,
    trend: 'up',
    status: 'normal'
  },
  {
    id: 3,
    name: '活跃用户数',
    code: 'active_users',
    category: 'user',
    description: '统计周期内的活跃用户数量',
    formula: 'COUNT(DISTINCT user_id)',
    currentValue: 18500,
    yesterdayValue: 17800,
    weekAvgValue: 18200,
    trend: 'up',
    status: 'warning'
  },
  {
    id: 4,
    name: '平均客单价',
    code: 'avg_order_value',
    category: 'sales',
    description: '统计周期内平均每单的金额',
    formula: 'SUM(sales_amount) / COUNT(order_id)',
    currentValue: 488.28,
    yesterdayValue: 487.60,
    weekAvgValue: 485.50,
    trend: 'up',
    status: 'normal'
  },
  {
    id: 5,
    name: '退款率',
    code: 'refund_rate',
    category: 'sales',
    description: '统计周期内退款订单占总订单的比例',
    formula: 'COUNT(refund_order_id) / COUNT(order_id)',
    currentValue: 0.025,
    yesterdayValue: 0.021,
    weekAvgValue: 0.023,
    trend: 'up',
    status: 'warning'
  },
  {
    id: 6,
    name: '新用户数',
    code: 'new_users',
    category: 'user',
    description: '统计周期内新增用户数量',
    formula: 'COUNT(new_user_id)',
    currentValue: 1250,
    yesterdayValue: 1180,
    weekAvgValue: 1200,
    trend: 'up',
    status: 'normal'
  }
])

// 历史数据
const historyData = ref([
  { date: '2023-06-01', value: 1180000, yesterdayValue: 1150000, trend: 'up' },
  { date: '2023-06-02', value: 1200000, yesterdayValue: 1180000, trend: 'up' },
  { date: '2023-06-03', value: 1220000, yesterdayValue: 1200000, trend: 'up' },
  { date: '2023-06-04', value: 1190000, yesterdayValue: 1220000, trend: 'down' },
  { date: '2023-06-05', value: 1210000, yesterdayValue: 1190000, trend: 'up' },
  { date: '2023-06-06', value: 1230000, yesterdayValue: 1210000, trend: 'up' },
  { date: '2023-06-07', value: 1250000, yesterdayValue: 1230000, trend: 'up' }
])

// 预警记录
const alertData = ref([
  {
    time: '2023-06-07 14:30:25',
    type: 'threshold',
    value: 1250000,
    threshold: 1200000,
    description: '总销售额超过阈值',
    status: 'handled'
  },
  {
    time: '2023-06-05 09:15:42',
    type: 'threshold',
    value: 0.025,
    threshold: 0.020,
    description: '退款率超过阈值',
    status: 'handled'
  },
  {
    time: '2023-06-03 16:42:18',
    type: 'abnormal',
    value: 18500,
    threshold: null,
    description: '活跃用户数异常波动',
    status: 'handled'
  }
])

// 计算过滤后的指标数据
const filteredIndicators = computed(() => {
  return indicators.value.filter(indicator => {
    return (
      (filters.name === '' || indicator.name.includes(filters.name)) &&
      (filters.category === '' || indicator.category === filters.category)
    )
  })
})

// 计算分页数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredIndicators.value.slice(start, end)
})

// 查询指标
const searchIndicators = () => {
  pagination.currentPage = 1
  ElMessage.success('查询成功')
  // 重新渲染图表
  nextTick(() => {
    initCharts()
  })
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.category = ''
  filters.dateRange = []
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

// 查看详情
const viewDetails = (indicator: any) => {
  selectedIndicator.value = { ...indicator }
  detailDialogVisible.value = true
  // 在对话框打开后初始化历史数据图表
  nextTick(() => {
    initHistoryChart()
  })
}

// 初始化图表
const initCharts = () => {
  // 初始化趋势图
  if (trendChartRef.value) {
    if (trendChart) {
      trendChart.dispose()
    }
    trendChart = echarts.init(trendChartRef.value)
    
    const option = {
      title: {
        text: '指标趋势'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: [120, 200, 150, 80, 70, 110, 130],
          type: 'line',
          smooth: true
        }
      ]
    }
    
    trendChart.setOption(option)
  }
  
  // 初始化对比图
  if (compareChartRef.value) {
    if (compareChart) {
      compareChart.dispose()
    }
    compareChart = echarts.init(compareChartRef.value)
    
    const option = {
      title: {
        text: '指标对比'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['销售额', '订单数']
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '销售额',
          data: [1200, 2000, 1500, 800, 700, 1100, 1300],
          type: 'bar'
        },
        {
          name: '订单数',
          data: [120, 200, 150, 80, 70, 110, 130],
          type: 'bar'
        }
      ]
    }
    
    compareChart.setOption(option)
  }
}

// 初始化历史数据图表
const initHistoryChart = () => {
  if (historyChartRef.value) {
    if (historyChart) {
      historyChart.dispose()
    }
    historyChart = echarts.init(historyChartRef.value)
    
    const option = {
      title: {
        text: '历史数据趋势'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: historyData.value.map(item => item.date)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: historyData.value.map(item => item.value),
          type: 'line',
          smooth: true
        }
      ]
    }
    
    historyChart.setOption(option)
  }
}

// 组件挂载时的操作
onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
    // 初始化图表
    initCharts()
  }, 500)
})
</script>

<style scoped>
.indicator-monitoring {
  padding: 20px;
  height: 100%;
}

.main-card {
  height: 100%;
}

.card-header {
  font-size: 20px;
  font-weight: bold;
}

.filter-section {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.chart-section {
  margin-top: 20px;
}
</style>