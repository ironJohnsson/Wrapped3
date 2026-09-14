import db from './server/db.js';

const topMonthlyArtistsMissing = db.prepare(`
  WITH monthly_artist_ranked AS (
    SELECT 
      ta.artist_id,
      strftime('%Y-%m', p.played_at) as ym,
      COUNT(*) as plays,
      ROW_NUMBER() OVER (
        PARTITION BY strftime('%Y-%m', p.played_at) 
        ORDER BY COUNT(*) DESC
      ) as rn
    FROM play_logs p
    JOIN track_artists ta ON p.track_id = ta.track_id AND ta.position = 0
    GROUP BY ta.artist_id, ym
  )
  SELECT DISTINCT 
    a.id, 
    a.name, 
    mar.plays
  FROM monthly_artist_ranked mar
  JOIN artists a ON mar.artist_id = a.id
  WHERE mar.rn <= 20 AND (a.image_url IS NULL OR a.image_url = '')
  ORDER BY mar.plays DESC
`).all();

console.log(`Artistas nos Top 20 mensais de QUALQUER mês/ano sem foto: ${topMonthlyArtistsMissing.length}`);
if (topMonthlyArtistsMissing.length > 0) {
  console.log('Exemplos:', topMonthlyArtistsMissing.slice(0, 20));
}

