<template>
  <div class="role-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <div style="float: right;">
            <el-button type="primary" @click="openCreateDialog">新增角色</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input 
              v-model="filters.name" 
              placeholder="角色名称" 
              clearable
            />
          </el-col>
          <el-col :span="8">
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
          <el-col :span="8">
            <el-button type="primary" @click="searchRoles">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 角色表格 -->
      <el-table 
        :data="paginatedData" 
        style="width: 100%; margin-top: 20px;" 
        border
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="200" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="userCount" label="用户数量" width="120" />
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
            <el-button size="small" @click="configurePermissions(scope.row)">权限配置</el-button>
            <el-button size="small" type="danger" @click="deleteRole(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredRoles.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right;"
      />
    </el-card>
    
    <!-- 新增/编辑角色对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        :model="currentRole" 
        :rules="formRules" 
        ref="roleForm" 
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="currentRole.name" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="currentRole.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentRole.status"
            active-value="enabled"
            inactive-value="disabled"
          />
          <span style="margin-left: 10px;">
            {{ currentRole.status === 'enabled' ? '启用' : '停用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRole">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 权限配置对话框 -->
    <el-dialog 
      title="权限配置" 
      v-model="permissionDialogVisible" 
      width="800px"
      @close="resetPermissionForm"
    >
      <div style="max-height: 500px; overflow-y: auto;">
        <el-tree
          ref="permissionTree"
          :data="permissions"
          show-checkbox
          node-key="id"
          :props="defaultProps"
          :default-checked-keys="checkedPermissions"
          :default-expanded-keys="expandedKeys"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">保存</el-button>
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
  status: ''
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
const permissionDialogVisible = ref(false)

// 表单数据
const currentRole = reactive({
  id: 0,
  name: '',
  description: '',
  status: 'enabled'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度应在2-20个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { max: 100, message: '角色描述最多100个字符', trigger: 'blur' }
  ]
}

// 表格引用
const roleForm = ref()

// 权限树引用
const permissionTree = ref()

// 角色数据
const roles = ref([
  {
    id: 1,
    name: '超级管理员',
    description: '拥有系统所有权限',
    userCount: 1,
    status: 'enabled'
  },
  {
    id: 2,
    name: '运营人员',
    description: '负责日常运营管理',
    userCount: 3,
    status: 'enabled'
  },
  {
    id: 3,
    name: '数据分析师',
    description: '负责数据分析和报表制作',
    userCount: 2,
    status: 'enabled'
  },
  {
    id: 4,
    name: '访客',
    description: '仅可查看部分公开数据',
    userCount: 0,
    status: 'disabled'
  }
])

// 权限数据
const permissions = ref([
  {
    id: 1,
    label: '指标管理',
    children: [
      {
        id: 11,
        label: '指标明细表管理',
        children: [
          { id: 111, label: '查看' },
          { id: 112, label: '新增' },
          { id: 113, label: '编辑' },
          { id: 114, label: '删除' }
        ]
      },
      {
        id: 12,
        label: '指标配置',
        children: [
          { id: 121, label: '查看' },
          { id: 122, label: '新增' },
          { id: 123, label: '编辑' },
          { id: 124, label: '删除' }
        ]
      },
      {
        id: 13,
        label: '指标监控',
        children: [
          { id: 131, label: '查看' },
          { id: 132, label: '新增' },
          { id: 133, label: '编辑' },
          { id: 134, label: '删除' }
        ]
      }
    ]
  },
  {
    id: 2,
    label: '系统管理',
    children: [
      {
        id: 21,
        label: '用户管理',
        children: [
          { id: 211, label: '查看' },
          { id: 212, label: '新增' },
          { id: 213, label: '编辑' },
          { id: 214, label: '删除' }
        ]
      },
      {
        id: 22,
        label: '角色管理',
        children: [
          { id: 221, label: '查看' },
          { id: 222, label: '新增' },
          { id: 223, label: '编辑' },
          { id: 224, label: '删除' }
        ]
      },
      {
        id: 23,
        label: '权限管理',
        children: [
          { id: 231, label: '查看' },
          { id: 232, label: '新增' },
          { id: 233, label: '编辑' },
          { id: 234, label: '删除' }
        ]
      }
    ]
  }
])

// 树形控件属性
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 当前选中的角色
const selectedRole = ref<any>(null)

// 已选中的权限
const checkedPermissions = ref<number[]>([])

// 默认展开的节点
const expandedKeys = ref([1, 2, 11, 12, 13, 21, 22, 23])

// 计算过滤后的角色数据
const filteredRoles = computed(() => {
  return roles.value.filter(role => {
    return (
      (filters.name === '' || role.name.includes(filters.name)) &&
      (filters.status === '' || role.status === filters.status)
    )
  })
})

// 计算分页数据
const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredRoles.value.slice(start, end)
})

// 查询角色
const searchRoles = () => {
  pagination.currentPage = 1
  ElMessage.success('查询成功')
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.status = ''
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
  dialogTitle.value = '新增角色'
  isEditing.value = false
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (role: any) => {
  dialogTitle.value = '编辑角色'
  isEditing.value = true
  Object.assign(currentRole, role)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(currentRole, {
    id: 0,
    name: '',
    description: '',
    status: 'enabled'
  })
  
  // 清除表单验证
  if (roleForm.value) {
    roleForm.value.resetFields()
  }
}

// 切换角色状态
const toggleStatus = (role: any) => {
  const action = role.status === 'enabled' ? '启用' : '停用'
  ElMessage.success(`已${action}角色 "${role.name}"`)
}

// 保存角色
const saveRole = () => {
  roleForm.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 编辑逻辑
        const index = roles.value.findIndex(item => item.id === currentRole.id)
        if (index !== -1) {
          roles.value[index] = { ...currentRole }
          ElMessage.success('角色更新成功')
        }
      } else {
        // 新增逻辑
        const newId = Math.max(...roles.value.map(item => item.id), 0) + 1
        roles.value.push({
          ...currentRole,
          id: newId,
          userCount: 0
        })
        ElMessage.success('角色添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 删除角色
const deleteRole = (role: any) => {
  if (role.userCount > 0) {
    ElMessage.warning('该角色下有关联用户，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除角色 "${role.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = roles.value.findIndex(item => item.id === role.id)
    if (index !== -1) {
      roles.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 配置权限
const configurePermissions = (role: any) => {
  selectedRole.value = role
  // 模拟获取该角色已有的权限
  checkedPermissions.value = [111, 112, 113, 121, 122, 131, 211, 212, 213]
  permissionDialogVisible.value = true
}

// 重置权限表单
const resetPermissionForm = () => {
  checkedPermissions.value = []
  selectedRole.value = null
}

// 保存权限配置
const savePermissions = () => {
  // 获取选中的权限节点
  const checkedNodes = permissionTree.value.getCheckedNodes(false, true)
  console.log('选中的权限:', checkedNodes)
  
  ElMessage.success(`"${selectedRole.value.name}" 的权限配置已保存`)
  permissionDialogVisible.value = false
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
.role-management {
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