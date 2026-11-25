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
    assert.ok(homeRes.headers.get('content-security-policy')?.includes('https://analytics.google.com'));
    assert.equal(homeRes.headers.get('x-powered-by'), null);

    const fontRes = await fetch(`${base}/fonts/PretendardVariable.woff2`);
    assert.equal(fontRes.status, 200);
    assert.match(fontRes.headers.get('cache-control') || '', /max-age=604800/);

    const cfgRes = await fetch(`${base}/js/config.js`);
    assert.equal(cfgRes.status, 200);
    assert.equal(cfgRes.headers.get('cache-control'), 'no-store');
    const cfgBody = await cfgRes.text();
    assert.match(cfgBody, /"measurementId":"G-W1YW38ZSGB"/);
    const appletCfg = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase-applet-config.json'), 'utf8'));
    assert.equal(appletCfg.measurementId, 'G-W1YW38ZSGB');
    const staticCfg = fs.readFileSync(path.join(rootDir, 'front', 'js', 'config.js'), 'utf8');
    assert.match(staticCfg, /measurementId:\s*"G-W1YW38ZSGB"/);

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

  const backendSrc = fs.readFileSync(path.join(rootDir, 'front', 'js', 'backend.js'), 'utf8');
  assert.match(backendSrc, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.match(backendSrc, /send_to:mid/);
  assert.doesNotMatch(backendSrc, /firebase-analytics\.js/);
});

