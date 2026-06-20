import { useRef, useEffect, useState, useCallback, useMemo } from "react";

const DPR = window.devicePixelRatio || 1;
const PADDING_RATIO = 0.08;
const INSTRUMENT_RADIUS = 14;

const COLOR = {
  bg: "#fafbfd",
  bgPanel: "#ffffff",
  grid: "rgba(60,80,130,0.05)",
  gridMajor: "rgba(60,80,130,0.13)",
  gridLabel: "rgba(70,90,140,0.55)",
  boundary: "#1f2a44",
  pillarFill: "#1a1a1a",
  pillarStroke: "#000000",
  splitFill: "#4d4d4d",
  splitStroke: "#2e2e2e",
  sliceFill: "#a6a6a6",
  sliceStroke: "#7a7a7a",
  intactText: "#f0f0f0",
  instrSafe: "#1aa260",
  instrAlert: "#e0322c",
  instrLabel: "#ffffff",
  tooltipBg: "rgba(255,255,255,0.98)",
  tooltipBorder: "rgba(60,80,130,0.15)",
  tooltipTitle: "#1f5fc4",
  tooltipText: "#23293a",
  crosshair: "rgba(31,95,196,0.35)",
};

function computeTransform(pillars, instruments, vpWidth, vpHeight) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pillars?.forEach((pillar) => {
    pillar.coordinates?.forEach((c) => {
      minX = Math.min(minX, c.x); minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y);
    });
  });
  instruments?.forEach((inst) => {
    const x = Number(inst.xCoordinate);
    const y = Number(inst.yCoordinate);
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  });
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;

  let galleryWidth = null;
  if (pillars?.length >= 2) {
    const pillarXRanges = pillars
      .map((p) => {
        const xs = p.coordinates?.map((c) => c.x) || [];
        if (!xs.length) return null;
        return { min: Math.min(...xs), max: Math.max(...xs) };
      })
      .filter(Boolean)
      .sort((a, b) => a.min - b.min);
    for (let i = 0; i < pillarXRanges.length - 1; i++) {
      const gap = pillarXRanges[i + 1].min - pillarXRanges[i].max;
      if (gap > 0.01) {
        galleryWidth = galleryWidth === null ? gap : Math.min(galleryWidth, gap);
      }
    }
  }
  if (galleryWidth === null) galleryWidth = (maxX - minX) * 0.02;

  const dataMinX = minX - galleryWidth;
  const dataMinY = minY - galleryWidth;
  const dataMaxX = maxX + galleryWidth;
  const dataMaxY = maxY + galleryWidth;

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;
  const paddingX = worldWidth * PADDING_RATIO;
  const paddingY = worldHeight * PADDING_RATIO;
  minX -= paddingX; maxX += paddingX;
  minY -= paddingY; maxY += paddingY;
  minX = Math.min(minX, dataMinX);
  minY = Math.min(minY, dataMinY);
  maxX = Math.max(maxX, dataMaxX);
  maxY = Math.max(maxY, dataMaxY);

  const paddedWidth = maxX - minX;
  const paddedHeight = maxY - minY;
  const scale = Math.min(vpWidth / paddedWidth, vpHeight / paddedHeight);
  const offsetX = (vpWidth - paddedWidth * scale) / 2;
  const offsetY = (vpHeight - paddedHeight * scale) / 2;
  return { minX, minY, maxX, maxY, dataMinX, dataMinY, dataMaxX, dataMaxY, scale, offsetX, offsetY, vpWidth, vpHeight };
}

function worldToCanvas(x, y, t) {
  return {
    x: (x - t.minX) * t.scale + t.offsetX,
    y: t.vpHeight - ((y - t.minY) * t.scale + t.offsetY),
  };
}

function drawPolygon(ctx, points, fillColor, strokeColor, lineWidth = 1.5) {
  if (!points?.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawGrid(ctx, t) {
  const worldWidth = t.maxX - t.minX;
  const worldHeight = t.maxY - t.minY;
  const range = Math.max(worldWidth, worldHeight);
  const rawStep = range / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / mag) * mag;
  ctx.font = "10px 'JetBrains Mono', monospace";
  for (let wx = Math.floor(t.minX / step) * step; wx <= t.maxX + step; wx += step) {
    const p = worldToCanvas(wx, 0, t);
    const major = Math.round(wx / step) % 5 === 0;
    ctx.strokeStyle = major ? COLOR.gridMajor : COLOR.grid;
    ctx.lineWidth = major ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, t.vpHeight); ctx.stroke();
    if (major) {
      ctx.fillStyle = COLOR.gridLabel; ctx.textAlign = "center";
      ctx.fillText(wx.toFixed(0), p.x, t.vpHeight - 6);
    }
  }
  for (let wy = Math.floor(t.minY / step) * step; wy <= t.maxY + step; wy += step) {
    const p = worldToCanvas(0, wy, t);
    const major = Math.round(wy / step) % 5 === 0;
    ctx.strokeStyle = major ? COLOR.gridMajor : COLOR.grid;
    ctx.lineWidth = major ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(t.vpWidth, p.y); ctx.stroke();
    if (major) {
      ctx.fillStyle = COLOR.gridLabel; ctx.textAlign = "left";
      ctx.fillText(wy.toFixed(0), 4, p.y - 4);
    }
  }
}

