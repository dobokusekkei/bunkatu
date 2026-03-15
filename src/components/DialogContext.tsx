import React, { createContext, useContext, useState, ReactNode } from 'react';

type DialogOptions = {
  title?: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirm?: boolean;
};

type DialogContextType = {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a DialogProvider');
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const showAlert = (message: string, title = 'お知らせ') => {
    setDialog({ message, title, isConfirm: false });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = '確認') => {
    setDialog({ message, title, onConfirm, isConfirm: true });
  };

  const handleClose = () => {
    if (dialog?.onCancel) dialog.onCancel();
    setDialog(null);
  };

  const handleConfirm = () => {
    if (dialog?.onConfirm) dialog.onConfirm();
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2">{dialog.title}</h3>
            <p className="text-slate-600 mb-6 whitespace-pre-wrap">{dialog.message}</p>
            <div className="flex justify-end gap-2">
              {dialog.isConfirm && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded text-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={dialog.isConfirm ? handleConfirm : handleClose}
                className="px-4 py-2 rounded text-sm bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {dialog.isConfirm ? 'OK' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
