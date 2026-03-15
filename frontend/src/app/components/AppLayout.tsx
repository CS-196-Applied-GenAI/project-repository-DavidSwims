import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { ComposeModal } from './ComposeModal';

export const AppLayout: React.FC = () => {
  const [showComposeModal, setShowComposeModal] = useState(false);

  return (
    <div className="flex max-w-[1280px] mx-auto">
      <Sidebar onCompose={() => setShowComposeModal(true)} />
      
      <main className="flex-1 min-h-screen border-r border-[var(--border-color)]">
        <Outlet context={{ onCompose: () => setShowComposeModal(true) }} />
      </main>
      
      <RightPanel />

      {showComposeModal && (
        <ComposeModal onClose={() => setShowComposeModal(false)} />
      )}
    </div>
  );
};
