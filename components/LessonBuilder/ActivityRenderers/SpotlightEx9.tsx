'use client';
import { useState } from 'react';

interface Props {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const FONT = '"Comic Sans MS","Trebuchet MS",Arial,sans-serif';
const ORANGE = '#e1a058';
const CREAM  = '#fffaf4';

// fade-in block: visible when step >= showAt
function Step({ showAt, current, children }: { showAt: number; current: number; children: React.ReactNode }) {
  const visible = current >= showAt;
  return (
    <section style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: 'opacity .45s ease, transform .45s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {children}
    </section>
  );
}

export default function SpotlightEx9({ isTeacher, lessonId, activityId, sessionId }: Props) {
  const [step, setStep] = useState(0);
  const TOTAL = 6;
  const done  = step >= TOTAL;

  const advance = () => { if (!done) setStep(s => s + 1); };

  const FS_TITLE   = 'clamp(20px,2.8vw,52px)';
  const FS_FORMS   = 'clamp(16px,2.1vw,38px)';
  const FS_RULE    = 'clamp(14px,1.9vw,34px)';
  const FS_EXAMPLE = 'clamp(13px,1.8vw,32px)';
  const SHADOW     = '1px 2px 2px rgba(0,0,0,.2)';

  return (
    <div
      onClick={advance}
      style={{
        width: '100%', height: '100%',
        background: '#fff',
        fontFamily: FONT,
        cursor: done ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(8px,1.8%,22px) clamp(12px,2.8%,44px) clamp(6px,1.4%,18px)',
        gap: 'clamp(4px,.8%,12px)',
        overflow: 'hidden',
        userSelect: 'none',
        color: '#000',
        position: 'relative',
      }}
    >
      {/* Step 0: Title — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.8vw,32px)', flexShrink: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${ORANGE}`, background: CREAM, padding: 'clamp(4px,.5%,8px) clamp(8px,1.2%,20px)', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#00c9a5', fontSize: FS_TITLE, fontWeight: 500, lineHeight: 1, textShadow: `1px 1px 0 #008f7c, ${SHADOW}` }}>
            the verb 'have'
          </span>
        </div>
        <span style={{ fontSize: FS_FORMS, fontWeight: 600, lineHeight: 1, textShadow: SHADOW }}>
          (have/has/had)
        </span>
      </div>

      {/* Step 1: possession rule */}
      <Step showAt={1} current={step}>
        <div style={{ border: `3px solid ${ORANGE}`, background: CREAM, padding: 'clamp(5px,.6%,10px) clamp(12px,2%,32px)', display: 'flex', alignItems: 'center', textAlign: 'center', fontSize: FS_RULE, fontWeight: 500, lineHeight: 1.15, textShadow: SHADOW }}>
          <span style={{ marginRight: 'clamp(8px,1.8vw,28px)', fontSize: '1.1em' }}>•</span>
          <span>
            We can use <span style={{ color: '#f00' }}>have</span> or <span style={{ color: '#f00' }}>have got</span> to talk about <strong>possession</strong>,<br />
            relationships and some other ideas.
          </span>
        </div>
      </Step>

      {/* Step 2: possession examples */}
      <Step showAt={2} current={step}>
        <div style={{ textAlign: 'center', fontSize: FS_EXAMPLE, fontWeight: 500, lineHeight: 1.55, textShadow: SHADOW }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,4vw,72px)', whiteSpace: 'nowrap' }}>
            <span>Do you have a car?</span>
            <span>Ann has got a headache.</span>
          </div>
          <div>I don't have any brothers or sisters.</div>
        </div>
      </Step>

      {/* Step 3: actions rule */}
      <Step showAt={3} current={step}>
        <div style={{ border: `3px solid ${ORANGE}`, background: CREAM, padding: 'clamp(4px,.55%,9px) clamp(12px,2%,32px)', display: 'flex', alignItems: 'center', textAlign: 'center', fontSize: FS_RULE, fontWeight: 500, lineHeight: 1.12, textShadow: SHADOW }}>
          <span style={{ marginRight: 'clamp(8px,1.8vw,28px)', fontSize: '1.1em' }}>•</span>
          <span>And we can use <span style={{ color: '#f00' }}>have</span> to talk about some kinds of <strong>actions</strong>.</span>
        </div>
      </Step>

      {/* Step 4: actions examples */}
      <Step showAt={4} current={step}>
        <div style={{ textAlign: 'center', fontSize: FS_EXAMPLE, fontWeight: 500, lineHeight: 1.5, textShadow: SHADOW }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,4vw,72px)', whiteSpace: 'nowrap' }}>
            <span>I'm going to have a shower.</span>
            <span>What time do you have breakfast?</span>
          </div>
        </div>
      </Step>

      {/* Step 5: auxiliary rule */}
      <Step showAt={5} current={step}>
        <div style={{ border: `3px solid ${ORANGE}`, background: CREAM, padding: 'clamp(4px,.55%,9px) clamp(12px,2%,32px)', display: 'flex', alignItems: 'center', textAlign: 'center', fontSize: FS_RULE, fontWeight: 500, lineHeight: 1.12, textShadow: SHADOW }}>
          <span style={{ marginRight: 'clamp(8px,1.8vw,28px)', fontSize: '1.1em', color: '#f00' }}>•</span>
          <span><span style={{ color: '#f00' }}>Have</span> can also be an <strong>auxiliary verb</strong> in perfect tenses.</span>
        </div>
      </Step>

      {/* Step 6: perfect examples */}
      <Step showAt={6} current={step}>
        <div style={{ textAlign: 'center', fontSize: FS_EXAMPLE, fontWeight: 500, lineHeight: 1.45, textShadow: SHADOW }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,4vw,72px)', whiteSpace: 'nowrap' }}>
            <span>I haven't seen her all day.</span>
            <span>We knew that he had taken the money.</span>
          </div>
        </div>
      </Step>

      {/* next button & hint */}
      <div style={{ position: 'absolute', left: 'clamp(10px,2.5%,40px)', bottom: 'clamp(4px,1.5%,16px)', fontFamily: 'Arial,sans-serif', fontSize: 'clamp(10px,.85vw,14px)', color: '#c0c0c0', pointerEvents: 'none' }}>
        {done ? '' : 'Click anywhere to reveal the next block'}
      </div>
      <button
        onClick={e => { e.stopPropagation(); advance(); }}
        style={{
          position: 'absolute', right: 'clamp(8px,1.8%,28px)', bottom: 'clamp(4px,1.5%,16px)',
          width: 'clamp(30px,3.8vw,58px)', height: 'clamp(30px,3.8vw,58px)',
          borderRadius: '50%', border: '2px solid #d7d7d7', background: 'rgba(255,255,255,.86)',
          color: done ? '#0ea85c' : '#a0a0a0',
          fontSize: 'clamp(20px,3.4vw,52px)', lineHeight: .8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: done ? 'default' : 'pointer',
          opacity: done ? .3 : 1,
          transition: 'opacity .25s',
          fontFamily: 'Arial,sans-serif',
        }}
      >
        {done ? '✓' : '›'}
      </button>
    </div>
  );
}
