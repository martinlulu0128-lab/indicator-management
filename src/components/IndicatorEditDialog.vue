<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="600px"
    @close="handleClose"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="指标名称" prop="name">
        <el-input v-model="formData.name" :disabled="isEditing" />
      </el-form-item>
      
      <el-form-item label="指标类型" prop="type">
        <el-select v-model="formData.type" :disabled="isEditing" @change="handleTypeChange">
          <el-option label="原生指标" value="native" />
          <el-option label="衍生指标" value="derived" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="指标描述" prop="description">
        <el-input v-model="formData.description" type="textarea" />
      </el-form-item>
      
      <!-- 公式编辑器 - 仅对衍生指标显示 -->
      <div v-if="formData.type === 'derived'">
        <el-form-item label="指标公式" prop="formula">
          <FormulaPopupEditor 
            v-model="formData.formula" 
            :related-indicators="relatedIndicators"
            @open-enhanced-editor="openEnhancedEditor"
          />
        </el-form-item>
        
        <!-- 多公式展示 - 当有多个公式时显示 -->
        <el-form-item v-if="multiFormulas.length > 0" label="多维公式">
          <MultiFormulaDisplay 
            :formulas="multiFormulas" 
            :current-fact-table="currentFactTable" 
          />
        </el-form-item>
      </div>
      
      <!-- 原生指标字段选择 - 仅对原生指标显示 -->
      <el-form-item 
        v-if="formData.type === 'native' " 
        label="关联字段" 
        prop="fieldId"
      >
        <div class="field-selector-container">
          <div class="selected-field-info" v-if="formData.fieldId">
            {{ selectedFieldInfo }}
            <el-button 
              type="text" 
              size="small" 
              @click="clearSelectedField"
              class="clear-btn"
            >
              清除
            </el-button>
          </div>
          <el-button 
            type="primary" 
            @click="openTableSelector"
            :disabled="!formData.type"
            style="width: 100%"
          >
            选择字段
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="负责人" prop="owner">
        <el-input v-model="formData.owner" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 增强公式编辑器弹窗 -->
  <EnhancedFormulaEditor
    v-model:visible="enhancedEditorVisible"
    v-model:formula="enhancedFormula"
    :related-indicators="relatedIndicators"
    @save="handleEnhancedFormulaSave"
  />
  
  <!-- 表选择弹窗 -->
  <TableSelectorDialog
    v-model="tableSelectorVisible"
    :tables="tableData"
    @confirm="handleTableSelect"
  />
  
  <!-- 字段选择弹窗 -->
  <FieldSelectorDialog
    v-model="fieldSelectorVisible"
    :selected-table="selectedTable"
    :fields="currentTableFields"
    @confirm="handleFieldSelect"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import FormulaPopupEditor from './FormulaPopupEditor.vue'
import EnhancedFormulaEditor from './EnhancedFormulaEditor.vue'
import MultiFormulaDisplay from './MultiFormulaDisplay.vue'
import TableSelectorDialog from './TableSelectorDialog.vue'
import FieldSelectorDialog from './FieldSelectorDialog.vue'

