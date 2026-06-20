import { useEffect, useState } from 'react';
import {
  LineChart,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  Line,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Search from './Search';
/* ─── Design tokens ──────────────────────────────────────────────── */
const TOKEN = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#1c2333',
  border: '#30363d',
  textPrimary: '#e6edf3',
  textMuted: '#8b949e',
  textDim: '#484f58',
  safe: '#3fb950',
  safeGlow: 'rgba(63,185,80,0.15)',
  warning: '#d29922',
  warningGlow: 'rgba(210,153,34,0.15)',
  critical: '#f85149',
  criticalGlow: 'rgba(248,81,73,0.18)',
  accent: '#58a6ff',
  accentGlow: 'rgba(88,166,255,0.12)',
  fontMono: '"JetBrains Mono", "Fira Mono", "Courier New", monospace',
  fontSans: '"Inter", "Segoe UI", system-ui, sans-serif',
};
/* ─── Helpers ─────────────────────────────────────────────────────── */
const statusColor = (s) =>
  s === 'SAFE' ? TOKEN.safe : s === 'WARNING' ? TOKEN.warning : TOKEN.critical;
const statusGlow = (s) =>
  s === 'SAFE' ? TOKEN.safeGlow : s === 'WARNING' ? TOKEN.warningGlow : TOKEN.criticalGlow;
