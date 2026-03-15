import React, { useState, useEffect } from 'react';
import { useDialog } from './DialogContext';

export default function UserManagementModal({ onClose }: { onClose: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState<any[]>([]);
  
  const [id, setId] = useState<number | null>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('一般');

  const sanitizeAlphanumericAndSymbols = (str: string) => {
    if (!str) return '';
    let halfVal = str.replace(/[！-～]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    return halfVal.replace(/[^\x20-\x7E]/g, '');
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users' })
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      showAlert('ユーザー情報の取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!loginId || !name || !department) {
      return showAlert('ログインID、氏名、部署は必須です。');
    }
    if (!id && !password) {
      return showAlert('新規登録時はパスワードを入力してください。');
    }

    try {
      await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'save_user', 
          id, 
          login_id: loginId, 
          password, 
          name, 
          department, 
          role 
        })
      });
      resetForm();
      fetchUsers();
      showAlert('ユーザー情報を保存しました。');
    } catch (error) {
      showAlert('保存に失敗しました。');
    }
  };

  const handleEdit = (u: any) => {
    setId(u.id);
    setLoginId(u.login_id);
    setPassword(''); // 編集時はパスワードは空（変更する場合のみ入力）
    setName(u.name);
    setDepartment(u.department || '');
    setRole(u.role);
  };

  const handleDelete = async (deleteId: number) => {
    showConfirm('このユーザーを削除しますか？\n（※管理者は最低1人必要です）', async () => {
      try {
        await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_user', id: deleteId })
        });
        if (id === deleteId) resetForm();
        fetchUsers();
      } catch (error) {
        showAlert('削除に失敗しました。');
      }
    });
  };

  const resetForm = () => {
    setId(null);
    setLoginId('');
    setPassword('');
    setName('');
    setDepartment('');
    setRole('一般');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4 text-purple-900">👑 システムユーザー管理 (管理者専用)</h3>
        
        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
          <b className="block mb-3 text-sm text-purple-900">{id ? 'ユーザー情報の編集' : '新規ユーザー登録'}</b>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-rose-600">ログインID (半角英数・記号)</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={loginId} onChange={e => setLoginId(sanitizeAlphanumericAndSymbols(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-rose-600">{id ? '新パスワード (変更時のみ)' : 'パスワード (必須)'}</label>
              <input type="password" className="w-full border rounded p-1.5 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-rose-600">氏名</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-rose-600">所属部署</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={department} onChange={e => setDepartment(e.target.value)} placeholder="例：設計1T" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">権限</label>
              <select className="w-full border rounded p-1.5 text-sm" value={role} onChange={e => setRole(e.target.value)}>
                <option value="一般">一般 (自部署のみ管理)</option>
                <option value="管理者">管理者 (全機能アクセス可)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className={`px-4 py-1.5 rounded text-sm text-white font-bold ${id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {id ? '💾 更新する' : '＋ 登録する'}
            </button>
            <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600 font-bold">クリア</button>
          </div>
        </div>

        <b className="block mb-2 text-sm">登録済みユーザー一覧</b>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              <th className="p-2 w-32">ログインID</th>
              <th className="p-2 w-32">氏名</th>
              <th className="p-2 w-32">所属部署</th>
              <th className="p-2 w-24 text-center">権限</th>
              <th className="p-2 w-32 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="p-2 font-mono text-xs">{u.login_id}</td>
                <td className="p-2 font-bold">{u.name}</td>
                <td className="p-2">{u.department}</td>
                <td className="p-2 text-center">
                  {u.role === '管理者' ? (
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">管理者</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">一般</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => handleEdit(u)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-bold mr-1">編集</button>
                  {u.login_id !== 'admin' && (
                    <button onClick={() => handleDelete(u.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 font-bold">削除</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">ユーザー情報が取得できません。</td></tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 text-right border-t pt-4">
          <button onClick={onClose} className="bg-slate-500 text-white px-6 py-2 rounded text-sm hover:bg-slate-600 font-bold">閉じる</button>
        </div>
      </div>
    </div>
  );
}
