import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setMobileOpen(false)} />
      )}
      <main className={`flex-1 transition-all duration-300 ease-out md:ml-64 ${collapsed ? 'md:!ml-16' : ''}`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
