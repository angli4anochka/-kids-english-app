'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useInteractivePageSync({enabled,pageCount,sessionId,activityId,isTeacher,src}: {
  enabled:boolean;pageCount:number;sessionId?:string;activityId:string;isTeacher:boolean;src:string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const {token} = useAuth();
  const [error,setError] = useState('');
  useEffect(() => {
    setError('');
    if (!enabled || !src) return;
    let origin:string;
    try {origin=new URL(src,window.location.href).origin;} catch {return;}
    const live=!!sessionId;
    const url=`/kids-api/live-sessions/${sessionId}/interactive-pages/${activityId}`;
    let stopped=false,page=0,version=-1,dirty=false,pending:number|null=null,saving=false;
    let poll:ReturnType<typeof setTimeout>|undefined,retry:ReturnType<typeof setTimeout>|undefined;
    const controllers=new Set<AbortController>();
    const post=()=>frame.current?.contentWindow?.postMessage({type:'uniplay-page-context',isTeacher,live,page},origin);
    const request=async(method='GET',value?:number)=>{
      const controller=new AbortController();controllers.add(controller);
      const timeout=setTimeout(()=>controller.abort(),8000);
      try {
        const response=await fetch(url,{method,cache:'no-store',signal:controller.signal,
          ...(method==='PUT'?{headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||''}`},body:JSON.stringify({page:value})}:{})});
        const data=await response.json();if(!response.ok||!data.success)throw Error('sync');return data.data;
      } finally {clearTimeout(timeout);controllers.delete(controller);}
    };
    const valid=(value:any)=>Number.isInteger(value)&&value>=0&&value<pageCount;
    const flush=async()=>{
      if(stopped||saving||pending===null)return;
      saving=true;const value=pending;pending=null;
      try {await request('PUT',value);if(!stopped)setError('');}
      catch {if(!stopped){if(pending===null)pending=value;setError('Нет связи: повторяем переключение страницы…');retry=setTimeout(()=>{retry=undefined;void flush();},1000);}}
      finally {saving=false;if(!stopped&&pending!==null&&!retry)void flush();}
    };
    const read=async()=>{
      try {
        const state=await request();
        if(!stopped&&valid(state.page)&&state.version>=version&&!(isTeacher&&dirty)){
          page=state.page;version=state.version;post();setError('');
        }
      }catch {if(!stopped)setError('Нет связи: восстанавливаем синхронизацию страниц…');}
      finally {if(!stopped&&(!isTeacher||version<0&&!dirty))poll=setTimeout(read,600);}
    };
    const receive=(event:MessageEvent)=>{
      if(event.source!==frame.current?.contentWindow||event.origin!==origin)return;
      const data=event.data;
      if(data?.type==='uniplay-page-ready'){post();return;}
      if(data?.type!=='uniplay-page-change'||!valid(data.page))return;
      if(live&&!isTeacher){post();return;}
      page=data.page;
      if(live&&isTeacher){dirty=true;pending=page;void flush();}
    };
    const element=frame.current;
    window.addEventListener('message',receive);element?.addEventListener('load',post);post();
    if(live)void read();
    return()=>{stopped=true;window.removeEventListener('message',receive);element?.removeEventListener('load',post);
      if(poll)clearTimeout(poll);if(retry)clearTimeout(retry);for(const controller of controllers)controller.abort();};
  },[enabled,pageCount,sessionId,activityId,isTeacher,src,token]);
  return {frame,error};
}
