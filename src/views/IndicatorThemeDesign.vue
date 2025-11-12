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

      <!-- 主体内容区域 -->
      <div class="main-content">
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
            @column-order-change="handleColumnOrderChange"
          >
            <el-table-column 
              v-for="(column, index) in selectedColumns" 
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
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
              <draggable
                v-model="selectedColumns"
                item-key="fieldId"
                class="selected-fields-list"
                :animation="200"
                :ghost-class="'sortable-ghost'"
                :chosen-class="'sortable-chosen'"
                :drag-class="'sortable-drag'"
                @end="onFieldDragEnd"
                handle=".selected-field-item"
              >
                <template #item="{ element: column, index }">
                  <div class="selected-field-item">
                    <div class="field-info">
                      <div class="field-name">{{ column.label }}</div>
                      <div class="field-details">
                        <el-tag :type="getFieldTypeTagType(column.type)" size="small">
                          {{ column.type }}
                        </el-tag>
                        <span class="source-table">{{ getTableById(column.tableId) }}</span>
                      </div>
                    </div>
                    <div class="field-actions">
                      <el-icon class="delete-icon" @click="removeColumn(index)"><Delete /></el-icon>
                    </div>
                  </div>
                </template>
              </draggable>
              <div v-if="selectedColumns.length === 0" class="no-fields">
                暂无已选择字段
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

              <!-- 字段选择 Tab -->
              <el-tab-pane label="字段选择" name="fieldSelection">
                <div class="field-selection">
                  <!-- 核心主题表选择 -->
                  <div class="core-table-selection" style="margin-bottom: 20px;">
                    <el-select 
                      v-model="selectedCoreTable" 
                      placeholder="请选择核心主题表" 
                      @change="loadTableFields"
                      style="width: 100%;"
                    >
                      <el-option
                        v-for="table in coreTables"
                        :key="table.id"
                        :label="table.description"
                        :value="table.id"
                      />
                    </el-select>
                  </div>
                  
                  <!-- 字段选择区域 -->
                  <div class="fields-selection-area" v-if="selectedCoreTable">
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
                    
                    <!-- 搜索框和字段列表容器 -->
                    <div class="field-search-list-container">
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
                          v-for="field in filteredFields" 
                          :key="field.id"
                          class="field-item"
                          :class="{ 'field-item-added': isFieldAdded(field.id) }"
                          @click="addField(field)"
                        >
                          <div class="field-content">
                            <div class="field-name">{{ field.name }}</div>
                            <div class="field-type">
                              <el-tag :type="getFieldTypeTagType(field.type)">
                                {{ field.type }}
                              </el-tag>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 增加衍生指标和衍生维度按钮 -->
                    <div class="add-derived-field" style="display: flex; gap: 10px;">
                      <el-tooltip content="增加衍生指标" placement="top">
                        <el-button 
                          type="primary" 
                          plain 
                          @click="addDerivedMetric"
                        >
                          <el-icon><Plus /></el-icon>
                          衍生指标
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="增加衍生维度" placement="top">
                        <el-button 
                          type="success" 
                          plain 
                          @click="addDerivedDimension"
                        >
                          <el-icon><Plus /></el-icon>
                          衍生维度
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Rank, Edit, Delete, Plus } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields, getResultData } from '@/api/indicator'
import Sortable from 'sortablejs'
import draggable from 'vuedraggable'

// 路由
const router = useRouter()
const route = useRoute()

// 报表ID
const reportId = ref('')



// Tabs 控制
const activeTab = ref('basicInfo')

// 报表基本信息表单
const basicInfoForm = ref({
  name: '',
  alias: '',
  description: ''
})

// 核心主题表
// 从IndicatorManagement.vue获取的表清单数据
const coreTables = ref([
  { id: 1, name: 'sales_detail', description: '销售明细表' },
  { id: 2, name: 'user_behavior', description: '用户行为表' },
  { id: 3, name: 'product_info', description: '产品信息表' },
  { id: 4, name: 'order_summary', description: '订单汇总表' },
  { id: 5, name: 'customer_profile', description: '客户画像表' }
])

