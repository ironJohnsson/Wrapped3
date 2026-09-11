import React from 'react';
import { LogIn, Sparkles, Radio, Music, Clock, Flame, Download, PlayCircle, Compass, BarChart3 } from 'lucide-react';

export function LoginView({ onConnect, onTryDemo }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center text-center animate-fade-in">
      {/* Badge Superior */}
      <div className="inline-flex items-center gap-2 bg-[#1db954]/10 border border-[#1db954]/30 px-4 py-1.5 rounded-full text-[#1db954] text-xs font-black uppercase tracking-widest mb-6">
        <Sparkles size={14} className="animate-spin text-[#1db954]" />
        <span>Sua Retrospectiva Musical Todo Mês</span>
      </div>

      {/* Título Principal */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6 max-w-4xl font-display">
        Spotify Wrapped, <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1db954] via-emerald-300 to-teal-300">
          mas todo mês.
        </span>
      </h1>

      {/* Subtítulo */}
      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed font-normal">
        Acompanhe o mês em andamento em tempo real, descubra seus Top Artistas, Músicas, Gêneros, taxa de Novas Descobertas e gere stories 9:16 para compartilhar.
      </p>

      {/* Botões de Ação Principais */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
        <button
          onClick={onConnect}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#1db954] hover:bg-[#1ed760] text-black font-black text-base py-4 px-8 rounded-full shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <LogIn size={20} />
          <span>Conectar Conta Spotify</span>
        </button>

        <button
          onClick={onTryDemo}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#0d0e17] hover:bg-zinc-800 text-white border border-white/15 hover:border-[#1db954]/50 font-bold text-base py-4 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <PlayCircle size={20} className="text-[#1db954]" />
          <span>Explorar Modo Demonstração</span>
        </button>
      </div>

      {/* Grid com Destaques das Métricas Ocultas (Inspirado no Skiley & Rigtch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full text-left">
        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-emerald-500/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-[#1db954]/10 text-[#1db954] w-fit rounded-xl mb-3">
            <Radio size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Mês Atual Ao Vivo</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Não espere dezembro. Acompanhe a evolução do seu mês em tempo real conforme você ouve músicas.
          </p>
        </div>

        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-purple-500/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-purple-500/10 text-purple-400 w-fit rounded-xl mb-3">
            <BarChart3 size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Top Gêneros Musicais</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Distribuição detalhada de estilos e porcentagem de preferência em cada período (estilo Skiley).
          </p>
        </div>

        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-sky-500/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-sky-500/10 text-sky-400 w-fit rounded-xl mb-3">
            <Compass size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Descobertas vs. Conforto</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Descubra se o seu mês foi voltado para explorar artistas novos ou curtir suas faixas de conforto (estilo Rigtch.fm).
          </p>
        </div>

        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-yellow-500/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 w-fit rounded-xl mb-3">
            <Clock size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Relógio 24h de Escuta</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Descubra em qual turno (madrugada, manhã, tarde ou noite) e em quais dias da semana você mais escuta música.
          </p>
        </div>

        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-red-500/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-red-500/10 text-red-400 w-fit rounded-xl mb-3">
            <Flame size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Faixas Obsessão (Burst)</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Identifica faixas que tiveram surtos repentinos de reprodução em loop contínuo durante o mês.
          </p>
        </div>

        <div className="bg-[#0d0e17] border border-white/[0.08] hover:border-[#1db954]/40 p-5 rounded-2xl transition-all shadow-lg">
          <div className="p-3 bg-[#1db954]/10 text-[#1db954] w-fit rounded-xl mb-3">
            <Download size={22} />
          </div>
          <h3 className="text-sm font-black text-white mb-1.5">Exportação para Stories 9:16</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Download direto em PNG em alta definição no formato Stories para compartilhar no Instagram e WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
