<template>
  <div class="error-dialog-overlay" @click.self="close">
    <div class="error-dialog">
      <div class="dialog-header" :class="errorType">
        <div class="header-icon">
          <span v-if="errorType === 'error'">❌</span>
          <span v-if="errorType === 'warning'">⚠️</span>
          <span v-if="errorType === 'network'">🌐</span>
        </div>
        <div class="header-content">
          <h3>{{ error.title || 'Ошибка' }}</h3>
          <p>{{ error.message }}</p>
        </div>
        <button @click="close" class="header-close">×</button>
      </div>
      
      <div class="dialog-body">
        <div v-if="error.details" class="error-details">
          <h4>Детали ошибки:</h4>
          <pre class="details-code">{{ error.details }}</pre>
        </div>
        
        <div v-if="error.stack" class="error-stack">
          <h4>Стек вызовов:</h4>
          <pre class="stack-code">{{ error.stack }}</pre>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button @click="close" class="btn btn-close">
          Закрыть
        </button>
        <button 
          v-if="error.url" 
          @click="retry" 
          class="btn btn-retry"
        >
          Повторить
        </button>
        <button 
          @click="copyError" 
          class="btn btn-copy"
        >
          Копировать ошибку
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  error: {
    type: Object,
    required: true,
    default: () => ({
      title: 'Ошибка',
      message: 'Произошла неизвестная ошибка',
      details: null,
      stack: null,
      url: null
    })
  }
})

const emit = defineEmits(['close', 'retry'])

const errorType = computed(() => {
  if (props.error.message?.includes('сеть') || 
      props.error.message?.includes('соединение') ||
      props.error.message?.includes('network')) {
    return 'network'
  }
  return 'error'
})

function close() {
  emit('close')
}

function retry() {
  if (props.error.url) {
    emit('retry')
  }
}

async function copyError() {
  const errorText = `
Ошибка: ${props.error.title}
Сообщение: ${props.error.message}
${props.error.details ? `Детали: ${props.error.details}` : ''}
${props.error.stack ? `Стек: ${props.error.stack}` : ''}
${props.error.url ? `URL: ${props.error.url}` : ''}
  `.trim()
  
  try {
    await navigator.clipboard.writeText(errorText)
    alert('Ошибка скопирована в буфер обмена')
  } catch (err) {
    console.error('Не удалось скопировать ошибку:', err)
  }
}
</script>

<style scoped>
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.error-dialog {
  background: #1a1a2e;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 2px solid #0f3460;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.dialog-header {
  padding: 20px 30px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  border-bottom: 1px solid rgba(15, 52, 96, 0.3);
}

.dialog-header.error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.dialog-header.warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
}

.dialog-header.network {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

.header-icon {
  font-size: 32px;
  margin-top: 5px;
}

.header-content {
  flex: 1;
}

.header-content h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.header-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.5;
}

.header-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.header-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
}

.error-details,
.error-stack {
  margin-bottom: 20px;
}

.error-details h4,
.error-stack h4 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.details-code,
.stack-code {
  background: #0f0f23;
  color: #d0d0e0;
  padding: 15px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  border: 1px solid rgba(15, 52, 96, 0.3);
  margin: 0;
}

.dialog-footer {
  padding: 20px 30px;
  background: #16213e;
  border-top: 1px solid rgba(15, 52, 96, 0.3);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close {
  background: #6c757d;
  color: white;
}

.btn-close:hover {
  background: #5a6268;
}

.btn-retry {
  background: #0f3460;
  color: white;
}

.btn-retry:hover {
  background: #1a4a7a;
}

.btn-copy {
  background: #6f42c1;
  color: white;
}

.btn-copy:hover {
  background: #5a32a3;
}
</style>