const trendIcon = (t) => {
  if (t === 'RISING') return '↑';
  if (t === 'FALLING') return '↓';
  return '→';
};
const fmtTimestamp = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
/* ─── Custom Tooltip ─────────────────────────────────────────────── */
const MiningTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload ?? {};
  const val = Number(d.value ?? 0);
  const max = Number(d.maxValue ?? 1);
  const util = ((val / max) * 100).toFixed(1);
  const warn = max * 0.7;
  const crit = max * 0.9;
  let st = 'SAFE';
  if (val >= crit) st = 'CRITICAL';
  else if (val >= warn) st = 'WARNING';
  return (
    <div
      style={{
        background: TOKEN.surfaceAlt,
        border: `1px solid ${TOKEN.border}`,
        borderRadius: 8,
        padding: '12px 16px',
        fontFamily: TOKEN.fontSans,
        minWidth: 200,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p
        style={{
          margin: '0 0 10px',
          color: TOKEN.textMuted,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderBottom: `1px solid ${TOKEN.border}`,
          paddingBottom: 8,
        }}
      >
        {new Date(label).toLocaleString('en-IN')}
      </p>
      <Row label="Reading" value={`${val.toFixed(3)} ${unit}`} color={TOKEN.accent} />
      <Row label="Max Limit" value={`${max.toFixed(3)} ${unit}`} color={TOKEN.textMuted} />
      <Row label="Utilization" value={`${util}%`} color={TOKEN.textPrimary} />
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${TOKEN.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor(st),
            boxShadow: `0 0 6px ${statusColor(st)}`,
          }}
        />
        <span style={{ color: statusColor(st), fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
          {st}
        </span>
      </div>
    </div>
  );
};
const Row = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
    <span style={{ color: TOKEN.textMuted, fontSize: 12 }}>{label}</span>
    <span style={{ color: color ?? TOKEN.textPrimary, fontSize: 12, fontWeight: 600, fontFamily: TOKEN.fontMono }}>
      {value}
    </span>
  </div>
);
/* ─── KPI Card ───────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent, glow, mono }) => (
  <div
    style={{
      background: TOKEN.surface,
      border: `1px solid ${TOKEN.border}`,
      borderRadius: 10,
      padding: '18px 22px',
      flex: '1 1 160px',
      minWidth: 140,
      boxShadow: glow ? `0 0 18px ${glow}` : '0 2px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      transition: 'box-shadow 0.2s',
    }}
  >
    <span
      style={{
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: TOKEN.textDim,
        fontFamily: TOKEN.fontSans,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: accent ?? TOKEN.textPrimary,
        fontFamily: mono ? TOKEN.fontMono : TOKEN.fontSans,
        lineHeight: 1.2,
        wordBreak: 'break-all',
      }}
    >
      {value}
    </span>
    {sub && (
      <span style={{ fontSize: 11, color: TOKEN.textMuted, fontFamily: TOKEN.fontSans }}>
        {sub}
      </span>
    )}
  </div>
);
/* ─── Utilization Bar ────────────────────────────────────────────── */
const UtilBar = ({ pct, status }) => {
  const color = statusColor(status);
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: TOKEN.surfaceAlt,
          overflow: 'hidden',
          border: `1px solid ${TOKEN.border}`,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            background: color,
            borderRadius: 99,
            boxShadow: `0 0 8px ${color}`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
};
/* ─── Section Header ─────────────────────────────────────────────── */
const SectionHeader = ({ title, badge }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: 3,
        height: 18,
        background: TOKEN.accent,
        borderRadius: 99,
        boxShadow: `0 0 8px ${TOKEN.accent}`,
        flexShrink: 0,
      }}
    />
    <span
      style={{
        color: TOKEN.textPrimary,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: TOKEN.fontSans,
      }}
    >
      {title}
    </span>
    {badge && (
      <span
        style={{
          fontSize: 10,
          color: TOKEN.textMuted,
          background: TOKEN.surfaceAlt,
          border: `1px solid ${TOKEN.border}`,
          borderRadius: 4,
          padding: '2px 7px',
          fontFamily: TOKEN.fontMono,
          marginLeft: 'auto',
        }}
      >
        {badge}
      </span>
    )}
  </div>
);
/* ─── Zone Legend ────────────────────────────────────────────────── */
const ZoneLegend = () => (
  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
    {[
      { color: TOKEN.safe, label: 'Safe Zone', sub: '0 – 70%' },
      { color: TOKEN.warning, label: 'Warning Zone', sub: '70 – 90%' },
      { color: TOKEN.critical, label: 'Critical Zone', sub: '90 – 100%' },
    ].map(({ color, label, sub }) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: color,
            opacity: 0.7,
          }}
        />
        <span style={{ fontSize: 11, color: TOKEN.textMuted, fontFamily: TOKEN.fontSans }}>
          {label}{' '}
          <span style={{ color: TOKEN.textDim, fontFamily: TOKEN.fontMono, fontSize: 10 }}>
            ({sub})
          </span>
        </span>
      </div>
    ))}
  </div>
);
/* ─── Main Component ─────────────────────────────────────────────── */
const Graph = () => {
  const [dataArray, setDataArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const { instrumentId } = useParams();
  /* Derived values */
  const latestReading = dataArray.length > 0 ? dataArray[dataArray.length - 1] : null;
  const currentValue = Number(latestReading?.value) || 0;
  const maxValue = Number(latestReading?.maxValue) || 1;
  const minValue = Number(latestReading?.minValue) || 0;
  const instrumentUnit = latestReading?.unit || '';
  const warningValue = maxValue * 0.7;
  const criticalValue = maxValue * 0.9;
  const utilization = ((currentValue / maxValue) * 100).toFixed(1);
  const yDomainMax = maxValue * 1.1;
  let status = 'SAFE';
  if (currentValue >= criticalValue) status = 'CRITICAL';
  else if (currentValue >= warningValue) status = 'WARNING';
  let trendLabel = 'Stable';
  let trendDir = 'STABLE';
  if (dataArray.length >= 2) {
    const prev = Number(dataArray[dataArray.length - 2].value);
    if (currentValue > prev) { trendLabel = 'Rising'; trendDir = 'RISING'; }
    else if (currentValue < prev) { trendLabel = 'Falling'; trendDir = 'FALLING'; }
  }
  /* Fetch */
  useEffect(() => {
    fetchInstrument();
  }, [instrumentId]);
  const fetchInstrument = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/${instrumentId}`
      );
      setDataArray(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  /* Loading */
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: TOKEN.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: TOKEN.fontSans,
        }}
      >
        <Search />
        <div style={{ color: TOKEN.textMuted, fontSize: 14, letterSpacing: '0.08em' }}>
          FETCHING INSTRUMENT DATA…
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${TOKEN.border}`,
            borderTop: `3px solid ${TOKEN.accent}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  /* Global styles injected once */
  const globalStyles = `
    * { box-sizing: border-box; }
    body { background: ${TOKEN.bg}; margin: 0; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${TOKEN.bg}; }
    ::-webkit-scrollbar-thumb { background: ${TOKEN.border}; border-radius: 99px; }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  `;
  return (
    <>
      <style>{globalStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          background: TOKEN.bg,
          fontFamily: TOKEN.fontSans,
          color: TOKEN.textPrimary,
          padding: '0 0 48px',
        }}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            background: TOKEN.surface,
            borderBottom: `1px solid ${TOKEN.border}`,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: TOKEN.accentGlow,
                border: `1px solid ${TOKEN.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ⛏
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TOKEN.textPrimary,
              }}
            >
              Strata Monitoring
            </span>
          </div>
          <span
            style={{
              color: TOKEN.textDim,
              fontSize: 13,
              marginLeft: 4,
            }}
          >
            /
          </span>
          <span
            style={{
              color: TOKEN.accent,
              fontSize: 12,
              fontFamily: TOKEN.fontMono,
              letterSpacing: '0.04em',
            }}
          >
            {instrumentId}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <Search />
          </div>
        </div>
        {/* ── No data ── */}
        {dataArray.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 120,
              color: TOKEN.textMuted,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: TOKEN.textPrimary }}>
              No Data Available
            </p>
            <p style={{ fontSize: 13, color: TOKEN.textMuted }}>
              No readings found for instrument{' '}
              <span style={{ color: TOKEN.accent, fontFamily: TOKEN.fontMono }}>{instrumentId}</span>
            </p>
          </div>
        )}
        {/* ── Dashboard content ── */}
        {dataArray.length > 0 && latestReading && (
          <div style={{ padding: '24px 24px 0' }}>
            {/* ── KPI Cards ── */}
            <div style={{ marginBottom: 24 }}>
              <SectionHeader
                title="Live Instrument Status"
                badge={`${dataArray.length} readings`}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <KpiCard
                  label="Instrument ID"
                  value={instrumentId}
                  accent={TOKEN.accent}
                  mono
                />
                <KpiCard
                  label="Current Reading"
                  value={`${currentValue.toFixed(3)} ${instrumentUnit}`}
                  sub={`Min: ${minValue} ${instrumentUnit} · Max: ${maxValue} ${instrumentUnit}`}
                  accent={TOKEN.textPrimary}
                  mono
                />
                <KpiCard
                  label="Status"
                  value={status}
                  sub={
                    status === 'SAFE'
                      ? 'Within safe operating range'
                      : status === 'WARNING'
                      ? 'Approaching critical threshold'
                      : 'Exceeds critical limit — alert!'
                  }
                  accent={statusColor(status)}
                  glow={statusGlow(status)}
                />
                <KpiCard
                  label="Trend"
                  value={`${trendIcon(trendDir)} ${trendLabel}`}
                  sub="Compared to previous reading"
                  accent={
                    trendDir === 'RISING'
                      ? TOKEN.warning
                      : trendDir === 'FALLING'
                      ? TOKEN.safe
                      : TOKEN.textMuted
                  }
                />
                <div
                  style={{
                    background: TOKEN.surface,
                    border: `1px solid ${TOKEN.border}`,
                    borderRadius: 10,
                    padding: '18px 22px',
                    flex: '1 1 160px',
                    minWidth: 140,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: TOKEN.textDim,
                      fontWeight: 600,
                    }}
                  >
                    Utilization
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: statusColor(status),
                      fontFamily: TOKEN.fontMono,
                      lineHeight: 1.2,
                    }}
                  >
                    {utilization}%
                  </span>
                  <UtilBar pct={parseFloat(utilization)} status={status} />
                  <span style={{ fontSize: 11, color: TOKEN.textMuted, marginTop: 4 }}>
                    of max capacity
                  </span>
                </div>
              </div>
            </div>
            {/* ── Chart ── */}
            <div
              style={{
                background: TOKEN.surface,
                border: `1px solid ${TOKEN.border}`,
                borderRadius: 12,
                padding: '24px 20px 16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                marginBottom: 16,
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <SectionHeader title="Time-Series Reading" />
                <ZoneLegend />
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart
                  data={dataArray}
                  margin={{ top: 10, right: 40, left: 10, bottom: 30 }}
                >
                  <defs>
                    <filter id="lineShadow" x="-5%" y="-20%" width="110%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={TOKEN.accent} floodOpacity="0.5" />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={TOKEN.border}
                    opacity={0.5}
                  />
                  {/* Monitoring zones */}
                  <ReferenceArea
                    y1={0}
                    y2={warningValue}
                    fill={TOKEN.safe}
                    fillOpacity={0.06}
                  />
                  <ReferenceArea
                    y1={warningValue}
                    y2={criticalValue}
                    fill={TOKEN.warning}
                    fillOpacity={0.08}
                  />
                  <ReferenceArea
                    y1={criticalValue}
                    y2={yDomainMax}
                    fill={TOKEN.critical}
                    fillOpacity={0.08}
                  />
                  {/* Threshold lines */}
                  <ReferenceLine
                    y={warningValue}
                    stroke={TOKEN.warning}
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    label={{
                      value: `Warning (${(warningValue).toFixed(2)} ${instrumentUnit})`,
                      position: 'insideTopRight',
                      fill: TOKEN.warning,
                      fontSize: 10,
                      fontFamily: TOKEN.fontMono,
                    }}
                  />
                  <ReferenceLine
                    y={criticalValue}
                    stroke={TOKEN.critical}
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    label={{
                      value: `Critical (${(criticalValue).toFixed(2)} ${instrumentUnit})`,
                      position: 'insideTopRight',
                      fill: TOKEN.critical,
                      fontSize: 10,
                      fontFamily: TOKEN.fontMono,
                    }}
                  />
                  <ReferenceLine
                    y={maxValue}
                    stroke={TOKEN.critical}
                    strokeWidth={2}
                    label={{
                      value: `Max Limit (${maxValue} ${instrumentUnit})`,
                      position: 'insideTopRight',
                      fill: TOKEN.critical,
                      fontSize: 10,
                      fontFamily: TOKEN.fontMono,
                    }}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={fmtTimestamp}
                    tick={{ fill: TOKEN.textMuted, fontSize: 10, fontFamily: TOKEN.fontMono }}
                    axisLine={{ stroke: TOKEN.border }}
                    tickLine={{ stroke: TOKEN.border }}
                    angle={-25}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    domain={[0, yDomainMax]}
                    tick={{ fill: TOKEN.textMuted, fontSize: 10, fontFamily: TOKEN.fontMono }}
                    axisLine={{ stroke: TOKEN.border }}
                    tickLine={{ stroke: TOKEN.border }}
                    width={70}
                    label={{
                      value: instrumentUnit,
                      angle: -90,
                      position: 'insideLeft',
                      fill: TOKEN.textMuted,
                      fontSize: 11,
                      fontFamily: TOKEN.fontMono,
                    }}
                  />
                  <Tooltip content={<MiningTooltip unit={instrumentUnit} />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: TOKEN.textMuted,
                      fontFamily: TOKEN.fontSans,
                      paddingTop: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={TOKEN.accent}
                    strokeWidth={4}
                    dot={{ r: 3, fill: TOKEN.accent, stroke: TOKEN.bg, strokeWidth: 2 }}
                    activeDot={{
                      r: 8,
                      fill: TOKEN.accent,
                      stroke: TOKEN.bg,
                      strokeWidth: 3,
                      filter: 'url(#lineShadow)',
                    }}
                    name="Instrument Reading"
                    filter="url(#lineShadow)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* ── Footer ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 8,
              }}
            >
              <span style={{ fontSize: 10, color: TOKEN.textDim, fontFamily: TOKEN.fontMono, letterSpacing: '0.06em' }}>
                IIT (BHU) VARANASI — DEPT. OF MINING ENGINEERING — STRATA MONITORING SYSTEM
              </span>
              <span style={{ fontSize: 10, color: TOKEN.textDim, fontFamily: TOKEN.fontMono }}>
                Last updated: {latestReading ? fmtTimestamp(latestReading.timestamp) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default Graph;