import { describe, expect, it } from "vitest";

import { newFreeDrawElement } from "@excalidraw/element";
import { pointFrom } from "@excalidraw/math";

import type { GlobalPoint } from "@excalidraw/math/types";

import { erasePixelFromFreeDraw } from "./pixelEraser";

describe("pixelEraser", () => {
  const dummyElement = newFreeDrawElement({
    type: "freedraw",
    points: [
      pointFrom(0, 0),
      pointFrom(10, 0),
      pointFrom(20, 0),
      pointFrom(30, 0),
      pointFrom(40, 0),
    ],
    x: 0,
    y: 0,
    simulatePressure: false,
  });

  it("should not erase anything if the eraser path is too short", () => {
    const eraserPath: GlobalPoint[] = [pointFrom(0, 0)];
    const result = erasePixelFromFreeDraw(dummyElement, eraserPath, 1);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(dummyElement);
  });

  it("should erase the middle of a line, resulting in two fragments", () => {
    const result = erasePixelFromFreeDraw(
      dummyElement,
      [pointFrom(20, -1), pointFrom(20, 0)],
      1,
    );

    expect(result.length).toBe(2);
    expect(result[0].points.length).toBeGreaterThan(1);
    expect(result[1].points.length).toBeGreaterThan(1);
    expect(result[0].width).toBeCloseTo(10, 0);
    expect(result[1].width).toBeCloseTo(10, 0);
  });

  it("should fully erase if the eraser covers the whole line", () => {
    const result = erasePixelFromFreeDraw(
      dummyElement,
      [pointFrom(20, -1), pointFrom(20, 0)],
      0.2,
    );
    expect(result.length).toBe(0);
  });
});