const PanelSnapshot = ({ snapshot, instrunmentsData, instrumentValues }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const hitRef = useRef([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredInstrument, setHoveredInstrument] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [blinkPhase, setBlinkPhase] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBlinkPhase((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    let alertCount = 0;
    const totalInstr = (instrunmentsData || []).length;
    (instrunmentsData || []).forEach((inst) => {
      const instrumentData = instrumentValues?.find((v) => v.instrumentId === inst.instrumentId);
      const snapshotTime = new Date(snapshot?.date).getTime();
      const matched = instrumentData?.values?.filter(
        (val) => new Date(val.timestamp).getTime() <= snapshotTime
      ) || [];
      const latest = matched.length ? matched[matched.length - 1] : null;
      const currentValue = Number(latest?.value) || 0;
      const maxValue = Number(inst.maxValue) || 1;
      if (currentValue >= maxValue) alertCount += 1;
    });
    return { alertCount, totalInstr };
  }, [snapshot, instrunmentsData, instrumentValues]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;
    canvas.width = canvasSize.width * DPR;
    canvas.height = canvasSize.height * DPR;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    const vw = canvasSize.width;
    const vh = canvasSize.height;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, vw, vh);
    const pillars = snapshot?.pillars || [];
    const instruments = instrunmentsData || [];
    const transform = computeTransform(pillars, instruments, vw, vh);
    if (!transform) {
      ctx.fillStyle = "#5a6b8a";
      ctx.font = "16px 'Inter', Arial";
      ctx.textAlign = "center";
      ctx.fillText("No data available", vw / 2, vh / 2);
      return;
    }
    drawGrid(ctx, transform);
    const topLeft = worldToCanvas(transform.dataMinX, transform.dataMaxY, transform);
    const bottomRight = worldToCanvas(transform.dataMaxX, transform.dataMinY, transform);
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.strokeStyle = COLOR.boundary;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    const dipX = topLeft.x - 45;
    ctx.strokeStyle = COLOR.gridLabel; ctx.fillStyle = COLOR.gridLabel; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dipX, topLeft.y + 20); ctx.lineTo(dipX, topLeft.y + 140); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dipX, topLeft.y + 140);
    ctx.lineTo(dipX - 6, topLeft.y + 128);
    ctx.lineTo(dipX + 6, topLeft.y + 128);
    ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(dipX - 18, topLeft.y + 80);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "600 13px 'Inter', Arial";
    ctx.fillText("DIP", 0, 0);
    ctx.restore();

    // Pillars — static, no hover, no hit detection
    pillars.forEach((pillar) => {
      const pts = pillar.coordinates?.map((c) => worldToCanvas(c.x, c.y, transform)) || [];
      if (pts.length === 0) return;
      drawPolygon(ctx, pts, COLOR.pillarFill, COLOR.pillarStroke, 1.5);
      pillar.splits?.forEach((split) => {
        const splitPts = split.coordinates?.map((c) => worldToCanvas(c.x, c.y, transform)) || [];
        if (splitPts.length === 0) return;
        drawPolygon(ctx, splitPts, COLOR.splitFill, COLOR.splitStroke, 1);
      });
      pillar.slices?.forEach((slice) => {
        if (!slice.coordinates?.length) return;
        const slicePts = slice.coordinates.map((c) => worldToCanvas(c.x, c.y, transform));
        drawPolygon(ctx, slicePts, COLOR.sliceFill, COLOR.sliceStroke, 1);
      });
      const centerX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const centerY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      ctx.fillStyle = COLOR.intactText;
      ctx.font = "600 12px 'Inter', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pillar.pillarNumber, centerX, centerY);
    });

    hitRef.current = [];
    instruments.forEach((inst) => {
      const x = Number(inst.xCoordinate);
      const y = Number(inst.yCoordinate);
      if (isNaN(x) || isNaN(y)) return;
      const pos = worldToCanvas(x, y, transform);
      const instrumentData = instrumentValues?.find((v) => v.instrumentId === inst.instrumentId);
      const snapshotTime = new Date(snapshot.date).getTime();
      const matchedValues = instrumentData?.values?.filter(
        (val) => new Date(val.timestamp).getTime() <= snapshotTime
      ) || [];
      const matchedValue = matchedValues.length > 0 ? matchedValues[matchedValues.length - 1] : null;
      const currentValue = Number(matchedValue?.value) || 0;
      const maxValue = Number(inst.maxValue) || 1;
      const isAlert = currentValue >= maxValue;
      const blinkColor = isAlert ? COLOR.instrAlert : COLOR.instrSafe;
      if (blinkPhase) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, INSTRUMENT_RADIUS + 10, 0, Math.PI * 2);
        ctx.fillStyle = blinkColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, INSTRUMENT_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = isAlert ? "rgba(224,50,44,0.10)" : "rgba(26,162,96,0.10)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, INSTRUMENT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = blinkColor;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = COLOR.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pos.x - INSTRUMENT_RADIUS - 8, pos.y); ctx.lineTo(pos.x + INSTRUMENT_RADIUS + 8, pos.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y - INSTRUMENT_RADIUS - 8); ctx.lineTo(pos.x, pos.y + INSTRUMENT_RADIUS + 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLOR.instrLabel;
      ctx.font = "700 9px 'Inter', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((inst.instrumentName || "I").substring(0, 3), pos.x, pos.y);
      hitRef.current.push({ x: pos.x, y: pos.y, r: INSTRUMENT_RADIUS, instrument: inst });
    });
  }, [snapshot, instrunmentsData, canvasSize, blinkPhase]);

  const getHit = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const instHit = hitRef.current.find((h) => Math.hypot(mx - h.x, my - h.y) <= h.r + 4);
    return instHit ? { inst: instHit.instrument, x: mx, y: my } : { inst: null, x: mx, y: my };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      const { inst, x, y } = getHit(e.clientX, e.clientY);
      setHoveredInstrument(inst || null);
      setTooltipPos({ x, y });
      canvas.style.cursor = inst ? "pointer" : "crosshair";
    };
    const onLeave = () => {
      setHoveredInstrument(null);
      canvas.style.cursor = "crosshair";
    };
    const onClick = (e) => {
      const { inst } = getHit(e.clientX, e.clientY);
      if (inst?.instrumentId) window.location.href = `/${inst.instrumentId}/graph`;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [getHit]);

  const tipLeft = tooltipPos.x + 230 > canvasSize.width ? tooltipPos.x - 225 : tooltipPos.x + 16;
  const tipTop  = tooltipPos.y + 160 > canvasSize.height ? tooltipPos.y - 150 : tooltipPos.y + 16;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%", position: "relative",
        overflow: "hidden", background: COLOR.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        borderRadius: 12,
        border: "1px solid rgba(31,42,68,0.1)",
        boxShadow: "0 1px 3px rgba(20,30,60,0.06)",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }} />

      {stats.alertCount > 0 && (
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(224,50,44,0.08)",
          border: "1px solid rgba(224,50,44,0.3)",
          borderRadius: 8, padding: "7px 14px",
          display: "flex", alignItems: "center", gap: 8,
          pointerEvents: "none",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: COLOR.instrAlert,
            boxShadow: "0 0 0 4px rgba(224,50,44,0.15)",
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#a8221d" }}>
            {stats.alertCount} of {stats.totalInstr} instruments in alert
          </span>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 10, right: 10,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(31,42,68,0.1)",
        borderRadius: 10, padding: "10px 12px",
        fontSize: 11, display: "flex", flexDirection: "column", gap: 5,
        pointerEvents: "none", color: "#23293a",
        boxShadow: "0 2px 8px rgba(20,30,60,0.06)",
      }}>
        {[
          { color: COLOR.pillarFill, border: COLOR.pillarStroke, label: "Pillar" },
          { color: COLOR.splitFill,  border: COLOR.splitStroke,  label: "Split" },
          { color: COLOR.sliceFill,  border: COLOR.sliceStroke,  label: "Slice" },
          { color: COLOR.instrSafe,  border: "#ffffff", label: "Instrument (safe)",  round: true },
          { color: COLOR.instrAlert, border: "#ffffff", label: "Instrument (alert)", round: true },
        ].map(({ color, border, label, round }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 14, height: 14, background: color,
              border: `1.5px solid ${border}`,
              borderRadius: round ? "50%" : 3,
              display: "inline-block", flexShrink: 0,
            }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {hoveredInstrument && (
        <div style={{
          position: "absolute", left: tipLeft, top: tipTop,
          width: 220, background: COLOR.tooltipBg,
          backdropFilter: "blur(8px)",
          border: `1px solid ${COLOR.tooltipBorder}`,
          borderRadius: 10, padding: "12px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          pointerEvents: "none", zIndex: 1000,
          fontSize: 12, color: COLOR.tooltipText,
        }}>
          <div style={{ fontWeight: 700, color: COLOR.tooltipTitle, marginBottom: 6, fontSize: 13 }}>
            {hoveredInstrument.instrumentName}
          </div>
          <div style={{ height: 1, background: COLOR.tooltipBorder, marginBottom: 6 }} />
          <div><b>ID:</b> {hoveredInstrument.instrumentId}</div>
          <div><b>Panel:</b> {hoveredInstrument.panelNumber}</div>
          <div><b>Range:</b> {hoveredInstrument.minValue} – {hoveredInstrument.maxValue} {hoveredInstrument.unit}</div>
          <div style={{ marginTop: 8, color: COLOR.tooltipTitle, fontSize: 11 }}>Click to view graph →</div>
        </div>
      )}
    </div>
  );
};

export default PanelSnapshot;
