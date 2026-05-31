'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const MapScreen = dynamic(() => import('../../screens/MapScreen'), { ssr: false });

export default function MapPage() {
  return <MapScreen />;
}
