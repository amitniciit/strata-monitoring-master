import { useRef, useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const DPR = window.devicePixelRatio || 1;

const PADDING_RATIO = 0.08;

const INSTRUMENT_RADIUS = 14;

const COLOR = {
  bg: "#f0f4fa",

  grid: "rgba(100,120,160,0.08)",
  gridMajor: "rgba(100,120,160,0.18)",
  gridLabel: "rgba(80,100,140,0.5)",

  pillarFill: "rgba(20,40,90,0.82)",
  pillarFillExtract:
    "rgba(40,40,40,0.75)",

  pillarStroke: "#1a3c7b",
  pillarStrokeExtract: "#8090aa",

  instrFill: "#1976d2",
  instrStroke: "#ffffff",
  instrLabel: "#ffffff",

  tooltipBg: "#ffffff",
  tooltipBorder: "#d0daea",
  tooltipTitle: "#1976d2",
  tooltipMuted: "#666",

  crosshair: "rgba(25,118,210,0.55)",
};

// ─────────────────────────────────────────────
// TRANSFORM
// ─────────────────────────────────────────────

function computeTransform(
  pillars,
  instruments,
  vpWidth,
  vpHeight
) {
  let minX = Infinity;
  let minY = Infinity;

  let maxX = -Infinity;
  let maxY = -Infinity;

  // pillars
  pillars?.forEach((pillar) => {
    pillar.coordinates?.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);

      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    });
  });

  // instruments
  instruments?.forEach((inst) => {
    const x = Number(inst.xCoordinate);
    const y = Number(inst.yCoordinate);

    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);

      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  });

  if (
    !isFinite(minX) ||
    !isFinite(minY) ||
    !isFinite(maxX) ||
    !isFinite(maxY)
  ) {
    return null;
  }

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  // dynamic padding
  const paddingX =
    worldWidth * PADDING_RATIO;

  const paddingY =
    worldHeight * PADDING_RATIO;

  minX -= paddingX;
  maxX += paddingX;

  minY -= paddingY;
  maxY += paddingY;

  const paddedWidth = maxX - minX;
  const paddedHeight = maxY - minY;

  // preserve aspect ratio
  const scale = Math.min(
    vpWidth / paddedWidth,
    vpHeight / paddedHeight
  );

  // center
  const offsetX =
    (vpWidth - paddedWidth * scale) /
    2;

  const offsetY =
    (vpHeight -
      paddedHeight * scale) /
    2;

  return {
    minX,
    minY,
    maxX,
    maxY,

    scale,

    offsetX,
    offsetY,

    vpWidth,
    vpHeight,
  };
}

function worldToCanvas(x, y, t) {
  return {
    x:
      (x - t.minX) * t.scale +
      t.offsetX,

    y:
      t.vpHeight -
      ((y - t.minY) * t.scale +
        t.offsetY),
  };
}

function canvasToWorld(x, y, t) {
  return {
    x:
      (x - t.offsetX) / t.scale +
      t.minX,

    y:
      ((t.vpHeight - y - t.offsetY) /
        t.scale) +
      t.minY,
  };
}

// ─────────────────────────────────────────────
// GRID
// ─────────────────────────────────────────────


//--new changes 
function drawPolygon(
  ctx,
  points,
  fillColor,
  strokeColor,
  lineWidth = 1.5
) {

  if (!points?.length) return;

  ctx.beginPath();

  ctx.moveTo(
    points[0].x,
    points[0].y
  );

  points
    .slice(1)
    .forEach((p) => {
      ctx.lineTo(p.x, p.y);
    });

  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}


//------

