import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontDir = path.join(__dirname, 'front');
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '32kb' }));

function formatKstTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} KST`;
}

function metNoWeatherText(symbol, precip) {
  const s = String(symbol || '').toLowerCase();
  if (s.includes('thunder')) return '천둥번개';
  if (s.includes('snow') || s.includes('sleet')) return '눈';
  if (s.includes('rain') || s.includes('drizzle') || precip > 0) return '비';
  if (s.includes('fog')) return '안개';
  return '';
}

async function fetchMetNoWeather() {
  const url = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=33.249&lon=126.278';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'litttl-farm/1.0 (https://litttl.com; unclelitttl@gmail.com)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`METNO ${response.status}`);
  const data = await response.json();
  const series = data?.properties?.timeseries;
  if (!Array.isArray(series) || !series.length) throw new Error('METNO empty');
  const nowMs = Date.now();
  let chosen = series[0];
  let bestDiff = Math.abs(new Date(chosen.time).getTime() - nowMs);
  for (let i = 1; i < Math.min(series.length, 6); i++) {
    const diff = Math.abs(new Date(series[i].time).getTime() - nowMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      chosen = series[i];
    }
  }
  const instant = chosen.data?.instant?.details || {};
  const next1 = chosen.data?.next_1_hours || chosen.data?.next_6_hours || {};
  const symbol = next1.summary?.symbol_code || '';
  const precip = Number(next1.details?.precipitation_amount ?? 0);
  const rn = Number.isFinite(precip) ? precip : 0;
  const cloudPct = Number(instant.cloud_area_fraction);
  const caTot = Number.isFinite(cloudPct) ? Math.round((Math.max(0, Math.min(100, cloudPct)) / 100) * 10) : null;
  const ta = Number(instant.air_temperature);
  const ww = metNoWeatherText(symbol, rn);
  const sdTot = ww === '눈' ? Math.max(0.1, rn) : 0;
  return {
    tm: formatKstTime(chosen.time),
    station: '벼락밭',
    ta: Number.isFinite(ta) ? ta : null,
    rn,
    sdTot,
    ww,
    caTot,
    source: 'metno',
  };
}

app.get('/api/weather', async (_req, res) => {
  try {
    const weather = await fetchMetNoWeather();
    return res
      .set({
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      })
      .json(weather);
  } catch {
    return res
      .status(502)
      .set('Cache-Control', 'no-store, max-age=0')
      .json({ error: '날씨 자료를 불러오지 못했습니다.' });
  }
});

const diaryReplyHits = new Map();
function allowDiaryReplyRate(key) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxHits = 20;
  const prev = diaryReplyHits.get(key) || [];
  const recent = prev.filter((ts) => now - ts < windowMs);
  if (recent.length >= maxHits) {
    diaryReplyHits.set(key, recent);
    return false;
  }
  recent.push(now);
  diaryReplyHits.set(key, recent);
  return true;
}

app.post('/api/diary-reply', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
  if (!allowDiaryReplyRate(clientIp)) {
    return res.status(429).json({ error: '요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const text = typeof body.diaryText === 'string' ? body.diaryText.trim() : '';
  if (!text) {
    return res.status(400).json({ error: '일기 내용이 비어 있어요.' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: '일기는 2000자까지만 보낼 수 있어요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI 답장 API 키(GEMINI_API_KEY)가 설정되지 않았어요.' });
  }

  const treeLabel = String(body.treeName || '').trim().slice(0, 24) || '귤나무';
  const writerLabel = String(body.authorName || '').trim().slice(0, 20) || '가족';
  const moodLabel = String(body.iconLabel || '').trim().slice(0, 12);

  const systemInstruction = [
    '당신은 제주 서귀포 벼락밭에서 자라는 따뜻한 감귤나무입니다.',
    '글쓴이가 오늘 남긴 일기를 읽고, 나무의 마음으로 다정한 답장을 써 주세요.',
    '말투는 가깝고 온기 있는 반말(~어, ~게, ~야)로 하며, 훈계나 가르침 대신 글쓴이의 감정과 하루에 진심으로 공감해 주세요.',
    '제주의 바람, 햇살, 돌담, 나뭇잎, 귤꽃이나 열매 같은 자연의 풍경을 과하지 않게 녹여 주세요.',
    '분량은 반드시 공백 포함 300자 내외(270자~330자)의 자연스럽게 끝맺는 글로 써 주세요.',
    '제목, "[나무가]" 같은 말머리, 마크다운 기호(*, #, -), 이모지, 해시태그는 넣지 마세요.',
  ].join('\n');

  const contents = [
    `나무 이름: ${treeLabel}`,
    `글쓴이: ${writerLabel}`,
    moodLabel ? `오늘의 기분: ${moodLabel}` : '',
    `일기 내용:\n${text}`,
  ].filter(Boolean).join('\n');

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });
    const reply = String(response?.text || '').trim();
    if (!reply) {
      return res.status(502).json({ error: '나무의 답장을 받아오지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
    }
    return res
      .set({
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      })
      .json({ reply });
  } catch (err) {
    const status = Number(err?.status) || 502;
    const rawMsg = String(err?.message || '');
    console.error('[diary-reply]', status, rawMsg);
    const keyIssue = status === 403 || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key');
    const message =
      status === 429
        ? '잠시 요청이 몰려 답장을 쓰기 어려워요. 조금 뒤 다시 시도해 주세요.'
        : keyIssue
          ? 'Settings > Secrets에서 GEMINI_API_KEY 설정을 확인해 주세요.'
          : '나무의 답장을 받아오지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    return res.status(status >= 400 && status < 600 ? status : 502).json({ error: message });
  }
});

app.get('/js/config.js', (_req, res) => {
  const configPath = path.join(frontDir, 'js', 'config.js');
  let source = fs.readFileSync(configPath, 'utf8');

  const appletConfigPath = path.join(__dirname, 'firebase-applet-config.json');
  let firebaseConfig = {};

  if (fs.existsSync(appletConfigPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
      if (parsed && parsed.apiKey && parsed.projectId) {
        firebaseConfig = {
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          appId: parsed.appId || '',
          firestoreDatabaseId: parsed.firestoreDatabaseId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
        };
      }
    } catch {}
  } else if (
    process.env.FIREBASE_API_KEY ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_APP_ID
  ) {
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '',
    };
  }

  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    source = source.replace(/firebase:\s*\{[^}]*\}/, `firebase: ${JSON.stringify(firebaseConfig)}`);
  }

  res.type('application/javascript; charset=utf-8').set('Cache-Control', 'no-store').send(source);
});

app.use(express.static(frontDir, { index: 'index.html' }));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(frontDir, 'index.html'));
  }
  next();
});

app.listen(PORT, HOST, () => {
  console.log(`LITTTL. FARM server listening at http://${HOST}:${PORT}`);
});
