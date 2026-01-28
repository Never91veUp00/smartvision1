# 1. Установка зависимостей
npm install vue vue-router pinia axios chart.js
npm install -D @vitejs/plugin-vue vite

# 2. Запуск в режиме разработки
npm run dev

# 3. Сборка для продакшена
npm run build

Особенности реализации:
Темная тема с высоким контрастом для круглосуточной работы

Адаптивный дизайн под 1366×768

Три вкладки как в ТЗ: мониторинг, журнал событий, подозрительные авто

Компонентный подход с переиспользуемыми компонентами

Обработка ошибок и состояния загрузки

Пагинация и фильтрация

Модальные окна для деталей

WebSocket для реального времени (заглушка)

Экспорт данных в JSON

Копирование ошибок в буфер обмена

frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── index.js          # Основной API клиент
│   │   ├── cameras.js
│   │   ├── events.js
│   │   └── cars.js
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.vue
│   │   │   └── Layout.vue
│   │   ├── common/
│   │   │   ├── LoadingSpinner.vue
│   │   │   ├── ErrorMessage.vue
│   │   │   └── Pagination.vue
│   │   ├── monitoring/
│   │   │   ├── VideoPlayer.vue
│   │   │   ├── EventFeed.vue
│   │   ├── events/
│   │   │   ├── EventsTable.vue
│   │   │   └── EventDetailsModal.vue
│   │   └── cars/
│   │       ├── CarsTable.vue
│   │       └── CarDetailsModal.vue
│   ├── router/
│   │   └── index.js
│   ├── store/
│   │   └── index.js          # Pinia store
│   ├── views/
│   │   ├── Monitoring.vue
│   │   ├── EventsLog.vue
│   │   └── SuspiciousCars.vue
│   ├── styles/
│   │   └── main.css          # Глобальные стили
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js