'use client';
import dynamic from 'next/dynamic';
const AdminScreen = dynamic(() => import('../../screens/AdminScreen'), { ssr: false });
export default function AdminPage() { return <AdminScreen />; }
