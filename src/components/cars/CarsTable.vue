<template>
  <div class="cars-table-component">
    <!-- Загрузка -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="error-overlay">
      <ErrorMessage 
        :message="error" 
        :retryable="true" 
        @retry="$emit('refresh')"
      />
    </div>
    
    <!-- Таблица -->
    <div v-else class="table-wrapper">
      <table class="cars-table">
        <thead>
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              :class="column.class"
              @click="sortBy(column.key)"
              :style="column.style"
            >
              <div class="column-header">
                <span>{{ column.label }}</span>
                <span 
                  v-if="sortColumn === column.key" 
                  class="sort-icon"
                >
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
            <th class="actions-column">Действия</th>
          </tr>
        </thead>
        <tbody>
          <!-- ИСПРАВЛЕНИЕ: Используем cars вместо paginatedCars -->
          <tr 
            v-for="car in cars" 
            :key="getCarKey(car)"
            @click="$emit('row-click', car)"
            :class="{ 
              'selected': selectedCar && selectedCar.plate === car.plate,
              'suspicious': car.status === 'suspicious',
              'watched': car.status === 'watched'
            }"
          >
            <td class="plate-cell">
              <div class="plate-content">
                <span class="plate-number">{{ car.plate }}</span>
                <span v-if="car.is_new" class="new-badge">NEW</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="car.status">
                {{ getStatusLabel(car.status) }}
              </span>
            </td>
            <td class="date-cell">
              {{ formatDate(car.first_seen) }}
            </td>
            <td class="date-cell">
              {{ formatDate(car.last_seen) }}
            </td>
            <td class="duration-cell">
              {{ formatDuration(car.total_duration_seconds) }}
            </td>
            <td class="count-cell">
              <span class="count-badge">{{ car.count }}</span>
            </td>
            <td class="actions-cell">
              <div class="actions-buttons">
                <button 
                  @click.stop="$emit('details', car)"
                  class="action-btn details-btn"
                  title="Подробнее"
                >
                  👁️
                </button>
                <button 
                  @click.stop="$emit('map', car)"
                  class="action-btn map-btn"
                  title="На карте"
                >
                  🗺️
                </button>
                <button 
                  @click.stop="$emit('export', car)"
                  class="action-btn export-btn"
                  title="Экспорт"
                >
                  📤
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Пустое состояние -->
      <div v-if="cars.length === 0" class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>Автомобили не найдены</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, toRefs } from 'vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

const props = defineProps({
  cars: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  selectedCar: {
    type: Object,
    default: null
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 25
  }
})

const emit = defineEmits([
  'row-click',
  'details',
  'map',
  'export',
  'refresh',
  'sort'
])

// Создаем реактивные ссылки на props
const { cars, isLoading, error, selectedCar, currentPage, pageSize } = toRefs(props)

// Сортировка
const sortColumn = ref('last_seen')
const sortDirection = ref('desc')

const columns = [
  { key: 'plate', label: 'Номер авто', class: 'plate-column' },
  { key: 'status', label: 'Статус', class: 'status-column' },
  { key: 'first_seen', label: 'Первое появление', class: 'date-column' },
  { key: 'last_seen', label: 'Последнее появление', class: 'date-column' },
  { key: 'total_duration_seconds', label: 'Общее время', class: 'duration-column' },
  { key: 'count', label: 'Появления', class: 'count-column' }
]

// ИСПРАВЛЕНИЕ: Убираем локальную сортировку и пагинацию
// Данные уже отсортированы и пагинированы в store

// Следим за изменением данных для отладки
watch(cars, (newCars) => {
  console.log('CarsTable: Cars data updated, count:', newCars?.length || 0)
  if (newCars?.length > 0) {
    console.log('CarsTable: First car:', newCars[0].plate, 'Last car:', newCars[newCars.length - 1].plate)
  }
}, { deep: true })

// Следим за изменением текущей страницы
watch(currentPage, (newPage, oldPage) => {
  console.log('CarsTable: Page changed from', oldPage, 'to', newPage)
})

// Функции форматирования
function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`
  }
  return `${minutes}м`
}

function getStatusLabel(status) {
  const labels = {
    'suspicious': 'Подозрительный',
    'watched': 'Под наблюдением',
    'normal': 'Обычный'
  }
  return labels[status] || status
}

// Генерируем уникальный ключ для каждой машины
function getCarKey(car) {
  return `${car.plate}-${car.last_seen}-${currentPage.value}`
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
  
  emit('sort', { column: sortColumn.value, direction: sortDirection.value })
}
</script>

<style scoped>
.cars-table-component {
  position: relative;
  min-height: 400px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.8);
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #1a1a2e;
  border-top: 3px solid #0f3460;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-wrapper {
  overflow-x: auto;
}

.cars-table {
  width: 100%;
  border-collapse: collapse;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.cars-table th {
  background: #16213e;
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 16px 12px;
  border-bottom: 2px solid #0f3460;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background 0.2s;
}

.cars-table th:hover {
  background: rgba(15, 52, 96, 0.3);
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sort-icon {
  font-size: 12px;
  color: #0f3460;
}

.cars-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(15, 52, 96, 0.2);
  color: #d0d0e0;
  transition: background 0.2s;
}

.cars-table tbody tr {
  cursor: pointer;
  transition: all 0.2s;
}

.cars-table tbody tr:hover {
  background: rgba(15, 52, 96, 0.1);
}

.cars-table tbody tr.selected {
  background: rgba(15, 52, 96, 0.2);
  border-left: 3px solid #0f3460;
}

.cars-table tbody tr.suspicious {
  background: rgba(220, 53, 69, 0.05);
}

.cars-table tbody tr.watched {
  background: rgba(255, 193, 7, 0.05);
}

/* Специальные стили для ячеек */
.plate-cell {
  font-weight: 600;
}

.plate-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plate-number {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  letter-spacing: 1px;
  background: rgba(15, 52, 96, 0.2);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(15, 52, 96, 0.3);
}

.new-badge {
  background: #dc3545;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.status-badge.suspicious {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.status-badge.watched {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-badge.normal {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.date-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.duration-cell {
  font-weight: 600;
  white-space: nowrap;
}

.count-cell {
  text-align: center;
}

.count-badge {
  display: inline-block;
  min-width: 30px;
  padding: 4px 10px;
  background: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

.actions-cell {
  width: 1%;
  white-space: nowrap;
}

.actions-buttons {
  display: flex;
  gap: 6px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

tr:hover .actions-buttons {
  opacity: 1;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.details-btn {
  background: rgba(15, 52, 96, 0.2);
  color: white;
}

.details-btn:hover {
  background: #0f3460;
}

.map-btn {
  background: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
}

.map-btn:hover {
  background: #6f42c1;
  color: white;
}

.export-btn {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.export-btn:hover {
  background: #28a745;
  color: white;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  background: #1a1a2e;
  border-radius: 8px;
  border: 2px dashed #0f3460;
  margin-top: 20px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 15px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 18px;
}

.empty-state p {
  margin: 0;
  color: #b0b0c0;
  font-size: 14px;
}
</style>