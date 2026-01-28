<template>
  <div class="loading-spinner" :class="{ 'inline': inline }">
    <div class="spinner"></div>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  },
  inline: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner.inline {
  padding: 20px;
  flex-direction: row;
  gap: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(15, 52, 96, 0.2);
  border-top: 3px solid #0f3460;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.inline .spinner {
  width: 20px;
  height: 20px;
}

.message {
  margin-top: 15px;
  color: #b0b0c0;
  font-size: 14px;
}

.loading-spinner.inline .message {
  margin-top: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>