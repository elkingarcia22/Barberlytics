import * as React from "react";

/**
 * Radix's own `--radix-popover-content-transform-origin` only approximates a
 * corner from side+align — close enough for a plain fade, but the reveal
 * needs to visibly open from the trigger itself. This measures the button's
 * actual center relative to the content box and exposes it as the
 * `--reveal-x`/`--reveal-y` custom properties the `liquid` clip-path
 * keyframes read, so the mask opens from exactly where the button sits
 * instead of an approximated corner.
 *
 * Measuring can't hang off the `open` boolean alone: Radix mounts
 * `PopoverContent` one render after `open` flips true, so a layout effect
 * keyed on `open` fires while the content ref is still null. A callback ref
 * fires the instant the node is actually attached instead — but even then,
 * Radix's own floating-ui positioning hasn't run yet, so a same-tick read
 * still gets the content at its pre-position (0,0) rect. Deferring the read
 * with `setTimeout(…, 0)` pushes it past that positioning pass; the mask
 * starts fully transparent (see `shell-reveal-in`'s `0%` keyframe) so the
 * one-tick gap between mount and measurement is never visible.
 */
export function useLiquidOrigin() {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  const measure = React.useCallback((content: HTMLDivElement) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const x = triggerRect.left + triggerRect.width / 2 - contentRect.left;
    const y = triggerRect.top + triggerRect.height / 2 - contentRect.top;
    setStyle({
      "--reveal-x": `${x}px`,
      "--reveal-y": `${y}px`,
      // The pop's scale() overshoot needs to grow from the same point the
      // clip-path mask opens from — otherwise the scale reads as centered on
      // the panel while the mask reads as centered on the button.
      transformOrigin: "var(--reveal-x, 100%) var(--reveal-y, 0%)",
    } as React.CSSProperties);
  }, []);

  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // A microtask fires too early (before Radix's own floating-ui
      // positioning effect has placed the content), and requestAnimationFrame
      // is unreliable in backgrounded/automated tabs — a macrotask reliably
      // lands after both.
      if (node) setTimeout(() => measure(node), 0);
    },
    [measure]
  );

  return { triggerRef, contentRef, style };
}
