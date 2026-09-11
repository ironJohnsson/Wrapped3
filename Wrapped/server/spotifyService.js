import axios from 'axios';
import querystring from 'node:querystring';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'fd7bfa7378a444759ee1aca654078506';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'd8a3e569547242e18a2e93aee0f27bd0';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SCOPES = [
  'user-read-recently-played',
  'user-read-playback-state',
  'user-top-read',
  'user-read-email',
  'user-read-private',
].join(' ');

export class SpotifyService {
  static getAuthorizationUrl(redirectUri, state = 'wrapped-auth-state') {
    const params = querystring.stringify({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SCOPES,
      state: state,
      show_dialog: 'true',
    });
    return `${SPOTIFY_AUTH_URL}?${params}`;
  }

  static async exchangeCode(code, redirectUri) {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    };
  }

  static async refreshAccessToken(refreshToken) {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    return {
      accessToken: access_token,
      refreshToken: newRefreshToken || refreshToken,
      expiresAt,
    };
  }

  static async getCurrentUserProfile(accessToken) {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  static async getRecentlyPlayed(accessToken, afterTimestamp = null) {
    let url = `${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`;
    if (afterTimestamp) {
      url += `&after=${afterTimestamp}`;
    }
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  static async getAudioFeaturesBatch(accessToken, trackIds) {
    if (!trackIds || trackIds.length === 0) return [];
    
    // Spotify aceita até 100 ids por chamada
    const chunk = trackIds.slice(0, 100).join(',');
    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/audio-features?ids=${chunk}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return (response.data.audio_features || []).filter(Boolean);
    } catch (err) {
      console.warn('Erro ao buscar audio-features do Spotify (pode estar restrito para algumas contas):', err.message);
      return [];
    }
  }

  static async getCurrentlyPlaying(accessToken) {
    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 204 || !response.data || !response.data.item) {
        return { is_playing: false, item: null };
      }

      const item = response.data.item;
      return {
        is_playing: Boolean(response.data.is_playing),
        progress_ms: response.data.progress_ms || 0,
        item: {
          track_id: item.id,
          track_name: item.name,
          artist_name: item.artists?.[0]?.name || 'Artista Desconhecido',
          artists: item.artists?.map(a => a.name) || [],
          album_name: item.album?.name || '',
          album_image_url: item.album?.images?.[0]?.url || null,
          duration_ms: item.duration_ms || 0,
          spotify_url: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
        }
      };
    } catch (err) {
      if (err.response?.status === 204) {
        return { is_playing: false, item: null };
      }
      console.warn('Erro ao buscar currently-playing do Spotify:', err.message);
      return { is_playing: false, item: null, error: err.message };
    }
  }
}

