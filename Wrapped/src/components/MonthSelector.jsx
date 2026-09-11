import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SHORT_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function MonthSelector({ months = [], selectedMonth, onSelectMonth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedMonth?.year || new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Mapa de plays por chave "ano-mes"
  const playsMap = new Map();
  months.forEach((m) => {
    playsMap.set(`${m.year}-${m.month}`, m.total_plays || 0);
  });

  const handlePrevMonth = () => {
    let prevM = selectedMonth.month - 1;
    let prevY = selectedMonth.year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    onSelectMonth({ year: prevY, month: prevM });
  };

  const handleNextMonth = () => {
    let nextM = selectedMonth.month + 1;
    let nextY = selectedMonth.year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    // Não avançar além do mês corrente no futuro
    if (nextY > currentYear || (nextY === currentYear && nextM > currentMonth)) {
      return;
    }
    onSelectMonth({ year: nextY, month: nextM });
  };

  const isCurrentMonthActive = selectedMonth.year === currentYear && selectedMonth.month === currentMonth;
  const currentSelectedName = MONTH_NAMES[selectedMonth.month - 1] || `Mês ${selectedMonth.month}`;

  return (
    <div className="relative w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-[#0d0e17] border border-white/[0.08] p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl shadow-lg">
      
      {/* Lado Esquerdo: Controles Rápidos de Mês Anterior / Próximo e Seletor */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl border border-white/10 shrink-0 transition-all cursor-pointer"
          title="Mês Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Botão Principal do Dropdown / Calendário de Meses */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#1db954]/50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Calendar size={16} className="text-[#1db954] shrink-0" />
            <span className="font-extrabold text-sm capitalize">
              {currentSelectedName} {selectedMonth.year}
            </span>
          </div>

          {isCurrentMonthActive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#1db954] bg-[#1db954]/15 px-2.5 py-0.5 rounded-full border border-[#1db954]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-ping" />
              Ao Vivo
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full">
              {playsMap.get(`${selectedMonth.year}-${selectedMonth.month}`) || 0} plays
            </span>
          )}

          <ChevronsUpDown size={14} className="text-zinc-400 ml-1 shrink-0" />
        </button>

        <button
          onClick={handleNextMonth}
          disabled={isCurrentMonthActive}
          className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl border border-white/10 disabled:opacity-25 shrink-0 transition-all cursor-pointer"
          title="Próximo Mês"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Lado Direito: Atalhos Rápidos dos Meses Mais Recentes */}
      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pr-1 shrink-0 hidden md:inline">
          Histórico:
        </span>
        {months.map((m) => {
          const isSelected = selectedMonth.year === m.year && selectedMonth.month === m.month;
          const isLive = m.year === currentYear && m.month === currentMonth;
          const mName = SHORT_MONTHS[m.month - 1];

          return (
            <button
              key={`${m.year}-${m.month}`}
              onClick={() => onSelectMonth({ year: m.year, month: m.month })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                isSelected
                  ? 'bg-[#1db954] text-black border-[#1ed760] font-black shadow-md shadow-emerald-500/20'
                  : 'bg-black/40 hover:bg-white/5 text-zinc-300 border-white/10'
              }`}
            >
              <span>{mName} {m.year}</span>
              {isLive && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] inline-block ml-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* MODAL / POPOVER DE SELEÇÃO COMPLETA DE TODOS OS MESES & ANOS */}
      {isOpen && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-96 bg-[#0e0f1a] border border-white/15 rounded-3xl p-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Calendar size={14} className="text-[#1db954]" /> Selecionar Qualquer Mês
              </h4>

              {/* Seletor de Ano */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <button
                    key={y}
                    onClick={() => setPickerYear(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pickerYear === y
                        ? 'bg-[#1db954] text-black font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid dos 12 Meses */}
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((name, index) => {
                const monthNum = index + 1;
                const isSelected = selectedMonth.year === pickerYear && selectedMonth.month === monthNum;
                const isFuture = pickerYear === currentYear && monthNum > currentMonth;
                const plays = playsMap.get(`${pickerYear}-${monthNum}`);
                const hasData = Boolean(plays && plays > 0);

                return (
                  <button
                    key={monthNum}
                    disabled={isFuture}
                    onClick={() => {
                      onSelectMonth({ year: pickerYear, month: monthNum });
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'bg-[#1db954] text-black border-[#1ed760] font-black shadow-lg shadow-emerald-500/25'
                        : isFuture
                        ? 'opacity-25 bg-white/[0.02] border-white/5 cursor-not-allowed text-zinc-600'
                        : hasData
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-white hover:border-emerald-500 hover:bg-emerald-950/40'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="truncate w-full text-center">{SHORT_MONTHS[index]}</span>
                    {hasData ? (
                      <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-black font-bold' : 'text-emerald-400'}`}>
                        {plays} plays
                      </span>
                    ) : !isFuture ? (
                      <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        0 plays
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>* Meses com borda verde possuem dados reais</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-[#1db954] font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
