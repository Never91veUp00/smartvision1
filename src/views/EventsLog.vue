<template>
  <div class="events-log">
    <div class="page-header">
      <h1>📋 Журнал событий</h1>
      <p class="page-description">История всех зафиксированных случаев подозрительной активности</p>
    </div>
    
    <!-- Фильтры -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Дата с:</label>
          <input 
            type="datetime-local" 
            v-model="filters.fromDate"
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label>Дата по:</label>
          <input 
            type="datetime-local" 
            v-model="filters.toDate"
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label>Тип события:</label>
          <select v-model="filters.type" class="filter-select">
            <option value="">Все типы</option>
            <option value="person_phone">Человек с телефоном</option>
            <option value="suspicious_car">Подозрительный автомобиль</option>
            <option value="crowd">Скопление группы</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Камера:</label>
          <select v-model="filters.cameraId" class="filter-select">
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
      
      <div class="filter-actions">
        <button @click="applyFilters" class="apply-btn">
          🔍 Применить фильтры
        </button>
        <button @click="resetFilters" class="reset-btn">
          🗑️ Сбросить
        </button>
      </div>
    </div>
    
    <!-- Таблица событий с компонентами -->
    <div class="events-table-section">
      <!-- Статистика -->
      <div class="stats-bar" v-if="!isLoading && !error">
        <div class="stat-item">
          <span class="stat-label">Всего событий:</span>
          <span class="stat-value">{{ eventsTotalItems }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">С кадрами:</span>
          <span class="stat-value">{{ eventsWithThumbnails }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">С видео:</span>
          <span class="stat-value">{{ eventsWithClips }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Решено:</span>
          <span class="stat-value">{{ resolvedEvents }}</span>
        </div>
      </div>
      
      <!-- Компонент таблицы -->
      <EventsTable
        :events="events"
        :is-loading="isLoading"
        :error="error"
        :selected-event="selectedEvent"
        @row-click="selectEvent"
        @details="viewEventDetails"
        @play="playEventClip"
        @export="exportEvent"
        @refresh="fetchEvents"
        @sort="handleSort"
      />
      
      <!-- Пагинация -->
      <Pagination
        v-if="!isLoading && !error && eventsTotalItems > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-items="eventsTotalItems"
        :visible-pages="visiblePages"
        :start-item="startItem"
        :end-item="endItem"
        @page-change="goToPage"
        @page-size-change="onPageSizeChange"
      />
    </div>
    
    <!-- Модальное окно деталей события -->
    <EventDetailsModal
      v-if="selectedEvent && showEventDetails"
      :event="selectedEvent"
      :is-open="showEventDetails"
      :has-prev="hasPrevEvent"
      :has-next="hasNextEvent"
      @close="closeEventDetails"
      @prev="showPrevEvent"
      @next="showNextEvent"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/store'
import EventsTable from '@/components/events/EventsTable.vue'
import EventDetailsModal from '@/components/events/EventDetailsModal.vue'
import Pagination from '@/components/common/Pagination.vue'

const appStore = useAppStore()

// Данные из хранилища
const isLoading = computed(() => appStore.eventsLoading)
const error = computed(() => appStore.eventsError)
const events = computed(() => appStore.events)
const eventsTotalItems = computed(() => appStore.eventsTotalItems)
const eventsWithThumbnails = computed(() => appStore.eventsWithThumbnails)
const eventsWithClips = computed(() => appStore.eventsWithClips)

// Исправленные вычисляемые свойства для пагинации событий
const visiblePages = computed(() => appStore.eventsVisiblePages)
const startItem = computed(() => appStore.eventsStartItem)
const endItem = computed(() => appStore.eventsEndItem)

// Локальное состояние
const selectedEvent = ref(null)
const showEventDetails = ref(false)

// Фильтры
const filters = ref({
  fromDate: '',
  toDate: '',
  type: '',
  cameraId: ''
})

// Вычисляемые свойства
const cameras = computed(() => appStore.cameras)
const currentPage = computed(() => appStore.eventsFilters.page)
const pageSize = computed(() => appStore.eventsFilters.pageSize)

const resolvedEvents = computed(() => {
  return events.value.filter(e => e.is_resolved).length
})

const hasPrevEvent = computed(() => {
  if (!selectedEvent.value || !events.value.length) return false
  const currentIndex = events.value.findIndex(e => e.id === selectedEvent.value.id)
  return currentIndex > 0
})

const hasNextEvent = computed(() => {
  if (!selectedEvent.value || !events.value.length) return false
  const currentIndex = events.value.findIndex(e => e.id === selectedEvent.value.id)
  return currentIndex < events.value.length - 1
})

// Методы
async function applyFilters() {
  appStore.setEventsFilters({
    fromDate: filters.value.fromDate,
    toDate: filters.value.toDate,
    type: filters.value.type,
    cameraId: filters.value.cameraId,
    page: 1
  })
  await appStore.fetchEvents()
}

async function resetFilters() {
  filters.value = {
    fromDate: '',
    toDate: '',
    type: '',
    cameraId: ''
  }
  appStore.resetEventsFilters()
  await appStore.fetchEvents()
}

async function fetchEvents() {
  await appStore.fetchEvents()
}

// Исправленные методы пагинации
async function goToPage(page) {
  await appStore.goToEventsPage(page)
}

async function onPageSizeChange(size) {
  await appStore.changeEventsPageSize(size)
}

function selectEvent(event) {
  selectedEvent.value = event
}

function viewEventDetails(event) {
  selectedEvent.value = event
  showEventDetails.value = true
}

function closeEventDetails() {
  showEventDetails.value = false
}

function showPrevEvent() {
  if (!selectedEvent.value || !events.value.length) return
  
  const currentIndex = events.value.findIndex(e => e.id === selectedEvent.value.id)
  if (currentIndex > 0) {
    selectedEvent.value = events.value[currentIndex - 1]
  }
}

function showNextEvent() {
  if (!selectedEvent.value || !events.value.length) return
  
  const currentIndex = events.value.findIndex(e => e.id === selectedEvent.value.id)
  if (currentIndex < events.value.length - 1) {
    selectedEvent.value = events.value[currentIndex + 1]
  }
}

function playEventClip(event) {
  if (event.has_clip) {
    // В реальной версии здесь будет открытие видеофрагмента
    alert(`Воспроизведение фрагмента события #${event.id}\n(В реальной версии будет открыт видеофрагмент)`)
  }
}

function exportEvent(event) {
  console.log('Exporting event:', event)
  alert(`Экспорт события #${event.id}\n(В реальной версии будет скачан архив с материалами)`)
}

async function handleSort({ column, direction }) {
  appStore.setEventsSort(column, direction)
  await appStore.fetchEvents()
}

// Начальная загрузка
onMounted(async () => {
  await appStore.fetchCameras()
  await appStore.fetchEvents()
})

// Валидация дат
watch([() => filters.value.fromDate, () => filters.value.toDate], () => {
  if (filters.value.fromDate && filters.value.toDate) {
    const fromDate = new Date(filters.value.fromDate)
    const toDate = new Date(filters.value.toDate)
    
    if (fromDate > toDate) {
      alert('Дата "с" не может быть больше даты "по"')
      filters.value.fromDate = ''
      filters.value.toDate = ''
    }
  }
})
</script>

<style scoped>
.events-log {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: white;
}

.page-description {
  margin: 0;
  color: #b0b0c0;
  font-size: 14px;
}

/* Секция фильтров */
.filters-section {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #0f3460;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  color: #b0b0c0;
  font-weight: 500;
}

.filter-input,
.filter-select {
  padding: 10px 12px;
  background: #16213e;
  color: white;
  border: 1px solid #0f3460;
  border-radius: 6px;
  font-size: 14px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #533483;
  box-shadow: 0 0 0 2px rgba(83, 52, 131, 0.3);
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.apply-btn,
.reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn {
  background: #0f3460;
  color: white;
}

.apply-btn:hover {
  background: #1a4a7a;
}

.reset-btn {
  background: #5d1a1a;
  color: white;
}

.reset-btn:hover {
  background: #7a1a1a;
}

/* Секция таблицы */
.events-table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Статистика */
.stats-bar {
  display: flex;
  gap: 30px;
  padding: 15px 20px;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #b0b0c0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: white;
}
</style>