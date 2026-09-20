import * as React from "react";

/** Copia al portapapeles y expone un flag `copied` breve para la UI. */
export function useCopy(timeout = 1600) {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeout);
      } catch {
        setCopied(false);
      }
    },
    [timeout]
  );
  return { copied, copy };
}
