<template>
  <div class="formula-popup-editor">
    <!-- 公式编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="公式编辑"
      width="800px"
      :before-close="handleClose"
      append-to-body
    >
      <div class="formula-editor-container">
        <div class="formula-toolbar">
          <el-dropdown @command="handleTableSelect" trigger="click">
            <el-button size="small" type="primary">
              <el-icon><Document /></el-icon>
              插入表字段
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-input 
                  v-model="tableSearchKeyword" 
                  placeholder="搜索表..." 
                  size="small"
                  clearable
                  style="padding: 5px 10px;"
                />
                <el-dropdown-item 
                  v-for="table in filteredTables" 
                  :key="table.id" 
                  :command="table"
                >
                  {{ table.description }}
                </el-dropdown-item>
                <el-dropdown-item v-if="filteredTables.length === 0" disabled>
                  未找到匹配的表
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
          
          <el-dropdown @command="handleFunctionSelect" trigger="click">
            <el-button size="small" type="success">
              <el-icon><MagicStick /></el-icon>
              添加函数
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="scrollable-dropdown">
                <el-input 
                  v-model="functionSearchKeyword" 
                  placeholder="搜索函数..." 
                  size="small"
                  clearable
                  style="padding: 5px 10px;"
                />
                
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
                  <el-dropdown-item 
                    v-for="func in filteredFunctions.filter(f => f.group === 'logical')" 
                    :key="func.name" 
                    :command="func.name"
                  >
                    {{ func.name }} - {{ func.description }}
                  </el-dropdown-item>
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
                  <el-dropdown-item 
                    v-for="func in filteredFunctions.filter(f => f.group === 'date')" 
                    :key="func.name" 
                    :command="func.name"
                  >
                    {{ func.name }} - {{ func.description }}
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button size="small" @click="clearCurrentFormula">
            <el-icon><Delete /></el-icon>
            清空当前公式
          </el-button>
        </div>
        
        <!-- 多公式编辑区域 -->
        <div class="multi-formula-container">
          <div 
            v-for="(formulaItem, index) in formulaList" 
            :key="index"
            class="formula-item"
          >
            <div class="formula-header">
              <span class="formula-title">公式 {{ index + 1 }}</span>
              <el-button 
                v-if="formulaList.length > 1"
                type="danger" 
                icon="Delete" 
                circle 
                size="small"
                @click="removeFormula(index)"
              />
            </div>
            <textarea
              v-model="formulaList[index]"
              placeholder="请输入公式，例如: ${销售明细表.销售金额} + ${销售明细表.折扣金额}"
              class="formula-textarea"
              @focus="currentFocusIndex = index"
            ></textarea>
          </div>
          
          <div class="formula-actions">
            <el-button 
              type="primary" 
              plain 
              icon="Plus" 
              @click="addFormula"
            >
              添加公式
            </el-button>
          </div>
        </div>
        
        <!-- 函数帮助预览 -->
        <div class="function-help-section" v-if="currentFunctionHelp">
          <h4>函数帮助:</h4>
          <div class="help-content">
            <div class="function-name">{{ currentFunctionHelp.name }}</div>
            <div class="function-description">{{ currentFunctionHelp.description }}</div>
            <div class="function-usage">
              <strong>用法:</strong> {{ currentFunctionHelp.usage }}
            </div>
            <div class="function-example" v-if="currentFunctionHelp.example">
              <strong>示例:</strong> {{ currentFunctionHelp.example }}
            </div>
          </div>
        </div>
        
        <!-- 公式预览 -->
        <div class="formula-preview-section">
          <h4>公式预览:</h4>
          <div class="preview-content">
            <div 
              v-for="(formula, index) in formulaList" 
              :key="index"
              class="preview-item"
            >
              <strong>公式 {{ index + 1 }}:</strong>
              <pre v-if="formula">{{ formula }}</pre>
              <pre v-else class="empty-formula">暂无公式内容</pre>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveFormulas">保存</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Document, Operation, Delete, Edit, MagicStick, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { getCoreTables, getTableFields } from '@/api/indicator'
import filter from '@/utils/filter'

// 定义组件属性
const props = defineProps<{
  modelValue: string
  dialogVisible?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:dialogVisible', value: boolean): void
}>()

// 弹窗可见性
const dialogVisible = ref(false)

