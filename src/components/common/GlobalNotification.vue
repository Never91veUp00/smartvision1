<template>
  <div class="global-notification" :class="type">
    <div class="notification-content">
      <div class="notification-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-if="type === 'error'">❌</span>
        <span v-if="type === 'warning'">⚠️</span>
        <span v-if="type === 'info'">ℹ️</span>
      </div>
      <div class="notification-text">
        {{ message }}
      </div>
      <button @click="$emit('close')" class="notification-close">
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.global-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  min-width: 300px;
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.global-notification.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-left: 4px solid #1e7e34;
}

.global-notification.error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border-left: 4px solid #bd2130;
}

.global-notification.warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  border-left: 4px solid #d39e00;
}

.global-notification.info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  border-left: 4px solid #117a8b;
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  gap: 15px;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
  color: white;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.4;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>