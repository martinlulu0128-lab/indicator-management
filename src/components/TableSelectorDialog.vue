<template>
  <el-dialog
    v-model="visible"
    title="选择数据表"
    width="600px"
    @close="handleClose"
    append-to-body
  >
    <!-- 搜索框 -->
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索表名或描述"
        clearable
        prefix-icon="Search"
        style="margin-bottom: 20px;"
      />
    </div>
    
    <!-- 表列表 -->
    <el-table
      v-loading="loading"
      :data="filteredTables"
      style="width: 100%"
      @row-click="handleTableClick"
      row-key="id"
    >
      <el-table-column
        prop="name"
        label="表名"
        width="180"
      >
        <template #default="scope">
          <div class="table-name">{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="描述"
        show-overflow-tooltip
      />
      <el-table-column
        prop="createTime"
        label="创建时间"
        width="180"
      />
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredTables.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedTable">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch } from 'vue'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  tables: {
    type: Array,
    default: () => []
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const selectedTable = ref(null)

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 监听props.modelValue变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 打开弹窗时重置状态
    resetState()
  }
})

// 监听visible变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 计算过滤后的表列表
const filteredTables = computed(() => {
  if (!searchKeyword.value) {
    return props.tables
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return props.tables.filter(table => 
    table.name.toLowerCase().includes(keyword) || 
    (table.description && table.description.toLowerCase().includes(keyword))
  )
})

// 分页后的表列表
const paginatedTables = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredTables.value.slice(start, end)
})

// 重置状态
const resetState = () => {
  searchKeyword.value = ''
  selectedTable.value = null
  pagination.currentPage = 1
  pagination.pageSize = 10
}

// 处理表点击
const handleTableClick = (row) => {
  selectedTable.value = row
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理确认
const handleConfirm = () => {
  if (selectedTable.value) {
    emit('confirm', selectedTable.value)
    visible.value = false
  }
}
</script>

<style scoped>
.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.table-name {
  font-weight: 500;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>