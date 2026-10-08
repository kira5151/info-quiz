(() => {
  'use strict';
  const BANK = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
  const BY_ID = new Map(BANK.map(q => [q.id, q]));
  const STORAGE_STATS = 'infoquiz_2026_stats_v1';
  const STORAGE_SESSION = 'infoquiz_2026_active_v1';
  const CATS = [
    ['進数・論理','🔢'],['計算機・アルゴリズム','💻'],['電気回路','⚡'],
    ['OSI・IP','🌐'],['ネットワーク機器','📡'],['通信プロトコル','🔁'],
    ['Web・クラウド','☁️'],['暗号・セキュリティ','🔐'],['通信速度・計算','📈']
  ];
  const blankStats = () => ({ total:0, correct:0, perQ:{}, weak:[], history:[] });
  const storage = {
    get(key){try {return JSON.parse(localStorage.getItem(key));}catch(_){return null;}},
    set(key,data){try {localStorage.setItem(key,JSON.stringify(data));}catch(_){}},
    remove(key){try {localStorage.removeItem(key);}catch(_){}}
  };
  const saved = storage.get(STORAGE_STATS);
  const stats = saved && typeof saved === 'object' ? Object.assign(blankStats(),saved) : blankStats();
  stats.perQ = stats.perQ && typeof stats.perQ === 'object' ? stats.perQ : {};
  stats.weak = Array.isArray(stats.weak) ? stats.weak.filter(x => BY_ID.has(x)) : [];
  stats.history = Array.isArray(stats.history) ? stats.history : [];
  let session = validateSession(storage.get(STORAGE_SESSION));
  let page = 'home';
  let result = null;
  const view = document.getElementById('view');
  const escape = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const random = a => {
    const b = a.slice();
    for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
    return b;
  };
  const percent = (a,b) => b > 0 ? Math.round(a / b * 100) : 0;
  const quizCount = BANK.length;
  const labelMode = session => session?.label || 'クイズ';
  function validateSession(s){
    if(!s || !Array.isArray(s.items) || !s.items.length || !Number.isInteger(s.idx) || !s.answers) return null;
    if(s.items.some(item => !BY_ID.has(item.id) || !Array.isArray(item.order) || item.order.length!==4 || new Set(item.order).size!==4 || item.order.some(x=>!Number.isInteger(x)||x<0||x>3)))return null;
    if(s.idx<0||s.idx>=s.items.length)return null;
    if(!Array.isArray(s.missed)) s.missed=[];
    return s;
  }
  function save(){storage.set(STORAGE_STATS,stats); if(session)storage.set(STORAGE_SESSION,session); else storage.remove(STORAGE_SESSION);}
  const haveSeen = id => Number(stats.perQ[id]?.seen||0)>0;
  const reviewedCount = () => BANK.filter(q => haveSeen(q.id)).length;
  function topicCards(){
    return CATS.map(([cat,em]) => {
      const all = BANK.filter(q=>q.cat===cat);
      const done = all.filter(q=>haveSeen(q.id)).length;
      return `<button class="topic" type="button" data-action="category" data-category="${escape(cat)}"><span class="topic-top"><span class="topic-emoji">${em}</span><span class="topic-count">${all.length}問</span></span><strong>${escape(cat)}</strong><span class="topic-bottom"><span class="topic-progress">${done}/${all.length} 学習済み</span><span class="microbar"><span style="width:${percent(done,all.length)}%"></span></span></span></button>`;
    }).join('');
  }
  function renderHome(){
    const seen = reviewedCount();
    const accuracy = percent(stats.correct,stats.total);
    const weak = stats.weak.length;
    return `
      <section class="hero"><p class="eyebrow">YOUR DAILY STUDY PARTNER</p><h1>知識を、<br><em>自信に変えよう。</em></h1>
        <p>情報工学の試験範囲を、スキマ時間に4択で。<br>間違えても大丈夫。繰り返して定着させよう。</p>
        <div class="hero-stat"><i></i><span>2つの資料から作成した全${quizCount}問 · 解説つき</span></div>
      </section>
      <div class="stats-strip">
        <div class="mini-stat"><strong>${seen}<span style="font-size:13px;color:#7d8ba7">/${quizCount}</span></strong><small>学習した問題</small></div>
        <div class="mini-stat"><strong class="mint">${accuracy}%</strong><small>累計正答率</small></div>
        <div class="mini-stat"><strong class="violet">${weak}</strong><small>復習待ち</small></div>
      </div>
      ${session ? `<button class="featured" type="button" data-action="resume"><div><span class="over">CONTINUE LEARNING</span><h3>続きから再開</h3><p>${escape(labelMode(session))} · ${session.idx+1} / ${session.items.length}問</p></div><span class="arrow-circle">→</span></button><div style="height:12px"></div>`:''}
      <section class="section-title"><h2>さっそく始める</h2><span>MODE SELECT</span></section>
      <div class="start-grid">
        <button class="featured" type="button" data-action="start" data-mode="ten"><div><span class="over">RECOMMENDED · DAILY 10</span><h3>ランダム10問</h3><p>毎回違う問題・選択肢で気軽にチャレンジ</p></div><span class="arrow-circle">→</span></button>
        <button class="start-card" type="button" data-action="start" data-mode="all"><span class="symbol">📚</span><strong>全${quizCount}問に挑戦</strong><small>2資料の全問題にじっくり挑む</small></button>
        <button class="start-card" type="button" data-action="start" data-mode="weak" ${weak===0?'disabled':''}><span class="symbol">🎯</span><strong>間違いを復習</strong><small>${weak===0?'間違えた問題がここに集まります':`${weak}問の苦手問題をもう一度`}</small></button>
      </div>
      <section class="section-title" style="margin-top:31px"><h2>分野別に学ぶ</h2><span>TOPICS</span></section>
      <p class="section-subtitle">苦手な単元から始めても、順番に学んでもOK。</p>
      <div class="topic-list">${topicCards()}</div>
      <div class="install-guide"><strong>📱 iPhoneのホーム画面に追加</strong><p>公開したURLをSafariで開き、「共有」→「ホーム画面に追加」。一度オンラインで開けば、その後はオフラインでも学習できます。</p></div>
      <p class="footer-note">※2つのPDFを元に、学習用の4択問題として再構成しました。原資料の図版や全文は収録していません。学習結果はこの端末のブラウザに保存されます。</p>
    `;
  }
  function renderQuiz(){
    if(!session){page='home';return renderHome();}
    const item=session.items[session.idx];
    const q=BY_ID.get(item.id);
    if(!q){session=null;page='home';save();return renderHome();}
    const answer=session.answers[q.id];
    const isRight = answer ? answer.correct : null;
    const progress = percent(session.idx+(answer?1:0),session.items.length);
    const opts = item.order.map((originalIndex,shownIndex)=>{
      let cls='';
      let ind='';
      if(answer){
        if(originalIndex===q.a){cls=' correct';ind='✓';}
        else if(originalIndex===answer.choice){cls=' wrong';ind='×';}
        else cls=' muted';
      }
      return `<button type="button" class="choice${cls}" data-action="answer" data-choice="${originalIndex}" ${answer?'disabled':''} aria-label="選択肢 ${'ABCD'[shownIndex]}: ${escape(q.o[originalIndex])}"><span class="choice-letter">${'ABCD'[shownIndex]}</span><span class="choice-text">${escape(q.o[originalIndex])}</span>${ind?`<span class="choice-indicator">${ind}</span>`:''}</button>`;
    }).join('');
    const feedback=answer?`<section class="feedback ${isRight?'good':'bad'}" aria-live="polite"><div class="feedback-head"><span>${isRight?'✓':'✕'}</span><span>${isRight?'正解！':'不正解 · 覚えておこう'}</span></div><p>${escape(q.e)}</p></section><button class="action-button" type="button" data-action="next">${session.idx===session.items.length-1?'結果を見る':'次の問題へ'} <span aria-hidden="true">→</span></button>`:'';
    return `<div class="quiz-wrap">
      <div class="quiz-toolbar"><button class="back-btn" type="button" data-action="back">← ホームに戻る</button><span class="question-counter">${session.idx+1} / ${session.items.length}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="question-card"><div class="topic-label">${escape(q.cat)}</div><h1>${escape(q.q)}</h1><div class="source-line">📖 ${escape(q.s)} · 4択</div></div>
      <div class="choices">${opts}</div>${feedback}
      <p class="footer-note" style="margin-bottom:20px">解答後に解説と正解が表示されます。途中でホームに戻っても続きから再開できます。</p>
    </div>`;
  }
  function renderResult(){
    if(!result){page='home';return renderHome();}
    const r=result;
    const pct=percent(r.correct,r.total);
    const message=pct>=90?'すばらしい仕上がり！':pct>=70?'いい調子！ あと少し。':pct>=50?'着実に理解が進んでいます。':'苦手を確認して、もう一度！';
    const missed=r.missed.length;
    return `<section class="result-wrap">
      <p class="eyebrow">QUIZ COMPLETE</p>
      <div class="score-ring" style="background:conic-gradient(var(--mint) ${pct}%, #303a58 ${pct}% 100%)"><div class="score-center"><strong>${pct}</strong><small>%</small><label>正答率</label></div></div>
      <h1>${message}</h1><p>${escape(r.label)} の結果です。<br>解けなかった問題は、復習でもう一度チャレンジ。</p>
      <div class="result-grid"><div class="result-stat"><strong>${r.total}</strong><small>出題数</small></div><div class="result-stat"><strong style="color:var(--mint)">${r.correct}</strong><small>正解</small></div><div class="result-stat"><strong style="color:var(--bad)">${r.total-r.correct}</strong><small>不正解</small></div></div>
      <div class="result-actions">
      ${missed?`<button type="button" class="action-button" data-action="redo-missed">今回の間違い ${missed}問を復習 →</button>`:`<div class="empty-note">🎉 全問正解です！ とてもよくできました。</div>`}
      <button class="sub-button" type="button" data-action="start" data-mode="ten">新しいランダム10問を解く</button>
      <button class="sub-button" type="button" data-action="back">ホームに戻る</button>
      </div></section>`;
  }
  function localDate(iso){
    try{ return new Date(iso).toLocaleString('ja-JP',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}catch(_){return '記録';}
  }
  function renderStats(){
    const seen=reviewedCount(), weak=stats.weak.length, rate=percent(stats.correct,stats.total);
    const history=stats.history.length
      ? [...stats.history].reverse().slice(0,12).map(h=>`<div class="history-row"><div><strong>${escape(h.label)}</strong><small>${escape(localDate(h.at))} · ${h.total}問</small></div><span class="history-score">${percent(h.correct,h.total)}%</span></div>`).join('')
      : '<div class="empty-note">まだ学習記録がありません。ランダム10問から始めてみよう！</div>';
    const catProgress=CATS.map(([c,em])=>{
      const catItems=BANK.filter(q=>q.cat===c), n=catItems.filter(q=>haveSeen(q.id)).length;
      return `<div class="cat-progress-item"><header><span>${em} ${escape(c)}</span><span>${n} / ${catItems.length}問</span></header><div class="microbar"><span style="width:${percent(n,catItems.length)}%"></span></div></div>`;
    }).join('');
    return `<section class="stats-page"><div class="eyebrow">YOUR PROGRESS</div><h1>学習記録</h1><p>取り組んだ問題と正答率をチェック。<br>苦手な分野を少しずつ減らしていこう。</p>
      <div class="stat-tiles"><div class="stat-tile"><strong>${seen}<small style="display:inline;font-size:14px;color:var(--dim)"> / ${quizCount}</small></strong><label>学習済みの問題</label></div>
      <div class="stat-tile"><strong style="color:var(--mint)">${rate}%</strong><label>累計正答率</label></div>
      <div class="stat-tile"><strong>${stats.total}</strong><label>累計回答数</label></div>
      <div class="stat-tile"><strong style="color:#b2aaff">${weak}</strong><label>復習待ちの問題</label></div></div>
      ${weak?`<button class="action-button" data-action="start" data-mode="weak">苦手な${weak}問を復習 →</button>`:''}
      <div class="section-title" style="margin-top:30px"><h2>分野別の学習状況</h2><span>TOPICS</span></div><div class="category-progress">${catProgress}</div>
      <div class="section-title" style="margin-top:29px"><h2>最近の結果</h2><span>HISTORY</span></div><div class="history-list">${history}</div>
      <p class="footer-note">データは現在のブラウザ内だけに保存します。Safariの履歴・Webサイトデータを削除すると記録が失われる場合があります。</p>
      <button class="inline-cta" type="button" data-action="reset">学習記録をリセットする</button>
    </section>`;
  }
  function updateNav(){
    document.getElementById('navHome').classList.toggle('active',page==='home'||page==='quiz'||page==='result');
    document.getElementById('navStats').classList.toggle('active',page==='stats');
  }
  function render(){
    view.innerHTML = page==='quiz' ? renderQuiz() : page==='result' ? renderResult() : page==='stats' ? renderStats() : renderHome();
    updateNav();
  }
  function go(p){page=p;render();window.scrollTo({top:0,behavior:'instant'});}
  function start(mode,category,selectedIds){
    if(session && !window.confirm('進行中のクイズは終了します。新しいクイズを始めますか？'))return;
    let pool=[]; let label='';
    if(mode==='ten'){pool=BANK.map(q=>q.id);label='ランダム10問';}
    if(mode==='all'){pool=BANK.map(q=>q.id);label='全問チャレンジ';}
    if(mode==='weak'){pool=stats.weak.filter(id=>BY_ID.has(id));label='苦手問題の復習';}
    if(mode==='category'){pool=BANK.filter(q=>q.cat===category).map(q=>q.id);label=`${category}`;}
    if(mode==='missed'){pool=selectedIds.filter(id=>BY_ID.has(id));label='今回の間違いを復習';}
    if(pool.length===0){notify('復習対象の問題はまだありません');return;}
    const ids=random(pool).slice(0,mode==='ten'?10:undefined);
    session={label,startedAt:new Date().toISOString(),items:ids.map(id=>({id,order:random([0,1,2,3])})),idx:0,answers:{},missed:[]};
    result=null;save();go('quiz');
  }
  function answer(originalIndex){
    if(page!=='quiz'||!session)return;
    const q=BY_ID.get(session.items[session.idx].id);
    if(!q || session.answers[q.id] || !Number.isInteger(originalIndex) || originalIndex<0 || originalIndex>=4)return;
    const correct=originalIndex===q.a;
    session.answers[q.id]={choice:originalIndex,correct};
    if(!correct){ session.missed.push(q.id); if(!stats.weak.includes(q.id)) stats.weak.push(q.id); }
    else stats.weak=stats.weak.filter(id=>id!==q.id);
    stats.total++;
    if(correct)stats.correct++;
    if(!stats.perQ[q.id])stats.perQ[q.id]={seen:0,correct:0};
    stats.perQ[q.id].seen++;
    if(correct)stats.perQ[q.id].correct++;
    stats.perQ[q.id].lastCorrect=correct;
    save();render();
    const fb=document.querySelector('.feedback');
    if(fb && typeof fb.scrollIntoView==='function') requestAnimationFrame(()=>fb.scrollIntoView({behavior:'smooth',block:'nearest'}));
  }
  function next(){
    if(page!=='quiz'||!session)return;
    const q=BY_ID.get(session.items[session.idx].id);
    if(!session.answers[q.id])return;
    if(session.idx+1 < session.items.length){session.idx++;save();go('quiz');return;}
    const score=Object.values(session.answers).filter(a=>a.correct).length;
    result={label:session.label,correct:score,total:session.items.length,missed:[...new Set(session.missed)]};
    stats.history.push({label:result.label,correct:score,total:result.total,at:new Date().toISOString()});
    stats.history=stats.history.slice(-100);
    session=null;save();go('result');
  }
  let toastHandle;
  function notify(msg){
    document.querySelector('.toast')?.remove();
    const t=document.createElement('div'); t.className='toast';t.textContent=msg;t.setAttribute('role','status');document.body.appendChild(t);
    clearTimeout(toastHandle);toastHandle=setTimeout(()=>t.remove(),2400);
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest('button'); if(!el||el.disabled)return;
    const nav=el.dataset.nav;
    if(nav){go(nav);return;}
    const action=el.dataset.action;
    if(action==='start'){start(el.dataset.mode);return;}
    if(action==='category'){start('category',el.dataset.category);return;}
    if(action==='resume'){go('quiz');return;}
    if(action==='answer'){answer(Number(el.dataset.choice));return;}
    if(action==='next'){next();return;}
    if(action==='back'){go('home');return;}
    if(action==='redo-missed' && result){start('missed',null,result.missed);return;}
    if(action==='reset'){
      if(window.confirm('すべての学習記録と復習リストを削除しますか？ この操作は元に戻せません。')){
        Object.assign(stats,blankStats()); session=null;result=null;save();go('stats');notify('学習記録をリセットしました');
      }
    }
  });
  document.getElementById('brandButton').addEventListener('click',()=>go('home'));
  render();
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
