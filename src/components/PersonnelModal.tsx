import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from './DialogContext';

export default function PersonnelModal({ onClose, user, fetchData }: { onClose: () => void, user: any, fetchData: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [personnel, setPersonnel] = useState<any[]>([]);
  
  // フォーム用State
  const [id, setId] = useState<number | null>(null);
  const [personnelDept, setPersonnelDept] = useState(user.role === '管理者' ? '' : user.department);
  const [type, setType] = useState('our');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 絞り込み用
  const [filterDept, setFilterDept] = useState(user.role === '管理者' ? '' : user.department);

  const fetchPersonnel = async () => {
    try {
      const res = await fetch('/api/personnel');
      if (res.ok) {
        const data = await res.json();
        setPersonnel(data);
      }
    } catch (error) {
      console.error(error);
      showAlert('名簿の取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleSave = async () => {
    if (!name) return showAlert('氏名を入力してください。');
    
    const saveDept = user.role === '管理者' ? personnelDept : user.department;

    try {
      if (id) {
        await fetch(`/api/personnel/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, company, name, phone, department: saveDept })
        });
      } else {
        await fetch('/api/personnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, company, name, phone, department: saveDept })
        });
      }
      resetForm();
      fetchPersonnel();
      fetchData(); // メイン画面のプルダウンも更新
    } catch (error) {
      console.error(error);
      showAlert('保存に失敗しました。');
    }
  };

  const handleEdit = (p: any) => {
    setId(p.id);
    setPersonnelDept(p.department || '');
    setType(p.type);
    setCompany(p.company || '');
    setName(p.name);
    setPhone(p.phone || '');
  };

  const handleDelete = async (deleteId: number) => {
    showConfirm('この名簿データを削除しますか？', async () => {
      try {
        await fetch(`/api/personnel/${deleteId}`, { method: 'DELETE' });
        if (id === deleteId) resetForm();
        fetchPersonnel();
        fetchData();
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  const resetForm = () => {
    setId(null);
    setPersonnelDept(user.role === '管理者' ? filterDept : user.department);
    setType('our');
    setCompany('');
    setName('');
    setPhone('');
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(',')).filter(r => r.length >= 4);
      
      // ★ 案A: アップロードするユーザーの部署を自動的に紐付ける
      const targetDept = user.role === '管理者' ? (filterDept === '未設定' ? '' : filterDept) : user.department;
      
      const payload = rows.map(r => ({
        type: r[0].trim(),
        company: r[1].trim(),
        name: r[2].trim(),
        phone: r[3].trim(),
        department: targetDept // 部署を付与
      }));

      try {
        const res = await fetch('/api/personnel/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showAlert('CSVから名簿を一括登録しました！');
          fetchPersonnel();
          fetchData();
        } else {
          showAlert('CSVインポートに失敗しました。');
        }
      } catch (error) {
        console.error(error);
        showAlert('インポートエラーが発生しました。');
      }
    };
    reader.readAsText(file, 'Shift_JIS');
    e.target.value = '';
  };

  const uniqueDepts = useMemo(() => {
    const depts = new Set(personnel.map(p => p.department).filter(Boolean));
    if (user.role === '管理者' && user.department) depts.add(user.department);
    return Array.from(depts).sort();
  }, [personnel, user]);

  const filteredPersonnel = useMemo(() => {
    if (user.role === '管理者') {
      if (filterDept === '未設定') return personnel.filter(p => !p.department);
      if (filterDept === '') return personnel;
      return personnel.filter(p => p.department === filterDept);
    } else {
      return personnel.filter(p => p.department === user.department);
    }
  }, [personnel, filterDept, user]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">👥 名簿の登録と管理</h3>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
          <b className="block mb-3 text-sm text-indigo-900">{id ? '名簿情報の編集' : '1件ずつ登録'}</b>
          
          {user.role === '管理者' && (
            <div className="mb-4">
              <label className="text-xs font-bold mr-2">所属部署:</label>
              <select value={personnelDept} onChange={e => setPersonnelDept(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white">
                <option value="">未設定</option>
                {uniqueDepts.map(dept => <option key={dept} value={dept as string}>{dept as string}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold mb-1">区分:</label>
              <select className="w-full border rounded p-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
                <option value="our">当社</option>
                <option value="partner">協力業者</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">業者名 <span className="font-normal text-slate-500">(当社は空白可)</span></label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-rose-600">氏名 (必須)</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">携帯番号</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className={`px-4 py-1.5 rounded text-sm text-white font-bold ${id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {id ? '💾 更新する' : '＋ 登録する'}
            </button>
            <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600 font-bold">クリア</button>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
          <b className="block mb-2 text-sm text-indigo-900">CSV一括登録</b>
          <p className="text-xs text-slate-600 mb-3">フォーマット: 区分(our/partner), 業者名, 氏名, 携帯番号</p>
          <input type="file" accept=".csv" onChange={importCSV} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
        </div>

        <div className="flex justify-between items-end mb-2">
          <b className="block text-sm">登録済み名簿一覧</b>
          
          {user.role === '管理者' && (
            <div className="text-xs flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
              <b>表示切替:</b>
              <select value={filterDept} onChange={e => {setFilterDept(e.target.value); setPersonnelDept(e.target.value);}} className="border rounded px-2 py-1">
                <option value="">(すべて表示)</option>
                <option value="未設定">未設定(旧データ)</option>
                {uniqueDepts.map(dept => <option key={dept} value={dept as string}>{dept as string}</option>)}
              </select>
            </div>
          )}
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              {user.role === '管理者' && <th className="p-2 w-24">部署</th>}
              <th className="p-2 w-16 text-center">区分</th>
              <th className="p-2">業者名</th>
              <th className="p-2 w-32">氏名</th>
              <th className="p-2 w-32">携帯番号</th>
              <th className="p-2 w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonnel.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                {user.role === '管理者' && (
                  <td className="p-2 text-xs">
                    {p.department ? <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">{p.department}</span> : <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">未設定</span>}
                  </td>
                )}
                <td className="p-2 text-center font-bold text-xs">
                  {p.type === 'our' ? <span className="text-blue-600">当社</span> : <span className="text-emerald-600">協力</span>}
                </td>
                <td className="p-2">{p.company || '-'}</td>
                <td className="p-2 font-bold">{p.name}</td>
                <td className="p-2">{p.phone}</td>
                <td className="p-2 text-center">
                  <button onClick={() => handleEdit(p)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-bold mr-1">編集</button>
                  <button onClick={() => handleDelete(p.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 font-bold">削除</button>
                </td>
              </tr>
            ))}
            {filteredPersonnel.length === 0 && (
              <tr><td colSpan={user.role === '管理者' ? 6 : 5} className="p-4 text-center text-slate-500">名簿が登録されていません。</td></tr>
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
