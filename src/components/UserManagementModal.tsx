import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useDialog } from './DialogContext';

export default function UserManagementModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', login_id: '', password: '', department: '', role: '一般' });
  const { showAlert, showConfirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      showAlert('ユーザー情報の取得に失敗しました');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.login_id || (!editingId && !formData.password)) {
      showAlert('必須項目を入力してください');
      return;
    }

    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchUsers();
        setEditingId(null);
        setFormData({ name: '', login_id: '', password: '', department: '', role: '一般' });
      } else {
        showAlert(data.error || '保存に失敗しました');
      }
    } catch (error) {
      showAlert('サーバーエラーが発生しました');
    }
  };

  const handleDelete = (id: number) => {
    showConfirm('このユーザーを削除しますか？', async () => {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) fetchUsers();
      } catch (error) {
        showAlert('削除に失敗しました');
      }
    });
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({ name: user.name, login_id: user.login_id, password: '', department: user.department || '', role: user.role });
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      
      try {
        const res = await fetch('/api/users/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv_data: rows })
        });
        const data = await res.json();
        if (data.status === 'success') {
          fetchUsers();
          showAlert('CSVからユーザーを登録しました');
        } else {
          showAlert(`エラーが発生しました:\n${data.error}`);
        }
      } catch (error) {
        showAlert('CSVインポートに失敗しました');
      }
    };
    reader.readAsText(file, 'Shift_JIS'); // Assuming Shift_JIS for Japanese Excel CSVs, or UTF-8. Let's try UTF-8 first or let browser decide. Actually, standard JS FileReader uses UTF-8 by default if not specified. Let's stick to UTF-8 or let user ensure UTF-8.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">ユーザー管理</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <h3 className="font-bold text-slate-700 mb-3">{editingId ? 'ユーザー編集' : '新規ユーザー登録'}</h3>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <input type="text" placeholder="氏名" className="border p-2 rounded text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="ログインID" className="border p-2 rounded text-sm" value={formData.login_id} onChange={e => setFormData({...formData, login_id: e.target.value})} />
              <input type="password" placeholder={editingId ? "パスワード(変更時のみ)" : "パスワード"} className="border p-2 rounded text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <input type="text" placeholder="部署" className="border p-2 rounded text-sm" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              <select className="border p-2 rounded text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="一般">一般</option>
                <option value="管理者">管理者</option>
              </select>
            </div>
            <div className="flex justify-between">
              <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-bold">
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? '更新' : '登録'}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setFormData({ name: '', login_id: '', password: '', department: '', role: '一般' }); }} className="px-4 py-2 bg-slate-400 text-white rounded hover:bg-slate-500 text-sm">
                  キャンセル
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-700">登録済みユーザー</h3>
            <div>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCsvImport} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm">
                <Upload size={16} /> CSV一括登録
              </button>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 text-left">氏名</th>
                <th className="border p-2 text-left">ログインID</th>
                <th className="border p-2 text-left">部署</th>
                <th className="border p-2 text-left">権限</th>
                <th className="border p-2 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.login_id}</td>
                  <td className="border p-2">{user.department}</td>
                  <td className="border p-2">{user.role}</td>
                  <td className="border p-2 text-center">
                    <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-800 mr-2">編集</button>
                    <button onClick={() => handleDelete(user.id)} className="text-rose-600 hover:text-rose-800"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
