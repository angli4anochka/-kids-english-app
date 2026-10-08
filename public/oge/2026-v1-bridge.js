(() => {
  const part=window.OGE_PART,root=document.getElementById('exam'),screens=[...root.querySelectorAll('.screen')],tabs=document.getElementById('tabs');
  const labels=['1–4','5–11','12','13–19','20–28','29–34','35'];
  const controls=[...root.querySelectorAll('input[type="radio"],[data-key]')],ids=[...new Set(controls.map(el=>el.dataset.key||el.name))];
  const $=id=>document.getElementById(id);let context=null,state={},completed=false,revision=0,current=0,timer=null,started=Date.now();
  const localKey=()=>context?'oge2026-v1:'+context.storageKey:null;
  function show(index){current=Math.max(0,Math.min(screens.length-1,index));screens.forEach((s,i)=>{s.classList.toggle('active',i===current);if(i!==current)s.querySelectorAll('audio').forEach(a=>a.pause())});[...tabs.children].forEach((b,i)=>b.classList.toggle('active',i===current));$('prevBtn').disabled=current===0;$('nextBtn').disabled=current===screens.length-1;window.scrollTo({top:0,behavior:'smooth'})}
  screens.forEach((s,i)=>{const button=document.createElement('button');button.type='button';button.className='tab';button.textContent=labels[Number(s.dataset.screen)];button.onclick=()=>show(i);tabs.append(button)});
  function rows(){return ids.map((key,index)=>{
    const el=controls.find(el=>(el.dataset.key||el.name)===key),value=String(state[key]||'');
    const container=el.closest('.q-body,.grammar-row,.info-table tr');
    let prompt=container?.innerText.trim()||('Сопоставление '+key.replace('q','').replace('_',' · '));
    if(key==='q35')prompt='Письмо Duncan: Learning English';
    return {questionIndex:index,questionLabel:key.replace(/^q/,'').replace('_',''),answerKey:key,prompt,studentAnswer:value,correctAnswer:'Проверяет учитель',isCorrect:null,pendingReview:true,answered:!!value.trim()};
  })}
  function update(){
    $('progress').textContent=ids.filter(id=>String(state[id]||'').trim()).length+' / '+ids.length;
    const wordCount=$('wordCount');if(wordCount){const count=(String(state.q35||'').trim().match(/\S+/g)||[]).length;wordCount.textContent=count+' words';wordCount.classList.toggle('good',count>=100&&count<=120)}
    for(const q of [5,12]){const warn=$('warn'+q);if(warn){const values=ids.filter(id=>id.startsWith('q'+q+'_')).map(id=>state[id]).filter(Boolean);warn.classList.toggle('show',new Set(values).size!==values.length)}}
  }
  function saveLocal(unsynced){if(!context||context.isTeacher)return;try{localStorage.setItem(localKey(),JSON.stringify({answers:state,completed,started,unsynced}))}catch{}}
  function persist(){if(!context||context.isTeacher)return;saveLocal(true);$('saveStatus').textContent='Сохранение…';parent.postMessage({type:'oge-reading-progress',revision:++revision,results:rows(),answers:{...state},score:0,total:0,completed,status:completed?'completed':'in_progress',timeSeconds:Math.round((Date.now()-started)/1000)},location.origin)}
  function lock(){controls.forEach(el=>el.disabled=!context||completed);$('clearBtn').disabled=!context||completed;$('finishBtn').disabled=!context||completed;$('finishBtn').textContent=completed?'Отправлено учителю':part==='writing'?'Отправить письмо':'Завершить часть'}
  function changed(el,immediate){if(!context||completed)return;const key=el.dataset.key||el.name;if(el.type==='radio'&&!el.checked)return;state[key]=el.value;update();saveLocal(true);clearTimeout(timer);if(immediate)persist();else timer=setTimeout(persist,350)}
  controls.forEach(el=>{el.addEventListener('input',()=>changed(el,false));el.addEventListener('change',()=>changed(el,true))});
  $('prevBtn').onclick=()=>show(current-1);$('nextBtn').onclick=()=>show(current+1);
  $('clearBtn').onclick=()=>{if(!context||completed||!confirm('Очистить ответы этой части?'))return;state={};controls.forEach(el=>{if(el.type==='radio')el.checked=false;else el.value=''});update();clearTimeout(timer);persist()};
  $('finishBtn').onclick=()=>{if(!ids.some(id=>String(state[id]||'').trim())){$('saveStatus').textContent='Сначала введите ответы';return}const missing=ids.filter(id=>!String(state[id]||'').trim()).length;if(missing&&!confirm('Не заполнено ответов: '+missing+'. Всё равно завершить часть?'))return;completed=true;clearTimeout(timer);persist();lock();if(context.isTeacher)$('saveStatus').textContent='Предпросмотр учителя — результат не отправляется'};
  $('downloadBtn').onclick=()=>{const text=['1 вариант ОГЭ 2026',...rows().map(r=>r.questionLabel+'. '+r.studentAnswer)].join('\n');const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='OGE_2026_Variant_1_'+part+'_answers.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin)return;const data=event.data;
    if(data?.type==='oge-reading-context'){
      if(context?.storageKey===data.storageKey)return;context=data;state={};completed=false;started=Date.now();
      let local=null;try{local=JSON.parse(localStorage.getItem(localKey())||'null')}catch{}
      const server=data.saved,useLocal=!data.isTeacher&&local&&(!server||local.unsynced&&!server.completed),saved=data.isTeacher?null:useLocal?local:server;
      if(saved){state=saved.answers||Object.fromEntries((saved.results||[]).map(r=>[r.answerKey||'q'+r.questionLabel.replace(/(\d+)([A-F])$/,'$1_$2'),r.studentAnswer]));completed=!!saved.completed;started=saved.started||Date.now()-(saved.timeSeconds||0)*1000}
      controls.forEach(el=>{const key=el.dataset.key||el.name;if(el.type==='radio')el.checked=String(state[key])===el.value;else el.value=state[key]||''});
      $('mode').hidden=!data.isTeacher;$('saveStatus').textContent=data.isTeacher?'Предпросмотр учителя':completed?'Ответы сохранены · ожидают проверки':'Ответы сохраняются автоматически';update();lock();
      if(useLocal&&(!server||local.unsynced))persist();else saveLocal(false);
    }
    if(data?.type==='oge-reading-save-status'&&data.revision===revision){if(data.ok)saveLocal(false);$('saveStatus').textContent=data.ok?(completed?'Ответы сохранены · ожидают проверки':'Ответы сохранены'):'Не удалось сохранить · повторяем…'}
  });
  addEventListener('pagehide',()=>{clearTimeout(timer);if(!context||context.isTeacher)return;let saved;try{saved=JSON.parse(localStorage.getItem(localKey())||'null')}catch{}if(saved?.unsynced)persist()});
  update();show(0);lock();parent.postMessage({type:'oge-reading-ready'},location.origin);
})();
