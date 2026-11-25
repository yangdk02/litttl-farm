/* 아래는 동작 코드입니다. 문구와 숫자만 바꾸려면 위 CONFIG만 고치면 됩니다. */
var Game = { fruitMax:function(){ return CONFIG.fruitMax; } };
(function(){
'use strict';
if('scrollRestoration' in history) history.scrollRestoration='manual';
var $=function(id){ return document.getElementById(id); };
var F=CONFIG.forests, RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var B=null, me=null, meDoc=null, view=null, T=null, landing=false, authResolved=false, openStoryAfterEnter=false, authTicket=0, authPopupTimer=null, tutorialAfterClose=null;
var ANALYTICS_CONSENT_KEY='litttlAnalyticsConsent', authSessionTrackedUid=null;
function getAnalyticsConsent(){ try{ var v=localStorage.getItem(ANALYTICS_CONSENT_KEY); return (v==='granted'||v==='denied')?v:''; }catch(e){ return ''; } }
function setAnalyticsConsent(choice){
  var val=choice==='granted'?'granted':'denied';
  try{ localStorage.setItem(ANALYTICS_CONSENT_KEY,val); }catch(e){}
  if(B&&B.setAnalyticsConsent) B.setAnalyticsConsent(val==='granted').catch(function(){});
  var banner=$('consentBanner'); if(banner) banner.hidden=true;
  return val;
}
function trackEvent(name,params){
  if(getAnalyticsConsent()!=='granted'||!B||typeof B.trackEvent!=='function') return false;
  return B.trackEvent(name,params||{});
}
function renderConsentBanner(){
  var banner=$('consentBanner'); if(!banner) return;
  if(getAnalyticsConsent()){ banner.hidden=true; banner.innerHTML=''; return; }
  banner.innerHTML='';
  banner.appendChild(txt('p','','서비스 이용 통계를 위해 분석 쿠키를 사용할 수 있어요. 동의하기 전까지 분석 쿠키와 이벤트 수집은 차단됩니다.'));
  var acts=el('div','consentBannerActs');
  var decline=txt('button','mini','거부'); decline.type='button';
  decline.onclick=function(){ setAnalyticsConsent('denied'); toast('분석 쿠키를 차단했어요.'); };
  var accept=txt('button','mini accept','동의'); accept.type='button';
  accept.onclick=function(){ setAnalyticsConsent('granted'); toast('분석 쿠키 사용에 동의했어요.'); };
  acts.append(decline,accept); banner.appendChild(acts); banner.hidden=false;
}
function openAnalyticsSettings(){
  var cur=getAnalyticsConsent();
  var stateText=cur==='granted'?'현재 상태: 동의함 (필수 이벤트 수집 허용)':(cur==='denied'?'현재 상태: 거부함 (분석 쿠키·이벤트 차단 중)':'현재 상태: 선택 전 (동의 전 기본 차단 중)');
  openSheet('분석 쿠키 설정','동의 전에는 분석 쿠키와 이벤트 수집이 모두 차단되며, 언제든 설정을 바꿀 수 있습니다.');
  sheet.classList.add('legalSheet','analyticsSheet');
  var doc=el('div','legalDoc');
  doc.innerHTML='<p><strong>'+stateText+'</strong></p><p>수집 항목: 가입, 로그인, 나무 연결, 일기 저장, 구름 띄우기, 하트 남기기 이벤트입니다. 일기 본문이나 이메일 주소 등 개인 입력 내용은 수집하지 않습니다.</p>';
  sheet.appendChild(doc);
  var a=actions();
  a.append(
    ghostBtn('거부하고 차단하기',function(){ setAnalyticsConsent('denied'); sheet.close(); toast('분석 쿠키와 이벤트 수집을 차단했어요.'); }),
    bigBtn('동의하고 허용하기',function(){ setAnalyticsConsent('granted'); sheet.close(); toast('분석 쿠키 사용에 동의했어요.'); })
  );
}

/* ---------- 그림 ---------- */
var FRUIT='<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="var(--tangerine)" d="M20 8c9-1 15 5 15 13s-7 14-15 14S5 29 5 21 11 9 20 8z"/><path d="M20 9c0-3 1-5 3-6" stroke="#000" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';
var HEART='<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M20 35C8 26 3 20 4 13c1-7 11-9 16-1 5-8 15-6 16 1 1 7-4 13-16 22z"/></svg>';
var S34='fill="none" stroke="#000" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"';
var ICON={
  tree:'<svg viewBox="0 0 48 48" '+S34+'><path d="M9 31c-6-8 1-15 8-13 1-8 12-11 17-4 8-1 11 9 6 15-7 6-23 7-31 2z" fill="#4b9657"/><path d="M22 30v13h7V30" fill="#8b613b"/></svg>',
  map:'<svg viewBox="0 0 48 48" '+S34+'><path d="M6 12l12-5 12 5 12-5v29l-12 5-12-5-12 5z"/><path d="M18 7v29M30 12v29"/></svg>',
  book:'<svg viewBox="0 0 48 48" '+S34+'><path d="M24 13C19 8 11 8 5 10v28c6-2 14-2 19 3 5-5 13-5 19-3V10c-6-2-14-2-19 3z"/><path d="M24 13v28"/></svg>',
  hug:'<svg viewBox="0 0 48 48" '+S34+'><path fill="#000" stroke="none" d="M24 31c-7-5-10-9-9-13 1-4 7-5 9-1 2-4 8-3 9 1 1 4-2 8-9 13z"/><path d="M8 18c-5 13 3 25 16 25s21-12 16-25"/></svg>',
  pick:'<svg viewBox="0 0 40 40">'+FRUIT.replace(/<\/?svg[^>]*>/g,'')+'</svg>',
  bug:'<svg viewBox="0 0 48 48" fill="#000" stroke="#000" stroke-width="2.8" stroke-linecap="round"><circle cx="11" cy="28" r="7"/><circle cx="21" cy="26" r="7.5"/><circle cx="31" cy="27" r="7"/><circle cx="39" cy="24" r="6"/><path d="M41 19l3-7M36 19l-1-7" fill="none"/><path d="M11 35v5M21 34v6M31 34v6" fill="none"/></svg>',
  cloud:'<svg viewBox="0 0 48 48" '+S34+'><path d="M13 37C5 37 3 28 9 25c-2-8 9-13 14-7 4-6 15-3 15 5 7 2 7 14-2 14z"/></svg>',
  note:'<svg viewBox="0 0 48 48" '+S34+'><path d="M7 9h34v24H22l-9 8v-8H7z"/><path d="M15 18h18M15 25h12"/></svg>',
  family:'<svg viewBox="0 0 48 48" fill="#000"><path d="M6 44c-1-11-2-18 0-24 3-11 15-11 18 0 2 6 1 13 0 24z"/><circle cx="12" cy="24" r="2.6" fill="#fff"/><circle cx="19" cy="24" r="2.6" fill="#fff"/><path d="M27 44c-1-8-1-12 0-16 2-8 13-8 15 0 1 4 1 8 0 16z" fill="#fff" stroke="#000" stroke-width="3"/><circle cx="32" cy="31" r="1.8"/><circle cx="37" cy="31" r="1.8"/></svg>'
};
var SPRAY='<path d="M10 10L6 3M18 7l1-7M25 13l5-5" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none"/>';
var CAN='<svg viewBox="0 0 120 90" aria-hidden="true"><g fill="#fff" stroke="#000" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"><path d="M46 28h52l5 54H42z"/><path d="M46 46L14 25"/><path d="M4 19l15-6 3 13-13 6z"/><path d="M100 38c20-3 20 28 2 32" fill="none"/><path d="M58 28c0-22 28-22 29 0" fill="none"/></g></svg>';
ICON.water=CAN.replace('</svg>',SPRAY+'</svg>');
var CLOUD_PATH='M42 96C22 101 6 90 9 74c2-10 9-17 19-20-7-12-2-27 11-33 12-6 25-2 32 8 7-18 34-25 51-10 13-10 37-6 44 10 17-11 43-4 47 15 18 1 29 14 25 27-3 13-19 20-34 17-13 11-35 12-50 3-17 11-44 10-58 0-13 9-35 8-47-2z';
var CLOUD='<svg class="pencilCloud" viewBox="0 0 240 110" preserveAspectRatio="none" aria-hidden="true"><path class="paper" d="'+CLOUD_PATH+'"/><path class="pencil" d="'+CLOUD_PATH+'" transform="translate(.8 -.6)"/><path class="ghost" d="'+CLOUD_PATH+'" transform="translate(-.7 .9)"/></svg>';
var LINK_CLOUD_PATHS=[CLOUD_PATH,'M24 91C5 83 8 61 25 54C17 36 35 19 53 27C62 8 91 8 103 25C119 9 147 13 154 33C173 22 201 35 198 56C221 62 223 88 202 96C181 104 157 98 142 96C120 108 92 102 78 96C59 104 38 101 24 91Z','M22 92C5 85 7 63 23 54C16 35 34 19 54 24C66 8 96 8 112 21C128 8 158 10 172 24C191 20 212 31 213 51C229 57 231 80 215 92C201 102 180 102 165 96C146 105 123 104 108 97C89 105 67 102 54 96C40 102 29 99 22 92Z','M33 98C11 96 5 75 19 61C10 43 30 24 49 31C55 10 86 7 100 25C116 9 143 15 151 34C169 20 198 31 202 52C224 55 231 80 214 93C197 106 171 99 158 94C139 108 108 105 91 96C72 106 50 105 33 98Z','M20 94C2 82 11 59 29 55C22 35 42 18 61 29C72 8 103 11 113 30C132 14 160 22 167 42C185 28 211 43 208 65C226 74 216 99 195 100C175 104 158 96 145 92C124 106 96 104 80 95C60 104 36 103 20 94Z'];
function landingCloudShape(i){ var p=LINK_CLOUD_PATHS[i%LINK_CLOUD_PATHS.length]; return '<svg class="pencilCloud" viewBox="0 0 240 110" preserveAspectRatio="none" aria-hidden="true"><path class="paper" d="'+p+'"/><path class="pencil" d="'+p+'" transform="translate(.8 -.6)"/><path class="ghost" d="'+p+'" transform="translate(-.7 .9)"/></svg>'; }
var FACE='<svg id="face" viewBox="0 0 84 60" data-mood="calm" aria-hidden="true"><g fill="none" stroke="#000" stroke-width="4" stroke-linecap="round">'
 +'<g class="m calm"><circle cx="24" cy="18" r="3.4" fill="#000"/><circle cx="58" cy="18" r="3.4" fill="#000"/><path d="M36 30c3 4 8 4 11 0"/></g>'
 +'<g class="m happy"><path d="M16 21c4-7 12-7 16 0M50 21c4-7 12-7 16 0"/><path d="M28 31c6 14 22 14 28 0z" fill="#000"/></g>'
 +'<g class="m sad"><path d="M16 16c4 5 12 5 16 2M50 18c4 3 12 3 16-2"/><path d="M34 40c4-7 12-7 16 0"/><path d="M22 27v9M60 27v9"/></g></g></svg>';

function isDark(hex){ var n=parseInt(String(hex||'#000').slice(1),16); return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)<128; }
var W3='stroke="#000" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
var HATS={
  tangerine:'<path fill="var(--tangerine)" d="M40 2c10-1 16 4 16 11s-7 12-16 12-16-5-16-12S30 3 40 2z"/><path d="M40 4c0-3 1-5 3-6" stroke="#000" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  straw:'<path d="M22 27c0-27 36-27 36 0" fill="#fff" '+W3+'/><ellipse cx="40" cy="27" rx="36" ry="7" fill="#fff" '+W3+'/><path d="M22 21c12 4 24 4 36 0" fill="none" stroke="#000" stroke-width="3.6"/>',
  beanie:'<circle cx="40" cy="8" r="6" fill="#fff" '+W3+'/><path d="M17 37C18 6 62 6 63 37z" fill="#fff" '+W3+'/><rect x="14" y="32" width="52" height="10" rx="4" fill="#fff" '+W3+'/>',
  ribbon:'<path d="M58 28l-18-11v22zM58 28l18-11v22z" fill="#fff" '+W3+'/><circle cx="58" cy="28" r="4.5" fill="#000"/>',
  sprout:'<path d="M40 25V10" fill="none" stroke="#000" stroke-width="3.4" stroke-linecap="round"/><path d="M40 12C30 2 20 4 16 8c6 8 16 10 24 4zM40 10c6-9 16-11 23-8-4 9-14 13-23 8z" fill="#fff" '+W3+'/>'
};
function faceAcc(k,line){
  if(k==='glasses') return '<g fill="none" stroke="'+line+'" stroke-width="3"><circle cx="31" cy="46" r="11.5"/><circle cx="51" cy="46" r="11.5"/><path d="M42 45h-2"/></g>';
  if(k==='shades') return '<g stroke="'+line+'" stroke-width="2.4" fill="#000"><rect x="19" y="38" width="20" height="15" rx="6"/><rect x="42" y="38" width="20" height="15" rx="6"/></g><path d="M39 44h3" stroke="'+line+'" stroke-width="3"/>';
  if(k==='scarf') return '<path d="M48 76l3 24h13l-3-26z" fill="#fff" '+W3+'/><path d="M16 65c16 8 32 8 48 0v13c-16 8-32 8-48 0z" fill="#fff" '+W3+'/><path d="M26 69v12M38 71v12M52 69v12" stroke="#000" stroke-width="2.4"/>';
  if(k==='mustache') return '<path d="M40 60c-6-7-15-6-19 1 8 3 15 2 19-1zM40 60c6-7 15-6 19 1-8 3-15 2-19-1z" fill="'+line+'"/>';
  return '';
}
function keeper(c){
  c=c||{}; var col=/^#[0-9a-fA-F]{6}$/.test(c.color||'')?c.color:'#000000', dark=isDark(col), line=dark?'#fff':'#000';
  return '<svg viewBox="0 0 80 112" style="display:block;overflow:visible" aria-hidden="true">'
   +'<g class="umb"><path d="M72 96V-6" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M28 2C30-42 114-42 116 2c-8-7-14-7-22 0-7-7-14-7-22 0-8-7-14-7-22 0-7-7-14-7-22 0z" fill="#fff" stroke="#000" stroke-width="3.6" stroke-linejoin="round"/></g>'
   +'<path fill="'+col+'" stroke="#000" stroke-width="3" d="M18 104c-3-23-5-45 0-60C24 18 56 18 62 44c5 15 3 37 0 60-1 7-14 7-16 0l-1-9h-9l-2 9c-2 7-15 7-16 0z"/>'
   +'<g class="eo"><circle cx="31" cy="46" r="7.5" fill="#fff" stroke="#000" stroke-width="'+(dark?0:2)+'"/><circle cx="51" cy="46" r="7.5" fill="#fff" stroke="#000" stroke-width="'+(dark?0:2)+'"/><circle cx="33" cy="47" r="3.6" fill="#000"/><circle cx="53" cy="47" r="3.6" fill="#000"/></g>'
   +'<path d="M58 53c10 1 15 5 7 10-5 3-10 1-13-1" fill="'+col+'" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
   +'<g class="es" fill="none" stroke="'+line+'" stroke-width="3.6" stroke-linecap="round"><path d="M24 47c4 4 10 4 14 0M44 47c4 4 10 4 14 0"/></g>'
   +'<g class="arms" fill="none" stroke-linecap="round"><path d="M58 72c26-8 54-6 76 10-6 7-14 9-22 7" stroke="#000" stroke-width="13"/><path d="M58 72c26-8 54-6 76 10-6 7-14 9-22 7" stroke="'+col+'" stroke-width="8"/></g>'
   +faceAcc(c.face,line)+(HATS[c.head]||'')+'</svg>';
}

/* ---------- 나무 모양 ---------- */
function rng(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
var BUGSPOTS=[[136,246],[262,240],[96,150],[304,150],[196,330],[210,80]];
var BLOBS=[[200,172,108],[122,192,76],[278,192,76],[152,112,72],[250,112,72],[160,244,62],[242,244,62],[72,168,56],[328,168,56],[200,62,58]];
function canopy(seed){ var r=rng(seed), n=Math.min(9,BLOBS.length); return BLOBS.slice(0,n).map(function(b){ return [b[0]+(r()-.5)*18,b[1]+(r()-.5)*16,b[2]*(.92+r()*.16)]; }); }
function circles(blobs,attr){ return blobs.map(function(b){ return '<circle cx="'+b[0].toFixed(1)+'" cy="'+b[1].toFixed(1)+'" r="'+b[2].toFixed(1)+'" '+attr+'/>'; }).join(''); }
function treeBody(blobs){
  return '<svg class="body" viewBox="0 0 400 480" aria-hidden="true"><path filter="url(#rough)" fill="#fff" stroke="#000" stroke-width="6" stroke-linejoin="round" d="M164 464c9-40 16-82 7-126l-38-68 26-12 41 58 38-66 27 12-42 80c-8 42 2 84 12 122-24 5-48 5-71 0z"/>'
   +'<g filter="url(#paintBase)" fill="#fff">'+circles(blobs,'')+'</g><g filter="url(#paint)">'+circles(blobs,'fill="#5f5f5f" opacity=".8"')+'</g></svg>';
}
function spots(seed,blobs,count){
  var r=rng(seed+99), out=[], tries=0;
  while(out.length<count&&tries++<3000){
    var b=blobs[Math.floor(r()*blobs.length)], a=r()*6.283, d=Math.sqrt(r())*b[2]*.84, x=b[0]+Math.cos(a)*d, y=b[1]+Math.sin(a)*d;
    if(x>112&&x<288&&y>108&&y<212) continue;
    if(out.concat(BUGSPOTS).some(function(p){ return Math.hypot(p[0]-x,p[1]-y)<38; })) continue;
    out.push([x,y]);
  }
  return out;
}

function today(){ return dateKey(new Date()); }
function dateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
var TREE_REPLIES=[
  '오늘 네가 들려준 이야기를 잎사귀 사이에 잘 간직해 둘게. 천천히 쉬어가도 괜찮아.',
  '네 마음이 여기까지 따뜻하게 전해졌어. 내일도 같은 자리에서 조용히 기다릴게.',
  '기쁜 날도 조금 서러운 날도 모두 소중한 계절이야. 오늘 이야기해 줘서 고마워.',
  '바람이 불 때마다 네가 남긴 말을 떠올릴게. 우리 함께 서두르지 말고 자라자.',
  '오늘 하루도 정말 애썼어. 내 그늘 아래에서는 잠시 마음을 내려놓아도 괜찮아.'
];
function treeReplyInfo(key,entry){
  if(!entry) return {text:'',waiting:false,remain:0};
  if(!entry.comment){
    if(entry.replyGenerated&&entry.createdAt&&!isAdmin()){
      var fallbackReady=entry.createdAt+24*60*60*1000, fallbackRemain=fallbackReady-Date.now();
      if(fallbackRemain>0) return {text:'나무가 오늘의 이야기를 읽고 있어요. 답장이 올 때까지 '+remainingTime(fallbackRemain)+' 기다려야 해요.',waiting:true,remain:fallbackRemain};
    }
    return {text:'',waiting:false,remain:0};
  }
  var readyAt=entry.replyReadyAt!=null?Number(entry.replyReadyAt):((entry.createdAt||new Date(key+'T00:00:00').getTime())+24*60*60*1000);
  var remain=readyAt-Date.now();
  if(!isAdmin()&&remain>0) return {text:'나무가 오늘의 이야기를 읽고 있어요. 답장이 올 때까지 '+remainingTime(remain)+' 기다려야 해요.',waiting:true,remain:remain};
  return {text:entry.comment,waiting:false,remain:0};
}
function treeCommentFor(key,entry){
  var info=treeReplyInfo(key,entry);
  return info.waiting?'':(info.text||'');
}
function requestDiaryReply(text,iconKey){
  var endpoint=CONFIG.diaryReplyEndpoint||'/api/diary-reply';
  return fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      diaryText:text,
      treeName:(T&&T.name)||'',
      authorName:(myChar()&&myChar().name)||(meDoc&&meDoc.nick)||'가족',
      iconLabel:diaryIconLabel(iconKey)
    })
  }).then(function(r){
    if(r.status===404||r.status===405) return {unavailable:true,reply:''};
    return r.json().catch(function(){ return {}; }).then(function(data){
      if(!r.ok) throw new Error((data&&data.error)||'나무의 답장을 받아오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      var reply=String((data&&data.reply)||'').trim();
      if(!reply) throw new Error('나무의 답장을 받아오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      return {unavailable:false,reply:reply};
    });
  });
}
function diaryExamples(){
  var base=new Date(), rows=[
    [-2,'🍊','아침에 창문을 열자 찬 공기가 방 안으로 한꺼번에 들어왔다. 어제보다 겨울이 가까워진 냄새가 났다. 출근 준비를 하면서 나무 화면을 열었는데 주황색 귤이 하나 더 생겨 있었다. 실제 밭에서는 바람을 맞으며 천천히 익고 있을 텐데, 작은 화면 속 변화가 이상할 만큼 반가웠다. 엄마에게 사진을 보내니 어릴 때 귤을 까 주시던 이야기가 이어졌다. 껍질을 길게 끊지 않고 벗기면 소원이 이루어진다고 믿었던 날들, 손끝에 남은 향을 이불에 묻히며 잠들던 날들. 오늘은 바쁘다는 이유로 미뤄둔 안부 전화를 먼저 걸었다. 나무를 키운다는 건 어쩌면 자주 잊는 사람과 계절을 다시 바라보는 일인지도 모르겠다.'],
    [-5,'☂','하루 종일 비가 내렸다. 약속이 취소되어 서운했지만 집으로 돌아오는 길에는 젖은 돌담과 짙어진 나뭇잎 색이 오래 눈에 남았다. 우산 끝에서 떨어지는 물방울을 세며 걷다가 우리 나무도 지금 같은 비를 맞고 있을까 생각했다. 화면에서 물주기 버튼을 누르려다 오늘은 하늘이 충분히 돌봐 주고 있다는 생각에 손을 멈췄다. 저녁에는 따뜻한 차를 끓여 놓고 가족들이 남긴 짧은 메시지를 읽었다. 각자 다른 곳에서 보낸 하루가 한 나무 아래 모여 있었다. 기분이 가라앉은 날에도 누군가 같은 비를 보고 있다는 사실은 조용한 위로가 된다. 비가 그치면 잎 끝에 맺힌 물방울이 얼마나 반짝일지 상상하며 오늘을 접어 둔다.'],
    [-9,'☺','아이가 학교에서 돌아오자마자 나무 이름을 불렀다. 오늘은 자기가 귤을 따겠다고 해서 화면을 건네주었더니, 한 개씩 조심스럽게 누르며 정말 바구니에 담기는 것처럼 숫자를 세었다. 열 번째 귤을 따고는 제주에 가면 가장 먼저 나무에게 자기 이름을 알려 주겠다고 말했다. 아직 제주 밭의 나무 앞에 서 본 적은 없지만 아이에게는 벌써 오래된 친구가 된 모양이다. 저녁 식탁에서는 귤껍질로 작은 별을 만들었고, 실패한 조각까지 접시에 한참 늘어놓았다. 평범한 하루였는데도 기록하려고 돌아보니 웃었던 장면이 여러 개 있었다. 커다란 사건보다 이런 작은 기쁨이 우리 가족의 시간을 채우고 있다는 걸 잊지 않으려고 오늘의 그림은 웃는 얼굴로 골랐다.'],
    [-16,'♡','멀리 사는 언니와 오랜만에 통화했다. 둘 다 바쁘다는 말을 핑계로 안부가 짧아졌는데, 언니가 먼저 나무에 구름을 하나 띄웠다고 알려 왔다. “잘 지내줘서 고마워”라는 스무 자도 안 되는 문장이 화면을 지나가는 동안 마음이 오래 머물렀다. 우리는 어릴 때 겨울이면 한 이불 속에서 귤을 까 먹었고, 누가 더 하얀 심을 깨끗하게 떼는지 쓸데없는 내기를 했다. 그때는 매일 붙어 지내는 일이 당연했는데 지금은 목소리를 듣기 위해 서로 시간을 정해야 한다. 통화를 마치기 전에 다음 달에는 꼭 만나자고 약속했다. 나무가 자라는 속도는 느리지만, 그 느린 시간이 우리가 다시 가까워질 틈을 만들어 주는 것 같다. 오늘은 보고 싶은 마음을 하트로 남긴다.'],
    [-28,'✿','밭에 처음 귤꽃이 피었다는 소식을 들었다. 사진 속 꽃은 생각보다 작고 하얬다. 화려하지 않은데도 그 안에서 앞으로 자랄 귤을 떠올리니 한참 들여다보게 되었다. 시작은 늘 이렇게 눈에 잘 띄지 않는 모습인지도 모른다. 요즘 새 일을 배우며 자꾸 뒤처지는 기분이 들었는데, 꽃도 열매가 되기까지 계절을 여러 번 건넌다는 사실이 위로가 됐다. 오후에는 노트를 펴고 이번 달에 해낸 작은 일들을 적었다. 늦지 않고 출근한 날, 어려운 질문을 한 번 더 물어본 일, 포기하지 않고 끝까지 읽은 문서 같은 것들이다. 대단한 성과는 아니어도 분명히 쌓이고 있었다. 오늘의 기록은 아직 열매가 아니어도 괜찮다는 마음으로 남긴다.']
  ], out={};
  rows[1][2]+=' 밤이 깊어지자 빗소리가 조금 잦아들었다. 창가에 앉아 오늘 미뤄 둔 일들을 떠올렸지만, 다 해내지 못한 나를 다그치지는 않기로 했다. 젖은 흙이 물을 머금듯 사람에게도 아무것도 하지 않고 마음을 채우는 시간이 필요할 것이다. 내일 아침 비가 그치면 가까운 공원을 한 바퀴 걷고, 돌아오는 길에는 따뜻한 귤차를 사 오고 싶다.';
  rows[2][2]+=' 아이가 잠든 뒤 식탁을 치우며 낮에 했던 말을 다시 떠올렸다. 어른에게는 화면 속 작은 그림일 뿐인데 아이는 잎과 열매의 변화를 하나도 놓치지 않았다. 다음에 제주에 가면 나무 둘레를 직접 재고, 떨어진 잎을 주워 작은 책갈피를 만들자고 했다. 나는 달력에 여행할 수 있는 주말을 몇 개 표시했다. 계획이 언제 그대로 이루어질지는 모르지만 함께 기다리는 일이 이미 여행의 시작처럼 느껴졌다. 아이가 자라며 오늘 일을 잊더라도 이 기록을 다시 읽으면 귤을 세던 목소리와 식탁 위에 흩어진 별 모양 껍질이 생생히 돌아올 것 같다. 그래서 사진을 찍는 대신 문장을 조금 더 오래 남겨 두기로 했다.';
  rows[3][2]+=' 전화를 끊은 뒤 서랍 깊숙한 곳에서 오래된 사진 봉투를 꺼냈다. 같은 옷을 입고 나란히 서 있는 사진, 바닷가에서 바람 때문에 눈을 제대로 뜨지 못한 사진, 할머니 댁 마당에서 귤 상자를 붙잡고 웃는 사진이 차례로 나왔다. 언니에게 몇 장을 찍어 보내니 바로 기억나는 장면마다 긴 답장이 돌아왔다. 우리는 사진 한 장을 두고도 서로 다른 부분을 기억하고 있었다. 나는 그날 비가 왔다고 생각했는데 언니는 햇빛이 너무 강해 모자를 바꿔 썼다고 했다. 어느 쪽이 맞는지는 중요하지 않았다. 서로의 기억을 이어 붙이자 잊었다고 생각한 하루가 다시 넓어졌다. 다음에 만날 때는 이 사진들을 작은 앨범으로 묶기로 했다. 나무 앞에서 새 사진도 한 장 찍고 싶다. 지금의 얼굴과 지금의 마음을 남겨 두면, 먼 훗날 또 다른 우리가 오늘을 서로 다르게 기억하며 웃을 수 있을 것이다. 연락하지 못한 시간까지 한꺼번에 만회하려 서두르지 않고, 오늘 한 번 전화하고 내일 짧은 메시지를 보내는 식으로 천천히 다시 가까워지고 싶다. 나무가 매일 눈에 띄게 달라지지 않아도 어느새 가지를 넓히듯 우리 사이의 시간도 그렇게 이어질 거라고 믿는다.';
  rows.forEach(function(r,i){ var d=new Date(base); d.setDate(d.getDate()+r[0]); var key=dateKey(d); out[key]={icon:diaryIconKey(r[1]),text:r[2],createdAt:d.getTime(),comment:TREE_REPLIES[i%TREE_REPLIES.length]}; }); return out;
}
function brandIcon(kind){
  var a='viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
  if(kind==='site') return '<svg class="siteIcon" '+a+'><path d="M9 13c0-4 3.1-7 7-7s7 3 7 7v3c2 1.2 3 3.2 3 5.5V27H6v-5.5C6 19.2 7 17.2 9 16z"/><path d="M7 10h18M11 6.5c1.4-1.8 3-2.7 5-2.7s3.6.9 5 2.7"/><circle cx="13" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="20" cy="18" r="1" fill="currentColor" stroke="none"/><path d="M17 20.5c.9.2 1.4.8 1.4 1.5"/></svg>';
  if(kind==='instagram') return '<svg '+a+'><rect x="4" y="4" width="24" height="24" rx="7"/><circle cx="16" cy="16" r="5.5"/><circle cx="23.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/></svg>';
  if(kind==='kakao') return '<svg '+a+'><path d="M4 14c0-6 5.4-10 12-10s12 4 12 10-5.4 10-12 10c-1.5 0-3-.2-4.3-.6L6 27l1.7-5C5.4 19.6 4 17 4 14z"/><path d="M11 13h10M11 17h7"/></svg>';
  if(kind==='naver') return '<svg class="naverIcon" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="4" width="24" height="24" rx="4" stroke-width="2.3"/><path d="M10 22V10l12 12V10" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if(kind==='airbnb') return '<svg '+a+'><path d="M16 5c-3 0-4.7 5.8-6.8 10.2C7 19.8 6.4 23 9 25c2.4 1.9 5.1-.2 7-2.8 1.9 2.6 4.6 4.7 7 2.8 2.6-2 2-5.2-.2-9.8C20.7 10.8 19 5 16 5z"/><path d="M12 19c1.3 1.7 2.7 2.7 4 2.7s2.7-1 4-2.7c-1.2-2.5-2.5-4.2-4-4.2s-2.8 1.7-4 4.2z"/></svg>';
  return '<svg '+a+'><circle cx="16" cy="16" r="11"/><path d="M11 16h10M16 11v10"/></svg>';
}
function setupLinkClouds(){
  var groups=[
    {title:'엉클리틀',links:[['공식 사이트','https://litttl.com/','site'],['카카오톡 채널','https://pf.kakao.com/_ctxlxej','kakao'],['Instagram','https://www.instagram.com/uncle.litttl1988/','instagram']]},
    {title:'엉클리틀 키친',url:'https://naver.me/GT47DMPT'},
    {title:'엉클리틀의 집',links:[['네이버지도','https://naver.me/5jXjRKt3','naver'],['에어비앤비','https://www.airbnb.co.kr/rooms/659241205533421919','airbnb']]},
    {title:'브랜드숍',url:'https://smartstore.naver.com/uncle_litttl'},
    {title:'체험 프로그램',url:'https://naver.me/xvCwYxDE'}
  ], box=$('linkClouds'); box.innerHTML='';
  groups.forEach(function(group,i){
    var c=el('div','linkCloud',landingCloudShape(i));
    if(group.links){ c.classList.add('has-title'); c.appendChild(txt('span','linkCloudTitle',group.title)); var row=el('div','linkIconRow'); group.links.forEach(function(it){ var a=el('a','',brandIcon(it[2])); a.href=it[1]; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label',it[0]); a.title=it[0]; row.appendChild(a); }); c.appendChild(row); }
    else { var a=txt('a','',group.title); a.href=group.url; a.target='_blank'; a.rel='noopener'; c.appendChild(a); }
    box.appendChild(c);
  });
}
function positionLandingFooter(){
  var scene=$('scene'), hBox=$('horizon'), footer=$('siteFooter');
  if(view){
    if(hBox) hBox.style.top='';
    if(scene) scene.style.removeProperty('--landing-h');
    return;
  }
  if(!world||!footer) return;
  var applyPos=function(){
    if(view) return;
    var gap=innerWidth<=780?34:38;
    var minMoundH=(world.offsetWidth||0)*0.86*(536/1500);
    var worldBottom=world.offsetTop+Math.max(world.offsetHeight||0,minMoundH);
    if(hBox) hBox.style.top=Math.round(worldBottom-8)+'px';
    footer.style.top=Math.ceil(worldBottom+gap)+'px';
    if(scene) scene.style.setProperty('--landing-h',Math.ceil(footer.offsetTop+footer.offsetHeight+28)+'px');
  };
  applyPos();
  requestAnimationFrame(applyPos);
}

/* ---------- 공통 도구 ---------- */
var world=$('world'), busy=false, spotsNow=[], present={}, presenceReady=false, msgs=[];
function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function txt(tag,cls,t){ var e=el(tag,cls); e.textContent=t; return e; }
function anim(node,frames,opt){ if(RM) opt=Object.assign({},opt,{duration:1,iterations:1}); return node.animate(frames,Object.assign({fill:'forwards',easing:'ease-in-out'},opt)).finished.catch(function(){}); }
function wait(ms){ return new Promise(function(r){ setTimeout(r,RM?1:ms); }); }
function forestLabel(f,n){ return F[f]?F[f][0]:'이웃 나무'; }
function safe(name,fallback){ if(!name) return fallback||''; return Filter.bad(name)?'가려진 이름':name; }
function toast(m){
  var t=$('toast'), host=(sheet&&sheet.open)?sheet:document.body;
  if(t.parentNode!==host) host.appendChild(t);
  t.textContent=m; t.classList.add('on'); clearTimeout(toast.t);
  toast.t=setTimeout(function(){ t.classList.remove('on'); if(t.parentNode!==document.body) document.body.appendChild(t); },2600);
}
var NOT_ALLOWED='욕설이나 음란한 표현은 쓸 수 없어요. 다른 말로 적어주세요.';
var SUPPORT_EMAIL='yangdk02@gmail.com', lastErrorReport=null, lastAutoTroubleshootAt=0;
function formatKstDateTime(ts){
  var d=ts?new Date(ts):new Date();
  try{
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d).reduce(function(a,x){ a[x.type]=x.value; return a; },{});
    return p.year+'-'+p.month+'-'+p.day+' '+p.hour+':'+p.minute+':'+p.second+' (KST)';
  }catch(e){ return d.toISOString(); }
}
function parseErrorDetail(err){
  if(!err) return {code:'UNKNOWN_ERROR',message:'알 수 없는 오류가 발생했어요.',stack:''};
  if(typeof err==='string') return {code:'ERROR',message:err,stack:''};
  var code=err.code||(err.status?'HTTP_'+err.status:'')||err.name||'ERROR';
  var msg=String(err.message||err.error||err).trim()||'상세 메시지가 없습니다.';
  if(msg.charAt(0)==='{'){
    try{
      var parsed=JSON.parse(msg);
      if(parsed&&parsed.error){
        msg=parsed.error+(parsed.operationType?' ['+parsed.operationType+(parsed.path?' '+parsed.path:'')+']':'');
      }
    }catch(e){}
  }
  var stack=err.stack?String(err.stack).split(/\r?\n/).slice(0,6).join('\n'):'';
  return {code:String(code),message:msg,stack:stack};
}
function buildErrorReport(title,err,context){
  var info=parseErrorDetail(err);
  var now=Date.now();
  var lines=[
    '[LITTTL. FARM. 오류 보고]',
    '발생 시각: '+formatKstDateTime(now),
    '오류 요약: '+(title||'서비스 이용 중 오류가 발생했어요.'),
    '오류 코드: '+info.code,
    '상세 내용: '+info.message,
    '발생 위치: '+(context||(document.body.dataset.page==='map'?'벼락밭 지도':'나무 화면'))+' ('+(location.hash||'#home')+')',
    '접속 주소: '+location.origin+location.pathname+(location.hash||''),
    '네트워크: '+(navigator.onLine===false?'오프라인':'온라인'),
    '계정 상태: '+(me?(isAdmin()?'관리자 로그인':'회원 로그인'):'비로그인'),
    '브라우저: '+navigator.userAgent
  ];
  if(info.stack&&info.stack!==info.message) lines.push('추적 정보:\n'+info.stack);
  return {title:title||'서비스 오류',code:info.code,message:info.message,text:lines.join('\n'),ts:now};
}
function buildMailtoHref(report){
  var subject='[LITTTL. FARM.] 오류 보고 - '+(report&&report.title||'서비스 오류');
  var bodyText=(report&&report.text)||'';
  if(bodyText.length>1400) bodyText=bodyText.slice(0,1400)+'\n...(이하 생략)';
  return 'mailto:'+SUPPORT_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(bodyText);
}
function copyTextValue(text,btn,okMsg,fallbackEl){
  var done=function(){
    if(btn){ var prev=btn.textContent; btn.textContent='복사됨'; setTimeout(function(){ if(btn.isConnected) btn.textContent=prev; },1800); }
    toast(okMsg||'복사했어요.');
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(function(){
      if(fallbackEl){ try{ fallbackEl.focus(); fallbackEl.select(); document.execCommand('copy'); done(); return; }catch(e){} }
      toast('직접 선택해서 복사해 주세요.');
    });
    return;
  }
  if(fallbackEl){ try{ fallbackEl.focus(); fallbackEl.select(); document.execCommand('copy'); done(); return; }catch(e){} }
  toast('직접 선택해서 복사해 주세요.');
}
function openTroubleshoot(report,opts){
  opts=opts||{};
  var rep=report||lastErrorReport||buildErrorReport('오류 정보 없음','기록된 상세 오류가 없습니다.','');
  openSheet('오류가 발생했어요','서비스 이용 중 문제가 발생했어요. 아래 오류 내용을 복사해 개발자 메일로 보내 주시면 빠르게 확인해 드릴게요.');
  sheet.classList.add('legalSheet','troubleshootSheet');
  var box=el('section','troubleshootContainer');
  var head=el('div','troubleshootHead'), copyMini=txt('button','mini','오류 내용 복사하기');
  copyMini.type='button';
  head.append(txt('strong','','오류 내용 (복사해서 보내 주세요)'),copyMini);
  var area=document.createElement('textarea');
  area.className='troubleshootCode';
  area.readOnly=true;
  area.setAttribute('aria-label','오류 상세 내용');
  area.value=rep.text;
  area.onclick=function(){ area.select(); };
  copyMini.onclick=function(){ copyTextValue(rep.text,copyMini,'오류 내용을 복사했어요.',area); };
  box.append(head,area);
  sheet.appendChild(box);
  var mailCard=el('section','troubleshootMailCard');
  mailCard.appendChild(txt('p','troubleshootMailTitle','오류 메일 보내기'));
  var mailRow=el('div','troubleshootMailRow');
  var mailLink=el('a','troubleshootMailLink');
  mailLink.href=buildMailtoHref(rep);
  mailLink.textContent=SUPPORT_EMAIL;
  mailLink.setAttribute('aria-label',SUPPORT_EMAIL+'로 오류 메일 보내기');
  var mailCopy=txt('button','mini','메일 주소 복사');
  mailCopy.type='button';
  mailCopy.onclick=function(){ copyTextValue(SUPPORT_EMAIL,mailCopy,'개발자 메일 주소를 복사했어요.'); };
  mailRow.append(mailLink,mailCopy);
  mailCard.append(mailRow,txt('p','troubleshootMailHint','위 메일 주소 링크를 누르면 오류 내용이 담긴 메일 작성 창이 열립니다. 메일 앱이 열리지 않으면 위 오류 내용을 복사해 '+SUPPORT_EMAIL+'으로 직접 보내 주세요.'));
  sheet.appendChild(mailCard);
  var a=actions();
  if(opts.onBack) a.appendChild(ghostBtn('← 돌아가기',opts.onBack));
  a.appendChild(ghostBtn('닫기',function(){ sheet.close(); }));
}
function recordError(title,err,context,opts){
  var rep=buildErrorReport(title,err,context);
  lastErrorReport=rep;
  if(opts&&opts.autoOpen) openTroubleshoot(rep,{onBack:opts.onBack});
  return rep;
}
function attachTroubleshootBtn(host,rep,onBack){
  if(!host||!rep) return;
  var b=txt('button','troubleshootInlineLink','오류 내용 보기 · 메일 보내기');
  b.type='button';
  b.onclick=function(){ openTroubleshoot(rep,{onBack:onBack}); };
  host.appendChild(document.createElement('br'));
  host.appendChild(b);
}
var adminGrantActive=false, pendingNotifAction=null;
function isAdmin(){ return !!(me&&(String(me.email||'').trim().toLowerCase()==='yangdk02@gmail.com'||adminGrantActive)); }
function isPrimaryAdmin(){ return !!(me&&String(me.email||'').trim().toLowerCase()==='yangdk02@gmail.com'); }
function myTreeId(){ return meDoc&&meDoc.treeId||null; }
function isMine(){ return !!view&&view.id===myTreeId()&&!!T&&!!me&&(T.members||[]).indexOf(me.uid)>=0; }
function mode(){ if(view) return isMine()?'mine':'visit'; if(landing) return 'links'; return me?'empty':'out'; }
function needLogin(msg){ if(me) return false; openAuth('signup',msg||'회원이 되면 쓸 수 있어요.'); return true; }

/* ---------- 저장 ---------- */
var pending={}, saveTimer=null, unsaved={};
function persist(keys){
  if(!isMine()) return;
  keys.forEach(function(k){ pending[k]=T[k]; unsaved[k]=(unsaved[k]||0)+1; });
  clearTimeout(saveTimer); saveTimer=setTimeout(flush,500);
}
function flush(){
  var id=view&&view.id, p=pending; pending={};
  if(!id||!Object.keys(p).length) return;
  var done=function(){ setTimeout(function(){ Object.keys(p).forEach(function(k){ delete unsaved[k]; }); },300); };
  B.updateTree(id,p).then(done,function(){ done(); toast('저장하지 못했어요. 인터넷 연결을 확인해 주세요.'); });
}
function newTree(id,f,n){
  var t=Date.now();
  return {id:id,f:f,n:n,ownerUid:me.uid,members:[me.uid],name:'',intro:'',story:'',basket:0,fruit:Game.fruitMax(),bugs:2,bugRuleVersion:2,t:{water:0,fruit:t,bug:t},hearts:0,pin:null,lastAct:null,
    chars:[{id:'c0',uid:me.uid,name:meDoc.nick||'',color:'#000000',head:'tangerine',face:'',joinedAt:t}]};
}
function catchUp(){
  var t=Date.now(), ch=[], g, oldFruit=+T.fruit||0;
  T.t=T.t||{water:0,fruit:t,bug:t}; if(T.t.water==null) T.t.water=0;
  T.fruit=Math.max(0,Math.min(Game.fruitMax(),oldFruit)); if(T.fruit!==oldFruit) ch.push('fruit');
  g=Math.floor((t-T.t.fruit)/(CONFIG.fruitRegrowSeconds*1000));
  if(g>0){ T.t.fruit+=g*CONFIG.fruitRegrowSeconds*1000; ch.push('t'); if(T.fruit<Game.fruitMax()){ T.fruit=Math.min(Game.fruitMax(),T.fruit+g); ch.push('fruit'); } }
  if(T.bugRuleVersion!==2){ T.bugRuleVersion=2; T.t.bug=t; ch.push('bugRuleVersion','t'); }
  g=Math.floor((t-T.t.bug)/(CONFIG.bugSeconds*1000));
  if(g>0){ T.t.bug+=g*CONFIG.bugSeconds*1000; ch.push('t'); if(T.bugs<CONFIG.maxBugs){ T.bugs=Math.min(CONFIG.maxBugs,T.bugs+g); ch.push('bugs'); } }
  return ch.filter(function(k,i){ return ch.indexOf(k)===i; });
}

/* ---------- 나무 화면 ---------- */
var unsub=[], curKey=null, treeLoadError=false, treeLoadReport=null;
function clearWatch(){ unsub.forEach(function(u){ try{ u(); }catch(e){} }); unsub=[]; }
function openTree(id,f,n){
  var key=id; document.body.dataset.page='scene'; $('scene').hidden=false; $('mapPage').hidden=true;
  setTimeout(reseedSky,0);
  if(curKey===key&&T&&!treeLoadError){ renderAll(); return; }
  clearWatch(); curKey=key; view={id:id,f:f,n:n}; T=null; treeLoadError=false; present={}; presenceReady=false; msgs=[]; world.innerHTML='';
  var first=true;
  unsub.push(B.watchTree(id,function(d){
    if(curKey!==key) return;
    treeLoadError=false;
    if(d){
      var obsolete=['level','xp','water'].filter(function(k){ return Object.prototype.hasOwnProperty.call(d,k); });
      var mayClean=me&&((d.members||[]).indexOf(me.uid)>=0||d.ownerUid===me.uid);
      obsolete.forEach(function(k){ delete d[k]; });
      if(obsolete.length&&mayClean) B.removeTreeFields(id,obsolete).catch(function(){});
    }
    var old=T;
    if(d&&old&&isMine()) Object.keys(unsaved).forEach(function(k){ d[k]=old[k]; });
    T=d;
    if(d&&isMine()){ meDoc.treeCache={f:d.f,n:d.n,name:d.name}; var ch=catchUp(); if(ch.length) persist(ch); }
    if(first){ first=false; renderAll(); setTimeout(reseedSky,0); if(openStoryAfterEnter&&d&&isMine()){ openStoryAfterEnter=false; setTimeout(openEdit,80); } if(pendingNotifAction&&d&&isMine()){ var fn=pendingNotifAction; pendingNotifAction=null; setTimeout(fn,60); } return; }
    if(!d){ renderAll(); return; }
    if(d.lastAct&&(!old||!old.lastAct||old.lastAct.at!==d.lastAct.at)&&(!me||d.lastAct.uid!==me.uid)) showFamilyAct(d.lastAct);
    if(!old) whenFree(renderAll); else whenFree(softUpdate);
  },function(err){
    if(curKey!==key) return;
    treeLoadError=true;
    treeLoadReport=recordError('나무 정보를 불러오지 못했어요',err,'나무 화면');
    if(!T){ renderAll(); toast('나무 정보를 불러오지 못했어요.'); }
  }));
  unsub.push(B.watchPresence(id,function(p){ if(curKey!==key) return; present=p; if(T) renderKeepers(); presenceReady=true; }));
  unsub.push(B.watchMessages(id,function(m){ if(curKey!==key) return; msgs=m; renderCheerList(); hud(); }));
}
function openEmpty(){
  document.body.dataset.page='scene'; $('scene').hidden=false; $('mapPage').hidden=true;
  clearWatch(); curKey=null; view=null; T=null; present={}; msgs=[]; renderAll();
}
function whenFree(fn){ if(busy) setTimeout(function(){ whenFree(fn); },200); else fn(); }
function renderAll(){
  document.body.dataset.mode=mode();
  world.innerHTML=''; busy=false;
  if(!view){ renderEmpty(); }
  else if(T){ renderTree(); }
  else { renderBare(); }
  hud(); buildButtons(); applyWeather(); positionLandingFooter();
}
function renderEmpty(){
  var m=el('div',null,'<img class="moundArt" src="./assets/002.png" width="1500" height="536" alt="">');
  m.id='mound';
  var img=m.querySelector('img');
  if(img) img.addEventListener('load',positionLandingFooter);
  world.appendChild(m);
}
function renderBare(){ buildTreeNode({seed:view.f*1000+view.n,name:''}); }
function buildTreeNode(t){
  var blobs=canopy(t.seed), tree=el('div'); tree.id='tree';
  tree.innerHTML=treeBody(blobs);
  var mine=isMine(), shown=mine?T.fruit:Math.max(0,Game.fruitMax()-2);
  spotsNow=spots(t.seed,blobs,26);
  spotsNow.slice(0,shown).forEach(function(p,i){ tree.appendChild(fruitNode(p,mine,i)); });
  var sign=el('button'), nm=safe(t.name); sign.id='sign'; sign.textContent=nm||(mine?'이름을 지어주세요':'이름 없는 나무'); sign.classList.toggle('blank',!nm);
  if(nm&&nm.length>6) sign.style.fontSize='4.6cqw';
  sign.setAttribute('aria-label',mine?'나무 이름 짓기':'나무 이야기 보기');
  sign.onclick=function(){ anim(sign,[{rotate:'0deg'},{rotate:'6deg'},{rotate:'-4deg'},{rotate:'0deg'}],{duration:500,fill:'none'}); mine?openEdit():openVisitorStory(); };
  tree.appendChild(sign); tree.insertAdjacentHTML('beforeend',FACE);
  world.appendChild(tree);
  world.insertAdjacentHTML('beforeend','<div id="wet"></div>');
  var c=el('div',null,CAN); c.id='can'; world.appendChild(c);
}
function renderTree(){ buildTreeNode({seed:T.f*1000+T.n,name:T.name}); if(isMine()) renderBugs(); mood(); renderKeepers(true); }
function softUpdate(){
  if(!T){ return; }
  var tree=$('tree'); if(!tree) return renderAll();
  var sign=$('sign'), nm=safe(T.name); sign.textContent=nm||(isMine()?'이름을 지어주세요':'이름 없는 나무'); sign.classList.toggle('blank',!nm); sign.style.fontSize=(nm&&nm.length>6)?'4.6cqw':'';
  if(isMine()){ syncFruit(); if(tree.querySelectorAll('.bug').length!==T.bugs) renderBugs(); mood(); }
  renderKeepers(); hud();
}
function syncFruit(){
  var tree=$('tree'); if(!tree) return;
  var nodes=[].slice.call(tree.querySelectorAll('.fruit')), have=nodes.length;
  if(have>T.fruit){ nodes.slice(T.fruit).forEach(function(n){ n.remove(); }); return; }
  var used=nodes.map(function(f){ return +f.dataset.i; });
  spotsNow.forEach(function(p,i){ if(have<T.fruit&&used.indexOf(i)<0){ tree.insertBefore(fruitNode(p,true,i),$('sign')); have++; } });
}
function fruitNode(p,mine,i){
  var b=el('button','fruit',FRUIT);
  b.style.left=(p[0]/4)+'%'; b.style.top=(p[1]/4.8)+'%'; b.dataset.i=i;
  b.setAttribute('aria-label',mine?'귤 따기':'귤 구경하기');
  b.tabIndex=-1; b.onclick=function(){ mine?pickOne(b):toast('하트로 이 나무를 응원해 주세요.'); };
  return b;
}
function renderBugs(){
  var tree=$('tree'); if(!tree) return;
  tree.querySelectorAll('.bug').forEach(function(b){ b.remove(); });
  for(var i=0;i<T.bugs;i++){ (function(i){
    var p=BUGSPOTS[i%BUGSPOTS.length], b=el('button','bug',ICON.bug);
    b.querySelector('svg').style.filter='drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff)';
    b.style.left=(p[0]/4)+'%'; b.style.top=(p[1]/4.8)+'%'; b.setAttribute('aria-label','벌레 잡기');
    b.onclick=function(){ squash(b); }; tree.appendChild(b);
  })(i); }
}
function mood(m){ var f=$('face'); if(f) f.dataset.mood=m||((isMine()&&T.bugs>=3)?'sad':'calm'); }

/* ---------- 캐릭터 ---------- */
var SLOTS=[9,74,25,59];
function isHere(c,i){
  if(i===0) return true;
  if(T&&T.seed&&c.uid) return true;
  if(me&&c.uid===me.uid) return true;
  var now=Date.now(), at=(c.uid&&present[c.uid])||present['slot:'+c.id];
  return !!at&&now-at<100000;
}
function myChar(){ if(!T||!me) return null; return (T.chars||[]).filter(function(c){ return c.uid===me.uid; })[0]||null; }
function kpSig(c){ return [c.color,c.head,c.face,c.name].join('|'); }
function renderKeepers(fresh){
  if(!T||!$('tree')) return;
  var chars=T.chars||[], seen={};
  chars.forEach(function(c,i){
    if(!isHere(c,i)) return;
    seen[c.id]=1;
    var node=world.querySelector('.kp[data-id="'+c.id+'"]');
    if(!node){
      node=el('div','kp'); node.dataset.id=c.id; node.dataset.slot=i%4; node.style.left=SLOTS[i%4]+'%'; world.appendChild(node);
      fill(node,c);
      if(!fresh&&presenceReady&&!RM){
        anim(node,[{translate:(i%2?'160%':'-160%')+' 0',opacity:0},{translate:'0 0',opacity:1}],{duration:800,fill:'none'});
        if(!(me&&c.uid===me.uid)) toast((safe(c.name,'가족'))+' 왔어요.');
      }
    } else if(node.dataset.sig!==kpSig(c)){ fill(node,c); }
  });
  world.querySelectorAll('.kp').forEach(function(n){
    if(n.dataset.id&&!seen[n.dataset.id]){ n.dataset.id=''; anim(n,[{opacity:1},{opacity:0}],{duration:500}).then(function(){ n.remove(); }); }
  });
  poseKeepers();
}
function fill(node,c){
  var nm=safe(c.name,(me&&c.uid===me.uid&&meDoc&&meDoc.nick)||'이름 없음');
  node.dataset.sig=kpSig(c); node.innerHTML=keeper(c);
  node.removeAttribute('tabindex'); node.setAttribute('aria-label',nm);
  if((T.chars||[]).length>1&&c.name) node.appendChild(txt('b','',safe(c.name)));
  node.appendChild(txt('i','z','z Z'));
}
function poseKeepers(){
  var w=weather();
  world.querySelectorAll('.kp[data-id]').forEach(function(n){
    if(n.dataset.hugging) return;
    n.classList.toggle('nap',w.kind==='clear');
    n.classList.toggle('rain',w.kind==='rain'||w.kind==='storm');
  });
}
function myKp(){ var c=myChar(); return c?world.querySelector('.kp[data-id="'+c.id+'"]'):world.querySelector('.kp[data-id]'); }

/* ---------- 상단·버튼 ---------- */
function hud(){
  var m=mode(), w=weather();
  $('back').textContent='← 뒤로';
  $('back').hidden=!(m==='mine'||m==='visit'||m==='links'||navStack.length>1);
  var place=$('place'); place.innerHTML='';
  var wx=w.kind!=='unknown'?w.label+(w.temp!=null?' '+Math.round(w.temp)+'°':''):'날씨 선택';
  place.append(view?forestLabel(view.f,view.n):CONFIG.weather.place); place.appendChild(txt('small','',wx));
  var b=$('basket'), visitTree=m==='visit'&&!!T; b.hidden=m!=='mine'; b.innerHTML=FRUIT+'<span>'+(T?T.basket:0)+'</span>';
  var h=$('hearts'); h.hidden=!T; h.classList.toggle('visitHeart',visitTree);
  if(visitTree){
    h.innerHTML=HEART+'<span>+</span>'; h.setAttribute('aria-label','하트 남기기'); h.title='하트 남기기'; h.onclick=leaveHeart;
    if(me){ var visitId=view.id; B.hearted(visitId,me.uid,today()).then(function(y){ if(y&&view&&view.id===visitId&&mode()==='visit'){ h.innerHTML=HEART+'<span>✓</span>'; h.setAttribute('aria-label','오늘 응원했어요'); h.title='오늘 응원했어요'; h.onclick=function(){ toast('하트는 나무마다 하루에 한 번 남길 수 있어요.'); }; } }).catch(function(){}); }
  } else {
    h.innerHTML=HEART+'<span>'+(T?T.hearts||0:0)+'</span>'; h.setAttribute('aria-label','응원과 하트 보기'); h.title='응원 보기'; h.onclick=openCheer;
  }
  var seen=0; try{ seen=+localStorage.getItem('littlSeen')||0; }catch(e){}
  if(m==='mine'&&msgs.some(function(x){ return x.ts>seen&&(!me||x.uid!==me.uid); })) h.appendChild(el('u'));
  var adminOn=isAdmin(), unreadNotif=unreadNotifCount();
  $('login').hidden=!authResolved||!!me; $('menu').hidden=!me;
  if($('adminBtn')) $('adminBtn').hidden=!adminOn;
  if($('notifBtn')){
    $('notifBtn').hidden=!me;
    var nu=$('notifBtn').querySelector('u');
    if(nu){ nu.hidden=!unreadNotif; nu.textContent=unreadNotif>9?'9+':(unreadNotif?String(unreadNotif):''); }
    $('notifBtn').setAttribute('aria-label',unreadNotif?'알림 '+unreadNotif+'개':'알림');
  }
  if($('mapLogin')) $('mapLogin').hidden=!authResolved||!!me;
  if($('mapMenu')) $('mapMenu').hidden=!me;
  if($('mapAdminBtn')) $('mapAdminBtn').hidden=!adminOn;
  if($('mapNotifBtn')){
    $('mapNotifBtn').hidden=!me;
    var mnu=$('mapNotifBtn').querySelector('u');
    if(mnu){ mnu.hidden=!unreadNotif; mnu.textContent=unreadNotif>9?'9+':(unreadNotif?String(unreadNotif):''); }
    $('mapNotifBtn').setAttribute('aria-label',unreadNotif?'알림 '+unreadNotif+'개':'알림');
  }
  $('visitBar').hidden=m!=='visit'||!!T; $('emptyBar').hidden=!authResolved||(m!=='empty'&&m!=='out'&&!(treeLoadError&&view&&!T));
  if(m==='visit'&&!T) visitBar();
  if(treeLoadError&&view&&!T) treeErrorBar();
  if(authResolved&&(m==='empty'||m==='out')) emptyBar(m);
  badges();
}
function treeErrorBar(){
  var box=$('emptyBar'); box.innerHTML='';
  box.appendChild(txt('p','','나무 정보를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'));
  var row=el('div','row');
  row.appendChild(bigBtn('다시 불러오기',function(){ if(view){ curKey=null; openTree(view.id,view.f,view.n); } }));
  if(treeLoadReport) row.appendChild(ghostBtn('오류 내용 보기',function(){ openTroubleshoot(treeLoadReport); }));
  box.appendChild(row);
}
function visitBar(){
  var hb=$('heartBtn');
  $('visitIntro').textContent='';
  hb.hidden=true;
}
function emptyBar(m){
  var box=$('emptyBar'); box.innerHTML='';
  if(m==='out'){
    var welcome=el('p'); welcome.append(document.createTextNode('제주 귤나무 한 그루를 키워보세요.'),document.createElement('br'),document.createTextNode('Google 계정으로 로그인하면 자동으로 저장돼요.')); box.appendChild(welcome);
    var row=el('div','row'); row.append(bigBtn('Google로 시작하기',function(){ openAuth('login'); })); box.appendChild(row); return;
  }
  var legacy=null; try{ legacy=JSON.parse(localStorage.getItem('littlMine')||'null'); }catch(e){}
  box.appendChild(txt('p','',safe(meDoc&&meDoc.nick,'회원')+'님, 어떤 나무와 함께할까요?'));
  var r=el('div','empty-actions'); r.append(bigBtn('내 나무가 있어요',openTreeCode),ghostBtn('내 나무가 없어요',createVirtualTree));
  box.appendChild(r);
}
function badges(){
  var a=$('pickAct'), b=$('bugAct');
  if(a&&T){ var e=a.querySelector('em'), label=a.querySelector('b'); e.hidden=!T.fruit; e.textContent=T.fruit; if(label) label.textContent='귤 따기'; }
  if(b&&T){ var e2=b.querySelector('em'); e2.hidden=!T.bugs; e2.textContent=T.bugs; }
}
function wrapTip(text,max){
  var chars=Array.from(text||''); if(chars.length<=max) return text;
  var words=text.split(' '), lines=[], line='';
  words.forEach(function(w){
    if(!line){ line=w; return; }
    if(Array.from(line+' '+w).length<=max) line+=' '+w;
    else { lines.push(line); line=w; }
  });
  if(line) lines.push(line);
  return lines.join('\n');
}
function act(id,icon,label,fn,tip){ var b=el('button','act','<i>'+ICON[icon]+'</i><b>'+label+'</b>'+(id==='pickAct'||id==='bugAct'?'<em hidden></em>':'')); if(id) b.id=id; if(tip){ var t=txt('span','actTip',wrapTip(tip,15)); t.setAttribute('role','tooltip'); b.appendChild(t); } b.onclick=fn; return b; }
function buildButtons(){
  var L=$('left'), R=$('right'), m=mode(); L.innerHTML=''; R.innerHTML='';
  var mineButton=function(){ return act('','tree','내 나무',function(){ location.hash=''; },'내 나무로 돌아가요'); };
  if(m==='mine'){
    L.append(
      act('','cloud','구름 띄우기',openCompose,'24시간 동안 하늘을 지나가는 한마디를 띄워요'),
      act('','book','나무 이야기',openEdit,'나무 이름과 이야기를 적고 응원을 관리해요'),
      act('','note','우리 이야기',function(){ openDiary(); },'마음을 남기는 일기예요'),
      act('','family','우리 가족',openFamily,'함께 나무를 돌보는 가족을 보고 초대해요')
    );
    R.append(
      act('pickAct','pick','귤 따기',pickAll,'나무에 열린 귤을 모두 바구니에 담아요'),
      act('bugAct','bug','벌레 잡기',catchAllBugs,'나무에 붙은 벌레를 모두 잡아요'),
      act('','hug','안아주기',hug,'나무를 꼭 안아줘요'),
      act('waterAct','water','물주기',water,'물뿌리개로 나무에 물을 줘요')
    );
  } else if(m==='visit'&&T){
    L.append(
      act('','map','벼락밭 지도',function(){ location.hash='map'; },'벼락밭의 귤나무들을 둘러봐요'),
      act('','book','나무 이야기',openVisitorStory,'이 나무의 이야기와 응원을 봐요')
    );
    if(myTreeId()) L.append(mineButton());
  } else {
    L.append(act('','map','벼락밭 지도',function(){ location.hash='map'; },'벼락밭의 귤나무들을 둘러봐요'));
    if(myTreeId()) L.append(mineButton());
  }
  badges();
}

/* ---------- 돌보기 활동 효과 ---------- */
function recordAct(type,keys){
  T.lastAct={uid:me.uid,type:type,at:Date.now(),name:(myChar()&&myChar().name)||meDoc.nick||''};
  persist((keys||[]).concat(['lastAct']));
}
function showFamilyAct(a){ var n=safe(a.name,'가족'), w={water:'물을 줬어요',hug:'나무를 안아줬어요',pick:'귤을 땄어요',bug:'벌레를 잡았어요'}[a.type]; if(w&&isMine()){ toast(n+' '+w+'.'); shake(); } }
function say(t,left,top){ var s=el('div','say'); s.textContent=t; s.style.left=left+'%'; s.style.top=top+'%'; world.appendChild(s); anim(s,[{opacity:0,translate:'0 12px',scale:.8},{opacity:1,translate:'0 0',scale:1,offset:.2},{opacity:1,translate:'0 -6px',scale:1,offset:.8},{opacity:0,translate:'0 -18px',scale:1}],{duration:1700}).then(function(){ s.remove(); }); }
function hearts(n,x,y){ for(var i=0;i<n;i++){ (function(i){ setTimeout(function(){ var h=el('div','fxheart',HEART); h.style.left=(x+(Math.random()-.5)*26)+'%'; h.style.top=y+'%'; h.style.color='#000'; world.appendChild(h); anim(h,[{opacity:0,translate:'0 0',scale:.5},{opacity:1,offset:.25,scale:1},{opacity:0,translate:(Math.random()*40-20)+'px -150px',scale:1.1}],{duration:1300}).then(function(){ h.remove(); }); },RM?0:i*140); })(i); } }
function shake(){ var t=$('tree'); if(t) return anim(t,[{rotate:'0deg'},{rotate:'-2.5deg'},{rotate:'2.5deg'},{rotate:'-1.2deg'},{rotate:'0deg'}],{duration:800,fill:'none'}); }
function careWord(){ var words=CONFIG.words.care||['고맙수다']; return words[Math.floor(Math.random()*words.length)]; }

function water(){
  if(busy||mode()!=='mine') return;
  var current=weather();
  if(current.kind==='rain'||current.kind==='storm'){ toast('비가 와서 물을 주지 않아도 돼요. 하늘이 대신 다정하게 물을 주고 있어요.'); return; }
  busy=true; T.t.water=Date.now();
  var can=$('can'), wet=$('wet');
  (async function(){
    await anim(can,[{opacity:0,translate:'50% -24%',rotate:'0deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],{duration:450});
    await anim(can,[{rotate:'0deg',translate:'0 0',opacity:1},{rotate:'-30deg',translate:'0 0',opacity:1}],{duration:320});
    if(!RM){ for(var i=0;i<26;i++){ spawnDrop(); await wait(58); } }
    anim(wet,[{opacity:0,transform:'scaleX(.4)'},{opacity:.85,transform:'scaleX(1)'}],{duration:600});
    await wait(420);
    await anim(can,[{rotate:'-30deg',translate:'0 0',opacity:1},{rotate:'0deg',translate:'0 0',opacity:1}],{duration:260});
    anim(can,[{opacity:1,translate:'0 0'},{opacity:0,translate:'50% -24%'}],{duration:380});
    mood('happy'); shake(); say(careWord(),58,62); recordAct('water',['t']);
    await wait(1800);
    anim(wet,[{opacity:.85,transform:'scaleX(1)'},{opacity:0,transform:'scaleX(1)'}],{duration:1400});
    mood(); busy=false;
  })();
}
function spawnDrop(){
  var d=el('div','drop'), sx=53+Math.random()*4, sy=62+Math.random()*3, ex=38+Math.random()*24, ey=92+Math.random()*4;
  d.style.left=sx+'%'; d.style.top=sy+'%'; world.appendChild(d);
  var w=world.clientWidth, h=world.clientHeight;
  anim(d,[{translate:'0 0',opacity:1},{translate:((ex-sx)/100*w*.45)+'px '+((ey-sy)/100*h*.5)+'px',opacity:1,offset:.5},{translate:((ex-sx)/100*w)+'px '+((ey-sy)/100*h)+'px',opacity:.5}],{duration:460,easing:'cubic-bezier(.45,0,.9,.6)'}).then(function(){ d.remove(); });
}
function hug(){
  if(busy) return; var k=myKp(); if(!k) return; busy=true;
  var from=parseFloat(k.style.left), dx=(33.5-from)/19*100;
  k.dataset.hugging='1'; k.classList.remove('nap','rain');
  var X=function(p){ return (dx*p)+'% 0'; };
  (async function(){
    await anim(k,[{translate:'0 0',rotate:'0deg'},{translate:X(.35),rotate:'8deg'},{translate:X(.7),rotate:'-8deg'},{translate:X(1),rotate:'0deg'}],{duration:800,easing:'linear'});
    k.classList.add('hug'); mood('happy'); say(CONFIG.words.hug,16,60); hearts(6,50,62); shake();
    await anim(k,[{translate:X(1),scale:1},{translate:X(1),scale:1.05},{translate:X(1),scale:1},{translate:X(1),scale:1.05},{translate:X(1),scale:1}],{duration:1300});
    say(careWord(),56,62); recordAct('hug');
    await wait(900);
    k.classList.remove('hug');
    await anim(k,[{translate:X(1),rotate:'0deg'},{translate:X(.5),rotate:'-8deg'},{translate:'0 0',rotate:'0deg'}],{duration:600,easing:'linear'});
    delete k.dataset.hugging; poseKeepers(); mood(); busy=false;
  })();
}
function flyFruit(b,to,done){
  var r=b.querySelector('svg').getBoundingClientRect(); b.remove();
  var f=el('div',null,FRUIT); f.style.cssText='position:fixed;z-index:9;pointer-events:none;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px'; document.body.appendChild(f);
  var dx=to.left+8-r.left, dy=to.top-r.top;
  anim(f,[{translate:'0 0',scale:1},{translate:(dx*.35)+'px '+(Math.min(dy*.2,-20))+'px',scale:1.25,offset:.4},{translate:dx+'px '+dy+'px',scale:.6}],{duration:620}).then(function(){ f.remove(); if(done) done(); });
}
function pickOne(b){
  if(busy||mode()!=='mine'||!T.fruit||!b||!b.isConnected) return;
  busy=true; T.fruit--; T.basket++; T.t.fruit=Date.now();
  var to=$('basket').getBoundingClientRect(); flyFruit(b,to,function(){ anim($('basket'),[{scale:1},{scale:1.2},{scale:1}],{duration:220,fill:'none'}); busy=false; });
  recordAct('pick',['t','fruit','basket']); toast('귤 한 개를 땄어요.'); hud();
}
function pickAll(){
  if(busy||mode()!=='mine'||!T.fruit){ if(!T.fruit) toast('다 땄어요. 한 시간마다 귤이 한 개씩 열려요.'); return; }
  var nodes=[].slice.call(document.querySelectorAll('#tree .fruit')), count=Math.min(T.fruit,nodes.length), to=$('basket').getBoundingClientRect();
  if(!count) return;
  busy=true; T.fruit-=count; T.basket+=count; T.t.fruit=Date.now();
  nodes.slice(0,count).forEach(function(b,i){
    setTimeout(function(){ flyFruit(b,to,function(){ if(i===count-1){ anim($('basket'),[{scale:1},{scale:1.2},{scale:1}],{duration:220,fill:'none'}); busy=false; } }); },RM?0:i*55);
  });
  recordAct('pick',['t','fruit','basket']); toast('귤 '+count+'개를 한 번에 땄어요. 한 시간마다 한 개씩 다시 열려요.');
}
function squash(b,bulk){
  if(b.dataset.done) return; b.dataset.done='1';
  var s=el('div','say'); s.textContent='탁!'; s.style.left=b.style.left; s.style.top=b.style.top; s.style.fontSize='9cqw'; $('tree').appendChild(s);
  anim(s,[{opacity:1,scale:.7},{opacity:1,scale:1.15,offset:.3},{opacity:0,scale:1}],{duration:650}).then(function(){ s.remove(); });
  T.bugs--; T.t.bug=Date.now();
  anim(b,[{translate:'0 0',rotate:'0deg',opacity:1},{translate:'0 180%',rotate:'180deg',opacity:0}],{duration:520,easing:'ease-in'}).then(function(){ b.remove(); });
  if(!bulk){ recordAct('bug',['bugs','t']); mood(); if(T.bugs===0) say(careWord(),56,62); }
}
function catchAllBugs(){
  var bugs=[].slice.call(document.querySelectorAll('#tree .bug'));
  if(!bugs.length){ toast('벌레가 없어요. 깨끗한 나무예요.'); return; }
  bugs.forEach(function(b){ squash(b,true); }); recordAct('bug',['bugs','t']); mood(); say(careWord(),56,62); toast('벌레 '+bugs.length+'마리를 한 번에 잡았어요.'); badges();
}
function leaveHeart(){
  if(needLogin('회원이 되면 하트를 남길 수 있어요.')) return;
  var id=view.id, name=safe(T.name,'이 나무');
  B.heart(id,me.uid,today()).then(function(){ trackEvent('heart_send',{tree_id:id}); hearts(7,50,40); shake(); hud(); toast(name+'에게 하트를 남겼어요.'); }).catch(function(){ toast('하트는 나무마다 하루에 한 번 남길 수 있어요.'); hud(); });
}
function adopt(){
  if(needLogin('회원이 되면 내 나무와 연결할 수 있어요.')) return;
  var id=view.id, f=view.f, n=view.n;
  B.createTree(id,newTree(id,f,n)).then(function(){ invalidateTreesCache(); return setMyTree(id); }).then(function(){
    trackEvent('tree_connect',{kind:'physical_adopt'});
    try{ localStorage.setItem('littlMine',JSON.stringify({f:f,n:n,name:''})); }catch(e){}
    curKey=null; location.hash=''; route(); setTimeout(openEdit,250);
  }).catch(function(){ toast('이미 연결된 나무예요. 다른 나무를 골라주세요.'); });
}
function setMyTree(id){ meDoc.treeId=id||null; if(!id) delete meDoc.treeCache; syncMyTreeNotifWatchers(); return B.setUser(me.uid,{treeId:id||null}); }
function normalizeTreeName(v){ return String(v||'').trim().toLowerCase(); }
function createVirtualTree(){
  if(!me||myTreeId()) return;
  var id='virtual-'+me.uid, tree=newTree(id,0,999); tree.virtual=true;
  var base=Array.from(String(meDoc&&meDoc.nick||'').trim()).slice(0,5).join('');
  var cand=base?(base+'의 나무'):'';
  function enter(){ if(sheet.open) sheet.close(); openStoryAfterEnter=true; curKey=null; startBeat(); if(location.hash&&location.hash!=='#') location.hash=''; else route(); }
  listTreesCached().catch(function(){ return []; }).then(function(trees){
    var candKey=normalizeTreeName(cand);
    var dup=candKey&&(trees||[]).some(function(t){ return t&&normalizeTreeName(t.name)===candKey; });
    tree.name=dup?'':cand;
    return B.createTree(id,tree).then(function(){ invalidateTreesCache(); return setMyTree(id); }).then(function(){ trackEvent('tree_connect',{kind:'virtual'}); }).then(enter);
  }).catch(function(err){ B.getTree(id).then(function(t){ if(t) return setMyTree(id).then(enter); var rep=recordError('새 나무를 만들지 못했어요',err,'새 나무 시작하기'); openTroubleshoot(rep); }); });
}
function openTreeChoice(){
  if(!me||myTreeId()) return;
  openSheet('내 나무를 선택해 주세요');
  sheet.classList.add('requiredChoice'); var close=sheet.querySelector('.x'); if(close) close.remove();
  var sections=el('div','treeChoiceSections'), withCode=el('section','treeChoiceBlock'), withoutCode=el('section','treeChoiceBlock');
  withCode.appendChild(txt('h3','','나무 코드가 있어요'));
  var help=el('p','treeChoiceHelp','나무 코드를 받으려면? <a href="https://pf.kakao.com/_ctxlxej" target="_blank" rel="noopener">엉클리틀</a>에 문의해 주세요.<br>바로 나무 코드를 입력하면 해당 벼락밭 나무로 연결돼요. 이미 다른 분이 돌보고 있는 나무라면 그 나무에 함께 참여하게 됩니다.'); withCode.appendChild(help);
  var codeBlock=el('div','treeCodeBlock'), codeRow=el('div','treeCodeRow'), label=txt('label','','나무 코드'), c=document.createElement('input'); c.type='text'; c.className='codeInput'; c.maxLength=12; c.autocomplete='off'; c.name='litttl-tree-code'; c.spellcheck=false; c.setAttribute('data-lpignore','true'); c.style.textTransform='uppercase'; label.appendChild(c);
  var confirm=bigBtn('확인',function(){ connectWithCode(c.value.trim().toUpperCase(),note); }); codeRow.append(label,confirm); codeBlock.appendChild(codeRow); attachCount(c,12,codeBlock); withCode.appendChild(codeBlock);
  var note=formNote(); withCode.appendChild(note);
  withoutCode.append(txt('h3','','나무 코드가 없어요'),bigBtn('새 나무 시작하기',createVirtualTree));
  sections.append(withCode,el('div','treeChoiceDivider'),withoutCode); sheet.appendChild(sections);
}
function openTreeCode(){ openTreeChoice(); }
function openPhysicalTreeCode(){
  if(needLogin('회원이 되면 나무 코드를 입력할 수 있어요.')) return;
  var id=myTreeId();
  if(!id){ openTreeChoice(); return; }
  if(id.indexOf('virtual-')===0){
    if(T&&isMine()){ openFieldTreeSwitch(T); return; }
    B.getTree(id).then(function(tree){
      if(!tree){ openTreeChoice(); return; }
      openFieldTreeSwitch(tree);
    }).catch(function(){ toast('나무 정보를 불러오지 못했어요.'); });
    return;
  }
  toast('이미 벼락밭 나무와 연결되어 있어요. 다른 나무를 연결하려면 우리 가족에서 먼저 헤어져 주세요.');
}
function connectWithCode(code,note){
  function fail(m){ if(note) note.textContent=m; else toast(m); return false; }
  if(!code) return Promise.resolve(fail('코드를 입력해 주세요.'));
  if(myTreeId()) return Promise.resolve(fail('이미 나무와 연결되어 있어요. 우리 가족에서 기존 나무와 먼저 헤어져 주세요.'));
  return B.getInvite(code).then(function(inv){
    if(!inv||!inv.treeId) return fail('나무 코드를 찾지 못했어요. 다시 확인해 주세요.');
    if(inv.kind==='physical'){
      return B.getTree(inv.treeId).then(function(tr){
        if(tr) return tr;
        tr=newTree(inv.treeId,inv.f,inv.n); return B.createTree(inv.treeId,tr).then(function(){ return tr; });
      }).then(function(tr){
        if((tr.members||[]).indexOf(me.uid)>=0) return tr;
        var now=Date.now(), chars=(tr.chars||[]).concat([{id:'c'+now.toString(36),uid:me.uid,name:meDoc.nick||'',color:'#000',head:'tangerine',face:'',joinedAt:now}]);
        return B.joinTree(inv.treeId,{members:(tr.members||[]).concat(me.uid),chars:chars,joinCode:code}).then(function(){ return tr; });
      }).then(function(tr){ return setMyTree(inv.treeId).then(function(){ return B.deleteInvite(code).catch(function(){}); }).then(function(){ trackEvent('tree_connect',{kind:'physical_code'}); return tr; }); });
    }
    return B.getTree(inv.treeId).then(function(tr){
      if(!tr) return fail('연결할 나무를 찾지 못했어요. 나무 코드를 다시 확인해 주세요.');
      var chars=(tr.chars||[]).map(function(c){ return Object.assign({},c); }), slot=chars.filter(function(c){ return c.id===inv.charId&&!c.uid; })[0];
      if(!slot) return fail('이미 사용한 코드예요.');
      slot.uid=me.uid; slot.joinedAt=Date.now(); if(!slot.name) slot.name=meDoc.nick||'';
      return B.joinTree(inv.treeId,{members:(tr.members||[]).concat(me.uid),chars:chars,joinCode:code}).then(function(){ return setMyTree(inv.treeId); }).then(function(){ return B.deleteInvite(code).catch(function(){}); }).then(function(){ trackEvent('tree_connect',{kind:'family_invite'}); return tr; });
    });
  }).then(function(tr){
    if(!tr) return false;
    invalidateTreesCache();
    if(sheet.open) sheet.close(); curKey=null; location.hash=''; startBeat(); route(); toast(safe(tr.name,'내 나무')+'와 연결했어요.'); return true;
  }).catch(function(err){
    var rep=recordError('나무 코드 연결 중 오류가 발생했어요',err,'나무 코드 연결');
    if(note){ note.textContent='연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.'; attachTroubleshootBtn(note,rep,openTreeChoice); }
    else openTroubleshoot(rep);
    return false;
  });
}
function migrateVirtualToEmptyPhysical(oldTree,inv,code){
  var oldTreeId=oldTree.id;
  var myChars=(oldTree.chars||[]).filter(function(c){ return c.uid===me.uid; }).map(function(c){ return Object.assign({joinedAt:c.joinedAt||Date.now()},c); });
  if(!myChars.length) myChars=[{id:'c0',uid:me.uid,name:meDoc.nick||'',color:'#000000',head:'tangerine',face:'',joinedAt:Date.now()}];
  var migrated={
    id:inv.treeId,f:inv.f,n:inv.n,virtual:false,ownerUid:me.uid,members:[me.uid],
    name:oldTree.name||'',intro:oldTree.intro||'',story:oldTree.story||'',
    basket:oldTree.basket||0,
    fruit:oldTree.fruit!=null?oldTree.fruit:Game.fruitMax(),
    bugs:oldTree.bugs!=null?oldTree.bugs:2,
    bugRuleVersion:oldTree.bugRuleVersion||2,
    t:oldTree.t||{water:0,fruit:Date.now(),bug:Date.now()},
    hearts:oldTree.hearts||0,pin:oldTree.pin||null,lastAct:oldTree.lastAct||null,
    chars:myChars
  };
  return Promise.all([
    B.listDiary(oldTreeId).catch(function(){ return []; }),
    B.listMessages(oldTreeId).catch(function(){ return []; })
  ]).then(function(res){
    var diaries=res[0]||[], oldMsgs=res[1]||[];
    return setMyTree(null).then(function(){
      return B.createTree(inv.treeId,migrated).catch(function(err){
        return setMyTree(oldTreeId).then(function(){ throw err; });
      });
    }).then(function(){
      return setMyTree(inv.treeId);
    }).then(function(){
      var copies=[];
      diaries.forEach(function(d){
        var day=d.docId||d.date; if(!day) return;
        var entry={date:d.date||day.split('__')[0],icon:d.icon||'tangerine',text:d.text||'',createdAt:d.createdAt||Date.now(),comment:d.comment||'',uid:me.uid,authorName:d.authorName||meDoc.nick||''};
        if(d.replyReadyAt!=null) entry.replyReadyAt=d.replyReadyAt;
        if(d.replyGenerated!=null) entry.replyGenerated=!!d.replyGenerated;
        copies.push(B.saveDiary(inv.treeId,day,entry).catch(function(){}));
      });
      oldMsgs.forEach(function(m){
        copies.push(B.addMessage(inv.treeId,{text:m.text,fromName:m.fromName||'회원',uid:m.uid||me.uid,ts:m.ts||Date.now()}).catch(function(){}));
      });
      return Promise.all(copies);
    }).then(function(){
      return B.detachTree(oldTreeId,me.uid).catch(function(){});
    }).then(function(){
      return B.deleteInvite(code).catch(function(){});
    }).then(function(){ invalidateTreesCache(); trackEvent('tree_connect',{kind:'migrate_empty_physical'}); return migrated; });
  });
}
function moveVirtualToOccupiedPhysical(oldTree,tr,inv,code){
  var oldTreeId=oldTree.id, now=Date.now();
  var myOldChar=(oldTree.chars||[]).filter(function(c){ return c.uid===me.uid; })[0]||{};
  var newChar={
    id:'c'+now.toString(36),uid:me.uid,
    name:myOldChar.name||meDoc.nick||'',
    color:myOldChar.color||'#000000',
    head:myOldChar.head||'tangerine',
    face:myOldChar.face||'',
    joinedAt:now
  };
  var joinPatch;
  if(inv.kind==='physical'){
    if((tr.members||[]).indexOf(me.uid)>=0) joinPatch=null;
    else joinPatch={members:(tr.members||[]).concat(me.uid),chars:(tr.chars||[]).concat([newChar]),joinCode:code};
  } else {
    var chars=(tr.chars||[]).map(function(c){ return Object.assign({},c); }), slot=chars.filter(function(c){ return c.id===inv.charId&&!c.uid; })[0];
    if(!slot) return Promise.reject(new Error('used-code'));
    slot.uid=me.uid; slot.joinedAt=now; if(!slot.name) slot.name=newChar.name;
    joinPatch={members:(tr.members||[]).concat(me.uid),chars:chars,joinCode:code};
  }
  return setMyTree(null).then(function(){
    var job=joinPatch?B.joinTree(inv.treeId,joinPatch):Promise.resolve();
    return job.catch(function(err){
      return setMyTree(oldTreeId).then(function(){ throw err; });
    });
  }).then(function(){
    return setMyTree(inv.treeId);
  }).then(function(){
    return B.detachTree(oldTreeId,me.uid).catch(function(){});
  }).then(function(){
    return B.deleteInvite(code).catch(function(){});
  }).then(function(){ invalidateTreesCache(); trackEvent('tree_connect',{kind:'move_occupied_physical'}); return tr; });
}
function openFieldTreeSwitch(targetTree){
  var tree=targetTree||T;
  if(!me||!tree||!tree.virtual||((tree.members||[]).indexOf(me.uid)<0&&tree.ownerUid!==me.uid)) return;
  openSheet('벼락밭 나무와 연결하기','나무 코드를 입력해 주세요. 비어 있는 벼락밭 나무라면 지금 나무의 이야기와 기록이 그대로 옮겨지고, 이미 다른 가족이 있는 나무라면 내 캐릭터만 그 나무로 옮겨가며 지금 나무는 삭제돼요.');
  sheet.classList.add('fieldSwitchSheet');
  var codeBlock=el('div','treeCodeBlock'), row=el('div','treeCodeRow'), label=txt('label','','나무 코드'), c=document.createElement('input'); c.type='text'; c.className='codeInput'; c.maxLength=12; c.autocomplete='off'; c.name='litttl-field-tree-code'; c.spellcheck=false; c.setAttribute('data-lpignore','true'); c.style.textTransform='uppercase'; label.appendChild(c);
  var note=el('p','note'), confirm=bigBtn('확인',function(){
    var value=c.value.trim().toUpperCase(); if(!value){ note.textContent='나무 코드를 입력해 주세요.'; return; }
    confirm.disabled=true; confirm.textContent='확인 중';
    B.getInvite(value).then(function(inv){
      if(!inv||!inv.treeId) throw new Error('invalid-code');
      return B.getTree(inv.treeId).then(function(tr){
        if(inv.kind!=='physical'&&!tr) throw new Error('invalid-code');
        if(inv.kind!=='physical'&&!(tr.chars||[]).some(function(x){ return x.id===inv.charId&&!x.uid; })) throw new Error('used-code');
        if(!tr){
          openSheet('비어 있는 벼락밭 나무로 옮길까요?','이 벼락밭 나무는 아직 비어 있어요. 지금 나무의 이름, 이야기, 우리 이야기, 귤·바구니 기록을 그대로 옮겨서 연결해요.');
          var n2=formNote(), a=actions();
          a.appendChild(ghostBtn('뒤로',function(){ openFieldTreeSwitch(tree); }));
          var go=bigBtn('기록을 옮겨서 연결하기',function(){
            go.disabled=true; go.textContent='옮기는 중';
            migrateVirtualToEmptyPhysical(tree,inv,value).then(function(res){
              if(sheet.open) sheet.close(); stopBeat(); clearWatch(); curKey=null; location.hash=''; startBeat(); route();
              toast(safe(res.name,'벼락밭 나무')+'로 기록을 모두 옮겨서 연결했어요.');
            }).catch(function(){ go.disabled=false; go.textContent='기록을 옮겨서 연결하기'; n2.textContent='나무를 옮기지 못했어요. 잠시 뒤 다시 시도해 주세요.'; });
          });
          a.appendChild(go);
          return;
        }
        openSheet('이미 가족이 있는 벼락밭 나무예요','「'+safe(tr.name,'이웃 나무')+'」에는 이미 돌보는 가족이 있어요. 지금 내 캐릭터가 이 나무로 옮겨가고, 지금 나무와 기록은 삭제돼요. 계속할까요?');
        var n3=formNote(), a2=actions();
        a2.appendChild(ghostBtn('뒤로',function(){ openFieldTreeSwitch(tree); }));
        var moveBtn=bigBtn('이 나무로 옮겨가기',function(){
          moveBtn.disabled=true; moveBtn.textContent='옮기는 중';
          moveVirtualToOccupiedPhysical(tree,tr,inv,value).then(function(res){
            if(sheet.open) sheet.close(); stopBeat(); clearWatch(); curKey=null; location.hash=''; startBeat(); route();
            toast(safe(res.name,'벼락밭 나무')+'로 옮겨갔어요.');
          }).catch(function(err){
            moveBtn.disabled=false; moveBtn.textContent='이 나무로 옮겨가기';
            n3.textContent=(err&&err.message==='used-code')?'이미 사용한 코드예요.':'나무를 옮기지 못했어요. 잠시 뒤 다시 시도해 주세요.';
          });
        });
        a2.appendChild(moveBtn);
      });
    }).catch(function(e){
      confirm.disabled=false; confirm.textContent='확인';
      if(e&&e.message==='used-code') note.textContent='이미 사용한 코드예요.';
      else note.textContent=(e&&e.message==='invalid-code')?'나무 코드를 찾지 못했어요. 다시 확인해 주세요.':'나무 정보를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    });
  }); row.append(label,confirm); codeBlock.appendChild(row); attachCount(c,12,codeBlock); sheet.append(codeBlock,note);
}
function openAdminTreeCode(f,n){
  var id=f+'-'+n; openSheet(F[f][0]+' '+n+'번 나무','관리자 전용 나무 코드');
  var value=code(), box=el('div','invite-code'), out=txt('code','',value), copy=txt('button','mini','복사하기');
  copy.onclick=function(){ copy.disabled=true; B.createInvite(value,{kind:'physical',treeId:id,f:f,n:n,createdBy:me.uid}).then(function(){ copyInvite(value); copy.textContent='복사됨'; }).catch(function(err){ copy.disabled=false; var rep=recordError('나무 코드를 만들지 못했어요',err,'관리자 나무 코드 발급'); openTroubleshoot(rep,{onBack:function(){ openAdminTreeCode(f,n); }}); }); };
  box.append(out,copy); sheet.appendChild(box);
}
function openMapTree(f,n){ if(isAdmin()) openAdminTreeCode(f,n); else goTree(f,n); }

/* ---------- 시트 ---------- */
var sheet=$('sheet'), cheerBox=null, cheerBackFn=null, lastFocusEl=null;
function resetToastHost(){ var t=$('toast'); if(t&&t.parentNode!==document.body) document.body.appendChild(t); }
function openSheet(title,sub){
  clearTimeout(authPopupTimer); tutorialAfterClose=null; resetToastHost();
  if(!sheet.open&&document.activeElement&&document.activeElement!==document.body&&!sheet.contains(document.activeElement)){
    lastFocusEl=document.activeElement;
  }
  cheerBox=null; cheerBackFn=null; document.body.classList.remove('authOpen'); sheet.className=''; sheet.innerHTML='';
  var x=el('button','x','×'); x.type='button'; x.setAttribute('aria-label','닫기'); x.onclick=function(){ sheet.close(); }; sheet.appendChild(x);
  var titleRow=el('div','sheetTitleRow'), heading=txt('h2','',title); heading.id='sheetTitle'; titleRow.appendChild(heading); sheet.appendChild(titleRow);
  sheet.setAttribute('aria-labelledby','sheetTitle');
  if(sub) sheet.appendChild(txt('p','sub',sub));
  if(!sheet.open) sheet.showModal(); return sheet;
}
var sheetBackdropDown=false;
function isBackdropHit(e){
  if(e.target!==sheet) return false;
  var r=sheet.getBoundingClientRect();
  return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;
}
sheet.addEventListener('pointerdown',function(e){ sheetBackdropDown=isBackdropHit(e); });
sheet.addEventListener('click',function(e){
  var downOutside=sheetBackdropDown; sheetBackdropDown=false;
  if(!downOutside||!isBackdropHit(e)||sheet.classList.contains('requiredChoice')) return;
  if(window.getSelection&&String(window.getSelection())) return;
  sheet.close();
});
sheet.addEventListener('cancel',function(e){ if(sheet.classList.contains('requiredChoice')) e.preventDefault(); });
sheet.addEventListener('close',function(){
  resetToastHost();
  document.body.classList.remove('authOpen');
  var fn=tutorialAfterClose; tutorialAfterClose=null;
  var restore=lastFocusEl; lastFocusEl=null;
  if(B) hud();
  if(fn) setTimeout(fn,60);
  else if(restore&&restore.isConnected&&typeof restore.focus==='function'&&!restore.closest('[hidden]')){
    setTimeout(function(){ try{ restore.focus(); }catch(e){} },10);
  }
});
function attachCount(i,max,host,useChars){
  var len=txt('span','fieldLen','');
  var sync=function(){
    if(useChars){ var chars=Array.from(i.value); if(chars.length>max) i.value=chars.slice(0,max).join(''); }
    var count=useChars?Array.from(i.value).length:i.value.length;
    len.textContent=count+'/'+max;
  };
  i.addEventListener('input',sync);
  sync();
  (host||i.parentNode||sheet).appendChild(len);
  return len;
}
function field(label,tag,val,max,rows,type){ var l=txt('label','',label), i=document.createElement(tag); if(val) i.value=val; if(max) i.maxLength=max; if(rows) i.rows=rows; if(type) i.type=type; l.appendChild(i); if(max) attachCount(i,max,l,max===CONFIG.cloudMaxLength); sheet.appendChild(l); return i; }
function passwordField(label){
  var wrap=el('label','passwordWrap'), caption=txt('span','',label), input=document.createElement('input'), toggle=txt('button','passwordToggle','보기');
  input.type='password'; input.maxLength=60; toggle.type='button'; toggle.setAttribute('aria-label',label+' 표시');
  toggle.onclick=function(){ var show=input.type==='password'; input.type=show?'text':'password'; toggle.textContent=show?'숨기기':'보기'; toggle.setAttribute('aria-label',label+(show?' 숨기기':' 표시')); };
  wrap.append(caption,input,toggle); sheet.appendChild(wrap); return input;
}
function actions(){ var a=el('div','acts'); sheet.appendChild(a); return a; }
function bigBtn(t,fn){ var b=el('button','big'); b.type='button'; b.textContent=t; b.onclick=fn; return b; }
function ghostBtn(t,fn){ var b=bigBtn(t,fn); b.classList.add('off'); return b; }
function formNote(){ var p=el('p','note'); p.setAttribute('role','status'); p.setAttribute('aria-live','polite'); sheet.appendChild(p); return p; }
function addSheetTitleTip(message){
  var row=sheet.querySelector('.sheetTitleRow'); if(!row) return;
  var help=el('button','sheetTitleHelp','?'); help.type='button'; help.setAttribute('aria-label','안내');
  var tip=txt('span','actTip',wrapTip(message,15)); tip.setAttribute('role','tooltip'); help.appendChild(tip); row.appendChild(help);
}

var AUTH_ERR={'auth/popup-blocked':'브라우저에서 로그인 팝업이 차단되었어요. 팝업 허용 후 다시 시도해 주세요.','auth/popup-closed-by-user':'Google 로그인 창이 닫혔어요. 다시 시도해 주세요.','auth/cancelled-popup-request':'로그인 요청이 취소되었어요. 다시 시도해 주세요.','auth/unauthorized-domain':'이 주소는 Google 로그인 허용 도메인에 등록되지 않았어요.','auth/network-request-failed':'인터넷 연결을 확인해 주세요.','auth/requires-recent-login':'다시 로그인한 뒤 진행해 주세요.'};
function openAuth(tab,lead){
  var msg=typeof lead==='string'?lead:(tab&&tab!=='login'&&tab!=='signup'?tab:'');
  openSheet('로그인',msg||'Google 계정으로 간편하게 시작해요.');
  document.body.classList.add('authOpen');
  sheet.classList.add('authSheet');
  $('login').hidden=true;
  var googleIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.96H1.28v3.09A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.63H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.37l4-3.09z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.63l4 3.09c.95-2.85 3.6-4.97 6.72-4.97z"/></svg>';
  var socials=el('div','socialStarts'), note=formNote();
  var gBtn=el('button','socialStart google',googleIcon+'<span>Google로 계속하기</span>');
  gBtn.onclick=function(){
    gBtn.disabled=true; note.textContent='';
    B.signInWithGoogle().then(function(){ if(sheet.open) sheet.close(); }).catch(function(x){
      gBtn.disabled=false;
      var code=x&&x.code;
      var msg=(x && x.message && x.message.includes('도메인')) ? x.message : (AUTH_ERR[code] || (x && x.message) || 'Google 로그인을 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      note.textContent=msg;
      if(code!=='auth/popup-closed-by-user'&&code!=='auth/cancelled-popup-request'){
        var rep=recordError(msg,x,'Google 로그인');
        openTroubleshoot(rep,{onBack:function(){ openAuth(tab,lead); }});
      }
    });
  };
  socials.appendChild(gBtn);
  var legal=el('p','authLegalNote');
  legal.append(
    document.createTextNode('계속 진행하면 '),
    function(){ var b=txt('button','link','이용약관'); b.type='button'; b.onclick=openTerms; return b; }(),
    document.createTextNode('과 '),
    function(){ var b=txt('button','link','개인정보처리방침'); b.type='button'; b.onclick=openPrivacy; return b; }(),
    document.createTextNode('에 동의하게 됩니다.')
  );
  sheet.append(socials,note,legal);
}
var pendingTutorial=false;
function openJoin(){
  openTreeCode();
}
function joinWith(code,note){
  return connectWithCode(code,note);
}
function appendOwnGuestbook(backFn){
  try{ localStorage.setItem('littlSeen',String(Date.now())); }catch(e){}
  hud();
  var gbSec=el('section','guestbookSection');
  gbSec.appendChild(txt('h3','guestbookHeading','이웃이 남긴 응원'));
  gbSec.appendChild(txt('p','guestbookSub','방문한 이웃들이 나무 이야기에 남긴 댓글이에요.'));
  cheerBox=el('div','cheers');
  gbSec.appendChild(cheerBox);
  sheet.appendChild(gbSec);
  renderCheerList(backFn||openEdit);
}
function openEdit(){
  if(!isMine()) return;
  openSheet('나무 이야기');
  sheet.classList.add('guestbookSheet','treeStorySheet');
  addSheetTitleTip('다른 사람들에게 보여요.');
  sheet.appendChild(txt('p','lead',safe(T.name,'이름 없는 나무')));
  if(T.intro) sheet.appendChild(txt('p','treeStoryIntro',Filter.mask(T.intro)));
  sheet.appendChild(txt('p','story',T.story?Filter.mask(T.story):'아직 적힌 이야기가 없어요.'));
  actions().appendChild(bigBtn('수정하기',openEditForm));
  appendOwnGuestbook(openEdit);
}
function openEditForm(){
  if(!isMine()) return;
  openSheet('나무 이야기');
  sheet.classList.add('treeStorySheet','treeStoryEditSheet');
  addSheetTitleTip('다른 사람들에게 보여요.');
  var n=field('나무 이름 (팻말)','input',T.name,8), i=field('소개 한 줄','input',T.intro,40), s=field('나무 이야기','textarea',T.story,CONFIG.storyMaxLength,6), note=formNote();
  n.placeholder='나무에게 이름을 지어주세요'; i.placeholder='어떤 나무인가요?'; s.placeholder='이 나무를 키우게 된 이야기를 적어주세요';
  var saveBtn=bigBtn('저장',function(){
    if(Filter.bad(n.value)||Filter.bad(i.value)||Filter.bad(s.value)){ note.textContent=NOT_ALLOWED; return; }
    var nextName=Array.from(n.value.trim()).slice(0,8).join(''), nextIntro=i.value.trim(), nextStory=s.value.trim();
    var commitEdit=function(){
      T.name=nextName; T.intro=nextIntro; T.story=nextStory; persist(['name','intro','story']); flush(); invalidateTreesCache();
      try{ localStorage.setItem('littlMine',JSON.stringify({f:T.f,n:T.n,name:T.name})); }catch(e){}
      softUpdate(); openEdit(); toast('저장했어요.');
    };
    if(!nextName){ commitEdit(); return; }
    saveBtn.disabled=true; saveBtn.textContent='확인 중'; note.textContent='';
    listTreesCached(true).then(function(trees){
      var key=normalizeTreeName(nextName);
      var dup=(trees||[]).some(function(t){ return t&&t.id!==T.id&&normalizeTreeName(t.name)===key; });
      if(dup){
        saveBtn.disabled=false; saveBtn.textContent='저장';
        note.textContent='이미 사용 중인 나무 이름이에요. 다른 이름을 지어주세요.';
        n.focus();
        return;
      }
      commitEdit();
    }).catch(function(){
      saveBtn.disabled=false; saveBtn.textContent='저장';
      note.textContent='나무 이름을 확인하지 못했어요. 인터넷 연결을 확인해 주세요.';
    });
  });
  var editActs=actions();
  editActs.append(ghostBtn('취소',openEdit),saveBtn);
}
function openStory(){
  if(!T) return;
  openSheet(safe(T.name,'이름 없는 나무'),forestLabel(T.f,T.n));
  if(T.intro){ var i=txt('p','lead',Filter.mask(T.intro)); sheet.appendChild(i); }
  sheet.appendChild(txt('p','story',T.story?Filter.mask(T.story):'아직 적힌 이야기가 없어요.'));
}
var diaryMonth=null, diaryCache={}, DIARY_ICONS=[['tangerine','귤'],['happy','기쁨'],['heart','마음'],['sun','맑음'],['cloud','흐림'],['rain','비'],['flower','꽃'],['star','별']];
function diaryIconKey(v){ return ({'🍊':'tangerine','☺':'happy','♡':'heart','☀':'sun','☁':'cloud','☂':'rain','✿':'flower','★':'star'})[v]||v||'tangerine'; }
function diaryIconLabel(v){ var k=diaryIconKey(v), row=DIARY_ICONS.filter(function(x){ return x[0]===k; })[0]; return row?row[1]:'귤'; }
function diaryBucket(key){ return diaryCache[key]||(diaryCache[key]={entries:{}}); }
function diaryFor(key,uid){ var b=diaryCache[key], entries=b&&b.entries||{}; if(uid&&entries[uid]) return entries[uid]; var ids=Object.keys(entries); return ids.length?entries[ids[0]]:null; }
function diaryAuthorName(uid){ var c=(T&&T.chars||[]).filter(function(x){ return x.uid===uid; })[0]; return c&&c.name||((me&&uid===me.uid&&meDoc&&meDoc.nick)||'가족'); }
function diaryIconSvg(v){
  var k=diaryIconKey(v);
  var svgs={
    tangerine:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 12.5 C12.2 12.5 7 17.5 7.2 24.5 C7.4 31.2 12.6 35.5 20 35.5 C27.4 35.5 32.6 31.2 32.8 24.5 C33 17.5 27.8 12.5 20 12.5 Z" fill="#F78403" stroke="#23231D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12.5 C20 9.5 21 7 22.8 5.2" stroke="#23231D" stroke-width="2.3" stroke-linecap="round"/><path d="M20.2 11.2 C22 6.8 27.2 6.2 29.8 8.8 C27.2 11.8 22.6 12.4 20.2 11.2 Z" fill="#528E29" stroke="#23231D" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 20 C13.5 17.6 15.6 16.4 18 16.2" stroke="#FAF6F1" stroke-width="2" stroke-linecap="round" opacity="0.72"/></svg>',
    happy:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 6.5 C28.2 6.5 33.8 12.2 33.5 20.5 C33.2 28.5 27.8 33.8 20 33.8 C12.2 33.8 6.8 28.5 6.5 20.5 C6.2 12.2 11.8 6.5 20 6.5 Z" fill="#FAF6F1" stroke="#23231D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.2 16.2 C10.8 9.2 17.5 7.4 22.5 8.5 C26.8 9.4 30.2 11.8 31.8 15.8 C27 13.8 22.4 13.5 18.2 14.5 C14.8 13.8 11.4 14.4 8.2 16.2 Z" fill="#342D22" stroke="#23231D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.2 21.5 C14.2 19.6 16.2 19.6 17.2 21.5" stroke="#23231D" stroke-width="2.2" stroke-linecap="round"/><path d="M22.8 21.5 C23.8 19.6 25.8 19.6 26.8 21.5" stroke="#23231D" stroke-width="2.2" stroke-linecap="round"/><circle cx="11.8" cy="24.5" r="2.2" fill="#F78403" opacity="0.65"/><circle cx="28.2" cy="24.5" r="2.2" fill="#F78403" opacity="0.65"/><path d="M16 25.5 C17.5 28.2 22.5 28.2 24 25.5" stroke="#23231D" stroke-width="2.2" stroke-linecap="round"/></svg>',
    heart:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 33.5 C19.4 33.2 6.8 24.8 6.8 15.5 C6.8 10.6 10.6 7.5 14.8 7.5 C17.6 7.5 19.2 9.2 20 11.2 C20.8 9.2 22.4 7.5 25.2 7.5 C29.4 7.5 33.2 10.6 33.2 15.5 C33.2 24.8 20.6 33.2 20 33.5 Z" fill="#F78403" stroke="#23231D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6 13.8 C12.4 11.8 14 10.8 15.8 10.8" stroke="#FAF6F1" stroke-width="2" stroke-linecap="round" opacity="0.72"/></svg>',
    sun:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 4.5 V8.2 M20 31.8 V35.5 M4.8 20 H8.5 M31.5 20 H35.2 M9.4 9.4 L12 12 M28 28 L30.6 30.6 M30.6 9.4 L28 12 M12 28 L9.4 30.6" stroke="#23231D" stroke-width="2.4" stroke-linecap="round"/><path d="M20 11.5 C24.8 11.4 28.6 15.2 28.5 20 C28.6 24.8 24.8 28.6 20 28.5 C15.2 28.6 11.4 24.8 11.5 20 C11.4 15.2 15.2 11.4 20 11.5 Z" fill="#F78403" stroke="#23231D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6 16.5 C16.6 15 18.2 14.4 19.8 14.4" stroke="#FAF6F1" stroke-width="1.9" stroke-linecap="round" opacity="0.72"/></svg>',
    cloud:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M12.5 29.5 H28.8 C32.8 29.5 35.5 26.8 35.5 23.2 C35.5 19.8 33 17.2 29.6 17 C28.6 12.2 24.6 9.5 20 9.8 C15.4 10 12.2 13.2 11.8 17.5 C8.2 18 5.5 20.8 5.5 24.2 C5.5 27.6 8.6 29.5 12.5 29.5 Z" fill="#FAF6F1" stroke="#23231D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 26.2 H29.5" stroke="#D8CEBF" stroke-width="2" stroke-linecap="round"/></svg>',
    rain:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M12.5 24 H28.2 C32 24 34.5 21.5 34.5 18.2 C34.5 15 32.2 12.8 29 12.6 C28.2 8.2 24.5 5.8 20.2 6 C15.8 6.2 12.8 9.2 12.4 13 C9 13.5 6.5 16 6.5 19 C6.5 22.2 9.2 24 12.5 24 Z" fill="#EFE8DC" stroke="#23231D" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 28.2 C13.5 28.2 11.2 31.8 11.4 33.4 C11.6 34.8 13.6 35 14.2 33.6 C14.6 32.4 13.5 28.2 13.5 28.2 Z" fill="#7CA7C2" stroke="#23231D" stroke-width="1.9" stroke-linejoin="round"/><path d="M20.5 28.5 C20.5 28.5 18.2 32.1 18.4 33.7 C18.6 35.1 20.6 35.3 21.2 33.9 C21.6 32.7 20.5 28.5 20.5 28.5 Z" fill="#7CA7C2" stroke="#23231D" stroke-width="1.9" stroke-linejoin="round"/><path d="M27.5 28.2 C27.5 28.2 25.2 31.8 25.4 33.4 C25.6 34.8 27.6 35 28.2 33.6 C28.6 32.4 27.5 28.2 27.5 28.2 Z" fill="#7CA7C2" stroke="#23231D" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    flower:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M25.2 29.8 C28.5 28 32.8 28.6 34.5 31.5 C31.4 33.5 27.4 33 25.2 29.8 Z" fill="#528E29" stroke="#23231D" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 7.5 C22.8 7.5 24.8 10 24.4 13.4 C27.5 12 31 13.2 31.8 16 C32.6 18.8 30.6 21.4 27.5 22 C29.8 24.5 29.6 28.2 27 30 C24.5 31.8 21.6 30.4 20 27.6 C18.4 30.4 15.5 31.8 13 30 C10.4 28.2 10.2 24.5 12.5 22 C9.4 21.4 7.4 18.8 8.2 16 C9 13.2 12.5 12 15.6 13.4 C15.2 10 17.2 7.5 20 7.5 Z" fill="#FAF6F1" stroke="#23231D" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="20" r="4.6" fill="#F78403" stroke="#23231D" stroke-width="2.1"/></svg>',
    star:'<svg class="diaryIconArt" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 6.2 C21.2 6.2 22.8 12.2 24.2 13.6 C25.6 15 32.5 14.8 33.2 16.4 C33.8 17.8 28.4 22.2 28 24 C27.6 25.8 30.2 31.8 28.6 32.8 C27.2 33.8 21.8 29.6 20 29.6 C18.2 29.6 12.8 33.8 11.4 32.8 C9.8 31.8 12.4 25.8 12 24 C11.6 22.2 6.2 17.8 6.8 16.4 C7.5 14.8 14.4 15 15.8 13.6 C17.2 12.2 18.8 6.2 20 6.2 Z" fill="#F78403" stroke="#23231D" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 17.5 L20 14.5 L21.5 18.2" stroke="#FAF6F1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/></svg>'
  };
  return svgs[k]||svgs.tangerine;
}
function orderedDiaryMembers(key){
  var list=(T&&T.chars||[]).map(function(c,idx){ return {c:c,idx:idx}; }).filter(function(x){ return x.c&&x.c.uid; });
  list.sort(function(a,b){
    var ja=a.c.joinedAt, jb=b.c.joinedAt;
    if(ja!=null&&jb!=null&&ja!==jb) return ja-jb;
    if(ja!=null&&jb==null) return a.c.uid===T.ownerUid?-1:1;
    if(ja==null&&jb!=null) return b.c.uid===T.ownerUid?1:-1;
    if(a.c.uid===T.ownerUid&&b.c.uid!==T.ownerUid) return -1;
    if(b.c.uid===T.ownerUid&&a.c.uid!==T.ownerUid) return 1;
    return a.idx-b.idx;
  });
  var out=list.map(function(x){ return x.c; }), seen={};
  out.forEach(function(c){ seen[c.uid]=1; });
  var entries=(diaryBucket(key)&&diaryBucket(key).entries)||{};
  Object.keys(entries).forEach(function(uid){
    if(!seen[uid]){ seen[uid]=1; out.push({uid:uid,name:entries[uid].authorName||diaryAuthorName(uid)}); }
  });
  return out;
}
var diaryLoadState='idle', diaryLoadReport=null;
function openDiary(month,ready){
  if(!isMine()) return;
  if(!ready){
    var treeId=view.id; diaryCache={}; diaryLoadState='loading'; openDiary(month,true);
    B.listDiary(treeId).then(function(rows){ diaryCache={}; var cleanup=[], admin=isAdmin(), seedTexts=admin?[]:Object.keys(diaryExamples()).map(function(k){ return diaryExamples()[k].text; }); (rows||[]).forEach(function(r){
        if(!admin&&r.uid===me.uid&&seedTexts.indexOf(r.text)>=0){ cleanup.push(B.saveDiary(treeId,r.docId||r.date,null)); return; }
        var day=(r.date||'').split('__')[0], author=r.uid||'legacy'; if(!day) return;
        diaryBucket(day).entries[author]={docId:r.docId||(day+'__'+author),date:day,icon:diaryIconKey(r.icon),text:r.text,createdAt:r.createdAt||0,replyReadyAt:r.replyReadyAt!=null?r.replyReadyAt:null,replyGenerated:!!r.replyGenerated,comment:r.comment||'',uid:author,authorName:r.authorName||diaryAuthorName(author)};
      });
      return Promise.all(cleanup);
    }).then(function(){
      diaryLoadState='ready';
      if(view&&view.id===treeId&&sheet.open&&sheet.querySelector('h2')&&sheet.querySelector('h2').textContent==='우리 이야기') openDiary(month,true);
    }).catch(function(err){
      diaryLoadState='error';
      diaryLoadReport=recordError('우리 이야기를 불러오지 못했어요',err,'우리 이야기 목록');
      if(view&&view.id===treeId&&sheet.open&&sheet.querySelector('h2')&&sheet.querySelector('h2').textContent==='우리 이야기') openDiary(month,true);
      toast('우리 이야기를 불러오지 못했어요.');
    }); return;
  }
  diaryMonth=month?new Date(month.getFullYear(),month.getMonth(),1):(diaryMonth||new Date(new Date().getFullYear(),new Date().getMonth(),1));
  openSheet('우리 이야기'); sheet.classList.add('diarySheet');
  if(diaryLoadState==='loading') sheet.appendChild(txt('p','diaryStatusNote','우리 이야기를 불러오는 중이에요.'));
  else if(diaryLoadState==='error'){
    var errBox=el('p','diaryStatusNote','우리 이야기를 불러오지 못했어요. ');
    var retry=txt('button','link','다시 시도'); retry.type='button'; retry.onclick=function(){ openDiary(diaryMonth,false); };
    errBox.appendChild(retry);
    if(diaryLoadReport){ attachTroubleshootBtn(errBox,diaryLoadReport,function(){ openDiary(diaryMonth,true); }); }
    sheet.appendChild(errBox);
  }
  var head=el('div','diaryMonthHead'), prev=txt('button','diaryArrow','‹'), next=txt('button','diaryArrow','›'), right=el('div','diaryMonthRight'), todayBtn=bigBtn('오늘',function(){ var d=new Date(); openDiary(new Date(d.getFullYear(),d.getMonth(),1),true); });
  prev.setAttribute('aria-label','이전 달'); next.setAttribute('aria-label','다음 달'); prev.onclick=function(){ openDiary(new Date(diaryMonth.getFullYear(),diaryMonth.getMonth()-1,1),true); }; next.onclick=function(){ openDiary(new Date(diaryMonth.getFullYear(),diaryMonth.getMonth()+1,1),true); }; todayBtn.classList.add('diaryToday'); right.append(next,todayBtn);
  head.append(prev,txt('b','',diaryMonth.getFullYear()+'년 '+(diaryMonth.getMonth()+1)+'월'),right); sheet.appendChild(head);
  var week=el('div','diaryWeek'); ['일','월','화','수','목','금','토'].forEach(function(d){ week.appendChild(txt('span','',d)); }); sheet.appendChild(week);
  var cal=el('div','diaryCalendar'), first=new Date(diaryMonth.getFullYear(),diaryMonth.getMonth(),1), last=new Date(diaryMonth.getFullYear(),diaryMonth.getMonth()+1,0).getDate(), nowKey=dateKey(new Date());
  for(var z=0;z<first.getDay();z++) cal.appendChild(el('span'));
  for(var day=1;day<=last;day++)(function(day){
    var d=new Date(diaryMonth.getFullYear(),diaryMonth.getMonth(),day), key=dateKey(d), entry=diaryFor(key,me.uid)||diaryFor(key), b=el('button','diaryDay'+(key===nowKey?' today':''));
    b.appendChild(entry?el('em','diaryMark',diaryIconSvg(entry.icon)):txt('span','',String(day))); b.setAttribute('aria-label',key+(entry?' 기록 있음':' 기록 없음')); b.onclick=function(){ openDiaryEntry(key); }; cal.appendChild(b);
  })(day);
  sheet.appendChild(cal); var foot=el('div','diaryFooter'); foot.appendChild(bigBtn('백업하기',openDiaryExport)); sheet.appendChild(foot);
}
function openDiaryEntry(key,editing,selectedUid){
  var family=orderedDiaryMembers(key);
  selectedUid=selectedUid||me.uid;
  var bucket=diaryBucket(key), saved=bucket.entries[selectedUid], entry=Object.assign({icon:'tangerine',text:'',createdAt:0,replyReadyAt:null,replyGenerated:false,comment:'',uid:selectedUid,authorName:diaryAuthorName(selectedUid)},saved||{}), d=new Date(key+'T00:00:00'); entry.icon=diaryIconKey(entry.icon);
  openSheet((d.getMonth()+1)+'월 '+d.getDate()+'일 우리 이야기'); sheet.querySelector('h2').innerHTML='<span class="diaryTitleIcon">'+diaryIconSvg(entry.icon)+'</span><span>'+(d.getMonth()+1)+'월 '+d.getDate()+'일 우리 이야기</span>'; sheet.classList.add('diarySheet','diaryEntry');
  if(family.length>1){ var tabs=el('div','diaryPersonTabs'); family.forEach(function(c){ var tabName=c.name||(bucket.entries[c.uid]&&bucket.entries[c.uid].authorName)||(c.uid===me.uid?(meDoc&&meDoc.nick||'나'):'가족'); var b=txt('button','',tabName); b.setAttribute('aria-pressed',c.uid===selectedUid); b.onclick=function(){ openDiaryEntry(key,false,c.uid); }; tabs.appendChild(b); }); sheet.appendChild(tabs); }
  if(selectedUid!==me.uid&&!saved){ sheet.appendChild(txt('p','diaryRead',entry.authorName+'님은 이날 아직 기록을 남기지 않았어요.')); actions().appendChild(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); })); return; }
  if(!saved&&selectedUid===me.uid){
    var todayKey=today();
    if(key<todayKey){ sheet.appendChild(txt('p','diaryRead','지난 날짜의 일기는 새로 쓸 수 없어요.')); actions().appendChild(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); })); return; }
    if(key>todayKey){ sheet.appendChild(txt('p','diaryRead','아직 다가오지 않은 날짜에는 일기를 쓸 수 없어요.')); actions().appendChild(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); })); return; }
    if(meDoc&&meDoc.lastDiaryReplyDate===key){ sheet.appendChild(txt('p','diaryRead','오늘은 이미 일기를 작성했어요. 하루에 한 번만 새로 쓸 수 있어요.')); actions().appendChild(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); })); return; }
  }
  if(saved&&!editing){
    sheet.appendChild(txt('label','','오늘의 그림'));
    var drawing=el('div','diaryIcons'); drawing.appendChild(el('span','diaryIcon',diaryIconSvg(entry.icon))); sheet.appendChild(drawing);
    sheet.appendChild(txt('p','diaryRead',entry.text||'아직 적힌 이야기가 없어요.'));
    var replyInfo=treeReplyInfo(key,entry);
    var makeReplyCard=function(bodyText){
      var reply=el('section','treeReply');
      var h3Wrap=el('div','treeReplyHead');
      var h3=txt('h3','','나무가');
      var tipBtn=el('button','treeTipBtn','?');
      tipBtn.setAttribute('type','button');
      tipBtn.setAttribute('aria-label','AI 답장 안내');
      tipBtn.setAttribute('aria-expanded','false');
      var tip=txt('span','treeTipMsg','이 답장은 AI가 작성하며, 입력하신 내용은 AI 학습에 사용되지 않습니다.');
      tip.setAttribute('role','tooltip');
      tipBtn.appendChild(tip);
      tipBtn.onclick=function(ev){
        ev.stopPropagation();
        var next=!tipBtn.classList.contains('open');
        tipBtn.classList.toggle('open',next);
        tipBtn.setAttribute('aria-expanded',String(next));
      };
      sheet.addEventListener('click',function(){ tipBtn.classList.remove('open'); tipBtn.setAttribute('aria-expanded','false'); });
      h3Wrap.append(h3,tipBtn);
      reply.append(h3Wrap,txt('p','',bodyText));
      return reply;
    };
    if(replyInfo.text){
      sheet.appendChild(makeReplyCard(replyInfo.text));
    } else if(!entry.comment&&selectedUid===me.uid&&isMine()&&entry.text){
      var pendingCard=makeReplyCard(isAdmin()?'나무의 답장을 불러오고 있어요.':'나무의 답장이 아직 도착하지 않았어요.');
      var retryBtn=ghostBtn('나무 답장 받기',function(){
        retryBtn.disabled=true; retryBtn.textContent='답장 받는 중';
        requestDiaryReply(entry.text,entry.icon).then(function(res){
          if(!res||!res.reply||res.unavailable){
            retryBtn.disabled=false; retryBtn.textContent='다시 시도하기';
            pendingCard.querySelector('p').textContent='현재 서버(/api/diary-reply)에 연결할 수 없어 답장을 받아오지 못했어요.';
            return;
          }
          var now=Date.now(), baseCreated=entry.createdAt||now;
          var updated=Object.assign({},entry,{createdAt:baseCreated,replyGenerated:true,comment:res.reply,replyReadyAt:isAdmin()?now:(baseCreated+24*60*60*1000)});
          delete updated.docId; delete updated._autoRetryDone;
          var targetDocId=saved.docId||(key+'__'+me.uid);
          return B.saveDiary(view.id,targetDocId,updated).then(function(){
            diaryBucket(key).entries[me.uid]=Object.assign({docId:targetDocId},updated);
            openDiaryEntry(key,false,me.uid);
            toast(isAdmin()?'나무의 답장이 도착했어요.':'나무가 일기를 읽기 시작했어요.');
          });
        }).catch(function(err){
          retryBtn.disabled=false; retryBtn.textContent='다시 시도하기';
          var rep=recordError('나무의 답장을 받아오지 못했어요',err,'우리 이야기 AI 답장');
          var replyBody=pendingCard.querySelector('p');
          replyBody.textContent=(err&&err.message)||'나무의 답장을 받아오지 못했어요. 잠시 뒤 다시 시도해 주세요.';
          attachTroubleshootBtn(replyBody,rep,function(){ openDiaryEntry(key,false,me.uid); });
        });
      });
      retryBtn.classList.add('treeReplyRetry');
      pendingCard.appendChild(retryBtn);
      sheet.appendChild(pendingCard);
      if(isAdmin()&&!saved._autoRetryDone){
        saved._autoRetryDone=true;
        retryBtn.click();
      }
    }
    var readActions=actions(); readActions.classList.add('diaryActions');
    readActions.appendChild(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); }));
    var canDelete=isMine()&&(selectedUid===me.uid||T.ownerUid===me.uid||isAdmin());
    if(canDelete||selectedUid===me.uid){
      var rightActs=el('div','diaryActionsRight');
      if(canDelete){
        var delBtn=ghostBtn('삭제하기',function(){ openDiaryDeleteConfirm(key,selectedUid,saved); });
        delBtn.classList.add('danger');
        rightActs.appendChild(delBtn);
      }
      if(selectedUid===me.uid){
        rightActs.appendChild(bigBtn('수정하기',function(){ openDiaryEntry(key,true,me.uid); }));
      }
      readActions.appendChild(rightActs);
    }
    return;
  }
  sheet.appendChild(txt('label','','오늘의 그림')); var icons=el('div','diaryIcons'); icons.setAttribute('role','group'); icons.setAttribute('aria-label','오늘의 그림 선택');
  DIARY_ICONS.forEach(function(icon){ var b=el('button','diaryIcon',diaryIconSvg(icon[0])); b.type='button'; b.setAttribute('aria-label',icon[1]+' 그림'); b.setAttribute('aria-pressed',entry.icon===icon[0]); b.onclick=function(){ entry.icon=icon[0]; icons.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); sheet.querySelector('h2').innerHTML='<span class="diaryTitleIcon">'+diaryIconSvg(entry.icon)+'</span><span>'+(d.getMonth()+1)+'월 '+d.getDate()+'일 우리 이야기</span>'; }; icons.appendChild(b); }); sheet.appendChild(icons);
  var ta=field('나무에게','textarea',entry.text,CONFIG.diaryMaxLength,10); ta.placeholder='오늘 나무에게 들려주고 싶은 이야기를 적어보세요.';
  var note=formNote(), a=actions(); a.classList.add('diaryActions');
  var backBtn=ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); });
  var saveBtn=bigBtn('저장',function(){
    var text=ta.value.trim();
    if(!text){ note.textContent='나무에게 들려주고 싶은 이야기를 적어주세요.'; ta.focus(); return; }
    if(Filter.bad(text)){ note.textContent=NOT_ALLOWED; return; }
    note.textContent='';
    if(saved){
      var editedEntry={date:saved.date||key,icon:entry.icon,text:text,createdAt:saved.createdAt||Date.now(),comment:saved.comment||'',uid:me.uid,authorName:meDoc.nick||diaryAuthorName(me.uid)};
      if(saved.replyReadyAt!=null) editedEntry.replyReadyAt=saved.replyReadyAt;
      if(saved.replyGenerated) editedEntry.replyGenerated=true;
      var targetDocId=saved.docId||(key+'__'+me.uid);
      saveBtn.disabled=true; backBtn.disabled=true; saveBtn.textContent='저장 중';
      var ensureReply=!editedEntry.comment
        ? requestDiaryReply(text,entry.icon).then(function(res){
            if(res&&res.reply&&!res.unavailable){
              var baseAt=editedEntry.createdAt||Date.now();
              editedEntry.comment=res.reply;
              editedEntry.replyGenerated=true;
              editedEntry.replyReadyAt=isAdmin()?Date.now():(baseAt+24*60*60*1000);
            }
          }).catch(function(){})
        : Promise.resolve();
      ensureReply.then(function(){
        return B.saveDiary(view.id,targetDocId,editedEntry);
      }).then(function(){
        diaryBucket(key).entries[me.uid]=Object.assign({docId:targetDocId},editedEntry);
        trackEvent('diary_save',{mode:'edit'});
        openDiaryEntry(key,false,me.uid);
        toast('우리 이야기를 수정했어요.');
      }).catch(function(){
        saveBtn.disabled=false; backBtn.disabled=false; saveBtn.textContent='저장';
        note.textContent='저장하지 못했어요. 인터넷 연결을 확인해 주세요.';
      });
      return;
    }
    var saveKey=today();
    if(diaryBucket(saveKey).entries[me.uid]||(meDoc&&meDoc.lastDiaryReplyDate===saveKey)){
      note.textContent='오늘 날짜('+saveKey+')에는 이미 일기를 작성했어요. 하루에 한 번만 새로 쓸 수 있어요.';
      return;
    }
    saveBtn.disabled=true; backBtn.disabled=true; saveBtn.textContent='저장 중';
    requestDiaryReply(text,entry.icon).catch(function(err){
      return {unavailable:true,reply:'',errorMsg:(err&&err.message)||''};
    }).then(function(res){
      var now=Date.now(), authorName=meDoc.nick||diaryAuthorName(me.uid), hasReply=!!(res&&res.reply&&!res.unavailable);
      var newEntry={date:saveKey,icon:entry.icon,text:text,createdAt:now,replyGenerated:hasReply,comment:hasReply?res.reply:'',uid:me.uid,authorName:authorName};
      if(hasReply) newEntry.replyReadyAt=isAdmin()?now:(now+24*60*60*1000);
      var newDocId=saveKey+'__'+me.uid;
      return B.saveDiary(view.id,newDocId,newEntry).then(function(){
        meDoc.lastDiaryReplyDate=saveKey;
        B.setUser(me.uid,{lastDiaryReplyDate:saveKey}).catch(function(){});
        diaryBucket(saveKey).entries[me.uid]=Object.assign({docId:newDocId},newEntry);
        trackEvent('diary_save',{mode:'create',has_reply:hasReply});
        var saveDate=new Date(saveKey+'T00:00:00');
        diaryMonth=new Date(saveDate.getFullYear(),saveDate.getMonth(),1);
        openDiaryEntry(saveKey,false,me.uid);
        toast(hasReply?(isAdmin()?'우리 이야기를 저장했어요. 나무의 답장이 도착했어요.':'우리 이야기를 저장했어요. 답장이 올 때까지 24시간 기다려야 해요.'):((res&&res.errorMsg)||'우리 이야기를 저장했어요. 나무 답장 서버에 연결할 수 없어 답장은 나중에 받을 수 있어요.'));
      });
    }).catch(function(err){
      saveBtn.disabled=false; backBtn.disabled=false; saveBtn.textContent='저장';
      var rep=recordError('우리 이야기를 저장하지 못했어요',err,'우리 이야기 저장');
      note.textContent=(err&&err.message)||'저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
      attachTroubleshootBtn(note,rep,function(){ openDiaryEntry(key,true,me.uid); });
    });
  });
  a.append(backBtn,saveBtn);
}
function openDiaryDeleteConfirm(key,selectedUid,saved){
  if(!isMine()||!saved) return;
  var d=new Date(key+'T00:00:00'), isTodayOwn=key===today()&&selectedUid===me.uid;
  var sub='삭제한 일기와 나무의 답장은 되돌릴 수 없어요.'+(isTodayOwn?' 오늘 날짜 이야기를 지우면 오늘 다시 작성할 수 있어요.':'');
  openSheet((d.getMonth()+1)+'월 '+d.getDate()+'일 이야기를 삭제할까요?',sub);
  sheet.classList.add('diarySheet');
  var note=formNote(), a=actions();
  var cancelBtn=ghostBtn('취소',function(){ openDiaryEntry(key,false,selectedUid); });
  var delBtn=bigBtn('삭제하기',function(){
    var targetDocId=saved.docId||(key+'__'+selectedUid);
    cancelBtn.disabled=true; delBtn.disabled=true; delBtn.textContent='삭제 중'; note.textContent='';
    B.saveDiary(view.id,targetDocId,null).then(function(){
      if(diaryBucket(key).entries) delete diaryBucket(key).entries[selectedUid];
      if(isTodayOwn&&meDoc&&meDoc.lastDiaryReplyDate===key){
        meDoc.lastDiaryReplyDate='';
        return B.setUser(me.uid,{lastDiaryReplyDate:''}).catch(function(){});
      }
    }).then(function(){
      openDiary(diaryMonth,true);
      toast('우리 이야기를 삭제했어요.');
    }).catch(function(){
      cancelBtn.disabled=false; delBtn.disabled=false; delBtn.textContent='삭제하기';
      note.textContent='삭제하지 못했어요. 인터넷 연결을 확인해 주세요.';
    });
  });
  delBtn.classList.add('danger');
  a.append(cancelBtn,delBtn);
}
function diaryEntries(range){
  var now=new Date(), start=null;
  if(range==='year'){ start=new Date(now); start.setFullYear(start.getFullYear()-1); start.setHours(0,0,0,0); }
  if(range==='month'){ start=new Date(now); start.setMonth(start.getMonth()-1); start.setHours(0,0,0,0); }
  if(range==='week'){ start=new Date(now); start.setDate(start.getDate()-6); start.setHours(0,0,0,0); }
  return Object.keys(diaryCache).sort().filter(function(k){ var d=new Date(k+'T00:00:00'); return (!start||d>=start)&&d<=now; }).reduce(function(out,k){ Object.keys(diaryCache[k].entries||{}).forEach(function(uid){ var e=diaryCache[k].entries[uid]; out.push({date:k,author:e.authorName||diaryAuthorName(uid),icon:e.icon||'',text:e.text||'',comment:treeCommentFor(k,e)}); }); return out; },[]);
}
function openDiaryExport(){
  openSheet('우리 이야기 백업하기'); sheet.classList.add('diarySheet'); var range='all', box=el('div','diaryRange');
  [['all','전체'],['year','1년'],['month','한 달'],['week','일주일']].forEach(function(it){ var b=ghostBtn(it[1],function(){ range=it[0]; box.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); }); b.setAttribute('aria-pressed',it[0]===range); box.appendChild(b); }); sheet.appendChild(box);
  actions().append(ghostBtn('달력으로',function(){ openDiary(diaryMonth,true); }),bigBtn('TXT 파일로 백업하기',function(){
    var rows=diaryEntries(range), text='우리 이야기\r\n\r\n'+rows.map(function(r){ return r.date+'  '+r.author+'  '+diaryIconLabel(r.icon)+'\r\n나무에게\r\n'+r.text+(r.comment?'\r\n\r\n나무가\r\n'+r.comment:''); }).join('\r\n\r\n--------------------\r\n\r\n');
    var url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})), a=document.createElement('a'); a.href=url; a.download='우리-이야기-'+dateKey(new Date())+'.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },1000); toast(rows.length+'개의 기록을 백업했어요.');
  }));
}
function openCompose(){
  if(needLogin('회원이 되면 구름을 띄울 수 있어요.')) return;
  if(!isAdmin()){
    var waitUntil=(meDoc&&meDoc.lastCloudAt||0)+24*60*60*1000, remain=waitUntil-Date.now();
    if(remain>0){ toast('다음 구름까지 '+remainingTime(remain)+' 기다려 주세요.'); return; }
  }
  var src=myTreeId()&&myTreeDoc();
  if(!src||src.f==null||src.n==null){ toast('먼저 귤나무와 연결해 주세요.'); return; }
  var name=safe(T&&T.name,'이 나무');
  openSheet(name+'에게 해주고 싶은 말','적은 말은 구름이 되어 모두의 하늘을 지나가요.');
  var ta=field('한마디','textarea','',CONFIG.cloudMaxLength,2); ta.placeholder='예) 올해도 달게 익어줘';
  var note=formNote(), a=actions();
  a.appendChild(bigBtn('구름으로 띄우기',function(){
    var text=ta.value.trim().replace(/\s+/g,' ');
    if(!text){ ta.focus(); return; }
    if(Array.from(text).length>CONFIG.cloudMaxLength){ note.textContent='구름에는 '+CONFIG.cloudMaxLength+'자까지만 담을 수 있어요.'; return; }
    if(Filter.bad(text)){ note.textContent=NOT_ALLOWED; return; }
    var fromName=Array.from(String(src.name||meDoc.nick||'회원')).slice(0,24).join('');
    var c={text:text,fromName:fromName,uid:me.uid,ts:Date.now(),treeId:myTreeId(),f:src.f,n:src.n,virtual:!!src.virtual};
    B.addCloud(c).then(function(saved){ var cloud=saved||c; meDoc.lastCloudAt=cloud.ts; trackEvent('cloud_post',{virtual:!!cloud.virtual}); sheet.close(); launch(cloud); toast('구름이 하늘로 올라가요.'); }).catch(function(e){ note.textContent=e&&e.code==='cloud/cooldown'?'구름은 24시간에 한 번 띄울 수 있어요.':'구름을 보내지 못했어요.'; });
  }));
  ta.focus();
}
function remainingTime(ms){
  var totalMin=Math.max(1,Math.ceil(ms/60000));
  var h=Math.floor(totalMin/60), m=totalMin%60;
  if(h&&m) return h+'시간 '+m+'분';
  if(h) return h+'시간';
  return m+'분';
}
function myTreeDoc(){ return isMine()?T:(meDoc&&meDoc.treeCache)||null; }
function openCloud(c){
  openSheet(safe(c.fromName,'누군가')+'의 구름');
  sheet.appendChild(txt('p','lead big-lead',c.text));
  var hasTree=!!(c.treeId||(c.f!=null&&c.n!=null));
  if(hasTree){
    var description=txt('p','cloudTreeDescription','나무 이야기를 불러오는 중이에요.');
    sheet.appendChild(description);
    if(c.treeId) B.getTree(c.treeId).then(function(t){ description.textContent=t&&(t.intro||t.story)?Filter.mask(t.intro||t.story):'이 나무가 아직 소개를 남기지 않았어요.'; }).catch(function(){ description.textContent='나무 설명을 불러오지 못했어요.'; });
    else description.textContent=safe(c.fromName,'이 나무')+'의 이야기를 보러 가요.';
  }
  var canDel=isAdmin()&&!!c.id;
  if(canDel||hasTree){
    var row=actions(); row.classList.add('cloudBottomActs');
    if(canDel) row.classList.add('has-del');
    if(hasTree){
      var visit=bigBtn('이 나무 보러가기',function(){ sheet.close(); c.treeId?B.getTree(c.treeId).then(function(t){ if(t) goTreeRecord(t); else goTree(c.f,c.n); }):goTree(c.f,c.n); });
      visit.classList.add('cloudVisitBtn');
      row.appendChild(visit);
    }
    if(canDel){
      var del=ghostBtn('이 구름 삭제하기',function(){
        del.disabled=true; del.textContent='삭제 중';
        B.deleteCloud(c.id).then(function(){
          lastCloudSnapshot=(lastCloudSnapshot||[]).filter(function(x){ return x.id!==c.id; });
          applyCloudList(lastCloudSnapshot);
          if(sheet.open) sheet.close();
          toast('구름을 삭제했어요.');
        }).catch(function(){
          del.disabled=false; del.textContent='이 구름 삭제하기';
          toast('구름을 삭제하지 못했어요.');
        });
      });
      del.classList.add('danger','cloudDeleteBtn');
      row.appendChild(del);
    }
  }
}

