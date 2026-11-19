import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(project, 'front', 'js', 'config.js');
const htmlPath = path.join(project, 'front', 'index.html');

const errors = [];
if (!fs.existsSync(htmlPath)) errors.push('front/index.html이 없습니다. 먼저 npm run build를 실행하세요.');
if (!fs.existsSync(configPath)) {
  errors.push('front/js/config.js가 없습니다. 먼저 npm run build를 실행하세요.');
} else {
  const source = fs.readFileSync(configPath, 'utf8');
  for (const key of ['apiKey', 'authDomain', 'projectId', 'appId', 'firestoreDatabaseId']) {
    const match = source.match(new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']*)["']`));
    if (!match || !match[1].trim()) errors.push(`Firebase ${key} 값이 비어 있습니다.`);
  }
}

if (errors.length) {
  console.error('배포 준비가 끝나지 않았습니다.');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('배포 전 필수 설정 확인 완료');
