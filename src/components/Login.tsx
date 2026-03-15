import React, { useState } from 'react';
import { useDialog } from './DialogContext';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const { showAlert } = useDialog();

  const sanitizeAlphanumericAndSymbols = (str: string) => {
    if (!str) return '';
    let halfVal = str.replace(/[！-～]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    return halfVal.replace(/[^\x20-\x7E]/g, '');
  };

  const handleLoginIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginId(sanitizeAlphanumericAndSymbols(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', login_id: loginId, password })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLogin(data.user);
      } else {
        showAlert(data.error || 'ログインに失敗しました');
      }
    } catch (error) {
      showAlert('サーバー通信エラーが発生しました。社内サーバーの設定を確認してください。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">安全作業計画書システム</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ログインID (半角英数・記号)</label>
            <input
              type="text"
              inputMode="url"
              value={loginId}
              onChange={handleLoginIdChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors mt-6"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
