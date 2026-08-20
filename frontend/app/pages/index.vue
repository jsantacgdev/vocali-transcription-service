<template>
  <div class="mx-auto max-w-4xl px-6 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Transcripciones</h1>
        <p class="mt-1 text-sm text-slate-500">
          Sube un audio o dicta por micrófono para transcribir.
        </p>
      </div>
      <NuxtLink
        to="/realtime"
        class="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Dictar en directo
      </NuxtLink>
    </div>

    <UploadCard class="mb-8" @uploaded="reload" />

    <div class="rounded-xl border border-slate-200 bg-white">
      <div v-if="loading" class="px-6 py-12 text-center text-sm text-slate-500">
        Cargando…
      </div>

      <div
        v-else-if="items.length === 0"
        class="px-6 py-12 text-center text-sm text-slate-500"
      >
        Todavía no has hecho ninguna transcripción.
      </div>

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="item in items"
          :key="item.transcriptionId"
          class="flex items-center justify-between gap-4 px-6 py-4"
        >
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-900">
              {{ item.fileName }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ formatDate(item.createdAt) }}
              <span v-if="item.durationSeconds">
                · {{ formatDuration(item.durationSeconds) }}
              </span>
            </p>
            <p v-if="item.errorMessage" class="mt-1 text-xs text-red-600">
              {{ item.errorMessage }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3">
            <StatusBadge :status="item.status" />
            <button
              v-if="item.status === 'COMPLETED'"
              :disabled="downloading === item.transcriptionId"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
              @click="download(item.transcriptionId)"
            >
              Descargar
            </button>
          </div>
        </li>
      </ul>

      <div
        v-if="!loading && (canGoBack || canGoForward)"
        class="flex items-center justify-between border-t border-slate-100 px-6 py-3"
      >
        <button
          :disabled="!canGoBack"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          @click="prevPage"
        >
          Anterior
        </button>
        <span class="text-xs text-slate-500">Página {{ pageNumber }}</span>
        <button
          :disabled="!canGoForward"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          @click="nextPage"
        >
          Siguiente
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from "~/composables/usePagination";
import type { Transcription } from "~/types";

const { listTranscriptions, getDownloadUrl } = useApi();

const POLL_MS = 5000;
const STALE_MS = 10 * 60 * 1000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

const items = ref<Transcription[]>([]);

const {
  currentCursor,
  pageNumber,
  canGoBack,
  canGoForward,
  setNextCursor,
  goForward,
  goBack,
  reset: resetPagination,
} = usePagination();

const loading = ref(true);
const downloading = ref<string | null>(null);
const error = ref("");

const load = async (cursor?: string) => {
  loading.value = true;
  error.value = "";
  try {
    const page = await listTranscriptions(cursor);
    items.value = page.items ?? [];
    setNextCursor(page.nextCursor ?? null);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo cargar";
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  resetPagination();
  load();
};

const nextPage = () => {
  goForward();
  load(currentCursor.value);
};

const prevPage = () => {
  goBack();
  load(currentCursor.value);
};

const download = async (transcriptionId: string) => {
  downloading.value = transcriptionId;
  error.value = "";
  try {
    const { downloadUrl } = await getDownloadUrl(transcriptionId);
    window.location.href = downloadUrl;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo descargar";
  } finally {
    downloading.value = null;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
};

const hasPending = computed(() =>
  items.value.some(
    (i) =>
      (i.status === "PENDING" || i.status === "PROCESSING") &&
      Date.now() - new Date(i.createdAt).getTime() < STALE_MS,
  ),
);

const refreshSilently = async () => {
  try {
    const page = await listTranscriptions(currentCursor.value);
    items.value = page.items;
    setNextCursor(page.nextCursor);
  } catch {}
};

watch(
  hasPending,
  (pending) => {
    if (pending && !pollTimer) {
      pollTimer = setInterval(refreshSilently, POLL_MS);
    } else if (!pending && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
  { immediate: true },
);

onMounted(reload);

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
