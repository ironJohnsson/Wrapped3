import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { MonthSelector } from './components/MonthSelector';
import { DeepDiveView } from './components/DeepDiveView';
import { WrappedStories } from './components/WrappedStories';
import { GDPRModal } from './components/GDPRModal';
import { LoginView } from './components/LoginView';
import { NowPlayingWidget } from './components/NowPlayingWidget';
import { getDemoWrappedData } from './data/demoData';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SPOTIFY_CLIENT_ID = 'fd7bfa7378a444759ee1aca654078506';

export default function App() {
  const [user, setUser] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [wrappedData, setWrappedData] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const [isGDPROpen, setIsGDPROpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Polling de música tocando agora (tempo real a cada 6s)
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentlyPlaying = async () => {
      try {
        const res = await axios.get('/api/player/currently-playing', {
          headers: user ? { 'x-user-id': user.id } : {},
        });
        if (isMounted) {
          setCurrentlyPlaying(res.data);
        }
      } catch (err) {
        // Silencioso em caso de erro temporário
      }
    };

    fetchCurrentlyPlaying();
    const interval = setInterval(fetchCurrentlyPlaying, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Ativação instantânea do Modo Demonstração (100% offline e sem dependências)
  const activateDemoMode = useCallback((year = 2026, month = 9) => {
    setIsDemoMode(true);
    setUser(null);
    const demo = getDemoWrappedData(year, month);
    setWrappedData(demo);
    setSelectedMonth({ year, month });
    const now = new Date();
    setMonths([
      { year: now.getFullYear(), month: now.getMonth() + 1, total_plays: 542, is_current: true },
      { year: now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth(), total_plays: 430, is_current: false },
    ]);
    showToast('Modo Demonstração ativado! Explore à vontade.', 'info');
  }, []);

  const loadMonths = async (userId) => {
    try {
      const res = await axios.get('/api/wrapped/months', {
        headers: userId ? { 'x-user-id': userId } : {},
      });
      const data = res.data || [];
      setMonths(data);
      if (data.length > 0) {
        setSelectedMonth({ year: data[0].year, month: data[0].month });
      }
    } catch (err) {
      console.warn('Não foi possível carregar meses via API, usando lista padrão:', err.message);
    }
  };

  const loadUser = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { 'x-user-id': userId },
      });
      setUser(res.data);
      setIsDemoMode(false);
      await loadMonths(userId);
    } catch (err) {
      console.warn('Sessão expirada ou usuário não encontrado:', err.message);
      localStorage.removeItem('wrapped_user_id');
      setUser(null);
      setIsDemoMode(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Verificar retornos de OAuth (tanto callback frontend quanto redirect backend)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authUserId = urlParams.get('auth_user_id');
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        showToast(`Erro na autorização: ${error}`, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (authUserId) {
        localStorage.setItem('wrapped_user_id', authUserId);
        window.history.replaceState({}, document.title, window.location.pathname);
        await loadUser(authUserId);
      } else if (code) {
        setIsLoading(true);
        try {
          const redirectUri = `${window.location.origin}/callback`;
          const response = await axios.post('/api/auth/spotify/exchange', { code, redirectUri });
          if (response.data?.user) {
            localStorage.setItem('wrapped_user_id', response.data.user.id);
            setUser(response.data.user);
            setIsDemoMode(false);
            showToast('Conectado ao Spotify com sucesso!', 'success');
            await loadMonths(response.data.user.id);
          }
        } catch (err) {
          console.error('Erro na troca de código Spotify:', err);
          showToast('Falha ao autenticar com o Spotify. Verifique se o servidor está ativo.', 'error');
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
        }
      } else {
        const storedUserId = localStorage.getItem('wrapped_user_id');
        if (storedUserId) {
          await loadUser(storedUserId);
        }
      }
    };

    handleAuthCallback();
  }, [loadUser]);

  // 2. Carregar dados analíticos quando o mês selecionado mudar
  useEffect(() => {
    if (!selectedMonth) return;

    if (isDemoMode) {
      setWrappedData(getDemoWrappedData(selectedMonth.year, selectedMonth.month));
      return;
    }

    if (!user) return;

    const fetchMonthData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/wrapped/${selectedMonth.year}/${selectedMonth.month}`, {
          headers: { 'x-user-id': user.id },
        });
        setWrappedData(res.data);
      } catch (err) {
        console.error('Erro ao buscar dados do Wrapped do mês:', err);
        showToast('Não foi possível carregar os dados deste mês.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthData();
  }, [selectedMonth, user, isDemoMode]);

  // 3. Ações
  const handleLogin = () => {
    const redirectUri = `${window.location.origin}/callback`;
    const scopes = [
      'user-read-recently-played',
      'user-read-playback-state',
      'user-top-read',
      'user-read-email',
      'user-read-private',
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;

    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('wrapped_user_id');
    setUser(null);
    setIsDemoMode(false);
    setWrappedData(null);
    showToast('Desconectado com sucesso.', 'info');
  };

  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrichTopTracks = async () => {
    if (!user) return;
    setIsEnriching(true);
    try {
      const res = await axios.post('/api/sync/enrich-top-tracks', {}, {
        headers: { 'x-user-id': user.id },
      });
      showToast(res.data.message || 'Histórico enriquecido com sucesso!', 'success');
      await loadMonths(user.id);
      const refreshed = await axios.get(`/api/wrapped/${selectedMonth.year}/${selectedMonth.month}`, {
        headers: { 'x-user-id': user.id },
      });
      setWrappedData(refreshed.data);
    } catch (err) {
      console.error('Erro ao enriquecer histórico:', err);
      showToast(err.response?.data?.error || 'Erro ao enriquecer com Top Tracks.', 'error');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const res = await axios.post('/api/sync/trigger', {}, {
        headers: { 'x-user-id': user.id },
      });
      showToast(res.data.message || 'Sincronização concluída!', 'success');
      await loadMonths(user.id);
      const refreshed = await axios.get(`/api/wrapped/${selectedMonth.year}/${selectedMonth.month}`, {
        headers: { 'x-user-id': user.id },
      });
      setWrappedData(refreshed.data);
    } catch (err) {
      console.error('Erro na sincronização:', err);
      showToast(err.response?.data?.error || 'Erro ao sincronizar músicas com o Spotify.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const [isReconstructing, setIsReconstructing] = useState(false);

  const handleReconstructMonth = async (targetYear, targetMonth) => {
    if (!user) return;
    setIsReconstructing(true);
    try {
      const res = await axios.post('/api/sync/reconstruct-month', {
        year: targetYear,
        month: targetMonth,
      }, {
        headers: { 'x-user-id': user.id },
      });
      showToast(res.data.message || 'Mês reconstruído com sucesso via Spotify!', 'success');
      await loadMonths(user.id);
      const refreshed = await axios.get(`/api/wrapped/${targetYear}/${targetMonth}`, {
        headers: { 'x-user-id': user.id },
      });
      setWrappedData(refreshed.data);
    } catch (err) {
      console.error('Erro ao reconstruir mês:', err);
      showToast(err.response?.data?.error || 'Erro ao reconstruir mês com o Spotify.', 'error');
    } finally {
      setIsReconstructing(false);
    }
  };

  const monthName = MONTH_NAMES[selectedMonth.month - 1] || `Mês ${selectedMonth.month}`;

  return (
    <div className="min-h-screen w-full bg-[#06060c] text-white flex flex-col selection:bg-[#1db954] selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-300'
              : 'bg-zinc-900/95 border-white/20 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar Superior */}
      <Navbar
        user={user}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenGDPR={() => setIsGDPROpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal Adaptativo */}
      <main className="flex-1 w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 flex flex-col items-center">
        {!user && !isDemoMode ? (
          <LoginView onConnect={handleLogin} onTryDemo={() => activateDemoMode(2026, 9)} />
        ) : (
          <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Seletor Horizontal de Meses e Calendário */}
            <MonthSelector
              months={months}
              selectedMonth={selectedMonth}
              onSelectMonth={(m) => setSelectedMonth({ year: m.year, month: m.month })}
            />

            {/* Widget Tocando Agora em Tempo Real */}
            <NowPlayingWidget currentlyPlaying={currentlyPlaying} />

            {/* Aviso caso esteja em modo demonstração */}
            {isDemoMode && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-xs">
                <span className="text-emerald-300 font-medium">
                  ⚡ <strong>Modo Demonstração Ativo:</strong> Você está navegando por métricas e gráficos de exemplo.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogin}
                    className="bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Conectar Minha Conta
                  </button>
                  <button
                    onClick={() => {
                      setIsDemoMode(false);
                      setWrappedData(null);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-zinc-300 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <Loader2 size={36} className="text-emerald-400 animate-spin" />
                <p className="text-xs font-semibold text-zinc-400">Calculando métricas do mês...</p>
              </div>
            ) : wrappedData ? (
              <DeepDiveView
                data={wrappedData}
                onOpenStories={() => setIsStoriesOpen(true)}
                monthName={monthName}
                year={selectedMonth.year}
                onEnrichTopTracks={handleEnrichTopTracks}
                isEnriching={isEnriching}
                onOpenGDPR={() => setIsGDPROpen(true)}
                onReconstructMonth={handleReconstructMonth}
                isReconstructing={isReconstructing}
                onGoToActiveMonth={() => {
                  const now = new Date();
                  setSelectedMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
                }}
              />
            ) : null}
          </div>
        )}
      </main>

      {/* Modal de Stories do Spotify Wrapped */}
      {isStoriesOpen && wrappedData && (
        <WrappedStories
          data={wrappedData}
          monthName={monthName}
          year={selectedMonth.year}
          onClose={() => setIsStoriesOpen(false)}
        />
      )}

      {/* Modal de Upload GDPR */}
      <GDPRModal
        isOpen={isGDPROpen}
        onClose={() => setIsGDPROpen(false)}
        userId={user?.id}
        onImportSuccess={async () => {
          showToast('Dados GDPR importados! Atualizando meses...', 'success');
          if (user?.id) {
            await loadMonths(user.id);
          }
        }}
      />
    </div>
  );
}
