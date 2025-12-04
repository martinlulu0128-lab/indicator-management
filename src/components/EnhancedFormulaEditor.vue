<template>
  <!-- 主编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    title="公式编辑"
    width="700px"
    append-to-body
  >
    <div class="enhanced-formula-editor">
      <div class="formula-input-area">
        <div class="formula-toolbar">
          <el-dropdown @command="handleTableSelect" trigger="click">
            <el-button size="small" type="primary">
              <el-icon><Document /></el-icon>
              插入表字段
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-for="table in tables" 
                  :key="table.id" 
                  :command="table"
                >
                  {{ table.description }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-dropdown @command="handleOperatorSelect" trigger="click">
            <el-button size="small">
              <el-icon><Operation /></el-icon>
              运算符
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="+">加法 (+)</el-dropdown-item>
                <el-dropdown-item command="-">减法 (-)</el-dropdown-item>
                <el-dropdown-item command="*">乘法 (*)</el-dropdown-item>
                <el-dropdown-item command="/">除法 (/)</el-dropdown-item>
                <el-dropdown-item command="(">左括号 (</el-dropdown-item>
                <el-dropdown-item command=")">右括号 )</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-dropdown trigger="click">
            <el-button size="small" type="success">
              <el-icon><DataAnalysis /></el-icon>
              插入函数
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="scrollable-dropdown">
                <!-- 逻辑函数分组 -->
                <div class="dropdown-group-header">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="toggleGroup('logical')"
                    class="group-toggle-btn"
                  >
                    <el-icon v-if="expandedGroups.logical"><ArrowDown /></el-icon>
                    <el-icon v-else><ArrowRight /></el-icon>
                    逻辑函数
                  </el-button>
                </div>
                <template v-if="expandedGroups.logical">
                  <el-dropdown-item command="AND">AND(逻辑表达式1, [逻辑表达式2, ...]) - 逻辑与</el-dropdown-item>
                  <el-dropdown-item command="CONTAIN">CONTAIN(查找范围, [要查找的值, ...]) - 判断查找范围是否包含要查找的内容</el-dropdown-item>
                  <el-dropdown-item command="FALSE">FALSE() - 返回逻辑值 FALSE</el-dropdown-item>
                  <el-dropdown-item command="IF">IF(判断条件, 为 TRUE 时的返回值, [为 FALSE 时的返回值]) - 条件判断</el-dropdown-item>
                  <el-dropdown-item command="IFBLANK">IFBLANK(值, 空值情况的返回值) - 检查目标值是否为空</el-dropdown-item>
                  <el-dropdown-item command="IFERROR">IFERROR(值, 错误情况的返回值) - 检查目标值是否错误</el-dropdown-item>
                  <el-dropdown-item command="IFS">IFS(条件1, 值1, [条件2, ...], [值2, ...]) - 多条件判断</el-dropdown-item>
                  <el-dropdown-item command="ISBLANK">ISBLANK(值) - 检查目标值是否为空值</el-dropdown-item>
                  <el-dropdown-item command="ISERROR">ISERROR(值) - 检查某个值是否为错误值</el-dropdown-item>
                  <el-dropdown-item command="ISNUMBER">ISNUMBER(值) - 检查目标值是否为数字</el-dropdown-item>
                  <el-dropdown-item command="MAP">MAP(数据范围, 映射逻辑) - 将给定数据范围中的每个值映射到新值</el-dropdown-item>
                  <el-dropdown-item command="NOT">NOT(逻辑函数) - 逻辑非</el-dropdown-item>
                  <el-dropdown-item command="OR">OR(逻辑表达式1, [逻辑表达式2, ...]) - 逻辑或</el-dropdown-item>
                  <el-dropdown-item command="RANK">RANK(值, 查找范围, [按升序]) - 返回一个值在指定数据集中的排名</el-dropdown-item>
                  <el-dropdown-item command="RECORD_ID">RECORD_ID() - 获取多维表格记录的唯一 ID 编号</el-dropdown-item>
                  <el-dropdown-item command="SWITCH">SWITCH(表达式, 表达式1, 表达式1的值, [表达式2或默认值, ...], [表达式2的值, ...]) - 开关函数</el-dropdown-item>
                  <el-dropdown-item command="TRUE">TRUE() - 返回逻辑值 TRUE</el-dropdown-item>
                  <el-dropdown-item command="CONTAINSALL">CONTAINSALL(查找范围,[要查找的值,...]) - 判断查找范围是否包含所有要查找的内容</el-dropdown-item>
                  <el-dropdown-item command="CONTAINSONLY">CONTAINSONLY(查找范围,[要查找的值,...]) - 判断查找范围是否仅包含所有要查找的内容</el-dropdown-item>
                  <el-dropdown-item command="ISNULL">ISNULL(值) - 检查目标值是否为空值</el-dropdown-item>
                  <el-dropdown-item command="RANDOMBETWEEN">RANDOMBETWEEN(最小整数，最大整数，[是否持续更新]) - 生成指定范围内的随机整数</el-dropdown-item>
                  <el-dropdown-item command="RANDOMITEM">RANDOMITEM(列表, [是否持续更新]) - 从列表中随机选择一个元素</el-dropdown-item>
                </template>
                
                <!-- 日期函数分组 -->
                <div class="dropdown-group-header">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="toggleGroup('date')"
                    class="group-toggle-btn"
                  >
                    <el-icon v-if="expandedGroups.date"><ArrowDown /></el-icon>
                    <el-icon v-else><ArrowRight /></el-icon>
                    日期函数
                  </el-button>
                </div>
                <template v-if="expandedGroups.date">
                  <el-dropdown-item command="DATE">DATE(年, 月, 日) - 将代表年、月、日的数字转换为日期</el-dropdown-item>
                  <el-dropdown-item command="DATEDIF">DATEDIF(起始日期, 结束日期, 单位) - 返回起始日期和结束日期之间的天数、月数或年数</el-dropdown-item>
                  <el-dropdown-item command="DAY">DAY(日期值) - 以数字格式返回特定日期的日</el-dropdown-item>
                  <el-dropdown-item command="DAYS">DAYS(结束日期, 起始日期) - 返回起始日期与结束日期之间的天数</el-dropdown-item>
                  <el-dropdown-item command="EDATE">EDATE(开始日期, 月数) - 返回输入日期特定月数之前或者之后的日期</el-dropdown-item>
                  <el-dropdown-item command="EOMONTH">EOMONTH(开始日期, 月数) - 返回与开始日期相隔数月的某个月份最后一天的日期</el-dropdown-item>
                  <el-dropdown-item command="HOUR">HOUR(时间) - 以数字格式返回特定时间的小时部分</el-dropdown-item>
                  <el-dropdown-item command="MINUTE">MINUTE(时间) - 以数字格式返回特定时间的分钟部分</el-dropdown-item>
                  <el-dropdown-item command="MONTH">MONTH(日期值) - 以数字格式返回特定日期对应的月份</el-dropdown-item>
                  <el-dropdown-item command="NETWORKDAYS">NETWORKDAYS(起始日期, 结束日期, [节假日]) - 返回起始日期和结束日期之间的净工作日天数</el-dropdown-item>
                  <el-dropdown-item command="NOW">NOW() - 返回当前日期和时间</el-dropdown-item>
                  <el-dropdown-item command="SECOND">SECOND(时间) - 以数字格式返回特定时间的秒钟部分</el-dropdown-item>
                  <el-dropdown-item command="TODAY">TODAY() - 返回当天的日期</el-dropdown-item>
                  <el-dropdown-item command="WEEKDAY">WEEKDAY(日期值, [类型]) - 返回目标日期在当周的第几天，结果以数字形式显示</el-dropdown-item>
                  <el-dropdown-item command="WEEKNUM">WEEKNUM(日期, [类型]) - 返回目标日期在当前年份的第几周</el-dropdown-item>
                  <el-dropdown-item command="WORKDAY">WORKDAY(起始日期, 天数, [节假日]) - 指定起始日期和所需要的工作日天数，返回结束日期</el-dropdown-item>
                  <el-dropdown-item command="YEAR">YEAR(日期值) - 以数字格式返回给定日期所指定的年份</el-dropdown-item>
                  <el-dropdown-item command="DURATION">DURATION(天数, [小时数], [分钟数], [秒数]) - 生成指定时长，给已有日期加上或减去该时长，可以计算出新的日期</el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button size="small" @click="clearFormula">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        
        <div class="formula-textarea-container">
          <textarea
            ref="formulaTextarea"
            v-model="formula"
            placeholder="请输入公式，例如: ${销售明细表.销售金额} + ${销售明细表.折扣金额}"
            class="formula-textarea"
            @input="onFormulaInput"
          ></textarea>
        </div>
        
        <div class="function-help">
        <h4>函数帮助:</h4>
        <div class="help-content">
          <h5>逻辑函数</h5>
          <div class="function-list">
            <div class="function-item">
              <strong>AND(逻辑表达式1, [逻辑表达式2, ...])</strong> - 逻辑与，当所有参数均为逻辑 TRUE 时，返回 TRUE；当参数中任何一个为逻辑 FALSE，返回 FALSE
            </div>
            <div class="function-item">
              <strong>CONTAIN(查找范围, [要查找的值, ...])</strong> - 判断查找范围是否包含要查找的内容。注：本函数不支持文本包含匹配，如有需要请使用 CONTAINTEXT 函数
            </div>
            <div class="function-item">
              <strong>FALSE()</strong> - 返回逻辑值 FALSE
            </div>
            <div class="function-item">
              <strong>IF(判断条件, 为 TRUE 时的返回值, [为 FALSE 时的返回值])</strong> - 当判断条件为 TRUE 时返回一个值，为 FALSE 时返回另一个值
            </div>
            <div class="function-item">
              <strong>IFBLANK(值, 空值情况的返回值)</strong> - 检查目标值是否为空，非空时返回该值本身，否则返回第二个参数的值
            </div>
            <div class="function-item">
              <strong>IFERROR(值, 错误情况的返回值)</strong> - 检查目标值是否错误，没有错误时返回该值本身，否则返回第二个参数的值
            </div>
            <div class="function-item">
              <strong>IFS(条件1, 值1, [条件2, ...], [值2, ...])</strong> - 判断是否满足一个或多个条件并返回第一个 TRUE 条件对应的结果
            </div>
            <div class="function-item">
              <strong>ISBLANK(值)</strong> - 检查目标值是否为空值，为空时结果为 true，否则为 false
            </div>
            <div class="function-item">
              <strong>ISERROR(值)</strong> - 检查某个值是否为错误值
            </div>
            <div class="function-item">
              <strong>ISNUMBER(值)</strong> - 检查目标值是否为数字，返回布尔值：如为数字，则返回 TRUE；如非数字，则返回 FALSE
            </div>
            <div class="function-item">
              <strong>MAP(数据范围, 映射逻辑)</strong> - 将给定数据范围中的每个值映射到新值，即按照映射逻辑处理给定数据组中的每一个值，并返回由处理后元素组成的新数组
            </div>
            <div class="function-item">
              <strong>NOT(逻辑函数)</strong> - 对其参数的逻辑求反
            </div>
            <div class="function-item">
              <strong>OR(逻辑表达式1, [逻辑表达式2, ...])</strong> - 只要提供的参数中任何一个为逻辑真就返回 TRUE，如果提供的所有参数均为逻辑假则返回 FALSE
            </div>
            <div class="function-item">
              <strong>RANK(值, 查找范围, [按升序])</strong> - 返回一个值在指定数据集中的排名
            </div>
            <div class="function-item">
              <strong>RECORD_ID()</strong> - 获取多维表格记录的唯一 ID 编号
            </div>
            <div class="function-item">
              <strong>SWITCH(表达式, 表达式1, 表达式1的值, [表达式2或默认值, ...], [表达式2的值, ...])</strong> - 通过与表达式进行比较，按命中条件返回相应的值
            </div>
            <div class="function-item">
              <strong>TRUE()</strong> - 返回逻辑值 TRUE
            </div>
            <div class="function-item">
              <strong>CONTAINSALL(查找范围,[要查找的值,...])</strong> - 判断查找范围是否包含所有要查找的内容
            </div>
            <div class="function-item">
              <strong>CONTAINSONLY(查找范围,[要查找的值,...])</strong> - 判断查找范围是否仅包含所有要查找的内容
            </div>
            <div class="function-item">
              <strong>ISNULL(值)</strong> - 检查目标值是否为空值，为空时结果为 true，否则为 false
            </div>
            <div class="function-item">
              <strong>RANDOMBETWEEN(最小整数，最大整数，[是否持续更新])</strong> - 生成指定范围内的随机整数
            </div>
            <div class="function-item">
              <strong>RANDOMITEM(列表, [是否持续更新])</strong> - 从列表中随机选择一个元素
            </div>
          </div>
          
          <h5>日期函数</h5>
          <div class="function-list">
            <div class="function-item">
              <strong>DATE(年, 月, 日)</strong> - 将代表年、月、日的数字转换为日期
            </div>
            <div class="function-item">
              <strong>DATEDIF(起始日期, 结束日期, 单位)</strong> - 返回起始日期和结束日期之间的天数、月数或年数
            </div>
            <div class="function-item">
              <strong>DAY(日期值)</strong> - 以数字格式返回特定日期的日
            </div>
            <div class="function-item">
              <strong>DAYS(结束日期, 起始日期)</strong> - 返回起始日期与结束日期之间的天数
            </div>
            <div class="function-item">
              <strong>EDATE(开始日期, 月数)</strong> - 返回输入日期特定月数之前或者之后的日期
            </div>
            <div class="function-item">
              <strong>EOMONTH(开始日期, 月数)</strong> - 返回与开始日期相隔数月的某个月份最后一天的日期
            </div>
            <div class="function-item">
              <strong>HOUR(时间)</strong> - 以数字格式返回特定时间的小时部分
            </div>
            <div class="function-item">
              <strong>MINUTE(时间)</strong> - 以数字格式返回特定时间的分钟部分
            </div>
            <div class="function-item">
              <strong>MONTH(日期值)</strong> - 以数字格式返回特定日期对应的月份
            </div>
            <div class="function-item">
              <strong>NETWORKDAYS(起始日期, 结束日期, [节假日])</strong> - 返回起始日期和结束日期之间的净工作日天数
            </div>
            <div class="function-item">
              <strong>NOW()</strong> - 返回当前日期和时间
            </div>
            <div class="function-item">
              <strong>SECOND(时间)</strong> - 以数字格式返回特定时间的秒钟部分
            </div>
            <div class="function-item">
              <strong>TODAY()</strong> - 返回当天的日期
            </div>
            <div class="function-item">
              <strong>WEEKDAY(日期值, [类型])</strong> - 返回目标日期在当周的第几天，结果以数字形式显示
            </div>
            <div class="function-item">
              <strong>WEEKNUM(日期, [类型])</strong> - 返回目标日期在当前年份的第几周
            </div>
            <div class="function-item">
              <strong>WORKDAY(起始日期, 天数, [节假日])</strong> - 指定起始日期和所需要的工作日天数，返回结束日期
            </div>
            <div class="function-item">
              <strong>YEAR(日期值)</strong> - 以数字格式返回给定日期所指定的年份
            </div>
            <div class="function-item">
              <strong>DURATION(天数, [小时数], [分钟数], [秒数])</strong> - 生成指定时长，给已有日期加上或减去该时长，可以计算出新的日期
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 字段选择弹窗 -->
  <el-dialog
    v-model="fieldDialogVisible"
    :title="`选择${selectedTable?.description}的字段`"
    width="600px"
    append-to-body
  >
    <div class="field-list-container">
      <div 
        v-for="field in tableFields[selectedTable?.id || 0]" 
        :key="field.id"
        class="field-item"
        @click="insertField(field)"
      >
        <div class="field-name">{{ field.name }}</div>
        <div class="field-type">
          <el-tag :type="getFieldTypeTagType(field.type)">
            {{ field.type }}
          </el-tag>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="fieldDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Document, Operation, Delete, DataAnalysis, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'

// 弹窗可见性
const dialogVisible = ref(false)

// 定义props
const props = defineProps<{
  modelValue?: string
}>()

// 定义emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    formula.value = newVal
  }
})

