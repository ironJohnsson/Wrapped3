import db from './server/db.js';

const res = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN length(id) = 22 AND id NOT LIKE 'trk_%' THEN 1 ELSE 0 END) as valid_spotify_ids,
    SUM(CASE WHEN (album_image_url IS NULL OR album_image_url = '') AND length(id) = 22 AND id NOT LIKE 'trk_%' THEN 1 ELSE 0 END) as missing_covers_with_spotify_id
  FROM tracks
`).get();

console.log(res);

