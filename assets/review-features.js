// Optional review features for the current three-card version of RYOKO ORACLE.
// Kept separate to avoid replacing the newer 15-card journey and daily horoscope.
(function(){
  'use strict';
  const setup=document.getElementById('reading-setup');
  const details=document.getElementById('reading-details');
  const summary=document.getElementById('result-summary');
  const finalActions=document.getElementById('final-actions');
  if(!setup||!details||!summary||!finalActions)return;
  const make=(tag,className,html)=>{
    const el=document.createElement(tag);el.className=className;el.innerHTML=html;return el;
  };
  const style=document.createElement('style');
  style.textContent=[
    '.review-quick,.review-journal,.review-quick-panel{max-width:560px;margin:0 auto 20px;padding:18px 20px;border:1px solid #d6bc8069;border-radius:10px;background:#261c33;text-align:left}',
    '.review-quick h2,.review-journal h2,.review-quick-panel h2{font-size:19px;color:#edd8a7;font-weight:400;margin:0 0 8px}',
    '.review-quick p,.review-journal p,.review-quick-panel p{font-size:13px;color:#d0c3d6;line-height:1.9}',
    '.review-quick .action,.review-quick-panel .action{width:100%;margin-top:7px}',
    '.review-quick-panel img{width:118px;max-width:40%;border-radius:6px;display:block;margin:12px auto}',
    '.review-journal-list{padding-left:20px;overflow-wrap:anywhere;font-size:13px;color:#decda5}',
    '.review-journal-list li{margin:10px 0}',
    '.review-memo{width:100%;min-height:82px;padding:10px;background:#1a1426;color:#f3eada;border:1px solid #b49a66;border-radius:6px;font-size:16px;line-height:1.7}',
    '.review-memo-summary{border-left:2px solid #d6bc80;padding:10px 14px;margin:10px 0 22px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere;color:#e5d6ed;font-size:13px}',
    '.review-status{font-size:12px;color:#d6bc80;margin:10px 0;line-height:1.8}',
    '.review-quiet{border:0;background:transparent;color:#d6bc80;text-decoration:underline;cursor:pointer;min-height:44px}'
  ].join('\n');
  document.head.append(style);

  const quick=make('section','review-quick',
    '<h2>今日の一枚をひく</h2><p>登録なし・生年月日の入力なしで、15枚のカードから今日のヒントを一枚ご紹介します。</p><button type="button" class="action" id="review-quick-start">一枚ひいてみる</button>');
  setup.insertBefore(quick,setup.firstElementChild);

  const journal=make('section','review-journal',
    '<h2>保存したカード</h2><p>希望した場合だけ、このブラウザに最大7件の要約を保存します。生年月日や相談メモは保存しません。</p><ul class="review-journal-list" id="review-journal-list"></ul><button type="button" class="review-quiet" id="review-journal-delete">すべて削除する</button><p class="review-status" id="review-journal-status" role="status"></p>');
  journal.id='review-journal';
  journal.hidden=true;
  quick.after(journal);

  const panel=make('section','review-quick-panel',
    '<p id="review-quick-caption"></p><h2 id="review-quick-title"></h2><img id="review-quick-art" alt=""><p id="review-quick-body"></p><p id="review-quick-advice"></p><div class="actions"><button type="button" class="action" id="review-quick-detail">詳しく占う</button><button type="button" class="action secondary" id="review-quick-save">この一枚を保存</button></div><p class="review-status" id="review-quick-status" role="status"></p><p>独自の固定文から作った娯楽コンテンツです。未来を予言するものではありません。</p>');
  panel.id='review-quick-panel';
  panel.hidden=true;
  panel.querySelector('#review-quick-title').setAttribute('tabindex','-1');
  setup.after(panel);

  const memoWrap=make('div','review-memo-wrap',
    '<label class="field-label" for="review-consult-memo">占い師に伝えたいこと <span class="optional">任意・120文字まで</span></label><textarea class="review-memo" id="review-consult-memo" maxlength="120" rows="2" placeholder="今の気持ちを短く書いてください"></textarea><p class="form-note">相談メモは鑑定文を生成するためには使用しません。結果に表示するだけで、送信・保存しません。</p>');
  details.querySelector('button[type="submit"]').before(memoWrap);

  const memoDisplay=document.createElement('p');
  memoDisplay.id='review-memo-summary';memoDisplay.className='review-memo-summary';memoDisplay.hidden=true;
  summary.after(memoDisplay);

  const finalSave=make('button','action secondary','この3枚を保存');
  finalSave.type='button';finalSave.id='review-save-reading';
  finalActions.append(finalSave);
  const savedStatus=document.createElement('p');
  savedStatus.id='review-save-status';savedStatus.className='review-status';
  finalActions.after(savedStatus);

  const KEY='ryoko-review-history-v1';
  function readHistory(){
    try{
      const records=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(records)?records.filter(x=>x&&typeof x.date==='string'&&typeof x.card==='string').slice(0,7):[];
    }catch(_){return [];}
  }
  function displayHistory(){
    const entries=readHistory(),list=document.getElementById('review-journal-list');
    list.replaceChildren();
    entries.forEach(entry=>{
      const li=document.createElement('li');
      li.textContent=entry.date+' · '+entry.theme+' · '+entry.card+'｜'+entry.heading;
      list.append(li);
    });
    journal.hidden=entries.length===0;
  }
  function saveRecord(record,statusId){
    const status=document.getElementById(statusId);
    if(!record){status.textContent='保存できる結果がありません。';return;}
    try{
      const history=readHistory();
      const exists=history.some(e=>e.date===record.date&&e.theme===record.theme&&e.card===record.card&&e.heading===record.heading);
      if(!exists)localStorage.setItem(KEY,JSON.stringify([record,...history].slice(0,7)));
      status.textContent=exists?'このカードは保存済みです。':'このブラウザに保存しました。';
      displayHistory();
    }catch(_){status.textContent='端末の設定により保存できませんでした。';}
  }
  let quickRecord=null;
  document.getElementById('review-quick-start').addEventListener('click',()=>{
    const date=tokyoDay();
    let hash=2166136261;
    for(const c of date)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    const card=cardCatalogue[hash%cardCatalogue.length];
    const theme=document.querySelector('input[name="theme"]:checked')?.value||'love';
    const words=readingFor(theme,card.id);
    const action=adviceFor(card.id);
    document.getElementById('review-quick-caption').textContent=date+' · '+themes[theme]+' · '+card.label+'のカード';
    document.getElementById('review-quick-title').textContent=words[0];
    const art=document.getElementById('review-quick-art');
    art.src='assets/card-'+card.file+'.webp';
    art.alt=card.label+'のカードのイラスト';
    document.getElementById('review-quick-body').textContent=words[1];
    document.getElementById('review-quick-advice').textContent='今日の小さな一歩：'+action;
    document.getElementById('review-quick-status').textContent='';
    quickRecord={date,theme:themes[theme],card:card.label,heading:words[0],action};
    setup.hidden=true;panel.hidden=false;
    document.getElementById('review-quick-title').focus();
  });
  document.getElementById('review-quick-save').addEventListener('click',()=>saveRecord(quickRecord,'review-quick-status'));
  document.getElementById('review-quick-detail').addEventListener('click',()=>{
    panel.hidden=true;setup.hidden=false;displayHistory();
    document.getElementById('setup-heading').focus();
  });
  document.getElementById('review-journal-delete').addEventListener('click',()=>{
    if(!confirm('保存したカード履歴をこのブラウザから削除しますか？'))return;
    try{
      localStorage.removeItem(KEY);displayHistory();
      document.getElementById('review-journal-status').textContent='保存したカードを削除しました。';
    }catch(_){document.getElementById('review-journal-status').textContent='削除できませんでした。';}
  });
  function renderMemo(){
    const memo=document.getElementById('review-consult-memo').value.trim();
    memoDisplay.hidden=!memo;
    memoDisplay.textContent=memo?'あなたが入力した相談メモ：'+memo:'';
  }
  document.querySelectorAll('.cards button[data-card]').forEach(button=>button.addEventListener('click',renderMemo));
  document.getElementById('journey-response').addEventListener('submit',renderMemo);
  ['journey-back','card-back'].forEach(id=>document.getElementById(id).addEventListener('click',renderMemo));
  finalSave.addEventListener('click',()=>{
    if(draws.length!==3)return;
    saveRecord({date:tokyoDay(),theme:themes[selectedTheme],card:draws.map(id=>motifs[id]).join('・'),heading:document.getElementById('result-title').textContent,action:adviceFor(draws[2])},'review-save-status');
  });
  ['home','details-back'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{
    panel.hidden=true;quickRecord=null;
    document.getElementById('review-consult-memo').value='';
    memoDisplay.hidden=true;memoDisplay.textContent='';
    document.getElementById('review-save-status').textContent='';
    displayHistory();
  }));
  displayHistory();
})();
