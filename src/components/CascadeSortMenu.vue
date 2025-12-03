<template>
  <el-popover
    placement="bottom-end"
    :width="200"
    trigger="click"
    :visible="visible"
    @hide="visible = false"
  >
    <template #reference>
      <el-button size="mini" class="sort-btn" type="default" @click="visible = true">
        <span>排序</span>
      </el-button>
    </template>
    
    <div class="sort-menu">
      <div class="sort-section">
        <div class="sort-section-title">按指标</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('hasIndicators-asc') }" 
          @click="handleSort('hasIndicators-asc')"
        >正序</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('hasIndicators-desc') }" 
          @click="handleSort('hasIndicators-desc')"
        >倒序</div>
      </div>
      
      <div class="sort-section">
        <div class="sort-section-title">按表名</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('name-asc') }" 
          @click="handleSort('name-asc')"
        >正序</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('name-desc') }" 
          @click="handleSort('name-desc')"
        >倒序</div>
      </div>
      
      <div class="sort-section">
        <div class="sort-section-title">按添加时间</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('createTime-asc') }" 
          @click="handleSort('createTime-asc')"
        >正序</div>
        <div 
          class="sort-item" 
          :class="{ active: isActive('createTime-desc') }" 
          @click="handleSort('createTime-desc')"
        >倒序</div>
      </div>
      
      <div class="sort-item clear-all" @click="handleSort('clear')">清除所有排序</div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElButton, ElPopover } from 'element-plus'

const visible = ref(false)
const emit = defineEmits<{
  'sort-change': [command: string]
}>()

// 接收当前排序状态
const props = defineProps<{
  currentSort?: string[]
}>()

// 检查排序项是否处于激活状态
const isActive = (command: string) => {
  return props.currentSort?.includes(command) || false
}

const handleSort = (command: string) => {
  // 立即关闭弹出层
  visible.value = false
  
  // 使用setTimeout确保DOM更新完成后再触发事件
  setTimeout(() => {
    emit('sort-change', command)
  }, 50)
}
</script>

<style scoped>
.sort-menu {
  padding: 8px 0;
}

.sort-section {
  margin-bottom: 8px;
}

.sort-section:last-child {
  margin-bottom: 0;
}

.sort-section-title {
  padding: 8px 16px;
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}

.sort-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s;
}

.sort-item:hover {
  background-color: #f5f7fa;
}

.sort-item.active {
  color: #409eff;
  font-weight: bold;
}

.sort-item.clear-all {
  border-top: 1px solid #ebeef5;
  margin-top: 8px;
  padding-top: 12px;
  color: #f56c6c;
  font-weight: bold;
}

.sort-btn {
  visibility: visible;
  z-index: 100;
}
</style>

<style scoped>
.sort-btn {
  margin-left: 10px;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  z-index: 1 !important;
}
</style>