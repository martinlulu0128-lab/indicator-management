<template>
  <div class="indicator-configuration">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>指标配置</span>
          <div style="float: right;">
            <el-button type="primary" @click="openCreateDialog">新增指标</el-button>
          </div>
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
            <el-select 
              v-model="filters.status" 
              placeholder="状态" 
              clearable 
              style="width: 100%"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="searchIndicators">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 指标表格 -->
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
        <el-table-column prop="description" label="指标描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="enabled"
              inactive-value="disabled"
              @change="toggleStatus(scope.row)"
            />
            <span style="margin-left: 10px;">
              {{ scope.row.status === 'enabled' ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteIndicator(scope.row)">删除</el-button>
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
    
    <!-- 新增/编辑指标对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
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
        <el-form-item label="指标编码" prop="code">
          <el-input v-model="currentIndicator.code" />
        </el-form-item>
        <el-form-item label="指标分类" prop="category">
          <el-select v-model="currentIndicator.category" style="width: 100%">
            <el-option label="销售类" value="sales" />
            <el-option label="用户类" value="user" />
            <el-option label="产品类" value="product" />
            <el-option label="财务类" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标描述" prop="description">
          <el-input v-model="currentIndicator.description" type="textarea" />
        </el-form-item>
        <el-form-item label="计算公式" prop="formula">
          <el-input v-model="currentIndicator.formula" type="textarea" />
        </el-form-item>
        <el-form-item label="数据源表" prop="sourceTable">
          <el-select v-model="currentIndicator.sourceTable" style="width: 100%">
            <el-option 
              v-for="table in tableOptions" 
              :key="table.id" 
              :label="table.name" 
              :value="table.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentIndicator.status"
            active-value="enabled"
            inactive-value="disabled"
          />
          <span style="margin-left: 10px;">
            {{ currentIndicator.status === 'enabled' ? '启用' : '停用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveIndicator">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 数据加载状态
const loading = ref(false)

// 筛选条件
const filters = reactive({
  name: '',
  category: '',
  status: ''
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
  code: '',
  category: '',
  description: '',
  formula: '',
  sourceTable: '',
  status: 'enabled'
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
  category: [{ required: true, message: '请选择指标分类', trigger: 'change' }],
  description: [{ required: true, message: '请输入指标描述', trigger: 'blur' }],
  formula: [{ required: true, message: '请输入计算公式', trigger: 'blur' }],
  sourceTable: [{ required: true, message: '请选择数据源表', trigger: 'change' }]
}

// 表格引用
const indicatorForm = ref()

// 数据源表选项
const tableOptions = ref([
  { id: 'sales_detail', name: '销售明细表' },
  { id: 'user_behavior', name: '用户行为表' },
  { id: 'product_info', name: '产品信息表' },
  { id: 'order_summary', name: '订单汇总表' }
])

// 指标数据
const indicators = ref([
  {
    id: 1,
    name: '总销售额',
    code: 'total_sales_amount',
    category: 'sales',
    description: '统计周期内的销售总额',
    formula: 'SUM(sales_amount)',
    sourceTable: 'sales_detail',
    status: 'enabled'
  },
  {
    id: 2,
    name: '订单数量',
    code: 'order_count',
    category: 'sales',
    description: '统计周期内的订单总数',
    formula: 'COUNT(order_id)',
    sourceTable: 'sales_detail',
    status: 'enabled'
  },
  {
    id: 3,
    name: '活跃用户数',
    code: 'active_users',
    category: 'user',
    description: '统计周期内的活跃用户数量',
    formula: 'COUNT(DISTINCT user_id)',
    sourceTable: 'user_behavior',
    status: 'enabled'
  },
  {
    id: 4,
    name: '平均客单价',
    code: 'avg_order_value',
    category: 'sales',
    description: '统计周期内平均每单的金额',
    formula: 'SUM(sales_amount) / COUNT(order_id)',
    sourceTable: 'sales_detail',
    status: 'disabled'
  }
])

// 计算过滤后的指标数据
const filteredIndicators = computed(() => {
  return indicators.value.filter(indicator => {
    return (
      (filters.name === '' || indicator.name.includes(filters.name)) &&
      (filters.category === '' || indicator.category === filters.category) &&
      (filters.status === '' || indicator.status === filters.status)
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
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.category = ''
  filters.status = ''
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

// 打开创建对话框
const openCreateDialog = () => {
  dialogTitle.value = '新增指标'
  isEditing.value = false
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (indicator: any) => {
  dialogTitle.value = '编辑指标'
  isEditing.value = true
  Object.assign(currentIndicator, indicator)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(currentIndicator, {
    id: 0,
    name: '',
    code: '',
    category: '',
    description: '',
    formula: '',
    sourceTable: '',
    status: 'enabled'
  })
  
  // 清除表单验证
  if (indicatorForm.value) {
    indicatorForm.value.resetFields()
  }
}

// 切换指标状态
const toggleStatus = (indicator: any) => {
  const action = indicator.status === 'enabled' ? '启用' : '停用'
  ElMessage.success(`已${action}指标 "${indicator.name}"`)
}

// 保存指标
const saveIndicator = () => {
  indicatorForm.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 编辑逻辑
        const index = indicators.value.findIndex(item => item.id === currentIndicator.id)
        if (index !== -1) {
          indicators.value[index] = { ...currentIndicator }
          ElMessage.success('指标更新成功')
        }
      } else {
        // 新增逻辑
        const newId = Math.max(...indicators.value.map(item => item.id), 0) + 1
        indicators.value.push({
          ...currentIndicator,
          id: newId
        })
        ElMessage.success('指标添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 删除指标
const deleteIndicator = (indicator: any) => {
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
.indicator-configuration {
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

.dialog-footer {
  text-align: right;
}
</style>