/* 응원 */
function appendCheerComposer(){
  var ta=field('응원 남기기','textarea','',CONFIG.messageMaxLength,2), note=formNote(), a=actions(); ta.placeholder='예) 오늘도 잘 자라렴';
  a.appendChild(bigBtn('남기기',function(){
    if(needLogin('회원이 되면 응원을 남길 수 있어요.')) return;
    var text=ta.value.trim().replace(/\s+/g,' '); if(!text){ ta.focus(); return; }
    if(Filter.bad(text)){ note.textContent=NOT_ALLOWED; return; }
    B.addMessage(view.id,{text:text,fromName:meDoc.nick||'회원',uid:me.uid,ts:Date.now()}).then(function(){ ta.value=''; ta.dispatchEvent(new Event('input')); note.textContent=''; toast('응원을 남겼어요.'); }).catch(function(){ note.textContent='남기지 못했어요. 잠시 뒤에 다시 해주세요.'; });
  }));
}
function openVisitorStory(){
  if(!T) return;
  openSheet('나무 이야기');
  sheet.classList.add('guestbookSheet','treeStorySheet');
  sheet.appendChild(txt('p','lead',safe(T.name,'이름 없는 나무')));
  if(T.intro) sheet.appendChild(txt('p','treeStoryIntro',Filter.mask(T.intro)));
  sheet.appendChild(txt('p','story',T.story?Filter.mask(T.story):'아직 적힌 이야기가 없어요.'));
  appendCheerComposer();
  sheet.appendChild(txt('h3','guestbookHeading','응원'));
  cheerBox=el('div','cheers'); sheet.appendChild(cheerBox); renderCheerList(openVisitorStory);
}
function openCheer(){
  if(!T) return;
  var mine=isMine();
  if(!mine){ openVisitorStory(); return; }
  openSheet('우리 나무 응원','이웃들이 나무 이야기에 남긴 글과 하트 '+(T.hearts||0)+'개를 볼 수 있어요. 지우고 싶은 글은 오른쪽 ‘지우기’를 눌러 바로 삭제할 수 있어요.');
  sheet.classList.add('guestbookSheet');
  try{ localStorage.setItem('littlSeen',String(Date.now())); }catch(e){}
  hud();
  cheerBox=el('div','cheers'); sheet.appendChild(cheerBox); renderCheerList(openCheer);
}
function openCheerDeleteConfirm(m,backFn){
  if(!m||!view) return;
  var backTo=backFn||function(){ isMine()?openCheer():openVisitorStory(); };
  openSheet('이 응원을 지울까요?','지운 글은 다시 되돌릴 수 없어요.');
  sheet.classList.add('guestbookSheet');
  var preview=el('div','guestbookPreview');
  preview.appendChild(txt('b','',safe(m.fromName,'이웃')));
  if(m.ts) preview.appendChild(txt('small','cheerTime',formatKstDateTime(m.ts).slice(0,16)));
  preview.appendChild(txt('p','',Filter.bad(m.text)?'부적절한 표현이 포함된 글이에요.':m.text));
  sheet.appendChild(preview);
  var note=formNote(), a=actions();
  var cancelBtn=ghostBtn('취소',backTo);
  var delBtn=bigBtn('지우기',function(){
    cancelBtn.disabled=true; delBtn.disabled=true; delBtn.textContent='지우는 중'; note.textContent='';
    B.deleteMessage(view.id,m.id).then(function(){
      msgs=msgs.filter(function(x){ return x.id!==m.id; });
      hud();
      backTo();
      toast('응원을 지웠어요.');
    }).catch(function(err){
      cancelBtn.disabled=false; delBtn.disabled=false; delBtn.textContent='지우기';
      var rep=recordError('응원을 지우지 못했어요',err,'응원 삭제');
      note.textContent='글을 지우지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
      attachTroubleshootBtn(note,rep,function(){ openCheerDeleteConfirm(m,backTo); });
    });
  });
  delBtn.classList.add('danger');
  a.append(cancelBtn,delBtn);
}
function renderCheerList(backFn){
  if(typeof backFn==='function') cheerBackFn=backFn;
  if(!cheerBox) return; cheerBox.innerHTML='';
  if(!msgs.length){ cheerBox.appendChild(txt('p','guestbookEmpty',isMine()?'아직 남겨진 응원이 없어요.':'아직 남겨진 응원이 없어요. 첫 응원을 남겨 보세요.')); return; }
  msgs.forEach(function(m){
    var row=el('div','cheer'), bad=Filter.bad(m.text);
    row.appendChild(txt('b','',safe(m.fromName,'이웃')));
    if(m.ts) row.appendChild(txt('small','cheerTime',formatKstDateTime(m.ts).slice(0,16)));
    if(bad){ var s=txt('span','masked',Array(Math.min(m.text.length,18)+1).join('귤')); s.setAttribute('aria-hidden','true'); row.appendChild(s); row.appendChild(txt('small','','부적절한 표현이 있어 가려졌어요.')); }
    else row.appendChild(txt('span','',m.text));
    if(me&&(isMine()||m.uid===me.uid||(T&&T.ownerUid===me.uid)||isAdmin())){
      var d=txt('button','del','지우기');
      d.type='button';
      d.onclick=function(){ openCheerDeleteConfirm(m,cheerBackFn||backFn); };
      row.appendChild(d);
    }
    cheerBox.appendChild(row);
  });
}

