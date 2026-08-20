<template>
  <div class="min-h-screen bg-slate-50">
    <header v-if="currentEmail" class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4"
      >
        <NuxtLink to="/" class="text-lg font-semibold text-slate-900">
          Vocali
        </NuxtLink>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-slate-500">{{ currentEmail }}</span>
          <button
            class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            @click="logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const { currentEmail, logout, getSession } = useAuth();

onMounted(() => {
  getSession();
});
</script>
