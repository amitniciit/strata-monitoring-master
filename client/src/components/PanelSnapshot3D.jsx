import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Type-based color system (matches 2D PanelSnapshot) ─────────────────────
const TYPE_COLORS = {
  pillar: 0x1a1a1a,   // black
  split:  0x4d4d4d,   // dark grey
  slice:  0xa6a6a6,   // light grey
};

const INSTRUMENT_COLORS = {
  safe:  { main: 0x00aa44, emissive: 0x004d1f },
  alert: { main: 0xcc0000, emissive: 0x660000 },
};

// ─── Bounds ──────────────────────────────────────────────────────────────────
function computeBounds(pillars) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pillars?.forEach(p => {
    p.coordinates?.forEach(c => {
      minX = Math.min(minX, c.x); minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y);
    });
  });
  return { minX, minY, maxX, maxY };
}

// ─── Auto gallery width (same logic as 2D) ───────────────────────────────────
function computeGalleryWidth(pillars) {
  const edges = [];
  pillars.forEach(p => {
    const xs = p.coordinates.map(c => c.x);
    edges.push({ minX: Math.min(...xs), maxX: Math.max(...xs) });
  });
  edges.sort((a, b) => a.minX - b.minX);
  let minGap = Infinity;
  for (let i = 1; i < edges.length; i++) {
    const gap = edges[i].minX - edges[i - 1].maxX;
    if (gap > 0) minGap = Math.min(minGap, gap);
  }
  return isFinite(minGap) ? minGap : 10;
}

// ─── Extruded box from coordinate list ───────────────────────────────────────
function makeExtruded(coordinates, height, panelMaxY, yOffset = 0) {
  const xs = coordinates.map(c => c.x);
  const ys = coordinates.map(c => c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX;
  const d = maxY - minY;
  const cx = minX + w / 2;
  const cy = minY + d / 2;
  const flippedCY = panelMaxY - cy;
  const geo = new THREE.BoxGeometry(w, height, d);
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(cx, yOffset + height / 2, flippedCY));
  return geo;
}

// ─── Canvas label texture ─────────────────────────────────────────────────────
function makeLabelTexture(text) {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 128, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  roundRect(ctx, 4, 8, 120, 48, 8);
  ctx.fill();
  ctx.strokeStyle = '#1a3c7b';
  ctx.lineWidth = 2;
  roundRect(ctx, 4, 8, 120, 48, 8);
  ctx.stroke();
  ctx.fillStyle = '#1a2c4e';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 34);
  return new THREE.CanvasTexture(cv);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Component ───────────────────────────────────────────────────────────────
