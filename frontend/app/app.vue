<template>
  <div class="min-h-screen bg-slate-50">
    <header v-if="currentEmail" class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4"
      >
        <NuxtLink to="/">
          <img src="/logo.png" alt="Vocali" class="h-7" />
        </NuxtLink>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-slate-500">{{ currentEmail }}</span>
          <button
            class="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
            @click="logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { currentEmail, logout, getSession } = useAuth();

onMounted(() => {
  getSession();
});
</script>
