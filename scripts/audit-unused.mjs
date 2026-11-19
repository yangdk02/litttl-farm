import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const rel = (file) => path.relative(project, file).replaceAll('\\', '/');

const mockup = walk(path.join(project, 'mockup')).map(rel);
const fonts = walk(path.join(project, 'fonts')).map(rel);
const usedMockup = new Set([
  'mockup/litttl-farm.html',
  'mockup/assets/브랜드-워드마크.png',
  'mockup/assets/지도-청귤나무.png',
]);
const usedFonts = new Set([
  'fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF L.ttf',
  'fonts/학교안심 나들이/Hakgyoansim Nadeuri TTF B.ttf',
  'fonts/Pretendard-1.3.9/web/variable/woff2/PretendardVariable.woff2',
  'fonts/Pretendard-1.3.9/LICENSE.txt',
]);

const unusedMockup = mockup.filter((file) => !usedMockup.has(file));
const unusedFonts = fonts.filter((file) => !usedFonts.has(file));
const lines = [
  '# 현재 앱에서 사용하지 않는 파일',
  '',
  '> `mockup/litttl-farm.html`과 배포용 `front`의 실제 참조를 기준으로 작성했습니다. 파일은 삭제하지 않았습니다. 원본 디자인 기록이 필요하면 별도로 보관하세요.',
  '',
  '## mockup 폴더',
  '',
  ...unusedMockup.map((file) => `- \`${file}\``),
  '',
  '## fonts 폴더',
  '',
  ...unusedFonts.map((file) => `- \`${file}\``),
  '',
  '## 계속 사용하는 파일',
  '',
  ...[...usedMockup, ...usedFonts].map((file) => `- \`${file}\``),
  '',
];
fs.writeFileSync(path.join(project, 'UNUSED-FILES.md'), lines.join('\n'), 'utf8');
console.log(`unused list written: mockup ${unusedMockup.length}, fonts ${unusedFonts.length}`);