/* 가족과 캐릭터 */
function code(){ var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s=''; for(var i=0;i<6;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function openFamily(){
  var owner=T.ownerUid===me.uid, chars=T.chars||[];
  openSheet('우리 가족');
  chars.forEach(function(c,i){
    var row=el('div','fam'), pv=el('div','pv',keeper(c)), info=el('div','info'), linked=!!c.uid, you=c.uid===me.uid;
    info.appendChild(txt('b','',safe(c.name,'이름 없음')+(you?' (나)':'')));
    var here=isHere(c,i);
    if(!T.virtual) info.appendChild(txt('small','',!linked?'초대 코드를 기다리는 중':(here&&i>0?'지금 접속 중':(i===0?'처음 연결한 가족':'접속 전'))));
    if(!linked&&owner&&meDoc.invites&&meDoc.invites[c.id]){ var cd=meDoc.invites[c.id], codeBox=el('div','invite-code'), codeText=txt('code','',cd), cb=txt('button','mini','복사하기'); cb.onclick=function(){ copyInvite(cd); }; codeBox.append(codeText,cb); info.appendChild(codeBox); }
    row.append(pv,info);
    var ctrl=el('div','ctrl');
    if(you){ var leave=txt('button','mini','나무와 헤어지기'); leave.onclick=openLeaveTree; ctrl.appendChild(leave); }
    else if(owner&&i>0){ ctrl.appendChild(txt('button','mini danger','빼기')); ctrl.lastChild.onclick=function(){ removeChar(c); }; }
    row.appendChild(ctrl); sheet.appendChild(row);
  });
  if(owner&&chars.length<CONFIG.maxCharacters){
    if(T.virtual){
      var a=actions(); a.classList.add('familyActs');
      a.appendChild(bigBtn('가족 초대',function(){ toast('가족을 초대하려면 벼락밭의 나무와 연결되어야 해요.'); }));
      var p=el('p','familyMembershipLink');
      p.append(document.createTextNode('벼락밭의 나무와 연결하려면? '),function(){ var b=txt('button','link','여기'); b.type='button'; b.onclick=openMembershipInfo; return b; }());
      sheet.appendChild(p);
    } else actions().appendChild(bigBtn('가족 초대',addFamilyInvite));
  }
}
function openLeaveTree(){
  if(!isMine()) return;
  var treeId=T.id, treeName=safe(T.name,'이 나무'), onlyMember=(T.members||[]).length<=1;
  openSheet('나무와 헤어질까요?',onlyMember?'지금 혼자 연결된 나무예요. 헤어지면 나무 이야기, 우리 이야기, 응원, 구름 등 이 나무의 모든 기록이 영구 삭제되며 되돌릴 수 없어요.':'헤어진 뒤에는 이 나무의 가족 화면과 우리 이야기를 볼 수 없어요. 다른 가족과 나무의 기록은 그대로 남아요.');
  var note=formNote(), a=actions(); a.append(ghostBtn('계속 함께하기',openFamily));
  var leave=bigBtn(onlyMember?'모든 기록을 삭제하고 헤어지기':'나무와 헤어지기',function(){
    leave.disabled=true; leave.textContent='헤어지는 중';
    B.detachTree(treeId,me.uid).then(function(){ invalidateTreesCache(); return setMyTree(null); }).then(function(){ if(onlyMember){ meDoc.invites={}; return B.setUser(me.uid,{invites:{}}); } }).then(function(){ stopBeat(); clearWatch(); curKey=null; sheet.close(); location.hash='home'; route(); toast(treeName+'와의 연결을 정리했어요.'); setTimeout(openTreeChoice,120); }).catch(function(){ leave.disabled=false; leave.textContent=onlyMember?'모든 기록을 삭제하고 헤어지기':'나무와 헤어지기'; note.textContent='연결을 정리하지 못했어요. 잠시 뒤 다시 시도해 주세요.'; });
  }); leave.classList.add('danger'); a.appendChild(leave);
}
function copyInvite(cd){
  if(navigator.clipboard) navigator.clipboard.writeText(cd).then(function(){ toast('초대 코드를 복사했어요.'); }).catch(function(){ toast('초대 코드: '+cd); });
  else toast('초대 코드: '+cd);
}
function addFamilyInvite(){
  if(!isMine()||T.virtual||T.ownerUid!==me.uid||(T.chars||[]).length>=CONFIG.maxCharacters) return;
  var c={id:'c'+Date.now().toString(36),uid:null,name:'',color:'#808080',head:'',face:''}, cd=code();
  T.chars=(T.chars||[]).concat([c]); meDoc.invites=meDoc.invites||{}; meDoc.invites[c.id]=cd;
  B.createInvite(cd,{treeId:T.id,charId:c.id,ownerUid:me.uid}); B.setUser(me.uid,{invites:meDoc.invites}); persist(['chars']); flush(); renderKeepers(); openFamily();
}
function removeChar(c){
  T.chars=T.chars.filter(function(x){ return x.id!==c.id; });
  if(c.uid) T.members=(T.members||[]).filter(function(u){ return u!==c.uid; });
  var cd=meDoc.invites&&meDoc.invites[c.id]; if(cd){ B.deleteInvite(cd); delete meDoc.invites[c.id]; B.setUser(me.uid,{invites:meDoc.invites}); }
  B.leave(T.id,'slot:'+c.id).catch(function(){});
  persist(['chars','members']); flush(); renderKeepers(); openFamily();
}
function chips(label,list,val,on){
  sheet.appendChild(txt('label','',label)); var box=el('div','chips');
  list.forEach(function(it){ var b=txt('button','chip',it[0]); b.setAttribute('aria-pressed',it[1]===val); b.onclick=function(){ box.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); on(it[1]); }; box.appendChild(b); });
  sheet.appendChild(box);
}
function openChar(src,targetTree){
  var c=Object.assign({},src), target=targetTree||T;
  openSheet('내 캐릭터 커스텀하기');
  var pv=el('div','pvBig',keeper(c)); sheet.appendChild(pv);
  var draw=function(){ pv.innerHTML=keeper(c); };
  var n=field('이름','input',c.name,8); n.placeholder='예) 엄마';
  sheet.appendChild(txt('label','','색')); var sw=el('div','swatches');
  CONFIG.colors.forEach(function(it){ var b=el('button','sw'); b.style.background=it[1]; b.setAttribute('aria-label',it[0]); b.setAttribute('aria-pressed',it[1]===c.color); b.onclick=function(){ sw.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); c.color=it[1]; draw(); }; sw.appendChild(b); });
  sheet.appendChild(sw);
  chips('머리',CONFIG.hats,c.head,function(v){ c.head=v; draw(); });
  chips('얼굴과 목',CONFIG.faces,c.face,function(v){ c.face=v; draw(); });
  var note=formNote();
  actions().appendChild(bigBtn('저장',function(){
    if(Filter.bad(n.value)){ note.textContent=NOT_ALLOWED; return; }
    c.name=n.value.trim();
    target.chars=(target.chars||[]).map(function(x){ return x.id===c.id?c:x; });
    if(target===T){ persist(['chars']); flush(); renderKeepers(); openMenu(); toast('내 캐릭터를 저장했어요.'); }
    else B.updateTree(target.id,{chars:target.chars}).then(function(){ openMenu(); toast('내 캐릭터를 저장했어요.'); },function(){ note.textContent='저장하지 못했어요. 인터넷 연결을 확인해 주세요.'; });
  }));
}

