import db from './server/db.js';
import { SpotifyService } from './server/spotifyService.js';
import axios from 'axios';

const user = db.prepare('SELECT * FROM users LIMIT 1').get();

async function run() {
  console.log('--- ENRIQUECENDO ARTISTAS DE TODOS OS ANOS ---');
  let refreshed = await SpotifyService.refreshAccessToken(user.refresh_token);
  let headers = { Authorization: `Bearer ${refreshed.accessToken}` };

  // Buscar todos os artistas nos Top 20 mensais de todos os tempos OU com >= 3 plays
  const missingArtists = db.prepare(`
    WITH top_monthly AS (
      SELECT DISTINCT ta.artist_id
      FROM (
        SELECT 
          ta_inner.artist_id,
          strftime('%Y-%m', p.played_at) as ym,
          COUNT(*) as plays,
          ROW_NUMBER() OVER (
            PARTITION BY strftime('%Y-%m', p.played_at) 
            ORDER BY COUNT(*) DESC
          ) as rn
        FROM play_logs p
        JOIN track_artists ta_inner ON p.track_id = ta_inner.track_id AND ta_inner.position = 0
        GROUP BY ta_inner.artist_id, ym
      ) sub
      JOIN track_artists ta ON sub.artist_id = ta.artist_id
      WHERE sub.rn <= 20
    ),
    overall_plays AS (
      SELECT 
        a.id, 
        a.name, 
        COUNT(p.id) as plays
      FROM artists a
      LEFT JOIN track_artists ta ON a.id = ta.artist_id
      LEFT JOIN play_logs p ON ta.track_id = p.track_id
      WHERE a.image_url IS NULL OR a.image_url = ''
      GROUP BY a.id, a.name
    )
    SELECT DISTINCT 
      op.id, 
      op.name, 
      op.plays
    FROM overall_plays op
    LEFT JOIN top_monthly tm ON op.id = tm.artist_id
    WHERE (tm.artist_id IS NOT NULL OR op.plays >= 3)
      AND op.name IS NOT NULL
      AND TRIM(op.name) != ''
      AND op.name != 'Unknown Artist'
    ORDER BY op.plays DESC
  `).all();

  console.log(`Total de artistas a enriquecer: ${missingArtists.length}`);

  const updateStmt = db.prepare(`
    UPDATE artists 
    SET 
      image_url = ?,
      genres = CASE 
        WHEN genres IS NULL OR genres = '[]' OR genres = '' THEN ? 
        ELSE genres 
      END
    WHERE id = ? OR LOWER(TRIM(name)) = LOWER(TRIM(?))
  `);

  let successCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < missingArtists.length; i++) {
    const art = missingArtists[i];
    const artistName = art.name.trim();

    try {
      // 1. Busca estrita por artista
      const q = `artist:"${encodeURIComponent(artistName)}"`;
      let res;
      try {
        res = await axios.get(`https://api.spotify.com/v1/search?type=artist&limit=1&q=${q}`, { 
          headers, 
          timeout: 6000 
        });
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expirou, renovar
          console.log('Token expirado, renovando...');
          refreshed = await SpotifyService.refreshAccessToken(user.refresh_token);
          headers = { Authorization: `Bearer ${refreshed.accessToken}` };
          res = await axios.get(`https://api.spotify.com/v1/search?type=artist&limit=1&q=${q}`, { 
            headers, 
            timeout: 6000 
          });
        } else if (err.response?.status === 429) {
          const waitSecs = parseInt(err.response.headers['retry-after'] || '5', 10);
          console.log(`Rate limit (429)! Pausando por ${waitSecs} segundos...`);
          await new Promise(r => setTimeout(r, (waitSecs + 1) * 1000));
          i--; // Repetir este artista
          continue;
        } else {
          throw err;
        }
      }

      let item = res.data.artists?.items?.[0];

      // Se busca estrita não achou, faz busca genérica
      if (!item || !item.images?.length) {
        try {
          const flexQ = encodeURIComponent(artistName);
          const flexRes = await axios.get(`https://api.spotify.com/v1/search?type=artist&limit=1&q=${flexQ}`, { 
            headers, 
            timeout: 6000 
          });
          item = flexRes.data.artists?.items?.[0];
        } catch (err) {
          // Ignorar erro do fallback
        }
      }

      const img = item?.images?.[0]?.url || item?.images?.[1]?.url;
      const genresJson = item?.genres?.length ? JSON.stringify(item.genres) : null;

      if (img) {
        updateStmt.run(img, genresJson, art.id, artistName);
        successCount++;
        if (successCount % 15 === 0 || i === missingArtists.length - 1) {
          console.log(`[${i + 1}/${missingArtists.length}] ✓ Artista foto: "${artistName}" (${art.plays} plays)`);
        }
      } else {
        notFoundCount++;
      }

      // Delay seguro entre requisições (120ms) para evitar 429
      await new Promise(r => setTimeout(r, 120));

    } catch (e) {
      console.warn(`! Erro com artista "${artistName}":`, e.message);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
  console.log(`\n=== FIM DO ENRIQUECIMENTO DE ARTISTAS ===`);
  console.log(`✓ Fotos adicionadas: ${successCount}`);
  console.log(`- Não encontrados: ${notFoundCount}`);
}

run().catch(console.error);

