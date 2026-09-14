import db from './server/db.js';

// 1. Artistas ordenados por reproduções totais de todos os tempos que não têm imagem
const artistsMissing = db.prepare(`
  SELECT 
    a.id, 
    a.name, 
    COUNT(p.id) as plays
  FROM artists a
  LEFT JOIN track_artists ta ON a.id = ta.artist_id
  LEFT JOIN play_logs p ON ta.track_id = p.track_id
  WHERE a.image_url IS NULL OR a.image_url = ''
  GROUP BY a.id, a.name
  HAVING plays > 0
  ORDER BY plays DESC
`).all();

// 2. Músicas ordenadas por reproduções totais de todos os tempos que não têm imagem
const tracksMissing = db.prepare(`
  SELECT 
    t.id, 
    t.name as track_name,
    (SELECT a.name FROM track_artists ta JOIN artists a ON ta.artist_id = a.id WHERE ta.track_id = t.id LIMIT 1) as artist_name,
    COUNT(p.id) as plays
  FROM tracks t
  JOIN play_logs p ON t.id = p.track_id
  WHERE t.album_image_url IS NULL OR t.album_image_url = ''
  GROUP BY t.id, t.name
  ORDER BY plays DESC
`).all();

// 3. Faixas que apareceram em QUALQUER Top 20 mensal de QUALQUER ano
const top20MonthlyTracksMissing = db.prepare(`
  WITH monthly_ranked AS (
    SELECT 
      p.track_id,
      strftime('%Y-%m', p.played_at) as ym,
      COUNT(*) as plays,
      ROW_NUMBER() OVER (
        PARTITION BY strftime('%Y-%m', p.played_at) 
        ORDER BY COUNT(*) DESC
      ) as rn
    FROM play_logs p
    GROUP BY p.track_id, ym
  )
  SELECT DISTINCT 
    t.id, 
    t.name as track_name,
    (SELECT a.name FROM track_artists ta JOIN artists a ON ta.artist_id = a.id WHERE ta.track_id = t.id LIMIT 1) as artist_name,
    mr.plays
  FROM monthly_ranked mr
  JOIN tracks t ON mr.track_id = t.id
  WHERE mr.rn <= 20 AND (t.album_image_url IS NULL OR t.album_image_url = '')
  ORDER BY mr.plays DESC
`).all();

console.log({
  totalArtistsWithoutImageWithPlays: artistsMissing.length,
  artistsWithAtLeast3PlaysWithoutImage: artistsMissing.filter(a => a.plays >= 3).length,
  artistsWithAtLeast5PlaysWithoutImage: artistsMissing.filter(a => a.plays >= 5).length,
  totalTracksWithoutCover: tracksMissing.length,
  tracksWithAtLeast5PlaysWithoutCover: tracksMissing.filter(t => t.plays >= 5).length,
  tracksWithAtLeast10PlaysWithoutCover: tracksMissing.filter(t => t.plays >= 10).length,
  top20MonthlyTracksMissingTotal: top20MonthlyTracksMissing.length,
});

