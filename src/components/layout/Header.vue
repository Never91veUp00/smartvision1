<template>
  <header class="app-header">
    <div class="header-left">
      <h1>{{ appTitle }}</h1>
    </div>
    
    <div class="header-center">
      <div class="camera-selector">
        <label for="camera-select">Камера:</label>
        <select 
          id="camera-select"
          v-model="selectedCamera" 
          @change="onCameraChange"
          class="camera-select"
          :disabled="isLoading"
        >
          <option value="">Все камеры</option>
          <option 
            v-for="camera in cameras" 
            :key="camera.id" 
            :value="camera.id"
          >
            {{ camera.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="header-right">
      <div class="connection-status status-online">
        <span class="status-dot"></span>
        Онлайн
      </div>
      <div class="current-time">
        {{ currentTime }}
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const appTitle = import.meta.env.VITE_APP_TITLE || 'Видеомониторинг'

const selectedCamera = ref('') // Изначально пусто - "Все камеры"
const currentTime = ref('')

const cameras = computed(() => appStore.cameras)
const isLoading = computed(() => appStore.isLoading)

function onCameraChange() {
  // Если выбрано "Все камеры" - пустая строка, иначе ID камеры
  appStore.selectCamera(selectedCamera.value || null)
}

// Обновление времени
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  // Обновляем время каждую секунду
  updateTime()
  const timer = setInterval(updateTime, 1000)
  
  // Устанавливаем выбранную камеру из стора (может быть null)
  selectedCamera.value = appStore.selectedCamera || ''
  
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// Следим за изменением выбранной камеры в сторе
watch(() => appStore.selectedCamera, (newCameraId) => {
  selectedCamera.value = newCameraId || ''
})
</script>

<style scoped>
/* Стили остаются теми же */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
  border-bottom: 2px solid #16213e;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
}

.camera-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.camera-selector label {
  color: #b0b0c0;
  font-size: 14px;
}

.camera-select {
  padding: 8px 16px;
  padding-right: 40px;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
}

.camera-select:focus {
  outline: none;
  border-color: #533483;
  box-shadow: 0 0 0 2px rgba(83, 52, 131, 0.3);
}

.camera-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-online {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.status-online .status-dot {
  background: #28a745;
  box-shadow: 0 0 8px #28a745;
}

.current-time {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: white;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  min-width: 100px;
  text-align: center;
}
</style>