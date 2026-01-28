import apiClient from './index'

export default {
  // Получить список автомобилей с фильтрацией и пагинацией
  async getCars(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.pageSize || 25,
        ...(filters.plate && { plate: filters.plate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { from_date: filters.fromDate }),
        ...(filters.toDate && { to_date: filters.toDate }),
        ...(filters.sortColumn && { sort_by: filters.sortColumn }),
        ...(filters.sortDirection && { sort_order: filters.sortDirection })
      }
      
      const response = await apiClient.get('/api/cars', { params })
      
      // Формат ответа API:
      // {
      //   cars: [...],        // данные для текущей страницы
      //   total: 500,         // общее количество автомобилей
      //   page: 1,            // текущая страница
      //   page_size: 25       // размер страницы
      // }
      
      return {
        cars: response.data.cars || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.page_size || 25
      }
      
    } catch (error) {
      console.error('Failed to fetch cars:', error)
      throw error
    }
  },

  // Получить детали автомобиля по номеру
  async getCar(plate) {
    try {
      const response = await apiClient.get(`/api/cars/${encodeURIComponent(plate)}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch car ${plate}:`, error)
      throw error
    }
  },

  // Получить статистику автомобиля
  async getCarStats(plate, period = 'day') {
    try {
      const params = { period }
      const response = await apiClient.get(
        `/api/cars/${encodeURIComponent(plate)}/stats`,
        { params }
      )
      return response.data.stats || []
    } catch (error) {
      console.error(`Failed to fetch stats for car ${plate}:`, error)
      throw error
    }
  },

  // Получить историю появлений автомобиля
  async getCarAppearances(plate, limit = 50) {
    try {
      const params = { limit }
      const response = await apiClient.get(
        `/api/cars/${encodeURIComponent(plate)}/appearances`,
        { params }
      )
      return response.data.appearances || []
    } catch (error) {
      console.error(`Failed to fetch appearances for car ${plate}:`, error)
      throw error
    }
  },

  // Изменить статус автомобиля
  async updateCarStatus(plate, status) {
    try {
      const response = await apiClient.patch(`/api/cars/${encodeURIComponent(plate)}/status`, {
        status
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update status for car ${plate}:`, error)
      throw error
    }
  },

  // Экспортировать данные автомобилей
  async exportCars(filters = {}, format = 'json') {
    try {
      const params = {
        format,
        ...(filters.plate && { plate: filters.plate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { from_date: filters.fromDate }),
        ...(filters.toDate && { to_date: filters.toDate })
      }
      
      const response = await apiClient.get('/api/cars/export', {
        params,
        responseType: format === 'json' ? 'json' : 'blob'
      })
      
      if (format === 'csv') {
        // Создаем файл для скачивания
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `cars_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
      
      return response.data
      
    } catch (error) {
      console.error('Failed to export cars:', error)
      throw error
    }
  },

  // Экспортировать данные конкретного автомобиля
  async exportCar(plate, format = 'json') {
    try {
      const params = { format }
      const response = await apiClient.get(
        `/api/cars/${encodeURIComponent(plate)}/export`,
        { params, responseType: format === 'json' ? 'json' : 'blob' }
      )
      
      if (format === 'json') {
        // Для JSON создаем файл
        const dataStr = JSON.stringify(response.data, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `car_${plate}_${new Date().toISOString().split('T')[0]}.json`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        // Для CSV
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `car_${plate}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
      
      return response.data
      
    } catch (error) {
      console.error(`Failed to export car ${plate}:`, error)
      throw error
    }
  },

  // Подписаться на обновления автомобилей (WebSocket)
  subscribeToCars(callback) {
    const wsUrl = import.meta.env.VITE_WS_URL || 
                  `ws://${window.location.host.replace(/^http/, 'ws')}/ws/cars`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected for cars updates')
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'cars' }))
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'car_update') {
          callback(data.car)
        } else if (data.type === 'new_car') {
          callback(data.car, true)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...')
      setTimeout(() => this.subscribeToCars(callback), 5000)
    }
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }
}