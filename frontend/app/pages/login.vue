<template>
  <div class="mx-auto max-w-sm py-12">
    <h1 class="mb-1 text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
    <p class="mb-8 text-sm text-slate-500">
      Accede para gestionar tus transcripciones.
    </p>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <label
          for="email"
          class="mb-1 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        />
      </div>

      <div>
        <label
          for="password"
          class="mb-1 block text-sm font-medium text-slate-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {{ loading ? "Entrando..." : "Entrar" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      ¿No tienes cuenta?
      <NuxtLink to="/register" class="text-slate-900 underline">
        Regístrate
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const onSubmit = async () => {
  error.value = "";
  loading.value = true;
  try {
    await login(email.value, password.value);
    await navigateTo("/");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo iniciar sesión";
  } finally {
    loading.value = false;
  }
};
</script>
