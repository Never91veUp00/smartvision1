<template>
  <div class="app-layout">
    <Header />
    
    <div class="main-container">
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link 
            to="/" 
            class="nav-item"
            :class="{ active: $route.path === '/' }"
          >
            <span class="nav-icon">📹</span>
            <span class="nav-text">Онлайн-мониторинг</span>
          </router-link>
          
          <router-link 
            to="/events" 
            class="nav-item"
            :class="{ active: $route.path === '/events' }"
          >
            <span class="nav-icon">📋</span>
            <span class="nav-text">Журнал событий</span>
          </router-link>
          
          <router-link 
            to="/cars" 
            class="nav-item"
            :class="{ active: $route.path === '/cars' }"
          >
            <span class="nav-icon">🚗</span>
            <span class="nav-text">Подозрительные авто</span>
          </router-link>
        </nav>
      </aside>
      
      <main class="content-area">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import Header from './Header.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f23;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  border-right: 1px solid #0f3460;
  padding: 20px 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  color: #b0b0c0;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  font-size: 15px;
}

.nav-item:hover {
  background: rgba(15, 52, 96, 0.3);
  color: white;
}

.nav-item.active {
  background: #0f3460;
  color: white;
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  flex: 1;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>