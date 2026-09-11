import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { SpotifyService } from './spotifyService.js';
import { IngestionWorker } from './ingestionWorker.js';
import { AnalyticsEngine } from './analyticsEngine.js';
import { getDemoWrappedData } from './demoData.js';
import db from './db.js';

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const BACKEND_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';
const FRONTEND_REDIRECT_URI = process.env.SPOTIFY_FRONTEND_REDIRECT_URI || 'http://127.0.0.1:5173/callback';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Helper para obter usuário da requisição
function getSessionUser(req) {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId) || null;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. URL de autorização do Spotify
app.get('/api/auth/spotify/login', (req, res) => {
  const target = req.query.mode === 'frontend' ? FRONTEND_REDIRECT_URI : BACKEND_REDIRECT_URI;
  const state = `st_${Date.now()}`;
  const authUrl = SpotifyService.getAuthorizationUrl(target, state);
  res.json({ authUrl, redirectUri: target });
});

// 3. Callback Direto (ex: http://127.0.0.1:5173/callback ou http://127.0.0.1:8000/callback)
app.get('/callback', async (req, res, next) => {
  const { code, error } = req.query;

  // Se não houver code nem error, deixa o próximo middleware (Vite SPA) tratar
  if (!code && !error) {
    return next();
  }

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(error || 'Código ausente')}`);
  }

  try {
    const tokens = await SpotifyService.exchangeCode(code, BACKEND_REDIRECT_URI);
    const profile = await SpotifyService.getCurrentUserProfile(tokens.accessToken);

    const existingUser = db.prepare('SELECT id FROM users WHERE spotify_id = ?').get(profile.id);
    let userId = existingUser ? existingUser.id : `usr_${profile.id}`;
    const avatarUrl = profile.images && profile.images.length > 0 ? profile.images[0].url : null;

    db.prepare(`
      INSERT INTO users (id, spotify_id, display_name, email, avatar_url, access_token, refresh_token, token_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(spotify_id) DO UPDATE SET
        display_name = excluded.display_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, profile.id, profile.display_name || profile.id, profile.email || '', avatarUrl, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);

    const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Sincronização inicial em segundo plano
    IngestionWorker.syncUserRecentlyPlayed(userRecord).catch(console.error);

    res.redirect(`${FRONTEND_URL}/?auth_user_id=${userId}`);
  } catch (err) {
    console.error('Erro no callback OAuth:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
  }
});

// 4. Troca de code via Frontend SPA
app.post('/api/auth/spotify/exchange', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code obrigatório' });
  }

  try {
    const tokens = await SpotifyService.exchangeCode(code, FRONTEND_REDIRECT_URI);
    const profile = await SpotifyService.getCurrentUserProfile(tokens.accessToken);

    const existingUser = db.prepare('SELECT id FROM users WHERE spotify_id = ?').get(profile.id);
    let userId = existingUser ? existingUser.id : `usr_${profile.id}`;
    const avatarUrl = profile.images && profile.images.length > 0 ? profile.images[0].url : null;

    db.prepare(`
      INSERT INTO users (id, spotify_id, display_name, email, avatar_url, access_token, refresh_token, token_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(spotify_id) DO UPDATE SET
        display_name = excluded.display_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, profile.id, profile.display_name || profile.id, profile.email || '', avatarUrl, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Iniciar sync inicial completo (recentes + top tracks e fotos de artistas)
    IngestionWorker.syncUserRecentlyPlayed(user)
      .then(() => IngestionWorker.enrichUserTopTracks(user))
      .catch(console.error);

    res.json({
      user: {
        id: user.id,
        spotify_id: user.spotify_id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        last_sync_at: user.last_sync_at,
      },
    });
  } catch (err) {
    console.error('Erro no exchange de token:', err.response?.data || err.message);
    res.status(500).json({ error: 'Falha na autenticação com o Spotify' });
  }
});

// 5. Dados do Usuário Logado
app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({
    id: user.id,
    spotify_id: user.spotify_id,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    last_sync_at: user.last_sync_at,
  });
});

// 5.1 Música Tocando Agora (Currently Playing)
app.get('/api/player/currently-playing', async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json({
      is_playing: true,
      is_demo: true,
      progress_ms: 68000,
      item: {
        track_id: '4Dvkj6JhhA12EX05Qv7Ut2',
        track_name: 'Espresso',
        artist_name: 'Sabrina Carpenter',
        artists: ['Sabrina Carpenter'],
        album_name: 'Short n\' Sweet',
        album_image_url: 'https://i.scdn.co/image/ab67616d0000b273fd8d7a8d96871e791cb1f626',
        duration_ms: 175459,
        spotify_url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05Qv7Ut2',
      }
    });
  }

  let accessToken = user.access_token;
  const expiresAt = new Date(user.token_expires_at).getTime();

  if (Date.now() >= expiresAt - 120000) {
    try {
      const refreshed = await SpotifyService.refreshAccessToken(user.refresh_token);
      accessToken = refreshed.accessToken;
      db.prepare(`
        UPDATE users 
        SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(accessToken, refreshed.refreshToken, refreshed.expiresAt, user.id);
    } catch (err) {
      console.warn('Falha ao renovar token para currently-playing:', err.message);
    }
  }

  const result = await SpotifyService.getCurrentlyPlaying(accessToken);
  res.json(result);
});

