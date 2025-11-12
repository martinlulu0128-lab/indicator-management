<template>
  <div class="user-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div style="float: right;">
            <el-button type="primary" @click="openCreateDialog">新增用户</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input 
              v-model="filters.name" 
              placeholder="用户名/姓名" 
              clearable
            />
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
            <el-select 
              v-model="filters.role" 
              placeholder="角色" 
              clearable 
              style="width: 100%"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="运营人员" value="operator" />
              <el-option label="数据分析师" value="analyst" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="searchUsers">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 用户表格 -->
      <el-table 
        :data="paginatedData" 
        style="width: 100%; margin-top: 20px;" 
        border
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.role === 'admin' ? 'danger' : 
                     scope.row.role === 'operator' ? 'primary' : 'success'"
            >
              {{
                scope.row.role === 'admin' ? '管理员' :
                scope.row.role === 'operator' ? '运营人员' : '数据分析师'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录时间" width="180" />
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
            <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredUsers.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right;"
      />
    </el-card>
    
    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        :model="currentUser" 
        :rules="formRules" 
        ref="userForm" 
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="currentUser.username" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="currentUser.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="currentUser.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="currentUser.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="运营人员" value="operator" />
            <el-option label="数据分析师" value="analyst" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEditing">
          <el-input v-model="currentUser.password" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEditing">
          <el-input v-model="currentUser.confirmPassword" type="password" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentUser.status"
            active-value="enabled"
            inactive-value="disabled"
          />
          <span style="margin-left: 10px;">
            {{ currentUser.status === 'enabled' ? '启用' : '停用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser">保存</el-button>
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
  status: '',
  role: ''
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
const currentUser = reactive({
  id: 0,
  username: '',
  name: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  status: 'enabled'
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度应在2-10个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== currentUser.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 表格引用
const userForm = ref()

// 用户数据
const users = ref([
  {
    id: 1,
    username: 'admin',
    name: '管理员',
    email: 'admin@example.com',
    role: 'admin',
    lastLogin: '2023-06-07 14:30:25',
    status: 'enabled'
  },
  {
    id: 2,
    username: 'operator1',
    name: '运营人员1',
    email: 'operator1@example.com',
    role: 'operator',
    lastLogin: '2023-06-07 10:15:32',
    status: 'enabled'
  },
  {
    id: 3,
    username: 'analyst1',
    name: '分析师1',
    email: 'analyst1@example.com',
    role: 'analyst',
    lastLogin: '2023-06-06 16:42:18',
    status: 'enabled'
  },
  {
    id: 4,
    username: 'operator2',
    name: '运营人员2',
    email: 'operator2@example.com',
    role: 'operator',
    lastLogin: '2023-06-05 09:25:47',
    status: 'disabled'
  }
])

// 计算过滤后的用户数据
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    return (
      (filters.name === '' || user.username.includes(filters.name) || user.name.includes(filters.name)) &&
      (filters.status === '' || user.status === filters.status) &&
      (filters.role === '' || user.role === filters.role)
    )
  })
})

// 计算分页数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredUsers.value.slice(start, end)
})

// 查询用户
const searchUsers = () => {
  pagination.currentPage = 1
  ElMessage.success('查询成功')
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.status = ''
  filters.role = ''
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
  dialogTitle.value = '新增用户'
  isEditing.value = false
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (user: any) => {
  dialogTitle.value = '编辑用户'
  isEditing.value = true
  Object.assign(currentUser, user)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(currentUser, {
    id: 0,
    username: '',
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'enabled'
  })
  
  // 清除表单验证
  if (userForm.value) {
    userForm.value.resetFields()
  }
}

// 切换用户状态
const toggleStatus = (user: any) => {
  const action = user.status === 'enabled' ? '启用' : '停用'
  ElMessage.success(`已${action}用户 "${user.name}"`)
}

// 保存用户
const saveUser = () => {
  userForm.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 编辑逻辑
        const index = users.value.findIndex(item => item.id === currentUser.id)
        if (index !== -1) {
          users.value[index] = { ...currentUser }
          ElMessage.success('用户更新成功')
        }
      } else {
        // 新增逻辑
        const newId = Math.max(...users.value.map(item => item.id), 0) + 1
        users.value.push({
          ...currentUser,
          id: newId,
          lastLogin: '从未登录'
        })
        ElMessage.success('用户添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 删除用户
const deleteUser = (user: any) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = users.value.findIndex(item => item.id === user.id)
    if (index !== -1) {
      users.value.splice(index, 1)
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
.user-management {
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