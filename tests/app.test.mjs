import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function createFrontendSandbox() {
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
  const context = {
    console,
    Date,
    Math,
    JSON,
    Promise,
    Error,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage,
    window: { addEventListener: () => {} },
    document: { hidden: false },
  };
  vm.createContext(context);
  for (const file of ['front/js/config.js', 'front/js/filter.js', 'front/js/backend.js']) {
    const code = fs.readFileSync(path.join(rootDir, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }
  return { context, localStorage };
}

test('인증: Google 로그인 및 로그아웃 세션 관리', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  const events = [];
  backend.onAuth((u) => events.push(u));
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(events.at(-1), null);

  const user = await backend.signInWithGoogle();
  assert.equal(user.uid, 'u_google_demo');
  const profile = await backend.getUser(user.uid);
  assert.equal(profile.email, user.email);
  assert.equal(profile.treeId, null);

  await backend.signOut();
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(events.at(-1), null);
});

test('한 계정 한 나무: 나무 생성, 가족 합류, 헤어지기(단독 삭제 vs 소유권 승계)', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  await backend.signInWithGoogle();

  const treeA = { id: '0-1', f: 0, n: 1, ownerUid: 'u1', members: ['u1'], chars: [{ id: 'c0', uid: 'u1', name: '하나' }], hearts: 0 };
  await backend.createTree('0-1', treeA);
  await assert.rejects(() => backend.createTree('0-1', treeA), (err) => err.code === 'tree/taken');

  await backend.joinTree('0-1', { members: ['u1', 'u2'], chars: [...treeA.chars, { id: 'c1', uid: 'u2', name: '둘' }] });
  await backend.detachTree('0-1', 'u1');
  const afterTransfer = await backend.getTree('0-1');
  assert.equal(afterTransfer.ownerUid, 'u2');
  assert.deepEqual(afterTransfer.members, ['u2']);

  await backend.detachTree('0-1', 'u2');
  const afterLastDetach = await backend.getTree('0-1');
  assert.equal(afterLastDetach, null);
});

test('우리 이야기(일기): 작성, 수정, 삭제 및 유해 표현 필터', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  assert.equal(context.Filter.bad('오늘 바람이 참 좋다'), false);
  assert.equal(context.Filter.bad('씨발'), true);

  await backend.saveDiary('tree-1', '2026-11-18__u1', {
    date: '2026-11-18',
    icon: 'tangerine',
    text: '첫 번째 이야기',
    uid: 'u1',
    comment: '나무 답장',
  });
  let rows = await backend.listDiary('tree-1');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, '첫 번째 이야기');

  await backend.saveDiary('tree-1', '2026-11-18__u1', {
    date: '2026-11-18',
    icon: 'sun',
    text: '수정한 이야기',
    uid: 'u1',
    comment: '나무 답장',
  });
  rows = await backend.listDiary('tree-1');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, '수정한 이야기');

  await backend.saveDiary('tree-1', '2026-11-18__u1', null);
  rows = await backend.listDiary('tree-1');
  assert.equal(rows.length, 0);
});

test('구름: 24시간 쿨다운, 만료 필터링 및 삭제', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  const user = await backend.signInWithGoogle();

  let latestClouds = [];
  backend.watchClouds((list) => { latestClouds = list; });

  const c1 = await backend.addCloud({ text: '잘 자라렴', uid: user.uid, ts: Date.now(), treeId: '0-1' });
  await assert.rejects(
    () => backend.addCloud({ text: '두 번째 구름', uid: user.uid, ts: Date.now(), treeId: '0-1' }),
    (err) => err.code === 'cloud/cooldown'
  );

  await new Promise((r) => setTimeout(r, 15));
  assert.equal(latestClouds.length, 1);
  assert.equal(latestClouds[0].id, c1.id);

  await backend.deleteCloud(c1.id);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(latestClouds.length, 0);
});

test('하트: 나무당 하루 1회 응원 제한', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  await backend.createTree('0-2', { id: '0-2', f: 0, n: 2, ownerUid: 'u1', members: ['u1'], chars: [], hearts: 0 });

  assert.equal(await backend.hearted('0-2', 'u2', '2026-11-18'), false);
  await backend.heart('0-2', 'u2', '2026-11-18');
  assert.equal(await backend.hearted('0-2', 'u2', '2026-11-18'), true);
  assert.equal((await backend.getTree('0-2')).hearts, 1);

  await assert.rejects(
    () => backend.heart('0-2', 'u2', '2026-11-18'),
    (err) => err.code === 'heart/already'
  );
  assert.equal((await backend.getTree('0-2')).hearts, 1);
});

