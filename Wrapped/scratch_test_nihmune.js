import axios from 'axios';

async function test() {
  const res = await axios.get('https://open.spotify.com/track/01lZ4HJmVaPEZpcR9MjUpS');
  const html = res.data;
  const albumImg = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  const artistLinks = html.match(/https:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]{22})/g);
  console.log('Album Img:', albumImg);
  console.log('Artist Links:', artistLinks);

  if (artistLinks && artistLinks[0]) {
    const artRes = await axios.get(artistLinks[0]);
    const artImg = artRes.data.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
    console.log('Artist Photo for nihmune:', artImg);
  }
}

test();

