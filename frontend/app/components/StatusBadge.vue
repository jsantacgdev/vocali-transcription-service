<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="styles.wrapper"
  >
    <span class="relative flex size-1.5">
      <span
        v-if="status === 'PENDING' || status === 'PROCESSING'"
        class="absolute inline-flex size-full animate-ping rounded-full opacity-75 [animation-duration:0.7s]"
        :class="styles.dot"
      />
      <span
        class="relative inline-flex size-1.5 rounded-full"
        :class="styles.dot"
      />
    </span>
    {{ styles.label }}
  </span>
</template>

<script setup lang="ts">
import type { TranscriptionStatus } from "~/types";

const props = defineProps<{ status: TranscriptionStatus }>();

const map: Record<
  TranscriptionStatus,
  { label: string; wrapper: string; dot: string }
> = {
  PENDING: {
    label: "Pendiente",
    wrapper: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  PROCESSING: {
    label: "Procesando",
    wrapper: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  COMPLETED: {
    label: "Completada",
    wrapper: "bg-brand-100 text-brand-700",
    dot: "bg-brand-500",
  },
  FAILED: {
    label: "Error",
    wrapper: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

const styles = computed(() => map[props.status]);
</script>
