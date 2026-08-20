<template>
  <div class="min-h-screen lg:grid lg:grid-cols-2">
    <div
      class="flex flex-col items-center justify-center gap-8 bg-brand-50 px-8 py-16 lg:min-h-screen lg:py-0"
    >
      <img src="/logo.png" alt="Vocali" class="w-72 lg:w-[26rem]" />
      <p class="max-w-sm text-center text-base leading-relaxed text-brand-700">
        Último paso: confirma tu email y ya podrás empezar.
      </p>
    </div>

    <div class="flex items-center justify-center bg-slate-50 px-6 py-12">
      <div class="w-full max-w-sm">
        <h1 class="mb-1 text-2xl font-semibold text-slate-900">
          Verifica tu email
        </h1>
        <p class="mb-8 text-sm text-slate-500">
          Hemos enviado un código de 6 dígitos a
          <span class="font-medium text-slate-900">{{ email }}</span
          >.
        </p>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label
              for="code"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Código de verificación
            </label>
            <input
              id="code"
              v-model="code"
              type="text"
              inputmode="numeric"
              required
              autocomplete="one-time-code"
              placeholder="123456"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-lg tracking-[0.3em] text-slate-900 transition outline-none placeholder:tracking-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
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
            {{ loading ? "Verificando…" : "Verificar" }}
          </button>
        </form>

        <p class="mt-6 text-sm text-slate-500">
          <NuxtLink
            to="/login"
            class="font-medium text-brand-700 hover:underline"
          >
            Volver a iniciar sesión
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { confirm } = useAuth();
const route = useRoute();

const email = computed(() => (route.query.email as string) ?? "");
const code = ref("");
const error = ref("");
const loading = ref(false);

const onSubmit = async () => {
  error.value = "";
  loading.value = true;
  try {
    await confirm(email.value, code.value);
    await navigateTo("/login?confirmed=1");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Código incorrecto";
  } finally {
    loading.value = false;
  }
};
</script>
