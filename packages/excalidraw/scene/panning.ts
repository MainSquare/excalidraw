import type { PanningMode } from "../types";

/**
 * Restricts pan delta values based on the current panning mode.
 * @param panningMode - The current panning mode (free, vertical, horizontal or both)
 * @param deltaX - The horizontal pan delta
 * @param deltaY - The vertical pan delta
 * @returns An object with restricted deltaX and deltaY values
 */
export const restrictPanDelta = (
  panningMode: PanningMode,
  deltaX: number,
  deltaY: number,
): { deltaX: number; deltaY: number } => {
  switch (panningMode) {
    case "fixed":
      // No panning allowed (both axes fixed)
      return { deltaX: 0, deltaY: 0 };
    case "horizontalFixed":
      // Horizontal is fixed (no horizontal movement) -> allow vertical only
      return { deltaX: 0, deltaY };
    case "verticalFixed":
      // Vertical is fixed (no vertical movement) -> allow horizontal only
      return { deltaX, deltaY: 0 };
    case "free":
    default:
      // Allow panning in all directions
      return { deltaX, deltaY };
  }
};

/**
 * Clamps scrollX and scrollY so the viewport stays within the given canvas bounds.
 * When the viewport is larger than the bounds on an axis, centers the content on that axis.
 */
export const clampScrollToBounds = (
  scrollX: number,
  scrollY: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  bounds: { x: number; y: number; width: number; height: number },
): { scrollX: number; scrollY: number } => {
  const viewportW = viewportWidth / zoom;
  const viewportH = viewportHeight / zoom;

  let clampedScrollX: number;
  let clampedScrollY: number;

  if (viewportW >= bounds.width) {
    // Viewport wider than bounds — center horizontally
    clampedScrollX = -(bounds.x + bounds.width / 2 - viewportW / 2);
  } else {
    const minScrollX = -(bounds.x + bounds.width - viewportW);
    const maxScrollX = -bounds.x;
    clampedScrollX = Math.max(minScrollX, Math.min(maxScrollX, scrollX));
  }

  if (viewportH >= bounds.height) {
    // Viewport taller than bounds — center vertically
    clampedScrollY = -(bounds.y + bounds.height / 2 - viewportH / 2);
  } else {
    const minScrollY = -(bounds.y + bounds.height - viewportH);
    const maxScrollY = -bounds.y;
    clampedScrollY = Math.max(minScrollY, Math.min(maxScrollY, scrollY));
  }

  return { scrollX: clampedScrollX, scrollY: clampedScrollY };
};