// 监听外部dialogVisible变化
watch(() => props.dialogVisible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    openFormulaDialog()
  }
})

// 监听内部dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:dialogVisible', newVal)
})

// 公式列表
const formulaList = ref<string[]>([''])

// 当前焦点公式索引
const currentFocusIndex = ref(0)

// 表数据
const tables = ref<any[]>([])
const tableFields = ref<Record<number, any[]>>({})
const selectedTable = ref<any>(null)
const fieldDialogVisible = ref(false)

// 表搜索关键词
const tableSearchKeyword = ref('')

// 过滤后的表列表
const filteredTables = computed(() => {
  if (!tableSearchKeyword.value) {
    return tables.value
  }
  return filter(tables.value, table => 
    table.name.toLowerCase().includes(tableSearchKeyword.value.toLowerCase()) ||
    table.description.toLowerCase().includes(tableSearchKeyword.value.toLowerCase())
  )
})

// 函数列表 - 分为逻辑函数和日期函数两组
  const functionList = ref([
    // 逻辑函数
    { name: 'AND', description: '逻辑与', group: 'logical' },
    { name: 'CONTAIN', description: '判断查找范围是否包含要查找的内容', group: 'logical' },
    { name: 'FALSE', description: '返回逻辑值 FALSE', group: 'logical' },
    { name: 'IF', description: '条件判断', group: 'logical' },
    { name: 'IFBLANK', description: '检查目标值是否为空，非空时返回该值本身，否则返回第二个参数的值', group: 'logical' },
    { name: 'IFERROR', description: '检查目标值是否错误，没有错误时返回该值本身，否则返回第二个参数的值', group: 'logical' },
    { name: 'IFS', description: '判断是否满足一个或多个条件并返回第一个 TRUE 条件对应的结果', group: 'logical' },
    { name: 'ISBLANK', description: '检查目标值是否为空值，为空时结果为 true，否则为 false', group: 'logical' },
    { name: 'ISERROR', description: '检查某个值是否为错误值', group: 'logical' },
    { name: 'ISNUMBER', description: '检查目标值是否为数字，返回布尔值', group: 'logical' },
    { name: 'MAP', description: '将给定数据范围中的每个值映射到新值', group: 'logical' },
    { name: 'NOT', description: '逻辑非，反转条件的结果', group: 'logical' },
    { name: 'OR', description: '逻辑或，当任一条件为真时返回真', group: 'logical' },
    { name: 'RANK', description: '返回一个值在指定数据集中的排名', group: 'logical' },
    { name: 'RECORD_ID', description: '获取多维表格记录的唯一 ID 编号', group: 'logical' },
    { name: 'SWITCH', description: '通过与表达式进行比较，按命中条件返回相应的值', group: 'logical' },
    { name: 'TRUE', description: '返回逻辑值 TRUE', group: 'logical' },
    { name: 'CONTAINSALL', description: '判断查找范围是否包含所有要查找的内容', group: 'logical' },
    { name: 'CONTAINSONLY', description: '判断查找范围是否仅包含所有要查找的内容', group: 'logical' },
    { name: 'ISNULL', description: '检查目标值是否为空值，为空时结果为 true，否则为 false', group: 'logical' },
    { name: 'RANDOMBETWEEN', description: '生成指定范围内的随机整数', group: 'logical' },
    { name: 'RANDOMITEM', description: '从列表中随机选择一个元素', group: 'logical' },
    // 日期函数
    { name: 'DATE', description: '将代表年、月、日的数字转换为日期', group: 'date' },
    { name: 'DATEDIF', description: '返回起始日期和结束日期之间的天数、月数或年数', group: 'date' },
    { name: 'DAY', description: '以数字格式返回特定日期的日', group: 'date' },
    { name: 'DAYS', description: '返回起始日期与结束日期之间的天数', group: 'date' },
    { name: 'EDATE', description: '返回输入日期特定月数之前或者之后的日期', group: 'date' },
    { name: 'EOMONTH', description: '返回与开始日期相隔数月的某个月份最后一天的日期', group: 'date' },
    { name: 'HOUR', description: '以数字格式返回特定时间的小时部分', group: 'date' },
    { name: 'MINUTE', description: '以数字格式返回特定时间的分钟部分', group: 'date' },
    { name: 'MONTH', description: '以数字格式返回特定日期对应的月份', group: 'date' },
    { name: 'NETWORKDAYS', description: '返回起始日期和结束日期之间的净工作日天数', group: 'date' },
    { name: 'NOW', description: '返回当前日期和时间', group: 'date' },
    { name: 'SECOND', description: '以数字格式返回特定时间的秒钟部分', group: 'date' },
    { name: 'TODAY', description: '返回当天的日期', group: 'date' },
    { name: 'WEEKDAY', description: '返回目标日期在当周的第几天，结果以数字形式显示', group: 'date' },
    { name: 'WEEKNUM', description: '返回目标日期在当前年份的第几周', group: 'date' },
    { name: 'WORKDAY', description: '指定起始日期和所需要的工作日天数，返回结束日期', group: 'date' },
    { name: 'YEAR', description: '以数字格式返回给定日期所指定的年份', group: 'date' },
    { name: 'DURATION', description: '生成指定时长，给已有日期加上或减去该时长，可以计算出新的日期', group: 'date' }
  ])

