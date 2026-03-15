import React from 'react';

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-xl font-semibold mb-2">Delete post?</h2>
        <p className="text-[var(--text-muted)] mb-6">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-[var(--border-color)] text-[var(--text-primary)] rounded-full hover:bg-[var(--surface)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-2 bg-[var(--error)] text-white rounded-full hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
