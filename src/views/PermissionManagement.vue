<template>
  <div class="permission-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <div style="float: right;">
            <el-button type="primary" @click="openCreateDialog">新增权限</el-button>
          </div>
        </div>
      </template>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input 
              v-model="filters.name" 
              placeholder="权限名称" 
              clearable
            />
          </el-col>
          <el-col :span="8">
            <el-select 
              v-model="filters.module" 
              placeholder="所属模块" 
              clearable 
              style="width: 100%"
            >
              <el-option label="指标管理" value="indicator" />
              <el-option label="系统管理" value="system" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" @click="searchPermissions">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 权限树形表格 -->
      <el-table 
        :data="filteredPermissions" 
        style="width: 100%; margin-top: 20px;" 
        border
        row-key="id"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
        v-loading="loading"
      >
        <el-table-column prop="name" label="权限名称" width="250">
          <template #default="scope">
            <span :style="{ paddingLeft: (scope.row.level * 20) + 'px' }">
              {{ scope.row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="权限编码" width="200" />
        <el-table-column prop="module" label="所属模块" width="150">
          <template #default="scope">
            <el-tag :type="scope.row.module === 'indicator' ? 'success' : 'primary'">
              {{ scope.row.module === 'indicator' ? '指标管理' : '系统管理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="权限描述" />
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
            <el-button size="small" type="danger" @click="deletePermission(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增/编辑权限对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        :model="currentPermission" 
        :rules="formRules" 
        ref="permissionForm" 
        label-width="100px"
      >
        <el-form-item label="上级权限">
          <el-cascader
            v-model="currentPermission.parentId"
            :options="permissionOptions"
            :props="cascaderProps"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="currentPermission.name" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="currentPermission.code" />
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-select v-model="currentPermission.module" style="width: 100%">
            <el-option label="指标管理" value="indicator" />
            <el-option label="系统管理" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input v-model="currentPermission.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentPermission.status"
            active-value="enabled"
            inactive-value="disabled"
          />
          <span style="margin-left: 10px;">
            {{ currentPermission.status === 'enabled' ? '启用' : '停用' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermission">保存</el-button>
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
  module: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditing = ref(false)

// 表单数据
const currentPermission = reactive({
  id: 0,
  parentId: [],
  name: '',
  code: '',
  module: '',
  description: '',
  status: 'enabled',
  level: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 20, message: '权限名称长度应在2-20个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_:]+$/, message: '权限编码只能包含字母、数字、下划线和冒号', trigger: 'blur' }
  ],
  module: [{ required: true, message: '请选择所属模块', trigger: 'change' }],
  description: [
    { required: true, message: '请输入权限描述', trigger: 'blur' },
    { max: 100, message: '权限描述最多100个字符', trigger: 'blur' }
  ]
}

// 表格引用
const permissionForm = ref()

// 级联选择器属性
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: false,
  checkStrictly: true
}

// 权限数据（扁平化结构）
const permissions = ref([
  { id: 1, parentId: 0, name: '指标管理', code: 'indicator:*', module: 'indicator', description: '指标管理模块', status: 'enabled', level: 0 },
  { id: 11, parentId: 1, name: '指标明细表管理', code: 'indicator:table:*', module: 'indicator', description: '指标明细表管理', status: 'enabled', level: 1 },
  { id: 111, parentId: 11, name: '查看', code: 'indicator:table:view', module: 'indicator', description: '查看指标明细表', status: 'enabled', level: 2 },
  { id: 112, parentId: 11, name: '新增', code: 'indicator:table:create', module: 'indicator', description: '新增指标明细表', status: 'enabled', level: 2 },
  { id: 113, parentId: 11, name: '编辑', code: 'indicator:table:update', module: 'indicator', description: '编辑指标明细表', status: 'enabled', level: 2 },
  { id: 114, parentId: 11, name: '删除', code: 'indicator:table:delete', module: 'indicator', description: '删除指标明细表', status: 'enabled', level: 2 },
  { id: 12, parentId: 1, name: '指标配置', code: 'indicator:config:*', module: 'indicator', description: '指标配置管理', status: 'enabled', level: 1 },
  { id: 121, parentId: 12, name: '查看', code: 'indicator:config:view', module: 'indicator', description: '查看指标配置', status: 'enabled', level: 2 },
  { id: 122, parentId: 12, name: '新增', code: 'indicator:config:create', module: 'indicator', description: '新增指标配置', status: 'enabled', level: 2 },
  { id: 123, parentId: 12, name: '编辑', code: 'indicator:config:update', module: 'indicator', description: '编辑指标配置', status: 'enabled', level: 2 },
  { id: 124, parentId: 12, name: '删除', code: 'indicator:config:delete', module: 'indicator', description: '删除指标配置', status: 'enabled', level: 2 },
  { id: 13, parentId: 1, name: '指标监控', code: 'indicator:monitor:*', module: 'indicator', description: '指标监控管理', status: 'enabled', level: 1 },
  { id: 131, parentId: 13, name: '查看', code: 'indicator:monitor:view', module: 'indicator', description: '查看指标监控', status: 'enabled', level: 2 },
  { id: 132, parentId: 13, name: '新增', code: 'indicator:monitor:create', module: 'indicator', description: '新增指标监控', status: 'enabled', level: 2 },
  { id: 133, parentId: 13, name: '编辑', code: 'indicator:monitor:update', module: 'indicator', description: '编辑指标监控', status: 'enabled', level: 2 },
  { id: 134, parentId: 13, name: '删除', code: 'indicator:monitor:delete', module: 'indicator', description: '删除指标监控', status: 'enabled', level: 2 },
  { id: 2, parentId: 0, name: '系统管理', code: 'system:*', module: 'system', description: '系统管理模块', status: 'enabled', level: 0 },
  { id: 21, parentId: 2, name: '用户管理', code: 'system:user:*', module: 'system', description: '用户管理', status: 'enabled', level: 1 },
  { id: 211, parentId: 21, name: '查看', code: 'system:user:view', module: 'system', description: '查看用户', status: 'enabled', level: 2 },
  { id: 212, parentId: 21, name: '新增', code: 'system:user:create', module: 'system', description: '新增用户', status: 'enabled', level: 2 },
  { id: 213, parentId: 21, name: '编辑', code: 'system:user:update', module: 'system', description: '编辑用户', status: 'enabled', level: 2 },
  { id: 214, parentId: 21, name: '删除', code: 'system:user:delete', module: 'system', description: '删除用户', status: 'enabled', level: 2 },
  { id: 22, parentId: 2, name: '角色管理', code: 'system:role:*', module: 'system', description: '角色管理', status: 'enabled', level: 1 },
  { id: 221, parentId: 22, name: '查看', code: 'system:role:view', module: 'system', description: '查看角色', status: 'enabled', level: 2 },
  { id: 222, parentId: 22, name: '新增', code: 'system:role:create', module: 'system', description: '新增角色', status: 'enabled', level: 2 },
  { id: 223, parentId: 22, name: '编辑', code: 'system:role:update', module: 'system', description: '编辑角色', status: 'enabled', level: 2 },
  { id: 224, parentId: 22, name: '删除', code: 'system:role:delete', module: 'system', description: '删除角色', status: 'enabled', level: 2 },
  { id: 23, parentId: 2, name: '权限管理', code: 'system:permission:*', module: 'system', description: '权限管理', status: 'enabled', level: 1 },
  { id: 231, parentId: 23, name: '查看', code: 'system:permission:view', module: 'system', description: '查看权限', status: 'enabled', level: 2 },
  { id: 232, parentId: 23, name: '新增', code: 'system:permission:create', module: 'system', description: '新增权限', status: 'enabled', level: 2 },
  { id: 233, parentId: 23, name: '编辑', code: 'system:permission:update', module: 'system', description: '编辑权限', status: 'enabled', level: 2 },
  { id: 234, parentId: 23, name: '删除', code: 'system:permission:delete', module: 'system', description: '删除权限', status: 'enabled', level: 2 }
])

// 计算过滤后的权限数据（转换为树形结构）
const filteredPermissions = computed(() => {
  // 先过滤数据
  let filtered = permissions.value
  if (filters.name) {
    filtered = filtered.filter(permission => permission.name.includes(filters.name))
  }
  if (filters.module) {
    filtered = filtered.filter(permission => permission.module === filters.module)
  }
  
  // 转换为树形结构
  const map: any = {}
  const roots: any = []
  
  // 创建映射
  filtered.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })
  
  // 构建树形结构
  filtered.forEach(item => {
    const node = map[item.id]
    if (item.parentId === 0) {
      roots.push(node)
    } else {
      const parent = map[item.parentId]
      if (parent) {
        parent.children.push(node)
      }
    }
  })
  
  return roots
})

// 计算级联选择器的选项（排除当前编辑的权限及其子权限）
const permissionOptions = computed(() => {
  const options: any = []
  
  // 获取顶级权限
  const topLevel = permissions.value.filter(p => p.parentId === 0)
  
  topLevel.forEach(parent => {
    // 如果是编辑模式，且当前正在编辑这个权限，则跳过
    if (isEditing.value && currentPermission.id === parent.id) {
      return
    }
    
    const option: any = {
      id: parent.id,
      name: parent.name,
      children: []
    }
    
    // 获取子权限
    const children = permissions.value.filter(p => p.parentId === parent.id)
    children.forEach(child => {
      // 如果是编辑模式，且当前正在编辑这个权限，则跳过
      if (isEditing.value && currentPermission.id === child.id) {
        return
      }
      
      const childOption: any = {
        id: child.id,
        name: child.name,
        children: []
      }
      
      // 获取孙子权限
      const grandchildren = permissions.value.filter(p => p.parentId === child.id)
      grandchildren.forEach(grandchild => {
        // 如果是编辑模式，且当前正在编辑这个权限，则跳过
        if (isEditing.value && currentPermission.id === grandchild.id) {
          return
        }
        
        childOption.children.push({
          id: grandchild.id,
          name: grandchild.name
        })
      })
      
      option.children.push(childOption)
    })
    
    options.push(option)
  })
  
  return options
})

// 查询权限
const searchPermissions = () => {
  ElMessage.success('查询成功')
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.module = ''
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogTitle.value = '新增权限'
  isEditing.value = false
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (permission: any) => {
  dialogTitle.value = '编辑权限'
  isEditing.value = true
  Object.assign(currentPermission, permission)
  // 设置级联选择器的值
  currentPermission.parentId = permission.parentId
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(currentPermission, {
    id: 0,
    parentId: [],
    name: '',
    code: '',
    module: '',
    description: '',
    status: 'enabled',
    level: 0
  })
  
  // 清除表单验证
  if (permissionForm.value) {
    permissionForm.value.resetFields()
  }
}

// 切换权限状态
const toggleStatus = (permission: any) => {
  const action = permission.status === 'enabled' ? '启用' : '停用'
  ElMessage.success(`已${action}权限 "${permission.name}"`)
}

// 保存权限
const savePermission = () => {
  permissionForm.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 编辑逻辑
        const index = permissions.value.findIndex(item => item.id === currentPermission.id)
        if (index !== -1) {
          permissions.value[index] = { ...currentPermission }
          ElMessage.success('权限更新成功')
        }
      } else {
        // 新增逻辑
        const newId = Math.max(...permissions.value.map(item => item.id), 0) + 1
        const parentId = currentPermission.parentId || 0
        const parent = permissions.value.find(p => p.id === parentId)
        const level = parent ? parent.level + 1 : 0
        
        permissions.value.push({
          ...currentPermission,
          id: newId,
          parentId,
          level
        })
        ElMessage.success('权限添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 删除权限
const deletePermission = (permission: any) => {
  // 检查是否有子权限
  const hasChildren = permissions.value.some(p => p.parentId === permission.id)
  if (hasChildren) {
    ElMessage.warning('该权限下有子权限，请先删除子权限')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除权限 "${permission.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = permissions.value.findIndex(item => item.id === permission.id)
    if (index !== -1) {
      permissions.value.splice(index, 1)
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
.permission-management {
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