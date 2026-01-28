<template>
  <div class="app-container">
    <!-- Прелоадер -->
    <div v-if="isInitializing" class="app-preloader">
      <div class="preloader-content">
        <div class="preloader-logo">
          <span class="logo-icon">📹</span>
          <h1 class="logo-text">{{ appTitle }}</h1>
        </div>
        
        <div class="preloader-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progress + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            Инициализация системы...
          </div>
        </div>
        
        <div class="preloader-hint">
          <p>Система видеомониторинга для операторов</p>
          <p class="hint-small">Загрузка компонентов...</p>
        </div>
      </div>
    </div>
    
    <!-- Основной интерфейс -->
    <div v-else class="app-main">
      <Layout>
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </Layout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/store'
import Layout from '@/components/layout/Layout.vue'

const appStore = useAppStore()
const appTitle = import.meta.env.VITE_APP_TITLE || 'Видеомониторинг'

// Состояние инициализации
const isInitializing = ref(true)
const progress = ref(0)

// Инициализация приложения
async function initializeApp() {
  try {
    // Шаг 1: Загрузка конфигурации
    progress.value = 20
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Шаг 2: Загрузка камер
    progress.value = 40
    await appStore.fetchCameras()
    
    // Шаг 3: Инициализация завершена
    progress.value = 80
    await new Promise(resolve => setTimeout(resolve, 300))
    
    progress.value = 100
    await new Promise(resolve => setTimeout(resolve, 200))
    
    isInitializing.value = false
    
  } catch (error) {
    console.error('Ошибка инициализации:', error)
    // Не блокируем приложение при ошибке, просто продолжаем
    isInitializing.value = false
  }
}

// Жизненный цикл
onMounted(() => {
  initializeApp()
})
</script>

<style scoped>
/* Стили остаются теми же */
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #0f0f23;
  position: relative;
}

/* Прелоадер */
.app-preloader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0f0f23;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.preloader-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: #1a1a2e;
  border-radius: 16px;
  border: 2px solid #0f3460;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preloader-logo {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 15px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.logo-text {
  margin: 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  background: linear-gradient(45deg, #0f3460, #533483);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.preloader-progress {
  margin-bottom: 30px;
}

.progress-bar {
  height: 8px;
  background: #16213e;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0f3460, #533483);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #b0b0c0;
  font-size: 14px;
}

.preloader-hint {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.6;
}

.hint-small {
  font-size: 12px;
  margin-top: 10px;
  opacity: 0.7;
}

/* Основной интерфейс */
.app-main {
  height: 100%;
  width: 100%;
}

/* Анимации переходов */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>