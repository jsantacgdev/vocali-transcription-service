import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatusBadge from "~/components/StatusBadge.vue";

describe("StatusBadge", () => {
  it("Shows a readable label for each status", () => {
    const cases = [
      ["PENDING", "Pendiente"],
      ["PROCESSING", "Procesando"],
      ["COMPLETED", "Completada"],
      ["FAILED", "Error"],
    ] as const;

    for (const [status, label] of cases) {
      const wrapper = mount(StatusBadge, { props: { status } });
      expect(wrapper.text()).toBe(label);
    }
  });

  it("Animates while the transcription is not finished yet", () => {
    for (const status of ["PENDING", "PROCESSING"] as const) {
      const wrapper = mount(StatusBadge, { props: { status } });
      expect(wrapper.html()).toContain("animate-ping");
    }

    for (const status of ["COMPLETED", "FAILED"] as const) {
      const wrapper = mount(StatusBadge, { props: { status } });
      expect(wrapper.html()).not.toContain("animate-ping");
    }
  });

  it("Uses the error palette when the transcription failed", () => {
    const wrapper = mount(StatusBadge, { props: { status: "FAILED" } });
    expect(wrapper.html()).toContain("text-red-700");
  });
});