function findForm(box,note,after){
  box.innerHTML='';
  var input=document.createElement('input'); input.type='search'; input.placeholder='나무 이름 검색'; input.autocomplete='off'; input.name='litttl-tree-name-search'; input.spellcheck=false; input.setAttribute('autocapitalize','none'); input.setAttribute('data-lpignore','true'); input.setAttribute('data-form-type','other'); input.setAttribute('aria-label','나무 이름 검색');
  var searchWrap=el('div','find-search'), results=el('div','name-results'), controls=el('div','find-controls');
  function closeResults(){ results.innerHTML=''; searchWrap.classList.remove('has-results'); }
  function run(){
    var q=input.value.trim().toLowerCase(); closeResults(); note.textContent='';
    if(q.length<1){ note.textContent='찾고 싶은 나무 이름을 적어주세요.'; return; }
    var found=allTrees.filter(function(t){ return t.name&&safe(t.name).toLowerCase().indexOf(q)>=0; }).slice(0,20);
    if(!found.length){ note.textContent='이 이름과 닮은 나무를 찾지 못했어요.'; return; }
    found.forEach(function(t){
      var b=txt('button','name-result',safe(t.name,'이름 없는 나무'));
      b.type='button';
      b.onclick=function(){ closeResults(); if(after) after(); goTreeRecord(t); };
      results.appendChild(b);
    });
    if(results.childElementCount) searchWrap.classList.add('has-results');
  }
  var b=bigBtn('검색',function(){ refreshPins().then(run); }); b.type='button';
  input.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); b.click(); } else if(e.key==='Escape'){ closeResults(); } };
  input.oninput=function(){ note.textContent=''; if(!input.value.trim()) closeResults(); else if(allTrees.length) run(); };
  document.addEventListener('click',function(e){ if(!box.contains(e.target)) closeResults(); });
  searchWrap.append(input,results);
  controls.append(searchWrap,b); box.append(controls); return input;
}
function requestCharacterCustom(){
  var c=myChar();
  if(T&&isMine()&&c){ openChar(c); return; }
  if(!myTreeId()){ toast('먼저 내 나무와 연결해 주세요.'); return; }
  B.getTree(myTreeId()).then(function(tree){
    var mine=tree&&(tree.chars||[]).filter(function(x){ return x.uid===me.uid; })[0];
    if(!mine){ toast('내 캐릭터를 찾지 못했어요.'); return; }
    openChar(mine,tree);
  }).catch(function(){ toast('내 캐릭터를 불러오지 못했어요.'); });
}
var myTreeNotifId=null, myTreeMsgs=[], myTreeDiaries=[], myAdminRequest=null, adminRequests=[], globalNotices=[];
var notifList=[], notifReadMap={}, notifReadHadSaved=false, notifAlertShown={}, notifAlertTimer=null, notifTickTimer=null;
var authNotifUnsubs=[], myTreeNotifUnsubs=[], adminNotifUnsubs=[];
var settingsTapCount=0, settingsTapLastAt=0, settingsTapResetTimer=null;

