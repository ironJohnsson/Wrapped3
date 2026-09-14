import db from './server/db.js';
import axios from 'axios';

// Pegar 5 artistas com muitas reproduções que ainda não têm foto
const artists = db.prepare(`
  SELECT a.id, a.name, COUNT(p.id) as plays,
    (SELECT t.id FROM track_artists ta JOIN tracks t ON ta.track_id = t.id WHERE ta.artist_id = a.id LIMIT 1) as sample_track_id
  FROM artists a
  LEFT JOIN track_artists ta ON a.id = ta.artist_id
  LEFT JOIN play_logs p ON ta.track_id = p.track_id
  WHERE a.image_url IS NULL OR a.image_url = ''
  GROUP BY a.id, a.name
  HAVING plays > 10 AND sample_track_id IS NOT NULL
  ORDER BY plays DESC
  LIMIT 5
`).all();

console.log('Testando 5 artistas:');
for (const a of artists) {
  try {
    let spotifyArtistId = a.id.startsWith('art_') ? null : a.id;
    
    // Se ID é sintético, buscar pelo sample track
    if (!spotifyArtistId && a.sample_track_id) {
      const trackRes = await axios.get(`https://open.spotify.com/track/${a.sample_track_id}`, { timeout: 5000 });
      const matches = trackRes.data.match(/https:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]{22})/g);
      if (matches && matches.length > 0) {
        spotifyArtistId = matches[0].split('/').pop();
      }
    }

    if (spotifyArtistId) {
      const artRes = await axios.get(`https://open.spotify.com/artist/${spotifyArtistId}`, { timeout: 5000 });
      const img = artRes.data.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
      console.log(`✓ "${a.name}" (${spotifyArtistId}) -> ${img}`);
    } else {
      console.log(`✗ Não foi possível resolver ID para "${a.name}"`);
    }
  } catch (e) {
    console.log(`✗ Erro com "${a.name}": ${e.message}`);
  }
}

