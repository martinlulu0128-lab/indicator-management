<template>
  <el-dialog 
    v-model="visible" 
    :title="dialogTitle" 
    width="600px"
    @close="handleClose"
    append-to-body
  >
    <el-form 
      :model="formData" 
      :rules="formRules" 
      ref="formRef" 
      label-width="100px"
    >
      <el-form-item label="指标名称" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" />
      </el-form-item>
      <el-form-item label="关联字段" prop="fieldId" v-if="formData.type === 'native'">
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
        <el-select 
          v-model="formData.owner" 
          filterable
          clearable
          placeholder="请选择负责人"
          style="width: 100%"
        >
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.name"
            :value="user.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="指标类型">
        <el-tag :type="formData.type === 'native' ? 'primary' : 'success'" disabled>
          {{ formData.type === 'native' ? '原生指标' : '衍生指标' }}
        </el-tag>
      </el-form-item>
      <el-form-item label="计算公式">
        <el-input v-model="formData.formula" type="textarea" :rows="3" :disabled="formData.type !== 'derived'" />
        <div v-if="formData.type === 'derived'" class="formula-tip">
          <el-tag type="info" size="small">衍生指标计算公式</el-tag>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
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
import { ref, reactive, computed, defineProps, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TableSelectorDialog from './TableSelectorDialog.vue'
import FieldSelectorDialog from './FieldSelectorDialog.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  dialogTitle: {
    type: String,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  // 接收indicatorData属性，与父组件的传递保持一致
  indicatorData: {
    type: Object,
    default: () => ({
      id: 0,
      name: '',
      description: '',
      fieldId: null,
      owner: '',
      type: 'native',
      formula: ''
    })
  },
  availableFields: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(false)
const formRef = ref()

// 用户数据列表
const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '孙七' },
  { id: 6, name: '周八' }
])

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

// 显示选中的字段信息
const selectedFieldInfo = computed(() => {
  if (!formData.fieldId) return ''
  
  // 查找当前选中的字段
  const field = currentTableFields.value.find(f => f.fieldName === formData.fieldId)
  if (field && selectedTable.value) {
    return `${selectedTable.value.name}.${field.displayName || field.fieldName}`
  }
  return formData.fieldId
})

// 表单数据
const formData = reactive({
  id: 0,
  name: '',
  description: '',
  fieldId: null,
  owner: '',
  type: 'native',
  formula: '' // 添加formula字段以支持衍生指标
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入指标描述', trigger: 'blur' }],
  fieldId: [{ required: true, message: '请选择字段', trigger: 'change' }],
  owner: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 初始化表单数据，使用indicatorData（与父组件传递保持一致）
    Object.assign(formData, props.indicatorData)
    // 如果有字段ID，尝试解析表名和字段名
    if (formData.fieldId && formData.fieldId.includes('.')) {
      const [tableName, fieldName] = formData.fieldId.split('.')
      // 查找对应表
      const table = tableData.value.find(t => t.name === tableName)
      if (table) {
        selectedTable.value = table
        currentTableFields.value = getFieldsByTable(tableName)
        // 更新为仅字段名
        formData.fieldId = fieldName
      }
    }
  }
})

// 监听visible变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 关闭对话框
const handleClose = () => {
  resetForm()
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

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: 0,
    name: '',
    description: '',
    fieldId: null,
    owner: '',
    type: 'native',
    formula: ''
  })
  selectedTable.value = null
  currentTableFields.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 关闭弹窗
const close = () => {
  visible.value = false
}

// 保存指标
const save = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      // 发送保存事件
      emit('save', { ...formData }, props.isEditing)
      close()
    }
  })
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.formula-tip {
  margin-top: 5px;
  font-size: 12px;
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