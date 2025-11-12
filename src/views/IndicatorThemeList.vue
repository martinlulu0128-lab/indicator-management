<template>
  <div class="indicator-theme-list">
    <div class="header">
      <h2>指标主题汇总表管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建指标主题汇总表
      </el-button>
    </div>

    <el-table :data="tableData" class="theme-table" border>
      <el-table-column prop="name" label="报表名称" width="150" />
      <el-table-column prop="alias" label="报表别名" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="creator" label="创建人" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="modifier" label="最近修改人" width="120" />
      <el-table-column prop="modifyTime" label="最近修改时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleDesign(scope.row)">设计</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑/创建对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="报表名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="报表别名" prop="alias">
          <el-input v-model="form.alias" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表格数据
const tableData = ref([])

// 初始化表格数据
const initTableData = () => {
  const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
  if (savedReports.length > 0) {
    tableData.value = savedReports
  } else {
    // 如果localStorage中没有数据，则使用默认数据
    tableData.value = [
      {
        id: 1,
        name: '销售业绩汇总表',
        alias: 'sales_summary',
        description: '展示各区域销售业绩情况',
        creator: '张三',
        createTime: '2023-06-01 10:00:00',
        modifier: '李四',
        modifyTime: '2023-06-15 14:30:00'
      },
      {
        id: 2,
        name: '用户活跃度分析表',
        alias: 'user_activity',
        description: '分析用户活跃度变化趋势',
        creator: '王五',
        createTime: '2023-06-05 09:15:00',
        modifier: '赵六',
        modifyTime: '2023-06-18 16:45:00'
      },
      {
        id: 3,
        name: '产品销量排行表',
        alias: 'product_ranking',
        description: '展示各产品销量排行榜',
        creator: '孙七',
        createTime: '2023-06-10 11:20:00',
        modifier: '周八',
        modifyTime: '2023-06-20 13:10:00'
      }
    ]
    // 将默认数据保存到localStorage
    localStorage.setItem('indicatorThemeReports', JSON.stringify(tableData.value))
  }
  total.value = tableData.value.length
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(3)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

// 表单数据
const form = reactive({
  id: 0,
  name: '',
  alias: '',
  description: '',
  creator: '',
  createTime: '',
  modifier: '',
  modifyTime: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入报表名称', trigger: 'blur' }],
  alias: [{ required: true, message: '请输入报表别名', trigger: 'blur' }]
}

// 路由
const router = useRouter()

// 表单引用
const formRef = ref()

// 处理新建
const handleCreate = () => {
  // 跳转到设计页面，新建模式
  router.push('/indicator-theme-design/editor/new')
}

// 处理设计
const handleDesign = (row: any) => {
  // 跳转到设计页面，编辑模式
  router.push(`/indicator-theme-design/editor/${row.id}`)
}

// 处理删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除指标主题汇总表 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 删除操作
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      total.value--
      ElMessage.success('删除成功')
      
      // 更新localStorage中的数据
      const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
      const savedIndex = savedReports.findIndex((item: any) => item.id === row.id)
      if (savedIndex !== -1) {
        savedReports.splice(savedIndex, 1)
        localStorage.setItem('indicatorThemeReports', JSON.stringify(savedReports))
      }
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 处理提交
const handleSubmit = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑操作
        const index = tableData.value.findIndex(item => item.id === form.id)
        if (index !== -1) {
          // 更新修改时间
          form.modifier = '当前用户'
          form.modifyTime = new Date().toLocaleString()
          Object.assign(tableData.value[index], form)
          ElMessage.success('编辑成功')
          
          // 更新localStorage中的数据
          const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
          const savedIndex = savedReports.findIndex((item: any) => item.id === form.id)
          if (savedIndex !== -1) {
            savedReports[savedIndex] = tableData.value[index]
            localStorage.setItem('indicatorThemeReports', JSON.stringify(savedReports))
          }
        }
      } else {
        // 新建操作
        const savedReports = JSON.parse(localStorage.getItem('indicatorThemeReports') || '[]')
        const newId = savedReports.length > 0 ? Math.max(...savedReports.map((item: any) => item.id)) + 1 : 1
        const newItem = {
          ...form,
          id: newId,
          creator: '当前用户',
          createTime: new Date().toLocaleString(),
          modifier: '当前用户',
          modifyTime: new Date().toLocaleString()
        }
        tableData.value.push(newItem)
        total.value++
        ElMessage.success('创建成功')
        
        // 添加到localStorage
        savedReports.push(newItem)
        localStorage.setItem('indicatorThemeReports', JSON.stringify(savedReports))
      }
      dialogVisible.value = false
    }
  })
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  // 实际项目中需要重新加载数据
}

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  // 实际项目中需要重新加载数据
}

// 组件挂载时的操作
onMounted(() => {
  // 初始化表格数据
  initTableData()
})
</script>

<style scoped>
.indicator-theme-list {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  min-height: calc(100vh - 120px); /* 确保内容占满屏幕高度 */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.theme-table {
  margin-bottom: 20px;
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>