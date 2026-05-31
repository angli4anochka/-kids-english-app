'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const IslandScreen = dynamic(() => import('../../../screens/IslandScreen'), { ssr: false });

export default function IslandPage({ params }: { params: Promise<{ islandId: string }> }) {
  const { islandId } = use(params);
  return <IslandScreen islandId={islandId} />;
}
