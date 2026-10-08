(() => {
  const letters=['B','C','D','E','P','T'];
  const custom={
    table:'<ellipse cx="250" cy="398" rx="168" ry="22" fill="#d8c9b0"/><path d="M112 206h32v184h-32zm244 0h32v184h-32z" fill="#986340"/><path d="M148 220h25v142h-25zm179 0h25v142h-25z" fill="#6e4830"/><path d="M78 150h344v80H78z" fill="#ba8452"/><path d="M78 150l44-36h256l44 36z" fill="#dbac74"/><path d="M78 150h344v20H78z" fill="#e7bc86"/>',
    eraser:'<g transform="rotate(-25 250 250)"><path d="M95 185h310v155H95z" fill="#b98384"/><path d="M95 160h310v155H95z" fill="#f1a6b9"/><path d="M95 160h118v155H95z" fill="#7aaaca"/><path d="M95 315h118v25H95z" fill="#5483a7"/><path d="M111 177h86v12h-86z" fill="#b9d8e8"/><path d="M227 177h160v12H227z" fill="#ffd1dc"/></g>',
    doll:'<path d="M177 130q0-70 73-70t73 70v72H177z" fill="#865632"/><circle cx="250" cy="148" r="64" fill="#f4cda9"/><path d="M189 129q25-9 37-43 20 36 85 43-3-61-62-61-53 0-60 61" fill="#865632"/><circle cx="229" cy="150" r="6" fill="#493b34"/><circle cx="272" cy="150" r="6" fill="#493b34"/><path d="M235 177q15 15 30 0" fill="none" stroke="#b8736c" stroke-width="5"/><path d="M207 213l-47 104m133-104 47 104" stroke="#f4cda9" stroke-width="28" stroke-linecap="round"/><path d="M224 324v69m53-69v69" stroke="#f4cda9" stroke-width="29" stroke-linecap="round"/><path d="M212 208h77l36 131H175z" fill="#a183c3"/><path d="M189 291h122v20H189z" fill="#dbc9ed"/><path d="M206 396h34m25 0h34" stroke="#80589e" stroke-width="24" stroke-linecap="round"/>'
  };
  const vocabulary=[['chair','🪑'],['book','📖'],['table',null],['eraser',null],['pencil','✏️'],['pen','🖊️'],['computer','💻'],['doll',null],['ball','⚽'],['car','🚗'],['train','🚂'],['bike','🚲']];
  function picture(word,emoji){const art=custom[word]||`<text x="250" y="315" text-anchor="middle" font-size="245" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji">${emoji}</text>`;return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" rx="56" fill="#efe7d7"/><circle cx="78" cy="82" r="34" fill="#ffffff66"/>${art}</svg>`)}
  const items=vocabulary.map(([word,emoji])=>({word,letter:word[0].toUpperCase(),image:picture(word,emoji)}));
  const loads=[items.slice(0,6),items.slice(6)];
  const $=id=>document.getElementById(id),train=$('train');
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function fresh(){return {load:0,loaded:[],selectedWord:null,results:[],actions:[],lastAction:'',order:loads.map(l=>shuffle(l.map(i=>i.word))),paused:false,departed:false,startedAt:Date.now()}}
  let state=fresh(),departureTimer,ghost=null,drag=null;
  function record(text){state.lastAction=text;state.actions.push({round:state.load+1,text,at:Date.now()})}
  function publish(){window.ClassroomBridge.publish()}
  function cleanDrag(){ghost?.remove();ghost=null;drag=null;document.querySelectorAll('.wagon.dragover').forEach(w=>w.classList.remove('dragover'))}
  function select(word){state.selectedWord=state.selectedWord===word?null:word;record(state.selectedWord?`Selected ${word}`:`Deselected ${word}`);document.querySelectorAll('.pic-card').forEach(c=>c.classList.toggle('selected',c.dataset.word===state.selectedWord));$('feedback').textContent=state.selectedWord?'Now click the wagon with the first letter.':'Choose a picture and find its first letter.';publish()}
  function attempt(word,letter){
    const item=loads[state.load].find(i=>i.word===word);if(!item||state.loaded.includes(word)||!letters.includes(letter))return;
    const correct=item.letter===letter;
    state.results.push({question:`First letter of ${word}`,studentAnswer:`${word} → ${letter}`,correctAnswer:`${word} → ${item.letter}`,isCorrect:correct,round:state.load+1});
    record(`${word} → ${letter}: ${correct?'correct':'try again'}`);state.selectedWord=null;
    if(correct)state.loaded.push(word);
    render();
    $('feedback').textContent=correct?`Caught it! ${word} → ${letter}`:'Not this wagon. Try again!';
    $('wordFlash').textContent=word;$('wordFlash').classList.add('show');
    if(!correct)train.querySelector(`[data-letter="${letter}"]`).classList.add('wrong');
    publish();
  }
  function buildTrain(){
    for(const letter of letters){
      const wagon=document.createElement('div');wagon.className='wagon';wagon.dataset.letter=letter;wagon.tabIndex=0;wagon.setAttribute('role','button');wagon.setAttribute('aria-label',`Wagon ${letter}`);
      wagon.innerHTML=`<div class="letter">${letter}</div><div class="cargo"></div><div class="wheel w1"></div><div class="wheel w2"></div>`;
      const use=()=>{if(state.selectedWord)attempt(state.selectedWord,letter);else{record(`Clicked wagon ${letter} (no picture selected)`);publish()}};
      wagon.onclick=use;wagon.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();use()}};
      wagon.ondragover=e=>{e.preventDefault();wagon.classList.add('dragover')};wagon.ondragleave=()=>wagon.classList.remove('dragover');
      wagon.ondrop=e=>{e.preventDefault();wagon.classList.remove('dragover');attempt(e.dataTransfer.getData('text/plain'),letter)};
      train.append(wagon);
    }
  }
  function renderCards(){
    cleanDrag();$('cards').replaceChildren();
    for(const word of state.order[state.load]){
      const item=items.find(i=>i.word===word),card=document.createElement('button');card.type='button';card.className='pic-card'+(state.loaded.includes(word)?' solved':'')+(state.selectedWord===word?' selected':'');card.dataset.word=word;card.draggable=true;card.disabled=state.loaded.includes(word);card.setAttribute('aria-label',word);
      card.innerHTML=`<img src="${item.image}" alt="${word}" draggable="false"><span class="tap-hint">↗</span>`;
      card.onclick=()=>select(word);
      card.ondragstart=e=>{e.dataTransfer.setData('text/plain',word);state.selectedWord=word;record(`Dragging ${word}`);publish()};card.ondragend=cleanDrag;
      card.onpointerdown=e=>{if(e.pointerType==='mouse')return;drag={word,startX:e.clientX,startY:e.clientY,moved:false};card.setPointerCapture(e.pointerId)};
      card.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>8&&!drag.moved){drag.moved=true;state.selectedWord=word;record(`Dragging ${word}`);publish();ghost=document.createElement('div');ghost.className='drag-ghost';ghost.innerHTML=`<img src="${item.image}" alt="">`;document.body.append(ghost)}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}};
      card.onpointerup=e=>{if(!drag)return;const moved=drag.moved;const wagon=document.elementFromPoint(e.clientX,e.clientY)?.closest('.wagon');cleanDrag();if(moved){e.preventDefault();card.onclick=null;if(wagon)attempt(word,wagon.dataset.letter);else{renderCards();publish()}}};
      card.onpointercancel=cleanDrag;$('cards').append(card);
    }
  }
  function render(){
    for(const letter of letters){const wagon=train.querySelector(`[data-letter="${letter}"]`),cargo=wagon.querySelector('.cargo');cargo.replaceChildren();wagon.classList.remove('wrong');const group=items.filter(i=>i.letter===letter);wagon.classList.toggle('ready',group.every(i=>state.loaded.includes(i.word)));
      for(const item of group){const slot=document.createElement('div');slot.className='cargo-slot';if(state.loaded.includes(item.word))slot.innerHTML=`<img src="${item.image}" alt="${item.word}">`;cargo.append(slot)}
    }
    $('loadedCount').textContent=state.loaded.length;$('progress').style.width=state.loaded.length/12*100+'%';$('loadTitle').textContent=`Load ${state.load+1} of 2 · 🚂 ${state.paused?'at the station':'moving'}`;
    train.classList.toggle('paused',state.paused);$('pauseBtn').textContent=state.paused?'Start train':'Pause train';train.classList.toggle('depart',state.departed);
    renderCards();$('loadOverlay').classList.toggle('show',loads[state.load].every(i=>state.loaded.includes(i.word)));
    if(state.departed){$('overlayTitle').textContent='Mission complete!';$('overlayText').textContent='All 12 school and toy words are on board!';$('nextLoadBtn').textContent='Play again'}
    else if(state.load===0){$('overlayTitle').textContent='Load 1 complete!';$('overlayText').textContent='Six pictures loaded. Six more are waiting at the station!';$('nextLoadBtn').textContent='Next load'}
    else{$('overlayTitle').textContent='The Word Train is ready!';$('overlayText').textContent='All 12 pictures are in the correct wagons.';$('nextLoadBtn').textContent='GO! 🚂'}
  }
  function restart(){clearTimeout(departureTimer);cleanDrag();const {results,actions}=state;state={...fresh(),results,actions};record('Restarted game');train.classList.remove('depart');render();publish()}
  $('nextLoadBtn').onclick=()=>{
    if(state.departed){restart();return}
    if(state.load===0){state.load=1;record('Started load 2');render();publish();return}
    state.departed=true;record('Train departed');render();$('loadOverlay').classList.remove('show');publish();departureTimer=setTimeout(()=>{$('loadOverlay').classList.add('show')},2400);
  };
  $('shuffleBtn').onclick=()=>{state.order[state.load]=shuffle(state.order[state.load]);state.selectedWord=null;record('Shuffled pictures');renderCards();publish()};
  $('restartBtn').onclick=restart;
  $('pauseBtn').onclick=()=>{state.paused=!state.paused;record(state.paused?'Paused train':'Started train');render();publish()};
  buildTrain();train.classList.add('looping');render();
  window.ClassroomBridge.init({restore(saved){
    if(saved&&[0,1].includes(saved.load)&&Array.isArray(saved.loaded)&&saved.loaded.every(w=>items.some(i=>i.word===w))&&new Set(saved.loaded).size===saved.loaded.length&&Array.isArray(saved.results)&&Array.isArray(saved.actions)&&Array.isArray(saved.order)&&saved.order.length===2&&saved.order.every((l,index)=>Array.isArray(l)&&l.length===6&&new Set(l).size===6&&l.every(w=>loads[index].some(i=>i.word===w))))state=saved;render();
  },snapshot(){return {state,details:{source:'word-train',activityTitle:'Word Train — School & Toys',round:state.load+1,selectedWord:state.selectedWord,loaded:state.loaded,completedCount:state.loaded.length,mistakes:state.results.filter(r=>!r.isCorrect).length,lastAction:state.lastAction,actions:state.actions,results:state.results,score:state.loaded.length,total:12,status:state.loaded.length===12?'completed':'in_progress',timeSeconds:Math.round((Date.now()-state.startedAt)/1000)}}}});
})();