const selectedCoreTable = ref('')

// 字段搜索关键字
const fieldSearchKeyword = ref('')

// 字段类型选项
const fieldTypeOptions = ref([
  { value: '指标', label: '指标' },
  { value: '维度', label: '维度' },
  { value: '衍生指标', label: '衍生指标' },
  { value: '衍生维度', label: '衍生维度' }
])

// 字段类型筛选
const fieldFilter = ref(['指标', '维度', '衍生指标', '衍生维度'])

// 所有字段
// 从IndicatorManagement.vue获取的字段数据
const allFields = ref([
  // 销售明细表字段 (tableId: 1)
  { id: 1, name: '订单ID', type: '维度', tableId: 1 },
  { id: 2, name: '客户ID', type: '维度', tableId: 1 },
  { id: 3, name: '产品ID', type: '维度', tableId: 1 },
  { id: 4, name: '销售金额', type: '指标', tableId: 1 },
  { id: 5, name: '订单数量', type: '指标', tableId: 1 },
  { id: 6, name: '折扣金额', type: '指标', tableId: 1 },
  { id: 7, name: '客户等级', type: '衍生维度', tableId: 1 },
  { id: 8, name: '客单价', type: '衍生指标', tableId: 1 },
  
  // 用户行为表字段 (tableId: 2)
  { id: 9, name: '用户ID', type: '维度', tableId: 2 },
  { id: 10, name: '访问时间', type: '维度', tableId: 2 },
  { id: 11, name: '页面浏览量', type: '指标', tableId: 2 },
  { id: 12, name: '点击次数', type: '指标', tableId: 2 },
  { id: 13, name: '停留时长', type: '指标', tableId: 2 },
  { id: 14, name: '用户类型', type: '衍生维度', tableId: 2 },
  { id: 15, name: '活跃度评分', type: '衍生指标', tableId: 2 },
  
  // 产品信息表字段 (tableId: 3)
  { id: 16, name: '产品ID', type: '维度', tableId: 3 },
  { id: 17, name: '产品名称', type: '维度', tableId: 3 },
  { id: 18, name: '产品类别', type: '维度', tableId: 3 },
  { id: 19, name: '产品价格', type: '指标', tableId: 3 },
  { id: 20, name: '库存数量', type: '指标', tableId: 3 },
  { id: 21, name: '产品状态', type: '衍生维度', tableId: 3 },
  { id: 22, name: '热销指数', type: '衍生指标', tableId: 3 },
  
  // 订单汇总表字段 (tableId: 4)
  { id: 23, name: '订单日期', type: '维度', tableId: 4 },
  { id: 24, name: '订单总额', type: '指标', tableId: 4 },
  { id: 25, name: '订单数量', type: '指标', tableId: 4 },
  { id: 26, name: '客户数量', type: '指标', tableId: 4 },
  { id: 27, name: '平均订单金额', type: '衍生指标', tableId: 4 },
  
  // 客户画像表字段 (tableId: 5)
  { id: 28, name: '客户ID', type: '维度', tableId: 5 },
  { id: 29, name: '客户等级', type: '维度', tableId: 5 },
  { id: 30, name: '消费总额', type: '指标', tableId: 5 },
  { id: 31, name: '购买频次', type: '指标', tableId: 5 },
  { id: 32, name: '最近购买时间', type: '维度', tableId: 5 },
  { id: 33, name: '客户价值评分', type: '衍生指标', tableId: 5 }
])

// 过滤后的字段
const filteredFields = computed(() => {
  if (!selectedCoreTable.value) return []
  
  return allFields.value.filter(field => {
    // 筛选当前表的字段
    if (field.tableId !== parseInt(selectedCoreTable.value)) return false
    
    // 根据字段类型筛选
    if (fieldFilter.value.length > 0 && !fieldFilter.value.includes(field.type)) return false
    
    // 根据搜索关键字筛选
    if (fieldSearchKeyword.value) {
      return field.name.includes(fieldSearchKeyword.value)
    }
    
    return true
  })
})

// 已选择的列
const selectedColumns = ref([])

