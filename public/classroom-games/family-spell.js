(() => {
const words=[{word:'mother',emoji:'👩'},{word:'father',emoji:'👨'},{word:'sister',emoji:'👧'},{word:'grandmother',emoji:'👵'},{word:'grandfather',emoji:'👴'}];
const $=id=>document.getElementById(id);
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fresh(){return {index:0,used:[],order:words.map(w=>shuffle([...w.word].map((_,i)=>i))),results:[],completed:[],lastAction:'',startedAt:Date.now()}}
let state=fresh(),timer=null,audio=null;
function sound(frequency){try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);o.onended=()=>{o.disconnect();g.disconnect()}}catch{}}
function publish(){window.ClassroomBridge.publish()}
function schedule(){clearTimeout(timer);if(state.index<5&&state.used.length===words[state.index].word.length)timer=setTimeout(()=>{state.index++;state.used=[];state.lastAction=state.index===5?'Completed all five words':`Started ${words[state.index].word}`;render();publish()},1100)}
function choose(id){
 if(state.index>=5||state.used.includes(id))return;
 const word=words[state.index].word,position=state.used.length;if(position>=word.length)return;
 const letter=word[id],expected=word[position],correct=letter===expected;
 state.results.push({question:`${word}: letter ${position+1}`,studentAnswer:`${word} [${position+1}]: ${letter}`,correctAnswer:`${word} [${position+1}]: ${expected}`,isCorrect:correct,word,position:position+1,letter,expected});
 state.lastAction=`${word}: ${letter} ${correct?'✓':'→ '+expected+' (try again)'}`;
 if(correct){state.used.push(id);if(state.used.length===word.length&&!state.completed.includes(word))state.completed.push(word)}
 sound(correct?600+position*18:180);render();
 if(!correct)$('letters').querySelector(`[data-id="${id}"]`).classList.add('wrong');
 publish();schedule();
}
function render(){
 const finished=state.index===5;$('game').style.display=finished?'none':'';$('finish').classList.toggle('show',finished);$('progressText').textContent=`${Math.min(state.index+1,5)} / 5`;
 if(finished)return;
 const {word,emoji}=words[state.index];$('person').textContent=emoji;$('person').setAttribute('aria-label',word);$('slots').replaceChildren();$('letters').replaceChildren();
 [...word].forEach((ch,i)=>{const slot=document.createElement('div');slot.className='slot'+(i<state.used.length?' filled':'')+(state.used.length===word.length?' good':'');slot.textContent=i<state.used.length?ch:'';$('slots').append(slot)});
 for(const id of state.order[state.index]){const button=document.createElement('button');button.type='button';button.className='letter'+(state.used.includes(id)?' used':'');button.textContent=word[id];button.dataset.id=id;button.dataset.letter=word[id];button.disabled=state.used.includes(id)||state.used.length===word.length;button.onclick=()=>choose(id);$('letters').append(button)}
 $('correctMsg').textContent=state.used.length===word.length?`✓ This is my ${word}.`:'';
}
function restart(){clearTimeout(timer);const results=state.results;state={...fresh(),results,lastAction:'Restarted game'};render();publish()}
$('restartBtn').onclick=restart;$('playAgain').onclick=restart;render();
window.ClassroomBridge.init({restore(saved){
 if(saved&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=5&&Array.isArray(saved.used)&&Array.isArray(saved.results)&&Array.isArray(saved.completed)&&Array.isArray(saved.order)&&saved.order.length===5&&saved.order.every((order,i)=>Array.isArray(order)&&order.length===words[i].word.length&&new Set(order).size===order.length&&order.every(n=>Number.isInteger(n)&&n>=0&&n<words[i].word.length))&&new Set(saved.used).size===saved.used.length&&saved.used.every((n,i)=>saved.index<5&&Number.isInteger(n)&&n>=0&&n<words[saved.index].word.length&&words[saved.index].word[n]===words[saved.index].word[i])&&saved.completed.every(w=>words.some(x=>x.word===w)))state=saved;
 render();schedule();
},snapshot(){const current=words[state.index]?.word||'';return {state,details:{source:'family-spell',activityTitle:'My Family — Spell the Word',currentWord:current,answer:current.slice(0,state.used.length),position:state.used.length,round:Math.min(state.index+1,5),completed:state.completed,completedCount:state.completed.length,results:state.results,mistakes:state.results.filter(r=>!r.isCorrect).length,lastAction:state.lastAction,score:state.completed.length,total:5,status:state.completed.length===5?'completed':'in_progress',timeSeconds:Math.round((Date.now()-state.startedAt)/1000)}}}});
})();
