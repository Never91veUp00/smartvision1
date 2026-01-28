<template>
  <div class="video-player">
    <div class="video-controls">
      <button @click="togglePlay" class="control-btn">
        {{ isPlaying ? '⏸️' : '▶️' }}
      </button>
      <input 
        type="range" 
        v-model="currentTime" 
        :max="duration"
        @input="onSeek"
        class="time-slider"
        ref="timeSlider"
      />
      <span class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
    </div>
    
    <div class="video-wrapper">
      <video
        ref="videoElement"
        :src="videoUrl"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="isPlaying = false"
        class="video-element"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  videoUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['time-update'])

const videoElement = ref(null)
const timeSlider = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// Публичные методы для управления плеером
function seekToTime(seconds) {
  if (!videoElement.value) return Promise.reject('Video element not found')
  
  return new Promise((resolve) => {
    if (videoElement.value.readyState >= 2) { // HAVE_CURRENT_DATA или выше
      videoElement.value.currentTime = seconds
      currentTime.value = seconds
      resolve()
    } else {
      // Ждем загрузки метаданных
      videoElement.value.addEventListener('loadedmetadata', () => {
        videoElement.value.currentTime = seconds
        currentTime.value = seconds
        resolve()
      }, { once: true })
    }
  })
}

function play() {
  if (videoElement.value) {
    return videoElement.value.play()
  }
  return Promise.reject('Video element not found')
}

function pause() {
  if (videoElement.value) {
    videoElement.value.pause()
  }
}

function togglePlay() {
  if (!videoElement.value) return
  
  if (videoElement.value.paused) {
    videoElement.value.play()
  } else {
    videoElement.value.pause()
  }
}

function onLoadedMetadata() {
  if (videoElement.value) {
    duration.value = videoElement.value.duration
  }
}

function onTimeUpdate() {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    emit('time-update', currentTime.value)
  }
}

function onSeek(event) {
  if (videoElement.value) {
    videoElement.value.currentTime = parseFloat(event.target.value)
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Экспортируем методы для использования в родительском компоненте
defineExpose({
  seekToTime,
  play,
  pause,
  togglePlay,
  currentTime,
  duration
})

// Автообновление при изменении URL видео
watch(() => props.videoUrl, (newUrl) => {
  if (videoElement.value) {
    videoElement.value.src = newUrl
    videoElement.value.load()
    isPlaying.value = false
    currentTime.value = 0
  }
})
</script>

<style scoped>
.video-player {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.video-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-element {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: #1a1a2e;
  border-bottom: 1px solid #0f3460;
}

.control-btn {
  padding: 8px 16px;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 60px;
}

.control-btn:hover {
  background: #1a4a7a;
}

.time-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #16213e;
  outline: none;
  cursor: pointer;
}

.time-slider::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0f3460;
  cursor: pointer;
}

.time-display {
  color: #b0b0c0;
  font-size: 14px;
  min-width: 100px;
  text-align: center;
  font-family: 'Courier New', monospace;
}
</style>