// 结果数据
const resultData = ref([])
const totalRecords = ref(0)

// 加载表字段
const loadTableFields = () => {
  // 保留已选择的字段和运算结果
  // 不清空resultData和totalRecords，保持原有数据
  
  // 如果需要重新加载字段列表，可以在这里添加逻辑
  // 但为了保留运算结果，我们不改变现有字段和数据
}

// 添加字段
const addField = (field: any) => {
  // 检查字段是否已添加
  const exists = selectedColumns.value.some(col => col.fieldId === field.id)
  if (exists) {
    ElMessage.warning('该字段已添加')
    return
  }
  
  // 添加到已选择字段
  const newColumn = {
    fieldId: field.id,
    prop: field.name.toLowerCase().replace(/\s+/g, '_'),
    label: field.name,
    width: 150,
    type: field.type,
    tableId: field.tableId || parseInt(selectedCoreTable.value)
  }
  
  selectedColumns.value.push(newColumn)
  
  // 更新结果表格
  updateResultTable()
  
  ElMessage.success(`已添加字段: ${field.name}`)
}

// 移除字段
const removeColumn = (index: number) => {
  selectedColumns.value.splice(index, 1)
  // 只更新数据，不重新初始化拖拽功能，避免表头闪烁
  resultData.value = []
  totalRecords.value = 0
}

// 更新结果表格（只显示列头，不生成数据）
const updateResultTable = () => {
  // 只清空数据，保留列头
  resultData.value = []
  totalRecords.value = 0
  
  // 初始化表格列拖拽功能
  initColumnDrag()
}

// 获取数据/运算
const fetchData = () => {
  if (selectedColumns.value.length === 0) {
    ElMessage.warning('请先选择字段')
    return
  }
  
  // 数据校验
  const validationErrors = []
  
  // 检查是否至少有一个指标字段
  const hasIndicator = selectedColumns.value.some(column => column.type === '指标' || column.type === '衍生指标')
  if (!hasIndicator) {
    validationErrors.push('至少需要选择一个指标字段')
  }
  
  // 检查是否至少有一个维度字段
  const hasDimension = selectedColumns.value.some(column => column.type === '维度' || column.type === '衍生维度')
  if (!hasDimension) {
    validationErrors.push('至少需要选择一个维度字段')
  }
  
  // 如果有校验错误，显示错误信息
  if (validationErrors.length > 0) {
    ElMessage.error(`数据校验失败: ${validationErrors.join(', ')}`)
    return
  }
  
  // 根据选择的字段生成模拟数据
  const mockData = []
  for (let i = 0; i < 20; i++) {
    const row: any = {}
    selectedColumns.value.forEach(column => {
      if (column.type === '维度' || column.type === '衍生维度') {
        row[column.prop] = `${column.label}_${i + 1}`
      } else if (column.type === '指标' || column.type === '衍生指标') {
        row[column.prop] = Math.floor(Math.random() * 1000)
      } else {
        row[column.prop] = `衍生_${i + 1}`
      }
    })
    mockData.push(row)
  }
  resultData.value = mockData
  totalRecords.value = 100 // 模拟总记录数
  
  ElMessage.success('数据获取成功')
}

// 获取字段类型标签类型
const getFieldTypeTagType = (type: string) => {
  switch (type) {
    case '指标':
      return 'success'
    case '维度':
      return 'primary'
    case '衍生指标':
      return 'warning'
    case '衍生维度':
      return 'warning'
    default:
      return 'info'
  }
}

// 判断字段是否已添加
const isFieldAdded = (fieldId: number) => {
  return selectedColumns.value.some(column => column.fieldId === fieldId)
}

// 根据表ID获取表名称
const getTableById = (tableId: number) => {
  const table = coreTables.value.find(t => t.id === tableId)
  return table ? table.name : '未知表'
}

