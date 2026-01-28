import apiClient from './index'

export default {
  // Получить все камеры
  async getCameras() {
    try {
      return await apiClient.get('/api/cameras')
    } catch (error) {
      console.error('Failed to fetch cameras:', error)
      throw error
    }
  },

  // Получить конкретную камеру
  async getCamera(id) {
    try {
      return await apiClient.get(`/api/cameras/${id}`)
    } catch (error) {
      console.error(`Failed to fetch camera ${id}:`, error)
      throw error
    }
  }
}