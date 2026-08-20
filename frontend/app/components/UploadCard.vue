<template>
  <div
    class="rounded-xl border-2 border-dashed bg-white px-6 py-8 transition"
    :class="dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300'"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <div v-if="!uploading" class="text-center">
      <p class="text-sm font-medium text-slate-900">
        Arrastra un audio aquí o
        <button
          class="text-brand-700 underline hover:no-underline"
          @click="input?.click()"
        >
          selecciona un archivo
        </button>
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Formatos de audio · Máximo 20 MB
      </p>
      <input
        ref="input"
        type="file"
        accept="audio/*"
        class="hidden"
        @change="onSelect"
      />
    </div>

    <div v-else class="text-center">
      <p class="text-sm font-medium text-slate-900">Subiendo {{ fileName }}…</p>
      <div
        class="mx-auto mt-3 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200"
      >
        <div class="h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
      </div>
    </div>

    <p v-if="error" class="mt-3 text-center text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ uploaded: [] }>();

const { createTranscription, uploadAudio } = useApi();

const MAX_BYTES = 20 * 1024 * 1024;

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const uploading = ref(false);
const fileName = ref("");
const error = ref("");

const onSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) upload(file);
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) upload(file);
};

const upload = async (file: File) => {
  error.value = "";

  if (!file.type.startsWith("audio/")) {
    error.value = "El archivo debe ser un audio.";
    return;
  }

  if (file.size > MAX_BYTES) {
    error.value = "El archivo supera los 20 MB permitidos.";
    return;
  }

  uploading.value = true;
  fileName.value = file.name;

  try {
    const { uploadUrl } = await createTranscription(file.name, file.size);
    await uploadAudio(uploadUrl, file);
    emit("uploaded");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "No se pudo subir el audio";
  } finally {
    uploading.value = false;
    if (input.value) input.value.value = "";
  }
};
</script>
