import {
  newElementWith,
  newFreeDrawElement,
} from "@mainsquare/excalidraw-element";
import { pointFrom, pointRotateRads } from "@mainsquare/excalidraw-math";
import { nanoid } from "nanoid";

import type { ExcalidrawFreeDrawElement } from "@mainsquare/excalidraw-element/types";
import type {
  GlobalPoint,
  LocalPoint,
  Radians,
} from "@mainsquare/excalidraw-math/types";

type Point = [number, number];

const distance2d = (p1: Point, p2: Point) => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const isPointInCircle = (p: Point, center: Point, radius: number) => {
  return distance2d(p, center) <= radius;
};

// Intersect a line segment (p1-p2) with a circle (center, radius).
// Returns 0, 1, or 2 points of intersection.
const intersectSegmentCircle = (
  p1: Point,
  p2: Point,
  center: Point,
  radius: number,
): Point[] => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const fx = p1[0] - center[0];
  const fy = p1[1] - center[1];

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return [];
  }

  discriminant = Math.sqrt(discriminant);

  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  const points: Point[] = [];

  if (t1 >= 0 && t1 <= 1) {
    points.push([p1[0] + t1 * dx, p1[1] + t1 * dy]);
  }
  if (t2 >= 0 && t2 <= 1) {
    points.push([p1[0] + t2 * dx, p1[1] + t2 * dy]);
  }

  return points;
};

/**
 * Erases a circular "pixel eraser" area (radius) from a FreeDraw element.
 * It subtracts points/segments under the eraser circle and returns remaining fragments.
 *
 * @returns Array of new FreeDraw elements (fragments). Could be 0 (fully erased),
 *          1 (trimmed), or 2+ (split).
 */
export const erasePixelFromFreeDraw = (
  element: ExcalidrawFreeDrawElement,
  eraserPath: GlobalPoint[],
  zoom: number,
): ExcalidrawFreeDrawElement[] => {
  if (eraserPath.length < 2) {
    return [element];
  }

  // NOTE: This mirrors the upstream PR behavior: fixed-radius circle scaled by zoom.
  const ERASER_RADIUS = 10 / zoom;

  const p2 = eraserPath[eraserPath.length - 1];
  const eraserCenter: Point = [p2[0], p2[1]];
  const radius = ERASER_RADIUS;

  // FreeDraw points are offsets from [element.x, element.y].
  // When element.angle != 0, we must rotate each point around the element
  // center to get the true global position.
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const angle = element.angle as Radians;

  const globalPoints: Point[] = element.points.map((p) => {
    const gx = element.x + p[0];
    const gy = element.y + p[1];
    if (angle === 0) {
      return [gx, gy] as Point;
    }
    const rotated = pointRotateRads(
      pointFrom<GlobalPoint>(gx, gy),
      pointFrom<GlobalPoint>(cx, cy),
      angle,
    );
    return [rotated[0], rotated[1]] as Point;
  });

  const fragments: Point[][] = [];
  let currentFragment: Point[] = [];

  for (let i = 0; i < globalPoints.length - 1; i++) {
    const A = globalPoints[i];
    const B = globalPoints[i + 1];

    const A_in = isPointInCircle(A, eraserCenter, radius);
    const B_in = isPointInCircle(B, eraserCenter, radius);

    if (A_in && B_in) {
      if (currentFragment.length > 0) {
        fragments.push(currentFragment);
        currentFragment = [];
      }
      continue;
    }

    if (!A_in && !B_in) {
      const intersections = intersectSegmentCircle(A, B, eraserCenter, radius);

      if (intersections.length === 2) {
        if (currentFragment.length === 0) {
          currentFragment.push(A);
        }
        currentFragment.push(intersections[0]);
        fragments.push(currentFragment);
        currentFragment = [intersections[1], B];
      } else {
        if (currentFragment.length === 0) {
          currentFragment.push(A);
        }
        currentFragment.push(B);
      }
      continue;
    }

    const intersections = intersectSegmentCircle(A, B, eraserCenter, radius);
    const intersection = intersections[0];

    if (A_in && !B_in) {
      if (currentFragment.length > 0) {
        fragments.push(currentFragment);
        currentFragment = [];
      }
      if (intersection) {
        currentFragment.push(intersection);
      }
      currentFragment.push(B);
    } else if (!A_in && B_in) {
      if (currentFragment.length === 0) {
        currentFragment.push(A);
      }
      if (intersection) {
        currentFragment.push(intersection);
      }
      fragments.push(currentFragment);
      currentFragment = [];
    }
  }

  if (currentFragment.length > 0) {
    fragments.push(currentFragment);
  }

  if (fragments.length === 0) {
    return [];
  }

  const buildFragment = (
    fragmentPoints: Point[],
    {
      id,
    }: {
      id: string;
    },
  ): ExcalidrawFreeDrawElement => {
    // Fragment points are in global (rotated) space. Un-rotate them around
    // the original element center to recover the unrotated coordinate frame,
    // since each fragment element will carry element.angle and re-apply
    // the rotation during rendering.
    const unrotatedPoints: Point[] =
      angle === 0
        ? fragmentPoints
        : fragmentPoints.map(([x, y]) => {
            const ur = pointRotateRads(
              pointFrom<GlobalPoint>(x, y),
              pointFrom<GlobalPoint>(cx, cy),
              -angle as Radians,
            );
            return [ur[0], ur[1]] as Point;
          });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    unrotatedPoints.forEach(([x, y]) => {
      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
    });

    const localPoints: LocalPoint[] = unrotatedPoints.map(([x, y]) =>
      pointFrom<LocalPoint>(x - minX, y - minY),
    );

    const width = Math.max(0, maxX - minX);
    const height = Math.max(0, maxY - minY);

    const pressures = new Array(localPoints.length).fill(
      element.pressures[0] ?? 0.5,
    );

    if (id === element.id) {
      return newElementWith(element, {
        x: minX,
        y: minY,
        points: localPoints,
        pressures,
        width,
        height,
      });
    }

    const duplicate = newFreeDrawElement({
      type: "freedraw",
      x: minX,
      y: minY,
      width,
      height,
      angle: element.angle,
      strokeColor: element.strokeColor,
      backgroundColor: element.backgroundColor,
      fillStyle: element.fillStyle,
      strokeWidth: element.strokeWidth,
      strokeStyle: element.strokeStyle,
      roundness: element.roundness,
      roughness: element.roughness,
      opacity: element.opacity,
      groupIds: element.groupIds,
      frameId: element.frameId,
      boundElements: element.boundElements,
      link: element.link,
      locked: element.locked,
      seed: element.seed,
      customData: element.customData,
      points: localPoints,
      pressures,
      simulatePressure: element.simulatePressure,
    });

    // `newFreeDrawElement()` always generates a new id, but we want deterministic
    // ids across a single erase operation (to avoid excessive churn between frames).
    // We intentionally override id on the freshly created object.
    return {
      ...duplicate,
      id,
    };
  };

  const newElements: ExcalidrawFreeDrawElement[] = [];

  fragments.forEach((fragmentPoints, index) => {
    const id = index === 0 ? element.id : nanoid();
    newElements.push(buildFragment(fragmentPoints, { id }));
  });

  return newElements;
};