const PanelSnapshot3D = ({ snapshot, instrunmentsData, instrumentValues }) => {
  const mountRef   = useRef(null);
  const frameRef   = useRef(null);
  const instrumentMeshesRef = useRef([]);
  const labelsRef  = useRef([]);
  const [tooltip, setTooltip]   = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [totalInst, setTotalInst]   = useState(0);

  // ── Resolve alert counts before render ──
  const { resolvedAlerts, resolvedTotal } = useMemo(() => {
    const instruments = instrunmentsData || [];
    let alerts = 0;
    instruments.forEach(inst => {
      const instData = instrumentValues?.find(v => v.instrumentId === inst.instrumentId);
      const snapTime = snapshot?.date ? new Date(snapshot.date).getTime() : Date.now();
      const matched  = instData?.values?.filter(v => new Date(v.timestamp).getTime() <= snapTime) || [];
      const latest   = matched.length > 0 ? Number(matched[matched.length - 1].value) : 0;
      if (latest >= Number(inst.maxValue)) alerts++;
    });
    return { resolvedAlerts: alerts, resolvedTotal: instruments.length };
  }, [snapshot, instrunmentsData, instrumentValues]);

  useEffect(() => {
    setAlertCount(resolvedAlerts);
    setTotalInst(resolvedTotal);
  }, [resolvedAlerts, resolvedTotal]);

  // ── Three.js scene ──
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4fa);
    scene.fog = new THREE.FogExp2(0xdce6f5, 0.0008);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 8000);

    // ── Lighting ──
    // Hemisphere: sky vs ground
    const hemi = new THREE.HemisphereLight(0xd6e8ff, 0x403020, 0.6);
    scene.add(hemi);

    // Main directional (sun-like, casts shadows)
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(200, 400, 150);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 2000;
    sun.shadow.camera.left   = -500;
    sun.shadow.camera.right  =  500;
    sun.shadow.camera.top    =  500;
    sun.shadow.camera.bottom = -500;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Fill from opposite side
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.4);
    fill.position.set(-150, 100, -100);
    scene.add(fill);

    // Ambient so shadows aren't pitch black
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // ── Data ──
    const pillars     = snapshot?.pillars || [];
    const instruments = instrunmentsData  || [];
    const { minX, minY, maxX, maxY } = computeBounds(pillars);
    const galleryW = computeGalleryWidth(pillars);
    const span = Math.max(maxX - minX, maxY - minY) || 100;
    const trueCX = minX + (maxX - minX) / 2;
    const trueCY = minY + (maxY - minY) / 2;

    // ── Floor ──
    const floorGeo = new THREE.PlaneGeometry(span * 2, span * 2, 40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xcbd6e8,
      roughness: 0.95,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(trueCX, 0, trueCY);
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Grid ──
    const gridSize = Math.ceil(span * 2 / 10) * 10;
    const grid = new THREE.GridHelper(gridSize, Math.round(gridSize / (span / 10)), 0x8090b0, 0x8090b0);
    grid.position.set(trueCX, 0.05, trueCY);
    grid.material.opacity = 0.10;
    grid.material.transparent = true;
    scene.add(grid);

    // ── Panel boundary box (matches 2D: expanded by galleryW on all sides) ──
    const bndMinX = minX - galleryW;
    const bndMaxX = maxX + galleryW;
    const bndMinY = minY - galleryW;
    const bndMaxY = maxY + galleryW;
    const bndW = bndMaxX - bndMinX;
    const bndD = bndMaxY - bndMinY;

    // Boundary wall lines
    const bndGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bndW, 2, bndD));
    const bndLine = new THREE.LineSegments(
      bndGeo,
      new THREE.LineBasicMaterial({ color: 0x1a3c7b, linewidth: 1.5 })
    );
    bndLine.position.set(bndMinX + bndW / 2, 1, maxY - (bndMinY + bndD / 2));
    scene.add(bndLine);

    labelsRef.current = [];

    // ── Compute a representative pillar height for roof ──
    let maxPillarH = 0;

    // ── PILLARS ──
    pillars.forEach(pillar => {
      const xs = pillar.coordinates.map(c => c.x);
      const ys = pillar.coordinates.map(c => c.y);
      const avgSize = ((Math.max(...xs) - Math.min(...xs)) + (Math.max(...ys) - Math.min(...ys))) / 2;
      const safeH   = avgSize * 0.225;
      if (safeH > maxPillarH) maxPillarH = safeH;

      // Base pillar — always dark (type-based, ignores status)
      const geo = makeExtruded(pillar.coordinates, safeH, maxY);
      const mat = new THREE.MeshStandardMaterial({
        color: TYPE_COLORS.pillar,
        roughness: 0.7,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow  = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // ── SLICES (light grey, sits at same height, draws on top) ──
      pillar.slices?.forEach(slice => {
        if (!slice.coordinates || slice.coordinates.length < 3) return;
        const sliceGeo = makeExtruded(slice.coordinates, safeH, maxY, 0);
        const sliceMat = new THREE.MeshStandardMaterial({
          color: TYPE_COLORS.slice,
          roughness: 0.6,
          metalness: 0.05,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
        sliceMesh.castShadow = true;
        sliceMesh.receiveShadow = true;
        scene.add(sliceMesh);
      });

      // ── SPLITS (dark grey) ──
      pillar.splits?.forEach(split => {
        if (!split.coordinates || split.coordinates.length < 3) return;
        const splitGeo = makeExtruded(split.coordinates, safeH, maxY, 0);
        const splitMat = new THREE.MeshStandardMaterial({
          color: TYPE_COLORS.split,
          roughness: 0.65,
          metalness: 0.05,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        const splitMesh = new THREE.Mesh(splitGeo, splitMat);
        splitMesh.castShadow = true;
        splitMesh.receiveShadow = true;
        scene.add(splitMesh);
      });

      // ── Label sprite ──
      const sumX = pillar.coordinates.reduce((s, c) => s + c.x, 0) / pillar.coordinates.length;
      const sumY = pillar.coordinates.reduce((s, c) => s + c.y, 0) / pillar.coordinates.length;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(avgSize * 0.38, avgSize * 0.20),
        new THREE.MeshBasicMaterial({
          map: makeLabelTexture(String(pillar.pillarNumber)),
          transparent: true,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
        })
      );
      label.renderOrder = 999;
      label.position.set(sumX, safeH + avgSize * 0.18, maxY - sumY);
      scene.add(label);
      labelsRef.current.push(label);
    });

    // ── ROOF SLAB (thin, semi-transparent, hovers above pillars) ──
    const roofH = maxPillarH > 0 ? maxPillarH + 4 : 30;
    const roofGeo = new THREE.BoxGeometry(bndW, 3, bndD);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x8ca0c0,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(bndMinX + bndW / 2, roofH, maxY - (bndMinY + bndD / 2));
    scene.add(roofMesh);

    // Roof edge wire
    const roofEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(roofGeo),
      new THREE.LineBasicMaterial({ color: 0x5070a0, transparent: true, opacity: 0.35 })
    );
    roofEdge.position.copy(roofMesh.position);
    scene.add(roofEdge);

    // ── INSTRUMENTS ──
    instrumentMeshesRef.current = [];
    instruments.forEach(inst => {
      const x = Number(inst.xCoordinate);
      const y = Number(inst.yCoordinate);
      const z = Number(inst.zCoordinate) || 0;
      if (isNaN(x) || isNaN(y)) return;

      const instData  = instrumentValues?.find(v => v.instrumentId === inst.instrumentId);
      const snapTime  = snapshot?.date ? new Date(snapshot.date).getTime() : Date.now();
      const matched   = instData?.values?.filter(v => new Date(v.timestamp).getTime() <= snapTime) || [];
      const latestVal = matched.length > 0 ? Number(matched[matched.length - 1].value) : 0;
      const isAlert   = latestVal >= Number(inst.maxValue);
      const col       = isAlert ? INSTRUMENT_COLORS.alert : INSTRUMENT_COLORS.safe;

      // Vertical stake
      const stakeH = z + 1.0;
      const stake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.14, stakeH, 8),
        new THREE.MeshStandardMaterial({ color: 0xb0bcc8, roughness: 0.6, metalness: 0.3 })
      );
      stake.position.set(x, stakeH / 2, maxY - y);
      scene.add(stake);

      // Sphere sensor
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 20, 20),
        new THREE.MeshStandardMaterial({
          color: col.main,
          emissive: col.emissive,
          emissiveIntensity: 0.55,
          metalness: 0.3,
          roughness: 0.35,
        })
      );
      sphere.position.set(x, stakeH, maxY - y);
      sphere.castShadow = true;
      scene.add(sphere);

      // Halo ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.18, 8, 40),
        new THREE.MeshBasicMaterial({ color: col.main, transparent: true, opacity: 0.35 })
      );
      ring.position.set(x, stakeH, maxY - y);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);

      // Point light for alert instruments
      if (isAlert) {
        const ptLight = new THREE.PointLight(col.main, 1.5, 30, 2);
        ptLight.position.set(x, stakeH + 1, maxY - y);
        scene.add(ptLight);
      }

      instrumentMeshesRef.current.push({ mesh: sphere, ring, instrument: inst, isAlert });
    });

    // ── Camera position ──
    const camDist = span * 1.2;
    camera.position.set(trueCX, camDist * 1.1, maxY + camDist * 0.8);
    camera.lookAt(trueCX, 0, trueCY);

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.07;
    controls.minDistance     = span * 0.3;
    controls.maxDistance     = span * 4;
    controls.maxPolarAngle   = Math.PI / 2.05;
    controls.target.set(trueCX, 0, trueCY);
    controls.update();

    // ── Resize observer ──
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // ── Raycaster / hover ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getHit = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(instrumentMeshesRef.current.map(d => d.mesh), false);
      return hits.length > 0 ? instrumentMeshesRef.current.find(d => d.mesh === hits[0].object) : null;
    };

    const onMouseMove = (e) => {
      const hit = getHit(e.clientX, e.clientY);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      if (hit) {
        const rect = renderer.domElement.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, instrument: hit.instrument, isAlert: hit.isAlert });
      } else {
        setTooltip(null);
      }
    };

    const onClick = (e) => {
      const hit = getHit(e.clientX, e.clientY);
      if (hit?.instrument?.instrumentId) {
        window.location.href = `/${hit.instrument.instrumentId}/graph`;
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // ── Animate ──
    let lastTime = 0;
    const animate = (time) => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();

      // Labels always face camera
      labelsRef.current.forEach(label => label.lookAt(camera.position));

      // Smooth blink for instruments
      const blink = (Math.sin(time * 0.0035) + 1) / 2;
      instrumentMeshesRef.current.forEach(({ mesh, ring, isAlert }) => {
        if (isAlert) {
          mesh.material.emissiveIntensity = 0.4 + blink * 0.8;
          ring.material.opacity = 0.15 + blink * 0.45;
        } else {
          mesh.material.emissiveIntensity = 0.3 + blink * 0.3;
          ring.material.opacity = 0.12 + blink * 0.18;
        }
      });

      renderer.render(scene, camera);
      lastTime = time;
    };
    animate(0);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [snapshot, instrunmentsData, instrumentValues]);

  // ── Tooltip position (smart flip) ──
  const tipLeft = tooltip && tooltip.x + 240 > (mountRef.current?.clientWidth  || 600)
    ? tooltip.x - 230 : (tooltip?.x || 0) + 18;
  const tipTop  = tooltip && tooltip.y + 200 > (mountRef.current?.clientHeight || 500)
    ? tooltip.y - 185 : (tooltip?.y || 0) + 18;

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* ── Alert badge (top-left, only when alerts > 0) ── */}
      {alertCount > 0 && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: '#cc0000', color: '#fff',
          borderRadius: 6, padding: '5px 11px',
          fontSize: 12, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(180,0,0,0.30)',
          pointerEvents: 'none', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 6,
          letterSpacing: '0.01em',
        }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          {alertCount} of {totalInst} instrument{totalInst !== 1 ? 's' : ''} in alert
        </div>
      )}

      {/* ── Instrument tooltip ── */}
      {tooltip && (
        <div style={{
          position: 'absolute', left: tipLeft, top: tipTop,
          width: 228, background: '#fff',
          border: `1px solid ${tooltip.isAlert ? '#e57373' : '#c8d8ea'}`,
          borderRadius: 8, padding: '10px 13px',
          boxShadow: tooltip.isAlert
            ? '0 4px 18px rgba(180,0,0,0.14)'
            : '0 4px 16px rgba(0,0,0,0.10)',
          pointerEvents: 'none', zIndex: 1000, fontSize: 12,
          borderLeft: `4px solid ${tooltip.isAlert ? '#cc0000' : '#00aa44'}`,
        }}>
          <div style={{
            fontWeight: 700, color: tooltip.isAlert ? '#cc0000' : '#1a3c7b',
            marginBottom: 6, fontSize: 13,
          }}>
            {tooltip.instrument.instrumentName}
          </div>
          <div style={{ height: 1, background: '#e8eef5', marginBottom: 6 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1a2c4e' }}>
            <div><span style={{ color: '#6b7a8d', minWidth: 52, display: 'inline-block' }}>ID:</span> {tooltip.instrument.instrumentId}</div>
            <div><span style={{ color: '#6b7a8d', minWidth: 52, display: 'inline-block' }}>Panel:</span> {tooltip.instrument.panelNumber}</div>
            <div><span style={{ color: '#6b7a8d', minWidth: 52, display: 'inline-block' }}>Range:</span> {tooltip.instrument.minValue} – {tooltip.instrument.maxValue} {tooltip.instrument.unit}</div>
          </div>
          <div style={{ marginTop: 8, color: tooltip.isAlert ? '#cc0000' : '#1976d2', fontSize: 11, fontWeight: 600 }}>
            Click to view graph →
          </div>
        </div>
      )}

      {/* ── Legend (bottom-right) ── */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(255,255,255,0.93)',
        border: '1px solid #d0daea',
        borderRadius: 8, padding: '9px 12px',
        fontSize: 11, color: '#1a2c4e',
        display: 'flex', flexDirection: 'column', gap: 5,
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        minWidth: 160,
      }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#1a3c7b', marginBottom: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Legend
        </div>
        {[
          { color: '#1a1a1a', label: 'Pillar',            shape: 'square' },
          { color: '#4d4d4d', label: 'Split',             shape: 'square' },
          { color: '#a6a6a6', label: 'Slice',             shape: 'square' },
          { color: '#00aa44', label: 'Instrument (safe)', shape: 'circle' },
          { color: '#cc0000', label: 'Instrument (alert)', shape: 'circle' },
        ].map(({ color, label, shape }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 11, height: 11,
              borderRadius: shape === 'circle' ? '50%' : 2,
              background: color,
              display: 'inline-block',
              flexShrink: 0,
              boxShadow: shape === 'circle' ? `0 0 4px ${color}80` : 'none',
            }} />
            <span>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid #e8eef5', color: '#8090a8', fontSize: 10, lineHeight: 1.5 }}>
          Drag · Scroll · Right-drag to pan
        </div>
      </div>
    </div>
  );
};

export default PanelSnapshot3D;
