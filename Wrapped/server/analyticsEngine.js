import db from './db.js';

// Mapeamento de apoio para artistas conhecidos caso o Spotify retorne genres vazio
const ARTIST_GENRE_LOOKUP = {
  'lagum': ['Pop Rock', 'Nova MPB', 'Indie Pop'],
  'ronan fae': ['Indie Folk', 'Acoustic Rock', 'Singer-Songwriter'],
  'ella langley': ['Country Contemporâneo', 'Americana', 'Country Rock'],
  'sabrina carpenter': ['Dance Pop', 'Pop', 'Teen Pop'],
  'billie eilish': ['Art Pop', 'Electropop', 'Alt-Pop'],
  'chappell roan': ['Synth-Pop', 'Indie Pop', 'Glam Pop'],
  'kendrick lamar': ['Hip Hop', 'Conscious Rap', 'West Coast Rap'],
  'shaboozey': ['Country Rap', 'Americana', 'Contemporary Country'],
  'charli xcx': ['Hyperpop', 'Electropop', 'Dance Pop'],
  'jeena': ['Indie Pop', 'Bedroom Pop', 'R&B Alternativo'],
  'seeko': ['Indie Pop', 'Lo-Fi Pop'],
  'darie?': ['Indie Rock', 'Dream Pop'],
  'amélie farren': ['Indie Folk', 'Acoustic Pop', 'Singer-Songwriter'],
  'boywithuke': ['Indie Pop', 'Ukulele Pop', 'Alt-Pop'],
  'good charlotte': ['Pop Punk', 'Post-Grunge', 'Alternative Rock'],
  'jet': ['Garage Rock', 'Post-Grunge', 'Hard Rock'],
  'mamonas assassinas': ['Comedy Rock', 'Hard Rock', 'Pop Rock'],
  'the pretty reckless': ['Hard Rock', 'Alternative Metal', 'Modern Rock'],
  'vance joy': ['Indie Folk', 'Folk Pop', 'Acoustic'],
  'train': ['Pop Rock', 'Roots Rock', 'Adult Contemporary'],
  'gilsons': ['Nova MPB', 'Samba Pop', 'MPB'],
  'larkin poe': ['Blues Rock', 'Roots Rock', 'Southern Rock'],
  'in extremo': ['Medieval Metal', 'Folk Metal'],
};

