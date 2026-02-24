import { pointFrom } from "@excalidraw/math";

import type { LocalPoint } from "@excalidraw/math";

import { getFreedrawOutlinePoints } from "../src/shape";

import type { ExcalidrawFreeDrawElement } from "../src/types";

const createFreedraw = (
  overrides: Partial<
    Pick<
      ExcalidrawFreeDrawElement,
      "points" | "pressures" | "simulatePressure" | "strokeWidth"
    >
  > = {},
) => {
  return {
    points: [
      pointFrom<LocalPoint>(0, 0),
      pointFrom<LocalPoint>(40, 25),
      pointFrom<LocalPoint>(90, 20),
      pointFrom<LocalPoint>(130, 50),
    ],
    pressures: [],
    simulatePressure: false,
    strokeWidth: 2,
    ...overrides,
  } as ExcalidrawFreeDrawElement;
};

const getBounds = (points: readonly [number, number][]) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    width: maxX - minX,
    height: maxY - minY,
  };
};

describe("freedraw pressure handling", () => {
  it("should ignore pressure values when generating outline", () => {
    const lowPressure = createFreedraw({
      simulatePressure: false,
      pressures: [0.1, 0.1, 0.1, 0.1],
    });
    const highPressure = createFreedraw({
      simulatePressure: false,
      pressures: [1, 1, 1, 1],
    });

    expect(getFreedrawOutlinePoints(lowPressure)).toEqual(
      getFreedrawOutlinePoints(highPressure),
    );
  });

  it("should ignore simulatePressure mode when generating outline", () => {
    const simulated = createFreedraw({
      simulatePressure: true,
      pressures: [],
    });
    const explicit = createFreedraw({
      simulatePressure: false,
      pressures: [0.2, 0.7, 0.3, 1],
    });

    expect(getFreedrawOutlinePoints(simulated)).toEqual(
      getFreedrawOutlinePoints(explicit),
    );
  });

  it("should still scale outline with strokeWidth", () => {
    const thin = createFreedraw({ strokeWidth: 1 });
    const thick = createFreedraw({ strokeWidth: 4 });

    const thinBounds = getBounds(getFreedrawOutlinePoints(thin));
    const thickBounds = getBounds(getFreedrawOutlinePoints(thick));

    expect(thickBounds.width).toBeGreaterThan(thinBounds.width);
    expect(thickBounds.height).toBeGreaterThan(thinBounds.height);
  });
});
