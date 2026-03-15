import React, { useState } from 'react';
import { useDialog } from './DialogContext';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const { showAlert } = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ★ Vercelテスト用バイパス（admin / admin で強制ログイン）
    // APIサーバーが存在しない環境でもUIのテストができるように直結させます
    if (loginId === 'admin' && password === 'admin') {
      onLogin({ 
        id: 1, 
        name: 'テスト管理者 (Vercel)', 
        department: 'システム管理部', 
        role: '管理者',
        login_id: 'admin'
      });
      return;
    }

    // 本来のAPI通信（社内サーバー用）
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLogin(data.user);
      } else {
        showAlert(data.error || 'ログインに失敗しました');
      }
    } catch (error) {
      // APIサーバーに繋がらない場合はVercel等のテスト環境とみなし、アラートで案内します
      showAlert('サーバーエラーが発生しました（Vercelテスト環境では ID: admin / PASS: admin を入力してください）');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">安全作業計画書システム</h2>
        
        {/* テスト環境であることがすぐわかるように案内を表示 */}
        <div className="bg-amber-100 text-amber-800 text-xs p-3 rounded mb-4 font-bold text-center border border-amber-200">
          Vercelテスト用: ID「admin」 / PASS「admin」
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
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