// 增加衍生指标
const addDerivedMetric = () => {
  ElMessageBox.prompt('请输入衍生指标名称', '增加衍生指标', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    if (value) {
      // 添加衍生指标到字段列表
      const newField = {
        id: Date.now(), // 使用时间戳作为唯一ID
        name: value,
        type: '衍生指标',
        tableId: parseInt(selectedCoreTable.value)
      }
      
      allFields.value.push(newField)
      ElMessage.success('衍生指标添加成功')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 增加衍生维度
const addDerivedDimension = () => {
  ElMessageBox.prompt('请输入衍生维度名称', '增加衍生维度', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    if (value) {
      // 添加衍生维度到字段列表
      const newField = {
        id: Date.now() + 1, // 使用时间戳作为唯一ID，避免冲突
        name: value,
        type: '衍生维度',
        tableId: parseInt(selectedCoreTable.value)
      }
      
      allFields.value.push(newField)
      ElMessage.success('衍生维度添加成功')
    }
  }).catch(() => {
    // 用户取消
  })
}



// 清空所有字段
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
    updateResultTable()
    ElMessage.success('已清空所有字段')
  }).catch(() => {
    // 用户取消操作
  })
}



// 处理列顺序变更
const handleColumnOrderChange = () => {
  // 实现列拖拽排序逻辑
  console.log('列顺序发生变更')
}

// 处理字段拖拽结束事件
const onFieldDragEnd = () => {
  // 重新初始化表格列的拖拽功能
  nextTick(() => {
    initColumnDrag()
  })
  console.log('字段拖拽结束，顺序已更新')
}

// 表格列拖拽排序
const initColumnDrag = () => {
  nextTick(() => {
    const el = document.querySelector('.result-table .el-table__header-wrapper tr')
    if (!el) return
    
    Sortable.create(el, {
      animation: 150,
      ghostClass: 'sortable-ghost', // 拖拽时的占位符样式
      chosenClass: 'sortable-chosen', // 被选中项的样式
      dragClass: 'sortable-drag', // 正在拖拽项的样式
      onChoose: (evt) => {
        // 当元素被选中准备拖拽时
        console.log('开始拖拽表格列')
      },
      onEnd: (evt) => {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        
        if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
          // 更新selectedColumns数组中列的顺序
          const movedItem = selectedColumns.value.splice(oldIndex, 1)[0]
          selectedColumns.value.splice(newIndex, 0, movedItem)
          
          // 重新渲染表格
          nextTick(() => {
            // 触发表格重新渲染
            console.log('表格列顺序已更新')
            // 重新初始化已选择字段区域的拖拽功能
            initSelectedFieldsDrag()
          })
        }
      }
    })
    
    
  })
}

// 已选择字段区域拖拽排序 - 使用Vue.draggable组件实现
const initSelectedFieldsDrag = () => {
  // 不再需要实现，因为已使用Vue.draggable组件
  console.log('使用Vue.draggable组件实现拖拽')
}

// 获取拖拽元素应该放置的位置


// 保存设计
const handleSave = () => {
  if (!basicInfoForm.value.name) {
    ElMessage.error('请输入报表名称')
    return
  }
  
  if (selectedColumns.value.length === 0) {
    ElMessage.error('请至少选择一个字段')
    return
  }
  
  // 判断是新建还是编辑模式
  if (reportId.value && reportId.value !== 'new') {
    // 编辑模式
    ElMessage.success(`报表 ${basicInfoForm.value.name} 编辑成功`)
    // 更新localStorage中的数据
    const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
    const index = savedReports.findIndex((item: any) => item.id === parseInt(reportId.value))
    if (index !== -1) {
      savedReports[index] = {
        ...savedReports[index],
        name: basicInfoForm.value.name,
        alias: basicInfoForm.value.alias,
        description: basicInfoForm.value.description,
        selectedColumns: selectedColumns.value, // 保存已选择的字段
        modifier: '当前用户',
        modifyTime: new Date().toLocaleString()
      }
      localStorage.setItem('indicatorThemeReports', JSON.stringify(savedReports))
    }
  } else {
    // 新建模式
    ElMessage.success(`报表 ${basicInfoForm.value.name} 创建成功`)
    
    // 生成新的ID
    const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
    const newId = savedReports.length > 0 ? Math.max(...savedReports.map((item: any) => item.id)) + 1 : 1
    
    // 创建新报表对象
    const newReport = {
      id: newId,
      name: basicInfoForm.value.name,
      alias: basicInfoForm.value.alias,
      description: basicInfoForm.value.description,
      selectedColumns: selectedColumns.value, // 保存已选择的字段
      creator: '当前用户',
      createTime: new Date().toLocaleString(),
      modifier: '当前用户',
      modifyTime: new Date().toLocaleString()
    }
    
    // 添加到localStorage
    savedReports.push(newReport)
    localStorage.setItem('indicatorThemeReports', JSON.stringify(savedReports))
  }
  
  // 保存完成后跳转到列表页面
  router.push('/indicator-theme-design')
}

