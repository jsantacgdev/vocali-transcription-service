<template>
  <div class="mx-auto max-w-4xl px-6 py-8">
    <div class="mb-8">
      <NuxtLink
        to="/"
        class="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Volver
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-semibold text-slate-900">
        Dictado en directo
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Habla por el micrófono y verás la transcripción al momento.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6">
      <div class="mb-6 flex items-center gap-4">
        <button
          v-if="!recording"
          :disabled="connecting"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="start"
        >
          <span class="size-2 rounded-full bg-white" />
          {{ connecting ? "Conectando…" : "Empezar a dictar" }}
        </button>

        <button
          v-else
          class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          @click="stop"
        >
          <span class="size-2 rounded-sm bg-white" />
          Detener
        </button>

        <span
          v-if="recording"
          class="inline-flex items-center gap-2 text-sm text-slate-500"
        >
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75 [animation-duration:1s]"
            />
            <span class="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          Grabando
        </span>
      </div>

      <div
        class="min-h-48 rounded-lg bg-slate-50 p-4 text-slate-900 leading-relaxed"
      >
        <p v-if="!fullText && !recording" class="text-sm text-slate-400">
          El texto aparecerá aquí mientras hablas.
        </p>
        <p v-else>
          <span>{{ finalText }}</span>
          <span v-if="partialText" class="text-slate-400">
            {{ finalText ? " " : "" }}{{ partialText }}
          </span>
        </p>
      </div>

      <p
        v-if="error"
        class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <div v-if="finalText && !recording" class="mt-4 flex justify-end">
        <button
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          @click="copyText"
        >
          {{ copied ? "Copiado" : "Copiar texto" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  finalText,
  partialText,
  fullText,
  recording,
  connecting,
  error,
  start,
  stop,
} = useRealtime();

const copied = ref(false);

const copyText = async () => {
  await navigator.clipboard.writeText(finalText.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};
</script>