function drawGrid(ctx, t) {
  const worldWidth =
    t.maxX - t.minX;

  const worldHeight =
    t.maxY - t.minY;

  const range = Math.max(
    worldWidth,
    worldHeight
  );

  const rawStep = range / 10;

  const mag = Math.pow(
    10,
    Math.floor(Math.log10(rawStep))
  );

  const step =
    Math.ceil(rawStep / mag) * mag;

  ctx.font = "10px monospace";

  // vertical
  for (
    let wx =
      Math.floor(t.minX / step) * step;
    wx <= t.maxX + step;
    wx += step
  ) {
    const p = worldToCanvas(
      wx,
      0,
      t
    );

    const major =
      Math.round(wx / step) % 5 === 0;

    ctx.strokeStyle = major
      ? COLOR.gridMajor
      : COLOR.grid;

    ctx.lineWidth = major ? 1 : 0.5;

    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, t.vpHeight);
    ctx.stroke();

    if (major) {
      ctx.fillStyle =
        COLOR.gridLabel;

      ctx.textAlign = "center";

      ctx.fillText(
        wx.toFixed(0),
        p.x,
        t.vpHeight - 6
      );
    }
  }

  // horizontal
  for (
    let wy =
      Math.floor(t.minY / step) * step;
    wy <= t.maxY + step;
    wy += step
  ) {
    const p = worldToCanvas(
      0,
      wy,
      t
    );

    const major =
      Math.round(wy / step) % 5 === 0;

    ctx.strokeStyle = major
      ? COLOR.gridMajor
      : COLOR.grid;

    ctx.lineWidth = major ? 1 : 0.5;

    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(t.vpWidth, p.y);
    ctx.stroke();

    if (major) {
      ctx.fillStyle =
        COLOR.gridLabel;

      ctx.textAlign = "left";

      ctx.fillText(
        wy.toFixed(0),
        4,
        p.y - 4
      );
    }
  }
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const PanelSnapshot = ({
  snapshot,
  instrunmentsData,
  instrumentValues
}) => {
  const canvasRef = useRef(null);

  const containerRef =
    useRef(null);

  const hitRef = useRef([]);
  const transformRef = useRef(null);

  const [canvasSize, setCanvasSize] =
    useState({
      width: 0,
      height: 0,
    });

  const [
    hoveredInstrument,
    setHoveredInstrument,
  ] = useState(null);


  const [mouseCoords, setMouseCoords] =

    useState({

      x: 0,

      y: 0,

    });

  const [tooltipPos, setTooltipPos] =
    useState({
      x: 0,
      y: 0,
    });

  const [blinkPhase, setBlinkPhase] =
    useState(true);

  // resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer =
      new ResizeObserver(([entry]) => {
        const { width, height } =
          entry.contentRect;

        setCanvasSize({
          width,
          height,
        });
      });

    observer.observe(
      containerRef.current
    );

    return () => observer.disconnect();
  }, []);

  useEffect(() => {

    const interval = setInterval(() => {

      setBlinkPhase(prev => !prev);

    }, 500);

    return () => clearInterval(interval);

  }, []);


  // draw
  useEffect(() => {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      canvasSize.width === 0 ||
      canvasSize.height === 0
    ) {
      return;
    }

    canvas.width =
      canvasSize.width * DPR;

    canvas.height =
      canvasSize.height * DPR;

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const ctx =
      canvas.getContext("2d");

    ctx.setTransform(
      DPR,
      0,
      0,
      DPR,
      0,
      0
    );

    ctx.clearRect(
      0,
      0,
      canvasSize.width,
      canvasSize.height
    );

    const vw = canvasSize.width;
    const vh = canvasSize.height;

    // background
    ctx.fillStyle = COLOR.bg;

    ctx.fillRect(0, 0, vw, vh);

    const pillars =
      snapshot?.pillars || [];

    const instruments =
      instrunmentsData || [];

    const transform =
      computeTransform(
        pillars,
        instruments,
        vw,
        vh
      );

    transformRef.current = transform;





    if (!transform) {
      ctx.fillStyle = "#999";

      ctx.font = "16px Arial";

      ctx.textAlign = "center";

      ctx.fillText(
        "No data available",
        vw / 2,
        vh / 2
      );

      return;
    }

    // grid
    drawGrid(ctx, transform);

    // -----------newwwwww

    // ─────────────────────────────────────────────
    // PANEL BOUNDARY
    // ─────────────────────────────────────────────

    const topLeft = worldToCanvas(
      transform.minX,
      transform.maxY,
      transform
    );

    const bottomRight = worldToCanvas(
      transform.maxX,
      transform.minY,
      transform
    );

    const panelWidth =
      bottomRight.x - topLeft.x;

    const panelHeight =
      bottomRight.y - topLeft.y;

    ctx.beginPath();

    ctx.rect(
      topLeft.x,
      topLeft.y,
      panelWidth,
      panelHeight
    );

    ctx.strokeStyle = "#000000";

    ctx.lineWidth = 3;

    ctx.stroke();



    // ---------------newwww

    // pillars
    pillars.forEach((pillar) => {
      const pts =
        pillar.coordinates?.map((c) =>
          worldToCanvas(
            c.x,
            c.y,
            transform
          )
        ) || [];

      if (pts.length === 0) return;

      const extracted =
        pillar.status === "extracted";

      // ctx.beginPath();

      // ctx.moveTo(
      //   pts[0].x,
      //   pts[0].y
      // );

      // pts.slice(1).forEach((p) => {
      //   ctx.lineTo(p.x, p.y);
      // });

      // ctx.closePath();

      // ctx.fillStyle = extracted
      //   ? COLOR.pillarFillExtract
      //   : COLOR.pillarFill;

      // ctx.fill();

      // ctx.strokeStyle = extracted
      //   ? COLOR.pillarStrokeExtract
      //   : COLOR.pillarStroke;

      // ctx.lineWidth = 1.5;

      // ctx.stroke();

      drawPolygon(
        ctx,
        pts,

        extracted
          ? COLOR.pillarFillExtract
          : COLOR.pillarFill,

        extracted
          ? COLOR.pillarStrokeExtract
          : COLOR.pillarStroke
      );

      // pillar number

      const centerX =
        pts.reduce((sum, p) => sum + p.x, 0) /
        pts.length;

      const centerY =
        pts.reduce((sum, p) => sum + p.y, 0) /
        pts.length;

      ctx.fillStyle = "#ffffff";

      ctx.font = "bold 12px Arial";

      ctx.textAlign = "center";

      ctx.textBaseline = "middle";

      ctx.fillText(
        pillar.pillarNumber,
        centerX,
        centerY
      );

      // ─────────────────────────
      // SPLITS
      // ─────────────────────────

      pillar.splits?.forEach((split) => {

        const splitPts =
          split.coordinates?.map((c) =>
            worldToCanvas(
              c.x,
              c.y,
              transform
            )
          ) || [];

        if (splitPts.length === 0) return;

        let splitFill =
          "rgba(255,165,0,0.85)";

        let splitStroke =
          "#cc8400";

        if (
          split.status ===
          "extracted"
        ) {

          splitFill =
            "rgba(80,80,80,0.85)";

          splitStroke =
            "#222";
        }

        drawPolygon(
          ctx,
          splitPts,
          splitFill,
          splitStroke,
          1
        );
      });

      pillar.slices?.forEach((slice) => {

        const slicePts =
          slice.coordinates.map((c) =>
            worldToCanvas(
              c.x,
              c.y,
              transform
            )
          );

        drawPolygon(
          ctx,
          slicePts,
          COLOR.pillarFillExtract,
          COLOR.pillarStrokeExtract
        );

      });

      // const displayNumbers = {
      //   1: 5,
      //   2: 4,
      //   3: 3,
      //   4: 2,
      //   5: 1,

      //   6: 6,
      //   7: 5,
      //   8: 4,
      //   9: 3,
      //   10: 2,

      //   11: 7,
      //   12: 6,
      //   13: 5,
      //   14: 4,
      //   15: 3,

      //   16: 8,
      //   17: 7,
      //   18: 6,
      //   19: 5,
      //   20: 4,

      //   21: 9,
      //   22: 8,
      //   23: 7,
      //   24: 6,
      //   25: 5,
      // };

      // ctx.fillText(
      //   displayNumbers[pillar.pillarNumber],
      //   centerX,
      //   centerY
      // );


    });

    // instruments
    hitRef.current = [];

    instruments.forEach((inst) => {
      const x = Number(
        inst.xCoordinate
      );

      const y = Number(
        inst.yCoordinate
      );

      if (isNaN(x) || isNaN(y)) return;

      const pos =
        worldToCanvas(
          x,
          y,
          transform
        );


const instrumentData =
  instrumentValues?.find(
    (v) =>
      v.instrumentId ===
      inst.instrumentId
  );

const snapshotTime =
  new Date(snapshot.date).getTime();

const matchedValues =
  instrumentData?.values?.filter(
    (val) => {

      const valueTime =
        new Date(val.timestamp).getTime();

      return valueTime <= snapshotTime;
    }
  ) || [];

const matchedValue =
  matchedValues.length > 0
    ? matchedValues[
        matchedValues.length - 1
      ]
    : null;

const currentValue =
  Number(matchedValue?.value) || 0;

const maxValue =
  Number(inst.maxValue) || 1;

console.log({
  instrument:
    inst.instrumentId,

  snapshotDate:
    snapshot.date,

  matchedValue,

  currentValue,

  maxValue
});

      let blinkColor = "#006400";

      if (currentValue >= maxValue) {

        blinkColor = "#8B0000";

      }

      // glow
      if (blinkPhase) {

        ctx.beginPath();

        ctx.arc(
          pos.x,
          pos.y,
          INSTRUMENT_RADIUS + 10,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = blinkColor;

        ctx.globalAlpha = 0.35;

        ctx.fill();

        ctx.globalAlpha = 1;
      }
      ctx.beginPath();

      ctx.arc(
        pos.x,
        pos.y,
        INSTRUMENT_RADIUS + 4,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "rgba(25,118,210,0.12)";

      ctx.fill();

      // circle
      ctx.beginPath();

      ctx.arc(
        pos.x,
        pos.y,
        INSTRUMENT_RADIUS,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        COLOR.instrFill;

      ctx.fill();

      ctx.strokeStyle =
        COLOR.instrStroke;

      ctx.lineWidth = 2;

      ctx.stroke();

      // crosshair
      ctx.strokeStyle =
        COLOR.crosshair;

      ctx.lineWidth = 1;

      ctx.setLineDash([3, 3]);

      ctx.beginPath();

      ctx.moveTo(
        pos.x -
        INSTRUMENT_RADIUS -
        8,
        pos.y
      );

      ctx.lineTo(
        pos.x +
        INSTRUMENT_RADIUS +
        8,
        pos.y
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        pos.x,
        pos.y -
        INSTRUMENT_RADIUS -
        8
      );

      ctx.lineTo(
        pos.x,
        pos.y +
        INSTRUMENT_RADIUS +
        8
      );

      ctx.stroke();

      ctx.setLineDash([]);

      // label
      ctx.fillStyle =
        COLOR.instrLabel;

      ctx.font =
        "bold 9px Arial";

      ctx.textAlign = "center";

      ctx.textBaseline = "middle";

      ctx.fillText(
        (
          inst.instrumentName || "I"
        ).substring(0, 3),
        pos.x,
        pos.y
      );

      // hit area
      hitRef.current.push({
        x: pos.x,
        y: pos.y,
        r: INSTRUMENT_RADIUS,
        instrument: inst,
      });
    });
  }, [
    snapshot,

    instrunmentsData,

    canvasSize,

    blinkPhase
  ]);

  // hit detection
  const getHit = useCallback(
    (clientX, clientY) => {
      const canvas =
        canvasRef.current;

      if (!canvas) return null;

      const rect =
        canvas.getBoundingClientRect();

      const mx =
        clientX - rect.left;

      const my =
        clientY - rect.top;

      const hit =
        hitRef.current.find(
          (h) =>
            Math.hypot(
              mx - h.x,
              my - h.y
            ) <=
            h.r + 4
        );

      return hit
        ? {
          inst: hit.instrument,
          x: mx,
          y: my,
        }
        : {
          inst: null,
          x: mx,
          y: my,
        };
    },
    []
  );

  // events
  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const onMove = (e) => {
      const { inst, x, y } =
        getHit(
          e.clientX,
          e.clientY
        );

      const t = transformRef.current;

      if (t) {
        const world =
          canvasToWorld(x, y, t);

        setMouseCoords({
          x:
            world.x - t.minX,
          y:
            t.maxY - world.y,
        });
      }

      setHoveredInstrument(
        inst || null
      );

      setTooltipPos({ x, y });

      canvas.style.cursor = inst
        ? "pointer"
        : "crosshair";
    };

    const onLeave = () => {
      setHoveredInstrument(null);

      canvas.style.cursor =
        "crosshair";
    };

    // CLICK NAVIGATION
    const onClick = (e) => {
      const { inst } = getHit(
        e.clientX,
        e.clientY
      );

      if (inst?.instrumentId) {
        window.location.href = `/${inst.instrumentId}/graph`;
      }
    };

    canvas.addEventListener(
      "pointermove",
      onMove
    );

    canvas.addEventListener(
      "pointerleave",
      onLeave
    );

    canvas.addEventListener(
      "click",
      onClick
    );

    return () => {
      canvas.removeEventListener(
        "pointermove",
        onMove
      );

      canvas.removeEventListener(
        "pointerleave",
        onLeave
      );

      canvas.removeEventListener(
        "click",
        onClick
      );
    };
  }, [getHit]);

  // tooltip placement
  const tipLeft =
    tooltipPos.x + 220 >
      canvasSize.width
      ? tooltipPos.x - 215
      : tooltipPos.x + 16;

  const tipTop =
    tooltipPos.y + 180 >
      canvasSize.height
      ? tooltipPos.y - 170
      : tooltipPos.y + 16;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: COLOR.bg,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "crosshair",
        }}
      />


      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255,255,255,0.9)",
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #d0daea",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        X: {mouseCoords.x.toFixed(1)}
        {" , "}
        Y: {mouseCoords.y.toFixed(1)}
      </div>

      {/* LEGEND */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,

          background:
            "rgba(255,255,255,0.9)",

          border:
            "1px solid #d0daea",

          borderRadius: 8,

          padding: "8px 10px",

          fontSize: 11,

          display: "flex",

          flexDirection: "column",

          gap: 6,

          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              background:
                "rgba(20,40,90,0.82)",
              border:
                "1px solid #1a3c7b",
              display: "inline-block",
            }}
          />

          <span>Pillar</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#1976d2",
              display: "inline-block",
            }}
          />

          <span>
            Instrument
          </span>
        </div>
      </div>

      {/* TOOLTIP */}
      {hoveredInstrument && (
        <div
          style={{
            position: "absolute",

            left: tipLeft,
            top: tipTop,

            width: 220,

            background:
              COLOR.tooltipBg,

            border: `1px solid ${COLOR.tooltipBorder}`,

            borderRadius: 8,

            padding: "10px 12px",

            boxShadow:
              "0 4px 16px rgba(0,0,0,0.12)",

            pointerEvents: "none",

            zIndex: 1000,

            fontSize: 12,
          }}
        >
          <div
            style={{
              fontWeight: 700,

              color:
                COLOR.tooltipTitle,

              marginBottom: 6,

              fontSize: 13,
            }}
          >
            {
              hoveredInstrument.instrumentName
            }
          </div>

          <div
            style={{
              height: 1,
              background:
                COLOR.tooltipBorder,
              marginBottom: 6,
            }}
          />

          <div>
            <b>ID:</b>{" "}
            {
              hoveredInstrument.instrumentId
            }
          </div>

          <div>
            <b>Panel:</b>{" "}
            {
              hoveredInstrument.panelNumber
            }
          </div>

          <div>
            <b>Range:</b>{" "}
            {
              hoveredInstrument.minValue
            }
            {" - "}
            {
              hoveredInstrument.maxValue
            }{" "}
            {
              hoveredInstrument.unit
            }
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#1976d2",
              fontSize: 11,
            }}
          >
            Click to view graph →
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelSnapshot;