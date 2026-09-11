import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { 
  X, ChevronLeft, ChevronRight, Download, 
  Flame, Sparkles, Clock, Music, Headphones, User, BarChart3, Compass
} from 'lucide-react';
import { AudioRadarChart } from './AudioRadarChart';
import { ListeningClockChart } from './ListeningClockChart';

// Paleta de Mesh Gradients vibrantes oficiais estilo Spotify Wrapped para cada slide
const SLIDE_THEMES = [
  // Slide 0: Emerald & Electric Teal (Intro / Tempo / Descobertas)
  'radial-gradient(ellipse at 30% 20%, rgba(29, 185, 84, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(14, 165, 233, 0.35) 0%, transparent 60%), #0c0d14',
  // Slide 1: Hot Pink & Indigo (Top Faixas)
  'radial-gradient(ellipse at 35% 20%, rgba(236, 72, 153, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.4) 0%, transparent 60%), #0c0d14',
  // Slide 2: Electric Cyan & Deep Violet (Top Artistas)
  'radial-gradient(ellipse at 50% 20%, rgba(6, 182, 212, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(168, 85, 247, 0.45) 0%, transparent 60%), #0c0d14',
  // Slide 3: Amber Gold & Electric Purple (Top Gêneros - Skiley & Rigtch style)
  'radial-gradient(ellipse at 30% 20%, rgba(245, 158, 11, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 60%), #0c0d14',
  // Slide 4: Electric Purple & Sunset Coral (Audio Profiling)
  'radial-gradient(ellipse at 30% 20%, rgba(168, 85, 247, 0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(249, 115, 22, 0.4) 0%, transparent 60%), #0c0d14',
  // Slide 5: Midnight Blue & Emerald (Relógio 24h)
  'radial-gradient(ellipse at 50% 15%, rgba(59, 130, 246, 0.55) 0%, transparent 60%), radial-gradient(ellipse at 80% 85%, rgba(29, 185, 84, 0.4) 0%, transparent 60%), #0a0b10',
  // Slide 6: Burning Crimson & Flame Gold (Faixas Obsessão)
  'radial-gradient(ellipse at 50% 20%, rgba(239, 68, 68, 0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.4) 0%, transparent 60%), #0c0d12',
  // Slide 7: Multi-Mesh Wrapped Masterpiece (Resumo Final)
  'radial-gradient(ellipse at 20% 20%, rgba(29, 185, 84, 0.55) 0%, transparent 50%), radial-gradient(ellipse at 80% 25%, rgba(168, 85, 247, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 50%), #0b0c12',
];

