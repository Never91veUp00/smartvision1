<template>
  <div class="event-feed">
    <div class="feed-header">
      <h3>🔄 События в реальном времени</h3>
      <div class="feed-controls">
        <button 
          @click="toggleAutoRefresh" 
          class="control-btn"
          :class="{ active: autoRefresh }"
          title="Автообновление"
        >
          {{ autoRefresh ? '⏸️' : '▶️' }}
        </button>
        <button 
          @click="clearEvents" 
          class="control-btn"
          title="Очистить"
        >
          🗑️
        </button>
      </div>
    </div>
    
    <div class="feed-content">
      <div v-if="events.length === 0" class="no-events">
        <div class="no-events-icon">📭</div>
        <p>Нет новых событий</p>
      </div>
      
      <div v-else class="events-list">
        <div 
          v-for="event in events" 
          :key="event.id"
          class="event-item"
          :class="{ 
            'event-new': isEventNew(event),
            'event-selected': selectedEventId === event.id 
          }"
          @click="selectEvent(event)"
        >
          <div class="event-time">
            {{ formatTime(event.timestamp) }}
          </div>
          <div class="event-type">
            {{ getEventTypeIcon(event.type) }} {{ getEventTypeLabel(event.type) }}
          </div>
          <div v-if="event.description" class="event-description">
            {{ event.description }}
          </div>
          <img 
            v-if="event.thumbnail_url" 
            :src="event.thumbnail_url" 
            alt="Кадр"
            class="event-thumbnail"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  selectedEventId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['select', 'clear', 'refresh'])

const autoRefresh = ref(true)
let refreshInterval = null

// Форматирование времени
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Иконки типов событий
function getEventTypeIcon(type) {
  const icons = {
    'person_phone': '📱',
    'suspicious_car': '🚗',
    'crowd': '👥'
  }
  return icons[type] || '⚠️'
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

// Проверка нового события
function isEventNew(event) {
  const eventTime = new Date(event.timestamp).getTime()
  const now = Date.now()
  return (now - eventTime) < 30000 // 30 секунд
}

// Выбор события
function selectEvent(event) {
  emit('select', event)
}

// Очистка событий
function clearEvents() {
  emit('clear')
}

// Автообновление
function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    emit('refresh')
  }, 5000) // Обновление каждые 5 секунд
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Жизненный цикл
onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.event-feed {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  border-radius: 8px 8px 0 0;
}

.feed-header h3 {
  margin: 0;
  font-size: 16px;
  color: white;
}

.feed-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #0f3460;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(15, 52, 96, 0.3);
}

.control-btn.active {
  background: #0f3460;
  color: white;
}

.feed-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.no-events {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-events-icon {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 15px;
}

.no-events p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  background: #16213e;
  border: 1px solid rgba(15, 52, 96, 0.3);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  animation: slideInUp 0.3s ease;
}

.event-item:hover {
  background: rgba(15, 52, 96, 0.2);
  border-color: #0f3460;
  transform: translateX(5px);
}

.event-item.event-new {
  border-left: 4px solid #ff6b6b;
  animation: pulse 2s infinite;
}

.event-item.event-selected {
  background: rgba(15, 52, 96, 0.4);
  border-color: #0f3460;
  box-shadow: 0 0 0 2px rgba(15, 52, 96, 0.2);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.event-time {
  font-size: 12px;
  color: #b0b0c0;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.event-type {
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-description {
  font-size: 14px;
  color: #d0d0e0;
  margin-bottom: 10px;
  line-height: 1.4;
}

.event-thumbnail {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #0f3460;
}
</style>