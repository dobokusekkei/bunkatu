import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useDialog } from './DialogContext';

export default function PersonnelModal({ onClose }: { onClose: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [type, setType] = useState('our');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchPersonnel = async () => {
    try {
      const res = await fetch('/api/personnel');
      const data = await res.json();
      setPersonnel(data);
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
    try {
      await fetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, company, name, phone })
      });
      setCompany('');
      setName('');
      setPhone('');
      fetchPersonnel();
    } catch (error) {
      console.error(error);
      showAlert('保存に失敗しました。');
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm('削除しますか？', async () => {
      try {
        await fetch(`/api/personnel/${id}`, { method: 'DELETE' });
        fetchPersonnel();
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        await fetch('/api/personnel/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv_data: rows })
        });
        showAlert('CSVから名簿を一括登録しました！');
        fetchPersonnel();
      } catch (error) {
        console.error(error);
        showAlert('CSVインポートに失敗しました。');
      }
    };
    reader.readAsText(file, 'Shift_JIS');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">名簿の登録と管理</h3>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
          <b className="block mb-3 text-sm">1件ずつ登録</b>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs mb-1">区分:</label>
              <select className="w-full border rounded p-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
                <option value="our">当社</option>
                <option value="partner">協力業者</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">業者名 (当社の場合は空白可):</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">氏名 (責任者名など):</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">携帯番号:</label>
              <input type="text" className="w-full border rounded p-1.5 text-sm" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-700">＋ 登録する</button>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
          <b className="block mb-2 text-sm">CSV一括登録 <span className="text-xs text-slate-500 font-normal">(フォーマット: 区分[our/partner], 業者名, 氏名, 携帯番号)</span></b>
          <input type="file" accept=".csv" onChange={handleImportCSV} className="text-sm mb-2 block" />
        </div>

        <b className="block mb-2 text-sm">登録済み名簿一覧</b>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              <th className="p-2 w-16">区分</th>
              <th className="p-2">業者名</th>
              <th className="p-2 w-32">氏名</th>
              <th className="p-2 w-32">携帯番号</th>
              <th className="p-2 w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.type === 'our' ? <span className="text-blue-600">当社</span> : <span className="text-emerald-600">協力</span>}</td>
                <td className="p-2">{p.company}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.phone}</td>
                <td className="p-2">
                  <button onClick={() => handleDelete(p.id)} className="bg-rose-500 text-white px-2 py-1 rounded text-xs hover:bg-rose-600">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-slate-500 text-white px-4 py-2 rounded text-sm hover:bg-slate-600">閉じる</button>
        </div>
      </div>
    </div>
  );
}
