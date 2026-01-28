import apiClient from './index'

export default {
  // Получить события с фильтрацией и пагинацией
  async getEvents(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.pageSize || 25,
        ...(filters.cameraId && { camera_id: filters.cameraId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.fromDate && { from_datetime: filters.fromDate }),
        ...(filters.toDate && { to_datetime: filters.toDate }),
        ...(filters.sortColumn && { sort_by: filters.sortColumn }),
        ...(filters.sortDirection && { sort_order: filters.sortDirection })
      }
      
      const response = await apiClient.get('/api/events', { params })
      
      // Формат ответа API должен быть:
      // {
      //   events: [...], // данные для текущей страницы
      //   total: 1000,   // общее количество событий
      //   page: 1,       // текущая страница
      //   page_size: 25  // размер страницы
      // }
      
      return {
        events: response.data.events || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.page_size || 25
      }
      
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  },

  // Получить детали события
  async getEvent(id) {
    try {
      const response = await apiClient.get(`/api/events/${id}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error)
      throw error
    }
  },

  // Получить ключевой кадр
  getEventFrameUrl(id) {
    return `${import.meta.env.VITE_API_BASE_URL || ''}/api/events/${id}/frame`
  },

  // Получить видеофрагмент
  getEventClipUrl(id) {
    return `${import.meta.env.VITE_API_BASE_URL || ''}/api/events/${id}/clip`
  },

  // Скачать видеофрагмент
  async downloadEventClip(id) {
    try {
      const response = await apiClient.get(`/api/events/${id}/clip`, {
        responseType: 'blob'
      })
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `event_${id}_clip.mp4`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error(`Failed to download clip for event ${id}:`, error)
      throw error
    }
  },

  // Экспортировать события
  async exportEvents(filters = {}, format = 'json') {
    try {
      const params = {
        format,
        ...(filters.cameraId && { camera_id: filters.cameraId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.fromDate && { from_datetime: filters.fromDate }),
        ...(filters.toDate && { to_datetime: filters.toDate })
      }
      
      const response = await apiClient.get('/api/events/export', {
        params,
        responseType: format === 'json' ? 'json' : 'blob'
      })
      
      if (format === 'csv') {
        // Для CSV создаем файл для скачивания
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
      
      return response.data
      
    } catch (error) {
      console.error('Failed to export events:', error)
      throw error
    }
  },

  // Отметить событие как решенное
  async markEventAsResolved(id) {
    try {
      const response = await apiClient.patch(`/api/events/${id}/resolve`)
      return response.data
    } catch (error) {
      console.error(`Failed to mark event ${id} as resolved:`, error)
      throw error
    }
  },

  // Подписаться на события в реальном времени (WebSocket)
  subscribeToEvents(callback) {
    const wsUrl = import.meta.env.VITE_WS_URL || 
                  `ws://${window.location.host.replace(/^http/, 'ws')}/ws/events`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected for real-time events')
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'events' }))
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_event') {
          callback(data.event)
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
      // Попытка переподключения через 5 секунд
      setTimeout(() => this.subscribeToEvents(callback), 5000)
    }
    
    // Возвращаем функцию для отписки
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }
}