// 提交设计
const handleSubmit = () => {
  if (!basicInfoForm.value.name) {
    ElMessage.error('请输入报表名称')
    return
  }
  
  if (selectedColumns.value.length === 0) {
    ElMessage.error('请至少选择一个字段')
    return
  }
  
  ElMessage.success('提交成功')
}

// 关闭弹窗
const handleClose = () => {
  ElMessageBox.confirm('确定要关闭页面吗？未保存的内容将会丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 关闭弹窗
    router.go(-1)
  }).catch(() => {
    // 用户取消关闭
  })
}

// 组件挂载时的操作
onMounted(() => {
  // 获取路由参数
  reportId.value = route.params.id as string
  
  // 如果是编辑模式，加载报表数据
  if (reportId.value && reportId.value !== 'new') {
    loadReportData(reportId.value)
  } else {
    // 新建模式下设置默认核心主题表和默认字段
    // 默认选择第一个核心主题表（销售明细表）
    selectedCoreTable.value = '1'
    
    // 设置默认字段（来自销售明细表的默认字段）
    selectedColumns.value = [
      { 
        fieldId: 1, 
        prop: 'order_id', 
        label: '订单ID', 
        width: 150, 
        type: '维度', 
        tableId: 1 
      },
      { 
        fieldId: 4, 
        prop: 'sales_amount', 
        label: '销售金额', 
        width: 150, 
        type: '指标', 
        tableId: 1 
      }
    ]
  }
})

// 加载报表数据
const loadReportData = (id: string) => {
  // 从localStorage加载报表数据
  const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
  const report = savedReports.find((item: any) => item.id === parseInt(id))
  
  if (report) {
    // 设置基本信息
    basicInfoForm.value = {
      name: report.name,
      alias: report.alias,
      description: report.description
    }
    
    // 设置已选择的字段
    if (report.selectedColumns) {
      selectedColumns.value = report.selectedColumns
    } else {
      // 如果没有保存的字段，则使用默认字段
      selectedColumns.value = [
        { 
          fieldId: 1, 
          prop: 'order_id', 
          label: '订单编号', 
          width: 150, 
          type: '维度', 
          tableId: 1 
        },
        { 
          fieldId: 4, 
          prop: 'sales_amount', 
          label: '销售金额', 
          width: 150, 
          type: '指标', 
          tableId: 1 
        }
      ]
    }
  } else {
    // 如果localStorage中没有找到报表，则使用模拟数据
    // 模拟从IndicatorThemeList.vue获取的报表数据
    const reportDataMap: any = {
      '1': {
        name: '销售业绩汇总表',
        alias: 'sales_summary',
        description: '展示各区域销售业绩情况'
      },
      '2': {
        name: '用户活跃度分析表',
        alias: 'user_activity',
        description: '分析用户活跃度变化趋势'
      },
      '3': {
        name: '产品销量排行表',
        alias: 'product_ranking',
        description: '展示各产品销量排行榜'
      }
    }
    
    // 设置基本信息
    const reportInfo = reportDataMap[id] || {
      name: `报表_${id}`,
      alias: `report_${id}`,
      description: `这是ID为${id}的报表`
    }
    
    basicInfoForm.value = {
      name: reportInfo.name,
      alias: reportInfo.alias,
      description: reportInfo.description
    }
    
    // 模拟已选择的字段（根据报表ID设置不同的字段）
    if (id === '1') {
      selectedColumns.value = [
        { 
          fieldId: 1, 
          prop: 'region', 
          label: '区域', 
          width: 150, 
          type: '维度', 
          tableId: 1 
        },
        { 
          fieldId: 4, 
          prop: 'sales_amount', 
          label: '销售金额', 
          width: 150, 
          type: '指标', 
          tableId: 1 
        }
      ]
    } else if (id === '2') {
      selectedColumns.value = [
        { 
          fieldId: 8, 
          prop: 'user_id', 
          label: '用户ID', 
          width: 150, 
          type: '维度', 
          tableId: 2 
        },
        { 
          fieldId: 10, 
          prop: 'page_views', 
          label: '页面浏览量', 
          width: 150, 
          type: '指标', 
          tableId: 2 
        }
      ]
    } else if (id === '3') {
      selectedColumns.value = [
        { 
          fieldId: 3, 
          prop: 'product_name', 
          label: '产品名称', 
          width: 150, 
          type: '维度', 
          tableId: 1 
        },
        { 
          fieldId: 5, 
          prop: 'sales_quantity', 
          label: '销售数量', 
          width: 150, 
          type: '指标', 
          tableId: 1 
        }
      ]
    } else {
      // 默认字段
      selectedColumns.value = [
        { 
          fieldId: 1, 
          prop: 'order_id', 
          label: '订单编号', 
          width: 150, 
          type: '维度', 
          tableId: 1 
        },
        { 
          fieldId: 4, 
          prop: 'sales_amount', 
          label: '销售金额', 
          width: 150, 
          type: '指标', 
          tableId: 1 
        }
      ]
    }
  }
  
  // 初始化表格列拖拽功能
  initColumnDrag()
  
  ElMessage.success('报表数据加载成功')
}
</script>

