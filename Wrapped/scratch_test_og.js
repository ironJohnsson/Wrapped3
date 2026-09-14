import axios from 'axios';

async function test() {
  const res = await axios.get('https://open.spotify.com/track/5XeFesFbtLpXzIVDNQP22n');
  const html = res.data;
  console.log('og:image:', html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1]);
  console.log('music:musician:', html.match(/<meta property="music:musician" content="([^"]+)"/i)?.[1]);
  console.log('Artist links:', html.match(/https:\/\/open\.spotify\.com\/artist\/[a-zA-Z0-9]{22}/g));
}

test();

