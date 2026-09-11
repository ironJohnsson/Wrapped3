import React from 'react';
import { Moon, Sunrise, Sun, Sunset, Calendar } from 'lucide-react';

export function ListeningClockChart({ clock, compact = false }) {
  if (!clock || !clock.periods) return null;

  const totalPeriodPlays = 
    clock.periods.madrugada + 
    clock.periods.manha + 
    clock.periods.tarde + 
    clock.periods.noite;

  const periodsConfig = [
    {
      key: 'madrugada',
      label: 'Madrugada',
      range: '00h - 06h',
      count: clock.periods.madrugada,
      icon: Moon,
      color: 'text-indigo-400',
      barColor: 'bg-indigo-500',
    },
    {
      key: 'manha',
      label: 'Manhã',
      range: '06h - 12h',
      count: clock.periods.manha,
      icon: Sunrise,
      color: 'text-amber-400',
      barColor: 'bg-amber-500',
    },
    {
      key: 'tarde',
      label: 'Tarde',
      range: '12h - 18h',
      count: clock.periods.tarde,
      icon: Sun,
      color: 'text-orange-400',
      barColor: 'bg-orange-500',
    },
    {
      key: 'noite',
      label: 'Noite',
      range: '18h - 24h',
      count: clock.periods.noite,
      icon: Sunset,
      color: 'text-purple-400',
      barColor: 'bg-purple-500',
    },
  ];

  const maxDayCount = Math.max(...clock.days_of_week.map((d) => d.count), 1);

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'xl:flex-row gap-6'} w-full items-stretch`}>
      {/* 4 Turnos do Dia */}
      <div className={`grid grid-cols-2 gap-2.5 sm:gap-3.5 ${compact ? 'w-full' : 'flex-1'}`}>
        {periodsConfig.map((p) => {
          const Icon = p.icon;
          const pct = totalPeriodPlays > 0 ? Math.round((p.count / totalPeriodPlays) * 100) : 0;
          const isPeak = clock.peak_period === p.key;

          return (
            <div
              key={p.key}
              className={`rounded-2xl sm:rounded-3xl border transition-all ${
                compact ? 'p-3' : 'p-4 sm:p-5'
              } ${
                isPeak
                  ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0`}>
                    <Icon size={compact ? 12 : 14} className={p.color} />
                  </div>
                  <span className={`${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} font-bold text-white`}>{p.label}</span>
                </div>
                {isPeak && (
                  <span className="text-[8px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                    Pico
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">{p.range}</p>
              <div className="flex items-end justify-between">
                <span className={`${compact ? 'text-base' : 'text-lg sm:text-xl'} font-black font-mono text-white`}>
                  {p.count} <span className="text-[9px] text-zinc-400 font-normal">plays</span>
                </span>
                <span className="text-[11px] font-bold text-zinc-300">{pct}%</span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${p.barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dias da Semana (Histograma) */}
      <div className={`bg-black/40 border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col justify-between ${compact ? 'p-3.5 w-full' : 'p-5 sm:p-6 flex-1'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Calendar size={13} />
            </div>
            <h4 className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-wider text-zinc-300`}>
              Dias da Semana
            </h4>
          </div>
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-emerald-400 font-bold`}>
            Pico: {clock.peak_day}
          </span>
        </div>

        <div className={`flex items-end justify-between gap-1.5 ${compact ? 'h-14 pt-2' : 'h-24 pt-4'}`}>
          {clock.days_of_week.map((d) => {
            const heightPct = Math.max(Math.round((d.count / maxDayCount) * 100), 12);
            const isPeak = d.day === clock.peak_day;

            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[8px] text-zinc-400 font-mono">{d.count}</span>
                <div className="w-full bg-white/10 rounded-t-md h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isPeak ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-zinc-600 hover:bg-zinc-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={`text-[9px] font-semibold ${isPeak ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                  {d.day.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