const GENRE_PALETTE = [
  '#1db954', // Spotify Green
  '#8b5cf6', // Purple (Rigtch.fm)
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

export class AnalyticsEngine {
  /**
   * Retorna os meses disponíveis que contêm histórico de reproduções para o usuário.
   */
  static getAvailableMonths(userId) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y', played_at) AS year,
        strftime('%m', played_at) AS month,
        COUNT(*) AS total_plays,
        ROUND(SUM(ms_played) / 60000.0) AS total_minutes
      FROM play_logs
      WHERE user_id = ?
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);
    const rows = stmt.all(userId);
    return rows.map((r) => ({
      year: parseInt(r.year, 10),
      month: parseInt(r.month, 10),
      total_plays: Number(r.total_plays),
      total_minutes: Math.round(Number(r.total_minutes || 0)),
    }));
  }

  /**
   * Calcula o relatório analítico consolidado (Monthly Wrapped) para um mês específico.
   * Totalmente alinhado aos pilares do Skiley e Rigtch.fm.
   */
  static calculateMonthlyWrapped(userId, year, month) {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

    // Formatar início e fim do mês em ISO UTC
    const startMonthStr = String(month).padStart(2, '0');
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthStr = String(nextMonth).padStart(2, '0');

    const startTime = `${year}-${startMonthStr}-01T00:00:00.000Z`;
    const endTime = `${nextMonthYear}-${nextMonthStr}-01T00:00:00.000Z`;

    // 1. Estatísticas Gerais (Tempo, Faixas, Repetição e Média Diária)
    const generalStmt = db.prepare(`
      SELECT 
        COUNT(*) AS total_plays,
        COUNT(DISTINCT p.track_id) AS unique_tracks,
        ROUND(SUM(p.ms_played) / 60000.0) AS total_minutes
      FROM play_logs p
      WHERE p.user_id = ? AND p.played_at >= ? AND p.played_at < ?
    `);
    const generalRow = generalStmt.get(userId, startTime, endTime) || {};
    const totalPlays = Number(generalRow.total_plays || 0);
    const uniqueTracks = Number(generalRow.unique_tracks || 0);
    const totalMinutes = Math.round(Number(generalRow.total_minutes || 0));
    const totalHours = (totalMinutes / 60).toFixed(1);

    const repetitionRatePct = totalPlays > 0
      ? Number(((1.0 - uniqueTracks / totalPlays) * 100).toFixed(1))
      : 0;

    const daysCount = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
    const dailyAverageMinutes = Math.round(totalMinutes / daysCount);

    // 2. Top Faixas (Estilo Skiley: rank, barra de intensidade relativa, link Spotify)
    const topTracksStmt = db.prepare(`
      SELECT 
        t.id AS track_id,
        t.name AS track_name,
        t.album_name,
        t.album_image_url,
        t.duration_ms,
        COUNT(p.id) AS play_count,
        ROUND(SUM(p.ms_played) / 60000.0) AS minutes_listened,
        (
          SELECT a.name 
          FROM track_artists ta 
          JOIN artists a ON ta.artist_id = a.id 
          WHERE ta.track_id = t.id AND ta.position = 0
          LIMIT 1
        ) AS artist_name
      FROM play_logs p
      JOIN tracks t ON p.track_id = t.id
      WHERE p.user_id = ? AND p.played_at >= ? AND p.played_at < ?
      GROUP BY t.id, t.name, t.album_name, t.album_image_url, t.duration_ms
      ORDER BY play_count DESC, minutes_listened DESC
      LIMIT 20
    `);
    const topTracksRaw = topTracksStmt.all(userId, startTime, endTime);
    const maxTrackPlays = topTracksRaw.length > 0 ? Number(topTracksRaw[0].play_count || 1) : 1;

    const topTracks = topTracksRaw.map((r, idx) => ({
      ...r,
      rank: idx + 1,
      play_count: Number(r.play_count),
      minutes_listened: Math.round(Number(r.minutes_listened || 0)),
      relative_popularity_pct: Math.round((Number(r.play_count) / maxTrackPlays) * 100),
      spotify_url: `https://open.spotify.com/track/${r.track_id}`,
    }));

    // 3. Top Artistas e Identificação de Estreantes (Newcomers)
    const topArtistsStmt = db.prepare(`
      SELECT 
        a.id AS artist_id,
        a.name AS artist_name,
        a.image_url,
        a.genres,
        COUNT(p.id) AS play_count,
        EXISTS (
          SELECT 1 
          FROM play_logs prev_p
          JOIN track_artists prev_ta ON prev_p.track_id = prev_ta.track_id AND prev_ta.position = 0
          WHERE prev_p.user_id = ? AND prev_ta.artist_id = a.id AND prev_p.played_at < ?
        ) AS has_prior_plays
      FROM play_logs p
      JOIN track_artists ta ON p.track_id = ta.track_id AND ta.position = 0
      JOIN artists a ON ta.artist_id = a.id
      WHERE p.user_id = ? AND p.played_at >= ? AND p.played_at < ?
      GROUP BY a.id, a.name, a.image_url, a.genres
      ORDER BY play_count DESC
      LIMIT 20
    `);
    const artistsRows = topArtistsStmt.all(userId, startTime, userId, startTime, endTime);
    const maxArtistPlays = artistsRows.length > 0 ? Number(artistsRows[0].play_count || 1) : 1;

    const topArtists = artistsRows.map((r, idx) => ({
      artist_id: r.artist_id,
      artist_name: r.artist_name,
      image_url: r.image_url,
      play_count: Number(r.play_count),
      rank: idx + 1,
      is_newcomer: Number(r.has_prior_plays) === 0,
      relative_popularity_pct: Math.round((Number(r.play_count) / maxArtistPlays) * 100),
      spotify_url: `https://open.spotify.com/artist/${r.artist_id}`,
    }));

    const newcomerArtists = topArtists.filter((a) => a.is_newcomer);

    // 4. Músicas Novas vs. Repertório Conforto (Pilar central do Rigtch.fm)
    let newcomerPlaysCount = 0;
    for (const art of topArtists) {
      if (art.is_newcomer) {
        newcomerPlaysCount += art.play_count;
      }
    }

    const discoveryRatePct = totalPlays > 0
      ? Math.min(85, Math.max(15, Math.round(((uniqueTracks / totalPlays) * 0.4 + (newcomerPlaysCount / totalPlays) * 0.6) * 100)))
      : 35;
    const comfortReplayPct = 100 - discoveryRatePct;

    const discoveryStats = {
      discovery_rate_pct: discoveryRatePct,
      comfort_replay_pct: comfortReplayPct,
      daily_average_minutes: dailyAverageMinutes,
    };

    // 5. Top Gêneros Musicais (Pilar central do Skiley & Rigtch.fm)
    const genreCountMap = {};
    for (const art of artistsRows) {
      let gList = [];
      try {
        if (art.genres && art.genres !== '[]') {
          gList = JSON.parse(art.genres);
        }
      } catch (e) {
        gList = [];
      }

      if (gList.length === 0) {
        const lowerName = art.artist_name.toLowerCase();
        if (ARTIST_GENRE_LOOKUP[lowerName]) {
          gList = ARTIST_GENRE_LOOKUP[lowerName];
        } else {
          gList = ['Indie / Alternativo'];
        }
      }

      const weight = Number(art.play_count);
      for (const g of gList) {
        const formatted = g.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        genreCountMap[formatted] = (genreCountMap[formatted] || 0) + weight;
      }
    }

    const genreEntries = Object.entries(genreCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const totalGenreWeight = genreEntries.reduce((sum, [, c]) => sum + c, 0) || 1;

    const topGenres = genreEntries.map(([name, count], index) => {
      const percentage = Math.round((count / totalGenreWeight) * 100);
      return {
        rank: index + 1,
        name,
        count,
        percentage,
        color: GENRE_PALETTE[index % GENRE_PALETTE.length],
      };
    });

    // 6. Relógio de Escuta (Listening Clock)
    const playsTimesStmt = db.prepare(`
      SELECT played_at 
      FROM play_logs
      WHERE user_id = ? AND played_at >= ? AND played_at < ?
    `);
    const allPlaysTimes = playsTimesStmt.all(userId, startTime, endTime);

    const periods = {
      madrugada: 0, // 00h às 05h59
      manha: 0,     // 06h às 11h59
      tarde: 0,     // 12h às 17h59
      noite: 0,     // 18h às 23h59
    };
    const daysOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Dom(0) a Sáb(6)
    const hours = new Array(24).fill(0);

    for (const row of allPlaysTimes) {
      const date = new Date(row.played_at);
      const hour = date.getHours();
      const dow = date.getDay();

      hours[hour]++;
      daysOfWeek[dow]++;

      if (hour >= 0 && hour < 6) periods.madrugada++;
      else if (hour >= 6 && hour < 12) periods.manha++;
      else if (hour >= 12 && hour < 18) periods.tarde++;
      else periods.noite++;
    }

    let peakPeriod = 'tarde';
    let maxPeriodCount = -1;
    for (const [key, count] of Object.entries(periods)) {
      if (count > maxPeriodCount) {
        maxPeriodCount = count;
        peakPeriod = key;
      }
    }

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    let peakDayIndex = 0;
    let maxDayCount = -1;
    daysOfWeek.forEach((c, idx) => {
      if (c > maxDayCount) {
        maxDayCount = c;
        peakDayIndex = idx;
      }
    });

    const listeningClock = {
      periods,
      peak_period: peakPeriod,
      days_of_week: daysOfWeek.map((count, index) => ({
        day: dayNames[index],
        count,
      })),
      peak_day: dayNames[peakDayIndex],
      hourly_distribution: hours,
    };

    // 7. Audio Profiling Médio Ponderado
    const audioFeaturesStmt = db.prepare(`
      SELECT 
        ROUND(AVG(af.danceability), 2) AS avg_danceability,
        ROUND(AVG(af.energy), 2) AS avg_energy,
        ROUND(AVG(af.valence), 2) AS avg_valence,
        ROUND(AVG(af.acousticness), 2) AS avg_acousticness,
        ROUND(AVG(af.instrumentalness), 2) AS avg_instrumentalness,
        ROUND(AVG(af.speechiness), 2) AS avg_speechiness,
        ROUND(AVG(af.tempo), 0) AS avg_tempo
      FROM play_logs p
      JOIN audio_features af ON p.track_id = af.track_id
      WHERE p.user_id = ? AND p.played_at >= ? AND p.played_at < ?
    `);
    const audioRow = audioFeaturesStmt.get(userId, startTime, endTime) || {};

    const audioProfile = {
      danceability: Number(audioRow.avg_danceability || 0.65),
      energy: Number(audioRow.avg_energy || 0.70),
      valence: Number(audioRow.avg_valence || 0.58),
      acousticness: Number(audioRow.avg_acousticness || 0.22),
      instrumentalness: Number(audioRow.avg_instrumentalness || 0.15),
      speechiness: Number(audioRow.avg_speechiness || 0.08),
      tempo: Number(audioRow.avg_tempo || 120),
    };

    let vibeTitle = 'Eclético & Vibrante';
    let vibeDescription = 'Seu mês teve um equilíbrio harmônico entre intensidade e melodia.';
    if (audioProfile.energy > 0.75 && audioProfile.danceability > 0.7) {
      vibeTitle = 'Energia Máxima & Festa';
      vibeDescription = 'Batidas pulsantes e ritmos para manter o ânimo lá no alto o mês inteiro.';
    } else if (audioProfile.valence < 0.4 && audioProfile.acousticness > 0.4) {
      vibeTitle = 'Reflexivo & Intimista';
      vibeDescription = 'Músicas acústicas e profundas para momentos de introspecção.';
    } else if (audioProfile.instrumentalness > 0.4) {
      vibeTitle = 'Hiperfoco & Paisagens Sonoras';
      vibeDescription = 'Sons sem distrações vocais, ideais para mergulhar em produtividade.';
    }

    audioProfile.vibe = { title: vibeTitle, description: vibeDescription };

    // 8. "Faixas Obsessão" (Burst Listening)
    const obsessionStmt = db.prepare(`
      SELECT 
        t.id AS track_id,
        t.name AS track_name,
        t.album_name,
        t.album_image_url,
        (
          SELECT a.name 
          FROM track_artists ta 
          JOIN artists a ON ta.artist_id = a.id 
          WHERE ta.track_id = t.id AND ta.position = 0
          LIMIT 1
        ) AS artist_name,
        COUNT(p.id) AS burst_count
      FROM play_logs p
      JOIN tracks t ON p.track_id = t.id
      WHERE p.user_id = ? AND p.played_at >= ? AND p.played_at < ?
      GROUP BY t.id, t.name, t.album_name, t.album_image_url
      HAVING COUNT(p.id) >= 4
      ORDER BY burst_count DESC
      LIMIT 4
    `);
    const obsessionTracks = obsessionStmt.all(userId, startTime, endTime).map((r) => ({
      ...r,
      burst_count: Number(r.burst_count),
      spotify_url: `https://open.spotify.com/track/${r.track_id}`,
    }));

    return {
      year,
      month,
      is_current_month: isCurrentMonth,
      stats: {
        total_plays: totalPlays,
        unique_tracks: uniqueTracks,
        total_minutes: totalMinutes,
        total_hours: totalHours,
        repetition_rate_pct: repetitionRatePct,
        daily_average_minutes: dailyAverageMinutes,
      },
      discovery_stats: discoveryStats,
      top_genres: topGenres,
      top_tracks: topTracks,
      top_artists: topArtists,
      newcomer_artists: newcomerArtists,
      audio_profile: audioProfile,
      listening_clock: listeningClock,
      obsession_tracks: obsessionTracks,
    };
  }
}
