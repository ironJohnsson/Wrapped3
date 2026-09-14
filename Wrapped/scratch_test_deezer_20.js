import db from './server/db.js';
import axios from 'axios';

const artists = db.prepare(`
  SELECT a.id, a.name, COUNT(p.id) as plays
  FROM artists a
  LEFT JOIN track_artists ta ON a.id = ta.artist_id
  LEFT JOIN play_logs p ON ta.track_id = p.track_id
  WHERE a.image_url IS NULL OR a.image_url = ''
  GROUP BY a.id, a.name
  HAVING plays > 0
  ORDER BY plays DESC
  LIMIT 20
`).all();

console.log('Testando 20 artistas sem imagem via Deezer API:');
let ok = 0;
for (const a of artists) {
  try {
    const res = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(a.name)}`, { timeout: 4000 });
    const match = res.data.data?.find(item => item.name.toLowerCase() === a.name.toLowerCase()) || res.data.data?.[0];
    const img = match?.picture_big || match?.picture_medium;
    if (img && !img.includes('artist//250x250')) {
      console.log(`✓ "${a.name}" (${a.plays} plays) -> ${img}`);
      ok++;
    } else {
      console.log(`✗ "${a.name}" -> não encontrado`);
    }
  } catch (e) {
    console.log(`✗ "${a.name}" -> erro: ${e.message}`);
  }
}

console.log(`\nSucesso: ${ok}/20`);

