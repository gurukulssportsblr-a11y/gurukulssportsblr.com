'use client';

import { useEffect } from 'react';

export default function AdminPage() {
  useEffect(() => {
    window.location.replace('/admin.html');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-lg font-bold">Loading Gurukul's Sports Host Control Panel...</h2>
      <p className="text-xs text-slate-400 mt-1">Redirecting to operations dashboard...</p>
    </div>
  );
}
