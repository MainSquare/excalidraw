import { viewportCoordsToSceneCoords } from "@excalidraw/common";
import React from "react";

import { actionZoomIn } from "../actions/actionCanvas";
import { getDefaultAppState } from "../appState";
import { Excalidraw } from "../index";
import { getNormalizedZoom } from "../scene";
import { getStateForZoom, getViewportCenterForZoom } from "../scene/zoom";

import {
  act,
  fireEvent,
  mockBoundingClientRect,
  render,
  restoreOriginalGetBoundingClientRect,
  waitFor,
} from "./test-utils";

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

  it("keeps scroll fixed when zooming with canvasBounds enabled", () => {
    const appState = {
      ...createCanvasBoundsAppState(),
      scrollX: 123,
      scrollY: -77,
    };

    const actionResult = actionZoomIn.perform(
      [],
      appState,
      null,
      { props: { canvasBounds: { x: 0, y: 0, width: 2000, height: 1000 } } } as any,
    );

    const nextAppState = actionResult.appState as AppState;
    expect(nextAppState.zoom.value).toBeGreaterThan(appState.zoom.value);
    expect(nextAppState.scrollX).toBe(appState.scrollX);
    expect(nextAppState.scrollY).toBe(appState.scrollY);
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

  it("keeps the viewport centered horizontally and vertically while zooming", async () => {
    mockBoundingClientRect({
      left: 100,
      top: 40,
      width: 1000,
      height: 500,
      right: 1100,
      bottom: 540,
      x: 100,
      y: 40,
      toJSON: () => {},
    });

    try {
      await render(
        <Excalidraw canvasBounds={{ x: 0, y: 0, width: 2000, height: 1000 }} />,
      );

      act(() => {
        (window.h.app as any).updateDOMRect?.();
      });

      await waitFor(() => {
        expect(window.h.state.renderScale).toBeCloseTo(0.5);
      });

      const centerXBefore =
        window.h.state.offsetLeft +
        (window.h.state.width *
          window.h.state.renderScale *
          window.h.state.zoom.value) /
          2;
      const centerYBefore =
        window.h.state.offsetTop +
        (window.h.state.height *
          window.h.state.renderScale *
          window.h.state.zoom.value) /
          2;

      expect(centerXBefore).toBeCloseTo(600);
      expect(centerYBefore).toBeCloseTo(290);

      act(() => {
        window.h.app.zoomCanvas(2);
      });

      await waitFor(() => {
        const centerXAfter =
          window.h.state.offsetLeft +
          (window.h.state.width *
            window.h.state.renderScale *
            window.h.state.zoom.value) /
            2;
        const centerYAfter =
          window.h.state.offsetTop +
          (window.h.state.height *
            window.h.state.renderScale *
            window.h.state.zoom.value) /
            2;

        expect(window.h.state.zoom.value).toBeCloseTo(2);
        expect(centerXAfter).toBeCloseTo(600);
        expect(centerYAfter).toBeCloseTo(290);
      });
    } finally {
      restoreOriginalGetBoundingClientRect();
    }
  });

  it("pans by moving viewport offsets instead of scene scroll", async () => {
    const { container } = await render(
      <Excalidraw canvasBounds={{ x: 0, y: 0, width: 2000, height: 1000 }} />,
    );

    const interactiveCanvas = container.querySelector(
      "canvas.interactive",
    ) as HTMLCanvasElement;
    expect(interactiveCanvas).toBeTruthy();

    const prevScrollX = window.h.state.scrollX;
    const prevScrollY = window.h.state.scrollY;
    const prevOffsetLeft = window.h.state.offsetLeft;
    const prevOffsetTop = window.h.state.offsetTop;

    fireEvent.wheel(interactiveCanvas, {
      deltaX: 20,
      deltaY: 30,
    });

    await waitFor(() => {
      expect(window.h.state.scrollX).toBe(prevScrollX);
      expect(window.h.state.scrollY).toBe(prevScrollY);
      expect(window.h.state.offsetLeft).not.toBe(prevOffsetLeft);
      expect(window.h.state.offsetTop).not.toBe(prevOffsetTop);
    });
  });
});