// 函数搜索关键词
const functionSearchKeyword = ref('')

// 分组展开状态
const expandedGroups = ref({
  logical: true,
  date: true
})

// 切换分组展开/折叠
const toggleGroup = (group: string) => {
  expandedGroups.value[group as keyof typeof expandedGroups.value] = !expandedGroups.value[group as keyof typeof expandedGroups.value]
}

// 过滤后的函数列表
const filteredFunctions = computed(() => {
  if (!functionSearchKeyword.value) {
    return functionList.value
  }
  return filter(functionList.value, func => 
    func.name.toLowerCase().includes(functionSearchKeyword.value.toLowerCase()) ||
    func.description.toLowerCase().includes(functionSearchKeyword.value.toLowerCase())
  )
})

// 当前焦点公式的输入框引用
const formulaTextarea = ref<HTMLTextAreaElement | null>(null)

// 当前函数帮助信息
const currentFunctionHelp = computed(() => {
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  if (!currentFormula) return null
  
  // 查找当前公式中的函数
  const functionMatch = currentFormula.match(/([A-Z]+)\s*\(/)
  if (!functionMatch) return null
  
  const funcName = functionMatch[1]
  const func = functionList.value.find(f => f.name === funcName)
  if (!func) return null
  
  // 根据函数名返回详细的帮助信息
      const helpInfo: Record<string, any> = {
        // 逻辑函数
        'AND': {
          name: 'AND',
          description: '逻辑与，当所有参数均为逻辑 TRUE 时，返回 TRUE；当参数中任何一个为逻辑 FALSE，返回 FALSE',
          usage: 'AND(逻辑表达式1, [逻辑表达式2, ...])',
          example: 'AND(1=1,1=2)=false'
        },
        'CONTAIN': {
          name: 'CONTAIN',
          description: '判断查找范围是否包含要查找的内容。注：本函数不支持文本包含匹配，如有需要请使用 CONTAINTEXT 函数',
          usage: 'CONTAIN(查找范围, [要查找的值, ...])',
          example: 'IF(CONTAIN(${销售地},"韩国","日本"),"亚太市场","其他")'
        },
        'FALSE': {
          name: 'FALSE',
          description: '返回逻辑值 FALSE',
          usage: 'FALSE()',
          example: 'FALSE()=false'
        },
        'IF': {
          name: 'IF',
          description: '当判断条件为 TRUE 时返回一个值，为 FALSE 时返回另一个值',
          usage: 'IF(判断条件, 为 TRUE 时的返回值, [为 FALSE 时的返回值])',
          example: 'IF(1=2, "相同", "不相同") = 不相同'
        },
        'IFBLANK': {
          name: 'IFBLANK',
          description: '检查目标值是否为空，非空时返回该值本身，否则返回第二个参数的值',
          usage: 'IFBLANK(值, 空值情况的返回值)',
          example: 'IFBLANK(${成员姓名}, "未填写")'
        },
        'IFERROR': {
          name: 'IFERROR',
          description: '检查目标值是否错误，没有错误时返回该值本身，否则返回第二个参数的值',
          usage: 'IFERROR(值, 错误情况的返回值)',
          example: 'IFERROR(${数据}, "错误")'
        },
        'IFS': {
          name: 'IFS',
          description: '判断是否满足一个或多个条件并返回第一个 TRUE 条件对应的结果',
          usage: 'IFS(条件1, 值1, [条件2, ...], [值2, ...])',
          example: 'IFS(A>=80,"优秀",A>=60,"及格",TRUE,"不及格")'
        },
        'ISBLANK': {
          name: 'ISBLANK',
          description: '检查目标值是否为空值，为空时结果为 true，否则为 false',
          usage: 'ISBLANK(值)',
          example: 'ISBLANK(${成员姓名})'
        },
        'ISERROR': {
          name: 'ISERROR',
          description: '检查某个值是否为错误值',
          usage: 'ISERROR(值)',
          example: 'ISERROR(${数据})'
        },
        'ISNUMBER': {
          name: 'ISNUMBER',
          description: '检查目标值是否为数字，返回布尔值：如为数字，则返回 TRUE；如非数字，则返回 FALSE',
          usage: 'ISNUMBER(值)',
          example: 'ISNUMBER(1) = true\nISNUMBER("a") = false'
        },
        'MAP': {
          name: 'MAP',
          description: '将给定数据范围中的每个值映射到新值，即按照映射逻辑处理给定数据组中的每一个值，并返回由处理后元素组成的新数组',
          usage: 'MAP(数据范围, 映射逻辑)',
          example: '${销售总表}.FILTER(CurrentValue.${订单号}=${订单号}).${净价}.MAP(CurrentValue * 1.10)'
        },
        'NOT': {
          name: 'NOT',
          description: '对其参数的逻辑求反',
          usage: 'NOT(逻辑函数)',
          example: 'NOT(TRUE)=false'
        },
        'OR': {
          name: 'OR',
          description: '只要提供的参数中任何一个为逻辑真就返回 TRUE，如果提供的所有参数均为逻辑假则返回 FALSE',
          usage: 'OR(逻辑表达式1, [逻辑表达式2, ...])',
          example: 'OR(1=2, 1=1)=true'
        },
        'RANK': {
          name: 'RANK',
          description: '返回一个值在指定数据集中的排名',
          usage: 'RANK(值, 查找范围, [按升序])',
          example: 'Rank(3, List(4, 3, 2, 1), TRUE) = 3'
        },
        'RECORD_ID': {
          name: 'RECORD_ID',
          description: '获取多维表格记录的唯一 ID 编号',
          usage: 'RECORD_ID()',
          example: 'RECORD_ID()'
        },
        'SWITCH': {
          name: 'SWITCH',
          description: '通过与表达式进行比较，按命中条件返回相应的值',
          usage: 'SWITCH(表达式, 表达式1, 表达式1的值, [表达式2或默认值, ...], [表达式2的值, ...])',
          example: 'SWITCH(${序号},1,"周日",2,"周一",3,"周二","无")'
        },
        'TRUE': {
          name: 'TRUE',
          description: '返回逻辑值 TRUE',
          usage: 'TRUE()',
          example: 'TRUE()=true'
        },
        'CONTAINSALL': {
          name: 'CONTAINSALL',
          description: '判断查找范围是否包含所有要查找的内容',
          usage: 'CONTAINSALL(查找范围,[要查找的值,...])',
          example: 'IF(${所选科目}.CONTAINSALL("微观经济学","高等数学","大学英语"),"符合要求","有必选科目未选")'
        },
        'CONTAINSONLY': {
          name: 'CONTAINSONLY',
          description: '判断查找范围是否仅包含所有要查找的内容',
          usage: 'CONTAINSONLY(查找范围,[要查找的值,...])',
          example: 'IF(${学生答案}.CONTAINSONLY("A","B","C"),"正确","错误")=正确'
        },
        'ISNULL': {
          name: 'ISNULL',
          description: '检查目标值是否为空值，为空时结果为 true，否则为 false',
          usage: 'ISNULL(值)',
          example: 'ISNULL(${字段1})'
        },
        'RANDOMBETWEEN': {
          name: 'RANDOMBETWEEN',
          description: '生成指定范围内的随机整数',
          usage: 'RANDOMBETWEEN(最小整数，最大整数，[是否持续更新])',
          example: 'RANDOMBETWEEN(1,10)'
        },
        'RANDOMITEM': {
          name: 'RANDOMITEM',
          description: '从列表中随机选择一个元素',
          usage: 'RANDOMITEM(列表, [是否持续更新])',
          example: 'LIST("炸鸡", "牛肉面", "披萨", "麻辣香锅", "汉堡").RANDOMITEM()=披萨'
        },
        // 日期函数
        'DATE': {
          name: 'DATE',
          description: '将代表年、月、日的数字转换为日期',
          usage: 'DATE(年, 月, 日)',
          example: 'DATE(2023, 12, 25)'
        },
        'DATEDIF': {
          name: 'DATEDIF',
          description: '返回起始日期和结束日期之间的天数、月数或年数',
          usage: 'DATEDIF(起始日期, 结束日期, 单位)',
          example: 'DATEDIF("2023-01-01","2023-01-08","D")=7'
        },
        'DAY': {
          name: 'DAY',
          description: '以数字格式返回特定日期的日',
          usage: 'DAY(日期值)',
          example: 'DAY("2023-01-03")=3'
        },
        'DAYS': {
          name: 'DAYS',
          description: '返回起始日期与结束日期之间的天数',
          usage: 'DAYS(结束日期, 起始日期)',
          example: 'DAYS("2023-01-08","2023-01-01")=7'
        },
        'EDATE': {
          name: 'EDATE',
          description: '返回输入日期特定月数之前或者之后的日期',
          usage: 'EDATE(开始日期, 月数)',
          example: 'EDATE("2023/01/31", 1) = 2023/02/28\nEDATE("2023/01/01", -1) = 2022/12/01'
        },
        'EOMONTH': {
          name: 'EOMONTH',
          description: '返回与开始日期相隔数月的某个月份最后一天的日期',
          usage: 'EOMONTH(开始日期, 月数)',
          example: 'EOMONTH("2023-1-1", 1)=2023/2/28\nEOMONTH("2023-3-1", -1)=2023/02/28'
        },
        'HOUR': {
          name: 'HOUR',
          description: '以数字格式返回特定时间的小时部分',
          usage: 'HOUR(时间)',
          example: 'HOUR("11:40:59")=11'
        },
        'MINUTE': {
          name: 'MINUTE',
          description: '以数字格式返回特定时间的分钟部分',
          usage: 'MINUTE(时间)',
          example: 'MINUTE("11:40:59")=40'
        },
        'MONTH': {
          name: 'MONTH',
          description: '以数字格式返回特定日期对应的月份',
          usage: 'MONTH(日期值)',
          example: 'MONTH("2023-12-01")=12'
        },
        'NETWORKDAYS': {
          name: 'NETWORKDAYS',
          description: '返回起始日期和结束日期之间的净工作日天数',
          usage: 'NETWORKDAYS(起始日期, 结束日期, [节假日])',
          example: 'NETWORKDAYS("2023-01-01","2023-01-12")=8'
        },
        'NOW': {
          name: 'NOW',
          description: '返回当前日期和时间',
          usage: 'NOW()',
          example: 'NOW()=2023/01/01 00:00'
        },
        'SECOND': {
          name: 'SECOND',
          description: '以数字格式返回特定时间的秒钟部分',
          usage: 'SECOND(时间)',
          example: 'SECOND("11:40:59")=59'
        },
        'TODAY': {
          name: 'TODAY',
          description: '返回当天的日期',
          usage: 'TODAY()',
          example: 'TODAY()=2023/01/01'
        },
        'WEEKDAY': {
          name: 'WEEKDAY',
          description: '返回目标日期在当周的第几天，结果以数字形式显示',
          usage: 'WEEKDAY(日期值, [类型])',
          example: 'WEEKDAY("2023-01-01")=1'
        },
        'WEEKNUM': {
          name: 'WEEKNUM',
          description: '返回目标日期在当前年份的第几周',
          usage: 'WEEKNUM(日期, [类型])',
          example: 'WEEKNUM("2023-01-01")=1'
        },
        'WORKDAY': {
          name: 'WORKDAY',
          description: '指定起始日期和所需要的工作日天数，返回结束日期',
          usage: 'WORKDAY(起始日期, 天数, [节假日])',
          example: 'WORKDAY("2023/01/01",7)=2023/01/11'
        },
        'YEAR': {
          name: 'YEAR',
          description: '以数字格式返回给定日期所指定的年份',
          usage: 'YEAR(日期值)',
          example: 'YEAR("2023-01-01")=2023'
        },
        'DURATION': {
          name: 'DURATION',
          description: '生成指定时长，给已有日期加上或减去该时长，可以计算出新的日期',
          usage: 'DURATION(天数, [小时数], [分钟数], [秒数])',
          example: '当前时间加上 12 小时后的日期和时间\nNOW()+DURATION(0, 12)=2023/06/05 22:00\n当前时间减去一天零两小时的日期和时间\nNOW()-DURATION(1, 2)=2023/06/03 21:30'
        }
      }
  
  return helpInfo[funcName] || {
    name: func.name,
    description: func.description
  }
})

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

// 打开公式编辑弹窗
const openFormulaDialog = () => {
  // 解析传入的公式值
  if (props.modelValue) {
    const lines = props.modelValue.split('\n');
    formulaList.value = filter(lines, (f) => f.trim() !== '');
    if (formulaList.value.length === 0) {
      formulaList.value = ['']
    }
  } else {
    formulaList.value = ['']
  }
  dialogVisible.value = true
}

// 关闭弹窗处理
const handleClose = (done: () => void) => {
  done()
}

// 添加公式
const addFormula = () => {
  formulaList.value.push('')
}

// 删除公式
const removeFormula = (index: number) => {
  if (formulaList.value.length > 1) {
    formulaList.value.splice(index, 1)
  }
}

// 清空当前公式
const clearCurrentFormula = () => {
  if (formulaList.value[currentFocusIndex.value]) {
    formulaList.value[currentFocusIndex.value] = ''
  }
}

// 处理表选择
const handleTableSelect = (table: any) => {
  selectedTable.value = table
  fieldDialogVisible.value = true
}

// 插入字段到公式中
const insertField = (field: any) => {
  if (!selectedTable.value) return
  
  const fieldName = `\${${selectedTable.value.description}.${field.name}}`
  
  // 在当前焦点公式中插入字段名
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  formulaList.value[currentFocusIndex.value] = currentFormula + fieldName
  
  // 关闭对话框
  fieldDialogVisible.value = false
}

// 处理运算符选择
const handleOperatorSelect = (operator: string) => {
  // 在当前焦点公式中插入运算符
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  formulaList.value[currentFocusIndex.value] = currentFormula + operator
}

// 处理函数选择
const handleFunctionSelect = (funcName: string) => {
  const currentFormula = formulaList.value[currentFocusIndex.value] || ''
  
  // 特殊处理WHERE函数，使用不同的格式
  let insertText = ''
  
  if (funcName === 'WHERE') {
    insertText = `WHERE()`
  } else {
    insertText = `${funcName}()`
  }
  
  formulaList.value[currentFocusIndex.value] = currentFormula + insertText
}

// 保存公式
const saveFormulas = () => {
  // 过滤掉空公式并用换行符连接
  const formulas = filter(formulaList.value, f => f.trim() !== '');
  const formulaString = formulas.join('\n')
  emit('update:modelValue', formulaString)
  dialogVisible.value = false
}

// 取消编辑
const cancelEdit = () => {
  dialogVisible.value = false
}

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

// 导出方法供父组件使用
defineExpose({
  open: openFormulaDialog
})
</script>

<style scoped>
.formula-popup-editor {
  display: inline-block;
}

.formula-editor-container {
  padding: 20px 0;
}

.formula-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.multi-formula-container {
  margin-bottom: 20px;
}

.formula-item {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.formula-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.formula-title {
  font-weight: bold;
  color: #303133;
}

.formula-textarea {
  width: 100%;
  min-height: 100px;
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

.formula-actions {
  margin-top: 10px;
}

.function-help-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  margin-bottom: 20px;
}

.function-help-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409eff;
}

.help-content {
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.function-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.function-description {
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.5;
}

.function-usage,
.function-example {
  margin-bottom: 8px;
  line-height: 1.5;
}

.function-usage strong,
.function-example strong {
  color: #409eff;
}

.formula-preview-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.formula-preview-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.preview-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.preview-item {
  margin-bottom: 15px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item pre {
  margin: 5px 0 0 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
}

.empty-formula {
  color: #909399;
  font-style: italic;
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