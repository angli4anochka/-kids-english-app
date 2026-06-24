import type { Activity } from '../../../types';
import SpotlightVerbBeSlides from './SpotlightVerbBeSlides';
import SpotlightEx1 from './SpotlightEx1';
import SpotlightEx2 from './SpotlightEx2';
import SpotlightEx3 from './SpotlightEx3';
import SpotlightEx4 from './SpotlightEx4';
import SpotlightEx5 from './SpotlightEx5';
import SpotlightEx6 from './SpotlightEx6';
import SpotlightEx7 from './SpotlightEx7';
import SpotlightEx8 from './SpotlightEx8';
import SpotlightEx9 from './SpotlightEx9';
import SpotlightEx10 from './SpotlightEx10';
import SpotlightEx11 from './SpotlightEx11';
import SpotlightEx12 from './SpotlightEx12';
import SpotlightEx13 from './SpotlightEx13';
import SpotlightEx14 from './SpotlightEx14';
import SpotlightEx15 from './SpotlightEx15';
import SpotlightEx16 from './SpotlightEx16';
import SpotlightEx17 from './SpotlightEx17';
import SpotlightEx18 from './SpotlightEx18';
import SpotlightEx19 from './SpotlightEx19';
import SpotlightEx20 from './SpotlightEx20';
import SpotlightEx21 from './SpotlightEx21';
import SpotlightEx22 from './SpotlightEx22';
import SpotlightEx23 from './SpotlightEx23';
import SpotlightEx24 from './SpotlightEx24';
import SpotlightEx25 from './SpotlightEx25';
import SpotlightEx26 from './SpotlightEx26';
import SpotlightEx27 from './SpotlightEx27';
import SpotlightEx28 from './SpotlightEx28';
import SpotlightEx29 from './SpotlightEx29';
import SpotlightEx30 from './SpotlightEx30';
import SpotlightEx31 from './SpotlightEx31';
import SpotlightEx32 from './SpotlightEx32';
import SpotlightEx33 from './SpotlightEx33';
import SpotlightEx34 from './SpotlightEx34';
import SpotlightEx35 from './SpotlightEx35';
import SpotlightEx36 from './SpotlightEx36';
import SpotlightEx37 from './SpotlightEx37';
import SpotlightEx38 from './SpotlightEx38';
import SpotlightEx39 from './SpotlightEx39';
import SpotlightEx40 from './SpotlightEx40';
import SpotlightEx41 from './SpotlightEx41';

interface Props {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  sessionId?: string;
  onEdit: (activity: Activity) => void;
}

interface SlideProps {
  isTeacher?: boolean;
  lessonId?: string;
  activityId?: string;
  sessionId?: string;
}

const SPOTLIGHT_COMPONENTS: Record<string, React.ComponentType<SlideProps>> = {
  'verb-be': SpotlightVerbBeSlides,
  'verb-be-ex1': SpotlightEx1,
  'verb-be-ex2': SpotlightEx2,
  'verb-be-ex3': SpotlightEx3,
  'verb-be-ex4': SpotlightEx4,
  'verb-be-ex5': SpotlightEx5,
  'verb-be-ex6': SpotlightEx6,
  'verb-be-ex7': SpotlightEx7,
  'verb-be-ex8': SpotlightEx8,
  'verb-be-ex9': SpotlightEx9,
  'verb-be-ex10': SpotlightEx10,
  'verb-be-ex11': SpotlightEx11,
  'verb-be-ex12': SpotlightEx12,
  'verb-be-ex13': SpotlightEx13,
  'verb-be-ex14': SpotlightEx14,
  'verb-be-ex15': SpotlightEx15,
  'verb-be-ex16': SpotlightEx16,
  'verb-be-ex17': SpotlightEx17,
  'verb-be-ex18': SpotlightEx18,
  'verb-be-ex19': SpotlightEx19,
  'verb-be-ex20': SpotlightEx20,
  'mod1b-ex1': SpotlightEx21,
  'mod1b-ex2': SpotlightEx22,
  'mod1b-ex3': SpotlightEx23,
  'mod1b-ex4': SpotlightEx24,
  'mod1b-ex5': SpotlightEx25,
  'mod1b-ex6': SpotlightEx26,
  'mod1b-ex7': SpotlightEx27,
  'mod1b-ex8': SpotlightEx28,
  'mod1b-ex9': SpotlightEx29,
  'mod1b-ex10': SpotlightEx30,
  'mod1b-ex11': SpotlightEx31,
  'mod1b-ex12': SpotlightEx32,
  'mod1b-ex13': SpotlightEx33,
  'mod1b-ex14': SpotlightEx34,
  'mod1b-ex15': SpotlightEx35,
  'mod1b-ex16': SpotlightEx36,
  'mod1b-ex17': SpotlightEx37,
  'mod1b-ex18': SpotlightEx38,
  'have-ex1': SpotlightEx39,
  'have-ex2': SpotlightEx40,
  'have-ex3': SpotlightEx41,
};

const SpotlightHtmlActivityRenderer = ({ activity, isViewMode, isTeacher, lessonId, sessionId, onEdit }: Props) => {
  const activityData = (activity as any).content_data || (activity as any).contentData || {};
  const lessonKey = activityData.lessonKey || (activity as any).lessonKey || 'verb-be';
  const Component = SPOTLIGHT_COMPONENTS[lessonKey];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-500">
        Unknown spotlight lesson: {lessonKey}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Component
        isTeacher={isTeacher}
        lessonId={lessonId}
        activityId={activity.id}
        sessionId={sessionId}
      />
    </div>
  );
};

export default SpotlightHtmlActivityRenderer;
