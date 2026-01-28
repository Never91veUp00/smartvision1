<template>
  <div class="monitoring-view">
    <!-- Если выбрана конкретная камера - показываем один видеоплеер -->
    <div v-if="selectedCameraId" class="single-camera-view">
      <div class="video-section">
        <div class="video-header">
          <button @click="viewAllCameras" class="back-btn">
            ← Все камеры
          </button>
        </div>
        <VideoPlayer 
          ref="videoPlayer"
          :video-url="currentVideoUrl" 
        />
      </div>
      
      <div class="events-section">
        <div class="section-header">
          <h2>🔄 События в реальном времени</h2>
          <span class="events-count">{{ cameraEvents.length }} событий</span>
        </div>
        
        <div class="events-list">
          <div 
            v-for="event in cameraEvents" 
            :key="event.id"
            class="event-card"
            @click="handleEventClick(event)"
            :class="{ 
              'event-new': isEventNew(event),
              'event-active': activeEventId === event.id 
            }"
          >
            <div class="event-time">
              {{ formatDateTime(event.timestamp) }}
            </div>
            <div class="event-type">
              {{ getEventTypeLabel(event.type) }}
            </div>
            <div class="event-description" v-if="event.description">
              {{ event.description }}
            </div>
            <img 
              v-if="event.thumbnail_url" 
              :src="event.thumbnail_url" 
              alt="Кадр события"
              class="event-thumbnail"
            />
          </div>
          
          <div v-if="cameraEvents.length === 0" class="no-events">
            Нет событий для этой камеры
          </div>
        </div>
      </div>
    </div>
    
    <!-- Если выбраны все камеры - показываем сетку превью -->
    <div v-else class="all-cameras-view">
      <div class="grid-header">
        <h2>📹 Все камеры ({{ filteredCameras.length }})</h2>
        <div class="grid-controls">
          <select v-model="gridView" class="view-select">
            <option value="grid">Сетка</option>
            <option value="list">Список</option>
          </select>
          <input 
            type="text" 
            v-model="cameraSearch" 
            placeholder="Поиск камер..."
            class="search-input"
          />
        </div>
      </div>
      
      <div class="cameras-grid" :class="gridView">
        <div 
          v-for="camera in filteredCameras" 
          :key="camera.id"
          class="camera-card"
          @click="selectCamera(camera.id)"
          :class="{ 'active': selectedCameraId === camera.id }"
        >
          <div class="camera-preview">
            <video 
              :src="camera.video_url" 
              muted
              autoplay
              loop
              :data-camera="camera.id"
              class="preview-video"
              @mouseenter="playPreview(camera.id)"
              @mouseleave="pausePreview(camera.id)"
            ></video>
            <div v-if="camera.is_live" class="live-badge">
              🔴 LIVE
            </div>
            <div v-if="camera.alert_count > 0" class="alert-badge">
              ⚠️ {{ camera.alert_count }}
            </div>
          </div>
          
          <div class="camera-info">
            <h3 class="camera-name">{{ camera.name }}</h3>
            <p v-if="camera.description" class="camera-description">
              {{ camera.description }}
            </p>
            <div class="camera-stats">
              <span v-if="camera.alert_count > 0" class="stat alert-stat">
                <span class="stat-icon">⚠️</span>
                {{ camera.alert_count }} алертов
              </span>
              <span class="stat uptime-stat">
                <span class="stat-icon">🕒</span>
                {{ formatUptime(camera.uptime) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="filteredCameras.length === 0" class="no-cameras">
        <div class="no-cameras-icon">📹</div>
        <h3>Камеры не найдены</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    </div>

    <!-- Модальное окно с деталями события -->
    <EventDetailsModal
      v-if="showEventModal"
      :event="selectedEvent"
      :is-open="showEventModal"
      @close="closeEventModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/store'
import VideoPlayer from '@/components/monitoring/VideoPlayer.vue'
import EventDetailsModal from '@/components/events/EventDetailsModal.vue'

const appStore = useAppStore()

// Данные
const recentEvents = ref([])
const selectedCameraId = ref(null) // Изначально null - режим "Все камеры"
const gridView = ref('grid')
const cameraSearch = ref('')
const videoPlayer = ref(null)
const activeEventId = ref(null)
const showEventModal = ref(false)
const selectedEvent = ref(null)

// Вычисляемые свойства
const cameras = computed(() => appStore.cameras)

// События для выбранной камеры
const cameraEvents = computed(() => {
  if (!selectedCameraId.value) return []
  
  return recentEvents.value.filter(event => 
    event.camera_id === selectedCameraId.value || 
    event.camera_name === selectedCameraData.value?.name
  )
})

// Данные выбранной камеры
const selectedCameraData = computed(() => {
  return cameras.value.find(c => c.id === selectedCameraId.value) || null
})

// Считаем количество алертов для каждой камеры на основе событий
const camerasWithAlerts = computed(() => {
  return cameras.value.map(camera => {
    // Считаем события для этой камеры
    const cameraEvents = recentEvents.value.filter(event => 
      event.camera_id === camera.id || event.camera_name === camera.name
    )
    
    return {
      ...camera,
      alert_count: cameraEvents.length,
      has_alerts: cameraEvents.length > 0
    }
  })
})

// Фильтрация камер по поиску
const filteredCameras = computed(() => {
  let result = camerasWithAlerts.value
  
  if (cameraSearch.value.trim()) {
    const searchTerm = cameraSearch.value.toLowerCase()
    result = result.filter(camera => 
      camera.name.toLowerCase().includes(searchTerm) ||
      (camera.description && camera.description.toLowerCase().includes(searchTerm))
    )
  }
  
  return result
})

const currentVideoUrl = computed(() => {
  return selectedCameraData.value?.video_url || ''
})

// Форматирование даты
function formatDateTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU')
}

// Форматирование времени работы
function formatUptime(seconds) {
  if (!seconds) return '0ч'
  
  const hours = Math.floor(seconds / 3600)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`
  }
  return `${hours}ч`
}

// Лейблы типов событий
function getEventTypeLabel(type) {
  const labels = {
    'person_phone': '📱 Человек с телефоном',
    'suspicious_car': '🚗 Подозрительный автомобиль',
    'crowd': '👥 Скопление людей'
  }
  return labels[type] || type
}

// Проверка нового события
function isEventNew(event) {
  const eventTime = new Date(event.timestamp).getTime()
  const now = Date.now()
  return (now - eventTime) < 30000
}

// Обработчик клика по событию
async function handleEventClick(event) {
  activeEventId.value = event.id
  selectedEvent.value = event
  
  // 1. Позиционируем видео на момент события
  await seekToEventTime(event)
  
  // 2. Открываем модальное окно с деталями
  showEventModal.value = true
}

// Позиционирование видео на момент события
async function seekToEventTime(event) {
  if (!videoPlayer.value) return
  
  try {
    // Преобразуем timestamp в секунды для позиционирования
    const eventTime = new Date(event.timestamp).getTime()
    const now = Date.now()
    // Для демо - устанавливаем на 30 секунд от начала видео
    const secondsFromStart = 30
    
    // Позиционируем видео
    await videoPlayer.value.seekToTime(secondsFromStart)
    
    // Воспроизводим видео с этого момента
    await videoPlayer.value.play()
    
  } catch (error) {
    console.error('Error seeking to event time:', error)
  }
}

// Закрытие модального окна
function closeEventModal() {
  showEventModal.value = false
  selectedEvent.value = null
  activeEventId.value = null
}

// Выбор камеры
function selectCamera(cameraId) {
  selectedCameraId.value = cameraId
  appStore.selectCamera(cameraId)
  // Сбрасываем активное событие при смене камеры
  activeEventId.value = null
  showEventModal.value = false
}

// Возврат к просмотру всех камер
function viewAllCameras() {
  selectedCameraId.value = null
  appStore.selectCamera(null)
  activeEventId.value = null
  showEventModal.value = false
}

// Воспроизведение превью при наведении
function playPreview(cameraId) {
  const videos = document.querySelectorAll(`[data-camera="${cameraId}"]`)
  videos.forEach(video => {
    if (video && video.paused) {
      video.play().catch(e => console.log('Cannot autoplay:', e))
    }
  })
}

function pausePreview(cameraId) {
  const videos = document.querySelectorAll(`[data-camera="${cameraId}"]`)
  videos.forEach(video => {
    if (video && !video.paused) {
      video.pause()
    }
  })
}

// Загрузка данных
onMounted(async () => {
  await appStore.fetchCameras()
  
  // Загрузка событий (заглушка)
  recentEvents.value = [
    {
      id: 1,
      camera_id: 1,
      camera_name: 'Вход в офис',
      timestamp: new Date().toISOString(),
      type: 'suspicious_car',
      description: 'Автомобиль A123BC',
      thumbnail_url: 'https://placehold.jp/100x75.png',
      objects: [
        {
          id: 1,
          type: 'car',
          plate: 'A123BC',
          confidence: 0.95,
          bbox: [100, 150, 200, 100]
        }
      ],
      has_clip: true
    },
    {
      id: 2,
      camera_id: 1,
      camera_name: 'Вход в офис',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      type: 'person_phone',
      description: 'Человек снимает на телефон',
      thumbnail_url: 'https://placehold.jp/100x75.png',
      objects: [
        {
          id: 1,
          type: 'person',
          confidence: 0.88,
          bbox: [150, 200, 80, 150]
        },
        {
          id: 2,
          type: 'phone',
          confidence: 0.92,
          bbox: [180, 220, 30, 40]
        }
      ],
      has_clip: true
    },
    {
      id: 3,
      camera_id: 3,
      camera_name: 'Ресепшен',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      type: 'crowd',
      description: 'Скопление 5+ человек',
      thumbnail_url: 'https://placehold.jp/100x75.png',
      objects: [
        { id: 1, type: 'person', confidence: 0.85, bbox: [100, 150, 60, 120] },
        { id: 2, type: 'person', confidence: 0.82, bbox: [180, 140, 55, 115] },
        { id: 3, type: 'person', confidence: 0.79, bbox: [250, 160, 65, 125] }
      ],
      has_clip: true
    },
    {
      id: 4,
      camera_id: 6,
      camera_name: 'Серверная',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      type: 'person_phone',
      description: 'Несанкционированная съемка',
      thumbnail_url: 'https://placehold.jp/100x75.png',
      objects: [
        {
          id: 1,
          type: 'person',
          confidence: 0.91,
          bbox: [120, 180, 70, 140]
        }
      ],
      has_clip: false
    },
    {
      id: 5,
      camera_id: 1,
      camera_name: 'Вход в офис',
      timestamp: new Date(Date.now() - 20000).toISOString(),
      type: 'suspicious_car',
      description: 'Автомобиль B456DE',
      thumbnail_url: 'https://placehold.jp/100x75.png',
      objects: [
        {
          id: 1,
          type: 'car',
          plate: 'B456DE',
          confidence: 0.97,
          bbox: [80, 120, 220, 90]
        }
      ],
      has_clip: true
    }
  ]
})

// Следим за изменением выбранной камеры в сторе
watch(() => appStore.selectedCamera, (newCameraId) => {
  selectedCameraId.value = newCameraId
})
</script>

<style scoped>
.monitoring-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Вид одной камеры */
.single-camera-view {
  display: flex;
  height: 100%;
  gap: 20px;
}

.video-section {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Кнопка возврата ко всем камерам */
.video-header {
  margin-bottom: 15px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(15, 52, 96, 0.3);
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #0f3460;
}

.events-section {
  flex: 1;
  min-width: 300px;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  padding: 15px;
  background: #0f3460;
  border-bottom: 1px solid #16213e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  color: white;
}

.events-count {
  color: #b0b0c0;
  font-size: 14px;
  font-weight: 500;
}

.events-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.event-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.event-card:hover {
  background: #1a4a7a;
  transform: translateX(5px);
}

.event-card.event-new {
  border-left: 4px solid #ff6b6b;
  animation: pulse 2s infinite;
}

.event-card.event-active {
  background: rgba(15, 52, 96, 0.4);
  border-color: #533483;
  box-shadow: 0 0 0 2px rgba(83, 52, 131, 0.3);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
}

.event-time {
  font-size: 12px;
  color: #b0b0c0;
  margin-bottom: 5px;
}

.event-type {
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
}

.event-description {
  font-size: 14px;
  color: #d0d0e0;
  margin-bottom: 10px;
}

.event-thumbnail {
  width: 100%;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #0f3460;
  transition: transform 0.2s;
}

.event-card:hover .event-thumbnail {
  transform: scale(1.02);
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px dashed #0f3460;
}

/* Вид всех камер */
.all-cameras-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #1a1a2e;
  border-bottom: 1px solid #0f3460;
  border-radius: 8px 8px 0 0;
}

.grid-header h2 {
  margin: 0;
  font-size: 18px;
  color: white;
}

.grid-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.view-select {
  padding: 8px 16px;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.search-input {
  padding: 8px 16px;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;
}

.search-input::placeholder {
  color: #6c757d;
}

/* Сетка камер */
.cameras-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  gap: 20px;
}

.cameras-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
}

.cameras-grid.list {
  grid-template-columns: 1fr;
  max-width: 900px;
  margin: 0 auto;
}

.camera-card {
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 380px;
}

.camera-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border-color: #533483;
}

.camera-card.active {
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.cameras-grid.list .camera-card {
  flex-direction: row;
  height: 220px;
}

.camera-preview {
  position: relative;
  height: 250px;
  background: #000;
  overflow: hidden;
}

.cameras-grid.list .camera-preview {
  width: 350px;
  height: 100%;
  flex-shrink: 0;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.alert-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ffc107;
  color: #212529;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.camera-info {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cameras-grid.list .camera-info {
  padding: 20px;
  flex: 1;
  min-height: 0;
}

.camera-name {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  line-height: 1.3;
}

.camera-description {
  margin: 0 0 15px 0;
  color: #b0b0c0;
  font-size: 13px;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.camera-stats {
  display: flex;
  gap: 15px;
  margin-top: auto;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b0b0c0;
  font-size: 13px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.alert-stat {
  color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
}

.uptime-stat {
  color: #17a2b8;
  background: rgba(23, 162, 184, 0.1);
}

.stat-icon {
  font-size: 14px;
}

.no-cameras {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.no-cameras-icon {
  font-size: 60px;
  opacity: 0.3;
  margin-bottom: 20px;
}

.no-cameras h3 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 18px;
}

.no-cameras p {
  margin: 0;
  font-size: 14px;
}
</style>