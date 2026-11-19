import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(project, 'mockup', 'litttl-farm.html');
const front = path.join(project, 'front');
const jsDir = path.join(front, 'js');
const assetDir = path.join(front, 'assets');
const fontDir = path.join(front, 'fonts');
const scriptNames = ['config.js', 'filter.js', 'backend.js', 'app.js'];

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return [];
    const at = trimmed.indexOf('=');
    if (at < 1) return [];
    return [[trimmed.slice(0, at).trim(), trimmed.slice(at + 1).trim().replace(/^(["'])(.*)\1$/, '$2')]];
  }));
}

for (const dir of [front, jsDir, assetDir, fontDir]) fs.mkdirSync(dir, { recursive: true });

if (!fs.existsSync(source)) {
  if (fs.existsSync(path.join(front, 'index.html'))) {
    console.log('front production files already present');
    process.exit(0);
  }
  throw new Error(`빌드 원본 파일이 없습니다: ${source}`);
}

const original = fs.readFileSync(source, 'utf8');
const sourceHtml = original.replace(/^(<!DOCTYPE html>)\s*<!--[\s\S]*?-->\s*/, '$1\n');
const scripts = [...sourceHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const style = sourceHtml.match(/<style>([\s\S]*?)<\/style>/);
if (scripts.length !== scriptNames.length || !style) {
  throw new Error(`예상한 구조와 다릅니다: script ${scripts.length}, style ${style ? 1 : 0}`);
}

scripts.forEach((match, index) => {
  fs.writeFileSync(path.join(jsDir, scriptNames[index]), match[1].trimStart(), 'utf8');
});

const deployEnv = readEnv(path.join(project, '.env.firebase'));
if (deployEnv.FIREBASE_API_KEY || deployEnv.FIREBASE_AUTH_DOMAIN || deployEnv.FIREBASE_PROJECT_ID || deployEnv.FIREBASE_APP_ID) {
  const configPath = path.join(jsDir, 'config.js');
  let configSource = fs.readFileSync(configPath, 'utf8');
  const firebaseConfig = {
    apiKey: deployEnv.FIREBASE_API_KEY || '',
    authDomain: deployEnv.FIREBASE_AUTH_DOMAIN || '',
    projectId: deployEnv.FIREBASE_PROJECT_ID || '',
    appId: deployEnv.FIREBASE_APP_ID || ''
  };
  configSource = configSource.replace(
    /firebase:\s*\{[^}]*\}/,
    `firebase: ${JSON.stringify(firebaseConfig)}`
  );
  fs.writeFileSync(configPath, configSource, 'utf8');
}

const css = style[1]
  .replace('../fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF L.ttf', './fonts/Hakgyoansim-Nadeuri-L.ttf')
  .replace('../fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF B.ttf', './fonts/Hakgyoansim-Nadeuri-B.ttf')
  .replace('../fonts/Pretendard-1.3.9/web/variable/woff2/PretendardVariable.woff2', './fonts/PretendardVariable.woff2');
fs.writeFileSync(path.join(front, 'styles.css'), css.trimStart(), 'utf8');

let scriptIndex = 0;
let html = sourceHtml.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, () => {
  const name = scriptNames[scriptIndex++];
  return `<script src="./js/${name}"></script>`;
});
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="./styles.css">');
fs.writeFileSync(path.join(front, 'index.html'), html, 'utf8');

const copies = [
  ['mockup/assets/브랜드-워드마크.png', 'front/assets/브랜드-워드마크.png'],
  ['mockup/assets/지도-청귤나무.png', 'front/assets/지도-청귤나무.png'],
  ['mockup/assets/002.png', 'front/assets/002.png'],
  ['mockup/assets/char-l.png', 'front/assets/char-l.png'],
  ['mockup/assets/diary-crayon-icons.png', 'front/assets/diary-crayon-icons.png'],
  ['mockup/assets/favicon-2477d69ee1accb52dccf588f36f876ad.ico', 'front/assets/favicon-2477d69ee1accb52dccf588f36f876ad.ico'],
  ['fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF L.ttf', 'front/fonts/Hakgyoansim-Nadeuri-L.ttf'],
  ['fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF B.ttf', 'front/fonts/Hakgyoansim-Nadeuri-B.ttf'],
  ['fonts/Pretendard-1.3.9/web/variable/woff2/PretendardVariable.woff2', 'front/fonts/PretendardVariable.woff2'],
  ['fonts/Pretendard-1.3.9/LICENSE.txt', 'front/fonts/Pretendard-LICENSE.txt'],
];
copies.forEach(([from, to]) => fs.copyFileSync(path.join(project, from), path.join(project, to)));

console.log('front production files rebuilt');