function notifReadKey(){ return me?'litttlNotifRead_'+me.uid:''; }
function loadNotifReadState(){
  notifReadMap={}; notifReadHadSaved=false;
  var k=notifReadKey(); if(!k) return;
  try{
    var raw=localStorage.getItem(k);
    if(raw!=null){
      notifReadHadSaved=true;
      var parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object') notifReadMap=parsed;
    }
  }catch(e){}
}
function saveNotifReadState(){
  var k=notifReadKey(); if(!k) return;
  try{
    var keys=Object.keys(notifReadMap);
    if(keys.length>300){
      keys.sort(function(a,b){ return (notifReadMap[b]||0)-(notifReadMap[a]||0); }).slice(300).forEach(function(oldK){ delete notifReadMap[oldK]; });
    }
    localStorage.setItem(k,JSON.stringify(notifReadMap));
  }catch(e){}
}
function unreadNotifCount(){
  if(!me) return 0;
  var n=0;
  for(var i=0;i<notifList.length;i++){ if(!notifReadMap[notifList[i].id]) n++; }
  return n;
}
function hideNotifAlert(){
  clearTimeout(notifAlertTimer); notifAlertTimer=null;
  var box=$('notifAlert');
  if(box){ box.hidden=true; box.innerHTML=''; }
}
function markNotifRead(id,skipRebuild){
  if(!me||!id) return;
  notifReadMap[id]=Date.now();
  notifReadHadSaved=true;
  saveNotifReadState();
  if(!skipRebuild) rebuildNotifications(true);
}
function markAllNotifsRead(){
  if(!me) return;
  var now=Date.now();
  notifList.forEach(function(it){ notifReadMap[it.id]=now; });
  notifReadHadSaved=true;
  saveNotifReadState();
  hideNotifAlert();
  rebuildNotifications(true);
}
function openMyDiaryDate(day){
  var treeId=myTreeId();
  if(!me||!treeId||!day) return;
  var go=function(){
    var d=new Date(day+'T00:00:00');
    diaryMonth=new Date(d.getFullYear(),d.getMonth(),1);
    openDiaryEntry(day,false,me.uid);
  };
  if(diaryCache[day]&&diaryCache[day].entries&&diaryCache[day].entries[me.uid]){ go(); return; }
  B.listDiary(treeId).then(function(rows){
    diaryCache={};
    (rows||[]).forEach(function(r){
      var dKey=(r.date||'').split('__')[0], author=r.uid||'legacy'; if(!dKey) return;
      diaryBucket(dKey).entries[author]={docId:r.docId||(dKey+'__'+author),date:dKey,icon:diaryIconKey(r.icon),text:r.text,createdAt:r.createdAt||0,replyReadyAt:r.replyReadyAt!=null?r.replyReadyAt:null,replyGenerated:!!r.replyGenerated,comment:r.comment||'',uid:author,authorName:r.authorName||diaryAuthorName(author)};
    });
    go();
  }).catch(function(){ openDiary(null,false); });
}
function openNoticeDetail(item){
  if(!item) return;
  markNotifRead(item.id,true);
  hideNotifAlert();
  openSheet(item.title||'공지사항',(item.createdByName||'엉클리틀')+(item.ts?' · '+formatKstDateTime(item.ts).slice(0,16):''));
  sheet.classList.add('notifSheet');
  var box=el('div','noticeDetailBox');
  box.appendChild(txt('p','noticeDetailBody',item.fullBody||item.body||''));
  sheet.appendChild(box);
  var a=actions();
  a.append(ghostBtn('← 알림으로',function(){ openNotifications(); }),bigBtn('닫기',function(){ sheet.close(); }));
}
function openNotifTarget(item){
  if(!item) return;
  markNotifRead(item.id);
  hideNotifAlert();
  if(item.kind==='notice'){ openNoticeDetail(item); return; }
  if(item.kind==='admin_request'){ openNotifications(); return; }
  if(item.kind==='admin_result'){
    if(isAdmin()) openAdminMenu();
    else openNotifications();
    return;
  }
  var myId=myTreeId();
  if(!myId){ openNotifications(); return; }
  var runOnMyTree=function(){
    if(item.kind==='cheer') openCheer();
    else if(item.kind==='diary_reply'&&item.dateKey) openMyDiaryDate(item.dateKey);
  };
  if(isMine()&&document.body.dataset.page==='scene'){
    if(sheet.open) sheet.close();
    runOnMyTree();
    return;
  }
  pendingNotifAction=runOnMyTree;
  if(sheet.open) sheet.close();
  if(location.hash&&location.hash!=='#') location.hash='';
  else route();
}
function showNotifAlert(item){
  var box=$('notifAlert'); if(!box||!item) return;
  clearTimeout(notifAlertTimer);
  box.innerHTML='';
  var head=el('div','notifAlertHead');
  var badge=txt('span','notifAlertBadge'+(item.kind==='admin_request'?' admin':(item.kind==='notice'?' notice':'')),item.tag||'알림');
  var close=txt('button','notifAlertClose','×');
  close.type='button'; close.setAttribute('aria-label','알림 닫기');
  close.onclick=function(){ hideNotifAlert(); };
  head.append(badge,close);
  var title=txt('p','notifAlertTitle',item.title||'새 알림');
  var body=txt('p','notifAlertBody',item.body||'');
  var acts=el('div','notifAlertActs');
  var go=txt('button','mini',item.kind==='admin_request'?'알림에서 확인':(item.kind==='notice'?'자세히 보기':'바로 보기'));
  go.type='button';
  go.onclick=function(){ openNotifTarget(item); };
  acts.appendChild(go);
  box.append(head,title,body,acts);
  box.hidden=false;
  notifAlertTimer=setTimeout(hideNotifAlert,9000);
}
function previewNotifText(text,max){
  var s=String(text||'').replace(/\s+/g,' ').trim(), chars=Array.from(s), limit=max||46;
  return chars.length>limit?chars.slice(0,limit).join('')+'...':s;
}
function rebuildNotifications(suppressAlert){
  if(!me){ notifList=[]; hideNotifAlert(); return; }
  var items=[], myId=myTreeId(), now=Date.now(), seenCheerTs=0;
  try{ seenCheerTs=+localStorage.getItem('littlSeen')||0; }catch(e){}
  var seedTexts=isAdmin()?[]:Object.keys(diaryExamples()).map(function(k){ return diaryExamples()[k].text; });
  var dirtyMap=false;

  if(myId){
    (myTreeMsgs||[]).forEach(function(m){
      if(!m||(me&&m.uid===me.uid)) return;
      var nid='msg:'+myId+':'+(m.id||m.ts||'');
      var ts=Number(m.ts||0);
      if(!notifReadHadSaved&&ts>0&&ts<=seenCheerTs&&!notifReadMap[nid]){
        notifReadMap[nid]=seenCheerTs; dirtyMap=true;
      }
      var preview=Filter.bad(m.text)?'부적절한 표현이 포함된 글이에요.':previewNotifText(m.text,42);
      items.push({
        id:nid, kind:'cheer', tag:'새 댓글',
        title:'내 나무에 새 댓글이 달렸어요',
        body:safe(m.fromName,'이웃')+': '+preview,
        ts:ts, treeId:myId
      });
    });

    (myTreeDiaries||[]).forEach(function(r){
      if(!r) return;
      if(r.uid&&me&&r.uid!==me.uid) return;
      if(!isAdmin()&&seedTexts.indexOf(r.text)>=0) return;
      var day=(r.date||r.docId||'').split('__')[0]; if(!day) return;
      var info=treeReplyInfo(day,r);
      if(!info.text||info.waiting) return;
      var dObj=new Date(day+'T00:00:00');
      var dayLabel=(dObj.getMonth()+1)+'월 '+dObj.getDate()+'일 일기';
      var replyTs=Number(r.replyReadyAt||r.createdAt||dObj.getTime()||0);
      var nid='diary:'+myId+':'+(r.docId||(day+'__'+(r.uid||me.uid)));
      if(!notifReadHadSaved&&replyTs>0&&(now-replyTs)>48*60*60*1000&&!notifReadMap[nid]){
        notifReadMap[nid]=now; dirtyMap=true;
      }
      items.push({
        id:nid, kind:'diary_reply', tag:'나무 답장',
        title:'내 일기에 나무의 답장이 달렸어요',
        body:dayLabel+' · '+previewNotifText(info.text,42),
        ts:replyTs, dateKey:day, treeId:myId
      });
    });
  }

  if(isAdmin()){
    (adminRequests||[]).forEach(function(req){
      if(!req||req.status!=='pending') return;
      var nid='adminreq:'+req.uid+':'+(req.requestedAt||0);
      items.push({
        id:nid, kind:'admin_request', tag:'관리자 요청',
        title:'관리자 권한 요청이 왔어요',
        body:safe(req.nick,'회원')+' ('+(req.email||'이메일 없음')+')님이 관리자 계정 전환을 요청했어요.',
        ts:Number(req.requestedAt||0), req:req
      });
    });
  }

  if(myAdminRequest&&myAdminRequest.status==='approved'&&isAdmin()&&!isPrimaryAdmin()){
    var aid='adminres:approved:'+(myAdminRequest.reviewedAt||myAdminRequest.requestedAt||0);
    items.push({
      id:aid, kind:'admin_result', tag:'관리자',
      title:'관리자 권한이 부여되었어요',
      body:'이제 기존 관리자와 함께 앱 내 관리자 기능을 사용할 수 있어요.',
      ts:Number(myAdminRequest.reviewedAt||myAdminRequest.requestedAt||now)
    });
  } else if(myAdminRequest&&myAdminRequest.status==='rejected'&&!isAdmin()){
    var rid='adminres:rejected:'+(myAdminRequest.reviewedAt||myAdminRequest.requestedAt||0);
    items.push({
      id:rid, kind:'admin_result', tag:'안내',
      title:'관리자 권한 요청이 거절되었어요',
      body:'기존 관리자가 권한 요청을 거절했어요.',
      ts:Number(myAdminRequest.reviewedAt||myAdminRequest.requestedAt||now)
    });
  }

  (globalNotices||[]).forEach(function(n){
    if(!n||!n.id) return;
    var nid='notice:'+n.id;
    items.push({
      id:nid, kind:'notice', tag:'공지',
      title:n.title||'공지사항',
      body:previewNotifText(n.body||'',42),
      fullBody:n.body||'',
      createdByName:n.createdByName||'엉클리틀',
      ts:Number(n.createdAt||0)
    });
  });

  if(dirtyMap){ notifReadHadSaved=true; saveNotifReadState(); }
  items.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  notifList=items;
  hud();

  if(sheet.open&&sheet.classList.contains('notifSheet')) renderNotificationSheetContent();

  if(!suppressAlert){
    var unreadTop=items.filter(function(it){ return !notifReadMap[it.id]&&!notifAlertShown[it.id]; })[0];
    if(unreadTop){
      notifAlertShown[unreadTop.id]=1;
      showNotifAlert(unreadTop);
    }
  }
}
function clearMyTreeNotifWatchers(){
  myTreeNotifUnsubs.forEach(function(u){ try{ u(); }catch(e){} });
  myTreeNotifUnsubs=[]; myTreeNotifId=null; myTreeMsgs=[]; myTreeDiaries=[];
}
function clearAdminNotifWatchers(){
  adminNotifUnsubs.forEach(function(u){ try{ u(); }catch(e){} });
  adminNotifUnsubs=[]; adminRequests=[];
}
function syncAdminNotifWatchers(){
  clearAdminNotifWatchers();
  if(!me||!isAdmin()||!B||typeof B.watchAdminRequests!=='function') return;
  adminNotifUnsubs.push(B.watchAdminRequests(function(list){
    adminRequests=list||[];
    rebuildNotifications(false);
  }));
}
function syncMyTreeNotifWatchers(){
  var nextId=me?myTreeId():null;
  if(nextId===myTreeNotifId) return;
  clearMyTreeNotifWatchers();
  myTreeNotifId=nextId;
  if(!me||!nextId||!B){ rebuildNotifications(true); return; }
  myTreeNotifUnsubs.push(B.watchMessages(nextId,function(list){
    myTreeMsgs=list||[];
    rebuildNotifications(false);
  }));
  if(typeof B.watchDiary==='function'){
    myTreeNotifUnsubs.push(B.watchDiary(nextId,function(list){
      myTreeDiaries=list||[];
      rebuildNotifications(false);
    }));
  }
}
function clearNotifWatchers(){
  clearInterval(notifTickTimer); notifTickTimer=null;
  authNotifUnsubs.forEach(function(u){ try{ u(); }catch(e){} });
  authNotifUnsubs=[];
  clearMyTreeNotifWatchers();
  clearAdminNotifWatchers();
  adminGrantActive=false; myAdminRequest=null; globalNotices=[]; notifList=[]; notifReadMap={}; notifAlertShown={};
  hideNotifAlert();
}
function startAuthNotifWatchers(){
  clearNotifWatchers();
  if(!me||!B) return;
  loadNotifReadState();
  if(typeof B.watchAdminStatus==='function'){
    authNotifUnsubs.push(B.watchAdminStatus(me.uid,me.email,function(granted){
      var wasAdmin=isAdmin();
      adminGrantActive=!!granted&&!isPrimaryAdmin();
      var nowAdmin=isAdmin();
      if(nowAdmin!==wasAdmin||!adminNotifUnsubs.length) syncAdminNotifWatchers();
      rebuildNotifications(false);
      hud();
    }));
  }
  if(typeof B.watchMyAdminRequest==='function'){
    authNotifUnsubs.push(B.watchMyAdminRequest(me.uid,function(req){
      myAdminRequest=req||null;
      rebuildNotifications(false);
    }));
  }
  if(typeof B.watchNotices==='function'){
    authNotifUnsubs.push(B.watchNotices(function(list){
      globalNotices=list||[];
      rebuildNotifications(false);
      if(sheet.open&&sheet.classList.contains('adminNoticeSheet')) renderAdminNoticeList();
    }));
  }
  syncAdminNotifWatchers();
  syncMyTreeNotifWatchers();
  notifTickTimer=setInterval(function(){ if(me&&!document.hidden) rebuildNotifications(false); },30000);
}
function resetSettingsTapState(){
  clearTimeout(settingsTapResetTimer); settingsTapResetTimer=null;
  settingsTapCount=0; settingsTapLastAt=0;
}
function onSettingsTitleTap(){
  if(!me) return;
  try{ if(window.getSelection) window.getSelection().removeAllRanges(); }catch(e){}
  var now=Date.now();
  if(now-settingsTapLastAt>2000) settingsTapCount=0;
  settingsTapCount+=1;
  settingsTapLastAt=now;
  clearTimeout(settingsTapResetTimer); settingsTapResetTimer=null;
  if(settingsTapCount>=5){
    resetSettingsTapState();
    if(isAdmin()){ toast('이미 관리자 권한을 가지고 있어요.'); return; }
    openAdminSwitchPrompt();
    return;
  }
  settingsTapResetTimer=setTimeout(resetSettingsTapState,2200);
}
function openAdminSwitchPrompt(){
  if(!me) return;
  if(isAdmin()){ toast('이미 관리자 권한을 가지고 있어요.'); return; }
  openSheet('관리자 계정으로 전환하시겠습니까?','기존 관리자에게 관리자 권한 부여 요청을 보냅니다.');
  sheet.classList.add('notifSheet');
  var card=el('div','adminSwitchCard');
  var isPending=myAdminRequest&&myAdminRequest.status==='pending';
  card.appendChild(txt('p','','요청 계정: '+(me.email||me.uid)));
  card.appendChild(txt('p','',isPending
    ?'이미 관리자 권한 부여 요청을 보냈어요. 기존 관리자가 알림에서 권한을 부여하면 앱 내 관리자 기능을 함께 사용할 수 있어요.'
    :'관리자에게 권한 부여 요청 알림이 전송되며, 권한이 부여되면 왕관 모양 관리자 메뉴와 관리 기능을 함께 공유하게 됩니다.'));
  sheet.appendChild(card);
  var note=formNote(), a=actions();
  if(isPending){
    a.appendChild(bigBtn('확인',function(){ sheet.close(); }));
    return;
  }
  var cancelBtn=ghostBtn('취소',function(){ sheet.close(); });
  var reqBtn=bigBtn('권한 요청 보내기',function(){
    cancelBtn.disabled=true; reqBtn.disabled=true; reqBtn.textContent='요청 중'; note.textContent='';
    B.requestAdminAccess({uid:me.uid,email:me.email||'',nick:(meDoc&&meDoc.nick)||me.displayName||'회원'}).then(function(res){
      if(res&&res.alreadyAdmin){ sheet.close(); toast('이미 관리자 권한을 가지고 있어요.'); return; }
      if(res&&res.alreadyPending){ openAdminSwitchPrompt(); toast('이미 관리자 권한을 요청했어요.'); return; }
      sheet.close();
      toast('관리자에게 권한 부여 요청을 보냈어요.');
    }).catch(function(err){
      cancelBtn.disabled=false; reqBtn.disabled=false; reqBtn.textContent='권한 요청 보내기';
      var rep=recordError('관리자 권한 요청을 보내지 못했어요',err,'관리자 권한 요청');
      note.textContent='요청을 보내지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
      attachTroubleshootBtn(note,rep,openAdminSwitchPrompt);
    });
  });
  a.append(cancelBtn,reqBtn);
}
var notifSheetBody=null, notifTab='unread';
function renderNotificationSheetContent(){
  if(!notifSheetBody) return;
  notifSheetBody.innerHTML='';
  var unreadItems=notifList.filter(function(it){ return !notifReadMap[it.id]; });
  var readItems=notifList.filter(function(it){ return !!notifReadMap[it.id]; });
  var activeTab=notifTab==='read'?'read':'unread';
  var visibleItems=activeTab==='read'?readItems:unreadItems;

  var tabs=el('div','notifTabs');
  var unreadTabBtn=ghostBtn('확인하지 않은 알림 ('+unreadItems.length+')',function(){ notifTab='unread'; renderNotificationSheetContent(); });
  var readTabBtn=ghostBtn('확인한 알림 ('+readItems.length+')',function(){ notifTab='read'; renderNotificationSheetContent(); });
  unreadTabBtn.setAttribute('aria-pressed',activeTab==='unread'?'true':'false');
  readTabBtn.setAttribute('aria-pressed',activeTab==='read'?'true':'false');
  tabs.append(unreadTabBtn,readTabBtn);
  notifSheetBody.appendChild(tabs);

  if(activeTab==='unread'&&unreadItems.length){
    var bar=el('div','notifTopBar');
    bar.appendChild(txt('span','notifCountText','확인하지 않은 알림 '+unreadItems.length+'개'));
    var allReadBtn=txt('button','mini','모두 읽음');
    allReadBtn.type='button';
    allReadBtn.onclick=function(){ markAllNotifsRead(); };
    bar.appendChild(allReadBtn);
    notifSheetBody.appendChild(bar);
  }

  if(!visibleItems.length){
    notifSheetBody.appendChild(txt('p','notifEmpty',activeTab==='read'
      ?'확인한 알림이 아직 없어요.'
      :'확인하지 않은 새 알림이 없어요.'));
    return;
  }

  var list=el('div','notifList');
  visibleItems.forEach(function(item){
    var isUnread=!notifReadMap[item.id];
    var card=el('article','notifItem'+(isUnread?' unread':''));
    var head=el('div','notifItemHead');
    var tag=el('span','notifItemTag'+(item.kind==='admin_request'?' admin':(item.kind==='notice'?' notice':'')));
    if(isUnread) tag.appendChild(el('span','notifItemDot'));
    tag.appendChild(document.createTextNode(item.tag||'알림'));
    head.append(tag,txt('span','notifItemTime',item.ts?formatKstDateTime(item.ts).slice(0,16):''));
    card.append(head,txt('p','notifItemTitle',item.title||'알림'),txt('p','notifItemBody',previewNotifText(item.body||'',60)));

    var rowActs=el('div','notifActs');
    if(item.kind==='admin_request'&&item.req){
      var rejectBtn=txt('button','mini danger','거절');
      var grantBtn=txt('button','mini','권한 부여');
      rejectBtn.type='button'; grantBtn.type='button';
      rejectBtn.onclick=function(){
        rejectBtn.disabled=true; grantBtn.disabled=true; rejectBtn.textContent='처리 중';
        B.rejectAdminRequest(item.req.uid).then(function(){
          markNotifRead(item.id,true);
          hideNotifAlert();
          toast('관리자 권한 요청을 거절했어요.');
        }).catch(function(err){
          rejectBtn.disabled=false; grantBtn.disabled=false; rejectBtn.textContent='거절';
          var rep=recordError('요청을 거절하지 못했어요',err,'관리자 권한 요청 거절');
          openTroubleshoot(rep,{onBack:openNotifications});
        });
      };
      grantBtn.onclick=function(){
        rejectBtn.disabled=true; grantBtn.disabled=true; grantBtn.textContent='처리 중';
        B.approveAdminRequest(item.req.uid,item.req).then(function(){
          markNotifRead(item.id,true);
          hideNotifAlert();
          toast(safe(item.req.nick,'회원')+'님에게 관리자 권한을 부여했어요.');
        }).catch(function(err){
          rejectBtn.disabled=false; grantBtn.disabled=false; grantBtn.textContent='권한 부여';
          var rep=recordError('관리자 권한을 부여하지 못했어요',err,'관리자 권한 부여');
          openTroubleshoot(rep,{onBack:openNotifications});
        });
      };
      rowActs.append(rejectBtn,grantBtn);
    } else {
      if(isUnread){
        var readBtn=txt('button','mini','읽음');
        readBtn.type='button';
        readBtn.onclick=function(){ markNotifRead(item.id); };
        rowActs.appendChild(readBtn);
      }
      var viewLabel=item.kind==='cheer'?'응원 보기':(item.kind==='diary_reply'?'답장 보기':(item.kind==='notice'?'자세히 보기':'확인'));
      var viewBtn=txt('button','mini',viewLabel);
      viewBtn.type='button';
      viewBtn.onclick=function(){ openNotifTarget(item); };
      rowActs.appendChild(viewBtn);
    }
    card.appendChild(rowActs);
    list.appendChild(card);
  });
  notifSheetBody.appendChild(list);
}
function openNotifications(tab){
  if(needLogin('로그인하면 알림을 확인할 수 있어요.')) return;
  hideNotifAlert();
  notifTab=(tab==='read')?'read':'unread';
  openSheet('알림','내 나무에 달린 댓글, 내 일기에 도착한 나무의 답장, 전체 공지를 확인할 수 있어요.');
  sheet.classList.add('notifSheet');
  notifSheetBody=el('div');
  sheet.appendChild(notifSheetBody);
  renderNotificationSheetContent();
}
function openAdminAccessSheet(){
  if(!isAdmin()) return;
  openSheet('관리자 권한 공유 관리','설정 창에서 ‘설정’ 글자를 5번 눌러 들어온 권한 요청을 확인하고, 현재 관리자 권한을 함께 쓰는 계정을 관리할 수 있어요.');
  sheet.classList.add('adminGuideSheet','adminCleanupSheet');

  var pending=(adminRequests||[]).filter(function(r){ return r&&r.status==='pending'; });
  var reqSec=el('section','adminShareSection');
  reqSec.appendChild(txt('h3','','대기 중인 권한 요청 ('+pending.length+')'));
  var reqList=el('div','adminCleanupList');
  if(!pending.length){
    reqList.appendChild(txt('p','adminCleanupEmpty','현재 대기 중인 관리자 권한 요청이 없어요.'));
  } else {
    pending.forEach(function(r){
      var row=el('div','adminCleanupItem');
      var meta=el('div','adminCleanupMeta');
      meta.append(
        txt('strong','adminCleanupName',safe(r.nick,'회원')),
        txt('p','adminCleanupSub',r.email||'이메일 정보 없음'),
        txt('p','adminCleanupUid','요청 시각: '+(r.requestedAt?formatKstDateTime(r.requestedAt).slice(0,16):'-'))
      );
      var act=el('div','adminCleanupItemAct');
      act.style.gap='6px';
      var rej=txt('button','mini danger','거절'), ok=txt('button','mini','권한 부여');
      rej.type='button'; ok.type='button';
      rej.onclick=function(){
        rej.disabled=true; ok.disabled=true;
        B.rejectAdminRequest(r.uid).then(function(){ openAdminAccessSheet(); toast('권한 요청을 거절했어요.'); }).catch(function(){ rej.disabled=false; ok.disabled=false; toast('거절하지 못했어요.'); });
      };
      ok.onclick=function(){
        rej.disabled=true; ok.disabled=true;
        B.approveAdminRequest(r.uid,r).then(function(){ openAdminAccessSheet(); toast(safe(r.nick,'회원')+'님에게 관리자 권한을 부여했어요.'); }).catch(function(){ rej.disabled=false; ok.disabled=false; toast('권한을 부여하지 못했어요.'); });
      };
      act.append(rej,ok);
      row.append(meta,act);
      reqList.appendChild(row);
    });
  }
  reqSec.appendChild(reqList);
  sheet.appendChild(reqSec);

  var shareSec=el('section','adminShareSection');
  shareSec.appendChild(txt('h3','','관리자 권한을 함께 쓰는 계정'));
  var shareList=el('div','adminCleanupList');
  shareList.appendChild(txt('p','adminCleanupEmpty','목록을 불러오는 중이에요...'));
  shareSec.appendChild(shareList);
  sheet.appendChild(shareSec);

  actions().appendChild(ghostBtn('관리자 메뉴로 돌아가기',openAdminMenu));

  (typeof B.listAdmins==='function'?B.listAdmins():Promise.resolve([])).then(function(admins){
    if(!sheet.open||!sheet.classList.contains('adminCleanupSheet')) return;
    shareList.innerHTML='';
    var primaryRow=el('div','adminCleanupItem');
    var pMeta=el('div','adminCleanupMeta');
    var pHead=el('div','adminCleanupItemHead');
    pHead.append(txt('strong','adminCleanupName',SUPPORT_EMAIL),txt('span','adminCleanupBadge self','기본 관리자'));
    pMeta.append(pHead,txt('p','adminCleanupSub','기본 관리자 계정은 권한을 해제할 수 없어요.'));
    primaryRow.appendChild(pMeta);
    shareList.appendChild(primaryRow);

    (admins||[]).filter(function(a){ return a&&String(a.email||'').toLowerCase()!==SUPPORT_EMAIL; }).forEach(function(a){
      var row=el('div','adminCleanupItem');
      var meta=el('div','adminCleanupMeta');
      var head=el('div','adminCleanupItemHead');
      head.appendChild(txt('strong','adminCleanupName',safe(a.nick,'관리자')));
      var isSelf=!!(me&&a.uid===me.uid);
      if(isSelf) head.appendChild(txt('span','adminCleanupBadge self','현재 내 계정'));
      else head.appendChild(txt('span','adminCleanupBadge','공유 관리자'));
      meta.append(head,txt('p','adminCleanupSub',a.email||'이메일 정보 없음'));
      meta.appendChild(txt('p','adminCleanupUid','부여 시각: '+(a.grantedAt?formatKstDateTime(a.grantedAt).slice(0,16):'-')));
      var act=el('div','adminCleanupItemAct');
      var btn=txt('button',isSelf?'mini':'mini danger',isSelf?'사용 중':'권한 해제');
      btn.type='button'; btn.disabled=isSelf;
      btn.onclick=function(){
        btn.disabled=true; btn.textContent='해제 중';
        B.revokeAdminAccess(a.uid).then(function(){
          openAdminAccessSheet();
          toast(safe(a.nick,'회원')+'님의 관리자 권한을 해제했어요.');
        }).catch(function(){
          btn.disabled=false; btn.textContent='권한 해제';
          toast('권한을 해제하지 못했어요.');
        });
      };
      act.appendChild(btn);
      row.append(meta,act);
      shareList.appendChild(row);
    });
  }).catch(function(){
    if(!sheet.open) return;
    shareList.innerHTML='';
    shareList.appendChild(txt('p','adminCleanupEmpty','공유 관리자 목록을 불러오지 못했어요.'));
  });
}