// 定义组件属性
const formula = defineModel<string>({ default: '' })

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})
const selectedTable = ref<any>(null)
const fieldDialogVisible = ref(false)

// 公式输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 分组展开状态
const expandedGroups = ref({
  logical: true,
  date: true
})

// 切换分组展开/折叠
const toggleGroup = (group: string) => {
  expandedGroups.value[group as keyof typeof expandedGroups.value] = !expandedGroups.value[group as keyof typeof expandedGroups.value]
}

// 获取字段类型标签类型
const getFieldTypeTagType = (type: string) => {
  switch (type) {
    case '维度':
      return 'primary'
    case '指标':
      return 'success'
    case '衍生维度':
      return 'warning'
    case '衍生指标':
      return 'danger'
    default:
      return 'info'
  }
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!formulaTextarea.value || !selectedTable.value) return
  
  const fieldName = `\${${selectedTable.value.description}.${field.name}}`
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入字段名
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    fieldName + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 关闭对话框
  fieldDialogVisible.value = false
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到插入字段后
      const newPosition = cursorPosition + fieldName.length
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 处理运算符选择
const handleOperatorSelect = (operator: string) => {
  if (!formulaTextarea.value) return
  
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入运算符
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    operator + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到插入运算符后
      const newPosition = cursorPosition + operator.length
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 处理函数选择
const handleFunctionSelect = (functionName: string) => {
  if (!formulaTextarea.value) return
  
  const cursorPosition = formulaTextarea.value.selectionStart
  
  // 在光标位置插入函数模板
  const functionTemplate = `${functionName}()`
  formula.value = 
    formula.value.substring(0, cursorPosition) + 
    functionTemplate + 
    formula.value.substring(formulaTextarea.value.selectionEnd)
  
  // 重新聚焦到输入框
  setTimeout(() => {
    if (formulaTextarea.value) {
      formulaTextarea.value.focus()
      // 设置光标位置到函数括号内，方便用户输入字段
      const newPosition = cursorPosition + functionName.length + 1
      formulaTextarea.value.setSelectionRange(newPosition, newPosition)
    }
  }, 0)
}

// 清空公式
const clearFormula = () => {
  formula.value = ''
}

// 公式输入处理
const onFormulaInput = () => {
  // 可以在这里添加实时验证或其他处理逻辑
}

// 格式化公式预览
const formattedFormula = computed(() => {
  if (!formula.value) return '暂无公式'
  return formula.value
})

// 初始化数据
const initializeData = async () => {
  try {
    // 获取表数据
    const tableData = await getCoreTables()
    tables.value = tableData
    
    // 获取每个表的字段数据
    for (const table of tableData) {
      const fields = await getTableFields(table.id)
      tableFields.value[table.id] = fields
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  initializeData()
})

// 处理函数

// 保存公式
const handleSave = () => {
  emit('update:modelValue', formula.value)
  dialogVisible.value = false
  emit('close')
}

// 取消编辑
const handleCancel = () => {
  dialogVisible.value = false
  emit('close')
}

// 导出方法供父组件使用
defineExpose({
  // 显示弹窗
  showDialog() {
    dialogVisible.value = true
  },
  // 隐藏弹窗
  hideDialog() {
    dialogVisible.value = false
  },
  getFormula: () => formula.value
})
</script>

<style scoped>
.enhanced-formula-editor {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.formula-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.formula-textarea-container {
  margin-bottom: 20px;
}

.formula-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.formula-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.function-help {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.function-help h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.help-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  min-height: 60px;
}

.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.function-item strong {
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.field-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.field-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.field-name {
  font-size: 14px;
  color: #303133;
  margin-right: 10px;
}

.field-type .el-tag {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 滚动下拉菜单样式 */
.scrollable-dropdown {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 分组标题样式 */
.dropdown-group-header {
  padding: 0 10px;
  margin: 5px 0;
}

.group-toggle-btn {
  padding: 2px 5px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  justify-content: flex-start;
}

.group-toggle-btn:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

/* 下拉菜单项样式调整 */
.el-dropdown-menu__item {
  font-size: 13px;
  padding: 5px 15px;
  line-height: 1.5;
}
</style>