/* 욕설·음란 표현 거르기. 목록은 CONFIG.banned에서 고칩니다. */
var Filter = (function(){
  var B = CONFIG.banned;
  function keep(text, re){ var s='', map=[]; for(var i=0;i<text.length;i++){ var c=text[i].toLowerCase(); if(re.test(c)){ s+=c; map.push(i); } } return {s:s,map:map}; }
  function find(hay, word, out){ var at=0, i; while((i=hay.indexOf(word,at))>=0){ out.push([i,i+word.length]); at=i+1; } }
  function hits(text){
    var marks=[];
    function scan(words, re){
      var k=keep(text,re), allowed=[], found=[];
      B.allow.forEach(function(a){ find(k.s,a,allowed); });
      words.forEach(function(w){ find(k.s,w,found); });
      found.forEach(function(r){
        if(allowed.some(function(a){ return a[0]<=r[0]&&r[1]<=a[1]; })) return;
        for(var i=r[0];i<r[1];i++) marks.push(k.map[i]);
      });
    }
    scan(B.hard, /[가-힣ㄱ-ㅎㅏ-ㅣa-z]/);
    scan(B.soft, /[가-힣ㄱ-ㅎㅏ-ㅣa-z\s]/);
    B.alone.forEach(function(w){
      var re=new RegExp('(^|[^가-힣])('+w+')(?=$|[^가-힣])(?!\\s*(마|않|못|말|도|만|는))','g'), m;
      while((m=re.exec(text))){ var st=m.index+m[1].length; for(var i=0;i<w.length;i++) marks.push(st+i); }
    });
    return marks;
  }
  return {
    bad: function(t){ return !!t && hits(String(t)).length>0; },
    mask: function(t){ t=String(t||''); var m={}; hits(t).forEach(function(i){ m[i]=1; }); return t.split('').map(function(c,i){ return m[i]?'●':c; }).join(''); }
  };
})();
