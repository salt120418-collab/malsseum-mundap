/* Shared validation for the app, local manager and command-line check. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ContentSchema=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const langs=['ko','en','es'];
 function fail(message){throw new Error(message)}
 function text(x,max=30000){return typeof x==='string'&&x.trim().length>0&&x.length<=max}
 function names(x){return x&&langs.every(l=>text(x[l],100))}
 function validate(data){
  if(!data||data.schemaVersion!==1||!text(data.revision,100)||!Array.isArray(data.categories)||!Array.isArray(data.questions))fail('schemaVersion, revision, categories, questions를 확인하세요.');
  if(JSON.stringify(data).length>4*1024*1024)fail('콘텐츠 JSON이 4MB 제한을 넘었습니다.');
  if(data.categories.length>100||data.questions.length>3000)fail('한 묶음은 카테고리 100개, 문답 3,000개 이하로 구성하세요.');
  const cats=new Set(),ids=new Set();
  data.categories.forEach(c=>{if(!c||!text(c.id,100)||['__proto__','constructor','prototype','믿음의 고민','믿음의 본질'].includes(c.id)||cats.has(c.id)||!names(c.name))fail('카테고리 ID 또는 한·영·스페인어 이름 오류');if(c.newContent!=null){const n=c.newContent;if(!n||!Number.isFinite(Date.parse(n.publishedAt))||!Number.isFinite(Date.parse(n.expiresAt))||Date.parse(n.expiresAt)<=Date.parse(n.publishedAt)||!Number.isInteger(n.count)||n.count<1)fail('NEW 표시 날짜/추가 문항 수 오류')}cats.add(c.id)});
  data.questions.forEach((q,i)=>{
   if(!q||!text(q.id,100)||!/^remote-[a-z0-9_-]+$/.test(q.id)||ids.has(q.id)||!cats.has(q.category))fail('문답 '+(i+1)+': 고유 remote- ID / 카테고리를 확인하세요.');
   ids.add(q.id);
   if(!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>3)fail(q.id+': 정답 번호 오류 (0부터 시작)');
   let count;
   langs.forEach(l=>{const x=q[l];if(!x||!text(x.question,5000)||!text(x.explanation)||!Array.isArray(x.choices)||x.choices.length<3||x.choices.length>4||!x.choices.every(v=>text(v,5000))||q.answerIndex>=x.choices.length)fail(q.id+': '+l+' 본문/선택지/해설 오류');if(count&&count!==x.choices.length)fail(q.id+': 언어별 선택지 수가 다릅니다.');count=x.choices.length});
  });
  return data;
 }
 function merge(previous,next){
  validate(next);if(!previous)return next;validate(previous);
  const map=new Map(previous.questions.map(q=>[q.id,q]));
  next.questions.forEach(q=>{const old=map.get(q.id);if(old&&(old.category!==q.category||old.answerIndex!==q.answerIndex))fail(q.id+': 기존 문답의 카테고리/정답 위치를 변경할 수 없습니다. 새 문제는 새 ID를 사용하세요.');map.set(q.id,q)});
  const cats=new Map(previous.categories.map(c=>[c.id,c]));next.categories.forEach(c=>cats.set(c.id,{...cats.get(c.id),...c}));
  return validate({schemaVersion:1,revision:next.revision,categories:[...cats.values()],questions:[...map.values()]});
 }
 function markNew(previous,next,publishedAt,expiresAt){
  validate(next);const known=new Set((previous?.questions||[]).map(q=>q.id));
  const counts=new Map();next.questions.forEach(q=>{if(!known.has(q.id))counts.set(q.category,(counts.get(q.category)||0)+1)});
  return validate({...next,categories:next.categories.map(c=>counts.has(c.id)?{...c,newContent:{publishedAt,expiresAt,count:counts.get(c.id)}}:c)});
 }
 return {validate,merge,markNew};
});
