import { RealtimeClient } from "@speechmatics/real-time-client";
import { PCMRecorder } from "@speechmatics/browser-audio-input";

const SAMPLE_RATE = 16000;

export const useRealtime = () => {
  const { getRealtimeToken } = useApi();

  const finalText = ref("");
  const partialText = ref("");
  const recording = ref(false);
  const connecting = ref(false);
  const error = ref("");

  let client: RealtimeClient | null = null;
  let recorder: PCMRecorder | null = null;

  const fullText = computed(() =>
    [finalText.value, partialText.value].filter(Boolean).join(" "),
  );

  const start = async () => {
    error.value = "";
    connecting.value = true;
    finalText.value = "";
    partialText.value = "";

    try {
      const { token } = await getRealtimeToken();

      client = new RealtimeClient();

      client.addEventListener("receiveMessage", ({ data }) => {
        if (data.message === "AddTranscript") {
          const transcript = data.metadata?.transcript ?? "";
          if (transcript.trim()) {
            finalText.value = `${finalText.value} ${transcript}`.trim();
          }
          partialText.value = "";
        } else if (data.message === "AddPartialTranscript") {
          partialText.value = data.metadata?.transcript ?? "";
        } else if (data.message === "Error") {
          error.value = data.reason ?? "Error de transcripción";
        }
      });

      await client.start(token, {
        transcription_config: {
          language: "es",
          enable_partials: true,
          max_delay: 1,
        },
        audio_format: {
          type: "raw",
          encoding: "pcm_f32le",
          sample_rate: SAMPLE_RATE,
        },
      });

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

      recorder = new PCMRecorder("/pcm-worklet.js");
      recorder.addEventListener("audio", (event) => {
        client?.sendAudio(event.data.buffer as ArrayBuffer);
      });

      await recorder.startRecording({ audioContext });

      recording.value = true;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "No se pudo iniciar el dictado";
      await cleanup();
    } finally {
      connecting.value = false;
    }
  };

  const cleanup = async () => {
    try {
      recorder?.stopRecording();
    } catch {
      // El grabador puede no haber llegado a arrancar
    }
    recorder = null;
    client = null;
    recording.value = false;
  };

  const stop = async () => {
    partialText.value = "";
    try {
      recorder?.stopRecording();
      await client?.stopRecognition();
    } catch {
      // Cerramos igualmente
    }
    await cleanup();
  };

  onUnmounted(() => {
    if (recording.value) stop();
  });

  return {
    finalText: readonly(finalText),
    partialText: readonly(partialText),
    fullText,
    recording: readonly(recording),
    connecting: readonly(connecting),
    error: readonly(error),
    start,
    stop,
  };
};