test('트러블 슈팅 및 D2Coding 폰트 정적 서빙/스타일 확인', async () => {
  const css = fs.readFileSync(path.join(rootDir, 'front', 'styles.css'), 'utf8');
  assert.match(css, /font-family:'D2Coding'/);
  assert.match(css, /--mono:'D2Coding'/);
  assert.match(css, /\.troubleshootCode\{[^}]*font-family:var\(--mono\)/);
  assert.match(css, /\.invite-code code\{[^}]*var\(--mono\)/);
  assert.match(css, /\.treeCodeRow input[^}]*font-family:var\(--mono\)/);

  const appJs = fs.readFileSync(path.join(rootDir, 'front', 'js', 'app.js'), 'utf8');
  assert.match(appJs, /yangdk02@gmail\.com/);
  assert.doesNotMatch(appJs, /오류 화면 예시 보기/);
  assert.doesNotMatch(appJs, /openSampleTroubleshoot/);
  assert.match(appJs, /openTroubleshoot/);
  assert.match(appJs, /txt\('button','mini','오류 내용 복사하기'\)/);
  assert.doesNotMatch(appJs, /bigBtn\('오류 내용 복사하기'/);
  assert.doesNotMatch(css, /\.troubleshootHead \.mini\{/);
  assert.doesNotMatch(appJs, /crayonDiaryIcon/);
  assert.match(appJs, /class="diaryIconArt"[^>]*viewBox="0 0 40 40"/);
  assert.match(appJs, /trees\/tree-0/);
  assert.doesNotMatch(css, /diary-crayon-icons\.png/);

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;
    for (const fontPath of [
      '/fonts/D2Coding-Ver1.4.0-20261003.ttf',
      '/fonts/D2CodingBold-Ver1.4.0-20261003.ttf',
    ]) {
      const res = await fetch(`${base}${fontPath}`);
      assert.equal(res.status, 200, fontPath);
      assert.match(res.headers.get('cache-control') || '', /max-age=604800/);
    }
    for (let v = 1; v <= 5; v += 1) {
      const treePath = `/assets/litttl-farm-map/trees/tree-0${v}.svg`;
      const res = await fetch(`${base}${treePath}`);
      assert.equal(res.status, 200, treePath);
      assert.match(res.headers.get('cache-control') || '', /max-age=604800/);
      const svgText = await res.text();
      assert.match(svgText, /<svg[^>]*viewBox="0 0 100 116"/);
      assert.match(svgText, /#23231D/);
      assert.match(svgText, /#528E29|#538D29/);
    }
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('관리자 데이터 정리: 회원 정리(단독/공유/고아/본인방어), 나무 삭제, 시드 정리 및 규칙 동기화', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  const admin = await backend.signInWithGoogle();

  await assert.rejects(
    () => backend.adminCleanupUser(admin.uid),
    (err) => err.code === 'admin/self-delete'
  );

  // 1) 단독 나무 회원 정리
  await backend.setUser('test_solo', { nick: '단독회원', email: 'solo@test.com', treeId: '1-1', invites: {} });
  await backend.createTree('1-1', {
    id: '1-1', f: 1, n: 1, ownerUid: 'test_solo', members: ['test_solo'],
    chars: [{ id: 'c1', uid: 'test_solo', name: '단독' }], hearts: 0,
  });
  await backend.saveDiary('1-1', '2026-11-18__test_solo', { date: '2026-11-18', icon: 'sun', text: '단독 일기', uid: 'test_solo' });
  await backend.addMessage('1-1', { text: '단독 응원', uid: 'test_solo', ts: Date.now() });
  await backend.addCloud({ text: '단독 구름', uid: 'test_solo', ts: Date.now(), treeId: '1-1' });
  await backend.createInvite('SOLO01', { treeId: '1-1', ownerUid: 'test_solo' });

  const soloRes = await backend.adminCleanupUser('test_solo');
  assert.equal(soloRes.ok, true);
  assert.equal(soloRes.deletedTrees, 1);
  assert.equal(await backend.getUser('test_solo'), null);
  assert.equal(await backend.getTree('1-1'), null);
  assert.deepEqual(await backend.listDiary('1-1'), []);
  assert.deepEqual(await backend.listMessages('1-1'), []);
  assert.equal(await backend.getInvite('SOLO01'), null);

  // 2) 가족 공유 나무 회원 정리 (방장 승계 및 남은 가족 일기 보존)
  await backend.setUser('test_drop', { nick: '나갈가족', email: 'drop@test.com', treeId: '1-2', invites: {} });
  await backend.setUser('keep_user', { nick: '남을가족', email: 'keep@test.com', treeId: '1-2', invites: {} });
  await backend.createTree('1-2', {
    id: '1-2', f: 1, n: 2, ownerUid: 'test_drop', members: ['test_drop', 'keep_user'],
    chars: [{ id: 'c1', uid: 'test_drop', name: '나감' }, { id: 'c2', uid: 'keep_user', name: '남음' }], hearts: 2,
  });
  await backend.saveDiary('1-2', '2026-11-18__test_drop', { date: '2026-11-18', icon: 'sun', text: '나갈 사람 일기', uid: 'test_drop' });
  await backend.saveDiary('1-2', '2026-11-18__keep_user', { date: '2026-11-18', icon: 'tangerine', text: '남을 가족 일기', uid: 'keep_user' });

  const sharedRes = await backend.adminCleanupUser('test_drop');
  assert.equal(sharedRes.deletedTrees, 0);
  assert.equal(await backend.getUser('test_drop'), null);
  const sharedTreeAfter = await backend.getTree('1-2');
  assert.equal(sharedTreeAfter.ownerUid, 'keep_user');
  assert.deepEqual(sharedTreeAfter.members, ['keep_user']);
  const keptDiaries = await backend.listDiary('1-2');
  assert.equal(keptDiaries.length, 1);
  assert.equal(keptDiaries[0].uid, 'keep_user');

  // 3) 고아 UID 정리 (users 문서 없이 나무/구름에만 남은 데이터)
  await backend.createTree('virtual-orphan', {
    id: 'virtual-orphan', f: 0, n: 999, virtual: true, ownerUid: 'ghost_uid', members: ['ghost_uid'], chars: [], hearts: 0,
  });
  await backend.addCloud({ text: '고아 구름', uid: 'ghost_uid', ts: Date.now(), treeId: 'virtual-orphan' });
  const ghostRes = await backend.adminCleanupUser('ghost_uid');
  assert.equal(ghostRes.deletedTrees, 1);
  assert.equal(await backend.getTree('virtual-orphan'), null);

  // 4) 특정 나무 삭제 + 연결 회원 treeId 해제
  const treeDelRes = await backend.adminDeleteTree('1-2');
  assert.equal(treeDelRes.ok, true);
  assert.equal(treeDelRes.clearedUsers, 1);
  assert.equal(await backend.getTree('1-2'), null);
  assert.equal((await backend.getUser('keep_user')).treeId, null);

  // 5) 시드 일괄 정리 제거 및 일반 회원 보존 확인
  assert.equal(typeof backend.adminCleanupSeed, 'undefined');
  const remainingUsers = await backend.adminListUsers();
  assert.ok(remainingUsers.some((u) => u.uid === admin.uid));
  assert.ok(remainingUsers.some((u) => u.uid === 'keep_user'));

  // 6) UI, CSS 및 Firestore 규칙 동기화 확인
  const indexHtml = fs.readFileSync(path.join(rootDir, 'front', 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(rootDir, 'front', 'js', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'front', 'styles.css'), 'utf8');
  const rootRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  const backRules = fs.readFileSync(path.join(rootDir, 'back', 'firestore.rules'), 'utf8');
  assert.match(indexHtml, /id="adminBtn"[^>]*hidden[\s\S]*id="help"/);
  assert.match(indexHtml, /id="mapAdminBtn"[^>]*hidden[\s\S]*id="mapHelp"/);
  assert.match(appJs, /openAdminMenu/);
  assert.match(appJs, /openAdminCleanup/);
  assert.match(appJs, /계정·나무 정리/);
  assert.doesNotMatch(appJs, /테스트 계정·나무 정리/);
  assert.doesNotMatch(appJs, /시드 · 테스트 데이터 한 번에 정리/);
  assert.doesNotMatch(appJs, /adminCleanupSeed/);
  assert.doesNotMatch(appJs, /시드 데이터를 한 번에 정리할 수 있어요/);
  assert.doesNotMatch(appJs, /오른쪽 위 물음표\(\?\) 버튼 왼쪽의 왕관 모양 관리자 버튼을 눌렀을 때 보이는 안내예요\./);
  assert.doesNotMatch(appJs, /4\. 우리 이야기\(일기\) 지우기와 답장 미리 보기/);
  assert.match(appJs, /4\. 계정·나무 정리하기/);
  assert.match(css, /#help,#mapHelp,#adminBtn,#mapAdminBtn/);
  assert.match(css, /\.adminCleanupSheet/);
  assert.match(css, /\.danger[^{]*\{[^}]*#c62828/);
  assert.match(css, /\.mini\.danger\{[^}]*#c62828/);
  assert.match(appJs, /leave\.classList\.add\('danger'\)/);
  assert.match(appJs, /txt\('button','mini danger','빼기'\)/);
  assert.equal(rootRules, backRules);
  assert.match(rootRules, /affectedKeys\(\)\.hasOnly\(\['treeId'\]\)/);
  assert.match(rootRules, /affectedKeys\(\)\.hasOnly\(\['members', 'chars', 'ownerUid', 'lastAct'\]\)/);
});

test('응원 관리: 나무 이야기 내 댓글 열람/작성자 본인 삭제, 중복 버튼 제거, 안내 문구 및 규칙 확인', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  await backend.createTree('2-1', { id: '2-1', f: 2, n: 1, ownerUid: 'owner_1', members: ['owner_1', 'fam_2'], chars: [], hearts: 0 });
  await backend.addMessage('2-1', { text: '반가워요 이웃님', fromName: '이웃1', uid: 'visitor_1', ts: Date.now() });
  await backend.addMessage('2-1', { text: '다른 이웃 글', fromName: '이웃2', uid: 'visitor_2', ts: Date.now() + 1 });

  let list = await backend.listMessages('2-1');
  assert.equal(list.length, 2);

  // 작성자(visitor_1) 본인 글만 삭제되는지 확인
  const mine = list.find((m) => m.uid === 'visitor_1');
  await backend.deleteMessage('2-1', mine.id);
  list = await backend.listMessages('2-1');
  assert.equal(list.length, 1);
  assert.equal(list[0].uid, 'visitor_2');

  const appJs = fs.readFileSync(path.join(rootDir, 'front', 'js', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'front', 'styles.css'), 'utf8');
  const rules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  assert.doesNotMatch(appJs, /guestbookAct/);
  assert.match(appJs, /appendOwnGuestbook\(openEdit\)/);
  assert.match(appJs, /bigBtn\('수정하기',openEditForm\)/);
  assert.match(appJs, /field\('응원 남기기'/);
  assert.match(appJs, /이웃이 남긴 응원/);
  assert.match(appJs, /openCheerDeleteConfirm/);
  assert.match(appJs, /m\.uid===me\.uid/);
  assert.doesNotMatch(appJs, /방명록/);
  assert.match(appJs, /이웃 나무·내 나무 응원 지우기/);
  assert.match(appJs, /var spot=F\[\+d\.dataset\.f\]\[0\]\+' '\+d\.dataset\.n\+'번'/);
  assert.match(appJs, /addSheetTitleTip\('다른 사람들에게 보여요\.'\)/);
  assert.match(css, /\.guestbookSection/);
  assert.match(css, /\.treeTip\{[^}]*font-family:var\(--read\)/);
  assert.doesNotMatch(css, /\.treeTip\{[^}]*font-family:var\(--hand\)/);
  assert.doesNotMatch(appJs, /txt\('button','del danger'/);
  assert.match(rules, /match \/messages\/\{messageId\}[\s\S]*allow delete:[\s\S]*resource\.data\.uid == uid\(\)[\s\S]*member\(id\)/);

  // 사용 방법 버튼 그림 삽입 및 최신 문구, 매뉴얼 동기화 확인
  assert.match(appJs, /tutorialBtnGrid/);
  assert.match(appJs, /tutorialBtnIcon/);
  ['ICON.pick', 'ICON.bug', 'ICON.hug', 'ICON.water', 'ICON.cloud', 'ICON.book', 'ICON.note', 'ICON.family', 'ICON.map', 'ICON.neighbor'].forEach((tok) => {
    assert.ok(appJs.includes(`{icon:${tok}`), `사용 방법에 ${tok} 버튼 그림이 포함되어야 합니다.`);
  });
  assert.match(appJs, /if\(myTreeId\(\)\) L\.append\(mineButton\(\)\);\s*L\.append\(act\('','neighbor','이웃 나무'/);
  assert.match(appJs, /function visitRandomNeighborTree\(opts\)/);
  assert.match(appJs, /날짜를 눌러 글을 남겨요\./);
  assert.doesNotMatch(appJs, /날짜를 눌러 그림과 글을 남겨요\./);
  assert.match(css, /\.tutorialBtnGrid/);
  assert.match(css, /\.tutorialBtnIcon/);

  const userGuide = fs.readFileSync(path.join(rootDir, 'USER_GUIDE.md'), 'utf8');
  const adminGuide = fs.readFileSync(path.join(rootDir, 'ADMIN_GUIDE.md'), 'utf8');
  assert.match(userGuide, /간단한 사용 방법/);
  assert.match(userGuide, /`내 나무` 아래에 있는 `이웃 나무` 버튼/);
  assert.match(userGuide, /응원/);
  assert.match(userGuide, /내가 남긴 응원은 글 오른쪽의 `지우기` 버튼으로 직접 삭제/);
  assert.match(adminGuide, /왕관 모양\(`관리자`\) 버튼/);
  assert.match(adminGuide, /계정과 나무 기록 정리하기 \(`계정·나무 정리`\)/);
  assert.doesNotMatch(adminGuide, /시드 데이터 한 번에 정리하기/);
  assert.match(adminGuide, /응원 지우기/);
  assert.match(adminGuide, /yangdk02@gmail\.com/);
});

test('알림 및 숨은 설정 5회 관리자 권한 요청/공유: 실시간 감시, 승인·거절·해제, UI/규칙 검증', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  const user = await backend.signInWithGoogle();

  // 1) watchDiary 실시간 감시
  let watchedDiaries = [];
  const unsubDiary = backend.watchDiary('tree-notif', (list) => { watchedDiaries = list; });
  await backend.saveDiary('tree-notif', '2026-11-24__' + user.uid, {
    date: '2026-11-24',
    icon: 'tangerine',
    text: '오늘 일기',
    uid: user.uid,
    comment: '나무 답장이 도착했어요.',
    replyReadyAt: Date.now() - 1000,
    replyGenerated: true,
  });
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(watchedDiaries.length, 1);
  assert.equal(watchedDiaries[0].comment, '나무 답장이 도착했어요.');
  unsubDiary();

  // 2) 관리자 권한 요청 -> 승인 -> 권한 공유 -> 해제
  let isUserAdmin = null;
  let myReq = null;
  let allReqs = [];
  const unsubStatus = backend.watchAdminStatus(user.uid, user.email, (v) => { isUserAdmin = v; });
  const unsubMyReq = backend.watchMyAdminRequest(user.uid, (r) => { myReq = r; });
  const unsubAllReqs = backend.watchAdminRequests((list) => { allReqs = list; });
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(isUserAdmin, false);
  assert.equal(myReq, null);
  assert.equal(allReqs.length, 0);

  const reqRes = await backend.requestAdminAccess({ uid: user.uid, email: user.email, nick: '귤나무지기' });
  assert.equal(reqRes.ok, true);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(myReq.status, 'pending');
  assert.equal(allReqs.length, 1);
  assert.equal(allReqs[0].uid, user.uid);

  const dupRes = await backend.requestAdminAccess({ uid: user.uid, email: user.email, nick: '귤나무지기' });
  assert.equal(dupRes.alreadyPending, true);

  await backend.approveAdminRequest(user.uid, myReq);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(isUserAdmin, true);
  assert.equal(myReq.status, 'approved');

  const admins = await backend.listAdmins();
  assert.ok(admins.some((a) => a.uid === user.uid && a.email === user.email));

  await assert.rejects(
    () => backend.revokeAdminAccess(user.uid),
    (err) => err.code === 'admin/self-revoke'
  );

  // 다른 요청자는 거절 후 재요청 가능 확인
  await backend.requestAdminAccess({ uid: 'u_other', email: 'other@litttl.farm', nick: '이웃회원' });
  await backend.rejectAdminRequest('u_other');
  await new Promise((r) => setTimeout(r, 15));
  const otherAfterReject = allReqs.find((r) => r.uid === 'u_other');
  assert.equal(otherAfterReject.status, 'rejected');

  await backend.signOut();
  await backend.revokeAdminAccess(user.uid);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(isUserAdmin, false);
  unsubStatus();
  unsubMyReq();
  unsubAllReqs();

  // 3) HTML, CSS, JS, 안내서 및 Firestore 규칙 확인
  const indexHtml = fs.readFileSync(path.join(rootDir, 'front', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'front', 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(rootDir, 'front', 'js', 'app.js'), 'utf8');
  const rootRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  const backRules = fs.readFileSync(path.join(rootDir, 'back', 'firestore.rules'), 'utf8');
  const userGuide = fs.readFileSync(path.join(rootDir, 'USER_GUIDE.md'), 'utf8');
  const adminGuide = fs.readFileSync(path.join(rootDir, 'ADMIN_GUIDE.md'), 'utf8');

  assert.match(indexHtml, /id="notifBtn"[^>]*hidden[\s\S]*id="help"/);
  assert.match(indexHtml, /id="mapNotifBtn"[^>]*hidden[\s\S]*id="mapHelp"/);
  assert.match(indexHtml, /id="notifAlert"[^>]*hidden/);
  assert.match(css, /#notifBtn,#mapNotifBtn/);
  assert.match(css, /\.notifAlert\{/);
  assert.match(css, /\.notifSheet\{/);
  assert.match(appJs, /settingsTapCount>=5/);
  assert.match(appJs, /titleEl\.onclick=onSettingsTitleTap/);
  assert.doesNotMatch(appJs, /helpTapCount|onHelpClick|resetHelpTapState/);
  assert.match(appJs, /관리자 계정으로 전환하시겠습니까\?/);
  assert.match(appJs, /관리자 권한 요청이 왔어요/);
  assert.match(appJs, /내 나무에 새 댓글이 달렸어요/);
  assert.match(appJs, /내 일기에 나무의 답장이 달렸어요/);
  assert.match(appJs, /openNotifications/);
  assert.doesNotMatch(appJs, /관리자 권한 요청을 확인할 수 있어요/);
  assert.match(appJs, /확인하지 않은 알림/);
  assert.match(appJs, /확인한 알림/);
  assert.match(appJs, /previewNotifText/);
  assert.match(css, /\.notifTabs\{/);
  assert.match(css, /\.notifItemBody\{[^}]*-webkit-line-clamp:2/);
  assert.match(appJs, /openAdminAccessSheet/);
  assert.doesNotMatch(appJs, /알림 확인하기/);
  assert.match(appJs, /function openMapTree\(f,n\)\{ if\(isAdmin\(\)\)/);
  assert.doesNotMatch(appJs, /방명록/);
  assert.doesNotMatch(userGuide, /관리자 계정으로 전환/);
  assert.doesNotMatch(userGuide, /5번/);
  assert.match(userGuide, /종 모양\(`알림`\) 버튼/);
  assert.match(adminGuide, /‘설정’ 글자를 연속으로 5번/);
  assert.doesNotMatch(adminGuide, /물음표\(`\?`\) 버튼을 연속으로 5번/);
  assert.match(adminGuide, /1부\. 개발자가 따로 없는 경우/);
  assert.match(adminGuide, /2부\. 개발자가 따로 있는 경우/);
  assert.match(adminGuide, /git clone/);
  assert.match(adminGuide, /전체 공지 보내기/);
  assert.match(userGuide, /확인하지 않은 알림/);
  assert.match(userGuide, /확인한 알림/);
  assert.match(userGuide, /공지/);
  assert.equal(rootRules, backRules);
  assert.match(rootRules, /function primaryAdmin\(\)/);
  assert.match(rootRules, /match \/admins\/\{id\}/);
  assert.match(rootRules, /match \/adminRequests\/\{id\}/);
  assert.match(rootRules, /function isValidNotice\(data\)/);
  assert.match(rootRules, /match \/notices\/\{id\}/);
});

test('관리자 전체 공지 발송: 작성, 실시간 구독, 삭제 및 스키마 검증', async () => {
  const { context } = createFrontendSandbox();
  const backend = context.DemoBackend();
  await backend.signInWithGoogle();

  let noticed = [];
  const unsub = backend.watchNotices((list) => { noticed = list; });
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(noticed.length, 0);

  await assert.rejects(
    () => backend.createNotice({ title: '  ', body: '내용' }),
    (err) => err.code === 'notice/empty'
  );

  const created = await backend.createNotice({
    title: '수확 체험 안내',
    body: '이번 주말 벼락밭에서 감귤 수확 체험이 열립니다.',
    createdByName: '엉클리틀',
  });
  assert.ok(created.id);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(noticed.length, 1);
  assert.equal(noticed[0].title, '수확 체험 안내');

  await backend.deleteNotice(created.id);
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(noticed.length, 0);
  unsub();

  const appJs = fs.readFileSync(path.join(rootDir, 'front', 'js', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'front', 'styles.css'), 'utf8');
  const blueprint = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase-blueprint.json'), 'utf8'));
  assert.match(appJs, /openAdminNoticeSheet/);
  assert.match(appJs, /field\('공지 제목','input'/);
  assert.match(appJs, /field\('공지 내용','textarea'/);
  assert.match(appJs, /전체 공지 보내기/);
  assert.match(appJs, /openNoticeDetail/);
  assert.match(css, /\.noticeDetailBox\{/);
  assert.match(css, /\.adminNoticeForm\{/);
  assert.ok(blueprint.entities.Notice);
  assert.ok(blueprint.firestore['/notices/{noticeId}']);
});



