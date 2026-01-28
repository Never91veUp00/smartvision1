import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Chart from 'chart.js/auto'

export const useAppStore = defineStore('app', () => {
  // ========== ОБЩЕЕ СОСТОЯНИЕ ==========
  const cameras = ref([])
  const selectedCamera = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const connectionStatus = ref('online')
  const recentEvents = ref([])
  const isMonitoring = ref(false)
  
  // ========== СОСТОЯНИЕ ДЛЯ СОБЫТИЙ ==========
  const events = ref([])
  const allEvents = ref([])
  const eventsLoading = ref(false)
  const eventsError = ref(null)
  const selectedEvent = ref(null)
  const eventsFilters = ref({
    fromDate: '',
    toDate: '',
    type: '',
    cameraId: '',
    page: 1,
    pageSize: 25,
    sortColumn: 'timestamp',
    sortDirection: 'desc'
  })
  const eventsTotalItems = ref(0)
  
  // ========== СОСТОЯНИЕ ДЛЯ АВТОМОБИЛЕЙ ==========
  const cars = ref([])
  const allCars = ref([])
  const carsLoading = ref(false)
  const carsError = ref(null)
  const selectedCar = ref(null)
  const carsFilters = ref({
    plate: '',
    status: '',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 25,
    sortColumn: 'last_seen',
    sortDirection: 'desc'
  })
  const carsTotalItems = ref(0)
  
  // ========== ГЕТТЕРЫ КАМЕР ==========
  const cameraOptions = computed(() => {
    return cameras.value.map(camera => ({
      value: camera.id,
      label: camera.name,
      videoUrl: camera.video_url,
      thumbnailUrl: camera.thumbnail_url,
      status: camera.is_live ? 'online' : 'offline'
    }))
  })
  
  const selectedCameraData = computed(() => {
    return cameras.value.find(c => c.id === selectedCamera.value) || null
  })
  
  const currentVideoUrl = computed(() => {
    return selectedCameraData.value?.video_url || ''
  })
  
  const hasCameras = computed(() => {
    return cameras.value.length > 0
  })
  
  // ========== ГЕТТЕРЫ ДЛЯ СОБЫТИЙ ==========
  const eventsWithThumbnails = computed(() => {
    return events.value.filter(e => e.thumbnail_url).length
  })
  
  const eventsWithClips = computed(() => {
    return events.value.filter(e => e.has_clip).length
  })
  
  const eventTypeLabels = computed(() => ({
    'person_phone': '📱 Человек с телефоном',
    'suspicious_car': '🚗 Подозрительный автомобиль',
    'crowd': '👥 Скопление группы'
  }))
  
  const eventTypeColors = computed(() => ({
    'person_phone': { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: 'rgba(255, 193, 7, 0.3)' },
    'suspicious_car': { bg: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', border: 'rgba(220, 53, 69, 0.3)' },
    'crowd': { bg: 'rgba(23, 162, 184, 0.2)', color: '#17a2b8', border: 'rgba(23, 162, 184, 0.3)' }
  }))
  
  const objectTypeLabels = computed(() => ({
    'person': 'Человек',
    'car': 'Автомобиль',
    'phone': 'Телефон',
    'crowd': 'Группа людей'
  }))
  
  const objectTypeIcons = computed(() => ({
    'person': '👤',
    'car': '🚗',
    'phone': '📱',
    'crowd': '👥'
  }))
  
  const objectTypeColors = computed(() => ({
    'person': '#FF6B6B',
    'car': '#4ECDC4',
    'phone': '#FFD166',
    'crowd': '#06D6A0'
  }))
  
  // Геттеры пагинации для событий
  const eventsTotalPages = computed(() => {
    return Math.ceil(eventsTotalItems.value / eventsFilters.value.pageSize)
  })
  
  const eventsVisiblePages = computed(() => {
    const pages = []
    const maxVisible = 5
    
    if (eventsTotalPages.value <= maxVisible) {
      for (let i = 1; i <= eventsTotalPages.value; i++) {
        pages.push(i)
      }
    } else {
      if (eventsFilters.value.page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(eventsTotalPages.value)
      } else if (eventsFilters.value.page >= eventsTotalPages.value - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = eventsTotalPages.value - 3; i <= eventsTotalPages.value; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(eventsFilters.value.page - 1)
        pages.push(eventsFilters.value.page)
        pages.push(eventsFilters.value.page + 1)
        pages.push('...')
        pages.push(eventsTotalPages.value)
      }
    }
    
    return pages
  })
  
  const eventsStartItem = computed(() => {
    return ((eventsFilters.value.page - 1) * eventsFilters.value.pageSize) + 1
  })
  
  const eventsEndItem = computed(() => {
    const end = eventsFilters.value.page * eventsFilters.value.pageSize
    return end > eventsTotalItems.value ? eventsTotalItems.value : end
  })
  
  // ========== ГЕТТЕРЫ ДЛЯ АВТОМОБИЛЕЙ ==========
  const carsWithStats = computed(() => {
    return cars.value.map(car => ({
      ...car,
      is_new: isCarNew(car)
    }))
  })
  
  const carsTotalPages = computed(() => {
    return Math.ceil(carsTotalItems.value / carsFilters.value.pageSize)
  })
  
  const carsVisiblePages = computed(() => {
    const pages = []
    const maxVisible = 5
    
    if (carsTotalPages.value <= maxVisible) {
      for (let i = 1; i <= carsTotalPages.value; i++) {
        pages.push(i)
      }
    } else {
      if (carsFilters.value.page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(carsTotalPages.value)
      } else if (carsFilters.value.page >= carsTotalPages.value - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = carsTotalPages.value - 3; i <= carsTotalPages.value; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(carsFilters.value.page - 1)
        pages.push(carsFilters.value.page)
        pages.push(carsFilters.value.page + 1)
        pages.push('...')
        pages.push(carsTotalPages.value)
      }
    }
    
    return pages
  })
  
  const carsStartItem = computed(() => {
    return ((carsFilters.value.page - 1) * carsFilters.value.pageSize) + 1
  })
  
  const carsEndItem = computed(() => {
    const end = carsFilters.value.page * carsFilters.value.pageSize
    return end > carsTotalItems.value ? carsTotalItems.value : end
  })
  
  // ========== ДЕЙСТВИЯ ДЛЯ КАМЕР ==========
  async function fetchCameras() {
    isLoading.value = true
    error.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      cameras.value = [
        { 
          id: 1, 
          name: 'Вход в офис', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Вход+в+офис',
          description: 'Основной вход в офисное здание',
          is_live: true,
          uptime: 86400,
          location: 'Первый этаж, центральный вход',
          resolution: '1920x1080',
          fps: 30,
          last_activity: new Date(Date.now() - 60000).toISOString()
        },
        { 
          id: 2, 
          name: 'Парковка', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Парковка',
          description: 'Подземная парковка уровня B2',
          is_live: true,
          uptime: 172800,
          location: 'Подземный уровень B2',
          resolution: '2560x1440',
          fps: 25,
          last_activity: new Date(Date.now() - 120000).toISOString()
        },
        { 
          id: 3, 
          name: 'Ресепшен', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Ресепшен',
          description: 'Зона ресепшен на первом этаже',
          is_live: true,
          uptime: 432000,
          location: 'Первый этаж, зона ресепшен',
          resolution: '1280x720',
          fps: 30,
          last_activity: new Date(Date.now() - 30000).toISOString()
        },
        { 
          id: 4, 
          name: 'Кухня', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Кухня',
          description: 'Общая кухня для сотрудников',
          is_live: false,
          uptime: 0,
          location: 'Пятый этаж, общая зона',
          resolution: '1920x1080',
          fps: 30,
          last_activity: new Date(Date.now() - 3600000).toISOString()
        },
        { 
          id: 5, 
          name: 'Конференц-зал', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Конференц-зал',
          description: 'Зал для совещаний на 20 человек',
          is_live: true,
          uptime: 259200,
          location: 'Третий этаж, комната 305',
          resolution: '1920x1080',
          fps: 30,
          last_activity: new Date(Date.now() - 180000).toISOString()
        },
        { 
          id: 6, 
          name: 'Серверная', 
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          thumbnail_url: 'https://placehold.jp/300x200.png?text=Серверная',
          description: 'Помещение серверного оборудования',
          is_live: true,
          uptime: 604800,
          location: 'Подвал, комната B01',
          resolution: '1280x720',
          fps: 15,
          last_activity: new Date(Date.now() - 240000).toISOString()
        }
      ]
      
    } catch (err) {
      error.value = err.message
      console.error('Error fetching cameras:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  function selectCamera(cameraId) {
    selectedCamera.value = cameraId
  }
  
  // ========== ДЕЙСТВИЯ ДЛЯ СОБЫТИЙ ==========
  async function fetchEvents() {
    eventsLoading.value = true
    eventsError.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (allEvents.value.length === 0) {
        allEvents.value = generateTestEvents(1000)
      }
      
      let filteredEvents = [...allEvents.value]
      
      if (eventsFilters.value.fromDate) {
        const fromDate = new Date(eventsFilters.value.fromDate).getTime()
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.timestamp).getTime() >= fromDate
        )
      }
      
      if (eventsFilters.value.toDate) {
        const toDate = new Date(eventsFilters.value.toDate).getTime()
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.timestamp).getTime() <= toDate
        )
      }
      
      if (eventsFilters.value.type) {
        filteredEvents = filteredEvents.filter(event => 
          event.type === eventsFilters.value.type
        )
      }
      
      if (eventsFilters.value.cameraId) {
        filteredEvents = filteredEvents.filter(event => 
          event.camera_id === parseInt(eventsFilters.value.cameraId)
        )
      }
      
      filteredEvents.sort((a, b) => {
        let aVal = a[eventsFilters.value.sortColumn]
        let bVal = b[eventsFilters.value.sortColumn]
        
        if (eventsFilters.value.sortColumn === 'timestamp') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        }
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }
        
        if (aVal < bVal) return eventsFilters.value.sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return eventsFilters.value.sortDirection === 'asc' ? 1 : -1
        return 0
      })
      
      eventsTotalItems.value = filteredEvents.length
      
      const totalPages = Math.ceil(eventsTotalItems.value / eventsFilters.value.pageSize)
      if (eventsFilters.value.page > totalPages && totalPages > 0) {
        eventsFilters.value.page = totalPages
      } else if (eventsFilters.value.page < 1 && eventsTotalItems.value > 0) {
        eventsFilters.value.page = 1
      }
      
      const startIndex = (eventsFilters.value.page - 1) * eventsFilters.value.pageSize
      const endIndex = startIndex + eventsFilters.value.pageSize
      
      events.value = filteredEvents.slice(startIndex, endIndex)
      
    } catch (err) {
      eventsError.value = 'Ошибка загрузки событий: ' + err.message
      console.error('Error fetching events:', err)
    } finally {
      eventsLoading.value = false
    }
  }
  
  function setEventsFilters(newFilters) {
    eventsFilters.value = { ...eventsFilters.value, ...newFilters }
  }
  
  function resetEventsFilters() {
    eventsFilters.value = {
      fromDate: '',
      toDate: '',
      type: '',
      cameraId: '',
      page: 1,
      pageSize: 25,
      sortColumn: 'timestamp',
      sortDirection: 'desc'
    }
  }
  
  function setEventsSort(column, direction) {
    eventsFilters.value.sortColumn = column
    eventsFilters.value.sortDirection = direction
  }
  
  async function goToEventsPage(page) {
    const totalPages = Math.ceil(eventsTotalItems.value / eventsFilters.value.pageSize)
    if (page < 1 || page > totalPages) return
    
    eventsFilters.value.page = page
    await fetchEvents()
  }
  
  async function changeEventsPageSize(size) {
    const newSize = parseInt(size)
    if (newSize === eventsFilters.value.pageSize) return
    
    eventsFilters.value.pageSize = newSize
    eventsFilters.value.page = 1
    await fetchEvents()
  }
  
  function selectEvent(event) {
    selectedEvent.value = event
  }
  
  function clearSelectedEvent() {
    selectedEvent.value = null
  }
  
  // ========== ДЕЙСТВИЯ ДЛЯ АВТОМОБИЛЕЙ ==========
  async function fetchCars() {
    console.log('STORE: fetchCars started, current page:', carsFilters.value.page)
    carsLoading.value = true
    carsError.value = null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (allCars.value.length === 0) {
        console.log('STORE: Generating test cars')
        allCars.value = generateTestCars(500)
      }
      
      let filteredCars = [...allCars.value]
      console.log('STORE: Initial filtered cars:', filteredCars.length)
      
      // Применяем фильтры...
      if (carsFilters.value.plate) {
        const searchTerm = carsFilters.value.plate.toLowerCase()
        filteredCars = filteredCars.filter(car => 
          car.plate.toLowerCase().includes(searchTerm)
        )
      }
      
      if (carsFilters.value.status) {
        filteredCars = filteredCars.filter(car => 
          car.status === carsFilters.value.status
        )
      }
      
      if (carsFilters.value.fromDate) {
        const fromDate = new Date(carsFilters.value.fromDate).getTime()
        filteredCars = filteredCars.filter(car => 
          new Date(car.last_seen).getTime() >= fromDate
        )
      }
      
      if (carsFilters.value.toDate) {
        const toDate = new Date(carsFilters.value.toDate).getTime()
        filteredCars = filteredCars.filter(car => 
          new Date(car.last_seen).getTime() <= toDate
        )
      }
      
      // Сортируем...
      filteredCars.sort((a, b) => {
        let aVal = a[carsFilters.value.sortColumn]
        let bVal = b[carsFilters.value.sortColumn]
        
        if (carsFilters.value.sortColumn.includes('_seen')) {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        }
        
        if (aVal < bVal) return carsFilters.value.sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return carsFilters.value.sortDirection === 'asc' ? 1 : -1
        return 0
      })
      
      carsTotalItems.value = filteredCars.length
      console.log('STORE: After filtering, total items:', carsTotalItems.value)
      
      const totalPages = Math.ceil(carsTotalItems.value / carsFilters.value.pageSize)
      console.log('STORE: Calculated totalPages:', totalPages)
      
      // Проверяем корректность номера страницы
      if (carsFilters.value.page > totalPages && totalPages > 0) {
        console.log('STORE: Page too high, resetting to last page')
        carsFilters.value.page = totalPages
      } else if (carsFilters.value.page < 1 && carsTotalItems.value > 0) {
        console.log('STORE: Page too low, resetting to first page')
        carsFilters.value.page = 1
      }
      
      const startIndex = (carsFilters.value.page - 1) * carsFilters.value.pageSize
      const endIndex = startIndex + carsFilters.value.pageSize
      
      console.log('STORE: Page:', carsFilters.value.page, 'Start index:', startIndex, 'End index:', endIndex)
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Создаем НОВЫЙ массив
      const newCars = filteredCars.slice(startIndex, endIndex)
      console.log('STORE: New cars sliced, count:', newCars.length)
      
      if (newCars.length > 0) {
        console.log('STORE: First car on page:', newCars[0].plate)
        console.log('STORE: Last car on page:', newCars[newCars.length - 1].plate)
      }
      
      // Заменяем весь массив, чтобы Vue увидел изменение
      cars.value = newCars
      
      console.log('STORE: Cars array replaced, new length:', cars.value.length)
      
    } catch (err) {
      carsError.value = 'Ошибка загрузки автомобилей: ' + err.message
      console.error('STORE: Error fetching cars:', err)
    } finally {
      carsLoading.value = false
      console.log('STORE: fetchCars completed')
    }
  }
  
  async function fetchCarDetails(plate) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const car = allCars.value.find(c => c.plate === plate)
      if (car) {
        return {
          ...car,
          appearances: generateCarAppearances(car.plate),
          stats: generateCarStats()
        }
      }
      return null
      
    } catch (err) {
      console.error(`Error fetching car details ${plate}:`, err)
      throw err
    }
  }
  
  function setCarsFilters(newFilters) {
    carsFilters.value = { ...carsFilters.value, ...newFilters }
  }
  
  function resetCarsFilters() {
    carsFilters.value = {
      plate: '',
      status: '',
      fromDate: '',
      toDate: '',
      page: 1,
      pageSize: 25,
      sortColumn: 'last_seen',
      sortDirection: 'desc'
    }
  }
  
  function setCarsSort(column, direction) {
    carsFilters.value.sortColumn = column
    carsFilters.value.sortDirection = direction
  }
  
  async function goToCarsPage(page) {
    console.log('STORE: goToCarsPage called with page:', page, 'current carsFilters.page:', carsFilters.value.page)
    
    const totalPages = Math.ceil(carsTotalItems.value / carsFilters.value.pageSize)
    console.log('STORE: totalPages:', totalPages, 'carsTotalItems:', carsTotalItems.value, 'pageSize:', carsFilters.value.pageSize)
    
    if (page < 1 || page > totalPages) {
      console.log('STORE: Invalid page:', page)
      return
    }
    
    // Устанавливаем новую страницу
    carsFilters.value.page = page
    console.log('STORE: Page set to:', carsFilters.value.page)
    
    // Загружаем данные для новой страницы
    await fetchCars()
    console.log('STORE: fetchCars completed, cars count:', cars.value.length)
  }
  
  async function changeCarsPageSize(size) {
    const newSize = parseInt(size)
    if (newSize === carsFilters.value.pageSize) return
    
    carsFilters.value.pageSize = newSize
    carsFilters.value.page = 1
    await fetchCars()
  }
  
  function selectCar(car) {
    selectedCar.value = car
  }
  
  function clearSelectedCar() {
    selectedCar.value = null
  }
  
  async function exportCar(plate, format = 'json') {
    try {
      const car = allCars.value.find(c => c.plate === plate)
      if (!car) throw new Error('Автомобиль не найден')
      
      const data = {
        car: {
          ...car,
          appearances: generateCarAppearances(car.plate),
          stats: generateCarStats()
        },
        exported_at: new Date().toISOString(),
        format: format
      }
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `car_${plate}_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        // Простой CSV экспорт
        const headers = ['Номер', 'Статус', 'Первое появление', 'Последнее появление', 'Общее время (сек)', 'Количество']
        const row = [
          car.plate,
          car.status,
          car.first_seen,
          car.last_seen,
          car.total_duration_seconds,
          car.count
        ]
        const csvContent = [headers.join(','), row.join(',')].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `car_${plate}_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
    } catch (err) {
      console.error(`Error exporting car ${plate}:`, err)
      throw err
    }
  }
  
  async function exportCars(format = 'json') {
    try {
      const data = {
        filters: carsFilters.value,
        total: carsTotalItems.value,
        cars: cars.value,
        exported_at: new Date().toISOString(),
        format: format
      }
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cars_export_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const headers = ['Номер', 'Статус', 'Первое появление', 'Последнее появление', 'Общее время (сек)', 'Количество']
        const rows = cars.value.map(car => [
          car.plate,
          car.status,
          car.first_seen,
          car.last_seen,
          car.total_duration_seconds,
          car.count
        ])
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cars_export_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
    } catch (err) {
      console.error('Error exporting cars:', err)
      throw err
    }
  }
  
  // ========== ОБЩИЕ ДЕЙСТВИЯ ==========
  function addRecentEvent(event) {
    recentEvents.value.unshift({
      ...event,
      is_new: true
    })
    if (recentEvents.value.length > 50) {
      recentEvents.value = recentEvents.value.slice(0, 50)
    }
  }
  
  function markEventAsViewed(eventId) {
    const event = recentEvents.value.find(e => e.id === eventId)
    if (event) {
      event.is_new = false
    }
  }
  
  function clearRecentEvents() {
    recentEvents.value = []
  }
  
  function updateConnectionStatus(status) {
    connectionStatus.value = status
  }
  
  function startMonitoring() {
    isMonitoring.value = true
  }
  
  function stopMonitoring() {
    isMonitoring.value = false
  }
  
  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
  function getEventTypeLabel(type) {
    return eventTypeLabels.value[type] || type
  }
  
  function getEventTypeColor(type) {
    return eventTypeColors.value[type] || { bg: 'rgba(108, 117, 125, 0.2)', color: '#6c757d', border: 'rgba(108, 117, 125, 0.3)' }
  }
  
  function getObjectTypeLabel(type) {
    return objectTypeLabels.value[type] || type
  }
  
  function getObjectTypeIcon(type) {
    return objectTypeIcons.value[type] || '🎯'
  }
  
  function getObjectTypeColor(type) {
    return objectTypeColors.value[type] || '#118AB2'
  }
  
  function isEventNew(event) {
    const eventTime = new Date(event.timestamp).getTime()
    const now = Date.now()
    return (now - eventTime) < 300000 // 5 минут
  }
  
  function isCarNew(car) {
    const lastSeen = new Date(car.last_seen).getTime()
    const now = Date.now()
    return (now - lastSeen) < 86400000 // 24 часа
  }
  
  function getCarStatusLabel(status) {
    const labels = {
      'suspicious': 'Подозрительный',
      'watched': 'Под наблюдением',
      'normal': 'Обычный'
    }
    return labels[status] || status
  }
  
  function getCarStatusColor(status) {
    const colors = {
      'suspicious': { bg: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', border: 'rgba(220, 53, 69, 0.3)' },
      'watched': { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: 'rgba(255, 193, 7, 0.3)' },
      'normal': { bg: 'rgba(40, 167, 69, 0.2)', color: '#28a745', border: 'rgba(40, 167, 69, 0.3)' }
    }
    return colors[status] || { bg: 'rgba(108, 117, 125, 0.2)', color: '#6c757d', border: 'rgba(108, 117, 125, 0.3)' }
  }
  
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
  
  function formatDateTimeFull(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
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
  
  // ========== ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ ==========
  function generateTestEvents(count = 1000) {
    const events = []
    const eventTypes = ['person_phone', 'suspicious_car', 'crowd']
    const descriptions = [
      'Автомобиль A123BC',
      'Человек снимает на телефон',
      'Скопление 5+ человек',
      'Несанкционированная съемка',
      'Подозрительное поведение',
      'Долгое нахождение в зоне',
      'Оставленная сумка',
      'Неизвестный в охраняемой зоне',
      'Автомобиль без номеров'
    ]
    
    for (let i = 1; i <= count; i++) {
      const camera = cameras.value[Math.floor(Math.random() * cameras.value.length)] || { id: 1, name: 'Камера 1' }
      const eventTypeIndex = Math.floor(Math.random() * eventTypes.length)
      const descriptionIndex = Math.floor(Math.random() * descriptions.length)
      
      const daysAgo = Math.floor(Math.random() * 30)
      const hoursAgo = Math.floor(Math.random() * 24)
      const minutesAgo = Math.floor(Math.random() * 60)
      const secondsAgo = Math.floor(Math.random() * 60)
      
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() - daysAgo)
      eventDate.setHours(eventDate.getHours() - hoursAgo)
      eventDate.setMinutes(eventDate.getMinutes() - minutesAgo)
      eventDate.setSeconds(eventDate.getSeconds() - secondsAgo)
      
      const hasThumbnail = Math.random() > 0.3
      const hasClip = Math.random() > 0.5
      const isResolved = Math.random() > 0.7
      const severity = Math.floor(Math.random() * 3) + 1
      
      events.push({
        id: i,
        camera_id: camera.id,
        camera_name: camera.name,
        timestamp: eventDate.toISOString(),
        type: eventTypes[eventTypeIndex],
        description: descriptions[descriptionIndex],
        thumbnail_url: hasThumbnail ? `https://placehold.jp/100x75.png?text=Кадр+${i}` : null,
        clip_url: hasClip ? `https://example.com/api/events/${i}/clip.mp4` : null,
        has_clip: hasClip,
        is_resolved: isResolved,
        severity: severity,
        confidence: 0.7 + Math.random() * 0.3,
        objects: generateTestObjects(eventTypes[eventTypeIndex]),
        metadata: {
          detection_time: Math.floor(Math.random() * 5) + 1,
          frame_count: Math.floor(Math.random() * 100) + 10,
          processing_time: Math.floor(Math.random() * 2000) + 500,
          model_version: 'v2.1.4'
        }
      })
    }
    
    return events
  }
  
  function generateTestObjects(eventType) {
    if (eventType === 'suspicious_car') {
      return [{
        id: 1,
        type: 'car',
        plate: generateCarPlate(),
        confidence: 0.85 + Math.random() * 0.14,
        bbox: [
          Math.floor(Math.random() * 300),
          Math.floor(Math.random() * 200),
          Math.floor(Math.random() * 100 + 150),
          Math.floor(Math.random() * 60 + 40)
        ],
        color: getRandomCarColor(),
        brand: getRandomCarBrand()
      }]
    } else if (eventType === 'person_phone') {
      return [
        {
          id: 1,
          type: 'person',
          confidence: 0.80 + Math.random() * 0.19,
          bbox: [
            Math.floor(Math.random() * 300),
            Math.floor(Math.random() * 200),
            Math.floor(Math.random() * 80 + 40),
            Math.floor(Math.random() * 100 + 100)
          ],
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age_group: getRandomAgeGroup()
        },
        {
          id: 2,
          type: 'phone',
          confidence: 0.85 + Math.random() * 0.14,
          bbox: [
            Math.floor(Math.random() * 300 + 20),
            Math.floor(Math.random() * 200 + 20),
            30,
            40
          ],
          color: getRandomPhoneColor()
        }
      ]
    } else {
      const objects = []
      const count = Math.floor(Math.random() * 5) + 3
      
      for (let i = 1; i <= count; i++) {
        objects.push({
          id: i,
          type: 'person',
          confidence: 0.75 + Math.random() * 0.24,
          bbox: [
            Math.floor(Math.random() * 400),
            Math.floor(Math.random() * 300),
            Math.floor(Math.random() * 70 + 30),
            Math.floor(Math.random() * 90 + 80)
          ],
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age_group: getRandomAgeGroup()
        })
      }
      
      return objects
    }
  }
  
  function generateTestCars(count = 500) {
    const cars = []
    const statuses = ['suspicious', 'watched', 'normal']
    
    for (let i = 1; i <= count; i++) {
      const plate = generateCarPlate()
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      const daysAgo = Math.floor(Math.random() * 90)
      const firstSeen = new Date()
      firstSeen.setDate(firstSeen.getDate() - daysAgo)
      
      const lastSeen = new Date(firstSeen)
      lastSeen.setHours(lastSeen.getHours() + Math.floor(Math.random() * 24))
      lastSeen.setMinutes(lastSeen.getMinutes() + Math.floor(Math.random() * 60))
      
      cars.push({
        plate,
        status,
        first_seen: firstSeen.toISOString(),
        last_seen: lastSeen.toISOString(),
        total_duration_seconds: Math.floor(Math.random() * 36000) + 600,
        count: Math.floor(Math.random() * 50) + 1,
        camera_ids: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, 
          () => Math.floor(Math.random() * 6) + 1
        )
      })
    }
    
    return cars
  }
  
  function generateCarAppearances(plate) {
    const appearances = []
    const count = Math.floor(Math.random() * 10) + 5
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)
      timestamp.setHours(Math.floor(Math.random() * 24))
      timestamp.setMinutes(Math.floor(Math.random() * 60))
      
      const cameraId = Math.floor(Math.random() * 6) + 1
      const cameraNames = ['Вход в офис', 'Парковка', 'Ресепшен', 'Кухня', 'Конференц-зал', 'Серверная']
      
      appearances.push({
        timestamp: timestamp.toISOString(),
        camera_id: cameraId,
        camera_name: cameraNames[cameraId - 1],
        thumbnail_url: Math.random() > 0.3 ? `https://placehold.jp/100x75.png?text=Авто+${plate}` : null,
        event_id: Math.floor(Math.random() * 1000) + 1
      })
    }
    
    return appearances.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }
  
  function generateCarStats() {
    const stats = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      stats.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5)
      })
    }
    
    return stats
  }
  
  function generateCarPlate() {
    const letters = 'АВЕКМНОРСТУХ'
    const numbers = Math.floor(Math.random() * 900) + 100
    const letter1 = letters[Math.floor(Math.random() * letters.length)]
    const letter2 = letters[Math.floor(Math.random() * letters.length)]
    const letter3 = letters[Math.floor(Math.random() * letters.length)]
    return `${letter1}${numbers}${letter2}${letter3}`
  }
  
  function getRandomCarColor() {
    const colors = ['черный', 'белый', 'серый', 'синий', 'красный', 'зеленый', 'серебристый']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  function getRandomCarBrand() {
    const brands = ['Toyota', 'Hyundai', 'Kia', 'Lada', 'BMW', 'Mercedes', 'Volkswagen', 'Skoda']
    return brands[Math.floor(Math.random() * brands.length)]
  }
  
  function getRandomAgeGroup() {
    const groups = ['18-25', '26-35', '36-45', '46-55', '56+']
    return groups[Math.floor(Math.random() * groups.length)]
  }
  
  function getRandomPhoneColor() {
    const colors = ['черный', 'белый', 'серебристый', 'золотой', 'синий', 'красный']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  function $reset() {
    cameras.value = []
    selectedCamera.value = null
    isLoading.value = false
    error.value = null
    connectionStatus.value = 'online'
    recentEvents.value = []
    isMonitoring.value = false
    
    events.value = []
    allEvents.value = []
    eventsLoading.value = false
    eventsError.value = null
    selectedEvent.value = null
    eventsFilters.value = {
      fromDate: '',
      toDate: '',
      type: '',
      cameraId: '',
      page: 1,
      pageSize: 25,
      sortColumn: 'timestamp',
      sortDirection: 'desc'
    }
    eventsTotalItems.value = 0
    
    cars.value = []
    allCars.value = []
    carsLoading.value = false
    carsError.value = null
    selectedCar.value = null
    carsFilters.value = {
      plate: '',
      status: '',
      fromDate: '',
      toDate: '',
      page: 1,
      pageSize: 25,
      sortColumn: 'last_seen',
      sortDirection: 'desc'
    }
    carsTotalItems.value = 0
  }
  
  // ========== ЭКСПОРТ ==========
  return {
    // Общее состояние
    cameras,
    selectedCamera,
    isLoading,
    error,
    connectionStatus,
    recentEvents,
    isMonitoring,
    
    // Состояние событий
    events,
    eventsLoading,
    eventsError,
    selectedEvent,
    eventsFilters,
    eventsTotalItems,
    eventsTotalPages,
    eventsVisiblePages,
    eventsStartItem,
    eventsEndItem,
    
    // Состояние автомобилей
    cars: carsWithStats,
    carsLoading,
    carsError,
    selectedCar,
    carsFilters,
    carsTotalItems,
    carsTotalPages,
    carsVisiblePages,
    carsStartItem,
    carsEndItem,
    
    // Геттеры камер
    cameraOptions,
    selectedCameraData,
    currentVideoUrl,
    hasCameras,
    
    // Геттеры событий
    eventsWithThumbnails,
    eventsWithClips,
    eventTypeLabels,
    eventTypeColors,
    objectTypeLabels,
    objectTypeIcons,
    objectTypeColors,
    
    // Геттеры автомобилей
    
    // Действия камер
    fetchCameras,
    selectCamera,
    
    // Действия событий
    fetchEvents,
    setEventsFilters,
    resetEventsFilters,
    setEventsSort,
    goToEventsPage,
    changeEventsPageSize,
    selectEvent,
    clearSelectedEvent,
    
    // Действия автомобилей
    fetchCars,
    fetchCarDetails,
    setCarsFilters,
    resetCarsFilters,
    setCarsSort,
    goToCarsPage,
    changeCarsPageSize,
    selectCar,
    clearSelectedCar,
    exportCar,
    exportCars,
    
    // Общие действия
    addRecentEvent,
    markEventAsViewed,
    clearRecentEvents,
    updateConnectionStatus,
    startMonitoring,
    stopMonitoring,
    
    // Вспомогательные методы
    getEventTypeLabel,
    getEventTypeColor,
    getObjectTypeLabel,
    getObjectTypeIcon,
    getObjectTypeColor,
    isEventNew,
    getCarStatusLabel,
    getCarStatusColor,
    isCarNew,
    formatDateTime,
    formatDateTimeFull,
    formatDuration,
    
    $reset
  }
})