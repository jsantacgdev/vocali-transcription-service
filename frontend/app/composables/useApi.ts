import type {
  TranscriptionsPage,
  CreateTranscriptionResponse,
  DownloadTranscriptionResponse,
  RealtimeTokenResponse,
  ApiError,
} from "~/types";

export const useApi = () => {
  const config = useRuntimeConfig();
  const { getIdToken } = useAuth();

  const request = async <T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> => {
    const token = await getIdToken();
    if (!token) {
      await navigateTo("/login");
      throw new Error("Sesión expirada");
    }

    const response = await fetch(`${config.public.apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => null)) as ApiError | null;
      throw new Error(error?.message ?? `Error ${response.status}`);
    }

    return (await response.json()) as T;
  };

  const createTranscription = (fileName: string, contentLength: number) =>
    request<CreateTranscriptionResponse>("/transcriptions", {
      method: "POST",
      body: { fileName, contentLength },
    });

  const listTranscriptions = (cursor?: string) =>
    request<TranscriptionsPage>(
      cursor
        ? `/transcriptions?cursor=${encodeURIComponent(cursor)}`
        : "/transcriptions",
    );

  const getDownloadUrl = (transcriptionId: string) =>
    request<DownloadTranscriptionResponse>(
      `/transcriptions/${transcriptionId}`,
    );

  const getRealtimeToken = () =>
    request<RealtimeTokenResponse>("/realtime/token", { method: "POST" });

  const uploadAudio = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });
    if (!response.ok) {
      throw new Error("No se pudo subir el audio");
    }
  };

  return {
    createTranscription,
    listTranscriptions,
    getDownloadUrl,
    getRealtimeToken,
    uploadAudio,
  };
};
