<template>
  <div class="indicator-management">
    <!-- 左侧表清单 -->
    <div class="table-list-aside">
      <div class="table-list-wrapper">
        <div class="search-container">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索表名..." 
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="table-list-container">
          <div 
            v-for="table in filteredTableList" 
            :key="table.id"
            class="table-item"
            :class="{ 'active': selectedTable && selectedTable.id === table.id }"
            @click="handleTableSelect(table)"
          >
            <div class="table-name">
              {{ table.name }}
            </div>
            <div class="table-description">
              {{ table.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧主区域 -->
    <div class="main-content">
      <div v-if="!selectedTable" class="empty-placeholder">
        请选择左侧的指标明细表
      </div>
      
      <div v-else class="content-wrapper">
        <!-- 表信息展示 -->
        <div class="table-info-header">
          <div class="table-title-container">
            <div class="table-title-wrapper">
              <div class="table-name">{{ selectedTable.name }}</div>
              <div class="table-description">{{ selectedTable.description }}</div>
            </div>
            <div class="spacer"></div>
            <div class="view-type-tag" v-if="tableInfo.viewType">
              <el-tag :type="tableInfo.viewType === 'physical' ? 'warning' : 'primary'" size="small">
                {{ tableInfo.viewType === 'physical' ? '物理视图' : '逻辑视图' }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <el-tabs class="main-tabs" tab-position="top">
          <!-- 字段信息 Tab -->
          <el-tab-pane label="字段信息">
            <div class="field-info-container">
              <!-- 筛选框 -->
              <div class="field-filter-row">
                <div class="filter-content">
                  <div class="filter-left">
                    <el-checkbox-group v-model="fieldFilter" class="field-type-checkbox-group">
                      <el-checkbox-button
                        v-for="item in fieldTypeOptions"
                        :key="item.value"
                        :label="item.value"
                      >
                        {{ item.label }}
                      </el-checkbox-button>
                    </el-checkbox-group>
                  </div>
                  <div class="filter-right">
                    <div class="button-group">
                      <el-button type="primary" @click="createDerivedIndicator">
                        <el-icon><Plus /></el-icon>
                        创建衍生指标
                      </el-button>
                      <el-button type="success" @click="createDerivedDimension" class="create-btn">
                        <el-icon><CirclePlus /></el-icon>
                        创建衍生维度
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 字段清单 -->
              <div class="field-table-container">
                <el-table :data="filteredFieldData" class="field-table" border>
                  <el-table-column prop="displayName" label="字段别名" width="150" />
                  <el-table-column prop="fieldName" label="字段名称" width="180" />
                  <el-table-column prop="type" label="列类型" width="120">
                    <template #default="scope">
                      <el-tag 
                        :type="scope.row.type === 'indicator' ? 'success' : 
                               scope.row.type === 'dimension' ? 'primary' : 
                               scope.row.type === 'derived_indicator' ? 'warning' : 'info'"
                      >
                        {{ 
                          scope.row.type === 'indicator' ? '指标' :
                          scope.row.type === 'dimension' ? '维度' :
                          scope.row.type === 'derived_indicator' ? '衍生指标' : '衍生维度'
                        }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="source" label="来源" width="200" />
                  <el-table-column prop="description" label="描述" />
                </el-table>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 表基本信息 Tab -->
          <el-tab-pane label="表基本信息">
            <el-descriptions :column="2" class="info-descriptions" border>
              <el-descriptions-item label="表别名">{{ tableInfo.displayName }}</el-descriptions-item>
              <el-descriptions-item label="表名">{{ tableInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ tableInfo.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ tableInfo.updateTime }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ tableInfo.owner }}</el-descriptions-item>
              <el-descriptions-item label="视图类型">
                <el-tag :type="tableInfo.viewType === 'physical' ? 'warning' : 'primary'">
                  {{ tableInfo.viewType === 'physical' ? '物理视图' : '逻辑视图' }}
                </el-tag>
              </el-descriptions-item>
              
              <!-- 物理视图特有信息 -->
              <template v-if="tableInfo.viewType === 'physical'">
                <el-descriptions-item label="同步类型">{{ tableInfo.syncSettings.syncType === 'realtime' ? '实时同步' : '定时同步' }}</el-descriptions-item>
                <el-descriptions-item label="同步计划">{{ tableInfo.syncSettings.schedule }}</el-descriptions-item>
                <el-descriptions-item label="最后同步时间">{{ tableInfo.syncSettings.lastSyncTime }}</el-descriptions-item>
                <el-descriptions-item label="同步状态">
                  <el-tag :type="tableInfo.syncSettings.syncStatus === 'success' ? 'success' : 
                           tableInfo.syncSettings.syncStatus === 'failed' ? 'danger' : 'warning'">
                    {{ tableInfo.syncSettings.syncStatus === 'success' ? '同步成功' : 
                       tableInfo.syncSettings.syncStatus === 'failed' ? '同步失败' : '同步中' }}
                  </el-tag>
                </el-descriptions-item>
              </template>
              
              <!-- 表描述占一整行 -->
              <el-descriptions-item label="表描述" :span="2">{{ tableInfo.description }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
            
          <!-- 参考数据 Tab -->
          <el-tab-pane label="参考数据">
            <el-table :data="filteredReferenceData" class="reference-table" border>
              <el-table-column prop="code" label="编码" width="150" />
              <el-table-column prop="name" label="名称" width="200" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                    {{ scope.row.status === 'active' ? '启用' : '停用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, CirclePlus } from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 表清单数据
const tableList = ref([
  { id: 1, name: 'sales_detail', description: '销售明细表' },
  { id: 2, name: 'user_behavior', description: '用户行为表' },
  { id: 3, name: 'product_info', description: '产品信息表' },
  { id: 4, name: 'order_summary', description: '订单汇总表' },
  { id: 5, name: 'customer_profile', description: '客户画像表' }
])

// 过滤后的表清单
const filteredTableList = computed(() => {
  if (!searchKeyword.value) {
    return tableList.value
  }
  return tableList.value.filter(table => 
    table.name.includes(searchKeyword.value) || 
    table.description.includes(searchKeyword.value)
  )
})

// 当前选中的表
const selectedTable = ref<any>(null)

// 处理表选择
const handleTableSelect = (row: any) => {
  selectedTable.value = row
  // 模拟加载表信息
  if (row) {
    tableInfo.value = {
      name: row.name,
      displayName: row.description,
      description: `这是${row.description}的详细信息`,
      createTime: '2023-01-15',
      updateTime: '2023-06-15',
      status: 'active',
      dataSource: '数据仓库',
      updateFrequency: '每日更新',
      owner: '张三',
      lastUpdateTime: '2023-06-15 02:00:00',
      viewType: row.id % 2 === 0 ? 'physical' : 'logical', // 偶数ID为物理视图，奇数ID为逻辑视图
      syncSettings: {
        syncType: 'scheduled',
        schedule: '0 0 * * *',
        lastSyncTime: '2023-06-15 02:00:00',
        syncStatus: 'success'
      }
    }
  }
}

// 字段类型选项
const fieldTypeOptions = ref([
  { value: 'indicator', label: '指标' },
  { value: 'dimension', label: '维度' },
  { value: 'derived_indicator', label: '衍生指标' },
  { value: 'derived_dimension', label: '衍生维度' }
])

// 字段筛选
const fieldFilter = ref(['indicator', 'dimension', 'derived_indicator', 'derived_dimension'])

// 字段数据
const fieldData = ref([
  { displayName: '订单ID', fieldName: 'order_id', type: 'dimension', source: '订单系统', description: '唯一标识一个订单' },
  { displayName: '客户ID', fieldName: 'customer_id', type: 'dimension', source: '客户系统', description: '唯一标识一个客户' },
  { displayName: '产品ID', fieldName: 'product_id', type: 'dimension', source: '产品系统', description: '唯一标识一个产品' },
  { displayName: '销售金额', fieldName: 'sales_amount', type: 'indicator', source: '订单系统', description: '订单的实际销售金额' },
  { displayName: '订单数量', fieldName: 'order_quantity', type: 'indicator', source: '订单系统', description: '订单中产品的数量' },
  { displayName: '折扣金额', fieldName: 'discount_amount', type: 'indicator', source: '订单系统', description: '订单的折扣金额' },
  { displayName: '客户等级', fieldName: 'customer_level', type: 'derived_dimension', source: '客户画像', description: '根据客户消费行为计算的等级' },
  { displayName: '客单价', fieldName: 'avg_customer_value', type: 'derived_indicator', source: '计算字段', description: '客户平均消费金额' }
])

// 计算筛选后的字段数据
const filteredFieldData = computed(() => {
  if (fieldFilter.value.length === 0) {
    return fieldData.value
  }
  
  return fieldData.value.filter(field => 
    fieldFilter.value.includes(field.type)
  )
})

// 表基本信息
const tableInfo = ref({
  name: '',
  displayName: '',
  description: '',
  createTime: '',
  updateTime: '',
  status: '',
  dataSource: '',
  updateFrequency: '',
  owner: '',
  lastUpdateTime: '',
  viewType: 'logical', // 'logical' 表示逻辑视图, 'physical' 表示物理视图
  syncSettings: {
    syncType: 'realtime', // 同步类型: realtime(实时), scheduled(定时)
    schedule: '0 0 * * *', // 定时同步的cron表达式
    lastSyncTime: '2023-06-15 02:00:00', // 最后同步时间
    syncStatus: 'success' // 同步状态: success(成功), failed(失败), syncing(同步中)
  }
})

// 参考数据
const referenceData = ref([
  { code: 'CUST001', name: '普通客户', description: '消费金额小于1000元', status: 'active' },
  { code: 'CUST002', name: '银卡客户', description: '消费金额1000-5000元', status: 'active' },
  { code: 'CUST003', name: '金卡客户', description: '消费金额5000-20000元', status: 'active' },
  { code: 'CUST004', name: '钻石客户', description: '消费金额大于20000元', status: 'active' },
  { code: 'CUST005', name: 'VIP客户', description: 'VIP特权客户', status: 'active' },
  { code: 'CUST006', name: '潜在客户', description: '有购买意向但未购买的客户', status: 'active' },
  { code: 'CUST007', name: '流失客户', description: '超过3个月未购买的客户', status: 'inactive' },
  { code: 'CUST008', name: '新客户', description: '首次购买的客户', status: 'active' },
  { code: 'CUST009', name: '回头客户', description: '重复购买的客户', status: 'active' },
  { code: 'CUST010', name: '企业客户', description: '公司或组织客户', status: 'active' },
  { code: 'CUST011', name: '个人客户', description: '个人消费者', status: 'active' },
  { code: 'CUST012', name: '批发客户', description: '大量采购的客户', status: 'active' },
  { code: 'CUST013', name: '零售客户', description: '小量购买的客户', status: 'active' },
  { code: 'CUST014', name: '高价值客户', description: '消费金额排名前10%的客户', status: 'active' },
  { code: 'CUST015', name: '中等价值客户', description: '消费金额排名中间50%的客户', status: 'active' },
  { code: 'CUST016', name: '低价值客户', description: '消费金额排名后40%的客户', status: 'active' },
  { code: 'CUST017', name: '活跃客户', description: '最近一个月有购买行为的客户', status: 'active' },
  { code: 'CUST018', name: '沉默客户', description: '最近一个月无购买行为的客户', status: 'active' },
  { code: 'CUST019', name: '忠实客户', description: '连续购买超过一年的客户', status: 'active' },
  { code: 'CUST020', name: '新晋客户', description: '最近一周注册的新客户', status: 'active' },
  { code: 'CUST021', name: '老客户', description: '注册超过一年的客户', status: 'active' },
  { code: 'CUST022', name: '测试客户', description: '用于测试的客户数据', status: 'inactive' },
  { code: 'CUST023', name: '内部客户', description: '公司内部员工账户', status: 'active' },
  { code: 'CUST024', name: '合作伙伴客户', description: '合作伙伴公司的客户', status: 'active' },
  { code: 'CUST025', name: '黑名单客户', description: '存在不良记录的客户', status: 'inactive' }
])

// 计算筛选后的参考数据，只显示前20条
const filteredReferenceData = computed(() => {
  return referenceData.value.slice(0, 20)
})

// 表格数据
const tableData = ref([
  { date: '2023-06-01', sales_amount: 125000, order_count: 128, customer_count: 98, avg_customer_value: 1275 },
  { date: '2023-06-02', sales_amount: 138500, order_count: 142, customer_count: 105, avg_customer_value: 1319 },
  { date: '2023-06-03', sales_amount: 98000, order_count: 96, customer_count: 78, avg_customer_value: 1256 },
  { date: '2023-06-04', sales_amount: 142300, order_count: 156, customer_count: 121, avg_customer_value: 1176 },
  { date: '2023-06-05', sales_amount: 119800, order_count: 132, customer_count: 95, avg_customer_value: 1261 }
])

// 表格列定义
const tableColumns = ref([
  { prop: 'date', label: '日期', width: 120 },
  { prop: 'sales_amount', label: '销售额', width: 120 },
  { prop: 'order_count', label: '订单数', width: 100 },
  { prop: 'customer_count', label: '客户数', width: 100 },
  { prop: 'avg_customer_value', label: '平均客单价', width: 120 }
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 创建衍生指标
const createDerivedIndicator = () => {
  ElMessage.info('创建衍生指标功能待实现')
}

// 创建衍生维度
const createDerivedDimension = () => {
  ElMessage.info('创建衍生维度功能待实现')
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新')
}

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  ElMessage.success(`切换到第 ${page} 页`)
}
</script>

<style scoped>
.indicator-management {
  padding: 0;
  height: 100%;
  background-color: transparent;
  display: flex;
  gap: 15px;
}

.table-list-aside {
  width: 320px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-list-wrapper {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 0;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #ffffff;
}

.table-info-header {
  margin-bottom: 16px;
  padding: 15px;
  border-radius: 6px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
}

.field-filter-row {
  margin-bottom: 15px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 6px;
  /* 移除边框 */
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.filter-left {
  flex: 1;
}

.filter-right {
  flex-shrink: 0;
}

.field-type-checkbox-group {
  flex: 1;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 5px; /* 减小按钮间距 */
}

/* 移除.table-info-details容器样式 */

/* 移除.reference-data-container容器样式 */

.reference-table {
  height: 100%;
}

.reference-table :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.search-container {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  background-color: #ffffff;
}

.search-input {
  width: 100%;
}

.table-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background-color: #ffffff;
}

.table-item {
  padding: 12px 15px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.table-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.table-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.table-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.table-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
}

.table-title-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.spacer {
  flex: 1;
}

.view-type-tag {
  flex-shrink: 0;
}
</style>