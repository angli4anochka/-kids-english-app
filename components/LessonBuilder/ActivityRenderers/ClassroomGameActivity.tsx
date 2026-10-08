'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { SpotlightActivityProps } from './SpotlightIframeActivity';
type Kind = 'thief-numbers' | 'feelings-memory' | 'family-spell' | 'word-train' | 'cheshire-colours' | 'paint-school' | 'numbers-bingo' | 'island-friends' | 'find-monster';
const colours: Record<string,string> = {pink:'#ff8fbc',purple:'#a26bff',blue:'#58b2ff',green:'#65ca89',yellow:'#f2d84f',orange:'#ff9d4d',red:'#ff6666'};

export default function ClassroomGameActivity({kind,isTeacher,lessonId,activityId,sessionId,groupId,socket,isConnected}:SpotlightActivityProps & {kind:Kind}) {
  const {user,token}=useAuth(); const iframe=useRef<HTMLIFrameElement>(null);
  const [students,setStudents]=useState<any[]>([]); const [error,setError]=useState(''); const [showStudents,setShowStudents]=useState(true);
  useEffect(()=>{
    let stopped=false, pending:any=null, saving=false, retry:ReturnType<typeof setTimeout>|undefined, poll:ReturnType<typeof setTimeout>|undefined;
    let shared:any=null,lastVersion='',commandBusy=false;
    const post=(data:any)=>iframe.current?.contentWindow?.postMessage(data,window.location.origin);
    const context=()=>{post({type:'classroom-game-context',isTeacher:!!isTeacher,storageKey:`${kind}:${user?.id||'preview'}:${sessionId||'self-study'}:${lessonId}:${activityId}`});if(shared)post({type:'classroom-game-shared',state:shared})};
    const stateUrl=`/kids-api/live-sessions/${sessionId}/games/${activityId}`;
    const applyShared=(state:any)=>{if(!state)return;shared=state;const version=`${state.roundId}:${state.version}`;if(version!==lastVersion){lastVersion=version;post({type:'classroom-game-shared',state})}};
    const flush=async()=>{
      if(saving||!pending||isTeacher||!user?.id||!lessonId||!activityId)return;
      const data=pending;pending=null;saving=true;let ok=false;
      const payload={lessonId,activityId,studentId:user.id,studentName:user.displayName||user.username||'Ученик',groupId,score:data.score,status:data.status,details:data};
      try{const r=await fetch(`/kids-api/live-sessions/${sessionId||'none'}/results`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true});const json=await r.json();if(!r.ok||!json.success)throw Error('save');ok=true;post({type:'classroom-game-save-status',revision:data.revision,ok:true});if(socket&&isConnected&&groupId!=null)socket.emit('activity-result',{...payload,sessionId,results:data.results,total:data.total});}
      catch{if(!pending)pending=data;post({type:'classroom-game-save-status',revision:data.revision,ok:false});if(!stopped)retry=setTimeout(()=>{retry=undefined;void flush()},2000)}
      finally{saving=false;if(pending&&!retry&&(!stopped||ok))void flush()}
    };
    const pollState=async()=>{
      try{
        if(kind==='numbers-bingo'&&sessionId&&activityId){const r=await fetch(stateUrl,{cache:'no-store'});const j=await r.json();if(!r.ok||!j.success)throw Error('state');if(!stopped)applyShared(j.data)}
        if(isTeacher&&lessonId&&activityId){const url=sessionId?`/kids-api/live-sessions/${sessionId}/results`:`/kids-api/lessons/${lessonId}/results`;const r=await fetch(url,{cache:'no-store'});const j=await r.json();if(!r.ok||!j.success)throw Error('results');const byStudent=new Map();for(const row of j.data||[]){if(row.activity_id!==activityId)continue;const details=typeof row.details==='string'?JSON.parse(row.details):row.details;if(details?.source!==kind)continue;const key=String(row.student_id||row.student_name);const previous=byStudent.get(key);if(!previous||new Date(row.updated_at||row.created_at)>new Date(previous.updated_at||previous.created_at))byStudent.set(key,{...row,details})}if(!stopped)setStudents([...byStudent.values()])}
        if(!stopped)setError('');
      }catch{if(!stopped)setError('Нет связи с сервером. Повторяем подключение…')}
      finally{if(!stopped)poll=setTimeout(pollState,1500)}
    };
    const receive=async(event:MessageEvent)=>{
      if(event.source!==iframe.current?.contentWindow||event.origin!==window.location.origin)return;
      const data=event.data;
      if(data?.type==='classroom-game-ready'){context();return}
      if(data?.type==='classroom-game-progress'&&!isTeacher&&data.source===kind&&Array.isArray(data.results)){pending=data;if(retry){clearTimeout(retry);retry=undefined}void flush()}
      if(data?.type==='classroom-game-command'&&isTeacher&&kind==='numbers-bingo'&&!commandBusy){
        if(!sessionId){setError('Запустите живой урок, чтобы вызывать числа для учеников.');return}
        commandBusy=true;
        try{const r=await fetch(stateUrl,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||''}`},body:JSON.stringify({action:data.action})});const j=await r.json();if(!r.ok||!j.success)throw Error('command');applyShared(j.data);setError('')}
        catch{setError('Не удалось вызвать число. Повторите попытку.')}
        finally{commandBusy=false}
      }
    };
    window.addEventListener('message',receive);const element=iframe.current;element?.addEventListener('load',context);context();void pollState();
    return()=>{stopped=true;window.removeEventListener('message',receive);element?.removeEventListener('load',context);if(poll)clearTimeout(poll);if(retry)clearTimeout(retry);retry=undefined;if(pending&&!saving)void flush()};
  },[kind,isTeacher,lessonId,activityId,sessionId,groupId,user?.id,user?.displayName,user?.username,token,socket,isConnected]);
  return <div className="flex h-full min-h-0 w-full flex-col bg-slate-50">
    {isTeacher&&<div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-sm"><strong>Экран учителя · {kind==='thief-numbers'?'Thief — Random Numbers 1–10':kind==='feelings-memory'?'Feelings — Word + Picture Memory':kind==='family-spell'?'My Family — Spell the Word':kind==='word-train'?'Word Train — School & Toys':kind==='cheshire-colours'?'Cheshire Colour Challenge':kind==='paint-school'?'Цвета и предметы':kind==='island-friends'?'Island Friends':kind==='find-monster'?'Find the Monster':'Numbers Bingo'}</strong><button className="rounded-lg bg-violet-100 px-3 py-1 text-violet-800" onClick={()=>setShowStudents(!showStudents)}>{showStudents?'Скрыть ответы':'Ответы учеников'} ({students.length})</button></div>}
    {error&&<div role="alert" className="shrink-0 bg-amber-50 px-3 py-1 text-xs text-amber-800">{error}</div>}
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <iframe ref={iframe} title={kind==='thief-numbers'?'Thief — Random Numbers 1–10':kind==='feelings-memory'?'Feelings — Word + Picture Memory':kind==='family-spell'?'My Family — Spell the Word':kind==='word-train'?'Word Train — School & Toys':kind==='cheshire-colours'?'Cheshire Colour Challenge':kind==='paint-school'?'Paint the School Colours':kind==='island-friends'?'Island Friends — Find the Pair!':kind==='find-monster'?'Find the Monster':'Numbers Bingo 1–10'} src={kind==='find-monster'?'/classroom-games/find-monster.html':`/classroom-games/${kind}.html`} className="min-h-0 min-w-0 flex-1 border-0" />
      {isTeacher&&showStudents&&<aside className="max-h-[35%] w-full shrink-0 overflow-auto border-t border-violet-100 bg-white p-3 lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
        <h3 className="mb-2 text-sm font-bold text-violet-900">Выбор учеников</h3>
        {!students.length&&<p className="text-xs text-slate-500">Ответы появятся, когда ученики откроют этот этап.</p>}
        {students.map(row=><div key={row.student_id||row.student_name} className="mb-3 rounded-xl border border-violet-100 p-3 text-xs">
          <div className="mb-2 font-bold text-slate-800">{row.student_name}</div>
          {kind==='find-monster'?<><div>Раунд: {row.details.round||0}/4</div><div>Выбрал: {row.details.selected||'—'}</div><div>Правильных: {row.details.correctCount||0} · Ошибок: {row.details.wrongCount||0}</div><div>{row.details.status==='completed'?'Завершено':'В процессе'}</div></>:kind==='thief-numbers'?<><div>Текущее число: {row.details.currentNumber||'—'}</div><div>Выделено: {row.details.selected?'Да':'Нет'}</div><div>Показано: {row.details.completedCount||0}/10</div><div>Порядок: {(row.details.shown||[]).join(', ')||'—'}</div><div className="mt-2 font-semibold">Последнее действие: {row.details.lastAction||'—'}</div><details className="mt-2"><summary>Нажатия ({row.details.actions?.length||0})</summary>{(row.details.actions||[]).map((a:any,i:number)=><div key={i}>{a.text}</div>)}</details></>:kind==='feelings-memory'?<><div>Открыто: {(row.details.openCards||[]).map((c:any)=>`${c.word} (${c.type==='word'?'слово':'картинка'})`).join(' + ')||'—'}</div><div>Пары: {row.details.completedCount||0}/6</div><div>Ходы: {row.details.moves||0} · Ошибки: {row.details.mistakes||0}</div><div>{(row.details.matchedWords||[]).join(', ')}</div><div className="mt-2 font-semibold">Последнее действие: {row.details.lastAction||'—'}</div></>:kind==='family-spell'?<><div>Слово: {row.details.currentWord||'Все слова собраны'}</div><div>Ответ: {row.details.answer||'—'}</div><div>Собрано: {row.details.completedCount||0}/5</div><div>Ошибки: {row.details.mistakes||0}</div><div className="mt-1">{(row.details.completed||[]).join(', ')}</div><div className="mt-2 font-semibold">Последнее действие: {row.details.lastAction||'—'}</div></>:kind==='word-train'?<><div>Заход: {row.details.round||1}/2 · {row.details.status==='completed'?'Завершено':'В процессе'}</div><div>Выбрано: {row.details.selectedWord||'—'}</div><div>Загружено: {row.details.completedCount||0}/12</div><div className="mt-1">{(row.details.loaded||[]).join(', ')}</div><div>Ошибки: {row.details.mistakes||0}</div><div className="mt-2 font-semibold">Последнее действие: {row.details.lastAction||'—'}</div></>:kind==='cheshire-colours'?<><div>Раунд: {row.details.round||1} · {row.details.status==='completed'?'Завершено':'В процессе'}</div><div>Выбрано: {row.details.selectedWord||'—'}</div><div>Совпадения: {row.details.matched?.length||0}/7</div><div>Исчезли: {(row.details.popped||[]).join(', ')||'—'}</div><div>Ошибки: {row.details.mistakes||0}</div><div className="mt-2 font-semibold">Последнее действие: {row.details.lastAction||'—'}</div><details className="mt-2"><summary>Нажатия ({row.details.actions?.length||0})</summary>{(row.details.actions||[]).map((a:any,i:number)=><div key={i} className="mt-1">Раунд {a.round}: {a.text}</div>)}</details></>:kind==='island-friends'?<><div>Пары: {row.details.completedCount||0}/7</div><div>Ходы: {row.details.moves||0} · Ошибки: {row.details.mistakes||0}</div><div>Раунд: {row.details.round||1} · {row.details.status==='completed'?'Завершено':'В процессе'}</div><div>Время: {row.details.timeSeconds||0} с</div></>:kind==='paint-school'?<><div className="mb-2 flex items-center gap-2">Кисть: <span className="inline-block h-4 w-4 rounded-full border" style={{background:colours[row.details.selectedColour]||'#eee'}}/>{row.details.selectedColour||'цвет ещё не выбран'}</div><div>Раскрашено: {row.details.completedCount||0}/7</div><div className="mt-1 flex flex-wrap gap-1">{Object.entries(row.details.painted||{}).map(([word,colour])=><span key={word} className="rounded px-2 py-1 text-slate-900" style={{background:String(colour)}}>{word}</span>)}</div></>:<><div>Отметил: {(row.details.marked||[]).join(', ')||'—'}</div><div className="mt-1 grid grid-cols-3 gap-1">{(row.details.card||[]).map((n:number)=><span key={n} className={`rounded p-1 text-center ${(row.details.marked||[]).includes(n)?'bg-green-100 text-green-800':'bg-slate-100'}`}>{n}</span>)}</div>{row.details.bingo&&<strong className="mt-2 block text-green-700">BINGO!</strong>}</>}
          <details className="mt-2"><summary className="cursor-pointer text-violet-700">Все попытки ({row.details.results?.length||0})</summary>{(row.details.results||[]).map((answer:any,i:number)=><div key={i} className={`mt-1 rounded p-2 ${answer.isCorrect?'bg-green-50 text-green-800':'bg-red-50 text-red-800'}`}>{answer.isCorrect?'✓':'✗'} {answer.studentAnswer}{!answer.isCorrect&&<span className="block">Нужно: {answer.correctAnswer}</span>}</div>)}</details>
        </div>)}
      </aside>}
    </div>
  </div>;
}
export function ThiefNumbersActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="thief-numbers"/>}
export function FeelingsMemoryActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="feelings-memory"/>}
export function FamilySpellActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="family-spell"/>}
export function WordTrainActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="word-train"/>}
export function CheshireColoursActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="cheshire-colours"/>}
export function IslandFriendsActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="island-friends"/>}
export function PaintSchoolActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="paint-school"/>}
export function NumbersBingoActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="numbers-bingo"/>}
export function FindMonsterActivity(props:SpotlightActivityProps){return <ClassroomGameActivity {...props} kind="find-monster"/>}
