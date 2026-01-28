<template>
  <div class="error-message" :class="type">
    <div class="error-icon">
      <span v-if="type === 'error'">❌</span>
      <span v-if="type === 'warning'">⚠️</span>
      <span v-if="type === 'info'">ℹ️</span>
    </div>
    
    <div class="error-content">
      <h4 v-if="title" class="error-title">{{ title }}</h4>
      <p class="error-text">{{ message }}</p>
    </div>
    
    <div v-if="retryable" class="error-actions">
      <button @click="$emit('retry')" class="retry-btn">Повторить</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'warning', 'info'].includes(value)
  },
  title: String,
  message: {
    type: String,
    required: true
  },
  retryable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['retry'])
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  border-left-width: 4px;
  border-left-style: solid;
  background: rgba(255, 255, 255, 0.05);
}

.error-message.error {
  border-left-color: #dc3545;
}

.error-message.warning {
  border-left-color: #ffc107;
}

.error-message.info {
  border-left-color: #17a2b8;
}

.error-icon {
  font-size: 24px;
  line-height: 1;
}

.error-content {
  flex: 1;
}

.error-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.error-message.error .error-title {
  color: #dc3545;
}

.error-message.warning .error-title {
  color: #ffc107;
}

.error-message.info .error-title {
  color: #17a2b8;
}

.error-text {
  margin: 0;
  color: #b0b0c0;
  font-size: 14px;
  line-height: 1.5;
}

.error-actions {
  margin-top: 5px;
}

.retry-btn {
  padding: 8px 20px;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #1a4a7a;
}
</style>