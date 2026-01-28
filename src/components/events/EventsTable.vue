<template>
  <div class="events-table-component">
    <!-- Загрузка -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Загрузка событий...</p>
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
      <table class="events-table">
        <thead>
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              :class="column.class"
              @click="sortBy(column.key)"
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
          <tr 
            v-for="event in paginatedEvents" 
            :key="event.id"
            @click="$emit('row-click', event)"
            :class="{ 
              'selected': selectedEvent && selectedEvent.id === event.id,
              'type-person_phone': event.type === 'person_phone',
              'type-suspicious_car': event.type === 'suspicious_car',
              'type-crowd': event.type === 'crowd'
            }"
          >
            <td class="time-cell">
              {{ formatDateTime(event.timestamp) }}
            </td>
            <td class="camera-cell">
              <div class="camera-info">
                <span class="camera-icon">📹</span>
                <span class="camera-name">{{ event.camera_name || `Камера ${event.camera_id}` }}</span>
              </div>
            </td>
            <td>
              <span class="event-type-badge" :class="event.type">
                {{ getEventTypeLabel(event.type) }}
              </span>
            </td>
            <td class="description-cell">
              <span class="description-text" :title="event.description">
                {{ truncateText(event.description, 50) }}
              </span>
            </td>
            <td class="asset-cell">
              <div class="asset-indicators">
                <span 
                  v-if="event.thumbnail_url" 
                  class="asset-indicator has-thumbnail"
                  title="Есть ключевой кадр"
                >
                  🖼️
                </span>
                <span 
                  v-else 
                  class="asset-indicator no-thumbnail"
                  title="Нет ключевого кадра"
                >
                  ❌
                </span>
                <span 
                  v-if="event.has_clip" 
                  class="asset-indicator has-clip"
                  title="Есть видеофрагмент"
                >
                  🎬
                </span>
                <span 
                  v-else 
                  class="asset-indicator no-clip"
                  title="Нет видеофрагмента"
                >
                  ❌
                </span>
              </div>
            </td>
            <td class="actions-cell">
              <div class="actions-buttons">
                <button 
                  @click.stop="$emit('details', event)"
                  class="action-btn details-btn"
                  title="Подробнее"
                >
                  👁️
                </button>
                <button 
                  v-if="event.has_clip"
                  @click.stop="$emit('play', event)"
                  class="action-btn play-btn"
                  title="Воспроизвести"
                >
                  ▶️
                </button>
                <button 
                  @click.stop="$emit('export', event)"
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
      <div v-if="paginatedEvents.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>События не найдены</h3>
        <p>Попробуйте изменить параметры фильтров</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

const props = defineProps({
  events: {
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
  selectedEvent: {
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
  'play',
  'export',
  'refresh',
  'sort'
])

// Сортировка
const sortColumn = ref('timestamp')
const sortDirection = ref('desc')

const columns = [
  { key: 'timestamp', label: 'Время', class: 'time-column' },
  { key: 'camera_name', label: 'Камера', class: 'camera-column' },
  { key: 'type', label: 'Тип события', class: 'type-column' },
  { key: 'description', label: 'Описание', class: 'description-column' },
  { key: 'assets', label: 'Материалы', class: 'assets-column' }
]

// Сортировка данных
const sortedEvents = computed(() => {
  if (!props.events.length) return []
  
  return [...props.events].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Специальная обработка для дат
    if (sortColumn.value === 'timestamp') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    // Специальная обработка для строк (регистронезависимо)
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// Пагинация
const paginatedEvents = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize
  const end = start + props.pageSize
  return sortedEvents.value.slice(start, end)
})

// Функции форматирования
function formatDateTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function truncateText(text, maxLength) {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getEventTypeLabel(type) {
  const labels = {
    'person_phone': '📱 Человек с телефоном',
    'suspicious_car': '🚗 Подозрительный автомобиль',
    'crowd': '👥 Скопление группы'
  }
  return labels[type] || type
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
.events-table-component {
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

.events-table {
  width: 100%;
  border-collapse: collapse;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.events-table th {
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

.events-table th:hover {
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

.events-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(15, 52, 96, 0.2);
  color: #d0d0e0;
  transition: background 0.2s;
}

.events-table tbody tr {
  cursor: pointer;
  transition: all 0.2s;
}

.events-table tbody tr:hover {
  background: rgba(15, 52, 96, 0.1);
}

.events-table tbody tr.selected {
  background: rgba(15, 52, 96, 0.2);
  border-left: 3px solid #0f3460;
}

.events-table tbody tr.type-person_phone {
  background: rgba(255, 193, 7, 0.05);
}

.events-table tbody tr.type-suspicious_car {
  background: rgba(220, 53, 69, 0.05);
}

.events-table tbody tr.type-crowd {
  background: rgba(23, 162, 184, 0.05);
}

/* Специальные стили для ячеек */
.time-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.camera-cell {
  min-width: 150px;
}

.camera-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.camera-icon {
  opacity: 0.7;
}

.camera-name {
  font-weight: 500;
}

.event-type-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.event-type-badge.person_phone {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.event-type-badge.suspicious_car {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.event-type-badge.crowd {
  background: rgba(23, 162, 184, 0.2);
  color: #17a2b8;
  border: 1px solid rgba(23, 162, 184, 0.3);
}

.description-cell {
  max-width: 300px;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.asset-cell {
  width: 1%;
  white-space: nowrap;
}

.asset-indicators {
  display: flex;
  gap: 10px;
}

.asset-indicator {
  font-size: 18px;
  display: inline-block;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.has-thumbnail {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.no-thumbnail {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.has-clip {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.no-clip {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
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

.play-btn {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.play-btn:hover {
  background: #28a745;
  color: white;
}

.export-btn {
  background: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
}

.export-btn:hover {
  background: #6f42c1;
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