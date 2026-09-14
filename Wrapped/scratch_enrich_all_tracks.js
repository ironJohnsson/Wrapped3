import db from './server/db.js';
import { SpotifyService } from './server/spotifyService.js';
import axios from 'axios';

const user = db.prepare('SELECT * FROM users LIMIT 1').get();

async function run() {
  console.log('--- ENRIQUECENDO FAIXAS DE TODOS OS ANOS ---');
  let refreshed = await SpotifyService.refreshAccessToken(user.refresh_token);
  let headers = { Authorization: `Bearer ${refreshed.accessToken}` };

  // Buscar faixas nos Top 20 mensais de todos os tempos OU com >= 5 plays
  const missingTracks = db.prepare(`
    WITH top_monthly AS (
      SELECT DISTINCT p.track_id
      FROM (
        SELECT 
          p_inner.track_id,
          strftime('%Y-%m', p_inner.played_at) as ym,
          COUNT(*) as plays,
          ROW_NUMBER() OVER (
            PARTITION BY strftime('%Y-%m', p_inner.played_at) 
            ORDER BY COUNT(*) DESC
          ) as rn
        FROM play_logs p_inner
        GROUP BY p_inner.track_id, ym
      ) p
      WHERE p.rn <= 20
    ),
    overall_plays AS (
      SELECT 
        t.id, 
        t.name as track_name,
        (SELECT a.name FROM track_artists ta JOIN artists a ON ta.artist_id = a.id WHERE ta.track_id = t.id LIMIT 1) as artist_name,
        COUNT(p.id) as plays
      FROM tracks t
      JOIN play_logs p ON t.id = p.track_id
      WHERE t.album_image_url IS NULL OR t.album_image_url = ''
      GROUP BY t.id, t.name
    )
    SELECT DISTINCT 
      op.id, 
      op.track_name, 
      op.artist_name, 
      op.plays
    FROM overall_plays op
    LEFT JOIN top_monthly tm ON op.id = tm.track_id
    WHERE (tm.track_id IS NOT NULL OR op.plays >= 5)
      AND op.track_name IS NOT NULL
      AND TRIM(op.track_name) != ''
      AND op.artist_name IS NOT NULL
      AND TRIM(op.artist_name) != ''
    ORDER BY op.plays DESC
  `).all();

  console.log(`Total de faixas a enriquecer: ${missingTracks.length}`);

  const updateStmt = db.prepare(`
    UPDATE tracks 
    SET 
      album_image_url = ?, 
      album_name = COALESCE(NULLIF(album_name, 'album_gdpr'), ?) 
    WHERE id = ?
  `);

  let successCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < missingTracks.length; i++) {
    const t = missingTracks[i];
    const trackName = t.track_name.trim();
    const artistName = t.artist_name.trim();

    try {
      const q = `track:"${encodeURIComponent(trackName)}" artist:"${encodeURIComponent(artistName)}"`;
      let res;
      try {
        res = await axios.get(`https://api.spotify.com/v1/search?type=track&limit=1&q=${q}`, { 
          headers, 
          timeout: 6000 
        });
      } catch (err) {
        if (err.response?.status === 401) {
          console.log('Token expirado, renovando...');
          refreshed = await SpotifyService.refreshAccessToken(user.refresh_token);
          headers = { Authorization: `Bearer ${refreshed.accessToken}` };
          res = await axios.get(`https://api.spotify.com/v1/search?type=track&limit=1&q=${q}`, { 
            headers, 
            timeout: 6000 
          });
        } else if (err.response?.status === 429) {
          const waitSecs = parseInt(err.response.headers['retry-after'] || '5', 10);
          console.log(`Rate limit (429)! Pausando por ${waitSecs} segundos...`);
          await new Promise(r => setTimeout(r, (waitSecs + 1) * 1000));
          i--;
          continue;
        } else {
          throw err;
        }
      }

      let item = res.data.tracks?.items?.[0];

      if (!item || !item.album?.images?.length) {
        try {
          const flexQ = encodeURIComponent(`${trackName} ${artistName}`);
          const flexRes = await axios.get(`https://api.spotify.com/v1/search?type=track&limit=1&q=${flexQ}`, { 
            headers, 
            timeout: 6000 
          });
          item = flexRes.data.tracks?.items?.[0];
        } catch (err) {}
      }

      const img = item?.album?.images?.[0]?.url || item?.album?.images?.[1]?.url;
      const albumName = item?.album?.name || null;

      if (img) {
        updateStmt.run(img, albumName, t.id);
        successCount++;
        if (successCount % 20 === 0 || i === missingTracks.length - 1) {
          console.log(`[${i + 1}/${missingTracks.length}] ✓ Faixa capa: "${trackName}" - ${artistName} (${t.plays} plays)`);
        }
      } else {
        notFoundCount++;
      }

      // Delay de 120ms entre requisições para evitar rate-limit
      await new Promise(r => setTimeout(r, 120));

    } catch (e) {
      console.warn(`! Erro com faixa "${trackName}":`, e.message);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
  console.log(`\n=== FIM DO ENRIQUECIMENTO DE FAIXAS ===`);
  console.log(`✓ Capas adicionadas: ${successCount}`);
  console.log(`- Não encontradas: ${notFoundCount}`);
}

run().catch(console.error);

