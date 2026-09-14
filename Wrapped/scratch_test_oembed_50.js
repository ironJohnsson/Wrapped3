import db from './server/db.js';
import axios from 'axios';

const tracks = db.prepare(`
  SELECT t.id, t.name, strftime('%Y', p.played_at) as yr, COUNT(p.id) as plays
  FROM tracks t
  JOIN play_logs p ON t.id = p.track_id
  WHERE (t.album_image_url IS NULL OR t.album_image_url = '')
  GROUP BY t.id, t.name
  ORDER BY plays DESC
  LIMIT 50
`).all();

console.log(`Testando 50 faixas via oEmbed...`);
let ok = 0;
let fail = 0;
const start = Date.now();

for (const t of tracks) {
  try {
    const res = await axios.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${t.id}`, { timeout: 3000 });
    let img = res.data.thumbnail_url;
    if (img) {
      img = img.replace('/ab67616d00001e02', '/ab67616d0000b273');
      db.prepare('UPDATE tracks SET album_image_url = ? WHERE id = ?').run(img, t.id);
      ok++;
    } else {
      fail++;
    }
  } catch (e) {
    fail++;
  }
}

db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
console.log(`Resultado: ${ok} sucessos, ${fail} falhas em ${((Date.now() - start)/1000).toFixed(1)}s`);

