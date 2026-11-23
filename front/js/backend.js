/* ---------- 저장과 공유 ----------
   Demo: 이 기기 안에서만 저장 (Firebase 설정이 비어 있을 때)
   Live: Firebase에 저장해서 모든 회원이 함께 봄
   화면 코드는 두 방식을 똑같이 사용합니다. */
function DemoBackend(){
  var KEY='littlLocalV1', CONSENT_KEY='litttlAnalyticsConsent', db=null, subs=[], authCb=null, session=null, analyticsEvents=[];
  function hasAnalyticsConsent(){ try{ return localStorage.getItem(CONSENT_KEY)==='granted'; }catch(e){ return false; } }
  function read(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function seed(){ return {accounts:{},users:{},trees:{},messages:{},clouds:[],invites:{},presence:{},diaries:{},exampleVersion:2}; }
  db=read(KEY,null)||seed();
  db.diaries=db.diaries||{};
  db.exampleVersion=2;
  function clone(x){ return x==null?null:JSON.parse(JSON.stringify(x)); }
  function fire(){ subs.forEach(function(s){ s(); }); }
  function commit(){ write(KEY,db); setTimeout(fire,0); }
  window.addEventListener('storage',function(e){ if(e.key===KEY){ db=read(KEY,db); fire(); } });
  function sub(fn){ var f=function(){ fn(); }; subs.push(f); setTimeout(f,0); return function(){ subs=subs.filter(function(x){ return x!==f; }); }; }
  function err(code){ var e=new Error(code); e.code=code; return e; }
  function login(u){ session=u; write('littlDemoSession',u); if(authCb) setTimeout(function(){ authCb(u); },0); return u; }
  return {
    mode:'local',
    onAuth:function(cb){ authCb=cb; session=read('littlDemoSession',null); setTimeout(function(){ cb(session); },0); },
    signInWithGoogle:function(){
      var uid='u_google_demo', email='google-demo@litttl.farm', nick='귤나무지기';
      if(!db.users[uid]) db.users[uid]={nick:nick,email:email,treeId:null,invites:{},lastCloudAt:0,tutorialSeen:false};
      commit();
      return Promise.resolve(login({uid:uid,email:email,displayName:nick}));
    },
    signOut:function(){ session=null; try{ localStorage.removeItem('littlDemoSession'); }catch(e){} if(authCb) setTimeout(function(){ authCb(null); },0); return Promise.resolve(); },
    getUser:function(uid){ return Promise.resolve(clone(db.users[uid])); },
    setUser:function(uid,p){ db.users[uid]=Object.assign(db.users[uid]||{},clone(p)); commit(); return Promise.resolve(); },
    watchTree:function(id,cb){ return sub(function(){ cb(clone(db.trees[id])); }); },
    createTree:function(id,d){ if(db.trees[id]) return Promise.reject(err('tree/taken')); db.trees[id]=clone(d); commit(); return Promise.resolve(); },
    updateTree:function(id,p){ if(db.trees[id]){ Object.assign(db.trees[id],clone(p)); commit(); } return Promise.resolve(); },
    removeTreeFields:function(id,fields){ if(db.trees[id]){ fields.forEach(function(k){ delete db.trees[id][k]; }); commit(); } return Promise.resolve(); },
    listTrees:function(){ return Promise.resolve(Object.keys(db.trees).map(function(k){ return clone(db.trees[k]); })); },
    heart:function(id,uid,day){ var k='h_'+uid+'_'+day; var t=db.trees[id]; t.heartLog=t.heartLog||{}; if(t.heartLog[k]) return Promise.reject(err('heart/already')); t.heartLog[k]=1; t.hearts=(t.hearts||0)+1; commit(); return Promise.resolve(); },
    hearted:function(id,uid,day){ var t=db.trees[id]; return Promise.resolve(!!(t&&t.heartLog&&t.heartLog['h_'+uid+'_'+day])); },
    watchMessages:function(id,cb){ return sub(function(){ cb(clone((db.messages[id]||[]).slice().sort(function(a,b){ return b.ts-a.ts; }).slice(0,40))); }); },
    listMessages:function(id){ return Promise.resolve(clone(db.messages[id]||[])); },
    addMessage:function(id,m){ m=clone(m); m.id='m'+Date.now()+Math.random().toString(36).slice(2,6); (db.messages[id]=db.messages[id]||[]).push(m); commit(); return Promise.resolve(); },
    deleteMessage:function(id,mid){ db.messages[id]=(db.messages[id]||[]).filter(function(m){ return m.id!==mid; }); commit(); return Promise.resolve(); },
    watchClouds:function(cb){ return sub(function(){ var now=Date.now(), cutoff=now-24*60*60*1000, prev=db.clouds||[], kept=prev.filter(function(c){ return c.evergreen||c.ts>cutoff; }); if(kept.length!==prev.length){ db.clouds=kept; write(KEY,db); } cb(clone(kept.map(function(c){ var x=clone(c); if(x.evergreen) x.ts=now; return x; }).sort(function(a,b){ return b.ts-a.ts; }).slice(0,80))); }); },
    addCloud:function(c){ var u=db.users[c.uid], now=Date.now(), adminUser=u&&u.email==='yangdk02@gmail.com'; if(u&&!adminUser&&now-(u.lastCloudAt||0)<24*60*60*1000) return Promise.reject(err('cloud/cooldown')); c=clone(c); c.id='c'+now+Math.random().toString(36).slice(2,6); var cutoff=now-24*60*60*1000; db.clouds=(db.clouds||[]).filter(function(x){ return x.evergreen||x.ts>cutoff; }); db.clouds.push(c); if(u) u.lastCloudAt=now; commit(); return Promise.resolve(clone(c)); },
    deleteCloud:function(id){ db.clouds=(db.clouds||[]).filter(function(c){ return c.id!==id; }); commit(); return Promise.resolve(); },
    createInvite:function(code,d){ db.invites[code]=clone(d); commit(); return Promise.resolve(); },
    getInvite:function(code){ return Promise.resolve(clone(db.invites[code])); },
    deleteInvite:function(code){ delete db.invites[code]; commit(); return Promise.resolve(); },
    getTree:function(id){ return Promise.resolve(clone(db.trees[id])); },
    joinTree:function(id,p){ Object.assign(db.trees[id],clone(p)); commit(); return Promise.resolve(); },
    detachTree:function(id,uid){ var t=db.trees[id]; if(!t) return Promise.resolve(); var members=(t.members||[]).filter(function(x){ return x!==uid; }), chars=(t.chars||[]).filter(function(x){ return x.uid!==uid; }); if(t.ownerUid===uid&&!members.length){ delete db.trees[id]; delete db.messages[id]; delete db.diaries[id]; delete db.presence[id]; db.clouds=(db.clouds||[]).filter(function(c){ return c.treeId!==id; }); Object.keys(db.invites||{}).forEach(function(code){ if(db.invites[code].treeId===id) delete db.invites[code]; }); } else { t.members=members; t.chars=chars; if(t.ownerUid===uid) t.ownerUid=members[0]; } commit(); return Promise.resolve(); },
    beat:function(id,uid){ (db.presence[id]=db.presence[id]||{})[uid]=Date.now(); commit(); return Promise.resolve(); },
    leave:function(id,uid){ if(db.presence[id]) delete db.presence[id][uid]; commit(); return Promise.resolve(); },
    watchPresence:function(id,cb){ return sub(function(){ cb(clone(db.presence[id]||{})); }); },
    listDiary:function(id){ var d=db.diaries[id]||{}; return Promise.resolve(Object.keys(d).map(function(k){ return Object.assign({docId:k,date:k},clone(d[k])); })); },
    saveDiary:function(id,date,entry){ db.diaries[id]=db.diaries[id]||{}; if(entry) db.diaries[id][date]=clone(entry); else delete db.diaries[id][date]; commit(); return Promise.resolve(); },
    deleteAccount:function(){
      if(!session) return Promise.reject(err('auth/requires-recent-login'));
      var uid=session.uid, user=db.users[uid]||{}, tree=user.treeId&&db.trees[user.treeId];
      if(tree){
        tree.members=(tree.members||[]).filter(function(x){ return x!==uid; });
        tree.chars=(tree.chars||[]).filter(function(x){ return x.uid!==uid; });
        if(tree.ownerUid===uid){ if(tree.members.length) tree.ownerUid=tree.members[0]; else { var oldTreeId=user.treeId; delete db.trees[oldTreeId]; delete db.messages[oldTreeId]; delete db.diaries[oldTreeId]; delete db.presence[oldTreeId]; db.clouds=(db.clouds||[]).filter(function(c){ return c.treeId!==oldTreeId; }); Object.keys(db.invites||{}).forEach(function(code){ if(db.invites[code].treeId===oldTreeId) delete db.invites[code]; }); } }
      }
      Object.keys(db.messages).forEach(function(id){ db.messages[id]=(db.messages[id]||[]).filter(function(m){ return m.uid!==uid; }); });
      db.clouds=(db.clouds||[]).filter(function(c){ return c.uid!==uid; });
      Object.keys(db.invites).forEach(function(code){ if(db.invites[code].ownerUid===uid) delete db.invites[code]; });
      delete db.users[uid]; session=null; try{ localStorage.removeItem('littlDemoSession'); localStorage.removeItem('littlMine'); }catch(e){} commit(); if(authCb) setTimeout(function(){ authCb(null); },0); return Promise.resolve();
    },
    setAnalyticsConsent:function(granted){
      try{ localStorage.setItem(CONSENT_KEY,granted?'granted':'denied'); }catch(e){}
      return Promise.resolve(!!granted);
    },
    trackEvent:function(name,params){
      if(!hasAnalyticsConsent()) return false;
      analyticsEvents.push({name:String(name||''),params:clone(params||{}),ts:Date.now()});
      return true;
    },
    getAnalyticsEvents:function(){ return clone(analyticsEvents); },
    adminListUsers:function(){
      return Promise.resolve(Object.keys(db.users||{}).map(function(uid){
        return Object.assign({uid:uid},clone(db.users[uid]));
      }));
    },
    adminCleanupUser:function(uid){
      if(!uid) return Promise.reject(err('admin/invalid-uid'));
      if(session&&session.uid===uid) return Promise.reject(err('admin/self-delete'));
      var user=db.users[uid]||{}, treeIds=[];
      if(user.treeId&&db.trees[user.treeId]) treeIds.push(user.treeId);
      Object.keys(db.trees||{}).forEach(function(tid){
        var t=db.trees[tid];
        if(t&&treeIds.indexOf(tid)<0&&((t.members||[]).indexOf(uid)>=0||t.ownerUid===uid)) treeIds.push(tid);
      });
      var deletedTrees=0;
      treeIds.forEach(function(tid){
        var t=db.trees[tid]; if(!t) return;
        var members=(t.members||[]).filter(function(x){ return x!==uid; });
        var chars=(t.chars||[]).filter(function(x){ return x.uid!==uid; });
        if(db.messages[tid]) db.messages[tid]=db.messages[tid].filter(function(m){ return m.uid!==uid; });
        if(db.diaries[tid]) Object.keys(db.diaries[tid]).forEach(function(k){ if(db.diaries[tid][k]&&db.diaries[tid][k].uid===uid) delete db.diaries[tid][k]; });
        if(db.presence[tid]) delete db.presence[tid][uid];
        if(t.heartLog) Object.keys(t.heartLog).forEach(function(k){ if(k.indexOf('h_'+uid+'_')===0) delete t.heartLog[k]; });
        if((t.ownerUid===uid||!members.length)&&!members.length){
          deletedTrees+=1;
          delete db.trees[tid]; delete db.messages[tid]; delete db.diaries[tid]; delete db.presence[tid];
          db.clouds=(db.clouds||[]).filter(function(c){ return c.treeId!==tid; });
          Object.keys(db.invites||{}).forEach(function(code){ if(db.invites[code].treeId===tid) delete db.invites[code]; });
        } else {
          t.members=members; t.chars=chars;
          if(t.ownerUid===uid) t.ownerUid=members[0];
          if(t.lastAct&&t.lastAct.uid===uid) t.lastAct=null;
        }
      });
      Object.keys(db.messages||{}).forEach(function(id){ db.messages[id]=(db.messages[id]||[]).filter(function(m){ return m.uid!==uid; }); });
      db.clouds=(db.clouds||[]).filter(function(c){ return c.uid!==uid; });
      Object.keys(db.invites||{}).forEach(function(code){ if(db.invites[code].ownerUid===uid) delete db.invites[code]; });
      delete db.users[uid];
      commit();
      return Promise.resolve({ok:true,deletedTrees:deletedTrees});
    },
    adminDeleteTree:function(treeId){
      if(!treeId) return Promise.reject(err('admin/invalid-tree'));
      var clearedUsers=0;
      Object.keys(db.users||{}).forEach(function(uid){
        if(db.users[uid]&&db.users[uid].treeId===treeId){ db.users[uid].treeId=null; clearedUsers+=1; }
      });
      delete db.trees[treeId]; delete db.messages[treeId]; delete db.diaries[treeId]; delete db.presence[treeId];
      db.clouds=(db.clouds||[]).filter(function(c){ return c.treeId!==treeId; });
      Object.keys(db.invites||{}).forEach(function(code){ if(db.invites[code].treeId===treeId) delete db.invites[code]; });
      commit();
      return Promise.resolve({ok:true,clearedUsers:clearedUsers});
    },
    resetDemo:function(){ db=seed(); analyticsEvents=[]; commit(); return this.signOut(); }
  };
}

function LiveBackend(){
  var V='10.14.1', base='https://www.gstatic.com/firebasejs/'+V+'/';
  var OperationType={ CREATE:'create', UPDATE:'update', DELETE:'delete', LIST:'list', GET:'get', WRITE:'write' };

  return Promise.all([
    import(base+'firebase-app.js'),
    import(base+'firebase-auth.js'),
    import(base+'firebase-firestore.js')
  ]).then(function(mods){
    var appMod=mods[0], authMod=mods[1], fsMod=mods[2];
    var app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(CONFIG.firebase);
    var auth=authMod.getAuth(app);
    var db=CONFIG.firebase.firestoreDatabaseId
      ? fsMod.getFirestore(app,CONFIG.firebase.firestoreDatabaseId)
      : fsMod.getFirestore(app);
    var googleProvider=new authMod.GoogleAuthProvider();
    googleProvider.setCustomParameters({prompt:'select_account'});

    function handleFirestoreError(error,operationType,path){
      var errInfo={
        error:error instanceof Error?error.message:String(error),
        authInfo:{
          userId:auth.currentUser&&auth.currentUser.uid,
          email:auth.currentUser&&auth.currentUser.email,
          emailVerified:auth.currentUser&&auth.currentUser.emailVerified,
          isAnonymous:auth.currentUser&&auth.currentUser.isAnonymous,
          tenantId:auth.currentUser&&auth.currentUser.tenantId,
          providerInfo:(auth.currentUser&&auth.currentUser.providerData||[]).map(function(p){
            return {providerId:p.providerId,email:p.email};
          })
        },
        operationType:operationType,
        path:path
      };
      console.error('Firestore Error: ',JSON.stringify(errInfo));
      throw new Error(JSON.stringify(errInfo));
    }

    function wrapFs(promise,operationType,path){
      return promise.catch(function(error){
        if(error&&error.code&&error.code!=='permission-denied'&&String(error.message||'').indexOf('insufficient permissions')<0){
          throw error;
        }
        handleFirestoreError(error,operationType,path);
      });
    }

    (function testConnection(){
      fsMod.getDocFromServer(fsMod.doc(db,'test','connection')).catch(function(error){
        if(error instanceof Error&&error.message.indexOf('the client is offline')>=0){
          console.error('Please check your Firebase configuration.');
        }
      });
    })();

    var treeRef=function(id){ return fsMod.doc(db,'trees',id); };
    function userRef(uid){ return fsMod.doc(db,'users',uid); }
    function ensureUserDoc(user){
      var ref=userRef(user.uid);
      return wrapFs(fsMod.getDoc(ref),OperationType.GET,'users/'+user.uid).then(function(snap){
        if(snap.exists()) return snap.data();
        var nick=((user.displayName||'').trim().replace(/\s+/g,' ').slice(0,12))||'회원';
        var profile={nick:nick,email:user.email||'',treeId:null,invites:{},lastCloudAt:0,tutorialSeen:false};
        return wrapFs(fsMod.setDoc(ref,profile),OperationType.CREATE,'users/'+user.uid).then(function(){ return profile; });
      });
    }

    function deleteDocs(q,path){
      return wrapFs(fsMod.getDocs(q),OperationType.LIST,path).then(function(snap){
        return Promise.all(snap.docs.map(function(d){
          return wrapFs(fsMod.deleteDoc(d.ref),OperationType.DELETE,d.ref.path);
        }));
      });
    }
    function deleteTreeDeep(ref,opts){
      var isAdminMode=!!(opts&&opts.isAdmin);
      var inviteQuery=isAdminMode
        ? deleteDocs(fsMod.query(fsMod.collection(db,'invites'),fsMod.where('treeId','==',ref.id)),'invites').catch(function(){})
        : (auth.currentUser
          ? deleteDocs(fsMod.query(fsMod.collection(db,'invites'),fsMod.where('treeId','==',ref.id),fsMod.where('ownerUid','==',auth.currentUser.uid)),'invites').catch(function(){})
          : Promise.resolve());
      var linked=[
        deleteDocs(fsMod.query(fsMod.collection(db,'clouds'),fsMod.where('treeId','==',ref.id)),'clouds'),
        inviteQuery
      ];
      return Promise.all(['hearts','messages','presence','diary'].map(function(name){
        return deleteDocs(fsMod.collection(db,'trees',ref.id,name),'trees/'+ref.id+'/'+name);
      }).concat(linked)).then(function(){
        return wrapFs(fsMod.deleteDoc(ref),OperationType.DELETE,ref.path);
      });
    }
    function cleanupUserInTree(uid,treeId,tree,opts){
      var tRef=treeRef(treeId);
      var members=(tree.members||[]).filter(function(x){ return x!==uid; });
      var chars=(tree.chars||[]).filter(function(x){ return x.uid!==uid; });
      var own=[
        deleteDocs(fsMod.query(fsMod.collection(db,'trees',treeId,'messages'),fsMod.where('uid','==',uid)),'trees/'+treeId+'/messages'),
        deleteDocs(fsMod.query(fsMod.collection(db,'trees',treeId,'hearts'),fsMod.where('uid','==',uid)),'trees/'+treeId+'/hearts'),
        deleteDocs(fsMod.query(fsMod.collection(db,'trees',treeId,'diary'),fsMod.where('uid','==',uid)),'trees/'+treeId+'/diary'),
        wrapFs(fsMod.deleteDoc(fsMod.doc(db,'trees',treeId,'presence',uid)),OperationType.DELETE,'trees/'+treeId+'/presence/'+uid).catch(function(){})
      ];
      return Promise.all(own).then(function(){
        if((tree.ownerUid===uid||!members.length)&&!members.length) return deleteTreeDeep(tRef,opts).then(function(){ return true; });
        var patch={members:members,chars:chars};
        if(tree.ownerUid===uid) patch.ownerUid=members[0];
        if(tree.lastAct&&tree.lastAct.uid===uid) patch.lastAct=null;
        return wrapFs(fsMod.updateDoc(tRef,patch),OperationType.UPDATE,'trees/'+treeId).then(function(){ return false; });
      });
    }
    function cleanupAccount(uid,opts){
      var isAdminMode=!!(opts&&opts.isAdmin);
      var ref=userRef(uid);
      return wrapFs(fsMod.getDoc(ref),OperationType.GET,'users/'+uid).then(function(userSnap){
        var exists=userSnap.exists(), data=exists?userSnap.data():{}, treeId=data.treeId, tasks=[];
        Object.keys(data.invites||{}).forEach(function(k){
          tasks.push(wrapFs(fsMod.deleteDoc(fsMod.doc(db,'invites',data.invites[k])),OperationType.DELETE,'invites/'+data.invites[k]).catch(function(){}));
        });
        if(isAdminMode){
          tasks.push(deleteDocs(fsMod.query(fsMod.collection(db,'invites'),fsMod.where('ownerUid','==',uid)),'invites').catch(function(){}));
        }
        tasks.push(deleteDocs(fsMod.query(fsMod.collection(db,'clouds'),fsMod.where('uid','==',uid)),'clouds'));
        var treePromise;
        if(treeId){
          treePromise=wrapFs(fsMod.getDoc(treeRef(treeId)),OperationType.GET,'trees/'+treeId).then(function(treeSnap){
            if(!treeSnap.exists()) return 0;
            return cleanupUserInTree(uid,treeId,treeSnap.data(),opts).then(function(deleted){ return deleted?1:0; });
          });
        } else if(isAdminMode){
          treePromise=wrapFs(fsMod.getDocs(fsMod.collection(db,'trees')),OperationType.LIST,'trees').then(function(snap){
            var hits=snap.docs.filter(function(d){
              var t=d.data()||{};
              return (t.members||[]).indexOf(uid)>=0||t.ownerUid===uid;
            });
            return Promise.all(hits.map(function(d){
              return cleanupUserInTree(uid,d.id,d.data(),opts).then(function(deleted){ return deleted?1:0; });
            })).then(function(arr){ return arr.reduce(function(a,b){ return a+b; },0); });
          });
        } else {
          treePromise=Promise.resolve(0);
        }
        return Promise.all(tasks).then(function(){ return treePromise; }).then(function(deletedTrees){
          var delUser=exists?wrapFs(fsMod.deleteDoc(ref),OperationType.DELETE,'users/'+uid):Promise.resolve();
          return delUser.then(function(){ return {ok:true,deletedTrees:deletedTrees||0}; });
        });
      });
    }

    var ADMIN_EMAIL='yangdk02@gmail.com', purgedCloudIds={}, CONSENT_KEY='litttlAnalyticsConsent';
    var analyticsMod=null, analyticsInst=null, analyticsLoading=null;
    function hasAnalyticsConsent(){ try{ return localStorage.getItem(CONSENT_KEY)==='granted'; }catch(e){ return false; } }
    function clearGaCookies(){
      try{
        if(typeof document==='undefined'||!document.cookie) return;
        document.cookie.split(';').forEach(function(pair){
          var name=pair.split('=')[0].trim();
          if(name==='_ga'||name.indexOf('_ga_')===0||name==='_gid'){
            document.cookie=name+'=; Max-Age=0; path=/';
          }
        });
      }catch(e){}
    }
    function ensureAnalytics(){
      if(!hasAnalyticsConsent()||!CONFIG.firebase||!CONFIG.firebase.measurementId) return Promise.resolve(null);
      if(analyticsInst){
        try{ analyticsMod.setAnalyticsCollectionEnabled(analyticsInst,true); }catch(e){}
        return Promise.resolve(analyticsInst);
      }
      if(analyticsLoading) return analyticsLoading;
      analyticsLoading=import(base+'firebase-analytics.js').then(function(mod){
        analyticsMod=mod;
        return typeof mod.isSupported==='function'?mod.isSupported():true;
      }).then(function(ok){
        if(!ok||!hasAnalyticsConsent()) return null;
        analyticsInst=analyticsMod.getAnalytics(app);
        analyticsMod.setAnalyticsCollectionEnabled(analyticsInst,true);
        return analyticsInst;
      }).catch(function(){ return null; }).then(function(inst){
        analyticsLoading=null;
        return inst;
      });
      return analyticsLoading;
    }
    function purgeExpiredClouds(cutoff){
      if(!auth.currentUser) return Promise.resolve();
      var q=fsMod.query(fsMod.collection(db,'clouds'),fsMod.where('ts','<=',cutoff),fsMod.limit(50));
      return fsMod.getDocs(q).then(function(snap){
        return Promise.all(snap.docs.map(function(d){
          var data=d.data()||{};
          if(data.evergreen||purgedCloudIds[d.id]){ purgedCloudIds[d.id]=1; return Promise.resolve(); }
          purgedCloudIds[d.id]=1;
          return fsMod.deleteDoc(d.ref).catch(function(){ delete purgedCloudIds[d.id]; });
        }));
      }).catch(function(){});
    }

    return {
      mode:'live',
      onAuth:function(cb){
        return authMod.onAuthStateChanged(auth,function(u){
          if(u) purgeExpiredClouds(Date.now()-24*60*60*1000-5000);
          cb(u?{uid:u.uid,email:u.email,displayName:u.displayName||''}:null);
        });
      },
      signInWithGoogle:function(){
        return authMod.signInWithPopup(auth,googleProvider).then(function(cred){
          return ensureUserDoc(cred.user).then(function(){
            return {uid:cred.user.uid,email:cred.user.email,displayName:cred.user.displayName||''};
          });
        }).catch(function(err){
          if(err && (err.code === 'auth/unauthorized-domain' || String(err.message||'').includes('unauthorized-domain'))) {
            var currentHost = window.location.hostname;
            throw new Error('현재 주소('+currentHost+')가 Firebase 콘솔의 [Authentication > 설정 > 승인된 도메인(Authorized domains)]에 등록되어 있지 않습니다. Firebase 콘솔에 이 도메인을 추가해 주세요.');
          }
          throw err;
        });
      },
      signOut:function(){ return authMod.signOut(auth); },
      getUser:function(uid){
        return wrapFs(fsMod.getDoc(userRef(uid)),OperationType.GET,'users/'+uid).then(function(s){
          return s.exists()?s.data():null;
        });
      },
      setUser:function(uid,p){
        return wrapFs(fsMod.setDoc(userRef(uid),p,{merge:true}),OperationType.WRITE,'users/'+uid);
      },
      watchTree:function(id,cb,er){
        return fsMod.onSnapshot(treeRef(id),function(s){ cb(s.exists()?s.data():null); },function(error){
          try{ handleFirestoreError(error,OperationType.GET,'trees/'+id); }catch(err){ if(er) er(err); }
        });
      },
      getTree:function(id){
        return wrapFs(fsMod.getDoc(treeRef(id)),OperationType.GET,'trees/'+id).then(function(s){
          return s.exists()?s.data():null;
        });
      },
      createTree:function(id,d){
        return wrapFs(fsMod.setDoc(treeRef(id),d),OperationType.CREATE,'trees/'+id);
      },
      updateTree:function(id,p){
        return wrapFs(fsMod.updateDoc(treeRef(id),p),OperationType.UPDATE,'trees/'+id);
      },
      removeTreeFields:function(id,fields){
        var p={}; fields.forEach(function(k){ p[k]=fsMod.deleteField(); });
        return wrapFs(fsMod.updateDoc(treeRef(id),p),OperationType.UPDATE,'trees/'+id);
      },
      listTrees:function(){
        return wrapFs(fsMod.getDocs(fsMod.collection(db,'trees')),OperationType.LIST,'trees').then(function(q){
          return q.docs.map(function(d){ return d.data(); });
        });
      },
      heart:function(id,uid,day){
        var b=fsMod.writeBatch(db), r=treeRef(id);
        b.set(fsMod.doc(db,'trees',id,'hearts',uid+'_'+day),{uid:uid,day:day});
        b.update(r,{hearts:fsMod.increment(1)});
        return wrapFs(b.commit(),OperationType.WRITE,'trees/'+id);
      },
      hearted:function(id,uid,day){
        var path='trees/'+id+'/hearts/'+uid+'_'+day;
        return wrapFs(fsMod.getDoc(fsMod.doc(db,'trees',id,'hearts',uid+'_'+day)),OperationType.GET,path).then(function(s){
          return s.exists();
        });
      },
      watchMessages:function(id,cb){
        var q=fsMod.query(fsMod.collection(db,'trees',id,'messages'),fsMod.orderBy('ts','desc'),fsMod.limit(40));
        return fsMod.onSnapshot(q,function(snap){
          cb(snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }));
        },function(error){
          try{ handleFirestoreError(error,OperationType.LIST,'trees/'+id+'/messages'); }catch(_){}
        });
      },
      listMessages:function(id){
        return wrapFs(fsMod.getDocs(fsMod.collection(db,'trees',id,'messages')),OperationType.LIST,'trees/'+id+'/messages').then(function(snap){
          return snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
        });
      },
      addMessage:function(id,m){
        return wrapFs(fsMod.addDoc(fsMod.collection(db,'trees',id,'messages'),m),OperationType.CREATE,'trees/'+id+'/messages');
      },
      deleteMessage:function(id,mid){
        return wrapFs(fsMod.deleteDoc(fsMod.doc(db,'trees',id,'messages',mid)),OperationType.DELETE,'trees/'+id+'/messages/'+mid);
      },
      watchClouds:function(cb){
        var q=fsMod.query(fsMod.collection(db,'clouds'),fsMod.orderBy('ts','desc'),fsMod.limit(60));
        purgeExpiredClouds(Date.now()-24*60*60*1000-5000);
        var timer=setInterval(function(){ if(!document.hidden) purgeExpiredClouds(Date.now()-24*60*60*1000-5000); },5*60*1000);
        var unsub=fsMod.onSnapshot(q,function(snap){
          var now=Date.now(), cutoff=now-24*60*60*1000, delCutoff=cutoff-5000, list=[];
          snap.docs.forEach(function(d){
            var data=Object.assign({id:d.id},d.data());
            if(!data.evergreen&&typeof data.ts==='number'&&data.ts<=cutoff){
              if(data.ts<=delCutoff&&auth.currentUser&&!purgedCloudIds[d.id]){
                purgedCloudIds[d.id]=1;
                fsMod.deleteDoc(d.ref).catch(function(){ delete purgedCloudIds[d.id]; });
              }
              return;
            }
            if(data.evergreen) data.ts=now;
            list.push(data);
          });
          cb(list);
        },function(error){
          try{ handleFirestoreError(error,OperationType.LIST,'clouds'); }catch(_){}
        });
        return function(){ clearInterval(timer); unsub(); };
      },
      addCloud:function(c){
        var ur=userRef(c.uid), cr=fsMod.doc(fsMod.collection(db,'clouds'));
        var isAdminUser=!!(auth.currentUser&&auth.currentUser.email===ADMIN_EMAIL);
        return wrapFs(fsMod.runTransaction(db,function(tx){
          return tx.get(ur).then(function(s){
            var last=s.exists()?(s.data().lastCloudAt||0):0;
            if(!isAdminUser&&Date.now()-last<24*60*60*1000){
              var e=new Error('cloud/cooldown'); e.code='cloud/cooldown'; throw e;
            }
            tx.set(cr,c);
            tx.set(ur,{lastCloudAt:c.ts},{merge:true});
          });
        }),OperationType.WRITE,'clouds').then(function(){
          purgeExpiredClouds(Date.now()-24*60*60*1000-5000);
          return Object.assign({},c,{id:cr.id});
        });
      },
      deleteCloud:function(id){
        return wrapFs(fsMod.deleteDoc(fsMod.doc(db,'clouds',id)),OperationType.DELETE,'clouds/'+id);
      },
      createInvite:function(code,d){
        return wrapFs(fsMod.setDoc(fsMod.doc(db,'invites',code),d),OperationType.CREATE,'invites/'+code);
      },
      getInvite:function(code){
        return wrapFs(fsMod.getDoc(fsMod.doc(db,'invites',code)),OperationType.GET,'invites/'+code).then(function(s){
          return s.exists()?s.data():null;
        });
      },
      deleteInvite:function(code){
        return wrapFs(fsMod.deleteDoc(fsMod.doc(db,'invites',code)),OperationType.DELETE,'invites/'+code);
      },
      joinTree:function(id,p){
        return wrapFs(fsMod.updateDoc(treeRef(id),p),OperationType.UPDATE,'trees/'+id);
      },
      detachTree:function(id,uid){
        var r=treeRef(id);
        return wrapFs(fsMod.getDoc(r),OperationType.GET,'trees/'+id).then(function(s){
          if(!s.exists()) return;
          var t=s.data(), members=(t.members||[]).filter(function(x){ return x!==uid; }), chars=(t.chars||[]).filter(function(x){ return x.uid!==uid; });
          if(t.ownerUid===uid&&!members.length) return deleteTreeDeep(r);
          var p={members:members,chars:chars};
          if(t.ownerUid===uid) p.ownerUid=members[0];
          return wrapFs(fsMod.updateDoc(r,p),OperationType.UPDATE,'trees/'+id).then(function(){
            return wrapFs(fsMod.deleteDoc(fsMod.doc(db,'trees',id,'presence',uid)),OperationType.DELETE,'trees/'+id+'/presence/'+uid).catch(function(){});
          });
        });
      },
      beat:function(id,uid){
        return wrapFs(fsMod.setDoc(fsMod.doc(db,'trees',id,'presence',uid),{at:Date.now()}),OperationType.WRITE,'trees/'+id+'/presence/'+uid);
      },
      leave:function(id,uid){
        return wrapFs(fsMod.deleteDoc(fsMod.doc(db,'trees',id,'presence',uid)),OperationType.DELETE,'trees/'+id+'/presence/'+uid);
      },
      watchPresence:function(id,cb){
        return fsMod.onSnapshot(fsMod.collection(db,'trees',id,'presence'),function(snap){
          var o={}; snap.docs.forEach(function(d){ o[d.id]=d.data().at; }); cb(o);
        },function(error){
          try{ handleFirestoreError(error,OperationType.LIST,'trees/'+id+'/presence'); }catch(_){}
        });
      },
      listDiary:function(id){
        return wrapFs(fsMod.getDocs(fsMod.collection(db,'trees',id,'diary')),OperationType.LIST,'trees/'+id+'/diary').then(function(snap){
          return snap.docs.map(function(d){ return Object.assign({docId:d.id,date:d.id},d.data()); });
        });
      },
      saveDiary:function(id,date,entry){
        var r=fsMod.doc(db,'trees',id,'diary',date), path='trees/'+id+'/diary/'+date;
        return entry?wrapFs(fsMod.setDoc(r,entry),OperationType.WRITE,path):wrapFs(fsMod.deleteDoc(r),OperationType.DELETE,path);
      },
      deleteAccount:function(){
        var user=auth.currentUser;
        if(!user) return Promise.reject({code:'auth/user-not-found'});
        return authMod.reauthenticateWithPopup(user,googleProvider).then(function(){
          return cleanupAccount(user.uid);
        }).then(function(){
          return authMod.deleteUser(user);
        });
      },
      setAnalyticsConsent:function(granted){
        try{ localStorage.setItem(CONSENT_KEY,granted?'granted':'denied'); }catch(e){}
        if(granted) return ensureAnalytics().then(function(){ return true; });
        if(analyticsMod&&analyticsInst){
          try{ analyticsMod.setAnalyticsCollectionEnabled(analyticsInst,false); }catch(e){}
        }
        clearGaCookies();
        return Promise.resolve(false);
      },
      trackEvent:function(name,params){
        if(!hasAnalyticsConsent()||!CONFIG.firebase||!CONFIG.firebase.measurementId) return false;
        ensureAnalytics().then(function(inst){
          if(inst&&analyticsMod&&hasAnalyticsConsent()) analyticsMod.logEvent(inst,name,params||{});
        }).catch(function(){});
        return true;
      },
      adminListUsers:function(){
        if(!auth.currentUser||auth.currentUser.email!==ADMIN_EMAIL) return Promise.reject({code:'admin/forbidden'});
        return wrapFs(fsMod.getDocs(fsMod.collection(db,'users')),OperationType.LIST,'users').then(function(snap){
          return snap.docs.map(function(d){ return Object.assign({uid:d.id},d.data()); });
        });
      },
      adminCleanupUser:function(uid){
        if(!auth.currentUser||auth.currentUser.email!==ADMIN_EMAIL) return Promise.reject({code:'admin/forbidden'});
        if(!uid) return Promise.reject({code:'admin/invalid-uid'});
        if(uid===auth.currentUser.uid) return Promise.reject({code:'admin/self-delete'});
        return cleanupAccount(uid,{isAdmin:true});
      },
      adminDeleteTree:function(treeId){
        if(!auth.currentUser||auth.currentUser.email!==ADMIN_EMAIL) return Promise.reject({code:'admin/forbidden'});
        if(!treeId) return Promise.reject({code:'admin/invalid-tree'});
        return wrapFs(fsMod.getDocs(fsMod.query(fsMod.collection(db,'users'),fsMod.where('treeId','==',treeId))),OperationType.LIST,'users').then(function(snap){
          return Promise.all(snap.docs.map(function(d){
            return wrapFs(fsMod.updateDoc(d.ref,{treeId:null}),OperationType.UPDATE,d.ref.path);
          })).then(function(){ return snap.size; });
        }).then(function(clearedUsers){
          return deleteTreeDeep(treeRef(treeId),{isAdmin:true}).then(function(){
            return {ok:true,clearedUsers:clearedUsers};
          });
        });
      }
    };
  });
}
