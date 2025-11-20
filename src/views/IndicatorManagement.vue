<template>
  <div class="indicator-management">
    <!-- 左侧表清单 -->
    <div class="table-list-aside">
      <div class="table-list-wrapper">
        <div class="search-container">
          <div class="search-with-button">
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
            <el-button 
              type="primary" 
              @click="openAddFactTableDialog"
              class="add-fact-table-btn"
            >
              <el-icon><Plus /></el-icon>
              添加事实表
            </el-button>
          </div>
        </div>
        
        <div class="table-list-container">
          <div 
            v-for="table in filteredTableList" 
            :key="table.id"
            class="table-item"
            :class="{ 
              active: tableInfo?.id === table.id,
              'no-indicators': !table.hasIndicators
            }"
            @click="handleTableSelect(table)"
          >
            <div class="table-title-container">
              <div class="table-title-wrapper">
                <div class="table-name">{{ table.name }}</div>
                <div class="table-description">{{ table.description }}</div>
              </div>
              <div class="spacer"></div>
              <el-tag 
                v-if="!table.hasIndicators" 
                class="no-indicators-tag" 
                size="small" 
                type="info"
              >
                无指标
              </el-tag>
              <el-tag v-else-if="table.viewType" class="view-type-tag" size="small">
                {{ table.viewType }}
              </el-tag>
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
                {{ tableInfo.viewType === 'physical' ? '结果集-物理表' : '结果集-视图' }}
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
                      <el-button type="primary" @click="createNewField">创建衍生指标</el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 字段清单 -->
              <div class="field-table-container">
                <el-table :data="filteredFieldData" class="field-table" border>
                  <el-table-column prop="displayName" label="列名" width="150" />
                  <el-table-column prop="fieldName" label="字段名称" width="180" />
                  <el-table-column prop="type" label="列类型" width="120">
                    <template #default="scope">
                      <el-tag 
                        v-if="scope.row.type"
                        :type="scope.row.type === 'native_indicator' ? 'success' : 
                               scope.row.type === 'dimension' ? 'primary' : 'info'"
                      >
                        {{ 
                          scope.row.type === 'native_indicator' ? '原生指标' :
                          scope.row.type === 'dimension' ? '维度' : '未设置'
                        }}
                      </el-tag>
                      <span v-else class="empty-type">未设置</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="描述" />
                  <el-table-column label="操作" width="120" fixed="right">
                    <template #default="scope">
                      <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <!-- 字段汇总信息 - 使用tag标签显示，颜色与列类型保持一致 -->
              <div class="field-summary-container">
                <div class="summary-content">
                  <span class="summary-label">字段统计：</span>
                  <el-tag type="info" size="large">
                    总字段数：{{ fieldSummary.total }}
                  </el-tag>
                  <el-tag type="primary" size="large">
                    维度数：{{ fieldSummary.dimensions }}
                  </el-tag>
                  <el-tag type="success" size="large">
                    原生指标：{{ fieldSummary.nativeIndicators }}
                  </el-tag>
                  <el-tag type="warning" size="large">
                    衍生指标：{{ fieldSummary.derivedIndicators }}
                  </el-tag>
                </div>
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
                  {{ tableInfo.viewType === 'physical' ? '结果集-物理表' : '结果集-视图' }}
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
            <div class="reference-data-header" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div class="reference-data-controls" style="display: flex; align-items: center; gap: 12px;">
                <el-button type="primary" @click="refreshReferenceData" size="small">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <span style="font-size: 14px; color: #606266;">显示数据量：</span>
                <el-select v-model="referenceDataLimit" @change="handleReferenceDataLimitChange" size="small" style="width: 100px;">
                  <el-option label="20条" :value="20" />
                  <el-option label="50条" :value="50" />
                  <el-option label="100条" :value="100" />
                </el-select>
              </div>
              <div class="reference-data-info" style="font-size: 14px; color: #909399;">
                当前显示：{{ filteredReferenceData.length }} 条数据
              </div>
            </div>
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
          
          <!-- 指标信息 Tab -->
          <el-tab-pane label="指标信息">
            <div class="indicator-info-content">
              <el-table :data="relatedIndicators" border>
                <el-table-column prop="name" label="指标名" width="150" />
                <el-table-column prop="type" label="指标类型" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.type === 'native' ? 'primary' : 'success'">
                      {{ scope.row.type === 'native' ? '原生指标' : '衍生指标' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="指标描述" />
                <el-table-column prop="formula" label="公式" width="350">
                  <template #default="scope">
                    <div class="formulas-cell">
                      <div v-if="scope.row.formula">
                        <div class="formula-item">
                          <div class="formula-header">
                            <el-tag 
                              :type="scope.row.type === 'native' ? 'success' : 'warning'" 
                              size="small"
                            >
                              {{ scope.row.type === 'native' ? '原生' : '衍生' }}
                            </el-tag>
                            <!-- 显示已使用的事实表 -->
                            <div v-if="scope.row.formula" class="fact-tables-section">
                              <div class="fact-tables-label">已使用：</div>
                              <div class="fact-tables-container">
                                <el-tag 
                                  v-for="table in extractFactTablesFromFormula(scope.row.formula)" 
                                  :key="table"
                                  type="info"
                                  size="small"
                                  class="fact-table-tag"
                                >
                                  {{ table }}
                                </el-tag>
                                <span v-if="extractFactTablesFromFormula(scope.row.formula).length === 0" class="no-fact-tables">
                                  未引用事实表
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="formula-content">{{ formatFormulaContent(scope.row.formula) || '暂无内容' }}</div>
                        </div>
                      </div>
                      <div v-else class="no-formulas">
                        暂无公式
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="owner" label="负责人" width="120" />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="scope">
                    <el-button size="small" @click="openIndicatorEditDialog(scope.row)">编辑</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 指标汇总信息 -->
              <div class="indicator-summary-container" style="margin-top: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px;">
                <span class="summary-label" style="margin-right: 16px; font-weight: 500;">指标统计：</span>
                <el-tag type="info" size="large">总指标数：{{ indicatorSummary.total }}</el-tag>
                <el-tag type="primary" size="large" style="margin-left: 8px;">原生指标：{{ indicatorSummary.nativeCount }}</el-tag>
                <el-tag type="success" size="large" style="margin-left: 8px;">衍生指标：{{ indicatorSummary.derivedCount }}</el-tag>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editDialogTitle"
      width="600px"
      append-to-body
    >
          <el-form 
            :model="currentField" 
            :rules="fieldFormRules" 
            ref="fieldForm" 
            label-width="100px"
          >
            <el-form-item label="列名" prop="displayName">
              <el-input v-model="currentField.displayName" />
            </el-form-item>
            <el-form-item label="字段名称" prop="fieldName">
              <el-input v-model="currentField.fieldName" :disabled="isEditing" />
            </el-form-item>
            <el-form-item label="列类型" prop="type">
              <el-select v-model="currentField.type" placeholder="请选择" @change="handleFieldTypeChange" clearable :disabled="currentField.type === 'derived_indicator'">
                <el-option label="不选择" value="" />
                <el-option label="原生指标" value="native_indicator" />
                <el-option label="维度" value="dimension" />
              </el-select>
              <div v-if="currentField.type === 'derived_indicator'" style="color: #909399; font-size: 12px; margin-top: 5px;">
                衍生指标类型只能通过"创建衍生指标"功能设置
              </div>
            </el-form-item>
            
            <el-form-item v-if="currentField.type === 'derived_indicator'" label="多公式管理">
              <MultiFormulaDisplay 
                :formula="currentField.formula" 
                @update:formula="(val) => currentField.formula = val"
                :current-fact-table="selectedTable"
              />
            </el-form-item>
            
            <el-form-item label="数据类型" prop="dataType">
              <el-input v-model="currentField.dataType" disabled />
            </el-form-item>
            <el-form-item v-if="currentField.type !== 'derived_indicator'" label="来源" prop="source">
              <el-input v-model="currentField.source" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="currentField.description" type="textarea" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="editDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="saveField">保存</el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 指标编辑对话框 -->
        <el-dialog
          :title="indicatorEditDialogTitle"
          v-model="indicatorEditDialogVisible"
          width="600px"
          @close="handleIndicatorDialogClose"
          append-to-body
        >
          <el-form
            ref="indicatorFormRef"
            :model="currentIndicator"
            :rules="indicatorFormRules"
            label-width="100px"
          >
            <el-form-item label="指标名称" prop="name">
              <el-input v-model="currentIndicator.name" :disabled="isEditingIndicator" />
            </el-form-item>
            
            <el-form-item label="指标类型" prop="type">
              <el-tag :type="currentIndicator.type === 'native' ? 'primary' : 'success'" disabled>
                {{ currentIndicator.type === 'native' ? '原生指标' : '衍生指标' }}
              </el-tag>
            </el-form-item>
            
            <el-form-item label="指标描述" prop="description">
              <el-input v-model="currentIndicator.description" type="textarea" />
            </el-form-item>
            
            <!-- 原生指标编辑区域 -->
            <div v-if="currentIndicator.type === 'native'">
              <el-form-item label="关联字段" prop="formula">
                <el-input v-model="currentIndicator.formula" disabled />
              </el-form-item>
            </div>
            
            <!-- 衍生指标编辑区域 -->
            <div v-else>
              <el-form-item label="公式" prop="formula">
                <MultiFormulaDisplay v-model="currentIndicator.formula" />
              </el-form-item>
            </div>
            
            <el-form-item label="负责人" prop="owner">
              <el-input v-model="currentIndicator.owner" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="indicatorEditDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="saveIndicatorForDialog">保存</el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 添加事实表对话框 -->
        <el-dialog
          v-model="addFactTableDialogVisible"
          title="添加事实表"
          width="800px"
        >
          <div class="add-fact-table-dialog">
            <!-- 过滤条件区域 -->
            <div class="filter-section">
              <div class="filter-row">
                <div class="filter-item">
                  <span class="filter-label">表类型：</span>
                  <el-select 
                    v-model="filterTableType" 
                    placeholder="全部类型" 
                    clearable
                    @change="handleFilterChange"
                  >
                    <el-option label="结果集-视图" value="result_set_view" />
                    <el-option label="结果集-物理表" value="result_set_table" />
                    <el-option label="基表" value="base_table" />
                  </el-select>
                </div>
                <div class="filter-item">
                  <span class="filter-label">搜索表名：</span>
                  <el-input
                    v-model="filterTableName"
                    placeholder="输入表名关键词"
                    clearable
                    @input="handleFilterChange"
                    style="width: 200px"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                </div>
              </div>
            </div>
            
            <!-- 表选择区域 -->
            <div class="table-selection-section">
              <h4>选择表</h4>
              <el-table
                :data="filteredTables"
                border
                style="width: 100%"
                @selection-change="handleTableSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="表名" width="200" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag 
                      :type="row.type === 'result_set_view' ? 'success' : row.type === 'result_set_table' ? 'warning' : 'primary'"
                    >
                      {{ row.type === 'result_set_view' ? '结果集-视图' : row.type === 'result_set_table' ? '结果集-物理表' : '基表' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="owner" label="负责人" width="120" />
              </el-table>
            </div>
            
            <!-- 表信息预览 -->
            <div v-if="selectedTableForPreview" class="table-preview-section">
              <h4>表信息预览</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="表名">{{ selectedTableForPreview.name }}</el-descriptions-item>
                <el-descriptions-item label="描述">{{ selectedTableForPreview.description }}</el-descriptions-item>
                <el-descriptions-item label="类型">
                  <el-tag 
                    :type="selectedTableForPreview.type === 'result_set_view' ? 'success' : selectedTableForPreview.type === 'result_set_table' ? 'warning' : 'primary'"
                  >
                    {{ selectedTableForPreview.type === 'result_set_view' ? '结果集-视图' : selectedTableForPreview.type === 'result_set_table' ? '结果集-物理表' : '基表' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="负责人">{{ selectedTableForPreview.owner }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ selectedTableForPreview.createTime }}</el-descriptions-item>
                <el-descriptions-item label="字段数量">{{ selectedTableForPreview.fieldCount }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="addFactTableDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="confirmAddFactTable"
                :disabled="!selectedTables.length"
              >
                确认添加
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, CirclePlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SimpleIndicatorEditDialog from '@/components/SimpleIndicatorEditDialog.vue'
import IndicatorEditDialog from '@/components/IndicatorEditDialog.vue'
import FormulaPopupEditor from '@/components/FormulaPopupEditor.vue';
import MultiFormulaDisplay from '@/components/MultiFormulaDisplay.vue';

// 获取路由实例
const router = useRouter()

// 搜索关键词
const searchKeyword = ref('')

// 表清单数据 - 根据字段信息动态判断是否有指标
const tableList = ref([
  { 
    id: 1, 
    name: 'sales_detail', 
    description: '销售明细表', 
    hasIndicators: true // 有原生指标字段：销售金额、订单数量、折扣金额
  },
  { 
    id: 2, 
    name: 'user_behavior', 
    description: '用户行为表', 
    hasIndicators: true // 有衍生指标字段：平均客单价
  },
  { 
    id: 3, 
    name: 'product_info', 
    description: '产品信息表', 
    hasIndicators: false // 新添加的表，字段类型都为空
  },
  { 
    id: 4, 
    name: 'order_summary', 
    description: '订单汇总表', 
    hasIndicators: true // 有原生指标和衍生指标
  },
  { 
    id: 5, 
    name: 'customer_profile', 
    description: '客户画像表', 
    hasIndicators: false // 只有维度字段，没有指标字段
  }
])

// 动态更新表是否有指标的状态
const updateTableIndicatorsStatus = () => {
  tableList.value.forEach(table => {
    const tableFields = fieldData.value[table.name] || []
    // 判断表中是否有指标字段（原生指标或衍生指标）
    const hasIndicators = tableFields.some(field => 
      field.type === 'native_indicator' || field.type === 'derived_indicator'
    )
    table.hasIndicators = hasIndicators
  })
}

// 过滤后的表清单 - 按是否有指标分类排序
const filteredTableList = computed(() => {
  let filteredTables = tableList.value
  
  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    filteredTables = filteredTables.filter(table => 
      table.name.includes(searchKeyword.value) || 
      table.description.includes(searchKeyword.value)
    )
  }
  
  // 按是否有指标排序：有指标的表在前，没有指标的表在后
  return filteredTables.sort((a, b) => {
    if (a.hasIndicators && !b.hasIndicators) return -1
    if (!a.hasIndicators && b.hasIndicators) return 1
    return 0
  })
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
  { value: 'native_indicator', label: '原生指标' },
  { value: 'derived_indicator', label: '衍生指标' },
  { value: 'dimension', label: '维度' }
])

// 字段筛选
const fieldFilter = ref(['native_indicator', 'derived_indicator', 'dimension', 'derived_dimension', ''])

// 字段数据 - 按表分类
const fieldData = ref({
  // sales_detail表 - 有原生指标
  sales_detail: [
    { id: 1, displayName: '订单ID', fieldName: 'order_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '订单系统', description: '唯一标识一个订单' },
    { id: 2, displayName: '客户ID', fieldName: 'customer_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '客户系统', description: '唯一标识一个客户' },
    { id: 3, displayName: '产品ID', fieldName: 'product_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '产品系统', description: '唯一标识一个产品' },
    { id: 4, displayName: '销售金额', fieldName: 'sales_amount', type: 'native_indicator', dataType: 'DECIMAL(10,2)', source: '订单系统', description: '订单的实际销售金额' },
    { id: 5, displayName: '订单数量', fieldName: 'order_quantity', type: 'native_indicator', dataType: 'INT', source: '订单系统', description: '订单中产品的数量' },
    { id: 6, displayName: '折扣金额', fieldName: 'discount_amount', type: 'native_indicator', dataType: 'DECIMAL(10,2)', source: '订单系统', description: '订单的折扣金额' }
  ],
  // user_behavior表 - 有衍生指标
  user_behavior: [
    { id: 7, displayName: '用户ID', fieldName: 'user_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '用户系统', description: '唯一标识一个用户' },
    { id: 8, displayName: '行为类型', fieldName: 'behavior_type', type: 'dimension', dataType: 'VARCHAR(20)', source: '行为日志', description: '用户行为类型' },
    { id: 9, displayName: '平均客单价', fieldName: 'avg_customer_value', type: 'derived_indicator', dataType: 'DECIMAL(10,2)', source: '计算字段', description: '客户平均消费金额' }
  ],
  // product_info表 - 新添加的表，字段类型都为空
  product_info: [
    { id: 10, displayName: '产品ID', fieldName: 'product_id', type: '', dataType: 'VARCHAR(32)', source: '产品系统', description: '唯一标识一个产品' },
    { id: 11, displayName: '产品名称', fieldName: 'product_name', type: '', dataType: 'VARCHAR(100)', source: '产品系统', description: '产品名称' },
    { id: 12, displayName: '产品分类', fieldName: 'category', type: '', dataType: 'VARCHAR(50)', source: '产品系统', description: '产品分类' }
  ],
  // order_summary表 - 有原生指标和衍生指标
  order_summary: [
    { id: 13, displayName: '订单ID', fieldName: 'order_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '订单系统', description: '唯一标识一个订单' },
    { id: 14, displayName: '总销售额', fieldName: 'total_sales', type: 'native_indicator', dataType: 'DECIMAL(10,2)', source: '订单系统', description: '订单总销售额' },
    { id: 15, displayName: '平均订单金额', fieldName: 'avg_order_value', type: 'derived_indicator', dataType: 'DECIMAL(10,2)', source: '计算字段', description: '平均每个订单的金额' }
  ],
  // customer_profile表 - 只有维度字段
  customer_profile: [
    { id: 16, displayName: '客户ID', fieldName: 'customer_id', type: 'dimension', dataType: 'VARCHAR(32)', source: '客户系统', description: '唯一标识一个客户' },
    { id: 17, displayName: '客户姓名', fieldName: 'customer_name', type: 'dimension', dataType: 'VARCHAR(50)', source: '客户系统', description: '客户姓名' },
    { id: 18, displayName: '客户等级', fieldName: 'customer_level', type: 'derived_dimension', dataType: 'VARCHAR(20)', source: '客户画像', description: '根据客户消费行为计算的等级' }
  ]
})

// 初始化时更新表状态
updateTableIndicatorsStatus()

// 计算筛选后的字段数据
const filteredFieldData = computed(() => {
  if (!selectedTable.value) {
    return []
  }
  
  const tableFields = fieldData.value[selectedTable.value.name] || []
  
  if (fieldFilter.value.length === 0) {
    return tableFields
  }
  
  return tableFields.filter(field => 
    fieldFilter.value.includes(field.type)
  )
})

// 计算字段汇总信息
const fieldSummary = computed(() => {
  if (!selectedTable.value) {
    return {
      total: 0,
      dimensions: 0,
      nativeIndicators: 0,
      derivedIndicators: 0
    }
  }
  
  const tableFields = fieldData.value[selectedTable.value.name] || []
  
  return {
    total: tableFields.length,
    dimensions: tableFields.filter(field => field.type === 'dimension' || field.type === 'derived_dimension').length,
    nativeIndicators: tableFields.filter(field => field.type === 'native_indicator').length,
    derivedIndicators: tableFields.filter(field => field.type === 'derived_indicator').length
  }
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

// 参考数据相关变量
const referenceDataLimit = ref(20)

// 计算筛选后的参考数据，根据选择的数据量显示
const filteredReferenceData = computed(() => {
  return referenceData.value.slice(0, referenceDataLimit.value)
})

// 刷新参考数据
const refreshReferenceData = () => {
  ElMessage.success('参考数据已刷新')
}

// 处理参考数据量变化
const handleReferenceDataLimitChange = (limit: number) => {
  referenceDataLimit.value = limit
}

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

// 编辑对话框相关
const editDialogVisible = ref(false)
const editDialogTitle = ref('')
const isEditing = ref(false)
const fieldForm = ref()

// 当前编辑的字段
const currentField = ref({
  displayName: '',
  fieldName: '',
  type: 'indicator',
  dataType: '',
  source: '',
  description: '',
  formula: ''
})

// 指标编辑对话框相关
const indicatorEditDialogVisible = ref(false)
const indicatorEditDialogTitle = ref('')
const isEditingIndicator = ref(false)
const indicatorFormRef = ref()

// 当前编辑的指标
const currentIndicator = ref({
  id: 0,
  name: '',
  type: 'native', // 添加类型字段
  description: '',
  formula: '', // 保留公式字段
  fieldId: null,
  owner: ''
})

// 添加事实表相关变量
const addFactTableDialogVisible = ref(false)
const filterTableType = ref('')
const filterTableName = ref('')
const availableTables = ref([])
const filteredTables = ref([])
const selectedTables = ref([])
const selectedTableForPreview = ref(null)

// 字段表单验证规则
const fieldFormRules = {
  displayName: [{ required: true, message: '请输入字段别名', trigger: 'blur' }],
  fieldName: [{ required: true, message: '请输入字段名称', trigger: 'blur' }],
  type: [{ required: false, message: '请选择列类型', trigger: 'change' }],
  source: [{ required: false, message: '请输入来源', trigger: 'blur' }],
  description: [{ required: false, message: '请输入描述', trigger: 'blur' }]
}

// 指标表单验证规则
const indicatorFormRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入指标描述', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

// 创建新字段方法
const createNewField = () => {
  // 检查是否已选择事实表
  if (!selectedTable.value) {
    ElMessage.warning('请先选择一个事实表，然后再创建衍生指标')
    return
  }
  
  editDialogVisible.value = true
  editDialogTitle.value = '创建衍生指标'
  currentField.value = {
    displayName: '',
    fieldName: '',
    type: 'derived_indicator', // 默认设置为衍生指标
    dataType: '',
    source: '', // 衍生指标不需要来源字段
    description: '', // 描述字段选填
    formula: '',
    // 设置字段所属的表信息
    tableName: selectedTable.value.name,
    tableDescription: selectedTable.value.description
  }
  isEditing.value = false
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

// 打开编辑对话框
const openEditDialog = (field: any) => {
  // 直接打开字段编辑对话框，允许用户调整字段类型
  openFieldEditDialog(field)
}

// 打开字段编辑对话框
const openFieldEditDialog = (field: any) => {
  // 设置为编辑模式
  editDialogTitle.value = '编辑字段'
  isEditing.value = true
  
  // 填充表单数据，对于非衍生指标字段，移除来源字段
  const fieldData = { ...field }
  if (fieldData.type !== 'derived_indicator') {
    fieldData.source = '' // 非衍生指标字段也不显示来源
  }
  
  Object.assign(currentField.value, fieldData)
  
  // 显示对话框
  editDialogVisible.value = true
}

// 保存字段
const saveField = () => {
  fieldForm.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 编辑逻辑 - 在实际应用中应该更新后端数据
        let found = false
        let oldField = null
        
        // 遍历所有表的字段数据，查找要编辑的字段
        for (const tableName in fieldData.value) {
          const tableFields = fieldData.value[tableName]
          const index = tableFields.findIndex(item => item.fieldName === currentField.value.fieldName)
          if (index !== -1) {
            oldField = tableFields[index]
            const newField = { ...currentField.value }
            
            // 更新字段数据
            tableFields[index] = newField
            ElMessage.success('字段更新成功')
            
            // 同步指标信息：检查字段类型变化
            syncIndicatorData(oldField, newField)
            
            // 更新表状态
            updateTableIndicatorsStatus()
            found = true
            break
          }
        }
        
        if (!found) {
          ElMessage.error('未找到要编辑的字段')
        }
      } else {
        // 新增逻辑 - 在实际应用中应该发送到后端
        // 新增字段需要知道属于哪个表，这里需要额外的逻辑来确定表
        ElMessage.error('新增字段功能需要指定所属表，当前版本暂不支持')
      }
      editDialogVisible.value = false
    }
  })
}

// 同步指标数据
const syncIndicatorData = (oldField: any, newField: any) => {
  const isOldFieldIndicator = oldField.type === 'native_indicator' || oldField.type === 'derived_indicator'
  const isNewFieldIndicator = newField.type === 'native_indicator' || newField.type === 'derived_indicator'
  
  if (isOldFieldIndicator && !isNewFieldIndicator) {
    // 字段从指标类型变更为非指标类型，从指标信息中删除
    removeFieldFromIndicators(oldField)
  } else if (!isOldFieldIndicator && isNewFieldIndicator) {
    // 字段从非指标类型变更为指标类型，添加到指标信息
    addFieldToIndicators(newField)
  } else if (isOldFieldIndicator && isNewFieldIndicator) {
    // 字段在指标类型之间切换，更新指标信息
    updateFieldInIndicators(oldField, newField)
  }
}

// 添加事实表相关函数
const openAddFactTableDialog = async () => {
  console.log('按钮被点击了')
  addFactTableDialogVisible.value = true
  console.log('对话框可见性设置为:', addFactTableDialogVisible.value)
  await loadAvailableTables()
}

const loadAvailableTables = async () => {
  try {
    // 模拟加载可用表数据
    availableTables.value = [
      {
        id: 1,
        name: 'sales_result_view',
        description: '销售结果数据集视图',
        type: 'result_set_view',
        owner: '张三',
        createTime: '2024-01-15',
        fieldCount: 25
      },
      {
        id: 2,
        name: 'user_base',
        description: '用户基础信息表',
        type: 'base_table',
        owner: '李四',
        createTime: '2024-01-10',
        fieldCount: 18
      },
      {
        id: 3,
        name: 'product_catalog',
        description: '产品目录表',
        type: 'base_table',
        owner: '王五',
        createTime: '2024-01-20',
        fieldCount: 12
      },
      {
        id: 4,
        name: 'order_analysis_table',
        description: '订单分析结果集物理表',
        type: 'result_set_table',
        owner: '赵六',
        createTime: '2024-01-25',
        fieldCount: 30
      },
      {
        id: 5,
        name: 'customer_profile_view',
        description: '客户画像结果集视图',
        type: 'result_set_view',
        owner: '钱七',
        createTime: '2024-01-30',
        fieldCount: 22
      },
      {
        id: 6,
        name: 'inventory_management',
        description: '库存管理基表',
        type: 'base_table',
        owner: '孙八',
        createTime: '2024-02-01',
        fieldCount: 15
      }
    ]
    // 初始化过滤后的表数据
    filteredTables.value = availableTables.value
  } catch (error) {
    console.error('加载可用表数据失败:', error)
  }
}

const handleFilterChange = () => {
  // 根据过滤条件筛选表数据
  let filtered = availableTables.value
  
  // 按表类型过滤
  if (filterTableType.value) {
    filtered = filtered.filter(table => table.type === filterTableType.value)
  }
  
  // 按表名搜索
  if (filterTableName.value) {
    filtered = filtered.filter(table => 
      table.name.toLowerCase().includes(filterTableName.value.toLowerCase())
    )
  }
  
  filteredTables.value = filtered
  selectedTables.value = []
  selectedTableForPreview.value = null
}

const handleTableSelectionChange = (selection) => {
  selectedTables.value = selection
  if (selection.length === 1) {
    selectedTableForPreview.value = selection[0]
  } else {
    selectedTableForPreview.value = null
  }
}

const confirmAddFactTable = async () => {
  try {
    // 这里调用API将选中的表添加为事实表
    const tableNames = selectedTables.value.map(table => table.name).join(', ')
    ElMessage.success(`成功添加事实表: ${tableNames}`)
    
    // 关闭对话框并重置状态
    addFactTableDialogVisible.value = false
    resetFilterAndSelection()
    
    // 刷新事实表列表
    // await loadFactTables()
  } catch (error) {
    ElMessage.error('添加事实表失败')
    console.error('添加事实表失败:', error)
  }
}

const resetFilterAndSelection = () => {
  // 重置过滤条件
  filterTableType.value = ''
  filterTableName.value = ''
  // 重置选择状态
  selectedTables.value = []
  selectedTableForPreview.value = null
  // 重置过滤后的表数据
  filteredTables.value = availableTables.value
}

// 添加字段到指标信息
const addFieldToIndicators = (field: any) => {
  // 检查是否已存在同名指标
  const existingIndex = relatedIndicators.value.findIndex(indicator => indicator.name === field.displayName)
  
  if (existingIndex === -1) {
    // 生成新的指标ID
    const newId = Math.max(...relatedIndicators.value.map(item => item.id), 0) + 1
    
    // 根据字段类型确定指标类型
    const indicatorType = field.type === 'native_indicator' ? 'native' : 'derived'
    
    // 创建新的指标
    const newIndicator = {
      id: newId,
      name: field.displayName,
      type: indicatorType,
      description: field.description,
      formula: field.type === 'native_indicator' ? `SUM(${field.fieldName})` : (field.formula || ''),
      owner: '系统自动生成'
    }
    
    relatedIndicators.value.push(newIndicator)
    ElMessage.success(`字段"${field.displayName}"已自动添加到指标信息`)
  }
}

// 从指标信息中删除字段
const removeFieldFromIndicators = (field: any) => {
  const index = relatedIndicators.value.findIndex(indicator => indicator.name === field.displayName)
  
  if (index !== -1) {
    relatedIndicators.value.splice(index, 1)
    ElMessage.success(`字段"${field.displayName}"已从指标信息中移除`)
  }
}

// 更新指标信息中的字段
const updateFieldInIndicators = (oldField: any, newField: any) => {
  const index = relatedIndicators.value.findIndex(indicator => indicator.name === oldField.displayName)
  
  if (index !== -1) {
    // 根据新的字段类型确定指标类型
    const indicatorType = newField.type === 'native_indicator' ? 'native' : 'derived'
    
    // 更新公式：如果是衍生指标，使用新字段的公式；如果是原生指标，使用默认公式
    let formula = relatedIndicators.value[index].formula
    if (newField.type === 'derived_indicator') {
      formula = newField.formula || formula
    } else {
      formula = `SUM([销售明细表.${newField.fieldName}])`
    }
    
    relatedIndicators.value[index] = {
      ...relatedIndicators.value[index],
      name: newField.displayName,
      type: indicatorType,
      description: newField.description,
      formula: formula
    }
    ElMessage.success(`指标信息已更新为"${newField.displayName}"`)
  }
}

// 保存指标（用于指标编辑对话框）
const saveIndicatorForDialog = () => {
  indicatorFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditingIndicator.value) {
        // 编辑逻辑
        const index = relatedIndicators.value.findIndex(item => item.id === currentIndicator.value.id)
        if (index !== -1) {
          relatedIndicators.value[index] = { 
            ...relatedIndicators.value[index],
            name: currentIndicator.value.name,
            type: currentIndicator.value.type,
            description: currentIndicator.value.description,
            formula: currentIndicator.value.formula || '',
            owner: currentIndicator.value.owner
          }
          ElMessage.success('指标更新成功')
        }
      } else {
        // 新增逻辑
        const newId = Math.max(...relatedIndicators.value.map(item => item.id), 0) + 1
        relatedIndicators.value.push({
          id: newId,
          name: currentIndicator.value.name,
          type: currentIndicator.value.type || 'native',
          description: currentIndicator.value.description,
          formula: currentIndicator.value.formula || '',
          owner: currentIndicator.value.owner
        })
        ElMessage.success('指标添加成功')
      }
      
      // 关闭对话框
      indicatorEditDialogVisible.value = false
    }
  })
}

// 保存指标（通用函数，用于其他场景）
const saveIndicator = (indicatorData: any, isEditing: boolean) => {
  // 转换数据结构以适配现有的relatedIndicators格式
  const convertedData = {
    id: indicatorData.id,
    name: indicatorData.name,
    type: indicatorData.type || 'native',
    description: indicatorData.description,
    formula: indicatorData.formula || '',
    owner: indicatorData.owner
  };
  
  if (isEditing) {
    // 编辑逻辑
    const index = relatedIndicators.value.findIndex(item => item.id === convertedData.id)
    if (index !== -1) {
      relatedIndicators.value[index] = { ...convertedData }
      ElMessage.success('指标更新成功')
    }
  } else {
    // 新增逻辑
    const newId = Math.max(...relatedIndicators.value.map(item => item.id), 0) + 1
    relatedIndicators.value.push({
      ...convertedData,
      id: newId
    })
    ElMessage.success('指标添加成功')
  }
  
  // 更新字段数据中的对应项
  const fieldIndex = fieldData.value.findIndex(field => field.displayName === indicatorData.name)
  if (fieldIndex !== -1) {
    fieldData.value[fieldIndex] = {
      ...fieldData.value[fieldIndex],
      description: indicatorData.description
    }
  }
}

// 指标数据 - 与当前表相关的指标
const relatedIndicators = ref([
  {
    id: 1,
    name: '销售金额',
    type: 'native',
    description: '统计订单的实际销售金额',
    formula: '[销售明细表.销售金额]',
    owner: '张三'
  },
  {
    id: 2,
    name: '订单数量',
    type: 'native',
    description: '订单中产品的数量',
    formula: '[销售明细表.订单数量]',
    owner: '张三'
  },
  {
    id: 3,
    name: '折扣金额',
    type: 'native',
    description: '订单的折扣金额',
    formula: '[销售明细表.折扣金额]',
    owner: '张三'
  },
  {
    id: 4,
    name: '平均客单价',
    type: 'derived',
    description: '客户平均消费金额',
    formula: '[销售明细表.销售金额] / [销售明细表.订单数量]',
    owner: '赵六',
    createTime: '2023-06-18'
  },
  {
    id: 5,
    name: '未关联字段指标',
    type: 'native',
    description: '测试未关联字段的原生指标',
    formula: '',
    owner: '王五'
  }
])

// 重置字段表单
const resetFieldForm = () => {
  Object.assign(currentField.value, {
    displayName: '',
    fieldName: '',
    type: 'native_indicator',
    dataType: '',
    source: '',
    description: '',
    formula: ''
  })
  
  // 清除表单验证
  if (fieldForm.value) {
    fieldForm.value.resetFields()
  }
}

// 处理字段类型变化
const handleFieldTypeChange = (newType: string) => {
  // 当类型切换为衍生指标时，如果公式为空，设置默认公式
  if (newType === 'derived_indicator') {
    if (!currentField.value.formula) {
      currentField.value.formula = '[销售明细表.销售金额] / [销售明细表.订单数量]'
    }
  }
  // 当类型切换为非衍生指标时，清空公式
  else if (newType !== 'derived_indicator') {
    currentField.value.formula = ''
  }
}

// 编辑指标函数
const editIndicator = (indicator) => {
  // 使用Vue Router跳转到指标清单页面并传递指标ID
  router.push(`/indicator-list?id=${indicator.id}`)
}

// 打开指标编辑对话框
const openIndicatorEditDialog = (indicator) => {
  // 设置为编辑模式
  indicatorEditDialogTitle.value = '编辑指标'
  isEditingIndicator.value = true
  
  // 查找指标名称对应的字段信息
  let fieldId = null
  // 遍历所有表的字段来查找匹配的字段
  for (const tableName in fieldData.value) {
    const correspondingField = fieldData.value[tableName].find(field => field.displayName === indicator.name)
    if (correspondingField) {
      fieldId = correspondingField.fieldName
      break
    }
  }
  
  // 填充表单数据，保留公式字段以支持衍生指标
  Object.assign(currentIndicator.value, {
    id: indicator.id,
    name: indicator.name,
    type: indicator.type,
    description: indicator.description,
    formula: indicator.formula || '', // 保留公式字段以支持衍生指标
    fieldId: fieldId, // 设置关联字段默认值为字段信息tab下的字段别名
    owner: indicator.owner
  })
  indicatorEditDialogVisible.value = true
}

// 处理指标对话框关闭
const handleIndicatorDialogClose = () => {
  // 重置表单验证
  if (indicatorFormRef.value) {
    indicatorFormRef.value.resetFields()
  }
}

// 提取公式中使用的事实表
const extractFactTablesFromFormula = (content: string): string[] => {
  if (!content) return []
  
  // 正则表达式匹配 [表名.字段名] 格式
  const factTablePattern = /\[([^\]]+)\.([^\]]+)\]/g
  const matches = content.matchAll(factTablePattern)
  
  const factTables: string[] = []
  for (const match of matches) {
    const tableName = match[1]
    if (tableName && !factTables.includes(tableName)) {
      factTables.push(tableName)
    }
  }
  
  return factTables
}

// 计算指标统计数据
const indicatorSummary = computed(() => {
  const total = relatedIndicators.value.length
  const nativeCount = relatedIndicators.value.filter(indicator => indicator.type === 'native').length
  const derivedCount = relatedIndicators.value.filter(indicator => indicator.type === 'derived').length
  
  return {
    total,
    nativeCount,
    derivedCount
  }
})

// 格式化公式内容，将字段名转换为[表名.字段名]格式
const formatFormulaContent = (content: string) => {
  if (!content) return content
  
  // 定义字段名到表名的映射
  const fieldToTableMap = {
    'sales_amount': '销售明细表',
    'order_id': '销售明细表',
    'customer_id': '销售明细表',
    'quantity': '销售明细表',
    'price': '销售明细表',
    'discount': '销售明细表',
    'revenue_amount': '收入事实表',
    'cost_amount': '收入事实表',
    'profit_amount': '收入事实表',
    'margin_rate': '收入事实表',
    'opening_stock': '库存事实表',
    'ending_stock': '库存事实表',
    'stock_in': '库存事实表',
    'stock_out': '库存事实表',
    'turnover_rate': '库存事实表',
    'total_spend': '客户事实表',
    'customer_level': '客户事实表',
    'lifetime_value': '客户事实表',
    'order_count': '订单汇总表',
    'total_amount': '订单汇总表',
    'avg_amount': '订单汇总表',
    'customer_count': '订单汇总表',
    'product_count': '订单汇总表',
    'visitor_id': '订单汇总表'
  }
  
  // 替换字段名为[表名.字段名]格式
  let formattedContent = content
  Object.entries(fieldToTableMap).forEach(([fieldName, tableName]) => {
    // 使用正则表达式匹配独立的字段名（避免匹配到函数名或其他文本中的字段名）
    const regex = new RegExp(`\\b${fieldName}\\b`, 'g')
    formattedContent = formattedContent.replace(regex, `[${tableName}.${fieldName}]`)
  })
  
  return formattedContent
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

.search-with-button {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.add-fact-table-btn {
  white-space: nowrap;
}

/* 添加事实表对话框样式 */
.add-fact-table-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.table-selection-section {
  margin-bottom: 20px;
}

.table-selection-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.table-preview-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.table-preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
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

/* 没有指标的表样式 */
.table-item.no-indicators {
  background-color: #f8f9fa;
  border-color: #dcdfe6;
}

.table-item.no-indicators .table-name {
  color: #909399;
}

.table-item.no-indicators .table-description {
  color: #c0c4cc;
}

.table-item.no-indicators:hover {
  background-color: #f0f2f5;
  border-color: #c0c4cc;
}

.table-item.no-indicators.active {
  background-color: #e6e8eb;
  border-color: #909399;
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

/* 多公式管理样式 */
.multi-formula-management {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 15px;
  background-color: #fafafa;
}

.formula-item {
  margin-bottom: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ffffff;
  overflow: hidden;
}

.formula-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.formula-title {
  font-weight: 600;
  color: #303133;
}

.formula-content {
  padding: 15px;
  min-height: 60px;
}

.formula-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #606266;
}

.empty-formula {
  color: #909399;
  font-style: italic;
}

.formula-actions {
  margin-top: 15px;
  text-align: center;
}

/* 公式编辑弹窗样式 */
.formula-popup-editor {
  display: contents;
}

/* 公式列表单元格样式 */
.formulas-cell {
  max-height: 200px;
  overflow-y: auto;
}

.formula-item {
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #ffffff;
}

.formula-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.formula-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.formula-content {
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  word-break: break-all;
  white-space: pre-wrap;
}

.formula-item .fact-tables-section {
  padding: 6px 10px;
  background-color: #f0f2f5;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  display: flex !important;
  align-items: center !important;
  gap: 8px;
  min-width: 120px;
  margin-left: auto !important;
  width: auto !important;
  max-width: none !important;
}

.fact-tables-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.fact-tables-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.fact-table-tag {
  margin: 0;
}

.no-fact-tables {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
}

.no-formulas {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 20px
}

/* 字段汇总信息样式 - 使用tag标签显示，颜色与列类型保持一致 */
.field-summary-container {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.summary-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-right: 8px;
}
</style>