function openAdminGuide(){
  if(!isAdmin()) return;
  openSheet('관리자 안내','아래 순서대로 천천히 눌러 보시면 됩니다.');
  sheet.classList.add('adminGuideSheet');
  var list=el('div','adminGuideList'), steps=[
    {
      title:'1. 손님에게 벼락밭 나무 코드 만들어 주기',
      body:'화면 왼쪽의 ‘벼락밭 지도’를 열고 → 원하시는 숲을 누른 뒤 → 손님께 드릴 나무 번호를 눌러 주세요. 바로 6자리 나무 코드가 나오며, ‘복사하기’를 누르면 코드가 저장되어 카카오톡 등으로 바로 보내실 수 있어요.'
    },
    {
      title:'2. 하늘을 지나는 구름 삭제하기',
      body:'화면에 떠다니는 구름 중 지우고 싶은 구름을 누르세요. 창 오른쪽 아래에 있는 빨간 테두리 버튼 ‘이 구름 삭제하기’를 누르면 하늘에서 바로 지워집니다.'
    },
    {
      title:'3. 이웃 나무·내 나무 응원 지우기',
      body:'‘나무 이야기’ 창 아래쪽의 응원(또는 내 나무 화면 아래쪽 하트 숫자)을 누르면 이웃들이 남긴 응원을 볼 수 있어요. 각 글 오른쪽 위의 ‘지우기’를 누른 뒤 확인하면 부적절한 글을 바로 삭제할 수 있습니다.'
    },
    {
      title:'4. 계정·나무 정리하기',
      body:'오른쪽 위 왕관 모양 관리자 버튼을 눌러 ‘계정·나무 정리’를 선택하면 회원·나무·구름 기록을 골라서 지울 수 있어요. 만약 Google 로그인 목록에서 계정만 먼저 지웠다면 회원 번호(UID)를 직접 입력해 남은 기록도 정리할 수 있습니다.'
    },
    {
      title:'5. 관리자 권한 요청 확인 및 공유하기',
      body:'다른 회원이 설정 창 맨 위 ‘설정’ 글자를 연속으로 5번 눌러 관리자 전환을 요청하면 화면과 알림 창에 ‘관리자 권한 요청이 왔어요’ 알림이 뜹니다. 알림에서 ‘권한 부여’를 누르면 앱 내 관리자 권한을 함께 공유할 수 있고, ‘관리자 권한 공유 관리’에서 언제든 해제할 수 있어요.'
    },
    {
      title:'6. 전체 회원에게 공지 알림 보내기',
      body:'왕관 모양 관리자 메뉴에서 ‘전체 공지 보내기’를 누르고 제목과 내용을 입력한 뒤 ‘전체 알림 보내기’를 누르면, 로그인한 모든 회원의 화면과 알림 창에 공지사항이 발송됩니다. 보낸 공지는 같은 화면 아래쪽 목록에서 언제든 삭제할 수 있어요.'
    }
  ];
  steps.forEach(function(st){
    var card=el('section','adminGuideCard');
    card.append(txt('h3','',st.title),txt('p','',st.body));
    list.appendChild(card);
  });
  sheet.appendChild(list);
  actions().appendChild(ghostBtn('관리자 메뉴로 돌아가기',openAdminMenu));
}
function syncAfterAdminCleanup(affectedTreeIds){
  invalidateTreesCache();
  var removedMap={};
  (affectedTreeIds||[]).forEach(function(id){ if(id) removedMap[id]=true; });
  if(meDoc&&meDoc.treeId&&removedMap[meDoc.treeId]){
    meDoc.treeId=null;
    delete meDoc.treeCache;
  }
  refreshPins(true).catch(function(){});
  if(view&&removedMap[view.id]){
    stopBeat();
    if(document.body.dataset.page==='map'){
      clearWatch(); curKey=null; view=null; T=null; present={}; msgs=[];
      hud();
    } else {
      openEmpty();
      if(history&&history.replaceState) history.replaceState(null,'','#home');
    }
  }
}
function openAdminCleanup(tab,query){
  if(!isAdmin()) return;
  var activeTab=(tab==='trees')?'trees':'users';
  var searchVal=String(query||'');
  openSheet('계정·나무 정리','계정·나무 데이터나 Authentication에서 이미 삭제된 회원의 남은 데이터를 Firestore에서 정리합니다.');
  sheet.classList.add('adminGuideSheet','adminCleanupSheet');

  var notice=el('div','adminCleanupNotice');
  notice.append(
    txt('p','','이 화면에서 정리하면 Firestore에 저장된 계정·나무·일기·구름·응원·초대 코드 데이터가 즉시 삭제됩니다.'),
    txt('p','adminCleanupSubNotice','다른 사람의 Google 로그인 목록(Authentication) 자체는 보안상 앱에서 지울 수 없으므로, 로그인 계정도 없애야 한다면 Firebase 콘솔 → Authentication → Users에서 해당 계정을 직접 삭제해 주세요.')
  );
  sheet.appendChild(notice);

  var tabs=el('div','adminCleanupTabs');
  var usersTabBtn=ghostBtn('회원 목록',function(){ openAdminCleanup('users',searchInput.value); });
  var treesTabBtn=ghostBtn('나무 목록',function(){ openAdminCleanup('trees',searchInput.value); });
  usersTabBtn.setAttribute('aria-pressed',activeTab==='users'?'true':'false');
  treesTabBtn.setAttribute('aria-pressed',activeTab==='trees'?'true':'false');
  tabs.append(usersTabBtn,treesTabBtn);
  sheet.appendChild(tabs);

  var searchWrap=el('div','adminCleanupSearch');
  var searchInput=document.createElement('input');
  searchInput.type='search';
  searchInput.value=searchVal;
  searchInput.autocomplete='off';
  searchInput.spellcheck=false;
  searchInput.placeholder=activeTab==='users'?'별명, 이메일, UID, 나무 ID로 검색':'나무 이름, 나무 ID, 소유자 UID로 검색';
  searchInput.setAttribute('aria-label',searchInput.placeholder);
  searchWrap.appendChild(searchInput);
  sheet.appendChild(searchWrap);

  var orphanBox=null, orphanInput=null, orphanBtn=null;
  if(activeTab==='users'){
    orphanBox=el('div','adminCleanupOrphanRow');
    orphanInput=document.createElement('input');
    orphanInput.type='text';
    orphanInput.className='codeInput';
    orphanInput.autocomplete='off';
    orphanInput.spellcheck=false;
    orphanInput.placeholder='Authentication만 지워진 회원의 UID 직접 입력';
    orphanInput.setAttribute('aria-label','남은 데이터를 정리할 회원 UID 입력');
    orphanBtn=txt('button','mini','UID로 남은 데이터 정리');
    orphanBtn.type='button';
    orphanBox.append(orphanInput,orphanBtn);
    sheet.appendChild(orphanBox);
  }

  var listNote=formNote();
  var listBox=el('div','adminCleanupList');
  listBox.appendChild(txt('p','adminCleanupEmpty','목록을 불러오는 중이에요...'));
  sheet.appendChild(listBox);

  var backActs=actions();
  backActs.appendChild(ghostBtn('관리자 메뉴로 돌아가기',openAdminMenu));

  var loaded={users:[],trees:[]};

  function openConfirmCleanup(cfg){
    openSheet(cfg.title,cfg.desc);
    sheet.classList.add('adminGuideSheet','adminCleanupSheet');
    if(cfg.details&&cfg.details.length){
      var detailCard=el('section','adminCleanupNotice');
      cfg.details.forEach(function(line,idx){
        detailCard.appendChild(txt('p',idx>0?'adminCleanupSubNotice':'',line));
      });
      sheet.appendChild(detailCard);
    }
    var note=formNote(), a=actions();
    var cancelBtn=ghostBtn('취소',function(){ openAdminCleanup(activeTab,searchInput.value); });
    var goBtn=bigBtn(cfg.confirmLabel,function(){
      cancelBtn.disabled=true; goBtn.disabled=true; goBtn.textContent='정리하는 중'; note.textContent='';
      cfg.run().then(function(msg){
        openAdminCleanup(activeTab,searchInput.value);
        toast(msg);
      }).catch(function(err){
        cancelBtn.disabled=false; goBtn.disabled=false; goBtn.textContent=cfg.confirmLabel;
        var rep=recordError(cfg.errTitle,err,'관리자 데이터 정리');
        note.textContent=(err&&err.code==='admin/self-delete')
          ?'현재 로그인한 관리자 본인의 계정은 정리할 수 없어요.'
          :((err&&err.message)||'데이터를 정리하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        attachTroubleshootBtn(note,rep,function(){ openConfirmCleanup(cfg); });
      });
    });
    goBtn.classList.add('danger');
    a.append(cancelBtn,goBtn);
  }

  function treeKindText(t){
    var isVirt=!!(t.virtual||String(t.id||'').indexOf('virtual-')===0);
    return isVirt?'가상 나무':(forestLabel(t.f,t.n)+' '+t.n+'번');
  }

  function confirmUserCleanup(u,treeMap,allTreeList){
    var uid=u.uid;
    if(me&&uid===me.uid){ toast('현재 로그인한 관리자 계정은 삭제할 수 없어요.'); return; }
    var related=(allTreeList||[]).filter(function(t){
      return t&&(t.id===u.treeId||(t.members||[]).indexOf(uid)>=0||t.ownerUid===uid);
    });
    var soloTrees=[], sharedTrees=[];
    related.forEach(function(t){
      var others=(t.members||[]).filter(function(x){ return x!==uid; });
      if(!others.length) soloTrees.push(t); else sharedTrees.push(t);
    });
    var details=[
      '대상 UID: '+uid,
      '이메일: '+(u.email||'문서 없음(고아 UID 정리)'),
      soloTrees.length
        ?('혼자 쓰던 나무 '+soloTrees.map(function(t){ return '「'+safe(t.name,'이름 없는 나무')+'」('+t.id+')'; }).join(', ')+'와 해당 나무의 일기·구름·하트·응원·초대 코드가 함께 삭제됩니다.')
        :'혼자 쓰던 나무는 없습니다.',
      sharedTrees.length
        ?('가족이 함께 쓰는 나무 '+sharedTrees.map(function(t){ return '「'+safe(t.name,'이름 없는 나무')+'」'; }).join(', ')+'에서는 이 회원만 제외되며, 다른 가족의 기록은 그대로 남습니다.')
        :'회원이 남긴 구름·응원·초대 코드와 users 문서가 삭제됩니다.'
    ];
    openConfirmCleanup({
      title:(u.nick?safe(u.nick)+' ':'')+'회원 데이터를 정리할까요?',
      desc:'Firestore의 회원 기록을 영구 삭제합니다. Authentication 로그인 항목은 Firebase 콘솔에서 별도로 삭제해야 합니다.',
      details:details,
      confirmLabel:'이 회원 데이터 정리하기',
      errTitle:'회원 데이터를 정리하지 못했어요',
      run:function(){
        return B.adminCleanupUser(uid).then(function(res){
          syncAfterAdminCleanup(soloTrees.map(function(t){ return t.id; }));
          var extra=(res&&res.deletedTrees)?(' (단독 나무 '+res.deletedTrees+'그루 포함)'):'';
          return '회원 데이터를 정리했어요.'+extra;
        });
      }
    });
  }

  function confirmTreeDelete(t){
    var memberCount=(t.members||[]).length;
    openConfirmCleanup({
      title:'「'+safe(t.name,'이름 없는 나무')+'」을(를) 삭제할까요?',
      desc:'이 나무와 나무에 연결된 모든 기록을 Firestore에서 영구 삭제합니다.',
      details:[
        '나무 ID: '+t.id+' ('+treeKindText(t)+')',
        '연결된 구성원 '+memberCount+'명의 treeId 연결이 해제되어 새 나무 선택 상태로 바뀝니다.',
        '이 나무의 우리 이야기(일기), 응원 말, 하트 기록, 구름, 초대 코드가 모두 삭제됩니다.'
      ],
      confirmLabel:'이 나무 데이터 삭제하기',
      errTitle:'나무 데이터를 삭제하지 못했어요',
      run:function(){
        return B.adminDeleteTree(t.id).then(function(res){
          syncAfterAdminCleanup([t.id]);
          var cleared=(res&&res.clearedUsers)?(' · 회원 '+res.clearedUsers+'명 연결 해제'):'';
          return '나무 데이터를 삭제했어요.'+cleared;
        });
      }
    });
  }

  function renderList(){
    var q=searchInput.value.trim().toLowerCase();
    var treeMap={};
    loaded.trees.forEach(function(t){ if(t&&t.id) treeMap[t.id]=t; });
    listBox.innerHTML='';

    if(activeTab==='users'){
      var users=loaded.users.slice().sort(function(a,b){
        var aSelf=me&&a.uid===me.uid?1:0, bSelf=me&&b.uid===me.uid?1:0;
        if(aSelf!==bSelf) return aSelf-bSelf;
        return String(a.nick||a.email||a.uid).localeCompare(String(b.nick||b.email||b.uid),'ko');
      }).filter(function(u){
        if(!q) return true;
        var lt=u.treeId&&treeMap[u.treeId];
        return [u.uid,u.email,u.nick,u.treeId,lt&&lt.name].some(function(v){
          return String(v||'').toLowerCase().indexOf(q)>=0;
        });
      });

      if(!users.length){
        listBox.appendChild(txt('p','adminCleanupEmpty',q?'검색 조건에 맞는 회원이 없어요.':'등록된 회원이 없어요.'));
        return;
      }
      users.forEach(function(u){
        var row=el('div','adminCleanupItem');
        var meta=el('div','adminCleanupMeta');
        var head=el('div','adminCleanupItemHead');
        head.appendChild(txt('strong','adminCleanupName',safe(u.nick,'이름 없는 회원')));
        var isSelf=!!(me&&u.uid===me.uid);
        if(isSelf) head.appendChild(txt('span','adminCleanupBadge self','내 관리자 계정'));
        meta.appendChild(head);
        meta.appendChild(txt('p','adminCleanupSub',u.email||'이메일 정보 없음'));
        meta.appendChild(txt('p','adminCleanupUid','UID: '+u.uid));
        var linked=u.treeId?treeMap[u.treeId]:null;
        var treeLine=u.treeId
          ?(linked?('연결 나무: '+safe(linked.name,'이름 없는 나무')+' ('+u.treeId+')'):('연결 나무 ID: '+u.treeId+' (트리 문서 없음)'))
          :'연결된 나무 없음';
        meta.appendChild(txt('p','adminCleanupSub',treeLine));

        var act=el('div','adminCleanupItemAct');
        var btn=txt('button',isSelf?'mini':'mini danger',isSelf?'보호됨':'데이터 정리');
        btn.type='button';
        btn.disabled=isSelf;
        btn.onclick=function(){ confirmUserCleanup(u,treeMap,loaded.trees); };
        act.appendChild(btn);
        row.append(meta,act);
        listBox.appendChild(row);
      });
      return;
    }

    var trees=loaded.trees.slice().sort(function(a,b){
      return String(a.id||'').localeCompare(String(b.id||''),'ko');
    }).filter(function(t){
      if(!q) return true;
      return [t.id,t.name,t.ownerUid,treeKindText(t)].some(function(v){
        return String(v||'').toLowerCase().indexOf(q)>=0;
      });
    });
    if(!trees.length){
      listBox.appendChild(txt('p','adminCleanupEmpty',q?'검색 조건에 맞는 나무가 없어요.':'등록된 나무가 없어요.'));
      return;
    }
    trees.forEach(function(t){
      var row=el('div','adminCleanupItem');
      var meta=el('div','adminCleanupMeta');
      var head=el('div','adminCleanupItemHead');
      head.appendChild(txt('strong','adminCleanupName',safe(t.name,'이름 없는 나무')));
      if(t.virtual||String(t.id||'').indexOf('virtual-')===0) head.appendChild(txt('span','adminCleanupBadge','가상'));
      if(view&&view.id===t.id) head.appendChild(txt('span','adminCleanupBadge self','현재 화면'));
      meta.appendChild(head);
      meta.appendChild(txt('p','adminCleanupSub',treeKindText(t)+' · 구성원 '+(t.members||[]).length+'명 · 하트 '+(t.hearts||0)+'개'));
      meta.appendChild(txt('p','adminCleanupUid','ID: '+t.id+(t.ownerUid?' · 방장 UID: '+t.ownerUid:'')));

      var act=el('div','adminCleanupItemAct');
      var btn=txt('button','mini danger','나무 삭제');
      btn.type='button';
      btn.onclick=function(){ confirmTreeDelete(t); };
      act.appendChild(btn);
      row.append(meta,act);
      listBox.appendChild(row);
    });
  }

  searchInput.oninput=function(){ renderList(); };
  if(orphanBtn){
    orphanBtn.onclick=function(){
      var targetUid=(orphanInput.value||'').trim();
      if(!targetUid){ listNote.textContent='정리할 회원의 UID를 입력해 주세요.'; orphanInput.focus(); return; }
      if(me&&targetUid===me.uid){ listNote.textContent='현재 로그인한 관리자 본인의 UID는 정리할 수 없어요.'; return; }
      listNote.textContent='';
      var existing=loaded.users.filter(function(u){ return u.uid===targetUid; })[0];
      confirmUserCleanup(existing||{uid:targetUid,nick:'',email:'',treeId:null},{},loaded.trees);
    };
  }

  Promise.all([B.adminListUsers(),listTreesCached(true)]).then(function(res){
    if(!sheet.open||!sheet.classList.contains('adminCleanupSheet')) return;
    loaded.users=res[0]||[];
    loaded.trees=res[1]||[];
    allTrees=loaded.trees;
    renderList();
  }).catch(function(err){
    if(!sheet.open||!sheet.classList.contains('adminCleanupSheet')) return;
    listBox.innerHTML='';
    listBox.appendChild(txt('p','adminCleanupEmpty','목록을 불러오지 못했어요.'));
    var rep=recordError('관리자 데이터 목록을 불러오지 못했어요',err,'관리자 데이터 정리 목록');
    listNote.textContent='목록 조회 중 오류가 발생했어요.';
    attachTroubleshootBtn(listNote,rep,function(){ openAdminCleanup(activeTab,searchInput.value); });
  });
}
var adminNoticeListBox=null;
function renderAdminNoticeList(){
  if(!adminNoticeListBox) return;
  adminNoticeListBox.innerHTML='';
  var items=(globalNotices||[]).slice();
  if(!items.length){
    adminNoticeListBox.appendChild(txt('p','adminCleanupEmpty','아직 발송한 전체 공지가 없어요.'));
    return;
  }
  items.forEach(function(n){
    var row=el('div','adminCleanupItem');
    var meta=el('div','adminCleanupMeta');
    meta.append(
      txt('strong','adminCleanupName',n.title||'공지사항'),
      txt('p','adminCleanupSub',previewNotifText(n.body||'',72)),
      txt('p','adminCleanupUid','발송 시각: '+(n.createdAt?formatKstDateTime(n.createdAt).slice(0,16):'-'))
    );
    var act=el('div','adminCleanupItemAct');
    var del=txt('button','mini danger','삭제');
    del.type='button';
    del.onclick=function(){
      del.disabled=true; del.textContent='삭제 중';
      B.deleteNotice(n.id).then(function(){
        toast('공지를 삭제했어요.');
      }).catch(function(err){
        del.disabled=false; del.textContent='삭제';
        var rep=recordError('공지를 삭제하지 못했어요',err,'전체 공지 삭제');
        openTroubleshoot(rep,{onBack:openAdminNoticeSheet});
      });
    };
    act.appendChild(del);
    row.append(meta,act);
    adminNoticeListBox.appendChild(row);
  });
}
function openAdminNoticeSheet(){
  if(!isAdmin()) return;
  openSheet('전체 공지 보내기','로그인한 모든 회원의 화면과 알림 창에 공지사항을 발송합니다.');
  sheet.classList.add('adminGuideSheet','adminCleanupSheet','adminNoticeSheet');

  var form=el('section','adminNoticeForm');
  var titleIn=field('공지 제목','input','',60);
  titleIn.placeholder='예: 수확 체험 안내, 서비스 점검 공지';
  var bodyTa=field('공지 내용','textarea','',600,4);
  bodyTa.placeholder='모든 회원에게 전할 공지 내용을 적어 주세요.';
  var note=formNote();
  var sendWrap=el('div','adminNoticeSendRow');
  var sendBtn=bigBtn('전체 알림 보내기',function(){
    var title=titleIn.value.trim(), body=bodyTa.value.trim();
    if(!title){ note.textContent='공지 제목을 입력해 주세요.'; titleIn.focus(); return; }
    if(!body){ note.textContent='공지 내용을 입력해 주세요.'; bodyTa.focus(); return; }
    sendBtn.disabled=true; sendBtn.textContent='발송 중'; note.textContent='';
    var sender=((meDoc&&meDoc.nick)||'엉클리틀').trim().slice(0,30)||'엉클리틀';
    B.createNotice({title:title,body:body,createdByName:sender}).then(function(){
      titleIn.value=''; bodyTa.value='';
      titleIn.dispatchEvent(new Event('input'));
      bodyTa.dispatchEvent(new Event('input'));
      sendBtn.disabled=false; sendBtn.textContent='전체 알림 보내기';
      renderAdminNoticeList();
      toast('전체 회원에게 공지 알림을 보냈어요.');
    }).catch(function(err){
      sendBtn.disabled=false; sendBtn.textContent='전체 알림 보내기';
      var rep=recordError('공지 알림을 보내지 못했어요',err,'전체 공지 발송');
      note.textContent='공지 알림을 보내지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
      attachTroubleshootBtn(note,rep,openAdminNoticeSheet);
    });
  });
  sendWrap.appendChild(sendBtn);
  form.append(titleIn.parentNode,bodyTa.parentNode,note,sendWrap);
  sheet.appendChild(form);

  var histSec=el('section','adminShareSection');
  histSec.appendChild(txt('h3','','보낸 공지 목록'));
  adminNoticeListBox=el('div','adminCleanupList');
  histSec.appendChild(adminNoticeListBox);
  sheet.appendChild(histSec);
  renderAdminNoticeList();

  actions().appendChild(ghostBtn('관리자 메뉴로 돌아가기',openAdminMenu));
}
function openAdminMenu(){
  if(!isAdmin()) return;
  openSheet('관리자','관리자 권한('+(me.email||SUPPORT_EMAIL)+')으로 로그인했을 때만 보이는 메뉴예요.');
  sheet.classList.add('adminGuideSheet');
  var pending=(adminRequests||[]).filter(function(r){ return r&&r.status==='pending'; }).length;
  var box=el('div','settings-actions');
  box.appendChild(bigBtn('전체 공지 보내기',openAdminNoticeSheet));
  box.appendChild(bigBtn(pending?'관리자 권한 공유 관리 ('+pending+'건 요청)':'관리자 권한 공유 관리',openAdminAccessSheet));
  box.appendChild(bigBtn('관리자 안내',openAdminGuide));
  box.appendChild(bigBtn('계정·나무 정리',function(){ openAdminCleanup('users'); }));
  sheet.appendChild(box);
}
function openMenu(){
  resetSettingsTapState();
  openSheet('설정');
  var titleEl=$('sheetTitle');
  if(titleEl){
    titleEl.classList.add('settingsTitleTap');
    titleEl.onclick=onSettingsTitleTap;
  }
  var box=el('div','settings-actions');
  box.appendChild(bigBtn('내 캐릭터 커스텀하기',requestCharacterCustom));
  box.appendChild(bigBtn('분석 쿠키 설정',openAnalyticsSettings));
  box.appendChild(bigBtn('로그아웃',openLogoutConfirm));
  box.appendChild(ghostBtn('회원 탈퇴',openDeleteAccount));
  sheet.appendChild(box);
}
function openMembershipInfo(){
  openSheet('나만의 귤나무 만들기 멤버십','1988년부터 이어온 제주 벼락밭 귤나무 한 그루와 사계절을 함께하는 연간 멤버십이에요.');
  sheet.classList.add('membershipSheet');
  sheet.appendChild(txt('p','membershipCommon','공통 혜택 · 벼락밭 내 나무 지정 · 나무 이름표 각인 · 농장 체험 · 앱 성장 기록'));
  var grid=el('div','membershipGrid'), plans=[
    {
      name:'아시날', sub:'기억 플랜',
      price:'150,000원', featured:false,
      items:['웰컴키트 1개 · 감귤 배송 연 1회','농장 프로그램 연 2회 (1인 기준)','숙소·키친 10% 할인권 각 1매','갱신 시 나무 이름·기록 유지']
    },
    {
      name:'오눌', sub:'개인 플랜',
      price:'250,000원', featured:false,
      items:['웰컴키트 1개 · 상·하반기 감귤 배송 2회','키친 점심 제공 연 1회 (1인 기준)','농장 프로그램 연 2회 (1인 기준)','숙소 10% 할인권 2매','갱신 시 이름·기록 유지 + 5% 할인']
    },
    {
      name:'낼', sub:'가족 플랜',
      price:'450,000원', featured:true,
      items:['독채 숙소 제공 연 1회 (2인 기준)','키친 점심 제공 연 1회 (2인 기준)','웰컴키트 2개 · 상·하반기 감귤 배송 2회','농장 프로그램 연 2회 (2인 기준)','갱신 시 이름·기록 유지 + 5% 할인']
    }
  ];
  plans.forEach(function(p){
    var card=el('article','membershipCard'+(p.featured?' featured':''));
    var head=el('div','membershipHead');
    var title=el('h3','membershipName',p.name);
    head.append(title,txt('p','membershipSub',p.sub),txt('p','membershipPrice',p.price));
    var ul=el('ul','membershipList');
    p.items.forEach(function(item){ ul.appendChild(txt('li','',item)); });
    card.append(head,ul);
    grid.appendChild(card);
  });
  sheet.appendChild(grid);
  sheet.appendChild(txt('p','membershipFootnote','식사·숙소 추가 인원 발생 시 추가 요금 별도 (독채 2인 기준 · 최대 4인)'));
  var kakaoWrap=el('div','membershipKakaoWrap'), kakao=el('a','membershipKakaoLink');
  kakao.href='https://pf.kakao.com/_ctxlxej'; kakao.target='_blank'; kakao.rel='noopener';
  kakao.textContent='엉클리틀 카카오톡 채널에서 문의하기';
  kakaoWrap.appendChild(kakao); sheet.appendChild(kakaoWrap);
}
function openTutorial(first,onDone){
  openSheet('사용 방법',first?'가입을 환영해요. 먼저 이곳을 천천히 둘러보세요.':'');
  sheet.classList.add('tutorialSheet');
  var gearSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>';
  var bellSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var wrap=el('article','legalDoc tutorialDoc');
  var introSec=el('section','tutorialSection');
  introSec.append(
    txt('h3','','첫 화면'),
    txt('p','','구름 속 링크에서 엉클리틀의 공간과 프로그램을 살펴볼 수 있어요.')
  );
  wrap.appendChild(introSec);

  var groups=[
    {
      title:'나무 돌보기',
      items:[
        {icon:ICON.pick, name:'귤 따기', desc:'나무에 열린 귤을 모두 따서 바구니에 담아요.'},
        {icon:ICON.bug, name:'벌레 잡기', desc:'나무에 붙은 벌레를 모두 잡아요.'},
        {icon:ICON.hug, name:'안아주기', desc:'나무를 꼭 안아줘요.'},
        {icon:ICON.water, name:'물주기', desc:'물뿌리개로 나무에 물을 줘요. 비가 오면 주지 않아도 돼요.'}
      ]
    },
    {
      title:'이야기와 가족',
      items:[
        {icon:ICON.cloud, name:'구름 띄우기', desc:'24시간 동안 하늘을 지나가는 한마디를 띄워요. 하루 한 번 띄울 수 있어요.'},
        {icon:ICON.book, name:'나무 이야기', desc:'나무 이름과 소개·이야기를 적고, 이웃이 남긴 응원을 읽어요.'},
        {icon:ICON.note, name:'우리 이야기', desc:'날짜를 눌러 글을 남겨요. 같은 나무에 연결된 가족은 서로의 기록을 볼 수 있어요.'},
        {icon:ICON.family, name:'우리 가족', desc:'함께 돌보는 가족을 보고 초대 코드를 만들거나 연결을 정리할 수 있어요.'}
      ]
    },
    {
      title:'지도 · 이웃 나무 · 설정',
      items:[
        {icon:ICON.map, name:'벼락밭 지도', desc:'밭의 숲을 눌러 이웃 나무를 구경하고, 받은 나무 코드를 입력할 수 있어요.'},
        {icon:HEART, name:'하트와 응원', desc:'이웃 나무에서는 하루 한 번 하트를 누르고, ‘나무 이야기’에서 응원을 남길 수 있어요.'},
        {icon:FRUIT, name:'딴 귤 바구니', desc:'내 나무 아래쪽에서 지금까지 딴 귤과 이웃에게 받은 하트 수를 확인해요.'},
        {icon:bellSvg, name:'알림 (오른쪽 위)', desc:'내 나무 댓글, 일기 답장, 전체 공지가 오면 바로 알려줘요.'},
        {icon:gearSvg, name:'설정 (오른쪽 위)', desc:'내 캐릭터 꾸미기, 분석 쿠키 설정, 로그아웃, 회원 탈퇴를 이용할 수 있어요.'}
      ]
    }
  ];

  groups.forEach(function(g){
    var sec=el('section','tutorialSection');
    sec.appendChild(txt('h3','',g.title));
    var grid=el('div','tutorialBtnGrid');
    g.items.forEach(function(it){
      var item=el('div','tutorialBtnItem');
      var iconBox=el('span','tutorialBtnIcon',it.icon);
      iconBox.setAttribute('aria-hidden','true');
      var textBox=el('div','tutorialBtnText');
      textBox.append(txt('strong','',it.name),txt('p','',it.desc));
      item.append(iconBox,textBox);
      grid.appendChild(item);
    });
    sec.appendChild(grid);
    wrap.appendChild(sec);
  });

  sheet.appendChild(wrap);
  tutorialAfterClose=onDone||null;
  actions().appendChild(bigBtn('둘러보기',function(){ if(me&&meDoc&&!meDoc.tutorialSeen){ meDoc.tutorialSeen=true; B.setUser(me.uid,{tutorialSeen:true}); } sheet.close(); }));
}
function openLogoutConfirm(){
  openSheet('로그아웃할까요?');
  var a=actions(); a.append(ghostBtn('취소',openMenu),bigBtn('로그아웃',function(){ sheet.close(); B.signOut(); }));
}
function legalOperator(){ return CONFIG.legal.operatorName+' (대표 '+CONFIG.legal.representative+')'; }
function openTerms(){
  openSheet('서비스 이용약관','시행일 '+CONFIG.legal.effectiveDate); sheet.classList.add('legalSheet'); var d=el('article','legalDoc');
  d.innerHTML='<p class="legalNotice">본 약관은 '+legalOperator()+'이 제공하는 LITTTL. FARM. 서비스 이용에 적용됩니다.</p>'
    +'<h3>1. 서비스</h3><p>이 서비스는 귤나무 연결, 가족 초대, 나무 돌보기, 이야기·일기·구름·응원 기록과 지도 탐색 기능을 제공합니다.</p>'
    +'<h3>2. 계정과 이용 (만 14세 이상)</h3><p>회원은 본인의 Google 계정으로 로그인하여 이용할 수 있으며 계정 정보를 안전하게 관리해야 합니다. 본 서비스는 만 14세 이상 이용자를 기준으로 하며, 만 14세 미만은 법정대리인의 동의가 필요합니다. 벼락밭 나무 연결은 운영자가 발급한 유효한 코드가 있을 때만 가능합니다.</p>'
    +'<h3>3. 이용자의 콘텐츠와 AI 생성 답장</h3><p>회원이 작성한 나무 이름, 이야기, 일기, 구름과 응원 메시지의 권리는 작성자에게 있습니다. 우리 이야기의 나무 답장은 인공지능(AI)이 작성하며, 작성된 일기 내용은 AI 모델 학습에 사용되지 않습니다.</p>'
    +'<h3>4. 금지 행위</h3><ul><li>타인의 권리나 개인정보를 침해하는 행위</li><li>욕설·음란물·차별·괴롭힘·불법 정보 게시</li><li>자동화 도구로 하트, 구름, 초대 코드 등을 비정상적으로 조작하는 행위</li><li>서비스 보안이나 정상 운영을 방해하는 행위</li></ul>'
    +'<h3>5. 신고·이용 제한 및 휴면·정지 정책</h3><p>부적절한 구름·응원·계정은 문의 이메일로 신고할 수 있으며, 운영자는 법령 위반이나 서비스 방해가 확인되면 해당 콘텐츠를 삭제·숨김 처리하고 계정 이용을 일시 정지 또는 해지할 수 있습니다. 장기간 미접속 계정의 정리는 관련 법령에 따릅니다.</p>'
    +'<h3>6. 탈퇴</h3><p>회원은 설정의 회원 탈퇴에서 계정을 삭제할 수 있습니다. 탈퇴 시 개인 계정 정보와 본인 식별이 가능한 기록을 삭제하며, 가족이 함께 쓰는 나무의 공동 기록과 익명화된 집계값은 다른 가족의 이용을 위해 남을 수 있습니다.</p>'
    +'<h3>7. 책임과 분쟁</h3><p>운영자는 고의 또는 중대한 과실이 없는 한 천재지변, 통신 장애, 이용자의 귀책사유로 발생한 손해에 책임을 지지 않습니다. 관련 분쟁에는 대한민국 법령을 적용합니다.</p>'
    +'<h3>8. 문의 및 신고 접수</h3><p>'+CONFIG.legal.contactEmail+'</p>'; sheet.appendChild(d);
}
function openPrivacy(){
  openSheet('개인정보처리방침','시행일 '+CONFIG.legal.effectiveDate); sheet.classList.add('legalSheet'); var d=el('article','legalDoc');
  d.innerHTML='<p class="legalNotice">'+legalOperator()+'은 서비스 제공에 필요한 최소한의 개인정보만 처리합니다.</p>'
    +'<h3>1. 처리 목적과 항목</h3><ul><li>회원가입·로그인: Google 계정 이메일 주소, Firebase 이용자 식별자</li><li>서비스 제공: 별명, 나무 연결·가족 구성, 캐릭터 설정, 이야기·일기·구름·응원 기록</li><li>보안과 장애 대응: 접속 기록, 오류 정보, 기기·브라우저 정보</li></ul>'
    +'<h3>2. 보유 기간</h3><p>회원 탈퇴 시 지체 없이 삭제합니다. 관계 법령에 별도 보존 의무가 있는 정보는 해당 기간 동안 분리 보관 후 삭제합니다.</p>'
    +'<h3>3. 제3자 제공</h3><p>개인정보를 제3자에게 판매하거나 제공하지 않습니다. 법령에 근거가 있거나 이용자가 별도로 동의한 경우는 예외입니다.</p>'
    +'<h3>4. 처리 위탁·국외 처리 및 AI 연동</h3><p>Google LLC의 Firebase Authentication, Cloud Firestore, Firebase Hosting을 이용해 인증·데이터 저장·웹 호스팅을 처리하며, 일기 답장 생성을 위해 Google Gemini API를 호출합니다. 일기 답장 생성 시 이메일·계정 식별자는 전송하지 않으며, 입력하신 일기 내용은 AI 모델 학습에 사용되지 않습니다. 일부 인증·AI 처리 데이터는 Google의 글로벌 인프라(미국 등)에서 암호화되어 처리될 수 있습니다.</p>'
    +'<h3>5. 파기</h3><p>보유 목적이 끝난 전자 파일은 복구하기 어려운 방식으로 삭제합니다. 설정의 회원 탈퇴 기능으로 계정 삭제를 직접 요청할 수 있습니다.</p>'
    +'<h3>6. 이용자의 권리</h3><p>회원은 자신의 정보를 열람·수정하고 기록을 백업하거나 계정을 탈퇴할 수 있습니다. 추가 요청은 아래 개인정보 보호 문의처로 보낼 수 있습니다.</p>'
    +'<h3>7. 자동 수집 장치 및 분석 쿠키</h3><p>로그인 유지, 화면 설정과 임시 데이터를 위해 브라우저 로컬 저장소를 사용합니다. 방문·이용 통계용 분석 쿠키는 이용자의 명시적 동의 전까지 차단되며, 하단의 ‘분석 쿠키 설정’ 또는 설정 메뉴에서 언제든 허용·차단할 수 있습니다. 날씨 데이터는 화면 표시 후 별도로 저장하지 않습니다.</p>'
    +'<h3>8. 안전성 확보</h3><p>접근 권한을 최소화하고, Firestore 보안 규칙, 보안 응답 헤더, 암호화 통신, 입력 길이 제한과 유해 표현 필터를 적용합니다.</p>'
    +'<h3>9. 개인정보 보호책임자</h3><p>'+CONFIG.legal.representative+' · '+CONFIG.legal.contactEmail+'</p>'; sheet.appendChild(d);
}
function openDeleteAccount(){
  openSheet('회원 탈퇴','계정과 본인을 식별할 수 있는 기록을 삭제합니다. 이 작업은 되돌릴 수 없어요.');
  sheet.classList.add('legalSheet','deleteAccountSheet');
  var info=el('div','legalDoc'); info.innerHTML='<p>혼자 사용하는 나무는 함께 삭제됩니다. 가족 나무는 남은 가족에게 이어지고, 공동 일기와 익명 집계값은 남을 수 있습니다.</p><p>탈퇴하기를 누르면 본인 확인을 위해 Google 로그인 창이 열립니다.</p>'; sheet.appendChild(info);
  var confirm=el('label','consentRow'); confirm.innerHTML='<input type="checkbox"><span>삭제되는 내용을 확인했고 회원 탈퇴에 동의합니다.</span>'; sheet.appendChild(confirm); var note=formNote(), a=actions();
  a.append(ghostBtn('취소',openMenu)); var del=bigBtn('탈퇴하기',function(){
    if(!confirm.querySelector('input').checked){ note.textContent='삭제 내용을 확인해 주세요.'; return; }
    del.disabled=true; del.textContent='확인 중';
    B.deleteAccount().then(function(){ try{ localStorage.removeItem('littlMine'); }catch(e){} sheet.close(); toast('회원 탈퇴가 완료됐어요.'); location.hash='home'; }).catch(function(e){ del.disabled=false; del.textContent='탈퇴하기'; var msg=AUTH_ERR[e&&e.code]||'탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.'; note.textContent=msg; if(!e||e.code!=='auth/requires-recent-login'){ var rep=recordError(msg,e,'회원 탈퇴'); attachTroubleshootBtn(note,rep,openDeleteAccount); } });
  }); del.classList.add('danger'); a.appendChild(del);
}

/* ---------- 구름: 같은 속도로 움직이고, 빈자리에만 들어가서 겹치지 않음 ---------- */
var sky=$('sky'), SPEED=24, GAP=86, LANE=108, CLOUD_TTL=24*60*60*1000, lanes=[], pool=[], order=[], priority=[], firstClouds=true, knownClouds={}, cloudUpdate=0;
function laneCount(){ return +getComputedStyle(document.documentElement).getPropertyValue('--lanes')||2; }
function laneTop(i){ return 58+i*LANE+4; }
function xAt(it,t){ return RM?it.x0:it.x0+SPEED*(t-it.t0)/1000; }
function free(i,x,w,t){ return (lanes[i]||[]).every(function(it){ var ix=xAt(it,t); return x+w+GAP<ix||ix+it.w+GAP<x; }); }
function cloudW(c){ return Math.max(150,Math.min(215,118+c.text.length*5.4)); }
function cloudNode(c,w){ var b=el('button','cloud',CLOUD); b.appendChild(txt('span','',c.text)); b.style.width=w+'px'; b.setAttribute('aria-label','구름: '+c.text); b.onclick=function(){ openCloud(c); }; sky.appendChild(b); return b; }
function place(c,i,x,t0){
  var w=cloudW(c), b=cloudNode(c,w), y=laneTop(i)+(Math.random()*6-3), it={b:b,c:c,x0:x,t0:t0,w:w};
  (lanes[i]=lanes[i]||[]).push(it);
  var done=function(){ b.remove(); lanes[i]=lanes[i].filter(function(o){ return o!==it; }); };
  if(RM){ b.style.translate=x+'px '+y+'px'; return it; }
  var end=innerWidth+30, ms=Math.max(1,(end-x)/SPEED*1000);
  b.style.translate=x+'px '+y+'px';
  var a=b.animate([{translate:x+'px '+y+'px'},{translate:end+'px '+y+'px'}],{duration:ms,easing:'linear',fill:'both',delay:Math.max(0,t0-Date.now())});
  a.finished.then(done).catch(function(){});
  return it;
}
function nextCloud(){
  if(priority.length) return priority.shift();
  if(!pool.length) return null;
  if(!order.length) order=pool.map(function(_,i){ return i; }).sort(function(){ return Math.random()-.5; });
  return pool[order.pop()]||pool[0];
}
function skyTick(){
  if(RM||document.body.dataset.page!=='scene'||document.hidden) return;
  var n=laneCount(), t=Date.now(), start=Math.floor(Math.random()*n);
  pool=pool.filter(function(c){ return c.evergreen||!c.ts||t-c.ts<CLOUD_TTL; });
  lanes.forEach(function(l,i){ lanes[i]=(l||[]).filter(function(it){ if(it.c&&!it.c.evergreen&&it.c.ts&&t-it.c.ts>=CLOUD_TTL){ it.b.remove(); return false; } return true; }); });
  for(var k=0;k<n;k++){
    var i=(start+k)%n, c=peekW();
    if(!c) return;
    if(free(i,-c-14,c+70+Math.random()*90,t)){ var cl=nextCloud(); if(cl) place(cl,i,-cloudW(cl)-14,t); return; }
  }
}
function peekW(){ var c=priority[0]||pool[order[order.length-1]]||pool[0]; return c?cloudW(c):0; }
function seedSky(){
  var n=laneCount(), W=innerWidth, t=Date.now();
  for(var i=0;i<n;i++){
    var c=nextCloud(); if(!c) return; var x=(i%2?W*.08:W*.48)+Math.random()*50; place(c,i,x,t);
    if(!RM&&W>980){ var c2=nextCloud(), x2=i%2?W*.58:W*.08; if(c2&&free(i,x2,cloudW(c2),t)) place(c2,i,x2,t); }
  }
}
function reseedSky(){
  lanes.forEach(function(l){ (l||[]).forEach(function(it){ try{ it.b.getAnimations().forEach(function(a){ a.cancel(); }); }catch(e){} it.b.remove(); }); });
  lanes=[]; order=[]; if(pool.length) seedSky();
}
function launch(c){
  var w=cloudW(c), wr=world.getBoundingClientRect(), cx=wr.left+wr.width/2, W=innerWidth, RISE=1100, t=Date.now()+RISE, n=laneCount();
  if(RM){ (lanes[0]||[]).forEach(function(it){ it.b.remove(); }); lanes[0]=[]; place(c,0,Math.max(10,Math.min(W-w-10,cx-w/2)),t); return; }
  var cand=[]; for(var k=0;k<14;k++){ var off=Math.ceil(k/2)*90*(k%2?1:-1), x=cx-w/2+off; if(x>=8&&x+w<=W-8) cand.push(x); }
  for(var i=n-1;i>=0;i--){ for(var j=0;j<cand.length;j++){ if(free(i,cand[j],w,t)&&free(i,cand[j],w,t+200)){ return rise(c,i,cand[j],t,RISE); } } }
  var fallbackX=Math.max(12,Math.min(W-w-12,cx-w/2));
  return rise(c,Math.max(0,n-1),fallbackX,t,RISE);
}
function rise(c,i,x,t,ms){
  if(c.id) knownClouds[c.id]=1;
  if(c.uid&&c.ts) knownClouds[c.uid+':'+c.ts]=1;
  var w=cloudW(c), it=place(c,i,x,t), b=it.b, wr=world.getBoundingClientRect(), y=laneTop(i);
  it.rising=true; b.style.opacity=0;
  var p=el('div','puff'); $('scene').appendChild(p);
  var sx=wr.left+wr.width/2, sy=wr.top+wr.height*.36, ex=x+w/2, ey=y+48;
  p.animate([
    {translate:sx+'px '+sy+'px',scale:.55,opacity:1},
    {translate:(sx-12)+'px '+((sy*2+ey)/3)+'px',scale:.9,opacity:1,offset:.4},
    {translate:(ex+10)+'px '+((sy+ey*2)/3)+'px',scale:1.05,opacity:1,offset:.78},
    {translate:ex+'px '+ey+'px',scale:1.2,opacity:.95}
  ],{duration:ms,easing:'ease-out',fill:'forwards'}).finished.then(function(){
    p.remove();
    it.rising=false;
    b.style.opacity=1;
    b.animate([{scale:.3,opacity:.25},{scale:1.06,opacity:1,offset:.7},{scale:1,opacity:1}],{duration:360,easing:'ease-out'});
  }).catch(function(){ it.rising=false; b.style.opacity=1; });
}
function applyCloudList(list){
  var now=Date.now(), clean=list.filter(function(c){ return !Filter.bad(c.text)&&(c.evergreen||(c.ts&&now-c.ts<CLOUD_TTL)); }), allowed={};
  clean.forEach(function(c){
    if(c.id) allowed[c.id]=1;
    if(c.uid&&c.ts) allowed[c.uid+':'+c.ts]=1;
  });
  lanes.forEach(function(l,i){
    lanes[i]=(l||[]).filter(function(it){
      if(it.rising) return true;
      var byId=it.c&&it.c.id&&allowed[it.c.id];
      var byMeta=it.c&&it.c.uid&&it.c.ts&&allowed[it.c.uid+':'+it.c.ts];
      if(!byId&&!byMeta){ it.b.remove(); return false; }
      return true;
    });
  });
  priority=priority.filter(function(c){ return (c.id&&allowed[c.id])||(c.uid&&c.ts&&allowed[c.uid+':'+c.ts]); });
  if(firstClouds){
    firstClouds=false;
    clean.forEach(function(c){ if(c.id) knownClouds[c.id]=1; if(c.uid&&c.ts) knownClouds[c.uid+':'+c.ts]=1; });
    pool=clean; order=[]; seedSky(); return;
  }
  clean.forEach(function(c){
    if((c.id&&knownClouds[c.id])||(c.uid&&c.ts&&knownClouds[c.uid+':'+c.ts])) return;
    if(c.id) knownClouds[c.id]=1;
    if(c.uid&&c.ts) knownClouds[c.uid+':'+c.ts]=1;
    if(me&&c.uid===me.uid&&Date.now()-c.ts<12000) return;
    priority.push(c);
  });
  pool=clean;
  order=order.filter(function(i){ return i<pool.length; });
  var active=(document.body.dataset.mode==='mine'||document.body.dataset.mode==='visit'), placed=lanes.some(function(l){ return l&&l.length; });
  if(active&&pool.length&&!placed){ order=[]; seedSky(); }
}
var lastCloudSnapshot=[];
function onClouds(list){
  lastCloudSnapshot=list||[];
  var ticket=++cloudUpdate;
  listTreesCached().then(function(trees){
    if(ticket!==cloudUpdate) return;
    var linked={}; (trees||[]).forEach(function(t){ if(t&&t.id) linked[t.id]=1; });
    applyCloudList((lastCloudSnapshot||[]).filter(function(c){ return c&&(linked[c.treeId]||(c.f!=null&&c.n!=null&&linked[c.f+'-'+c.n])); }));
  }).catch(function(){ if(ticket===cloudUpdate) applyCloudList([]); });
}

/* ---------- 날씨 ---------- */
var liveW=null, weatherBusy=false, fx=$('fx'), fxCtx=fx.getContext('2d'), fxParts=[], fxOn='';
function weather(){ return liveW||{kind:'unknown',day:true,label:'',temp:null}; }
function asNumber(v){ var n=Number(v); return v==null||v===''||!isFinite(n)?null:n; }
function jejuHour(){
  try{ return Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',hour:'numeric',hour12:false}).format(new Date()))%24; }
  catch(e){ return new Date().getHours(); }
}
function weatherFromMetNo(j){
  var c=j.current||j, temp=asNumber(c.ta!=null?c.ta:c.temp), rain=asNumber(c.rn!=null?c.rn:c.precipitation), snow=asNumber(c.sdTot!=null?c.sdTot:(c.sd_tot!=null?c.sd_tot:c.snow)), cloud=asNumber(c.caTot!=null?c.caTot:(c.ca_tot!=null?c.ca_tot:c.cloud)), ww=String(c.ww||'');
  rain=Math.max(0,rain||0); snow=Math.max(0,snow||0);
  var kind='unknown', label='관측 중';
  if(/뇌전|천둥|번개/.test(ww)){ kind='storm'; label='천둥번개'; }
  else if(snow>0||/눈|진눈/.test(ww)){ kind='snow'; label='눈'; }
  else if(rain>0||/비|소나기|이슬비/.test(ww)){ kind='rain'; label='비'; }
  else if(/안개|박무|연무/.test(ww)){ kind='fog'; label='안개'; }
  else if(cloud!=null){ kind=cloud<=2?'clear':'cloudy'; label=cloud<=2?'맑음':(cloud<=6?'구름 조금':'흐림'); }
  var hour=jejuHour();
  return {kind:kind,day:hour>=7&&hour<19,label:label,temp:temp,rain:rain,snow:snow,cloud:cloud,observedAt:c.tm||null,source:c.source||'metno',realtime:true,manual:false,at:Date.now()};
}
function formatObservedAt(tm){
  var s=String(tm||'');
  if(/^\d{12}$/.test(s)) return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+' '+s.slice(8,10)+':'+s.slice(10,12)+' KST';
  return s;
}
function fetchMetNoDirect(){
  return fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=33.249&lon=126.278',{cache:'no-store'}).then(function(r){
    if(!r.ok) throw new Error('metno');
    return r.json();
  }).then(function(data){
    var series=data&&data.properties&&data.properties.timeseries;
    if(!Array.isArray(series)||!series.length) throw new Error('metno');
    var nowMs=Date.now(), chosen=series[0], best=Math.abs(new Date(chosen.time).getTime()-nowMs);
    for(var i=1;i<Math.min(series.length,6);i++){ var diff=Math.abs(new Date(series[i].time).getTime()-nowMs); if(diff<best){ best=diff; chosen=series[i]; } }
    var instant=(chosen.data&&chosen.data.instant&&chosen.data.instant.details)||{};
    var next1=(chosen.data&&(chosen.data.next_1_hours||chosen.data.next_6_hours))||{};
    var symbol=(next1.summary&&next1.summary.symbol_code)||'', precip=Number(next1.details&&next1.details.precipitation_amount||0);
    var rn=isFinite(precip)?precip:0, cloudPct=Number(instant.cloud_area_fraction), caTot=isFinite(cloudPct)?Math.round((Math.max(0,Math.min(100,cloudPct))/100)*10):null;
    var ta=Number(instant.air_temperature), s=String(symbol).toLowerCase(), ww='';
    if(s.indexOf('thunder')>=0) ww='천둥번개';
    else if(s.indexOf('snow')>=0||s.indexOf('sleet')>=0) ww='눈';
    else if(s.indexOf('rain')>=0||s.indexOf('drizzle')>=0||rn>0) ww='비';
    else if(s.indexOf('fog')>=0) ww='안개';
    var d=new Date(chosen.time), parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d).reduce(function(acc,p){ acc[p.type]=p.value; return acc; },{});
    return {tm:parts.year+'-'+parts.month+'-'+parts.day+' '+parts.hour+':'+parts.minute+' KST',station:'벼락밭',ta:isFinite(ta)?ta:null,rn:rn,sdTot:ww==='눈'?Math.max(0.1,rn):0,ww:ww,caTot:caTot,source:'metno'};
  });
}
function fetchWeather(){
  var endpoint=CONFIG.weather.endpoint; if(weatherBusy) return Promise.resolve(false);
  weatherBusy=true;
  var req=endpoint?fetch(endpoint,{cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('weather'); return r.json(); }).catch(function(){ return fetchMetNoDirect(); }):fetchMetNoDirect();
  return req.then(function(j){ liveW=weatherFromMetNo(j); applyWeather(); hud(); return true; }).catch(function(){ if(!liveW){ document.body.dataset.weather='unknown'; applyWeather(); hud(); } return false; }).then(function(ok){ weatherBusy=false; return ok; });
}
function applyWeather(){
  var w=weather(); document.body.dataset.weather=w.kind;
  var old=$('sun'); if(old) old.remove();
  if(w.kind==='clear'){
    var s=el('div',null,w.day?'<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"><circle cx="50" cy="50" r="20" fill="#fff"/><path d="M50 8v13M50 79v13M8 50h13M79 50h13M20 20l9 9M71 71l9 9M80 20l-9 9M29 71l-9 9"/></g></svg>':'<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M66 14C40 14 22 34 22 56s22 38 48 30C50 78 40 62 42 46c2-14 12-26 24-32z" fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round"/><path d="M78 40v8M74 44h8M84 62v6M81 65h6" stroke="#000" stroke-width="3" stroke-linecap="round"/></svg>');
    s.id='sun'; world.insertBefore(s,world.firstChild);
  }
  poseKeepers(); setFx(w.kind==='storm'?'rain':w.kind);
}
function sizeFx(){ fx.width=innerWidth; fx.height=innerHeight; }
function setFx(kind){
  if(kind!=='rain'&&kind!=='snow'){ fxOn=''; fxCtx.clearRect(0,0,fx.width,fx.height); return; }
  if(fxOn===kind) return; var was=fxOn; fxOn=kind; sizeFx();
  var n=kind==='rain'?Math.min(160,innerWidth/5):Math.min(90,innerWidth/10);
  fxParts=[]; for(var i=0;i<n;i++) fxParts.push({x:Math.random()*fx.width,y:Math.random()*fx.height,v:.7+Math.random()*.6,r:1.5+Math.random()*2.5,p:Math.random()*6});
  if(RM){ drawFx(0); return; }
  if(!was) requestAnimationFrame(loopFx);
}
var lastFx=0;
function loopFx(t){ if(!fxOn) return; if(!document.hidden&&document.body.dataset.page==='scene') drawFx(Math.min(40,t-lastFx)); lastFx=t; requestAnimationFrame(loopFx); }
function drawFx(dt){
  var c=fxCtx, H=fx.height-90, W=fx.width; c.clearRect(0,0,W,fx.height);
  if(fxOn==='rain'){ c.strokeStyle='rgba(0,0,0,.42)'; c.lineWidth=1.6; c.lineCap='round'; c.beginPath(); fxParts.forEach(function(p){ p.y+=p.v*dt*.95; p.x-=p.v*dt*.14; if(p.y>H){ p.y=-20; p.x=Math.random()*(W+80); } c.moveTo(p.x,p.y); c.lineTo(p.x-3,p.y+17*p.v); }); c.stroke(); }
  else { c.fillStyle='#fff'; c.strokeStyle='rgba(0,0,0,.6)'; c.lineWidth=1; fxParts.forEach(function(p){ p.y+=p.v*dt*.09; p.p+=dt*.0016; var x=p.x+Math.sin(p.p)*14; if(p.y>H){ p.y=-10; p.x=Math.random()*W; } c.beginPath(); c.arc(x,p.y,p.r,0,6.3); c.fill(); c.stroke(); }); }
}
function openWeather(){
  var w=weather();
  openSheet('날씨');
  var choices=el('div','weather-choices');
  [['clear','☀','맑음'],['cloudy','☁','흐림'],['rain','☂','비'],['snow','❄','눈'],['fog','≋','안개']].forEach(function(it){ var b=el('button','weather-choice','<span aria-hidden="true">'+it[1]+'</span>'+it[2]); b.setAttribute('aria-pressed',w.kind===it[0]); b.onclick=function(){ liveW={kind:it[0],day:true,label:it[2],temp:null,manual:true,realtime:false,at:Date.now()}; applyWeather(); hud(); openWeather(); }; choices.appendChild(b); });
  sheet.appendChild(choices);
  if(liveW&&liveW.observedAt) sheet.appendChild(txt('p','sub','관측 시각 '+formatObservedAt(liveW.observedAt)+' (서귀포 보성리)'));
  var a=actions(); a.classList.add('weatherActs');
  var src=el('span','weatherSource','기상 자료: <a href="https://www.met.no/" target="_blank" rel="noopener">MET Norway</a>');
  var realtime=ghostBtn('실시간',function(){
    realtime.disabled=true; realtime.textContent='불러오는 중';
    fetchWeather().then(function(ok){ if(!ok) toast('실시간 날씨를 불러오지 못했어요.'); openWeather(); });
  });
  realtime.classList.add('weather-live'); realtime.setAttribute('aria-pressed',!w.manual&&w.kind!=='unknown');
  var refresh=bigBtn(weatherBusy?'불러오는 중':'날씨 새로고침',function(){ refresh.disabled=true; refresh.textContent='불러오는 중'; fetchWeather().then(function(){ openWeather(); }); }); refresh.disabled=weatherBusy||!CONFIG.weather.endpoint;
  a.append(src,realtime,refresh);
}

