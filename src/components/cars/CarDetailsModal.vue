<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>🚗 Детали автомобиля</h2>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка деталей...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <div class="error-message">
            <h3>⚠️ Ошибка загрузки</h3>
            <p>{{ error }}</p>
            <button @click="loadCarDetails" class="retry-btn">Повторить</button>
          </div>
        </div>
        
        <div v-else class="car-details">
          <!-- Основная информация -->
          <div class="info-section">
            <div class="car-header">
              <div class="plate-display">{{ carDetails.plate || car.plate }}</div>
              <div class="status-display" :class="carDetails.status || car.status">
                {{ getStatusLabel(carDetails.status || car.status) }}
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Первое появление:</span>
                <span class="info-value">{{ formatDateTime(carDetails.first_seen || car.first_seen) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Последнее появление:</span>
                <span class="info-value">{{ formatDateTime(carDetails.last_seen || car.last_seen) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Общее время в зоне:</span>
                <span class="info-value">{{ formatDuration(carDetails.total_duration_seconds || car.total_duration_seconds) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Количество появлений:</span>
                <span class="info-value">{{ carDetails.count || car.count }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Зафиксирован камерами:</span>
                <span class="info-value">
                  <span 
                    v-for="cameraId in (carDetails.camera_ids || car.camera_ids || [])" 
                    :key="cameraId"
                    class="camera-tag"
                  >
                    📹 {{ getCameraName(cameraId) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <!-- Временной график -->
          <div v-if="hasStats" class="chart-section">
            <h3>📈 Активность по времени</h3>
            <div ref="chartContainer" class="chart-container">
              <canvas ref="chartCanvas"></canvas>
              <div v-if="isChartLoading" class="chart-loading">
                <div class="spinner-small"></div>
                Построение графика...
              </div>
            </div>
            <div class="chart-info">
              <p>График показывает количество появлений автомобиля за последние 30 дней</p>
            </div>
          </div>
          
          <!-- История появлений -->
          <div class="appearances-section">
            <h3>📅 История появлений ({{ appearancesCount }})</h3>
            <div class="appearances-list">
              <div 
                v-for="appearance in carDetails.appearances || []" 
                :key="`${appearance.timestamp}-${appearance.camera_id}`"
                class="appearance-item"
              >
                <div class="appearance-time">
                  {{ formatDateTime(appearance.timestamp) }}
                </div>
                <div class="appearance-camera">
                  📹 {{ appearance.camera_name || getCameraName(appearance.camera_id) }}
                </div>
                <div v-if="appearance.thumbnail_url" class="appearance-thumbnail">
                  <img 
                    :src="appearance.thumbnail_url" 
                    alt="Кадр"
                    @click="viewEvent(appearance.event_id)"
                    class="thumbnail-img"
                  />
                </div>
                <button 
                  v-if="appearance.event_id"
                  @click="viewEvent(appearance.event_id)"
                  class="view-event-btn"
                  title="Перейти к событию"
                >
                  👁️ Событие
                </button>
              </div>
            </div>
            
            <div v-if="!carDetails.appearances || carDetails.appearances.length === 0" class="no-appearances">
              <div class="no-appearances-icon">📭</div>
              <p>История появлений отсутствует</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="action-controls">
          <button @click="exportData" class="export-btn">
            📤 Экспорт данных
          </button>
          <button @click="toggleWatch" class="watch-btn" :class="{ watching: isWatching }">
            {{ isWatching ? '👁️ Отменить наблюдение' : '👁️ Наблюдать' }}
          </button>
          <button @click="close" class="close-action-btn">Закрыть (Esc)</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAppStore } from '@/store'

const props = defineProps({
  car: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

// Хранилище
const appStore = useAppStore()

// Локальное состояние
const isLoading = ref(false)
const error = ref(null)
const isChartLoading = ref(false)
const isWatching = ref(false)
const chartCanvas = ref(null)
const chartContainer = ref(null)
const chartInstance = ref(null)
const carDetails = ref({})

// Вычисляемые свойства
const hasStats = computed(() => {
  return carDetails.value.stats && carDetails.value.stats.length > 0
})

const appearancesCount = computed(() => {
  return carDetails.value.appearances ? carDetails.value.appearances.length : 0
})

// Загрузка деталей автомобиля
async function loadCarDetails() {
  if (!props.car.plate) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const details = await appStore.fetchCarDetails(props.car.plate)
    carDetails.value = details || {}
    
    // Загружаем график если есть данные
    if (carDetails.value.stats && carDetails.value.stats.length > 0) {
      await loadChart()
    }
  } catch (err) {
    error.value = 'Ошибка загрузки деталей: ' + err.message
    console.error('Error loading car details:', err)
  } finally {
    isLoading.value = false
  }
}

// Загрузка и отрисовка графика
async function loadChart() {
  isChartLoading.value = true
  
  try {
    // Ждем следующего тика для доступа к DOM
    await nextTick()
    
    if (chartCanvas.value && carDetails.value.stats && carDetails.value.stats.length > 0) {
      renderChart()
    }
  } catch (err) {
    console.error('Error loading chart:', err)
  } finally {
    isChartLoading.value = false
  }
}

// Построение графика
function renderChart() {
  if (!chartCanvas.value || !carDetails.value.stats || carDetails.value.stats.length === 0) {
    return
  }
  
  // Уничтожаем предыдущий график
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  
  // Подготавливаем данные
  const stats = carDetails.value.stats.slice(-30) // Берем последние 30 дней
  const labels = stats.map(s => {
    const date = new Date(s.date)
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
  })
  
  const data = stats.map(s => s.count)
  
  // Создаем график
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Количество появлений',
        data: data,
        borderColor: '#0f3460',
        backgroundColor: 'rgba(15, 52, 96, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0f3460',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#b0b0c0',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.9)',
          titleColor: '#fff',
          bodyColor: '#b0b0c0',
          borderColor: '#0f3460',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Появлений: ${context.raw}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(15, 52, 96, 0.2)'
          },
          ticks: {
            color: '#b0b0c0',
            maxRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(15, 52, 96, 0.2)'
          },
          ticks: {
            color: '#b0b0c0',
            callback: function(value) {
              return Math.round(value)
            }
          }
        }
      }
    }
  })
}

// Получение названия камеры по ID
function getCameraName(cameraId) {
  const cameras = appStore.cameras
  const camera = cameras.find(c => c.id === cameraId)
  return camera ? camera.name : `Камера ${cameraId}`
}

// Форматирование даты
function formatDateTime(timestamp) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование длительности
function formatDuration(seconds) {
  if (!seconds) return '—'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}д ${remainingHours}ч ${minutes}м`
  } else if (hours > 0) {
    return `${hours}ч ${minutes}м`
  } else {
    return `${minutes}м`
  }
}

// Лейблы статусов
function getStatusLabel(status) {
  const labels = {
    'suspicious': 'Подозрительный',
    'watched': 'Под наблюдением',
    'normal': 'Обычный'
  }
  return labels[status] || status
}

// Просмотр события
function viewEvent(eventId) {
  alert(`Переход к событию #${eventId}\n(в реальной версии будет открыто соответствующее событие)`)
}

// Экспорт данных
async function exportData() {
  const plate = carDetails.value.plate || props.car.plate
  if (!plate) return
  
  try {
    await appStore.exportCar(plate, 'json')
  } catch (err) {
    alert('Ошибка при экспорте: ' + err.message)
  }
}

// Наблюдение за автомобилем
function toggleWatch() {
  isWatching.value = !isWatching.value
  const plate = carDetails.value.plate || props.car.plate
  
  // Здесь будет API вызов для изменения статуса наблюдения
  alert(isWatching.value ? 
    `Включено наблюдение за автомобилем ${plate}` :
    `Отключено наблюдение за автомобилем ${plate}`
  )
}

function close() {
  emit('close')
}

// Наблюдатели
watch(() => props.car, (newCar) => {
  if (newCar && newCar.plate) {
    loadCarDetails()
  }
}, { immediate: true })

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    // Уничтожаем график при закрытии
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
  }
})

