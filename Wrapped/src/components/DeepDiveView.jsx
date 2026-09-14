import React, { useState } from 'react';
import { 
  Music, Disc3, Clock, Sparkles, Flame, 
  Award, Activity, Zap, ExternalLink, Compass, 
  TrendingUp, BarChart3, ChevronRight, Play, Repeat
} from 'lucide-react';
import { AudioRadarChart } from './AudioRadarChart';
import { ListeningClockChart } from './ListeningClockChart';

export function DeepDiveView({ 
  data, 
  onOpenStories, 
  monthName, 
  year, 
  onEnrichTopTracks, 
  isEnriching,
  onOpenGDPR,
  onGoToActiveMonth,
  onReconstructMonth,
  isReconstructing
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = data.stats || {};
  const discovery = data.discovery_stats || {
    discovery_rate_pct: 45,
    comfort_replay_pct: 55,
    daily_average_minutes: Math.round((stats.total_minutes || 0) / 30),
  };
  const topTracks = data.top_tracks || [];
  const topArtists = data.top_artists || [];
  const topGenres = data.top_genres || [];
  const audioProfile = data.audio_profile || {};
  const obsessionTracks = data.obsession_tracks || [];
  const listeningClock = data.listening_clock || {};

  // Estado Vazio para Mês sem dados registrados
  if (data.is_empty || !stats.total_plays || stats.total_plays === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto self-center my-6 py-12 px-6 sm:px-10 bg-[#0d0e17] border border-white/[0.08] rounded-3xl shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
          <Clock size={30} className="text-[#1db954]" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/25 px-3 py-1 rounded-full mb-3">
          Histórico Não Consolidado
        </span>

        <h2 className="text-2xl sm:text-4xl font-black text-white capitalize mb-3">
          {monthName} {year}
        </h2>

        <p className="text-zinc-400 text-xs sm:text-sm max-w-lg leading-relaxed mb-8">
          Você pode reconstruir este mês instantaneamente usando seu histórico oficial do Spotify (sem precisar de arquivos), ou importar seu arquivo GDPR se possuir um backup.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
          {onReconstructMonth && (
            <button
              onClick={() => onReconstructMonth(year, data.month)}
              disabled={isReconstructing}
              className="flex items-center justify-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap size={16} className={isReconstructing ? 'animate-spin' : ''} />
              <span>{isReconstructing ? 'Reconstruindo via Spotify...' : 'Reconstruir Mês via Spotify'}</span>
            </button>
          )}

          {onOpenGDPR && (
            <button
              onClick={onOpenGDPR}
              className="bg-white/10 hover:bg-white/15 text-zinc-200 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm border border-white/10 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Importar GDPR Manual
            </button>
          )}

          {onGoToActiveMonth && (
            <button
              onClick={onGoToActiveMonth}
              className="text-zinc-400 hover:text-white text-xs sm:text-sm font-semibold px-4 py-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Voltar ao Mês Ativo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-20 animate-fade-in text-zinc-100">
      
      {/* 1. HERO SPOTLIGHT DO MÊS (Skiley & Rigtch.fm Style) */}
      <div className="relative rounded-3xl bg-[#0d0e17] border border-white/[0.08] p-6 sm:p-8 lg:p-9 shadow-2xl">
        {/* Glows de fundo isolados em subcontainer com overflow-hidden para não cortar os botões do card pai */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#1db954]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/30 px-3.5 py-1.5 rounded-full">
                {data.is_current_month ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse shrink-0" />
                    Mês em Andamento • Ao Vivo
                  </>
                ) : (
                  'Snapshot Mensal Consolidado'
                )}
              </span>

              <span className="text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {stats.total_minutes} min ouvidos
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl 2xl:text-6xl font-black text-white capitalize tracking-tight font-display">
              {monthName} <span className="text-zinc-500 font-light">{year}</span>
            </h1>

            <p className="text-zinc-400 text-xs sm:text-sm mt-2.5 max-w-3xl leading-relaxed">
              Sua retrospectiva mensal completa no Spotify: artistas mais tocados, músicas em loop, distribuição de gêneros e perfil sonoro.
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onEnrichTopTracks && (
              <button
                onClick={onEnrichTopTracks}
                disabled={isEnriching}
                className="flex items-center gap-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/10 hover:border-white/20 font-bold py-3.5 px-4.5 rounded-2xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                title="Sincroniza com as Top Músicas das últimas 4 semanas"
              >
                <Zap size={15} className={isEnriching ? 'animate-spin text-[#1db954]' : 'text-[#1db954]'} />
                <span>{isEnriching ? 'Atualizando...' : 'Atualizar Dados'}</span>
              </button>
            )}

            <button
              onClick={onOpenStories}
              className="flex items-center gap-3 bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles size={17} className="fill-black/30 shrink-0" />
              <span className="shrink-0">Abrir Modo Stories</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRID DE 5 MÉTRICAS PRINCIPAIS ADAPTATIVAS (Linha Compacta Skiley Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5">
        {/* Tempo Total */}
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-white/20 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tempo Total</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#1db954] shrink-0">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
              {stats.total_minutes} <span className="text-xs font-normal text-zinc-400">min</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              <strong>{stats.total_hours}h</strong> • ~{discovery.daily_average_minutes} min/dia
            </p>
          </div>
        </div>

        {/* Reproduções e Faixas */}
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-white/20 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Reproduções</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Music size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
              {stats.total_plays}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              <strong>{stats.unique_tracks}</strong> faixas distintas
            </p>
          </div>
        </div>

        {/* Novas Descobertas vs Conforto */}
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-white/20 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Descobertas</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Compass size={14} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl sm:text-2xl font-black text-purple-300 font-mono leading-none">
                {discovery.discovery_rate_pct}%
              </p>
              <span className="text-[10px] text-zinc-400">
                {discovery.comfort_replay_pct}% conforto
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${discovery.discovery_rate_pct}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Vibe Sonora Predominante */}
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-white/20 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Vibe Sonora</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity size={14} />
            </div>
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold text-emerald-300 leading-none truncate">
              {audioProfile?.vibe?.title || 'Eclético'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {Math.round((audioProfile.danceability || 0.6) * 100)}% dançabilidade
            </p>
          </div>
        </div>

        {/* Loop & Foco (5º Card) */}
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-white/20 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Loop & Foco</span>
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
              <Repeat size={14} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl sm:text-2xl font-black text-pink-300 font-mono leading-none">
                {stats.repetition_rate_pct}%
              </p>
              <span className="text-[10px] text-zinc-400">
                {stats.repetition_rate_pct > 40 ? 'Repetição alta' : 'Diversificado'}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-pink-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${stats.repetition_rate_pct}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE NAVEGAÇÃO POR ABAS (Estilo Skiley Filter Bar) */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3.5 pt-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Sparkles },
          { id: 'tracks', label: `Top Músicas (${topTracks.length})`, icon: Award },
          { id: 'artists', label: `Top Artistas (${topArtists.length})`, icon: TrendingUp },
          { id: 'genres', label: `Top Gêneros (${topGenres.length})`, icon: BarChart3 },
          { id: 'audio', label: 'Audio Profiling', icon: Activity },
          { id: 'clock', label: 'Relógio 24h', icon: Clock },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-md font-black'
                  : 'text-zinc-400 hover:text-white bg-[#0d0e17] hover:bg-zinc-800/60 border border-white/[0.06]'
              }`}
            >
              <TabIcon size={14} className={`shrink-0 ${activeTab === tab.id ? 'text-black' : 'text-zinc-400'}`} />
              <span className="shrink-0">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. ABA 1: VISÃO GERAL (Dashboard Unificado Inspirado em Skiley & Rigtch) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
          
          {/* COLUNA 1: Top Músicas do Mês */}
          <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#1db954] shrink-0">
                    <Award size={17} />
                  </div>
                  <h2 className="text-base font-bold text-white">Top Músicas do Mês</h2>
                </div>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className="text-xs text-[#1db954] hover:text-emerald-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/20 transition-all cursor-pointer shrink-0"
                >
                  <span>Ver todas</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {topTracks.slice(0, 5).map((track) => (
                  <div
                    key={track.track_id}
                    className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="font-mono text-xs font-black text-zinc-500 w-6 group-hover:text-[#1db954] transition-colors shrink-0">
                        {String(track.rank).padStart(2, '0')}
                      </span>
                      <img
                        src={track.album_image_url}
                        alt={track.track_name}
                        className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 group-hover:scale-105 transition-transform border border-white/10"
                      />
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-bold text-white truncate leading-snug group-hover:text-[#1db954] transition-colors pb-0.5">
                          {track.track_name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate leading-snug pb-0.5">{track.artist_name}</p>
                        
                        {/* Barra de popularidade relativa (Skiley) */}
                        <div className="w-full max-w-[140px] bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-[#1db954] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${track.relative_popularity_pct || 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3 pl-2 pr-1">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-black text-[#1db954]">
                          {track.play_count}x
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {track.minutes_listened} min
                        </span>
                      </div>
                      {track.spotify_url && (
                        <a
                          href={track.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Ouvir no Spotify"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA 2: Top Artistas do Mês */}
          <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <TrendingUp size={17} />
                  </div>
                  <h2 className="text-base font-bold text-white">Top Artistas do Mês</h2>
                </div>
                <button
                  onClick={() => setActiveTab('artists')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer shrink-0"
                >
                  <span>Ver todas</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {topArtists.slice(0, 5).map((art) => (
                  <div
                    key={art.artist_id}
                    className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="font-mono text-xs font-black text-zinc-500 w-6 group-hover:text-purple-400 transition-colors shrink-0">
                        {String(art.rank).padStart(2, '0')}
                      </span>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        {art.image_url ? (
                          <img src={art.image_url} alt={art.artist_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                            {art.artist_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate leading-snug group-hover:text-purple-300 transition-colors pb-0.5">
                            {art.artist_name}
                          </p>
                          {art.is_newcomer && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                              Novo
                            </span>
                          )}
                        </div>
                        
                        {/* Barra de popularidade relativa */}
                        <div className="w-full max-w-[140px] bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${art.relative_popularity_pct || 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3 pl-2 pr-1">
                      <span className="text-xs font-mono font-bold text-purple-400">
                        {art.play_count} plays
                      </span>
                      {art.spotify_url && (
                        <a
                          href={art.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Ver no Spotify"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA 3: Top Gêneros & Padrões (Em telas lg ocupa 2 colunas; em 2xl vira a 3ª coluna ao lado) */}
          <div className="lg:col-span-2 2xl:col-span-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-1 gap-6">
              
              {/* Top Gêneros Musicais (Estilo Skiley) */}
              <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                      <BarChart3 size={17} />
                    </div>
                    <h2 className="text-base font-bold text-white">Top Gêneros Musicais</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('genres')}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all cursor-pointer"
                  >
                    <span>Explorar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {topGenres.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {topGenres.slice(0, 5).map((genre) => (
                      <div key={genre.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs pr-1">
                          <span className="font-bold text-zinc-200 truncate">{genre.name}</span>
                          <span className="font-mono text-zinc-400 font-semibold shrink-0 ml-2">{genre.percentage}%</span>
                        </div>
                        <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${genre.percentage}%`,
                              backgroundColor: genre.color || '#1db954',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Nenhum gênero catalogado para o período.</p>
                )}
              </div>

              {/* Faixas Obsessão (Burst Listening) & Ritmo de Horário */}
              <div className="flex flex-col gap-6">
                <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl">
                  <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-white/[0.06]">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                      <Flame size={17} />
                    </div>
                    <h2 className="text-base font-bold text-white">Faixas Obsessão (Burst Listening)</h2>
                  </div>

                  {obsessionTracks.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {obsessionTracks.slice(0, 2).map((obs) => (
                        <div
                          key={obs.track_id}
                          className="flex items-center justify-between bg-red-950/20 border border-red-500/20 p-3.5 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={obs.album_image_url}
                              alt={obs.track_name}
                              className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0 border border-red-500/20"
                            />
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs font-bold text-white truncate">{obs.track_name}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{obs.artist_name}</p>
                            </div>
                          </div>
                          <span className="bg-red-500/20 text-red-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-500/30 whitespace-nowrap shrink-0 ml-2">
                            {obs.burst_count}x em loop
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Nenhuma obsessão extrema detectada neste mês. Seus hábitos tiveram alta diversidade.
                    </p>
                  )}
                </div>

                {/* Resumo do Relógio de Escuta */}
                <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#1db954] shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                        Hábito de Audição
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed truncate sm:whitespace-normal">
                        Pico no turno da <strong className="text-[#1db954] capitalize">{listeningClock.peak_period}</strong>, com concentração às <strong className="text-[#1db954]">{listeningClock.peak_day}s</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('clock')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 shrink-0 transition-all cursor-pointer"
                  >
                    Ver Gráficos
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 5. ABA 2: TOP MÚSICAS COMPLETO (Tabela Skiley) */}
      {activeTab === 'tracks' && (
        <div className="bg-[#0d0e17] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-xl font-black text-white">Top Músicas do Mês</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Todas as faixas que definiram seu mês ordenadas por número de reproduções.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              {topTracks.length} faixas listadas
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {topTracks.map((track) => (
              <div 
                key={track.track_id} 
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/[0.06] hover:border-[#1db954]/30 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="font-mono text-base font-black text-zinc-500 w-7 group-hover:text-[#1db954] transition-colors">
                    {String(track.rank).padStart(2, '0')}
                  </span>
                  <img
                    src={track.album_image_url}
                    alt={track.track_name}
                    className="w-13 h-13 rounded-xl object-cover shadow-md shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                      {track.track_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {track.artist_name} • <span className="text-zinc-500">{track.album_name}</span>
                    </p>
                    <div className="w-full max-w-xs bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-[#1db954] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${track.relative_popularity_pct || 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <span className="text-sm font-mono font-black text-[#1db954] block">
                      {track.play_count} plays
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {track.minutes_listened} min
                    </span>
                  </div>
                  {track.spotify_url && (
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
                      title="Abrir no Spotify"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ABA 3: TOP ARTISTAS COMPLETO (Grid Skiley) */}
      {activeTab === 'artists' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#0d0e17] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-xl font-black text-white">Top Artistas do Mês</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Os artistas que mais dominaram seus fones de ouvido no período.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                {topArtists.length} artistas no ranking
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {topArtists.map((art) => (
                <div
                  key={art.artist_id}
                  className="group bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.06] hover:border-purple-500/30 p-4 rounded-2xl transition-all flex items-center gap-4"
                >
                  <span className="font-mono text-base font-black text-zinc-500 w-6 group-hover:text-purple-400 transition-colors">
                    {String(art.rank).padStart(2, '0')}
                  </span>
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    {art.image_url ? (
                      <img src={art.image_url} alt={art.artist_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">
                        {art.artist_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {art.artist_name}
                    </p>
                    <p className="text-xs font-mono text-[#1db954] mt-0.5">
                      {art.play_count} plays
                    </p>
                    {art.is_newcomer && (
                      <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                        Estreante no Mês
                      </span>
                    )}
                  </div>
                  {art.spotify_url && (
                    <a
                      href={art.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
                      title="Ver no Spotify"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. ABA 4: TOP GÊNEROS (Skiley & Rigtch.fm Breakdown) */}
      {activeTab === 'genres' && (
        <div className="bg-[#0d0e17] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl font-black text-white">Detalhamento por Gênero Musical</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Como observado no Rigtch.fm, a distribuição de gêneros é a métrica mensal mais reveladora: ela mostra se o seu mês foi voltado para conforto ou exploração musical inédita.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              {topGenres.map((genre) => (
                <div key={genre.name} className="bg-zinc-900/60 p-4 rounded-xl border border-white/[0.05]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: genre.color }} />
                      <span className="text-sm font-bold text-white">{genre.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">{genre.percentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${genre.percentage}%`,
                        backgroundColor: genre.color,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">{genre.count} execuções ponderadas</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900/40 border border-white/[0.05] p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Nuvem de Estilos do Mês</h3>
                <div className="flex flex-wrap gap-2">
                  {topGenres.map((g) => (
                    <span
                      key={g.name}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all"
                      style={{
                        backgroundColor: `${g.color}15`,
                        borderColor: `${g.color}35`,
                        color: g.color,
                      }}
                    >
                      {g.name} • {g.percentage}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gênero predominante: <strong className="text-white">{topGenres[0]?.name || 'Variado'}</strong> com{' '}
                  <strong className="text-[#1db954]">{topGenres[0]?.percentage || 0}%</strong> da preferência.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. ABA 5: AUDIO PROFILING (Radar SVG Adaptativo) */}
      {activeTab === 'audio' && (
        <div className="bg-[#0d0e17] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col xl:flex-row items-center justify-around gap-8 xl:gap-12">
            
            {/* Lado Esquerdo: Radar SVG */}
            <div className="flex flex-col items-center shrink-0">
              <div className="text-center max-w-sm mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/30 px-3 py-1 rounded-full">
                  Radar Sonoro
                </span>
                <h2 className="text-2xl font-black text-white mt-2 font-display">
                  {audioProfile?.vibe?.title || 'Audio Profiling'}
                </h2>
              </div>
              <AudioRadarChart profile={audioProfile} size={290} />
            </div>

            {/* Lado Direito: Descrição e 6 Métricas */}
            <div className="flex flex-col gap-5 flex-1 max-w-2xl w-full">
              <div className="bg-zinc-900/40 border border-white/[0.06] p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Diagnóstico Sonoro do Mês
                </h3>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {audioProfile?.vibe?.description || 'Seu perfil sonoro reflete os ritmos e arranjos mais presentes nas suas faixas deste período.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Dançabilidade</span>
                  <p className="text-base font-black text-[#1db954] mt-1 font-mono">
                    {Math.round((audioProfile.danceability || 0) * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Energia</span>
                  <p className="text-base font-black text-purple-400 mt-1 font-mono">
                    {Math.round((audioProfile.energy || 0) * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Positividade</span>
                  <p className="text-base font-black text-yellow-400 mt-1 font-mono">
                    {Math.round((audioProfile.valence || 0) * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Acústica</span>
                  <p className="text-base font-black text-sky-400 mt-1 font-mono">
                    {Math.round((audioProfile.acousticness || 0) * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Instrumentalidade</span>
                  <p className="text-base font-black text-emerald-400 mt-1 font-mono">
                    {Math.round((audioProfile.instrumentalness || 0) * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-900/60 border border-white/[0.05] p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Tempo Médio</span>
                  <p className="text-base font-black text-zinc-200 mt-1 font-mono">
                    {audioProfile.tempo || 120} BPM
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. ABA 6: RELÓGIO DE ESCUTA (24h & Semana) */}
      {activeTab === 'clock' && (
        <div className="bg-[#0d0e17] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="max-w-xl mb-6">
            <h2 className="text-xl font-black text-white">Relógio de Escuta & Padrões Diários</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Mapeamento de quando sua rotina mais se conecta à música: 4 turnos diários e concentração por dia da semana.
            </p>
          </div>
          <ListeningClockChart clock={listeningClock} />
        </div>
      )}

    </div>
  );
}