/* ---------- 지도 ---------- */
var allTrees=[], mapForest=null;
var MAP_GROVES=[
  {num:'12',box:[58.633,82.413,30.387,15.746]},
  {num:'09',box:[22.099,62.523,29.42,14.365]},
  {num:'03',box:[69.268,2.855,26.865,18.14]},
  {num:'07',box:[27.348,42.726,26.727,17.311]},
  {num:'11',box:[19.337,82.689,31.492,16.022]},
  {num:'10',box:[62.017,62.983,28.867,13.812]},
  {num:'08',box:[62.362,42.265,27.21,17.403]},
  {num:'06',box:[69.82,22.744,24.033,17.864]},
  {num:'02',box:[43.854,3.959,20.994,17.495]},
  {num:'01',box:[18.025,2.855,25.622,19.153]},
  {num:'04',box:[16.506,24.033,25,17.311]},
  {num:'05',box:[43.094,24.309,21.202,17.68]}
];
function setupMap(){
  var map=$('map'), decor=el('div'); decor.id='mapDecorLayer'; decor.setAttribute('aria-hidden','true');
  decor.innerHTML='<img class="mapLayerImg" src="./assets/litttl-farm-map/02-roads.svg" alt="">';
  var forests=el('div'); forests.id='forestLayer';
  var fg=el('div'); fg.id='mapForegroundLayer'; fg.setAttribute('aria-hidden','true');
  fg.innerHTML='<img class="mapLayerImg" src="./assets/litttl-farm-map/foreground.svg" alt="">';
  var trees=el('div'); trees.id='treeLayer';
  F.forEach(function(f,i){
    var g=MAP_GROVES[i], label=el('button','forestCard');
    label.id='h'+i;
    label.style.cssText='left:'+g.box[0]+'%;top:'+g.box[1]+'%;width:'+g.box[2]+'%;height:'+g.box[3]+'%';
    label.setAttribute('aria-label',f[0]+' · '+f[5]+'그루');
    var img=document.createElement('img'); img.className='forestImage'; img.src='./assets/litttl-farm-map/groves/grove-'+g.num+'.svg'; img.alt=''; img.setAttribute('aria-hidden','true');
    label.append(img,txt('span','forestName',f[0]));
    label.onclick=function(){ location.hash='map-'+i; };
    forests.appendChild(label);
  });
  map.append(decor,forests,fg,trees);
  findForm($('mapFind'),$('mapNote'));
}
function renderForestTrees(i){
  var layer=$('treeLayer'); layer.innerHTML=''; if(i==null) return;
  var f=F[i];
  for(var n=1;n<=f[5];n++)(function(n){
    var variant=((n-1+i)%5)+1;
    var b=el('button','mapTree','<img class="treeArt" src="./assets/litttl-farm-map/trees/tree-0'+variant+'.svg" alt="" draggable="false" aria-hidden="true"><span class="fruitDots" aria-hidden="true"></span><span class="treeNumber">'+n+'</span><span class="treeTip"></span>');
    b.dataset.f=i; b.dataset.n=n; b.dataset.id=i+'-'+n;
    b.onclick=function(){ openMapTree(i,n); }; layer.appendChild(b);
  })(n);
  layoutForestTrees();
}
function layoutForestTrees(){
  var layer=$('treeLayer'); if(mapForest==null||!F[mapForest]||!layer) return;
  var box=$('mapBox'), vw=innerWidth||1024;
  var w=vw<=700?72:(vw<=900?78:82), gap=vw<=700?10:(vw<=900?14:16), pad=vw<=700?28:(vw<=900?40:56);
  var boxW=(box&&box.clientWidth>0)?box.clientWidth:Math.max(300,Math.min(vw-32,1216));
  var usable=Math.max(w*3+gap*2,boxW-pad);
  var cols=Math.max(3,Math.min(12,Math.floor((usable+gap)/(w+gap))));
  var count=F[mapForest][5], rows=Math.ceil(count/cols);
  layer.style.setProperty('--tree-cols',cols); layer.style.setProperty('--tree-rows',rows);
  var nodes=layer.querySelectorAll('.mapTree');
  for(var k=0;k<nodes.length;k++){
    var r=Math.floor(k/cols), c=k%cols, variant=((r*2+c+mapForest)%5)+1;
    var img=nodes[k].querySelector('.treeArt');
    if(img) img.setAttribute('src','./assets/litttl-farm-map/trees/tree-0'+variant+'.svg');
  }
}
var treesCache={list:null,at:0,inflight:null}, TREES_CACHE_TTL=45000;
function invalidateTreesCache(){ treesCache={list:null,at:0,inflight:null}; }
function listTreesCached(force){
  var now=Date.now();
  if(!force&&treesCache.list&&now-treesCache.at<TREES_CACHE_TTL) return Promise.resolve(treesCache.list);
  if(!force&&treesCache.inflight) return treesCache.inflight;
  var p=B.listTrees().then(function(l){
    treesCache.list=l||[]; treesCache.at=Date.now(); treesCache.inflight=null;
    return treesCache.list;
  },function(err){
    treesCache.inflight=null;
    throw err;
  });
  treesCache.inflight=p;
  return p;
}
function refreshPins(force){ return listTreesCached(force).then(function(l){ allTrees=l||[]; drawPins(); }).catch(function(err){ if($('mapNote')) $('mapNote').textContent='나무 목록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'; throw err; }); }
function drawPins(){
  var mineId=myTreeId(), occupied={}, mineShown=false;
  allTrees.forEach(function(t){ occupied[t.id]=t; });
  $('map').querySelectorAll('.mapTree').forEach(function(d){
    var t=occupied[d.dataset.id], mine=!mineShown&&!!mineId&&d.dataset.id===mineId, name=t&&t.name?safe(t.name):F[+d.dataset.f][0]+' '+d.dataset.n+'번'; if(mine) mineShown=true;
    var state=mine?'내 나무':(t?'이웃 나무':'');
    d.classList.toggle('has',!!t); d.classList.toggle('mine',mine);
    var spot=F[+d.dataset.f][0]+' '+d.dataset.n+'번'; d.setAttribute('aria-label',spot+(state?' · '+state:'')); d.title=''; d.querySelector('.treeTip').textContent=spot;
  });
}
function positionMap(){
  var map=$('map'), box=$('mapBox'); if(!map) return; map.classList.toggle('zoomed',mapForest!=null); box.classList.toggle('zoomed',mapForest!=null); $('overviewBtn').hidden=mapForest==null; if(mapForest!=null){ box.scrollLeft=0; box.scrollTop=0; } layoutForestTrees();
}
function renderMap(i){
  document.body.dataset.page='map'; $('scene').hidden=true; $('mapPage').hidden=false; window.scrollTo(0,0);
  if($('mapNote')) $('mapNote').textContent='';
  mapForest=(i==null?null:i);
  renderForestTrees(mapForest); positionMap();
  $('mapTools').classList.toggle('zoomed',i!=null);
  if($('mapFarmLabel')) $('mapFarmLabel').textContent=(i!=null&&F[i])?('벼락밭 · '+F[i][0]):'벼락밭';
  hud();
  refreshPins();
}
function goTree(f,n){ var id=f+'-'+n, h=(id===myTreeId())?'':'tree-'+f+'-'+n; if(location.hash.slice(1)===h) route(); else location.hash=h; }
function goTreeRecord(t){
  var unmapped=t.virtual||String(t.id||'').indexOf('virtual-')===0||!F[+t.f]||+t.n<1||+t.n>F[+t.f][5];
  if(unmapped){ var h=t.id===myTreeId()?'':'treev-'+t.id; if(location.hash.slice(1)===h) route(); else location.hash=h; }
  else goTree(t.f,t.n);
}