<style scoped>
  .indicator-theme-design {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }
  
  .design-header {
    background: white;
    padding: 0 24px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
  
  .design-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
  
  .design-content {
    display: flex;
    width: 100%;
    height: 100%;
    background: white;
    overflow: hidden;
    flex-direction: column;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    padding: 20px;
    gap: 20px;
    overflow: hidden;
  }
  
  .result-area {
    flex: 3;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 6px;
    border: 1px solid #ebeef5;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    background-color: #fafafa;
  }
  
  .result-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .result-actions {
    display: flex;
    gap: 10px;
  }
  
  .result-table {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .result-summary {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
    background-color: #fafafa;
    font-size: 14px;
    color: #606266;
  }
  
  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none; /* 防止拖拽时选择文本 */
  }
  
  .column-actions {
    display: flex;
    gap: 8px;
  }
  
  
  
  /* 拖拽时表格列的样式 */
  .column-header.sortable-chosen {
    background-color: #e6f0ff;
    border-radius: 3px;
  }
  
  .sortable-drag .column-header {
    background-color: #409eff;
    color: white;
    border-radius: 3px;
  }
  
  .sortable-drag .move-icon {
    color: white;
    background-color: #409eff;
  }
  
  .edit-icon, .delete-icon {
    cursor: pointer;
    color: #909399;
  }
  
  .edit-icon:hover {
    color: #409eff;
  }
  
  .delete-icon:hover {
    color: #f56c6c;
  }
  
  /* 右侧容器样式 */
  .right-container {
    flex: 2;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    min-width: 320px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
  
  /* 已选择字段区域样式调整 */
  .selected-fields-area {
    flex: 1;
    min-width: 250px;
    border: none;
    border-radius: 8px 0 0 8px;
    display: flex;
    flex-direction: column;
    background: white;
    box-shadow: none;
    overflow: hidden;
  }
  
  /* 报表信息区域样式调整 */
  .info-field-area {
    flex: 3;
    background: white;
    border: none;
    border-radius: 0 8px 8px 0;
    border-left: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: none;
  }
  
  .selected-fields-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #f5f7fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .selected-fields-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
  
  .clear-all-btn {
    margin-left: 10px;
  }
  
  .selected-fields-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .selected-field-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background-color: #fafafa;
    transition: all 0.3s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    cursor: grab; /* 显示拖拽光标 */
    user-select: none; /* 防止拖拽时选择文本 */
    position: relative;
    overflow: hidden;
    transform: translateZ(0); /* 启用硬件加速 */
  }
  
  .selected-field-item:hover {
    border-color: #409eff;
    background-color: #f0f5ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  /* 拖拽时的样式 */
  .selected-field-item:active {
    cursor: grabbing;
  }
  
  /* 拖拽时的动画效果 */
  .selected-field-item.sortable-chosen {
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
  
  .selected-field-item.sortable-drag {
    transform: rotate(2deg);
    opacity: 0.95;
    background: linear-gradient(135deg, #f0f5ff, #e6f0ff);
    border: 2px dashed #409eff;
    border-radius: 8px;
    box-shadow: 0 12px 24px rgba(64, 158, 255, 0.5);
    z-index: 1000;
  }
  
  /* SortableJS 拖拽相关样式 */
  .sortable-ghost {
    opacity: 0.6;
    background-color: #409eff !important;
    border-color: #409eff !important;
  }
  
  .sortable-chosen {
    background-color: #e6f0ff !important;
    border-color: #409eff !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
  
  .sortable-drag {
    box-shadow: 0 12px 24px rgba(64, 158, 255, 0.5) !important;
    transform: rotate(2deg) !important;
    z-index: 1000;
    opacity: 0.95;
    background: linear-gradient(135deg, #f0f5ff, #e6f0ff) !important;
    border: 2px dashed #409eff !important;
    border-radius: 8px !important;
    cursor: grabbing !important;
  }
  
  .sortable-fallback {
    box-shadow: 0 12px 24px rgba(64, 158, 255, 0.5) !important;
    transform: rotate(2deg) !important;
    z-index: 1000;
    opacity: 0.95;
    background: linear-gradient(135deg, #f0f5ff, #e6f0ff) !important;
    border: 2px dashed #409eff !important;
    border-radius: 8px !important;
    cursor: grabbing !important;
  }
  
  .sortable-ghost .field-name,
  .sortable-ghost .field-details {
    color: white !important;
  }
  
  /* 拖拽时的占位符样式 */
  .sortable-ghost .field-info {
    visibility: hidden;
  }
  
  .sortable-ghost::before {
    content: "拖拽到这里";
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #409eff;
    font-weight: 500;
    font-size: 14px;
  }
  
  .field-info {
    flex: 1;
  }
  
  .field-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
    cursor: grab;
    user-select: none;
  }
  
  .field-name:active {
    cursor: grabbing;
  }
  
  .field-details {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .source-table {
    font-size: 12px;
    color: #909399;
  }
  
  .field-actions {
    margin-left: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .no-fields {
    text-align: center;
    color: #909399;
    font-size: 14px;
    padding: 24px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .info-field-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .info-field-tabs :deep(.el-tabs__header) {
    padding: 0 20px;
    margin-bottom: 0;
  }
  
  .info-field-tabs :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
  
  .field-search {
    margin-bottom: 16px;
  }
  
  /* 新增的统一容器样式 */
  .field-search-list-container {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  
  .field-search-wrapper {
    padding: 12px;
    border-bottom: 1px solid #ebeef5;
    background-color: #f5f7fa;
  }
  
  .field-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px; /* 限制最大高度，使其可滚动 */
  }
  
  .field-item {
    padding: 12px 16px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .field-item:hover {
    border-color: #409eff;
    background-color: #ecf5ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  }
  
  .field-item-added {
    background-color: #f0f9eb;
    border-color: #d1edc4;
  }
  
  .field-item-added:hover {
    background-color: #e1f3d8;
    border-color: #b3e19d;
  }
  
  .field-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .field-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    flex: 1;
  }
  
  .field-type {
    margin-top: 0;
  }
  
  .add-derived-field {
    text-align: center;
    padding: 10px 0;
  }
  
  /* 响应式设计 */
  @media (max-width: 1200px) {
    .main-content {
      flex-direction: column;
    }
    
    .right-container {
      width: 100%;
    }
  }
</style>