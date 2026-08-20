<template>
  <div class="min-h-screen lg:grid lg:grid-cols-2">
    <div
      class="flex flex-col items-center justify-center gap-8 bg-brand-50 px-8 py-16 lg:min-h-screen lg:py-0"
    >
      <img src="/logo.png" alt="Vocali" class="w-72 lg:w-[26rem]" />
      <p class="max-w-sm text-center text-base leading-relaxed text-brand-700">
        Crea tu cuenta y empieza a transcribir en menos de un minuto.
      </p>
    </div>

    <div class="flex items-center justify-center bg-slate-50 px-6 py-12">
      <div class="w-full max-w-sm">
        <h1 class="mb-1 text-2xl font-semibold text-slate-900">Crear cuenta</h1>
        <p class="mb-8 text-sm text-slate-500">
          Te enviaremos un código para verificar tu email.
        </p>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label
              for="email"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="tu@email.com"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              for="password"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <p class="mt-1.5 text-xs text-slate-500">
              Mínimo 8 caracteres, con mayúscula, minúscula y número.
            </p>
          </div>

          <p
            v-if="error"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? "Creando cuenta…" : "Crear cuenta" }}
          </button>
        </form>

        <p class="mt-6 text-sm text-slate-500">
          ¿Ya tienes cuenta?
          <NuxtLink
            to="/login"
            class="font-medium text-brand-700 hover:underline"
          >
            Inicia sesión
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { register } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const onSubmit = async () => {
  error.value = "";
  loading.value = true;
  try {
    await register(email.value, password.value);
    await navigateTo(`/confirm?email=${encodeURIComponent(email.value)}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo crear la cuenta";
  } finally {
    loading.value = false;
  }
};
</script>
