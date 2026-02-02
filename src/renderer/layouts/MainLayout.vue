<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);
const expandedMenus = ref(['master']);
const appVersion = ref('1.0.0');
const currentUser = ref(null);

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    route: '/'
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: 'database',
    children: [
      { id: 'satker', label: 'Satker', route: '/master/satker' },
      { id: 'pegawai', label: 'Pegawai', route: '/master/pegawai' },
      { id: 'supplier', label: 'Supplier', route: '/master/supplier' },
      { id: 'dipa', label: 'DIPA', route: '/master/dipa' },
      { id: 'sbm', label: 'SBM', route: '/master/sbm' }
    ]
  },
  {
    id: 'transaksi',
    label: 'Transaksi',
    icon: 'file-text',
    children: [
      { id: 'requests', label: 'Permintaan', route: '/requests' },
      { id: 'contracts', label: 'Kontrak', route: '/contracts' },
      { id: 'payments', label: 'Pembayaran', route: '/payments' }
    ]
  },
  {
    id: 'reports',
    label: 'Laporan',
    icon: 'chart',
    route: '/reports'
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: 'settings',
    route: '/settings'
  }
];

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const toggleMenu = (menuId) => {
  const index = expandedMenus.value.indexOf(menuId);
  if (index > -1) {
    expandedMenus.value.splice(index, 1);
  } else {
    expandedMenus.value.push(menuId);
  }
};

const isMenuExpanded = (menuId) => {
  return expandedMenus.value.includes(menuId);
};

const isActiveRoute = (routePath) => {
  if (routePath === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(routePath);
};

const logout = () => {
  localStorage.removeItem('ppk_user');
  router.push('/login');
};

onMounted(async () => {
  // Load user data
  const userData = localStorage.getItem('ppk_user');
  if (userData) {
    currentUser.value = JSON.parse(userData);
  }

  // Get app version
  try {
    if (window.electronAPI?.app?.getVersion) {
      appVersion.value = await window.electronAPI.app.getVersion();
    }
  } catch (error) {
    console.error('Failed to get version:', error);
  }
});

// Icon components (inline SVG)
const icons = {
  home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`,
  database: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>`,
  'file-text': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
  chart: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`,
  settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
  chevronDown: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>`,
  chevronRight: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>`,
  menu: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>`,
  logout: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>`,
  user: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>`
};

const getIcon = (name) => icons[name] || icons.home;
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-navy-800 text-white transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-navy-700">
        <div v-if="!sidebarCollapsed" class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
            P
          </div>
          <span class="font-bold text-lg">PPK Asisten</span>
        </div>
        <button
          @click="toggleSidebar"
          class="p-1 rounded hover:bg-navy-700 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="icons.menu"></svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-2">
          <template v-for="item in menuItems" :key="item.id">
            <!-- Menu with children -->
            <li v-if="item.children">
              <button
                @click="toggleMenu(item.id)"
                :class="[
                  'w-full flex items-center px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-navy-700',
                  isActiveRoute(item.children[0]?.route?.split('/').slice(0, -1).join('/') || '') ? 'bg-navy-700' : ''
                ]"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIcon(item.icon)"></svg>
                <span v-if="!sidebarCollapsed" class="ml-3 flex-1 text-left">{{ item.label }}</span>
                <svg
                  v-if="!sidebarCollapsed"
                  :class="['w-4 h-4 transition-transform', isMenuExpanded(item.id) ? 'rotate-180' : '']"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  v-html="icons.chevronDown"
                ></svg>
              </button>

              <!-- Submenu -->
              <ul
                v-if="!sidebarCollapsed && isMenuExpanded(item.id)"
                class="mt-1 ml-4 pl-4 border-l border-navy-600 space-y-1"
              >
                <li v-for="child in item.children" :key="child.id">
                  <router-link
                    :to="child.route"
                    :class="[
                      'block px-3 py-2 rounded-lg text-sm transition-colors',
                      isActiveRoute(child.route) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                    ]"
                  >
                    {{ child.label }}
                  </router-link>
                </li>
              </ul>
            </li>

            <!-- Menu without children -->
            <li v-else>
              <router-link
                :to="item.route"
                :class="[
                  'flex items-center px-3 py-2 rounded-lg transition-colors',
                  isActiveRoute(item.route) ? 'bg-blue-600 text-white' : 'hover:bg-navy-700'
                ]"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIcon(item.icon)"></svg>
                <span v-if="!sidebarCollapsed" class="ml-3">{{ item.label }}</span>
              </router-link>
            </li>
          </template>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="border-t border-navy-700 p-4">
        <div v-if="!sidebarCollapsed" class="text-xs text-gray-400 text-center">
          v{{ appVersion }}
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen">
      <!-- Header -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-gray-800">
            {{ $route.meta.title || 'PPK Asisten' }}
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <!-- User Info -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="icons.user"></svg>
            </div>
            <div class="hidden md:block">
              <p class="text-sm font-medium text-gray-700">{{ currentUser?.name || 'User' }}</p>
              <p class="text-xs text-gray-500">{{ currentUser?.role || 'Guest' }}</p>
            </div>
          </div>

          <!-- Logout Button -->
          <button
            @click="logout"
            class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="icons.logout"></svg>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t px-6 py-3">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>PPK Asisten - Politeknik Kelautan dan Perikanan Sorong</span>
          <span>&copy; {{ new Date().getFullYear() }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.bg-navy-800 {
  background-color: #1e3a5f;
}
.bg-navy-700 {
  background-color: #2c4a6e;
}
.bg-navy-600 {
  background-color: #3b5998;
}
.border-navy-700 {
  border-color: #2c4a6e;
}
.border-navy-600 {
  border-color: #3b5998;
}
</style>
