const colours=[{name:'pink',hex:'#ef83bd'},{name:'orange',hex:'#f7a348'},{name:'yellow',hex:'#f4d954'},{name:'red',hex:'#ee6a45'},{name:'blue',hex:'#58a7d7'},{name:'green',hex:'#8bcf5c'},{name:'purple',hex:'#8b69b8'}];
const names=colours.map(c=>c.name);
const $=id=>document.getElementById(id);
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fresh(){return {round:1,selectedWord:null,matched:[],popped:[],order1:shuffle(names),order2:shuffle(names),bank:shuffle(names),results:[],actions:[],lastAction:'',startedAt:Date.now()}}
let state=fresh();
function record(text){state.lastAction=text;state.actions.push({round:state.round,text,at:Date.now()})}
function publish(){window.ClassroomBridge.publish()}
function splat(name,label=''){const c=colours.find(c=>c.name===name);return `<div class="splat" style="background:${c.hex}"><i></i><b></b><span class="label">${label}</span></div>`}
function choose(word){state.selectedWord=state.selectedWord===word?null:word;record(state.selectedWord?`Selected ${word}`:`Deselected ${word}`);render();publish()}
function attempt(name,word){
  if(state.matched.includes(name))return;
  if(!names.includes(word)){record(`Clicked ${name} (no word selected)`);publish();return}
  const isCorrect=name===word;
  state.results.push({round:1,question:`Match ${name}`,studentAnswer:word,correctAnswer:name,isCorrect});
  record(`${word} → ${name}: ${isCorrect?'correct':'try again'}`);
  if(isCorrect){state.matched.push(name);state.selectedWord=null}
  render();
  if(!isCorrect)$('grid1').querySelector(`[data-colour="${name}"]`).classList.add('wrong');
  publish();
}
function pop(name){
  if(state.popped.includes(name))return;
  state.popped.push(name);record(`Said and clicked ${name}`);
  state.results.push({round:2,question:'Say the colour, then click',studentAnswer:name,correctAnswer:name,isCorrect:true,assessment:'self-reported'});
  render();publish();
}
function render(){
  $('round1').classList.toggle('active',state.round===1);$('round2').classList.toggle('active',state.round===2);$('roundPill').textContent=`ROUND ${state.round}`;
  $('score1').textContent=`${state.matched.length} / 7`;$('score2').textContent=`${7-state.popped.length} left`;
  $('grid1').replaceChildren();$('bank').replaceChildren();$('grid2').replaceChildren();
  for(const name of state.order1){
    const card=document.createElement('div');card.className='card'+(state.matched.includes(name)?' correct':'');card.dataset.colour=name;card.innerHTML=splat(name,state.matched.includes(name)?name:'');
    card.onclick=()=>attempt(name,state.selectedWord);card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();attempt(name,e.dataTransfer.getData('text/plain'))};$('grid1').append(card);
  }
  for(const name of state.bank){
    const chip=document.createElement('div');chip.className='chip'+(state.matched.includes(name)?' used':'')+(state.selectedWord===name?' selected':'');chip.textContent=name;chip.dataset.word=name;chip.draggable=true;
    chip.onclick=()=>choose(name);chip.ondragstart=e=>{e.dataTransfer.setData('text/plain',name);state.selectedWord=name;record(`Dragging ${name}`);for(const other of $('bank').children)other.classList.toggle('selected',other.dataset.word===name);publish()};$('bank').append(chip);
  }
  for(const name of state.order2){const card=document.createElement('div');card.className='card';card.dataset.colour=name;card.innerHTML=splat(name);if(state.popped.includes(name)){card.style.visibility='hidden';card.style.pointerEvents='none'}card.onclick=()=>pop(name);$('grid2').append(card)}
  const done1=state.round===1&&state.matched.length===7,done2=state.round===2&&state.popped.length===7;
  $('overlay').classList.toggle('show',done1||done2);
  if(done1){$('mTitle').textContent='Great job!';$('mText').textContent='You know the colours!';$('mLaugh').textContent='Ha-ha-ha! Too easy!';$('mBtn').textContent='Round 2 →';$('mBtn').onclick=()=>{state.round=2;record('Started round 2');render();publish()}}
  if(done2){$('mTitle').textContent='COLOUR MASTER! 🎨';$('mText').textContent='You got them all!';$('mLaugh').textContent='Ha-ha-ha! Very good!';$('mBtn').textContent='Play again';$('mBtn').onclick=restart}
}
function restart(){const {results,actions}=state;state={...fresh(),results,actions};record('Restarted game');render();publish()}
$('restart').onclick=restart;
render();
window.ClassroomBridge.init({
  restore(saved){if(saved&&[1,2].includes(saved.round)&&['matched','popped','results','actions','order1','order2','bank'].every(k=>Array.isArray(saved[k]))&&['order1','order2','bank'].every(k=>saved[k].length===7&&new Set(saved[k]).size===7&&saved[k].every(n=>names.includes(n))))state=saved;render()},
  snapshot(){return {state,details:{source:'cheshire-colours',activityTitle:"Cheshire Cat's Colour Challenge",round:state.round,selectedWord:state.selectedWord,matched:state.matched,popped:state.popped,actions:state.actions,lastAction:state.lastAction,results:state.results,mistakes:state.results.filter(r=>!r.isCorrect).length,score:state.matched.length+state.popped.length,total:14,completedCount:state.matched.length+state.popped.length,status:state.popped.length===7?'completed':'in_progress',timeSeconds:Math.round((Date.now()-state.startedAt)/1000)}}
}});
