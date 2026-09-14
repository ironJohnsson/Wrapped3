import React, { useState, useEffect } from 'react';
import { Music, ExternalLink, Radio, Volume2, Disc, Play } from 'lucide-react';
import { TrackCover } from './TrackCover';

export function NowPlayingWidget({ currentlyPlaying }) {
  const [localProgress, setLocalProgress] = useState(0);

  const isPlaying = currentlyPlaying?.is_playing && currentlyPlaying?.item;
  const item = currentlyPlaying?.item;

  useEffect(() => {
    if (isPlaying && item) {
      setLocalProgress(currentlyPlaying.progress_ms || 0);
    }
  }, [currentlyPlaying, isPlaying, item]);

  // Atualização suave do progresso em segundos
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setLocalProgress((prev) => {
        if (item?.duration_ms && prev + 1000 >= item.duration_ms) {
          return item.duration_ms;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, item?.duration_ms]);

  const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPct = item?.duration_ms
    ? Math.min(100, Math.max(0, (localProgress / item.duration_ms) * 100))
    : 0;

  if (!isPlaying) {
    return (
      <div className="w-full bg-[#0d0e17] border border-white/[0.08] hover:border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
            <Volume2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Spotify em Espera
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Nenhuma música reproduzindo no momento. Dê play no seu Spotify para ver aqui ao vivo!
            </p>
          </div>
        </div>

        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-[#1db954] hover:text-[#1ed760] bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/30 px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer"
        >
          <Play size={13} fill="currentColor" />
          <span className="hidden sm:inline">Abrir Spotify</span>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0d0e17] border border-[#1db954]/30 hover:border-[#1db954]/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all shadow-xl shadow-[#1db954]/5 relative group">
      {/* Luz ambiente no fundo isolada para não cortar elementos filhos */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#1db954]/10 rounded-full blur-2xl" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        
        {/* Lado Esquerdo: Capa e Informações da Faixa */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Capa com animação de vinil e indicador de reprodução */}
          <div className="relative shrink-0">
            <TrackCover
              src={item.album_image_url}
              title={item.track_name}
              size="w-14 h-14"
              iconSize={22}
              className="rounded-2xl border-white/15 group-hover:scale-105 transition-transform"
            />
            {/* Equalizador animado no canto */}
            <div className="absolute -bottom-1 -right-1 bg-[#1db954] text-black p-1 rounded-full shadow-md flex items-center justify-center">
              <span className="flex items-end gap-[2px] h-3 px-0.5">
                <span className="w-[2.5px] h-full bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-[2.5px] h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-[2.5px] h-full bg-black rounded-full animate-bounce" />
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1db954] bg-[#1db954]/15 px-2.5 py-0.5 rounded-full border border-[#1db954]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-ping" />
                Tocando Agora
              </span>
              <span className="text-[11px] text-zinc-400 truncate hidden md:inline">
                {item.album_name}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white truncate group-hover:text-[#1db954] transition-colors">
              {item.track_name}
            </h3>
            <p className="text-xs text-zinc-300 font-medium truncate">
              {item.artist_name}
            </p>
          </div>
        </div>

        {/* Lado Direito: Barra de Progresso e Link para o Spotify */}
        <div className="flex flex-col sm:items-end w-full sm:w-64 shrink-0 gap-1.5">
          <div className="flex items-center justify-between w-full text-[11px] font-mono text-zinc-400">
            <span>{formatTime(localProgress)}</span>
            <div className="flex items-center gap-2">
              <a
                href={item.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#1db954] hover:text-[#1ed760] font-bold transition-colors"
                title="Abrir música no Spotify"
              >
                <span>Spotify</span>
                <ExternalLink size={12} />
              </a>
              <span>/</span>
              <span>{formatTime(item.duration_ms)}</span>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1db954] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#1db954]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

