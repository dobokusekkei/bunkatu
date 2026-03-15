import React, { useState, useEffect } from 'react';
import { useDialog } from './DialogContext';

export default function TeamModal({ onClose }: { onClose: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [teams, setTeams] = useState<any[]>([]);
  const [id, setId] = useState<number | null>(null);
  
  const [groupName, setGroupName] = useState('');
  const [groupLeaderName, setGroupLeaderName] = useState('');
  const [groupLeaderPhone, setGroupLeaderPhone] = useState('');
  
  const [teamName, setTeamName] = useState('');
  const [contact1Name, setContact1Name] = useState('');
  const [contact1Phone, setContact1Phone] = useState('');
  const [contact2Name, setContact2Name] = useState('');
  const [contact2Phone, setContact2Phone] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
      showAlert('チームの取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSave = async () => {
    if (!teamName) return showAlert('チーム名を入力してください。');
    
    const payload = {
      group_name: groupName,
      group_leader_name: groupLeaderName,
      group_leader_phone: groupLeaderPhone,
      team_name: teamName,
      contact1_name: contact1Name,
      contact1_phone: contact1Phone,
      contact2_name: contact2Name,
      contact2_phone: contact2Phone
    };

    try {
      if (id) {
        await fetch(`/api/teams/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      resetForm();
      fetchTeams();
    } catch (error) {
      console.error(error);
      showAlert('保存に失敗しました。');
    }
  };

  const handleEdit = (t: any) => {
    setId(t.id);
    setGroupName(t.group_name || '');
    setGroupLeaderName(t.group_leader_name || '');
    setGroupLeaderPhone(t.group_leader_phone || '');
    setTeamName(t.team_name || '');
    setContact1Name(t.contact1_name || '');
    setContact1Phone(t.contact1_phone || '');
    setContact2Name(t.contact2_name || '');
    setContact2Phone(t.contact2_phone || '');
  };

  const handleDelete = async (deleteId: number) => {
    showConfirm('このチームを削除しますか？', async () => {
      try {
        await fetch(`/api/teams/${deleteId}`, { method: 'DELETE' });
        if (id === deleteId) resetForm();
        fetchTeams();
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  const resetForm = () => {
    setId(null);
    setGroupName('');
    setGroupLeaderName('');
    setGroupLeaderPhone('');
    setTeamName('');
    setContact1Name('');
    setContact1Phone('');
    setContact2Name('');
    setContact2Phone('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">チーム設定 (緊急連絡用) 管理</h3>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
          <b className="block mb-3 text-sm">{id ? 'チームの編集' : '新規チーム追加'}</b>
          
          <div className="border-b border-dashed border-slate-300 pb-4 mb-4">
            <b className="text-indigo-700 text-xs block mb-2">【グループ情報】 (別紙転記用)</b>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs mb-1">グループ名</label>
                <input type="text" className="w-36 border rounded p-1.5 text-sm" value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">グループ長 氏名 (C62)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm" value={groupLeaderName} onChange={e => setGroupLeaderName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">グループ長 電話 (F62)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm" value={groupLeaderPhone} onChange={e => setGroupLeaderPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <b className="text-indigo-700 text-xs block mb-2">【チーム・連絡先情報】 (メインシート転記用)</b>
            <div className="flex gap-4 items-start">
              <div>
                <label className="block text-xs mb-1">チーム名</label>
                <input type="text" className="w-36 border rounded p-1.5 text-sm" value={teamName} onChange={e => setTeamName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">連絡先1 氏名 (Q37)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm mb-2" value={contact1Name} onChange={e => setContact1Name(e.target.value)} />
                <label className="block text-xs mb-1">連絡先1 電話 (R37)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm" value={contact1Phone} onChange={e => setContact1Phone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">連絡先2 氏名 (Q38)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm mb-2" value={contact2Name} onChange={e => setContact2Name(e.target.value)} />
                <label className="block text-xs mb-1">連絡先2 電話 (R38)</label>
                <input type="text" className="w-32 border rounded p-1.5 text-sm" value={contact2Phone} onChange={e => setContact2Phone(e.target.value)} />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-right flex justify-end gap-2">
            <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600">
              クリア
            </button>
            <button onClick={handleSave} className={`px-4 py-1.5 rounded text-sm text-white ${id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {id ? '💾 更新する' : '＋ 登録する'}
            </button>
          </div>
        </div>

        <b className="block mb-2 text-sm">登録済みチーム一覧</b>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              <th className="p-2 w-40">グループ情報</th>
              <th className="p-2 w-32">チーム名</th>
              <th className="p-2 w-36">連絡先1</th>
              <th className="p-2 w-36">連絡先2</th>
              <th className="p-2 w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.id} className="border-b">
                <td className="p-2">
                  <b>{t.group_name}</b><br/>
                  <span className="text-xs text-slate-600">{t.group_leader_name}</span><br/>
                  <span className="text-xs text-slate-600">{t.group_leader_phone}</span>
                </td>
                <td className="p-2 font-bold">{t.team_name}</td>
                <td className="p-2">
                  {t.contact1_name}<br/>
                  <span className="text-xs text-slate-600">{t.contact1_phone}</span>
                </td>
                <td className="p-2">
                  {t.contact2_name}<br/>
                  <span className="text-xs text-slate-600">{t.contact2_phone}</span>
                </td>
                <td className="p-2">
                  <button onClick={() => handleEdit(t)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 mr-1 mb-1">編集</button>
                  <button onClick={() => handleDelete(t.id)} className="bg-rose-500 text-white px-2 py-1 rounded text-xs hover:bg-rose-600">削除</button>
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
