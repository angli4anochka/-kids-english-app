'use client';

import SpotlightIframeActivity, { type SpotlightActivityProps } from './SpotlightIframeActivity';

interface Props extends SpotlightActivityProps {
  stage: number;
}

const TITLES = [
  'Soft start',
  'Jobs',
  'Jobs speaking',
  'Extreme sports',
  'Associations',
  'Entertainment',
  'Entertainment speaking',
  'The internet',
  'Internet speaking',
  'Final mix',
];

export default function StarlightGrade8Stage({ stage, ...props }: Props) {
  const safeStage = Math.max(1, Math.min(TITLES.length, stage));

  return (
    <SpotlightIframeActivity
      {...props}
      src={`/starlight/starter_revision_grade8_fit_screen.html?stage=${safeStage}`}
      title={`Starter Revision · ${TITLES[safeStage - 1]}`}
      doneMessageTypes={['starlight-stage-result']}
    />
  );
}