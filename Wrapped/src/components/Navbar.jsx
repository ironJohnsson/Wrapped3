import React from 'react';
import { RefreshCw, UploadCloud, LogOut, LogIn, User, Sparkles } from 'lucide-react';
import { ArtistAvatar } from './ArtistAvatar';

export function Navbar({ user, onSync, isSyncing, onOpenGDPR, onLogin, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#06060c]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 transition-all">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1db954] to-emerald-400 flex items-center justify-center shadow-lg shadow-[#1db954]/25">
            <Sparkles size={19} className="text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-white uppercase font-display">
                Monthly Wrapped
              </span>
              <span className="text-[10px] font-bold text-[#1db954] bg-[#1db954]/15 px-2 py-0.5 rounded-full border border-[#1db954]/25">
                Spotify Stats
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Estatísticas & retrospectiva mensal contínua
            </p>
          </div>
        </div>

        {/* Ações e Usuário */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <>
              {/* Botão Sincronizar */}
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-[#0d0e17] hover:bg-zinc-800 text-zinc-200 border border-white/10 hover:border-white/20 font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Sincronizar músicas recentes com o Spotify"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#1db954]' : 'text-[#1db954]'} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>

              {/* Botão Importar GDPR */}
              <button
                onClick={onOpenGDPR}
                className="flex items-center gap-2 bg-[#0d0e17] hover:bg-zinc-800 text-zinc-300 border border-white/10 hover:border-white/20 font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                title="Importar histórico completo estendido (GDPR)"
              >
                <UploadCloud size={14} className="text-purple-400" />
                <span className="hidden md:inline">Importar GDPR</span>
              </button>

              {/* Perfil */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <ArtistAvatar
                  src={user.avatar_url}
                  name={user.display_name}
                  size="w-8 h-8"
                  textSize="text-xs"
                  borderColor="border-white/20"
                />
                <span className="text-xs font-bold text-white hidden lg:inline max-w-[120px] truncate">
                  {user.display_name}
                </span>
                <button
                  onClick={onLogout}
                  className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Desconectar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-black px-5 py-2 rounded-full text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Conectar Spotify</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
