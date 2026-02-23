import type { AppState, NormalizedZoomValue } from "../types";

export const getViewportCenterForZoom = (
  appState: Pick<
    AppState,
    "offsetLeft" | "offsetTop" | "width" | "height" | "renderScale"
  >,
) => {
  const renderScale =
    appState.renderScale && appState.renderScale > 0 ? appState.renderScale : 1;

  return {
    viewportX: appState.offsetLeft + (appState.width * renderScale) / 2,
    viewportY: appState.offsetTop + (appState.height * renderScale) / 2,
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
) => {
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
