import db from './server/db.js';
import axios from 'axios';

const http = axios.create({
  timeout: 5000,
});

async function runPool(items, concurrency, fn) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i, items.length);
    }
  });
  await Promise.all(workers);
}

// ----------------------------------------------------
// 1. ENRIQUECER ARTISTAS DE TODOS OS ANOS (VIA DEEZER API)
// ----------------------------------------------------
async function enrichArtists() {
  console.log('\n========================================');
  console.log('1. ENRIQUECENDO ARTISTAS (TODOS OS ANOS)');
  console.log('========================================');

  // Seleciona artistas sem foto ordenados por mais tocados no histórico todo
  const artists = db.prepare(`
    SELECT 
      a.id, 
      a.name, 
      COUNT(p.id) as plays
    FROM artists a
    LEFT JOIN track_artists ta ON a.id = ta.artist_id
    LEFT JOIN play_logs p ON ta.track_id = p.track_id
    WHERE (a.image_url IS NULL OR a.image_url = '')
      AND a.name IS NOT NULL
      AND TRIM(a.name) != ''
      AND a.name != 'Unknown Artist'
    GROUP BY a.id, a.name
    HAVING plays >= 1
    ORDER BY plays DESC
    LIMIT 1500
  `).all();

  console.log(`Artistas para enriquecer fotos: ${artists.length}`);

  const updateStmt = db.prepare(`
    UPDATE artists 
    SET image_url = ? 
    WHERE id = ? OR LOWER(TRIM(name)) = LOWER(TRIM(?))
  `);

  let successCount = 0;
  let batchCount = 0;

  await runPool(artists, 5, async (art, idx, total) => {
    try {
      const res = await http.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(art.name)}`);
      const match = res.data.data?.find(item => item.name.toLowerCase() === art.name.toLowerCase()) || res.data.data?.[0];
      const img = match?.picture_big || match?.picture_medium;

      if (img && !img.includes('artist//250x250')) {
        updateStmt.run(img, art.id, art.name.trim());
        successCount++;
        batchCount++;
        if (successCount % 50 === 0 || idx === total - 1) {
          console.log(`[${idx + 1}/${total}] ✓ Foto Artista: "${art.name}" (${art.plays} plays)`);
        }
      }

      if (batchCount >= 50) {
        batchCount = 0;
        db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
      }

      await new Promise(r => setTimeout(r, 60));
    } catch (e) {
      // Ignora falhas de timeout e segue
    }
  });

  db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
  console.log(`✓ Artistas concluídos: ${successCount} fotos adicionadas com sucesso!`);
}

// ----------------------------------------------------
// 2. ENRIQUECER FAIXAS DE TODOS OS ANOS (VIA SPOTIFY OEMBED)
// ----------------------------------------------------
async function enrichTracks() {
  console.log('\n========================================');
  console.log('2. ENRIQUECENDO FAIXAS (TODOS OS ANOS)');
  console.log('========================================');

  // Seleciona faixas sem capa nos Top 20 de qualquer mês OU com >= 2 reproduções
  const tracks = db.prepare(`
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
    WHERE (tm.track_id IS NOT NULL OR op.plays >= 2)
      AND op.track_name IS NOT NULL
      AND TRIM(op.track_name) != ''
      AND length(op.id) = 22
      AND op.id NOT LIKE 'trk_%'
    ORDER BY op.plays DESC
    LIMIT 2500
  `).all();

  console.log(`Faixas identificadas para enriquecer capas: ${tracks.length}`);

  const updateStmt = db.prepare(`
    UPDATE tracks 
    SET album_image_url = ? 
    WHERE id = ?
  `);

  let successCount = 0;
  let batchCount = 0;

  await runPool(tracks, 5, async (t, idx, total) => {
    try {
      const res = await http.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${t.id}`);
      let img = res.data?.thumbnail_url;
      if (img) {
        // Converte para alta resolução 640x640
        img = img.replace('/ab67616d00001e02', '/ab67616d0000b273');
        updateStmt.run(img, t.id);
        successCount++;
        batchCount++;
        if (successCount % 50 === 0 || idx === total - 1) {
          console.log(`[${idx + 1}/${total}] ✓ Capa Faixa: "${t.track_name}" - ${t.artist_name} (${t.plays} plays)`);
        }
      }

      if (batchCount >= 50) {
        batchCount = 0;
        db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
      }

      await new Promise(r => setTimeout(r, 60));
    } catch (e) {
      // Ignora falhas de timeout e segue
    }
  });

  db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
  console.log(`✓ Faixas concluídas: ${successCount} capas adicionadas com sucesso!`);
}

async function main() {
  const start = Date.now();
  console.log('Iniciando enriquecimento completo de todos os anos (músicas + artistas)...');

  await enrichArtists();
  await enrichTracks();

  db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
  const dur = Math.round((Date.now() - start) / 1000);
  console.log(`\n🎉 PROCESSO CONCLUÍDO COM SUCESSO EM ${dur}s!`);
}

main().catch(console.error);

