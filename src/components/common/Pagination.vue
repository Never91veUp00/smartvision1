<template>
  <div class="pagination">
    <div class="pagination-info">
      Показано {{ startItem }}-{{ endItem }} из {{ totalItems }}
    </div>
    
    <div class="pagination-controls">
      <button 
        @click="goToPage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="pagination-btn"
        title="Предыдущая страница"
      >
        ←
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="goToPage(page)"
          :class="{ 
            'page-btn': true,
            'active': page === currentPage,
            'disabled': page === '...'
          }"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        @click="goToPage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="pagination-btn"
        title="Следующая страница"
      >
        →
      </button>
    </div>
    
    <div class="page-size-selector">
      <label for="page-size">На странице:</label>
      <select 
        id="page-size"
        v-model="localPageSize" 
        @change="onPageSizeChange"
        class="page-size-select"
      >
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 25
  },
  totalItems: {
    type: Number,
    default: 0
  },
  visiblePages: {
    type: Array,
    default: () => []
  },
  startItem: {
    type: Number,
    default: 1
  },
  endItem: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['page-change', 'page-size-change'])

const localPageSize = ref(props.pageSize)

// Вычисляемые свойства
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize)
})

const startItem = computed(() => props.startItem)

const endItem = computed(() => props.endItem)

// Методы
function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('page-change', page)
}

function onPageSizeChange() {
  emit('page-size-change', parseInt(localPageSize.value))
}

// Следим за изменением pageSize извне
watch(() => props.pageSize, (newValue) => {
  localPageSize.value = newValue
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #1a1a2e;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.pagination-info {
  color: #b0b0c0;
  font-size: 14px;
  min-width: 150px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #1a4a7a;
  border-color: #533483;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
  margin: 0 10px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #1a4a7a;
}

.page-btn.active {
  background: #0f3460;
  font-weight: 600;
  border-color: #533483;
}

.page-btn.disabled {
  background: transparent;
  border: none;
  cursor: default;
  min-width: 24px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
}

.page-size-selector label {
  color: #b0b0c0;
  font-size: 14px;
}

.page-size-select {
  padding: 8px 12px;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
}
</style>