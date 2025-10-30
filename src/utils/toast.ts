interface ToastPayload {
  type: "success" | "error" | "info";
  message: string;
}

function emitToastEvent(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new CustomEvent("algoirl:toast", { detail: payload }));
  } catch {
    // Swallow errors from CustomEvent in unsupported environments.
  }
}

function logDevToast(prefix: string, message: string) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[toast:${prefix}] ${message}`);
  }
}

export const toast = {
  success(message: string) {
    emitToastEvent({ type: "success", message });
    logDevToast("success", message);
  },
  error(message: string) {
    emitToastEvent({ type: "error", message });
    logDevToast("error", message);
  },
  info(message: string) {
    emitToastEvent({ type: "info", message });
    logDevToast("info", message);
  },
};

export type Toast = typeof toast;
