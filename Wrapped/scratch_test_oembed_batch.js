import db from './server/db.js';
import axios from 'axios';

// Pegar 10 faixas de anos anteriores a 2026 sem capa
const tracks = db.prepare(`
  SELECT t.id, t.name, strftime('%Y', p.played_at) as yr, COUNT(p.id) as plays
  FROM tracks t
  JOIN play_logs p ON t.id = p.track_id
  WHERE (t.album_image_url IS NULL OR t.album_image_url = '')
    AND p.played_at < '2026-01-01'
  GROUP BY t.id, t.name
  ORDER BY plays DESC
  LIMIT 10
`).all();

console.log('Testando 10 faixas antigas:');
for (const t of tracks) {
  try {
    const res = await axios.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${t.id}`, { timeout: 4000 });
    let img = res.data.thumbnail_url;
    if (img) {
      img = img.replace('/ab67616d00001e02', '/ab67616d0000b273');
    }
    console.log(`✓ [${t.yr}] "${t.name}" -> ${img}`);
  } catch (e) {
    console.log(`✗ "${t.name}" (${t.id}): ${e.message}`);
  }
}

