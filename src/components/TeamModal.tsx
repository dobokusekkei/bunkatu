import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from './DialogContext';

export default function TeamModal({ onClose, user, fetchData }: { onClose: () => void, user: any, fetchData: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [teams, setTeams] = useState<any[]>([]);
  
  // フォーム用State
  const [id, setId] = useState<number | null>(null);
  const [teamDept, setTeamDept] = useState(user.department || ''); // 所属部署
  const [groupName, setGroupName] = useState('');
  const [groupLeaderName, setGroupLeaderName] = useState('');
  const [groupLeaderPhone, setGroupLeaderPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [contact1Name, setContact1Name] = useState('');
  const [contact1Phone, setContact1Phone] = useState('');
  const [contact2Name, setContact2Name] = useState('');
  const [contact2Phone, setContact2Phone] = useState('');

  // 管理者向けの絞り込みフィルター（一般ユーザーは自分の部署で固定）
  const [filterDept, setFilterDept] = useState(user.role === '管理者' ? '' : user.department);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error(error);
      showAlert('チーム情報の取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSave = async () => {
    if (!teamName) return showAlert('チーム名を入力してください。');
    
    // 一般ユーザーが作成・編集する場合は、強制的に自分の部署をセットする
    const saveDept = user.role === '管理者' ? teamDept : user.department;

    const payload = {
      department: saveDept, // ★ 追加
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
      fetchData(); // App.tsxのデータも更新
    } catch (error) {
      console.error(error);
      showAlert('保存に失敗しました。');
    }
  };

  const handleEdit = (t: any) => {
    setId(t.id);
    setTeamDept(t.department || ''); // 既存データに無い場合は空
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
        fetchData(); // App.tsxのデータも更新
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  const resetForm = () => {
    setId(null);
    setTeamDept(user.role === '管理者' ? '' : user.department);
    setGroupName('');
    setGroupLeaderName('');
    setGroupLeaderPhone('');
    setTeamName('');
    setContact1Name('');
    setContact1Phone('');
    setContact2Name('');
    setContact2Phone('');
  };

  // プルダウン用：登録されている全チームから一意の部署リストを作成
  const uniqueDepts = useMemo(() => {
    const depts = new Set(teams.map(t => t.department).filter(Boolean));
    if (user.role === '管理者' && user.department) depts.add(user.department); // 管理者の部署も確保
    return Array.from(depts).sort();
  }, [teams, user]);

  // リストの絞り込み表示
  const filteredTeams = useMemo(() => {
    if (user.role === '管理者') {
      if (filterDept === '未設定') return teams.filter(t => !t.department);
      if (filterDept === '') return teams; // すべて表示
      return teams.filter(t => t.department === filterDept);
    } else {
      // 一般ユーザーは自分の部署のみ
      return teams.filter(t => t.department === user.department);
    }
  }, [teams, filterDept, user]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[900px] max-h-[95vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">⚙️ チーム設定 (緊急連絡用) 管理</h3>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
          <b className="block mb-3 text-sm text-indigo-900">{id ? 'チーム情報の編集' : '新規チーム追加'}</b>
          
          {/* 管理者の場合のみ、どの部署のチームとして登録するか選択できる */}
          {user.role === '管理者' && (
            <div className="mb-4">
              <label className="text-xs font-bold mr-2">所属部署:</label>
              <select 
                value={teamDept} 
                onChange={e => setTeamDept(e.target.value)} 
                className="border rounded px-2 py-1 text-sm bg-white"
              >
                <option value="">未設定</option>
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 ml-2">※未設定の既存チームに部署を割り当てることができます。</span>
            </div>
          )}

          <div className="border-b border-dashed border-slate-300 pb-4 mb-4">
            <b className="text-[#005a9e] text-xs block mb-2">【グループ情報】 (別紙転記用)</b>
            <div className="flex flex-wrap gap-4 items-end">
              <div><label className="text-xs block mb-1">グループ名</label><input type="text" className="w-40 border rounded p-1.5 text-sm" value={groupName} onChange={e => setGroupName(e.target.value)} /></div>
              <div><label className="text-xs block mb-1">グループ長 氏名 (C62)</label><input type="text" className="w-32 border rounded p-1.5 text-sm" value={groupLeaderName} onChange={e => setGroupLeaderName(e.target.value)} /></div>
              <div><label className="text-xs block mb-1">グループ長 電話 (F62)</label><input type="text" className="w-32 border rounded p-1.5 text-sm" value={groupLeaderPhone} onChange={e => setGroupLeaderPhone(e.target.value)} /></div>
            </div>
          </div>
          <div>
            <b className="text-[#005a9e] text-xs block mb-2">【チーム・連絡先情報】 (メインシート転記用)</b>
            <div className="flex flex-wrap gap-6 items-start">
              <div><label className="text-xs font-bold block mb-1 text-rose-600">チーム名 (必須)</label><input type="text" className="w-40 border rounded p-1.5 text-sm" value={teamName} onChange={e => setTeamName(e.target.value)} /></div>
              <div>
                <label className="text-xs block mb-1">連絡先1 氏名 (Q37)</label><input type="text" className="w-32 border rounded p-1.5 text-sm mb-2" value={contact1Name} onChange={e => setContact1Name(e.target.value)} /><br/>
                <label className="text-xs block mb-1">連絡先1 電話 (R37)</label><input type="text" className="w-32 border rounded p-1.5 text-sm" value={contact1Phone} onChange={e => setContact1Phone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block mb-1">連絡先2 氏名 (Q38)</label><input type="text" className="w-32 border rounded p-1.5 text-sm mb-2" value={contact2Name} onChange={e => setContact2Name(e.target.value)} /><br/>
                <label className="text-xs block mb-1">連絡先2 電話 (R38)</label><input type="text" className="w-32 border rounded p-1.5 text-sm" value={contact2Phone} onChange={e => setContact2Phone(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="mt-4 text-right flex gap-2 justify-end">
            <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600 font-bold">クリア</button>
            <button onClick={handleSave} className={`px-4 py-1.5 rounded text-sm text-white font-bold ${id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {id ? '💾 更新する' : '＋ 登録する'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end mb-2">
          <b className="block text-sm">登録済みチーム一覧</b>
          
          {/* 管理者向けの一覧絞り込みフィルター */}
          {user.role === '管理者' && (
            <div className="text-xs flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
              <b>表示切替:</b>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border rounded px-2 py-1">
                <option value="">(すべて表示)</option>
                <option value="未設定">未設定(旧データ)</option>
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              {user.role === '管理者' && <th className="p-2 w-24">部署</th>}
              <th className="p-2 w-48">グループ情報</th>
              <th className="p-2 w-32">チーム名</th>
              <th className="p-2 w-40">連絡先1</th>
              <th className="p-2 w-40">連絡先2</th>
              <th className="p-2 w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                {user.role === '管理者' && (
                  <td className="p-2 text-xs">
                    {t.department ? (
                      <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">{t.department}</span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">未設定</span>
                    )}
                  </td>
                )}
                <td className="p-2 text-xs">
                  <b className="text-sm">{t.group_name}</b><br/>
                  <span className="text-slate-600">{t.group_leader_name}</span><br/>
                  <span className="text-slate-600">{t.group_leader_phone}</span>
                </td>
                <td className="p-2 font-bold">{t.team_name}</td>
                <td className="p-2 text-xs">
                  {t.contact1_name}<br/><span className="text-slate-600">{t.contact1_phone}</span>
                </td>
                <td className="p-2 text-xs">
                  {t.contact2_name}<br/><span className="text-slate-600">{t.contact2_phone}</span>
                </td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEdit(t)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-bold">編集</button>
                    <button onClick={() => handleDelete(t.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 font-bold">削除</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={user.role === '管理者' ? 6 : 5} className="p-4 text-center text-slate-500">
                  チームが登録されていません。
                </td>
              </tr>
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