// 定义属性
const props = defineProps<{
  modelValue: boolean
  dialogTitle: string
  isEditing: boolean
  indicatorData?: any
  relatedIndicators: any[]
  availableFields: any[]
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

// 表单引用
const formRef = ref()

// 数据
const formData = reactive({
  id: null,
  name: '',
  type: 'native',
  description: '',
  formula: '',
  fieldId: null,
  owner: ''
})

// 多公式数据
const multiFormulas = ref<any[]>([])

// 增强编辑器可见性
const enhancedEditorVisible = ref(false)

// 增强编辑器公式
const enhancedFormula = ref('')

// 表选择弹窗可见性
const tableSelectorVisible = ref(false)

// 字段选择弹窗可见性
const fieldSelectorVisible = ref(false)

// 选中的表
const selectedTable = ref(null)

// 模拟表数据（实际应用中应从API获取）
const tableData = ref([
  { id: 1, name: 'sales_detail', description: '销售明细表', createTime: '2023-01-01' },
  { id: 2, name: 'user_behavior', description: '用户行为表', createTime: '2023-01-02' },
  { id: 3, name: 'product_info', description: '产品信息表', createTime: '2023-01-03' },
  { id: 4, name: 'order_summary', description: '订单汇总表', createTime: '2023-01-04' },
  { id: 5, name: 'customer_profile', description: '客户画像表', createTime: '2023-01-05' }
])

// 根据选中的表获取字段数据（实际应用中应从API获取）
const getFieldsByTable = (tableName) => {
  // 模拟不同表的字段数据
  const fieldsMap = {
    'sales_detail': [
      { fieldName: 'order_id', displayName: '订单ID', type: 'dimension', dataType: 'string', description: '订单唯一标识' },
      { fieldName: 'product_id', displayName: '产品ID', type: 'dimension', dataType: 'string', description: '产品唯一标识' },
      { fieldName: 'customer_id', displayName: '客户ID', type: 'dimension', dataType: 'string', description: '客户唯一标识' },
      { fieldName: 'quantity', displayName: '数量', type: 'metric', dataType: 'number', description: '销售数量' },
      { fieldName: 'price', displayName: '单价', type: 'metric', dataType: 'decimal', description: '产品单价' },
      { fieldName: 'sales_amount', displayName: '销售金额', type: 'metric', dataType: 'decimal', description: '订单销售金额' },
      { fieldName: 'discount', displayName: '折扣', type: 'metric', dataType: 'decimal', description: '折扣比例' },
      { fieldName: 'sale_date', displayName: '销售日期', type: 'dimension', dataType: 'date', description: '订单日期' }
    ],
    'user_behavior': [
      { fieldName: 'user_id', displayName: '用户ID', type: 'dimension', dataType: 'string', description: '用户唯一标识' },
      { fieldName: 'session_id', displayName: '会话ID', type: 'dimension', dataType: 'string', description: '会话唯一标识' },
      { fieldName: 'page_view', displayName: '页面浏览量', type: 'metric', dataType: 'number', description: '页面访问次数' },
      { fieldName: 'stay_time', displayName: '停留时间', type: 'metric', dataType: 'number', description: '页面停留时间(秒)' },
      { fieldName: 'click_count', displayName: '点击次数', type: 'metric', dataType: 'number', description: '页面点击次数' },
      { fieldName: 'behavior_type', displayName: '行为类型', type: 'dimension', dataType: 'string', description: '用户行为类型' },
      { fieldName: 'visit_time', displayName: '访问时间', type: 'dimension', dataType: 'datetime', description: '访问时间戳' }
    ],
    'product_info': [
      { fieldName: 'product_id', displayName: '产品ID', type: 'dimension', dataType: 'string', description: '产品唯一标识' },
      { fieldName: 'product_name', displayName: '产品名称', type: 'dimension', dataType: 'string', description: '产品名称' },
      { fieldName: 'category_id', displayName: '分类ID', type: 'dimension', dataType: 'string', description: '产品分类标识' },
      { fieldName: 'category_name', displayName: '分类名称', type: 'dimension', dataType: 'string', description: '产品分类名称' },
      { fieldName: 'price', displayName: '价格', type: 'metric', dataType: 'decimal', description: '产品价格' },
      { fieldName: 'stock', displayName: '库存', type: 'metric', dataType: 'number', description: '产品库存' },
      { fieldName: 'sales_count', displayName: '销量', type: 'metric', dataType: 'number', description: '累计销量' },
      { fieldName: 'create_time', displayName: '创建时间', type: 'dimension', dataType: 'datetime', description: '产品创建时间' }
    ],
    'order_summary': [
      { fieldName: 'summary_date', displayName: '统计日期', type: 'dimension', dataType: 'date', description: '汇总日期' },
      { fieldName: 'order_count', displayName: '订单数量', type: 'metric', dataType: 'number', description: '当日订单总数' },
      { fieldName: 'total_amount', displayName: '总金额', type: 'metric', dataType: 'decimal', description: '当日销售总金额' },
      { fieldName: 'avg_amount', displayName: '平均金额', type: 'metric', dataType: 'decimal', description: '订单平均金额' },
      { fieldName: 'customer_count', displayName: '客户数', type: 'metric', dataType: 'number', description: '下单客户数量' },
      { fieldName: 'product_count', displayName: '产品种类数', type: 'metric', dataType: 'number', description: '销售产品种类数' }
    ],
    'customer_profile': [
      { fieldName: 'customer_id', displayName: '客户ID', type: 'dimension', dataType: 'string', description: '客户唯一标识' },
      { fieldName: 'customer_name', displayName: '客户名称', type: 'dimension', dataType: 'string', description: '客户姓名' },
      { fieldName: 'age', displayName: '年龄', type: 'dimension', dataType: 'number', description: '客户年龄' },
      { fieldName: 'gender', displayName: '性别', type: 'dimension', dataType: 'string', description: '客户性别' },
      { fieldName: 'region', displayName: '地区', type: 'dimension', dataType: 'string', description: '客户所在地区' },
      { fieldName: 'total_spend', displayName: '总消费', type: 'metric', dataType: 'decimal', description: '累计消费金额' },
      { fieldName: 'order_count', displayName: '订单数', type: 'metric', dataType: 'number', description: '累计订单数量' },
      { fieldName: 'registration_date', displayName: '注册日期', type: 'dimension', dataType: 'date', description: '客户注册日期' }
    ]
  }
  
  return fieldsMap[tableName] || []
}

// 当前选中表的字段列表
const currentTableFields = ref([])

// 计算当前事实表（用于衍生指标的字段引用约束）
const currentFactTable = computed(() => {
  // 如果是编辑模式且指标数据中有事实表信息，使用该信息
  if (props.isEditing && props.indicatorData && props.indicatorData.factTable) {
    const factTableName = props.indicatorData.factTable
    return tableData.value.find(table => table.name === factTableName)
  }
  
  // 如果是原生指标且已选择了表，使用该表作为事实表
  if (formData.type === 'native' && selectedTable.value) {
    return selectedTable.value
  }
  
  // 如果是衍生指标，优先使用已选择的表（如果存在）
  if (formData.type === 'derived' && selectedTable.value) {
    return selectedTable.value
  }
  
  // 如果是衍生指标，尝试从公式中提取事实表
  if (formData.type === 'derived' && formData.formula) {
    const fieldReferences = formData.formula.match(/\[[^\]]+\.[^\]]+\]/g) || []
    if (fieldReferences.length > 0) {
      const firstFieldRef = fieldReferences[0]
      const match = firstFieldRef.match(/\[([^.]+)\.([^\]]+)\]/)
      if (match) {
        const tableDescription = match[1]
        return tableData.value.find(table => table.description === tableDescription)
      }
    }
  }
  
  return null
})

