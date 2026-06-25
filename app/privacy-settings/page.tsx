'use client';
import dynamic from 'next/dynamic';
const PrivacySettingsScreen = dynamic(() => import('../../screens/PrivacySettingsScreen'), { ssr: false });
export default function PrivacySettingsPage() { return <PrivacySettingsScreen />; }
