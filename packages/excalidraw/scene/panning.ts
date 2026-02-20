import type { PanningMode } from "../types";

const CANVAS_BOUNDS_PAN_MARGIN_RATIO = 0.5;

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
  const panMarginX = Math.max(0, bounds.width * CANVAS_BOUNDS_PAN_MARGIN_RATIO);
  const panMarginY = Math.max(
    0,
    bounds.height * CANVAS_BOUNDS_PAN_MARGIN_RATIO,
  );
  const expandedBounds = {
    x: bounds.x - panMarginX,
    y: bounds.y - panMarginY,
    width: bounds.width + panMarginX * 2,
    height: bounds.height + panMarginY * 2,
  };

  const viewportW = viewportWidth / zoom;
  const viewportH = viewportHeight / zoom;

  let clampedScrollX: number;
  let clampedScrollY: number;

  if (viewportW >= expandedBounds.width) {
    // Viewport wider than bounds — center horizontally
    const centeredX =
      expandedBounds.x + expandedBounds.width / 2 - viewportW / 2;
    clampedScrollX = -centeredX;
  } else {
    const minScrollX = -(expandedBounds.x + expandedBounds.width - viewportW);
    const maxScrollX = -expandedBounds.x;
    clampedScrollX = Math.max(minScrollX, Math.min(maxScrollX, scrollX));
  }

  if (viewportH >= expandedBounds.height) {
    // Viewport taller than bounds — center vertically
    const centeredY =
      expandedBounds.y + expandedBounds.height / 2 - viewportH / 2;
    clampedScrollY = -centeredY;
  } else {
    const minScrollY = -(expandedBounds.y + expandedBounds.height - viewportH);
    const maxScrollY = -expandedBounds.y;
    clampedScrollY = Math.max(minScrollY, Math.min(maxScrollY, scrollY));
  }

  return { scrollX: clampedScrollX, scrollY: clampedScrollY };
};
