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
    '.review-monthly{margin:16px 0;padding:16px 18px;text-align:left;border:1px solid #d6bc8057;border-radius:9px;background:#30243b}.review-monthly h3{font-size:17px;font-weight:400;color:#e9d6a3}.review-monthly p{font-size:13px;line-height:1.9}',
    '.review-journal-list li{margin:10px 0}',
    '.review-memo{width:100%;min-height:82px;padding:10px;background:#1a1426;color:#f3eada;border:1px solid #b49a66;border-radius:6px;font-size:16px;line-height:1.7}',
    '.review-memo-summary{border-left:2px solid #d6bc80;padding:10px 14px;margin:10px 0 22px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere;color:#e5d6ed;font-size:13px}',
    '.review-status{font-size:12px;color:#d6bc80;margin:10px 0;line-height:1.8}',
    '.review-quiet{border:0;background:transparent;color:#d6bc80;text-decoration:underline;cursor:pointer;min-height:44px}',
    '.review-method{margin:2px auto 20px;max-width:600px;padding:15px 17px;border:1px solid #d6bc8052;border-radius:9px;background:#23192e;text-align:left}.review-method h2{margin:0 0 6px;font-weight:400;font-size:17px;color:#eed7a1}.review-method p{margin:0 0 7px;font-size:12px;line-height:1.85;color:#dfd2e8}.review-method details,.review-reason{font-size:12px;line-height:1.8;color:#d8cce0}.review-method summary,.review-reason summary{color:#e5cb94;cursor:pointer;min-height:34px}.review-reason{margin:16px 0;padding:12px 15px;border:1px solid #d6bc8040;border-radius:7px;background:#2d2238}.review-reason p{margin:8px 0;white-space:normal}',
    '.review-quick-topic{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.review-quick-topic button{margin:0;min-height:46px;padding:7px;white-space:normal}.review-quick-panel .review-reason{margin:14px 0}'
  ].join('\n');
  document.head.append(style);

  const quick=make('section','review-quick',
    '<h2>今日の一枚をひく</h2><p>登録なし・生年月日の入力なし。今のテーマを選ぶだけで、その日のヒントを一枚お届けします。</p><div class="review-quick-topic" role="group" aria-label="今日の一枚のテーマを選ぶ"><button type="button" class="action" data-quick-theme="love">恋愛</button><button type="button" class="action" data-quick-theme="work">仕事</button><button type="button" class="action" data-quick-theme="money">金運</button><button type="button" class="action" data-quick-theme="general">総合</button></div>');
  setup.insertBefore(quick,setup.firstElementChild);
  const method=make('section','review-method',
    '<h2>15枚のカードから、あなたの今を読み解く</h2><p>カードの象徴と、選んだ悩み・気持ちを重ねて、一歩踏み出すための言葉を届けます。</p><details id="review-method-details"><summary>占いの仕組み・判断基準を見る</summary><p>①オリジナルの15枚のカードにはそれぞれ象徴と解釈があります。②詳しい占いでは恋愛・仕事・金運・総合からテーマと具体的な相談、途中の気持ちを選びます。③選んだカードと回答に対応する独自の文章を組み合わせます。</p><p>今日の運勢は生年月日と日本時間の日付、今日の一枚は日本時間の日付と選んだテーマが基準です。風水・天体の運行・霊視・統計的な的中率を使った予測ではなく、生成AIが自由記述の相談文を解析する仕組みでもありません。娯楽と気持ちの整理のためにお楽しみください。</p></details>');
  setup.insertBefore(method,quick);

  const journal=make('section','review-journal',
    '<h2>保存したカード</h2><p>希望した場合だけ、このブラウザに最大7件の要約を保存します。生年月日や相談メモは保存しません。</p><ul class="review-journal-list" id="review-journal-list"></ul><button type="button" class="review-quiet" id="review-journal-delete">すべて削除する</button><p class="review-status" id="review-journal-status" role="status"></p>');
  journal.id='review-journal';
  journal.hidden=true;
  quick.after(journal);

  const panel=make('section','review-quick-panel',
    '<p id="review-quick-caption"></p><h2 id="review-quick-title"></h2><img id="review-quick-art" alt=""><p id="review-quick-body"></p><p id="review-quick-advice"></p><details class="review-reason"><summary>なぜこの一枚になったの？</summary><p id="review-quick-reason"></p></details><div class="actions"><button type="button" class="action" id="review-quick-detail">詳しく占う</button><button type="button" class="action secondary" id="review-quick-save">この一枚を保存</button></div><p class="review-status" id="review-quick-status" role="status"></p><p>独自の固定文から作った娯楽コンテンツです。未来を予言するものではありません。</p>');
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
  const reason=make('details','review-reason','<summary>このメッセージの読み解き方</summary><p id="review-reason-text"></p>');
  memoDisplay.after(reason);
  function updateReason(){
    if(!currentCard||!cardById[currentCard])return;
    const card=cardById[currentCard];
    const situation=situations[selectedTheme]?.[Number(selectedSituation)];
    const query=typeof concern==='function'?concern():null;
    const segment=typeof stage==='number'?['今のあなた','気持ちの奥','次の一歩'][stage]:'今のあなた';
    document.getElementById('review-reason-text').textContent='今回のテーマ「'+themes[selectedTheme]+'」、相談「'+(query?.[0]||situation?.label||'未選択')+'」に対し、'+(stage+1)+'枚目の「'+card.label+'」がもつ象徴を「'+segment+'」という役割から読み解いています。答えを断定する占いではなく、カードの意味・選んだ言葉・今できる行動を結び付ける独自のメッセージです。';
  }

  const finalSave=make('button','action secondary','この3枚を保存');
  finalSave.type='button';finalSave.id='review-save-reading';
  finalActions.append(finalSave);
  const savedStatus=document.createElement('p');
  savedStatus.id='review-save-status';savedStatus.className='review-status';
  finalActions.after(savedStatus);

  const monthlyPanel=make('section','review-monthly','<h3>今月のテーマ</h3><p id="review-monthly-text"></p><p class="form-note">月とテーマに合わせたオリジナルの固定文です。未来の予測ではありません。</p>');
  monthlyPanel.hidden=true;
  memoDisplay.after(monthlyPanel);
  function refreshMonthly(){
    const messages=monthlyGuidance[selectedTheme];
    const month=Number(tokyoDay().slice(5,7))-1;
    monthlyPanel.hidden=!messages;
    if(messages)document.getElementById('review-monthly-text').textContent=messages[month];
  }
  const monthlyGuidance={
   love:[
   '今月は、言葉にしきれていない希望を見つける時間。理想よりも、安心して話せる関係を思い描いて。',
   '今月は、自分らしい距離感を大切に。連絡の回数より、話せたときの心地よさを見つめて。',
   '今月は、小さな出会いや会話を丁寧に。大きな変化を求めなくてもいいのです。',
   '今月は、気持ちを伝える方法を整える時間。相手を変える言葉より、自分の希望を伝える言葉を。',
   '今月は、期待と事実を分けることを意識して。相手への想像に、自分を苦しめさせないで。',
   '今月は、関係の心地よさを確かめる時間。あなたが無理をせず笑える場面を探して。',
   '今月は、心の境界を守りながら近づくことを大切に。断ることも尊重の一部です。',
   '今月は、一緒に楽しめることを思い出して。未来の答えを急がなくてもいいのです。',
   '今月は、会話の中にある小さな違いを受け止める時間。すぐに一致しなくても大丈夫。',
   '今月は、伝えたいことをひとつに絞って。気持ちの整理を先にしても構いません。',
   '今月は、大切にしたい関係の形を見直して。寂しさと愛情を混ぜずに考えてみて。',
   '今月は、今年心が温かくなった瞬間を振り返って。来月へ持っていきたいものを選んで。'
   ],
   work:[
   '今月は、やることと抱え込まなくてよいことを整理して。役割の境界を見直す時間。',
   '今月は、毎日の工夫に目を向けて。小さな改善を記録すると次の手が見えます。',
   '今月は、学びたいことをひとつ選んで。全部を一度に変える必要はありません。',
   '今月は、仕事の目的と手順を確認して。曖昧さを減らすことも前進です。',
   '今月は、負担のかかり方を見直して。頑張り方だけでなく条件も大切に。',
   '今月は、今ある強みを言葉にして。得意な作業の共通点を探してみて。',
   '今月は、休息と挑戦のバランスを。無理のない配分を決めることから。',
   '今月は、新しい方法を小さく試す時間。成果より、確かめたいことを先に決めて。',
   '今月は、周囲と確認する機会を。期待される役割を言葉で合わせてみて。',
   '今月は、続けたい工夫とやめたい習慣を分けて。日々の負担を少し軽く。',
   '今月は、来年につながる経験を見直して。積み重ねたものを書き出してみて。',
   '今月は、一区切りの時期。できたことを確かめ、次へ残す課題をひとつに。'
   ],
   money:[
   '今月は、必要な支払いを把握する時間。大きな計画より、まず現状を見つめて。',
   '今月は、続けている契約を点検して。見直すなら条件をよく確かめてから。',
   '今月は、優先したい支出を考えて。減らすだけでなく残したいものも選んで。',
   '今月は、身近な数字を整理して。心配を大きくする前に、分かることを増やして。',
   '今月は、買い物の理由を見つめる時間。使う場面と予算を両方確かめて。',
   '今月は、楽しみと備えの釣り合いを考えて。無理のない形が長続きの助けに。',
   '今月は、慌てない買い物を意識して。迷うものはいったん保留でも構いません。',
   '今月は、使っていないものや契約を確認して。管理しやすさも大切です。',
   '今月は、先の支払予定をひとつ整理して。予算を知ることから安心をつくって。',
   '今月は、必要と欲しいの区別をやさしく。どちらも責めず、順序を決めて。',
   '今月は、一年間の支出の変化を振り返って。気づいたことを次の判断材料に。',
   '今月は、年末の予定を確認して。気分や占いだけで大きな支出を決めないで。'
   ],
   general:[
   '今月は、自分のペースを思い出して。始める前に、続けたい暮らしを確かめて。',
   '今月は、人との関わり方を見つめて。心地よい距離にはあなたの基準があっていい。',
   '今月は、小さな好奇心を大切に。できる範囲でひとつ試してみて。',
   '今月は、変えることと守ることを分けて。全部を新しくする必要はありません。',
   '今月は、心身の余白を見直して。後回しにしていた休息も予定に入れて。',
   '今月は、他人の期待と自分の希望を整理して。どちらも同じとは限りません。',
   '今月は、少し力を抜く練習を。すべてを完璧にこなさなくても大丈夫。',
   '今月は、普段の生活にある心地よさを確認して。大きな出来事だけが大切ではありません。',
   '今月は、学んだことを振り返って。今の自分に役立つものを一つ残して。',
   '今月は、伝えたいことを短い言葉に。無理に説明し尽くさなくても構いません。',
   '今月は、今年続けられたことを数えて。目立たない積み重ねにも目を向けて。',
   '今月は、手放したい負担と持ち越したい希望を分けて。来月の余白をつくって。'
   ]
  };

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
  document.querySelectorAll('[data-quick-theme]').forEach(button=>button.addEventListener('click',()=>{
    const date=tokyoDay();
    const theme=button.dataset.quickTheme;
    let hash=2166136261;
    for(const c of date+':'+theme)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    const card=cardCatalogue[hash%cardCatalogue.length];
    const words=readingFor(theme,card.id);
    const action=adviceFor(card.id);
    document.getElementById('review-quick-caption').textContent=date+' · '+themes[theme]+' · '+card.label+'のカード';
    document.getElementById('review-quick-title').textContent=words[0];
    const art=document.getElementById('review-quick-art');
    art.src='assets/card-'+card.file+'.webp';
    art.alt=card.label+'のカードのイラスト';
    document.getElementById('review-quick-body').textContent=words[1];
    document.getElementById('review-quick-advice').textContent='今日の小さな一歩：'+action;
    document.getElementById('review-quick-reason').textContent='日本時間の'+date+'と選んだ「'+themes[theme]+'」をもとに、15枚の中から「'+card.label+'」が決まる再現可能な仕組みです。カードの象徴と悩み別の独自メッセージを組み合わせています。未来の予知ではありません。';
    document.getElementById('review-quick-status').textContent='';
    quickRecord={date,theme:themes[theme],card:card.label,heading:words[0],action};
    setup.hidden=true;panel.hidden=false;
    document.getElementById('review-quick-title').focus();
  }));
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
  document.querySelectorAll('.cards button[data-card]').forEach(button=>button.addEventListener('click',()=>{renderMemo();refreshMonthly();updateReason();}));
  document.getElementById('journey-response').addEventListener('submit',()=>{renderMemo();refreshMonthly();updateReason();});
  ['journey-back','card-back'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{renderMemo();refreshMonthly();updateReason();}));
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
