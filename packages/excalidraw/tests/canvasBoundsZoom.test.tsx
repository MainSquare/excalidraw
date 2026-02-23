import { viewportCoordsToSceneCoords } from "@excalidraw/common";
import React from "react";

import { actionZoomIn } from "../actions/actionCanvas";
import { getDefaultAppState } from "../appState";
import { Excalidraw } from "../index";
import { getNormalizedZoom } from "../scene";
import { getStateForZoom, getViewportCenterForZoom } from "../scene/zoom";

import { act, render, waitFor } from "./test-utils";

import type { AppState, NormalizedZoomValue } from "../types";

const createCanvasBoundsAppState = (): AppState => ({
  ...getDefaultAppState(),
  width: 2000,
  height: 1000,
  offsetLeft: 0,
  offsetTop: 0,
  scrollX: 0,
  scrollY: 0,
  renderScale: 0.5,
  zoom: { value: 1 as NormalizedZoomValue },
});

describe("canvas bounds zoom", () => {
  it("keeps cursor anchor stable when renderScale is active", () => {
    const appState = createCanvasBoundsAppState();
    const viewportPoint = { clientX: 250, clientY: 125 };

    const scenePointBefore = viewportCoordsToSceneCoords(
      viewportPoint,
      appState,
    );

    const zoomState = getStateForZoom(
      {
        viewportX: viewportPoint.clientX,
        viewportY: viewportPoint.clientY,
        nextZoom: getNormalizedZoom(2),
      },
      appState,
    );

    const nextAppState = {
      ...appState,
      ...zoomState,
    };

    const scenePointAfter = viewportCoordsToSceneCoords(
      viewportPoint,
      nextAppState,
    );

    expect(scenePointAfter.x).toBeCloseTo(scenePointBefore.x);
    expect(scenePointAfter.y).toBeCloseTo(scenePointBefore.y);
  });

  it("zooms in around the visual center for zoom actions", () => {
    const appState = createCanvasBoundsAppState();
    const visualCenter = getViewportCenterForZoom(appState);
    const centerPoint = {
      clientX: visualCenter.viewportX,
      clientY: visualCenter.viewportY,
    };

    const scenePointBefore = viewportCoordsToSceneCoords(centerPoint, appState);

    const actionResult = actionZoomIn.perform([], appState, null, {} as any);
    const nextAppState = {
      ...appState,
      ...(actionResult.appState as AppState),
    };

    const scenePointAfter = viewportCoordsToSceneCoords(
      centerPoint,
      nextAppState,
    );

    expect(scenePointAfter.x).toBeCloseTo(scenePointBefore.x);
    expect(scenePointAfter.y).toBeCloseTo(scenePointBefore.y);
    expect(nextAppState.zoom.value).toBeGreaterThan(appState.zoom.value);
  });

  it("scales the whiteboard layer with zoom when canvasBounds is enabled", async () => {
    const { container } = await render(
      <Excalidraw canvasBounds={{ x: 0, y: 0, width: 2000, height: 1000 }} />,
    );

    const whiteboardLayer = container.querySelector(
      ".excalidraw__whiteboard-layer",
    ) as HTMLDivElement;
    expect(whiteboardLayer).toBeTruthy();

    act(() => {
      window.h.setState({
        renderScale: 0.5,
        zoom: { value: 1 as NormalizedZoomValue },
      });
    });

    await waitFor(() => {
      expect(whiteboardLayer.style.transform).toBe("scale(0.5)");
    });

    act(() => {
      window.h.setState({
        zoom: { value: 2 as NormalizedZoomValue },
      });
    });

    await waitFor(() => {
      expect(whiteboardLayer.style.transform).toBe("scale(1)");
    });
  });
});
