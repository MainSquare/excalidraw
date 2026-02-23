import React, { useEffect, useRef, useState, useCallback } from "react";

type CanvasBounds = { x: number; y: number; width: number; height: number };

interface CanvasBoundsWrapperProps {
  canvasBounds: CanvasBounds;
  children: React.ReactNode;
}

/**
 * Wraps the Excalidraw App component with a CSS-scaled container.
 * The inner container is sized to `canvasBounds` dimensions and scaled
 * down (via CSS transform) to fit the actual available space, with
 * letterboxing for aspect ratio differences.
 */
const CanvasBoundsWrapper = ({
  canvasBounds,
  children,
}: CanvasBoundsWrapperProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [outerSize, setOuterSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleResize = useCallback(() => {
    if (outerRef.current) {
      const rect = outerRef.current.getBoundingClientRect();
      setOuterSize((prev) => {
        if (
          prev &&
          prev.width === rect.width &&
          prev.height === rect.height
        ) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    }
  }, []);

  useEffect(() => {
    if (!outerRef.current) {
      return;
    }

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(outerRef.current);

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  const { width: boundsW, height: boundsH } = canvasBounds;

  // Guard against invalid bounds
  if (boundsW <= 0 || boundsH <= 0) {
    return (
      <div ref={outerRef} style={{ width: "100%", height: "100%" }}>
        {children}
      </div>
    );
  }

  const renderScale = outerSize
    ? Math.min(outerSize.width / boundsW, outerSize.height / boundsH)
    : 0;

  const scaledWidth = boundsW * renderScale;
  const scaledHeight = boundsH * renderScale;
  const letterboxX = outerSize ? (outerSize.width - scaledWidth) / 2 : 0;
  const letterboxY = outerSize ? (outerSize.height - scaledHeight) / 2 : 0;

  return (
    <div
      ref={outerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#1e1e1e",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: letterboxX,
          top: letterboxY,
          width: boundsW,
          height: boundsH,
          transform: `scale(${renderScale})`,
          transformOrigin: "top left",
          // Hide until we have a valid measurement
          visibility: outerSize ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default CanvasBoundsWrapper;
