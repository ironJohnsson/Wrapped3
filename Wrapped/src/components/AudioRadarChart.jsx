import React from 'react';

export function AudioRadarChart({ profile, size = 260 }) {
  if (!profile) return null;

  const metrics = [
    { key: 'danceability', label: 'Dançabilidade', val: profile.danceability ?? 0.5 },
    { key: 'energy', label: 'Energia', val: profile.energy ?? 0.5 },
    { key: 'valence', label: 'Positividade', val: profile.valence ?? 0.5 },
    { key: 'acousticness', label: 'Acústica', val: profile.acousticness ?? 0.2 },
    { key: 'instrumentalness', label: 'Instrumental', val: profile.instrumentalness ?? 0.1 },
    { key: 'speechiness', label: 'Vocais', val: (profile.speechiness ?? 0.05) * 2 },
  ];

  const center = size / 2;
  const radius = size * 0.36;
  const total = metrics.length;

  // Gerar coordenadas dos polígonos de fundo (níveis 0.25, 0.5, 0.75, 1.0)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = radius * Math.min(Math.max(value, 0.05), 1.0);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Pontos do polígono do usuário
  const dataPoints = metrics.map((m, i) => getCoordinates(i, m.val));
  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1db954" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#1ed760" stopOpacity="0.25" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1db954" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Círculos concêntricos de referência */}
          {levels.map((lvl) => {
            const points = metrics
              .map((_, i) => getCoordinates(i, lvl))
              .map((p) => `${p.x},${p.y}`)
              .join(' ');
            return (
              <polygon
                key={lvl}
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
                strokeDasharray={lvl === 1 ? '0' : '2,2'}
              />
            );
          })}

          {/* Eixos radiais */}
          {metrics.map((_, i) => {
            const p = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono de Dados do Usuário */}
          <polygon
            points={polygonPath}
            fill="url(#radarGradient)"
            stroke="#1db954"
            strokeWidth="2.5"
            filter="url(#radarGlow)"
          />

          {/* Marcadores dos Vértices */}
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke="#1db954"
              strokeWidth="2"
            />
          ))}

          {/* Rótulos nas extremidades */}
          {metrics.map((m, i) => {
            const p = getCoordinates(i, 1.25);
            return (
              <text
                key={m.key}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-zinc-300 text-[11px] font-semibold tracking-wide"
              >
                {m.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Exibição Numérica e Vibe */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 max-w-sm">
        {metrics.map((m) => (
          <div key={m.key} className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">{m.label}</span>
            <span className="text-sm font-black text-emerald-400">
              {Math.round(m.val * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