test('회원 탈퇴: 단독 나무, 일기, 응원, 구름, 초대 코드 및 사용자 정보 정리', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  const user = await backend.signInWithGoogle();
  const treeId = 'virtual-' + user.uid;

  await backend.createTree(treeId, { id: treeId, f: 0, n: 999, ownerUid: user.uid, members: [user.uid], chars: [], hearts: 0 });
  await backend.setUser(user.uid, { treeId });
  await backend.saveDiary(treeId, '2026-11-18__' + user.uid, { date: '2026-11-18', icon: 'tangerine', text: '탈퇴 전 일기', uid: user.uid });
  await backend.addMessage(treeId, { text: '응원', uid: user.uid, ts: Date.now() });
  await backend.addCloud({ text: '안녕 구름', uid: user.uid, ts: Date.now(), treeId });
  await backend.createInvite('ABC123', { treeId, ownerUid: user.uid });

  await backend.deleteAccount();
  assert.equal(await backend.getUser(user.uid), null);
  assert.equal(await backend.getTree(treeId), null);
  assert.deepEqual(await backend.listDiary(treeId), []);
  assert.deepEqual(await backend.listMessages(treeId), []);
  assert.equal(await backend.getInvite('ABC123'), null);
});

test('서버 보안 헤더, 정적 캐시 정책 및 /api/diary-reply 입력 검증', async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;

    const homeRes = await fetch(`${base}/`);
    assert.equal(homeRes.status, 200);
    assert.equal(homeRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(homeRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(homeRes.headers.get('cross-origin-opener-policy'), 'same-origin-allow-popups');
    assert.ok(homeRes.headers.get('content-security-policy')?.includes("default-src 'self'"));
    assert.ok(homeRes.headers.get('content-security-policy')?.includes('https://www.googletagmanager.com'));
    assert.equal(homeRes.headers.get('x-powered-by'), null);

    const fontRes = await fetch(`${base}/fonts/PretendardVariable.woff2`);
    assert.equal(fontRes.status, 200);
    assert.match(fontRes.headers.get('cache-control') || '', /max-age=604800/);

    const cfgRes = await fetch(`${base}/js/config.js`);
    assert.equal(cfgRes.status, 200);
    assert.equal(cfgRes.headers.get('cache-control'), 'no-store');

    for (const svgPath of [
      '/assets/litttl-farm-map/02-roads.svg',
      '/assets/litttl-farm-map/foreground.svg',
      '/assets/litttl-farm-map/groves/grove-01.svg',
      '/assets/litttl-farm-map/groves/grove-12.svg',
    ]) {
      const svgRes = await fetch(`${base}${svgPath}`);
      assert.equal(svgRes.status, 200, svgPath);
      assert.match(svgRes.headers.get('cache-control') || '', /max-age=604800/);
    }

    const emptyReply = await fetch(`${base}/api/diary-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diaryText: '   ' }),
    });
    assert.equal(emptyReply.status, 400);

    const tooLongReply = await fetch(`${base}/api/diary-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diaryText: '가'.repeat(2001) }),
    });
    assert.equal(tooLongReply.status, 400);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('분석 동의 관리: 동의 전 이벤트 수집 차단, 동의 후 6종 이벤트 기록, 거부 시 재차단', async () => {
  const { context, localStorage } = createFrontendSandbox();
  const backend = context.DemoBackend();

  assert.equal(localStorage.getItem('litttlAnalyticsConsent'), null);
  assert.equal(backend.trackEvent('login', { method: 'google' }), false);
  assert.equal(backend.getAnalyticsEvents().length, 0);

  await backend.setAnalyticsConsent(false);
  assert.equal(localStorage.getItem('litttlAnalyticsConsent'), 'denied');
  assert.equal(backend.trackEvent('sign_up', { method: 'google' }), false);
  assert.equal(backend.getAnalyticsEvents().length, 0);

  await backend.setAnalyticsConsent(true);
  assert.equal(localStorage.getItem('litttlAnalyticsConsent'), 'granted');

  const designedEvents = [
    ['sign_up', { method: 'google' }],
    ['login', { method: 'google' }],
    ['tree_connect', { kind: 'physical_code' }],
    ['diary_save', { mode: 'create', has_reply: true }],
    ['cloud_post', { virtual: false }],
    ['heart_send', { tree_id: '0-1' }],
  ];
  for (const [name, params] of designedEvents) {
    assert.equal(backend.trackEvent(name, params), true);
  }
  assert.deepEqual(
    backend.getAnalyticsEvents().map((e) => e.name),
    designedEvents.map(([name]) => name)
  );

  await backend.setAnalyticsConsent(false);
  assert.equal(localStorage.getItem('litttlAnalyticsConsent'), 'denied');
  assert.equal(backend.trackEvent('heart_send', { tree_id: '0-2' }), false);
  assert.equal(backend.getAnalyticsEvents().length, 6);
});