// 6. Meses Disponíveis
app.get('/api/wrapped/months', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    const now = new Date();
    return res.json([
      { year: now.getFullYear(), month: now.getMonth() + 1, total_plays: 542, is_current: true },
      { year: now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth(), total_plays: 430, is_current: false },
    ]);
  }

  const months = AnalyticsEngine.getAvailableMonths(user.id);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const hasCurrent = months.some((m) => m.year === currentYear && m.month === currentMonth);
  if (!hasCurrent) {
    months.unshift({
      year: currentYear,
      month: currentMonth,
      total_plays: 0,
      total_minutes: 0,
    });
  }

  res.json(months);
});

// 7. Dados do Wrapped Mensal
app.get('/api/wrapped/:year/:month', (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const user = getSessionUser(req);

  if (!user) {
    return res.json(getDemoWrappedData(year, month));
  }

  const data = AnalyticsEngine.calculateMonthlyWrapped(user.id, year, month);

  if (data.stats.total_plays === 0) {
    return res.json({
      ...data,
      is_empty: true,
      user_message: 'Nenhum histórico registrado para este mês ainda. Importe seu arquivo GDPR estendido para acessar meses passados.',
    });
  }

  res.json(data);
});

// 8. Rota Demo Exclusiva
app.get('/api/wrapped/demo', (req, res) => {
  res.json(getDemoWrappedData(2026, 9));
});

// 9. Forçar Sincronização Incremental Imediata
app.post('/api/sync/trigger', async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    const result = await IngestionWorker.syncUserRecentlyPlayed(user);
    try {
      await IngestionWorker.enrichUserTopTracks(user);
    } catch (e) {
      console.warn('Enriquecimento opcional de top tracks:', e.message);
    }
    res.json({
      success: true,
      message: `Sincronização concluída! Dados atualizados.`,
      ...result,
    });
  } catch (err) {
    console.error('Erro na sincronização sob demanda:', err.message);
    res.status(500).json({ error: err.message || 'Erro ao sincronizar com o Spotify' });
  }
});

// 9.1 Enriquecer Histórico com as Top Tracks oficiais do mês (resolve limite de 50 faixas)
app.post('/api/sync/enrich-top-tracks', async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    const result = await IngestionWorker.enrichUserTopTracks(user);
    res.json(result);
  } catch (err) {
    console.error('Erro no enriquecimento de Top Tracks:', err.message);
    res.status(500).json({ error: err.message || 'Erro ao enriquecer histórico com Top Tracks' });
  }
});

// 9.2 Reconstrução Automática de Mês Histórico via API Oficial (Sem precisar de GDPR)
app.post('/api/sync/reconstruct-month', async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const { year, month } = req.body;
  if (!year || !month) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
  }

  try {
    const result = await IngestionWorker.reconstructHistoricalMonth(user, parseInt(year, 10), parseInt(month, 10));
    res.json(result);
  } catch (err) {
    console.error('Erro na reconstrução histórica:', err.message);
    res.status(500).json({ error: err.message || 'Erro ao reconstruir histórico do mês via Spotify' });
  }
});

// 10. Upload de Histórico GDPR (Aceita múltiplos .json ou .zip completo diretamente do Spotify)
app.post('/api/sync/gdpr', upload.any(), async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Por favor, selecione ao menos um arquivo (.json ou .zip) do Spotify.' });
  }

  try {
    const result = await IngestionWorker.importGDPRFiles(user.id, files);
    res.json({
      success: true,
      message: `Importação vitalícia concluída com sucesso! ${result.inserted} reproduções adicionadas de ${result.validStreams} válidas em ${files.length} arquivo(s).`,
      ...result,
    });
  } catch (err) {
    console.error('Erro ao importar arquivo(s) GDPR:', err.message);
    res.status(400).json({ error: err.message || 'Arquivo inválido ou erro no processamento do histórico do Spotify' });
  }
});

export default app;

