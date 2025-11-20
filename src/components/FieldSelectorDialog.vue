<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    @close="handleClose"
    append-to-body
  >
    <!-- 表信息显示 -->
    <div class="table-info" v-if="selectedTable">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="表名">{{ selectedTable.name }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ selectedTable.description }}</el-descriptions-item>
      </el-descriptions>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索字段名或描述"
        clearable
        prefix-icon="Search"
        style="margin-bottom: 10px;"
      />
      
      <el-select
        v-model="fieldTypeFilter"
        placeholder="筛选字段类型"
        clearable
        style="width: 200px;"
      >
        <el-option label="所有类型" value="" />
        <el-option label="指标字段" value="metric" />
        <el-option label="维度字段" value="dimension" />
      </el-select>
    </div>
    
    <!-- 字段列表 -->
    <el-table
      v-loading="loading"
      :data="filteredFields"
      style="width: 100%"
      @row-click="handleFieldClick"
      @selection-change="handleSelectionChange"
      row-key="fieldName"
    >
      <el-table-column
        type="selection"
        width="55"
        :selectable="checkSelectable"
        :reserve-selection="true"
      />
      <el-table-column
        prop="fieldName"
        label="字段名"
        width="180"
      >
        <template #default="scope">
          <div class="field-name">{{ scope.row.fieldName }}</div>
        </template>
      </el-table-column>
      <el-table-column
        prop="displayName"
        label="显示名"
        width="180"
      />
      <el-table-column
        prop="type"
        label="类型"
        width="100"
      >
        <template #default="scope">
          <el-tag :type="scope.row.type === 'metric' ? 'primary' : 'success'">
            {{ scope.row.type === 'metric' ? '指标' : '维度' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="dataType"
        label="数据类型"
        width="100"
      />
      <el-table-column
        prop="description"
        label="描述"
        show-overflow-tooltip
      />
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredFields.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedField">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch, nextTick } from 'vue'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  selectedTable: {
    type: Object,
    default: null
  },
  fields: {
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
const fieldTypeFilter = ref('')
const selectedField = ref(null)

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 监听props.modelValue变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 设置表格选中状态
    nextTick(() => {
      if (selectedField.value) {
        // 触发重新渲染，确保选中状态正确显示
        setTimeout(() => {
          selectedField.value = selectedField.value
        }, 0)
      }
    })
  }
})

// 监听visible变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听选中的表变化
watch(() => props.selectedTable, () => {
  // 表变化时重置选择
  selectedField.value = null
  searchKeyword.value = ''
  fieldTypeFilter.value = ''
  pagination.currentPage = 1
})

// 对话框标题
const dialogTitle = computed(() => {
  if (props.selectedTable) {
    return `选择字段 - ${props.selectedTable.name}`
  }
  return '选择字段'
})

// 计算过滤后的字段列表
const filteredFields = computed(() => {
  let filtered = [...props.fields]
  
  // 按关键字过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(field => 
      field.fieldName.toLowerCase().includes(keyword) || 
      (field.displayName && field.displayName.toLowerCase().includes(keyword)) ||
      (field.description && field.description.toLowerCase().includes(keyword))
    )
  }
  
  // 按类型过滤
  if (fieldTypeFilter.value) {
    filtered = filtered.filter(field => field.type === fieldTypeFilter.value)
  }
  
  return filtered
})

// 检查字段是否可选
const checkSelectable = (row) => {
  // 如果已经有选中的字段，且当前行不是已选中的字段，则不可选
  if (selectedField.value && selectedField.value.fieldName !== row.fieldName) {
    return false
  }
  return true
}

// 处理字段点击
const handleFieldClick = (row) => {
  // 如果点击的是已选中的字段，则取消选择
  if (selectedField.value && selectedField.value.fieldName === row.fieldName) {
    selectedField.value = null
  } else {
    // 先清除之前的选择，再设置新选择
    selectedField.value = row
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  if (selection.length > 0) {
    // 只保留最后一个选择
    selectedField.value = selection[selection.length - 1]
    
    // 如果选择了多个，只保留最后一个
    if (selection.length > 1) {
      // 触发重新渲染，只显示最后一个选择
      setTimeout(() => {
        selectedField.value = selection[selection.length - 1]
      }, 0)
    }
  } else {
    selectedField.value = null
  }
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
  if (selectedField.value) {
    emit('confirm', selectedField.value)
    visible.value = false
  }
}
</script>

<style scoped>
.table-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.search-filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.field-name {
  font-weight: 500;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 选中行高亮样式 */
:deep(.el-table__body tr.current-row > td) {
  background-color: #f0f9ff !important;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #f5f7fa !important;
}
</style>