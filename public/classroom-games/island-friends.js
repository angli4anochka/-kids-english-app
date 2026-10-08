(() => {
  const pairs = [
    {id:1,en:'ugly',ru:'некрасивый'}, {id:2,en:'sad',ru:'грустный'},
    {id:3,en:'beautiful',ru:'красивый'}, {id:4,en:'old',ru:'старый'},
    {id:5,en:'happy',ru:'счастливый / весёлый'}, {id:6,en:'young',ru:'молодой / юный'},
    {id:7,en:'These are my friends!',ru:'Это мои друзья!'}
  ];
  const bridge=window.ClassroomBridge, $=id=>document.getElementById(id);
  let deck=[],matchedIds=[],attempts=[],first=null,locked=false,timer=null,round=1,moves=0,elapsed=0,startedAt=null;
  const seconds=()=>Math.round((elapsed+(startedAt===null?0:Date.now()-startedAt))/1000);
  function shuffle(){return pairs.flatMap(p=>[{id:p.id,lang:'en'},{id:p.id,lang:'ru'}]).map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v)}
  function render(){
    $('board').replaceChildren();
    for(const item of deck){
      const p=pairs.find(p=>p.id===item.id), card=document.createElement('div');
      card.className='card'+(matchedIds.includes(item.id)?' matched':'');card.dataset.id=item.id;card.dataset.lang=item.lang;
      card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Открыть карточку '+(item.lang==='en'?'EN':'RU'));
      card.innerHTML=`<div class="card-inner"><div class="face front">🌴</div><div class="face back"><span class="badge">${item.lang.toUpperCase()}</span><span>${p[item.lang]}</span></div></div>`;
      card.onclick=()=>flip(card);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(card)}};
      $('board').append(card);
    }
    $('pairs').textContent=matchedIds.length;$('moves').textContent=moves;
    $('win').classList.toggle('show',matchedIds.length===7);
  }
  function publish(){if(!bridge.context?.isTeacher)$('saveStatus').textContent='Сохраняем…';bridge.publish()}
  function flip(card){
    if(!bridge.context||locked||card.classList.contains('open')||card.classList.contains('matched'))return;
    if(startedAt===null&&matchedIds.length<7)startedAt=Date.now();
    card.classList.add('open');
    if(!first){first=card;$('message').textContent='Теперь найди перевод 👀';return}
    const a=pairs.find(p=>p.id===Number(first.dataset.id)),b=pairs.find(p=>p.id===Number(card.dataset.id));
    const correct=a.id===b.id&&first.dataset.lang!==card.dataset.lang;
    moves++;
    attempts.push({questionIndex:attempts.length,questionLabel:`Раунд ${round}, ход ${moves}`,prompt:'Найди перевод: '+a[first.dataset.lang],studentAnswer:a[first.dataset.lang]+' — '+b[card.dataset.lang],correctAnswer:a.en+' — '+a.ru,isCorrect:correct,round});
    $('moves').textContent=moves;
    if(correct){
      matchedIds.push(a.id);first.classList.remove('open');card.classList.remove('open');first.classList.add('matched');card.classList.add('matched');first=null;
      $('pairs').textContent=matchedIds.length;$('message').textContent='Правильно! 🎉';
      if(matchedIds.length===7){elapsed+=Date.now()-startedAt;startedAt=null;timer=setTimeout(()=>$('win').classList.add('show'),450)}
    }else{
      locked=true;const previous=first;first=null;$('message').textContent='Не пара. Попробуй ещё 🙂';
      timer=setTimeout(()=>{previous.classList.remove('open');card.classList.remove('open');locked=false;$('message').textContent='Найди следующую пару 🌴'},900);
    }
    publish();
  }
  window.closeWin=()=>$('win').classList.remove('show');
  window.newGame=()=>{if(!bridge.context)return;clearTimeout(timer);round++;moves=0;matchedIds=[];first=null;locked=false;elapsed=0;startedAt=null;deck=shuffle();render();$('message').textContent='Найди первую пару 🌴';publish()};
  bridge.init({
    restore(saved,context){
      clearTimeout(timer);first=null;locked=false;
      const valid=saved&&Array.isArray(saved.deck)&&saved.deck.length===14&&new Set(saved.deck.map(c=>c.id+':'+c.lang)).size===14&&saved.deck.every(c=>pairs.some(p=>p.id===c.id)&&['en','ru'].includes(c.lang));
      deck=valid?saved.deck:shuffle();matchedIds=valid&&Array.isArray(saved.matchedIds)?[...new Set(saved.matchedIds.filter(id=>pairs.some(p=>p.id===id)))]:[];
      attempts=valid&&Array.isArray(saved.attempts)?saved.attempts:[];round=valid?saved.round||1:1;moves=valid?saved.moves||0:0;elapsed=valid?saved.elapsed||0:0;startedAt=null;
      $('saveStatus').textContent=context.isTeacher?'Режим учителя · пробная игра':'Подключено';render();
    },
    snapshot(){
      const timeSeconds=seconds();
      return {state:{deck,matchedIds,attempts,round,moves,elapsed:timeSeconds*1000},details:{source:'island-friends',activityTitle:'Island Friends — Find the Pair!',results:attempts,score:attempts.filter(a=>a.isCorrect).length,total:attempts.length,status:matchedIds.length===7?'completed':'in_progress',completedCount:matchedIds.length,moves,mistakes:attempts.filter(a=>a.round===round&&!a.isCorrect).length,round,timeSeconds}};
    }
  });
  addEventListener('pagehide',()=>{clearTimeout(timer);bridge.publish()});
})();