onMounted(() => {
  // Обработка клавиш
  const handleKeydown = (e) => {
    if (!props.isOpen) return
    
    if (e.key === 'Escape') {
      close()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  return () => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    
    // Уничтожаем график
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #1a1a2e;
  border-radius: 12px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 2px solid #0f3460;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: #0f3460;
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid #16213e;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.loading-state,
.error-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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

.error-message {
  text-align: center;
  background: #5d1a1a;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #ff6b6b;
  max-width: 500px;
}

.error-message h3 {
  margin: 0 0 10px 0;
  color: #ff6b6b;
}

.error-message p {
  margin: 0 0 20px 0;
  color: #b0b0c0;
}

.retry-btn {
  padding: 10px 30px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.retry-btn:hover {
  background: #ff5252;
}

.car-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-section {
  background: #16213e;
  border-radius: 10px;
  padding: 25px;
  border: 1px solid rgba(15, 52, 96, 0.3);
}

.car-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(15, 52, 96, 0.3);
}

.plate-display {
  font-family: 'Courier New', monospace;
  font-size: 32px;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #0f3460, #533483);
  padding: 10px 20px;
  border-radius: 8px;
  border: 2px solid #0f3460;
}

.status-display {
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.status-display.suspicious {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.status-display.watched {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-display.normal {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #b0b0c0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.camera-tag {
  display: inline-block;
  background: rgba(15, 52, 96, 0.2);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  margin-right: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  border: 1px solid rgba(15, 52, 96, 0.3);
}

.chart-section,
.appearances-section {
  background: #16213e;
  border-radius: 10px;
  padding: 25px;
  border: 1px solid rgba(15, 52, 96, 0.3);
}

.chart-section h3,
.appearances-section h3 {
  margin: 0 0 20px 0;
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  position: relative;
  height: 300px;
  background: #0f0f23;
  border-radius: 8px;
  padding: 15px;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 35, 0.8);
  color: white;
  font-size: 14px;
  gap: 10px;
}

.spinner-small {
  width: 30px;
  height: 30px;
  border: 3px solid #1a1a2e;
  border-top: 3px solid #0f3460;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.chart-info {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid #0f3460;
}

.chart-info p {
  margin: 0;
  color: #b0b0c0;
  font-size: 13px;
  text-align: center;
}

.appearances-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.appearance-item {
  display: grid;
  grid-template-columns: 200px 1fr auto auto;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(15, 52, 96, 0.3);
  transition: all 0.2s;
}

.appearance-item:hover {
  background: rgba(15, 52, 96, 0.1);
  border-color: #0f3460;
}

.appearance-time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #b0b0c0;
}

.appearance-camera {
  color: white;
  font-weight: 500;
}

.appearance-thumbnail {
  width: 60px;
  height: 60px;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #0f3460;
  transition: transform 0.2s;
}

.thumbnail-img:hover {
  transform: scale(1.05);
}

.view-event-btn {
  padding: 8px 16px;
  background: rgba(15, 52, 96, 0.3);
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.view-event-btn:hover {
  background: #0f3460;
}

.no-appearances {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  background: rgba(15, 15, 35, 0.5);
  border-radius: 8px;
  border: 2px dashed #0f3460;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-appearances-icon {
  font-size: 48px;
  opacity: 0.3;
}

.no-appearances p {
  margin: 0;
  font-size: 14px;
}

.modal-footer {
  padding: 20px 30px;
  background: #16213e;
  border-top: 1px solid #0f3460;
  border-radius: 0 0 10px 10px;
}

.action-controls {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.export-btn,
.watch-btn,
.close-action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn {
  background: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
  border: 1px solid rgba(111, 66, 193, 0.3);
}

.export-btn:hover {
  background: #6f42c1;
  color: white;
}

.watch-btn {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.watch-btn:hover {
  background: #ffc107;
  color: #212529;
}

.watch-btn.watching {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.watch-btn.watching:hover {
  background: #dc3545;
  color: white;
}

.close-action-btn {
  background: #0f3460;
  color: white;
}

.close-action-btn:hover {
  background: #1a4a7a;
}

/* Адаптивность */
@media (max-width: 768px) {
  .appearance-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .action-controls {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>