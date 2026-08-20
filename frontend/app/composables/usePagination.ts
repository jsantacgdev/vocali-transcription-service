import { ref, computed } from "vue";

export const usePagination = () => {
  const cursors = ref<string[]>([]);
  const nextCursor = ref<string | null>(null);

  const currentCursor = computed(() => cursors.value[cursors.value.length - 1]);
  const pageNumber = computed(() => cursors.value.length + 1);
  const canGoBack = computed(() => cursors.value.length > 0);
  const canGoForward = computed(() => nextCursor.value !== null);

  const setNextCursor = (cursor: string | null) => {
    nextCursor.value = cursor;
  };

  const goForward = () => {
    if (!nextCursor.value) return;
    cursors.value.push(nextCursor.value);
  };

  const goBack = () => {
    cursors.value.pop();
  };

  const reset = () => {
    cursors.value = [];
    nextCursor.value = null;
  };

  return {
    currentCursor,
    pageNumber,
    canGoBack,
    canGoForward,
    setNextCursor,
    goForward,
    goBack,
    reset,
  };
};
