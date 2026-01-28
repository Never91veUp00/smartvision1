import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Простой обработчик ошибок
apiClient.interceptors.response.use(
  response => response.data, // Возвращаем только данные
  error => {
    console.error('API Error:', error)
    if (error.response) {
      // Сервер ответил с ошибкой
      throw new Error(`Ошибка сервера: ${error.response.status}`)
    } else if (error.request) {
      // Запрос был сделан, но нет ответа
      throw new Error('Нет ответа от сервера. Проверьте подключение.')
    } else {
      // Ошибка при настройке запроса
      throw new Error('Ошибка при отправке запроса')
    }
  }
)

export default apiClient