/**
 * Safe Clipboard Copy Utility
 * Gracefully handles iFrame restrictions, lack of document focus, and permissions
 * without generating unhandled promise rejections.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // Fall through to textarea fallback (e.g. document not focused in iframe)
    }
  }

  // 2. Fallback to temporary textarea with document.execCommand
  try {
    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  } catch (_fallbackErr) {
    // Suppress fallback error
  }

  return false;
}
