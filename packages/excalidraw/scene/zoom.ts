import type { AppState, NormalizedZoomValue } from "../types";

export const getViewportCenterForZoom = (
  appState: Pick<
    AppState,
    "offsetLeft" | "offsetTop" | "width" | "height" | "renderScale" | "zoom"
  >,
  {
    viewportScaledByZoom = false,
  }: {
    viewportScaledByZoom?: boolean;
  } = {},
) => {
  const renderScale =
    appState.renderScale && appState.renderScale > 0 ? appState.renderScale : 1;
  const viewportScale = viewportScaledByZoom
    ? renderScale * appState.zoom.value
    : renderScale;

  return {
    viewportX: appState.offsetLeft + (appState.width * viewportScale) / 2,
    viewportY: appState.offsetTop + (appState.height * viewportScale) / 2,
  };
};

export const getStateForZoom = (
  {
    viewportX,
    viewportY,
    nextZoom,
  }: {
    viewportX: number;
    viewportY: number;
    nextZoom: NormalizedZoomValue;
  },
  appState: AppState,
  {
    lockScroll = false,
  }: {
    lockScroll?: boolean;
  } = {},
) => {
  if (lockScroll) {
    return {
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: {
        value: nextZoom,
      },
    };
  }

  const renderScale =
    appState.renderScale && appState.renderScale > 0 ? appState.renderScale : 1;
  const appLayerX = (viewportX - appState.offsetLeft) / renderScale;
  const appLayerY = (viewportY - appState.offsetTop) / renderScale;

  const currentZoom = appState.zoom.value;

  // get original scroll position without zoom
  const baseScrollX = appState.scrollX + (appLayerX - appLayerX / currentZoom);
  const baseScrollY = appState.scrollY + (appLayerY - appLayerY / currentZoom);

  // get scroll offsets for target zoom level
  const zoomOffsetScrollX = -(appLayerX - appLayerX / nextZoom);
  const zoomOffsetScrollY = -(appLayerY - appLayerY / nextZoom);

  return {
    scrollX: baseScrollX + zoomOffsetScrollX,
    scrollY: baseScrollY + zoomOffsetScrollY,
    zoom: {
      value: nextZoom,
    },
  };
};
