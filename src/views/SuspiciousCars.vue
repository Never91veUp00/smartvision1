<template>
  <div class="suspicious-cars">
    <div class="page-header">
      <h1>🚗 Подозрительные автомобили</h1>
      <p class="page-description">Аналитика по автомобильным номерам: статистика появления и активность в зоне</p>
    </div>
    
    <!-- Фильтры -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Номер авто:</label>
          <input 
            type="text" 
            v-model="filters.plate"
            placeholder="Введите номер..."
            class="filter-input"
            @keyup.enter="applyFilters"
          />
        </div>
        
        <div class="filter-group">
          <label>Статус:</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">Все статусы</option>
            <option value="suspicious">Подозрительный</option>
            <option value="watched">Под наблюдением</option>
            <option value="normal">Обычный</option>
          </select>
        </div>
        
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
      </div>
      
      <div class="filter-actions">
        <button @click="applyFilters" class="apply-btn">
          🔍 Применить фильтры
        </button>
        <button @click="resetFilters" class="reset-btn">
          🗑️ Сбросить
        </button>
        <button @click="exportData" class="export-all-btn">
          📤 Экспорт всех
        </button>
      </div>
    </div>
    
    <!-- Статистика -->
    <div class="stats-bar" v-if="!isLoading && !error">
      <div class="stat-item">
        <span class="stat-label">Всего авто:</span>
        <span class="stat-value">{{ carsTotalItems }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Подозрительных:</span>
        <span class="stat-value">{{ suspiciousCarsCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Под наблюдением:</span>
        <span class="stat-value">{{ watchedCarsCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Новых (24ч):</span>
        <span class="stat-value">{{ newCarsCount }}</span>
      </div>
    </div>
    
    <!-- Таблица автомобилей -->
    <div class="cars-table-section">
      <!-- Отладочная информация -->
      <div v-if="debugMode" style="background: #2a2a3e; padding: 10px; border-radius: 6px; margin-bottom: 10px; color: #ffcc00; font-size: 12px;">
        <div>DEBUG: Страница {{ currentPage }}, Показано {{ cars.length }} из {{ carsTotalItems }} авто</div>
        <div v-if="cars.length > 0">
          Первый: {{ cars[0].plate }}, Последний: {{ cars[cars.length - 1].plate }}
        </div>
      </div>
      
      <CarsTable
        :cars="cars"
        :is-loading="isLoading"
        :error="error"
        :selected-car="selectedCar"
        :current-page="currentPage"
        :page-size="pageSize"
        @row-click="selectCar"
        @details="viewCarDetails"
        @map="viewOnMap"
        @export="exportCar"
        @refresh="fetchCars"
        @sort="handleSort"
      />
      
      <!-- Пагинация -->
      <Pagination
        v-if="!isLoading && !error && carsTotalItems > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-items="carsTotalItems"
        :visible-pages="visiblePages"
        :start-item="startItem"
        :end-item="endItem"
        @page-change="goToPage"
        @page-size-change="onPageSizeChange"
      />
    </div>
    
    <!-- Модальное окно деталей автомобиля -->
    <CarDetailsModal
      v-if="selectedCar && showCarDetails"
      :car="selectedCar"
      :is-open="showCarDetails"
      @close="closeCarDetails"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/store'
import CarsTable from '@/components/cars/CarsTable.vue'
import CarDetailsModal from '@/components/cars/CarDetailsModal.vue'
import Pagination from '@/components/common/Pagination.vue'

const appStore = useAppStore()
const debugMode = ref(true) // Включите для отладки, потом отключите

// Данные из хранилища
const isLoading = computed(() => appStore.carsLoading)
const error = computed(() => appStore.carsError)
const cars = computed(() => appStore.cars)
const carsTotalItems = computed(() => appStore.carsTotalItems)
const visiblePages = computed(() => appStore.carsVisiblePages)
const startItem = computed(() => appStore.carsStartItem)
const endItem = computed(() => appStore.carsEndItem)

// Локальное состояние
const selectedCar = ref(null)
const showCarDetails = ref(false)

// Фильтры
const filters = ref({
  plate: '',
  status: '',
  fromDate: '',
  toDate: ''
})

// Вычисляемые свойства
const currentPage = computed(() => appStore.carsFilters.page)
const pageSize = computed(() => appStore.carsFilters.pageSize)

const suspiciousCarsCount = computed(() => {
  return cars.value.filter(car => car.status === 'suspicious').length
})

const watchedCarsCount = computed(() => {
  return cars.value.filter(car => car.status === 'watched').length
})

const newCarsCount = computed(() => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return cars.value.filter(car => {
    const lastSeen = new Date(car.last_seen)
    return lastSeen > yesterday
  }).length
})

// Методы
async function applyFilters() {
  console.log('Applying filters')
  appStore.setCarsFilters({
    plate: filters.value.plate.trim(),
    status: filters.value.status,
    fromDate: filters.value.fromDate,
    toDate: filters.value.toDate,
    page: 1
  })
  await appStore.fetchCars()
}

async function resetFilters() {
  console.log('Resetting filters')
  filters.value = {
    plate: '',
    status: '',
    fromDate: '',
    toDate: ''
  }
  appStore.resetCarsFilters()
  await appStore.fetchCars()
}

async function fetchCars() {
  console.log('Fetching cars')
  await appStore.fetchCars()
}

// Методы пагинации - УПРОЩЕННАЯ ВЕРСИЯ
async function goToPage(page) {
  console.log('Going to page:', page, 'from current page:', currentPage.value)
  
  if (page === currentPage.value) {
    console.log('Already on this page')
    return
  }
  
  // Просто вызываем метод store
  await appStore.goToCarsPage(page)
  
  // Ждем немного для гарантии
  await new Promise(resolve => setTimeout(resolve, 50))
}

async function onPageSizeChange(size) {
  console.log('Changing page size to:', size)
  await appStore.changeCarsPageSize(size)
}

function selectCar(car) {
  selectedCar.value = car
}

function viewCarDetails(car) {
  selectedCar.value = car
  showCarDetails.value = true
}

function closeCarDetails() {
  showCarDetails.value = false
}

function viewOnMap(car) {
  alert(`Просмотр автомобиля ${car.plate} на карте\n(функционал карты будет реализован позже)`)
}

function exportCar(car) {
  appStore.exportCar(car.plate, 'json')
}

async function exportData() {
  try {
    await appStore.exportCars('csv')
  } catch (err) {
    alert('Ошибка при экспорте: ' + err.message)
  }
}

async function handleSort({ column, direction }) {
  console.log('Sorting by:', column, direction)
  appStore.setCarsSort(column, direction)
  await appStore.fetchCars()
}

// Начальная загрузка
onMounted(async () => {
  console.log('Mounted SuspiciousCars.vue')
  await appStore.fetchCars()
})

// Отладочный watch для отслеживания изменений данных
watch(cars, (newCars, oldCars) => {
  console.log('CARS CHANGED: from', oldCars?.length || 0, 'to', newCars?.length || 0)
  if (newCars?.length > 0) {
    console.log('First car now:', newCars[0].plate)
  }
}, { deep: true })

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
.suspicious-cars {
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
  display: flex;
  align-items: center;
  gap: 10px;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.filter-input::placeholder {
  color: #6c757d;
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.apply-btn,
.reset-btn,
.export-all-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
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

.export-all-btn {
  background: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
  border: 1px solid rgba(111, 66, 193, 0.3);
}

.export-all-btn:hover {
  background: #6f42c1;
  color: white;
}

/* Статистика */
.stats-bar {
  display: flex;
  gap: 30px;
  padding: 15px 20px;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #0f3460;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #b0b0c0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

/* Секция таблицы */
.cars-table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>