// 显示选中的字段信息
const selectedFieldInfo = computed(() => {
  if (!formData.fieldId) return ''
  
  // 查找当前选中的字段
  const field = currentTableFields.value.find(f => f.fieldName === formData.fieldId)
  if (field && selectedTable.value) {
    return `[${selectedTable.value.description}.${field.displayName || field.fieldName}]`
  }
  return formData.fieldId
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入指标名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择指标类型', trigger: 'change' }
  ],
  description: [
    { required: false, message: '请输入指标描述', trigger: 'blur' }
  ],
  formula: [
    { required: false, message: '请输入指标公式', trigger: 'blur' }
  ],
  fieldId: [
    { required: false, message: '请选择关联字段', trigger: 'change' }
  ],
  owner: [
    { required: true, message: '请输入负责人', trigger: 'blur' }
  ]
}

// 计算属性 - 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听指标数据变化
watch(() => props.indicatorData, (newVal) => {
  if (newVal) {
    Object.assign(formData, newVal)
    // 如果是编辑模式且类型为衍生指标，解析多公式
    if (props.isEditing && formData.type === 'derived' && formData.formula) {
      parseMultiFormulas(formData.formula)
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 解析多公式
const parseMultiFormulas = (formula: string) => {
  // 这里应该根据实际的公式格式来解析
  // 示例：假设公式可能包含多个维度的计算
  if (formula.includes('|')) {
    const parts = formula.split('|')
    multiFormulas.value = parts.map((part, index) => ({
      dimension: `维度${index + 1}`,
      formula: part.trim()
    }))
  } else {
    multiFormulas.value = []
  }
}

// 类型变化处理
const handleTypeChange = (value: string) => {
  // 清空相关字段
  if (value === 'native') {
    formData.formula = ''
    multiFormulas.value = []
  } else {
    formData.fieldId = null
    selectedTable.value = null
    currentTableFields.value = []
  }
}

// 打开增强编辑器
const openEnhancedEditor = () => {
  enhancedFormula.value = formData.formula
  enhancedEditorVisible.value = true
}

// 保存增强编辑器内容
const handleEnhancedFormulaSave = (formula: string) => {
  formData.formula = formula
  enhancedEditorVisible.value = false
  // 解析多公式
  parseMultiFormulas(formula)
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    name: '',
    type: 'native',
    description: '',
    formula: '',
    fieldId: null,
    owner: ''
  })
  multiFormulas.value = []
  enhancedFormula.value = ''
  selectedTable.value = null
  currentTableFields.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 打开表选择弹窗
const openTableSelector = () => {
  tableSelectorVisible.value = true
}

// 处理表选择
const handleTableSelect = (table) => {
  selectedTable.value = table
  // 获取选中表的字段
  currentTableFields.value = getFieldsByTable(table.name)
  // 打开字段选择弹窗
  fieldSelectorVisible.value = true
}

// 处理字段选择
const handleFieldSelect = (field) => {
  formData.fieldId = field.fieldName
  ElMessage.success(`已选择字段: ${selectedTable.value.name}.${field.displayName || field.fieldName}`)
}

// 清除选中的字段
const clearSelectedField = () => {
  formData.fieldId = null
  selectedTable.value = null
  currentTableFields.value = []
}

// 保存数据
const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      // 根据类型准备数据
      const dataToSave = { ...formData }
      
      // 如果是原生指标，清除公式字段
      if (dataToSave.type === 'native') {
        dataToSave.formula = ''
      }
      
      // 如果是衍生指标，清除字段ID
      if (dataToSave.type === 'derived') {
        dataToSave.fieldId = null
      }
      
      // 检查是否缺少必要的配置
      if (dataToSave.type === 'native' && !dataToSave.fieldId) {
        ElMessage.warning('原生指标尚未关联字段，您可以在后续编辑时补充')
      }
      
      if (dataToSave.type === 'derived' && !dataToSave.formula) {
        ElMessage.warning('衍生指标尚未配置公式，您可以在后续编辑时补充')
      }
      
      emit('save', dataToSave)
      handleClose()
    } else {
      ElMessage.error('请填写必填字段')
    }
  })
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}

.field-selector-container {
  width: 100%;
}

.selected-field-info {
  padding: 8px 12px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #67c23a;
}

.clear-btn {
  color: #f56c6c;
}
</style>