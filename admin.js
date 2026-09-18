const $=id=>document.getElementById(id),reasons={abuse:'욕설·괴롭힘',hate:'혐오 표현',sexual:'선정적인 표현',personal:'개인정보 노출',impersonation:'사칭',other:'기타 부적절한 이름'};
let auth,api,cursor=null,loading=false;
function status(v){$('status').textContent=v}
function el(tag,text){const e=document.createElement(tag);e.textContent=text;return e}
async function load(more=false){if(loading)return;loading=true;$('refresh').disabled=true;$('more').disabled=true;try{
 const {reports,cursor:next}=await api('safetyListReports',{cursor:more?cursor:null});if(!more)$('reports').replaceChildren();cursor=next;
 for(const r of reports){const card=el('article','');card.className='card';card.append(el('h2',r.nickname||'(삭제된 사용자)'),el('p',`신고 사유: ${reasons[r.reason]||r.reason}`),el('p',`접수: ${r.createdAt||''} · 상태: ${r.status}`),el('p',`신고 번호: ${r.id}`));
  const reason=document.createElement('select');reason.setAttribute('aria-label','사용자에게 안내할 사유');for(const [v,label] of Object.entries(reasons)){const o=el('option',label);o.value=v;reason.append(o)}reason.value=r.reason;card.append(reason);
  const controls=document.createElement('div');controls.className='actions';
  for(const [action,label] of [['dismiss','문제없음'],['rename','임시 이름으로 변경'],['lock','임시 이름 + 변경 제한'],['unlock','변경 제한 해제']]){
   if(r.status!=='open'&&action!=='unlock')continue;
   const button=el('button',label);button.type='button';button.onclick=async()=>{if(!confirm(`${r.nickname}: ${label} 조치를 적용할까요?`))return;const buttons=[...card.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);try{await api('safetyResolveReport',{reportId:r.id,action,reason:reason.value});status('처리했습니다.');await load(false)}catch(e){status('처리 실패: '+(e.message||e.code));buttons.forEach(x=>x.disabled=false)}};controls.append(button);
  }card.append(controls);$('reports').append(card);
 }$('more').hidden=!cursor;status(reports.length?'신고를 확인하고 필요한 조치를 선택하세요.':'표시할 신고가 없습니다.');
 }catch(e){status(String(e.code).includes('permission-denied')?'관리자 권한이 없습니다. Firebase의 adminUsers 설정을 확인하세요.':'불러오지 못했습니다: '+(e.message||e.code))}finally{loading=false;$('refresh').disabled=false;$('more').disabled=false}}
try{
 const [{app,functions},A,{httpsCallable}]=await Promise.all([import('./firebase-client.js'),import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js')]);
 auth=A.getAuth(app);await A.setPersistence(auth,A.browserSessionPersistence);api=async(name,data)=>(await httpsCallable(functions,name)(data)).data;
 $('login-button').disabled=false;$('reset').disabled=false;status('관리자 계정으로 로그인하세요.');
 $('login').onsubmit=async e=>{e.preventDefault();$('login-button').disabled=true;try{await A.signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value=''}catch{status('로그인하지 못했습니다. 이메일과 비밀번호를 확인하세요.')}finally{$('login-button').disabled=false}};
 $('reset').onclick=async()=>{const email=$('email').value.trim();if(!email){status('이메일을 입력하세요.');return}try{await A.sendPasswordResetEmail(auth,email);status('등록된 계정이라면 비밀번호 재설정 안내를 받을 수 있습니다.')}catch{status('메일 요청을 처리하지 못했습니다.')}};
 $('logout').onclick=()=>A.signOut(auth);
 $('prepare').onclick=async()=>{if(!confirm('새 버전 배포 전 기존 닉네임을 예약합니다. 기존 이름이나 점수는 바꾸지 않습니다. 진행할까요?'))return;$('prepare').disabled=true;try{let cursor=null,count=0;do{const r=await api('safetyPrepareLegacyNicknames',{cursor});cursor=r.cursor;count+=r.reserved;status(`${count}개 닉네임 예약 중…`)}while(cursor);status(`완료: 기존 닉네임 ${count}개. 이제 새 앱 테스트를 진행하세요.`)}catch(e){status(`설정 중단: ${e.message}. 중복 이름을 확인한 뒤 다시 실행하세요.`)}finally{$('prepare').disabled=false}};
 A.onAuthStateChanged(auth,user=>{$('login').hidden=!!user;$('toolbar').hidden=!user;$('reports').replaceChildren();$('more').hidden=true;if(user)load();else status('관리자 계정으로 로그인하세요.')});
 $('refresh').onclick=()=>load();$('more').onclick=()=>load(true);
}catch{status('서버 연결을 준비하지 못했습니다. 설정과 네트워크를 확인하세요.')}