export function WrappedStories({ data, monthName, year, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const summaryCardRef = useRef(null);
  const timerRef = useRef(null);

  const totalSlides = 8;
  const topTrack = data.top_tracks?.[0];
  const topArtist = data.top_artists?.[0];
  const topGenres = data.top_genres || [];
  const discovery = data.discovery_stats || { discovery_rate_pct: 45, comfort_replay_pct: 55 };

  // Confete no último slide
  useEffect(() => {
    if (currentSlide === totalSlides - 1) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1db954', '#ffffff', '#ffed4a', '#a855f7', '#ec4899'],
      });
    }
  }, [currentSlide]);

  // Temporizador dos Stories (6,5 segundos por slide)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    }, 6500);

    return () => clearTimeout(timerRef.current);
  }, [currentSlide, isPaused]);

  // Navegação por teclado (Setas, Espaço e Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentSlide < totalSlides - 1) setCurrentSlide((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, onClose]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentSlide < totalSlides - 1) setCurrentSlide((prev) => prev + 1);
  };

  // Exportar card de resumo como PNG 9:16 (ignora botão de download na imagem gerada)
  const exportSummaryCard = async () => {
    if (!summaryCardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(summaryCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        filter: (node) => !node?.classList?.contains('export-ignore'),
      });
      const link = document.createElement('a');
      link.download = `Spotify-Wrapped-${monthName}-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao exportar card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentTheme = SLIDE_THEMES[currentSlide] || SLIDE_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden">
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all cursor-pointer backdrop-blur-md shadow-lg"
        title="Fechar Stories (Esc)"
      >
        <X size={20} />
      </button>

      {/* Navegação Desktop Lateral */}
      <button
        onClick={handlePrev}
        disabled={currentSlide === 0}
        className="hidden md:flex absolute left-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3.5 rounded-full disabled:opacity-20 transition-all cursor-pointer backdrop-blur-md shadow-xl"
        title="Slide Anterior (Seta Esquerda)"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        onClick={handleNext}
        disabled={currentSlide === totalSlides - 1}
        className="hidden md:flex absolute right-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3.5 rounded-full disabled:opacity-20 transition-all cursor-pointer backdrop-blur-md shadow-xl"
        title="Próximo Slide (Seta Direita / Espaço)"
      >
        <ChevronRight size={28} />
      </button>

      {/* CONTAINER DO CARD STORIES (Respeita o espaço da tela, altura adaptativa que nunca transborda) */}
      <div
        ref={summaryCardRef}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="relative w-full max-w-[420px] sm:max-w-[450px] md:max-w-[470px] h-[min(84vh,690px)] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/20"
        style={{
          background: currentTheme,
          transition: 'background 0.8s ease-in-out',
        }}
      >
        {/* Áreas Invisíveis de Clique para Avançar / Voltar no Mobile */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-0 w-1/3 h-full z-20 cursor-pointer"
          title="Slide anterior"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-0 w-2/3 h-full z-20 cursor-pointer"
          title="Próximo slide"
        />

        {/* 1. HEADER SUPERIOR COM SAFE PADDING (Livre de qualquer corte das bordas arredondadas) */}
        <div className="pt-4 px-6 pb-2 shrink-0 z-30 flex flex-col gap-2.5">
          {/* Barra de Progresso dos Stories */}
          <div className="flex gap-1.5 w-full">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all ${
                    idx < currentSlide ? 'w-full' : idx === currentSlide ? 'w-full duration-[6500ms] story-progress-bar' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Linha do Título e Mês */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#1db954]">
                WRAPPED MENSAL
              </span>
            </div>
            <span className="text-xs font-bold text-white/90 capitalize bg-black/50 px-3 py-0.5 rounded-full border border-white/15 shadow-xs">
              {monthName} {year}
            </span>
          </div>
        </div>

        {/* 2. ÁREA CENTRAL DO SLIDE (Paddings seguros e encaixe harmônico) */}
        <div className="flex-1 px-5 sm:px-6 py-2 z-10 w-full overflow-hidden flex flex-col justify-center items-center">
          
          {/* SLIDE 0: Boas-vindas, Tempo Total e Descobertas */}
          {currentSlide === 0 && (
            <div className="flex flex-col items-center justify-between h-full text-center w-full animate-story-fade py-1">
              <div className="flex flex-col items-center text-center w-full my-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#1db954]/20 border border-[#1db954]/30 flex items-center justify-center mb-3 text-[#1db954] shadow-[0_0_35px_rgba(29,185,84,0.35)]">
                  <Headphones size={32} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-1">
                  Seu Ritmo do Mês
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight max-w-xs mx-auto">
                  Você viveu cada segundo em som.
                </h1>
              </div>

              <div className="bg-black/55 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 w-full shadow-xl my-auto">
                <span className="text-4xl sm:text-5xl font-black text-[#1db954] block font-mono tracking-tight leading-none">
                  {data.stats.total_minutes}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 mt-1.5 block">
                  Minutos Ouvidos ({data.stats.total_hours} horas)
                </span>
                <div className="h-px bg-white/15 my-3" />
                <div className="flex justify-around text-center">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-white block font-mono leading-tight">{data.stats.total_plays}</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Plays</span>
                  </div>
                  <div className="w-px bg-white/15" />
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-white block font-mono leading-tight">{data.stats.unique_tracks}</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Músicas</span>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs px-1">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Compass size={14} className="text-purple-400" /> Descobertas:
                  </span>
                  <span className="font-bold text-purple-300 font-mono">
                    {discovery.discovery_rate_pct}% novas faixas
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Top Faixas do Mês */}
          {currentSlide === 1 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1">
              {/* Destaque Faixa #1 */}
              <div className="flex flex-col items-center text-center w-full">
                <span className="text-xs font-black uppercase tracking-widest text-pink-400 mb-1.5">
                  SUA TRILHA SONORA
                </span>

                <div className="relative my-1">
                  <img
                    src={topTrack?.album_image_url}
                    alt={topTrack?.track_name}
                    crossOrigin="anonymous"
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl shadow-2xl object-cover ring-2 ring-pink-500/40"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white font-black text-[11px] px-3 py-0.5 rounded-full shadow-lg">
                    #1 no Mês
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white mt-2 px-2 line-clamp-1">
                  {topTrack?.track_name}
                </h3>
                <p className="text-xs font-semibold text-zinc-300 line-clamp-1 mb-1">
                  {topTrack?.artist_name}
                </p>
                <span className="text-[11px] font-bold text-pink-300 bg-pink-500/20 border border-pink-500/30 px-3 py-0.5 rounded-full">
                  {topTrack?.play_count} reproduções • {topTrack?.minutes_listened} min
                </span>
              </div>

              {/* Top 2 ao 5 com mini thumbnails e encaixe perfeito sem cortes */}
              <div className="w-full bg-black/55 backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 border border-white/15 flex flex-col gap-1.5 mt-2 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1 mb-0.5">
                  Outras no seu Top 5
                </span>
                {data.top_tracks.slice(1, 5).map((track) => (
                  <div 
                    key={track.track_id} 
                    className="flex items-center justify-between p-1 rounded-xl hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <span className="text-xs font-mono font-black text-zinc-400 w-4 text-center shrink-0">
                        #{track.rank}
                      </span>
                      {track.album_image_url && (
                        <img
                          src={track.album_image_url}
                          alt={track.track_name}
                          crossOrigin="anonymous"
                          className="w-7 h-7 rounded-lg object-cover shadow-xs shrink-0 border border-white/10"
                        />
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-white truncate leading-snug">{track.track_name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{track.artist_name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-pink-300 bg-pink-500/15 border border-pink-500/25 px-2 py-0.5 rounded-lg shrink-0">
                      {track.play_count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 2: Top Artistas e Estreantes */}
          {currentSlide === 2 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1 text-center">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-1 block">
                  QUEM DOMINOU SEUS FONES
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mb-2">
                  Seu Artista Principal
                </h2>

                <div className="flex flex-col items-center mt-1">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.4)] bg-zinc-800 flex items-center justify-center">
                    {topArtist?.image_url ? (
                      <img
                        src={topArtist.image_url}
                        alt={topArtist.artist_name}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={44} className="text-zinc-400" />
                    )}
                  </div>

                  <div className="mt-2.5 bg-cyan-400 text-black text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-lg">
                    {topArtist?.play_count} reproduções
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
                    {topArtist?.artist_name}
                  </h3>
                </div>
              </div>

              {/* Top 2 ao 5 Artistas */}
              <div className="w-full bg-black/55 backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 border border-white/15 flex flex-col gap-1.5 mt-2 shadow-xl">
                <div className="flex items-center justify-between px-1 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Outros Artistas em Destaque
                  </span>
                  {data.newcomer_artists?.length > 0 && (
                    <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      <Sparkles size={10} /> Novas descobertas
                    </span>
                  )}
                </div>
                {data.top_artists.slice(1, 5).map((art) => (
                  <div 
                    key={art.artist_id}
                    className="flex items-center justify-between p-1 rounded-xl hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <span className="text-xs font-mono font-black text-zinc-400 w-4 text-center shrink-0">
                        #{art.rank}
                      </span>
                      {art.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.artist_name}
                          crossOrigin="anonymous"
                          className="w-7 h-7 rounded-full object-cover shadow-xs shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <User size={12} className="text-cyan-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-white truncate">{art.artist_name}</p>
                        {art.is_newcomer && (
                          <span className="text-[9px] text-cyan-300 font-semibold">Estreante no mês</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 px-2 py-0.5 rounded-lg shrink-0">
                      {art.play_count} plays
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 3: Top Gêneros Musicais (Skiley & Rigtch) */}
          {currentSlide === 3 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1 text-center">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1 block">
                  SUA IDENTIDADE MUSICAL
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mb-1.5">
                  Top Gêneros do Mês
                </h2>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                  Os estilos sonoros que definiram sua trilha em <strong className="text-amber-300 capitalize">{monthName}</strong>:
                </p>
              </div>

              <div className="w-full bg-black/55 backdrop-blur-xl rounded-2xl p-3.5 sm:p-4 border border-white/15 flex flex-col gap-3 my-auto shadow-xl">
                {topGenres.slice(0, 4).map((g) => (
                  <div key={g.name} className="flex flex-col gap-1 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white text-sm">{g.name}</span>
                      <span className="font-mono text-amber-300 font-bold">{g.percentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${g.percentage}%`, backgroundColor: g.color || '#f59e0b' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full flex flex-wrap gap-1.5 justify-center pt-1">
                {topGenres.slice(0, 6).map((g) => (
                  <span
                    key={g.name}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white/5 border-white/15 text-zinc-200 shadow-xs"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 4: Audio Profiling & Vibe Sonora */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1 text-center">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-purple-400 mb-1 block">
                  AUDIO PROFILING
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mb-1">
                  {data.audio_profile?.vibe?.title || 'Sua Vibe Sonora'}
                </h2>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed line-clamp-2">
                  {data.audio_profile?.vibe?.description}
                </p>
              </div>

              <div className="flex justify-center w-full my-auto py-1">
                <AudioRadarChart profile={data.audio_profile} size={210} />
              </div>

              {/* Destaques de métricas sonoras */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-zinc-400 block font-bold">Dançabilidade</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {Math.round((data.audio_profile?.danceability || 0.6) * 100)}%
                  </span>
                </div>
                <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-zinc-400 block font-bold">Energia</span>
                  <span className="text-sm font-black text-purple-400 font-mono">
                    {Math.round((data.audio_profile?.energy || 0.5) * 100)}%
                  </span>
                </div>
                <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-zinc-400 block font-bold">Positividade</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {Math.round((data.audio_profile?.valence || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: Relógio de Escuta */}
          {currentSlide === 5 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1 text-center">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1 block">
                  SEUS HÁBITOS
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mb-1">
                  Seu Relógio Sonoro
                </h2>
                <p className="text-xs text-zinc-300">
                  Pico no turno da <strong className="text-blue-400 capitalize">{data.listening_clock.peak_period}</strong>, aos <strong className="text-[#1db954]">{data.listening_clock.peak_day}s</strong>.
                </p>
              </div>

              <div className="w-full my-auto py-1">
                <ListeningClockChart clock={data.listening_clock} compact={true} />
              </div>
            </div>
          )}

          {/* SLIDE 6: Faixas Obsessão (Burst Listening) */}
          {currentSlide === 6 && (
            <div className="flex flex-col items-center justify-between h-full w-full animate-story-fade py-1 text-center">
              <div>
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-1.5 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
                  <Flame size={26} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-red-400 mb-0.5 block">
                  MODO REPETIÇÃO EXTREMA
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mb-1">
                  Faixas Obsessão
                </h2>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  Músicas que você colocou em loop contínuo:
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 my-auto">
                {data.obsession_tracks && data.obsession_tracks.length > 0 ? (
                  data.obsession_tracks.slice(0, 2).map((obs) => (
                    <div
                      key={obs.track_id}
                      className="flex items-center gap-3 bg-black/55 backdrop-blur-xl p-3 rounded-xl border border-white/15 shadow-md"
                    >
                      <img
                        src={obs.album_image_url || topTrack?.album_image_url}
                        alt={obs.track_name}
                        crossOrigin="anonymous"
                        className="w-11 h-11 rounded-lg object-cover shadow-sm shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate leading-snug">{obs.track_name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{obs.artist_name}</p>
                      </div>
                      <div className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                        {obs.burst_count}x loop
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/10">
                    <Music className="mx-auto text-zinc-400 mb-1" size={24} />
                    <p className="text-xs text-zinc-300 font-semibold">
                      Audição equilibrada e variada!
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl flex items-center justify-between w-full">
                <span className="text-xs text-zinc-300 font-medium">Taxa de Repetição Mensal:</span>
                <span className="text-sm font-black text-yellow-400 font-mono">{data.stats.repetition_rate_pct}%</span>
              </div>
            </div>
          )}

          {/* SLIDE 7: Card Resumo Final */}
          {currentSlide === 7 && (
            <div className="flex flex-col justify-between h-full w-full py-1 animate-story-fade">
              <div className="text-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1db954]">
                  SEU MÊS EM REVISTA
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white capitalize">
                  {monthName} {year}
                </h2>
              </div>

              {/* Destaque Faixa #1 */}
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl p-2.5 sm:p-3 rounded-xl border border-white/15 my-1">
                <img
                  src={topTrack?.album_image_url}
                  alt={topTrack?.track_name}
                  crossOrigin="anonymous"
                  className="w-12 h-12 rounded-lg object-cover border border-white/15 shadow-lg shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#1db954] font-black">Música #1</span>
                  <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug">{topTrack?.track_name}</p>
                  <p className="text-[11px] text-zinc-300 truncate">{topTrack?.artist_name}</p>
                </div>
              </div>

              {/* Grade de 4 Destaques */}
              <div className="grid grid-cols-2 gap-2 text-left my-1">
                <div className="bg-black/60 backdrop-blur-xl p-2.5 rounded-xl border border-white/15">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">Tempo Total</span>
                  <span className="text-base font-black text-white font-mono">{data.stats.total_minutes} min</span>
                  <span className="text-[10px] text-zinc-400 block">{data.stats.total_hours} horas</span>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-2.5 rounded-xl border border-white/15">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">Artista #1</span>
                  <span className="text-xs sm:text-sm font-black text-[#1db954] truncate block">{topArtist?.artist_name}</span>
                  <span className="text-[10px] text-zinc-400 block">{topArtist?.play_count} plays</span>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-2.5 rounded-xl border border-white/15">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">Top Gênero</span>
                  <span className="text-xs font-black text-amber-300 truncate block">
                    {topGenres[0]?.name || 'Variado'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">{topGenres[0]?.percentage || 0}% de presença</span>
                </div>
                <div className="bg-black/60 backdrop-blur-xl p-2.5 rounded-xl border border-white/15">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">Vibe</span>
                  <span className="text-xs font-black text-emerald-300 truncate block">
                    {data.audio_profile?.vibe?.title || 'Eclético'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">Dançabilidade: {Math.round(data.audio_profile.danceability * 100)}%</span>
                </div>
              </div>

              {/* Botão de Download PNG */}
              <div className="pt-2 z-30 export-ignore">
                <button
                  onClick={exportSummaryCard}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-black py-2.5 px-4 rounded-xl shadow-xl shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 text-xs cursor-pointer"
                >
                  {isExporting ? <Clock className="animate-spin" size={16} /> : <Download size={16} />}
                  <span>{isExporting ? 'Renderizando...' : 'Baixar Card PNG (Stories 9:16)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. RODAPÉ FIXO COM SAFE PADDING (Livre de qualquer corte das bordas arredondadas) */}
        <div className="pb-4 pt-2.5 px-6 border-t border-white/10 shrink-0 z-30 flex justify-between items-center text-[11px] text-zinc-400 font-mono">
          <span>SPOTIFY WRAPPED MENSAL</span>
          <span className="text-white font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
}
