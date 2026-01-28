<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📋 Детали события #{{ event.id }}</h2>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="event-details">
          <!-- Основная информация -->
          <div class="info-section">
            <h3>📋 Информация о событии</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Время:</span>
                <span class="info-value">{{ formatDateTime(event.timestamp) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Камера:</span>
                <span class="info-value">{{ event.camera_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Тип события:</span>
                <span class="info-value event-type-badge" :class="event.type">
                  {{ getEventTypeLabel(event.type) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Описание:</span>
                <span class="info-value">{{ event.description || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Уверенность:</span>
                <span class="info-value confidence-badge">
                  {{ Math.round(event.confidence * 100) }}%
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Статус:</span>
                <span class="info-value status-badge" :class="{ resolved: event.is_resolved }">
                  {{ event.is_resolved ? 'Решено' : 'Новое' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Ключевой кадр с разметкой -->
          <div class="frame-section" v-if="event.thumbnail_url">
            <h3>🖼️ Ключевой кадр с разметкой</h3>
            <div class="frame-container">
              <img 
                :src="event.thumbnail_url" 
                :alt="`Кадр события ${event.id}`"
                class="key-frame"
                @load="frameLoaded"
                ref="frameImage"
              />
              <canvas ref="frameCanvas" class="frame-canvas" />
              <div v-if="isFrameLoading" class="frame-loading">
                <div class="spinner-small"></div>
                Загрузка разметки...
              </div>
            </div>
            <div class="frame-controls">
              <button @click="zoomIn" class="zoom-btn" title="Увеличить">➕</button>
              <button @click="zoomOut" class="zoom-btn" title="Уменьшить">➖</button>
              <button @click="resetZoom" class="zoom-btn" title="Сбросить масштаб">⟲</button>
              <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
            </div>
          </div>
          <div v-else class="frame-section">
            <h3>🖼️ Ключевой кадр</h3>
            <div class="no-frame">
              <div class="no-frame-icon">🖼️</div>
              <p>Ключевой кадр отсутствует</p>
            </div>
          </div>
          
          <!-- Обнаруженные объекты -->
          <div v-if="event.objects && event.objects.length > 0" class="objects-section">
            <h3>🎯 Обнаруженные объекты ({{ event.objects.length }})</h3>
            <div class="objects-grid">
              <div 
                v-for="obj in event.objects" 
                :key="obj.id"
                class="object-card"
                :class="`type-${obj.type}`"
                @mouseenter="highlightObject(obj.id)"
                @mouseleave="clearHighlight"
              >
                <div class="object-header">
                  <span class="object-type-icon">{{ getObjectIcon(obj.type) }}</span>
                  <span class="object-type">{{ getObjectTypeLabel(obj.type) }}</span>
                  <span class="object-confidence">{{ Math.round(obj.confidence * 100) }}%</span>
                </div>
                <div v-if="obj.plate" class="object-plate">
                  Номер: <strong>{{ obj.plate }}</strong>
                </div>
                <div v-if="obj.color" class="object-color">
                  Цвет: {{ obj.color }}
                </div>
                <div v-if="obj.brand" class="object-brand">
                  Марка: {{ obj.brand }}
                </div>
                <div class="object-coordinates">
                  Координаты: [{{ obj.bbox.join(', ') }}]
                </div>
              </div>
            </div>
          </div>
          
          <!-- Видеофрагмент -->
          <div v-if="event.has_clip" class="clip-section">
            <h3>🎬 Видеофрагмент события</h3>
            <div class="clip-container">
              <video
                :src="getClipUrl(event.id)"
                controls
                class="clip-video"
                @loadeddata="clipLoaded"
                ref="clipVideo"
                preload="metadata"
              >
                Ваш браузер не поддерживает видео.
              </video>
              <div class="clip-info">
                <p>Фрагмент показывает момент события и несколько секунд до/после</p>
                <p class="clip-duration" v-if="clipDuration">
                  Длительность: {{ formatDuration(clipDuration) }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="clip-section">
            <h3>🎬 Видеофрагмент</h3>
            <div class="no-clip">
              <div class="no-clip-icon">🎬</div>
              <p>Видеофрагмент отсутствует</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="navigation-controls">
          <button 
            @click="$emit('prev')" 
            class="nav-btn prev-btn"
            :disabled="!hasPrev"
            title="Предыдущее событие (стрелка влево)"
          >
            ← Предыдущее
          </button>
          <button 
            @click="$emit('next')" 
            class="nav-btn next-btn"
            :disabled="!hasNext"
            title="Следующее событие (стрелка вправо)"
          >
            Следующее →
          </button>
        </div>
        
        <div class="action-controls">
          <button @click="close" class="close-action-btn">
            Закрыть (Esc)
          </button>
          <button 
            v-if="event.has_clip"
            @click="downloadClip"
            class="download-btn"
          >
            📥 Скачать фрагмент
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  },
  hasPrev: {
    type: Boolean,
    default: false
  },
  hasNext: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'prev', 'next'])

// Локальное состояние
const isFrameLoading = ref(true)
const frameCanvas = ref(null)
const frameImage = ref(null)
const clipVideo = ref(null)
const zoom = ref(1)
const highlightedObjectId = ref(null)
const clipDuration = ref(null)

// Иконки для типов объектов
function getObjectIcon(type) {
  const icons = {
    'person': '👤',
    'car': '🚗',
    'phone': '📱',
    'crowd': '👥'
  }
  return icons[type] || '🎯'
}

// Лейблы типов объектов
function getObjectTypeLabel(type) {
  const labels = {
    'person': 'Человек',
    'car': 'Автомобиль',
    'phone': 'Телефон',
    'crowd': 'Группа людей'
  }
  return labels[type] || type
}

// Форматирование даты
function formatDateTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Форматирование длительности
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Лейблы типов событий
function getEventTypeLabel(type) {
  const labels = {
    'person_phone': 'Человек с телефоном',
    'suspicious_car': 'Подозрительный автомобиль',
    'crowd': 'Скопление группы'
  }
  return labels[type] || type
}

// URL для видеофрагмента
function getClipUrl(eventId) {
  // В реальном приложении здесь будет вызов API
  return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4`
}

// Загрузка кадра
function frameLoaded() {
  isFrameLoading.value = false
  drawBoundingBoxes()
}

// Загрузка видео
function clipLoaded() {
  if (clipVideo.value) {
    clipDuration.value = clipVideo.value.duration
  }
}

// Отрисовка bounding boxes
function drawBoundingBoxes() {
  if (!frameCanvas.value || !frameImage.value || !props.event.objects) return
  
  const canvas = frameCanvas.value
  const img = frameImage.value
  
  if (!img.complete) return
  
  // Устанавливаем размер canvas в соответствии с изображением и масштабом
  canvas.width = img.width * zoom.value
  canvas.height = img.height * zoom.value
  
  const ctx = canvas.getContext('2d')
  
  // Очищаем canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Рисуем bounding boxes
  props.event.objects.forEach(obj => {
    const [x, y, width, height] = obj.bbox
    const scaledX = x * zoom.value
    const scaledY = y * zoom.value
    const scaledWidth = width * zoom.value
    const scaledHeight = height * zoom.value
    
    // Определяем цвет в зависимости от типа объекта
    const color = getObjectColor(obj.type)
    const isHighlighted = highlightedObjectId.value === obj.id
    
    // Рисуем прямоугольник
    ctx.strokeStyle = color
    ctx.lineWidth = isHighlighted ? 3 : 2
    ctx.setLineDash(isHighlighted ? [] : [5, 3])
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)
    
    // Рисуем фон для метки
    const label = getObjectTypeLabel(obj.type)
    const text = obj.plate ? `${label}: ${obj.plate}` : label
    const textWidth = ctx.measureText(text).width
    
    ctx.fillStyle = color + 'CC'
    ctx.fillRect(scaledX, scaledY - 20, textWidth + 10, 20)
    
    // Рисуем текст метки
    ctx.fillStyle = 'white'
    ctx.font = '12px Arial'
    ctx.fillText(text, scaledX + 5, scaledY - 5)
    
    // Рисуем индикатор точности
    if (obj.confidence) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(scaledX, scaledY + scaledHeight, 60, 20)
      ctx.fillStyle = 'white'
      ctx.fillText(`${Math.round(obj.confidence * 100)}%`, scaledX + 5, scaledY + scaledHeight + 15)
    }
  })
}

// Цвета для разных типов объектов
function getObjectColor(type) {
  const colors = {
    'person': '#FF6B6B',
    'car': '#4ECDC4',
    'phone': '#FFD166',
    'crowd': '#06D6A0'
  }
  return colors[type] || '#118AB2'
}

// Управление масштабом
function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 3)
  drawBoundingBoxes()
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
  drawBoundingBoxes()
}

function resetZoom() {
  zoom.value = 1
  drawBoundingBoxes()
}

// Подсветка объекта
function highlightObject(objectId) {
  highlightedObjectId.value = objectId
  drawBoundingBoxes()
}

function clearHighlight() {
  highlightedObjectId.value = null
  drawBoundingBoxes()
}

// Скачивание фрагмента
function downloadClip() {
  if (!props.event.has_clip) return
  
  const link = document.createElement('a')
  link.href = getClipUrl(props.event.id)
  link.download = `event_${props.event.id}_clip.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function close() {
  emit('close')
}

// Наблюдатели
watch(() => props.event, () => {
  if (props.event) {
    isFrameLoading.value = true
    zoom.value = 1
    highlightedObjectId.value = null
    
    // Перерисовываем bounding boxes после обновления события
    setTimeout(() => {
      if (frameImage.value?.complete) {
        frameLoaded()
      }
    }, 100)
  }
}, { immediate: true })

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  // Обработка клавиш
  const handleKeydown = (e) => {
    if (!props.isOpen) return
    
    switch (e.key) {
      case 'Escape':
        close()
        break
      case 'ArrowLeft':
        if (props.hasPrev) {
          emit('prev')
        }
        break
      case 'ArrowRight':
        if (props.hasNext) {
          emit('next')
        }
        break
      case '+':
      case '=':
        if (e.ctrlKey || e.metaKey) {
          zoomIn()
        }
        break
      case '-':
        if (e.ctrlKey || e.metaKey) {
          zoomOut()
        }
        break
      case '0':
        if (e.ctrlKey || e.metaKey) {
          resetZoom()
        }
        break
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  return () => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
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
  max-width: 900px;
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

.event-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-section,
.frame-section,
.objects-section,
.clip-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(15, 52, 96, 0.3);
}

.info-section h3,
.frame-section h3,
.objects-section h3,
.clip-section h3 {
  margin: 0 0 20px 0;
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 13px;
  color: #b0b0c0;
  font-weight: 500;
}

.info-value {
  color: white;
  font-size: 15px;
}

.event-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
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

.confidence-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.resolved {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

/* Стили для кадра с разметкой */
.frame-container {
  position: relative;
  background: #0f0f23;
  border-radius: 6px;
  overflow: auto;
  min-height: 300px;
  max-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.key-frame {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.frame-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.frame-loading {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-frame,
.no-clip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 2px dashed #0f3460;
}

.no-frame-icon,
.no-clip-icon {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 15px;
}

.no-frame p,
.no-clip p {
  margin: 0;
  color: #b0b0c0;
  font-size: 14px;
}

.frame-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 52, 96, 0.3);
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #0f3460;
}

.zoom-level {
  margin-left: auto;
  color: white;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

/* Стили для объектов */
.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.object-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4ECDC4;
  cursor: pointer;
  transition: all 0.2s;
}

.object-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.object-card.type-person {
  border-left-color: #FF6B6B;
}

.object-card.type-car {
  border-left-color: #4ECDC4;
}

.object-card.type-phone {
  border-left-color: #FFD166;
}

.object-card.type-crowd {
  border-left-color: #06D6A0;
}

.object-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.object-type-icon {
  font-size: 20px;
}

.object-type {
  flex: 1;
  font-weight: 600;
  color: white;
}

.object-confidence {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.object-plate,
.object-color,
.object-brand {
  font-family: 'Courier New', monospace;
  color: #4ECDC4;
  margin-bottom: 5px;
  font-size: 14px;
}

.object-coordinates {
  font-size: 12px;
  color: #6c757d;
}

/* Стили для видеофрагмента */
.clip-container {
  background: #0f0f23;
  border-radius: 6px;
  overflow: hidden;
}

.clip-video {
  width: 100%;
  max-height: 400px;
  display: block;
  background: #000;
}

.clip-info {
  padding: 15px;
  background: rgba(15, 52, 96, 0.2);
  border-top: 1px solid #0f3460;
}

.clip-info p {
  margin: 0 0 5px 0;
  color: #b0b0c0;
  font-size: 14px;
  text-align: center;
}

.clip-info .clip-duration {
  color: #6c757d;
  font-size: 13px;
}

.modal-footer {
  padding: 20px 30px;
  background: #16213e;
  border-top: 1px solid #0f3460;
  border-radius: 0 0 10px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navigation-controls {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 10px 20px;
  background: rgba(15, 52, 96, 0.3);
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 120px;
}

.nav-btn:hover:not(:disabled) {
  background: #0f3460;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prev-btn::before {
  content: '← ';
}

.next-btn::after {
  content: ' →';
}

.action-controls {
  display: flex;
  gap: 15px;
}

.close-action-btn {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.close-action-btn:hover {
  background: #5a6268;
}

.download-btn {
  padding: 12px 24px;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-btn:hover {
  background: #1a4a7a;
}
</style>