/* ---------- 화면 이동 ---------- */
var navStack=[], navBack=false;
function goBack(){
  var cur=location.hash.slice(1);
  if(navStack.length>1){
    navStack.pop();
    var prev=navStack[navStack.length-1];
    navBack=true;
    if(location.hash.slice(1)===prev) route();
    else location.hash=prev;
    return;
  }
  if(/^map-\d+$/.test(cur)) location.hash='map';
  else if(cur==='map'||cur==='home'||/^tree/.test(cur)) location.hash='';
  else location.hash='home';
}
function route(){
  if(sheet.open) sheet.close();
  var h=location.hash.slice(1), m; landing=false;
  if(navBack) navBack=false;
  else if(!navStack.length||navStack[navStack.length-1]!==h){
    navStack.push(h);
    if(navStack.length>30) navStack.shift();
  }
  if(h==='home'){ landing=true; openEmpty(); return; }
  if(h==='map'){ renderMap(null); return; }
  if((m=h.match(/^map-(\d+)$/))&&F[+m[1]]){ renderMap(+m[1]); return; }
  if((m=h.match(/^tree[-\/](\d+)[-\/](\d+)$/))&&F[+m[1]]&&+m[2]>=1&&+m[2]<=F[+m[1]][5]){ openTree(m[1]+'-'+m[2],+m[1],+m[2]); return; }
  if((m=h.match(/^treev-(.+)$/))){ openTree(m[1],0,999); return; }
  var id=myTreeId();
  if(id){ if(id.indexOf('virtual-')===0) openTree(id,0,999); else { var p=id.split('-'); openTree(id,+p[0],+p[1]); } } else openEmpty();
}
function horizon(){
  var box=$('horizon'), wide=innerWidth>=700, spec=wide?[[2,170],[15,104],[87,180]]:[[-16,150],[80,150]];
  box.innerHTML=spec.map(function(s,i){
    var r=rng(i*7+5), b=[[60,60,44],[32,70,30],[88,70,30]], dots='';
    for(var k=0;k<4;k++){ var a=r()*6.28,d=r()*36; dots+='<circle cx="'+(60+Math.cos(a)*d*1.2).toFixed(0)+'" cy="'+(62+Math.sin(a)*d*.8).toFixed(0)+'" r="5" fill="var(--tangerine)"/>'; }
    return '<svg viewBox="0 0 120 140" style="left:'+s[0]+'%;width:'+s[1]+'px"><path d="M50 138c5-22 6-36 2-58l-10-14 7-4 11 14 10-14 7 4-11 16c-3 22-2 38 4 56z" fill="#fff" stroke="#000" stroke-width="3.2" stroke-linejoin="round"/><g filter="url(#paint)" fill="#a9a9a9">'+b.map(function(c){ return '<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'"/>'; }).join('')+'</g>'+dots+'</svg>';
  }).join('');
}

/* ---------- 접속 표시 ---------- */
var beatId=null, beatTimer=null;
function startBeat(){
  stopBeat(); var id=myTreeId(); if(!id||!me) return;
  beatId=id; var go=function(){ if(!document.hidden) B.beat(id,me.uid).catch(function(){}); }; go(); beatTimer=setInterval(go,45000);
}
function stopBeat(){ clearInterval(beatTimer); if(beatId&&me) B.leave(beatId,me.uid).catch(function(){}); beatId=null; }
window.addEventListener('pagehide',function(){ if(beatId&&me) B.leave(beatId,me.uid).catch(function(){}); });

/* ---------- 시작 ---------- */
function afterAuth(u){
  var ticket=++authTicket, isNewUser=false;
  clearTimeout(authPopupTimer);
  resetSettingsTapState();
  authResolved=false;
  me=u;
  if(!u){ authSessionTrackedUid=null; clearNotifWatchers(); }
  var ready=u?B.getUser(u.uid).then(function(d){
    if(d){ meDoc=d; return; }
    isNewUser=true;
    var nick=((u.displayName||'').trim().replace(/\s+/g,' ').slice(0,12))||'회원';
    meDoc={nick:nick,email:u.email||'',treeId:null,invites:{},lastCloudAt:0,tutorialSeen:false};
    return B.setUser(u.uid,meDoc).catch(function(){});
  }):Promise.resolve(meDoc=null);
  ready.then(function(){
    if(ticket!==authTicket) return;
    if(!me){ authResolved=true; stopBeat(); curKey=null; route(); openRequestedReview(); return; }
    var chk=meDoc.treeId?B.getTree(meDoc.treeId).then(function(t){ if(ticket!==authTicket) return; if(!t||(t.members||[]).indexOf(me.uid)<0) return setMyTree(null); meDoc.treeCache={f:t.f,n:t.n,name:t.name}; }):Promise.resolve();
    chk.then(function(){
      if(ticket!==authTicket) return;
      authResolved=true;
      if(authSessionTrackedUid!==me.uid){
        authSessionTrackedUid=me.uid;
        trackEvent(isNewUser?'sign_up':'login',{method:'google'});
      }
      startAuthNotifWatchers();
      var first=pendingTutorial||(meDoc&&!meDoc.tutorialSeen&&!myTreeId()); pendingTutorial=false;
      if(sheet.open&&sheet.classList.contains('authSheet')) sheet.close();
      curKey=null; startBeat(); route(); openRequestedReview();
      if(!myTreeId()){
        authPopupTimer=setTimeout(function(){
          if(ticket!==authTicket||!me||myTreeId()||sheet.open) return;
          if(first){
            openTutorial(true,function(){ if(ticket===authTicket&&me&&!myTreeId()&&!sheet.open) openTreeChoice(); });
          } else openTreeChoice();
        },180);
      } else if(first){
        authPopupTimer=setTimeout(function(){ if(ticket===authTicket&&me&&!sheet.open) openTutorial(true); },180);
      }
    }).catch(function(){
      if(ticket!==authTicket) return;
      authResolved=true; startAuthNotifWatchers(); curKey=null; route();
    });
  }).catch(function(){
    if(ticket!==authTicket) return;
    authResolved=true; clearNotifWatchers(); curKey=null; route();
  });
}
var reviewOpened=false;
function openRequestedReview(){
  if(reviewOpened) return; var s=new URLSearchParams(location.search).get('screen'); if(!s||(me&&(s==='signup'||s==='login'))) return; reviewOpened=true;
  setTimeout(function(){ if(s==='signup') openAuth('signup'); else if(s==='login') openAuth('login'); else if(s==='weather') openWeather(); },120);
}
function updateNetBanner(){
  var nb=$('netBanner'); if(!nb) return;
  var off=navigator.onLine===false;
  nb.hidden=!off;
  nb.textContent=off?'인터넷 연결이 끊어졌어요. 연결되면 자동으로 다시 불러올게요.':'';
}
function boot(backend){
  B=backend; horizon(); setupMap(); setupLinkClouds();
  if(world) world.tabIndex=-1;
  updateNetBanner();
  window.addEventListener('offline',updateNetBanner);
  window.addEventListener('online',function(){
    updateNetBanner();
    invalidateTreesCache();
    toast('인터넷에 다시 연결되었어요.');
    if(!liveW||!liveW.manual) fetchWeather();
    if(document.body.dataset.page==='map') refreshPins(true).catch(function(){});
    else if(treeLoadError&&view){ curKey=null; openTree(view.id,view.f,view.n); }
  });
  $('back').onclick=goBack;
  $('mapBackBtn').onclick=goBack;
  var home=function(){ if(location.hash==='#home') route(); else location.hash='home'; };
  $('homeLogo').onclick=home; $('mapLogo').onclick=home;
  $('login').onclick=function(){ openAuth('login'); };
  if($('mapLogin')) $('mapLogin').onclick=function(){ openAuth('login'); };
  if($('adminBtn')) $('adminBtn').onclick=openAdminMenu;
  if($('mapAdminBtn')) $('mapAdminBtn').onclick=openAdminMenu;
  if($('notifBtn')) $('notifBtn').onclick=openNotifications;
  if($('mapNotifBtn')) $('mapNotifBtn').onclick=openNotifications;
  $('help').onclick=function(){ openTutorial(false); };
  $('mapHelp').onclick=function(){ openTutorial(false); };
  $('mapCodeBtn').onclick=openPhysicalTreeCode;
  if($('mapMembershipBtn')) $('mapMembershipBtn').onclick=openMembershipInfo;
  $('menu').onclick=openMenu;
  if($('mapMenu')) $('mapMenu').onclick=openMenu;
  $('place').onclick=openWeather;
  $('hearts').onclick=openCheer;
  $('overviewBtn').onclick=function(){ location.hash='map'; };
  $('randomBtn').onclick=function(){
    refreshPins(true).then(function(){
      var mine=myTreeId(), pool=allTrees.filter(function(t){ return t&&t.id!==mine&&t.ownerUid; });
      if(!pool.length){
        if($('mapNote')) $('mapNote').textContent='아직 구경할 이웃 나무가 없어요.';
        toast('아직 구경할 이웃 나무가 없어요.');
        return;
      }
      if($('mapNote')) $('mapNote').textContent='';
      goTreeRecord(pool[Math.floor(Math.random()*pool.length)]);
    }).catch(function(){
      if($('mapNote')) $('mapNote').textContent='이웃 나무 목록을 불러오지 못했어요.';
      toast('이웃 나무 목록을 불러오지 못했어요.');
    });
  };
  document.querySelectorAll('[data-legal]').forEach(function(a){ a.onclick=function(e){ e.preventDefault(); a.dataset.legal==='terms'?openTerms():openPrivacy(); }; });
  if($('analyticsPrefBtn')) $('analyticsPrefBtn').onclick=openAnalyticsSettings;
  if(getAnalyticsConsent()==='granted'&&B.setAnalyticsConsent) B.setAnalyticsConsent(true).catch(function(){});
  renderConsentBanner();
  window.addEventListener('hashchange',route);
  B.onAuth(afterAuth);
  B.watchClouds(onClouds);
  if(new URLSearchParams(location.search).get('review')!=='1'){
    fetchWeather();
    setInterval(function(){ if(!liveW||!liveW.manual) fetchWeather(); },15*60*1000);
  }
  setInterval(skyTick,1000);
  setInterval(function(){
    if(!T||busy) return;
    if(isMine()){ var ch=catchUp(); if(ch.length){ persist(ch); softUpdate(); } }
    renderKeepers();
  },5000);
  if(typeof ResizeObserver!=='undefined'){
    var ro=new ResizeObserver(function(){ if(!view) positionLandingFooter(); });
    ro.observe(world);
    if($('siteFooter')) ro.observe($('siteFooter'));
  }
  window.addEventListener('load',positionLandingFooter);
  addEventListener('resize',function(){ if(fxOn) sizeFx(); if(document.body.dataset.page==='map') positionMap(); positionLandingFooter(); });
  window.addEventListener('error',function(ev){
    var msg=String((ev&&ev.message)||'');
    if(!msg||msg.indexOf('ResizeObserver')>=0) return;
    var errObj=(ev&&ev.error)||msg;
    var now=Date.now(), canOpen=now-lastAutoTroubleshootAt>3000&&(!sheet.open||!sheet.classList.contains('troubleshootSheet'));
    if(canOpen) lastAutoTroubleshootAt=now;
    recordError('예상하지 못한 오류가 발생했어요',errObj,(ev&&ev.filename?ev.filename+(ev.lineno?':'+ev.lineno:''):'앱 실행'),{autoOpen:canOpen});
  });
  window.addEventListener('unhandledrejection',function(ev){
    var reason=ev&&ev.reason;
    var msg=String((reason&&reason.message)||reason||'');
    if(!msg||msg.indexOf('ResizeObserver')>=0) return;
    var now=Date.now(), canOpen=now-lastAutoTroubleshootAt>3000&&(!sheet.open||!sheet.classList.contains('troubleshootSheet'));
    if(canOpen) lastAutoTroubleshootAt=now;
    recordError('요청 처리 중 오류가 발생했어요',reason,'비동기 작업',{autoOpen:canOpen});
  });
}
document.addEventListener('DOMContentLoaded',function(){
  var c=CONFIG.firebase;
  if(c.apiKey&&c.projectId){
    LiveBackend().then(boot).catch(function(){ boot(DemoBackend()); });
  } else boot(DemoBackend());
});
})();
