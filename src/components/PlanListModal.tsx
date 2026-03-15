import React, { useState, useEffect } from 'react';
import { useDialog } from './DialogContext';
import { Download, Trash2, Edit3, FolderOpen } from 'lucide-react';

interface PlanListModalProps {
  onClose: () => void;
  onSelect: (id: number) => void;
  plans: any[];
  fetchData: () => void;
}

export default function PlanListModal({ onClose, onSelect, plans, fetchData }: PlanListModalProps) {
  const { showAlert, showConfirm } = useDialog();
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        setTeams(await res.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchTeams();
  }, []);

  const handleTitleUpdate = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) {
      showAlert('タイトルを入力してください。');
      return;
    }
    try {
      await fetch(`/api/plans/${id}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      fetchData();
    } catch (error) {
      console.error(error);
      showAlert('タイトルの更新に失敗しました。');
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm('この保存データを削除しますか？', async () => {
      try {
        await fetch(`/api/plans/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <FolderOpen size={20} /> 保存データ一覧
            </h3>
            <div className="flex gap-2 ml-4">
              <button 
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/plans/sample', { method: 'POST' });
                    if (!res.ok) throw new Error('Failed to generate sample data');
                    fetchData();
                    showAlert('サンプルデータを生成しました。');
                  } catch (e) {
                    console.error(e);
                    showAlert('サンプルデータの生成に失敗しました。');
                  }
                }} 
                className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700 font-bold"
              >
                サンプルデータ生成
              </button>
              <button 
                type="button"
                onClick={async () => {
                  showConfirm('すべてのサンプルデータを削除しますか？', async () => {
                    try {
                      const res = await fetch('/api/plans/sample', { method: 'DELETE' });
                      if (!res.ok) throw new Error('Failed to delete sample data');
                      fetchData();
                      showAlert('サンプルデータを削除しました。');
                    } catch (e) {
                      console.error(e);
                      showAlert('サンプルデータの削除に失敗しました。');
                    }
                  });
                }} 
                className="bg-rose-600 text-white px-3 py-1 rounded text-xs hover:bg-rose-700 font-bold"
              >
                サンプルデータ削除
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 font-bold text-xl">&times;</button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-left border-collapse text-xs sm:text-sm table-fixed">
            <thead>
              <tr className="bg-indigo-700 text-white border-b">
                <th className="p-2 w-[12%] text-center">DB保存名</th>
                <th className="p-2 w-[8%] text-center">登録日</th>
                <th className="p-2 w-[8%] text-center">部署</th>
                <th className="p-2 w-[8%] text-center">氏名</th>
                <th className="p-2 w-[8%] text-center">工番</th>
                <th className="p-2 w-[8%] text-center">チーム</th>
                <th className="p-2 w-[10%] text-center">作業場所</th>
                <th className="p-2 w-[14%] text-center">工事内容</th>
                <th className="p-2 w-[8%] text-center">手配・立会</th>
                <th className="p-2 w-[8%] text-center">作業日時</th>
                <th className="p-2 w-[8%] text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => {
                let parsed: any = {};
                try { parsed = JSON.parse(p.form_data); } catch(e) {}
                
                const jobNo = parsed.job_no || '';
                let teamName = '';
                if (parsed.team_id) {
                  const t = teams.find(x => x.id == parsed.team_id);
                  if (t) teamName = t.team_name;
                }
                const loc = parsed.location || '';
                const content = parsed.job_content || '';
                
                let dates = [];
                for(let i=1; i<=5; i++) {
                  if(parsed[`date_${i}`]) {
                    let d = parsed[`date_${i}`].split('-');
                    dates.push(`${parseInt(d[1])}/${parseInt(d[2])}`);
                  }
                }
                const datesStr = dates.join(', ');
                
                let checks = new Set();
                for(let i=1; i<=5; i++) {
                  if(parsed[`chk_kido_${i}`]) checks.add('軌道');
                  if(parsed[`chk_denki_${i}`]) checks.add('電気');
                  if(parsed[`chk_teiden_${i}`]) checks.add('停電');
                  if(parsed[`chk_toro_${i}`]) checks.add('トロ');
                  if(parsed[`chk_kanban_${i}`]) checks.add('看板');
                  if(parsed[`chk_fumikiri_${i}`]) checks.add('踏切');
                  if(parsed[`chk_ryuchi_${i}`]) checks.add('留置');
                }
                const checksStr = Array.from(checks).join('、');

                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 align-top">
                      <div className="flex items-center gap-1">
                        <Edit3 size={12} className="text-slate-400 flex-shrink-0" />
                        <input 
                          type="text" 
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-1 py-0.5 cursor-pointer focus:cursor-text text-xs" 
                          defaultValue={p.title} 
                          onBlur={(e) => {
                            if (e.target.value !== p.title) handleTitleUpdate(p.id, e.target.value);
                          }}
                          title="クリックして名前を変更"
                        />
                      </div>
                    </td>
                    <td className="p-2 text-center align-top break-words">{p.created_at.split(' ')[0]}</td>
                    <td className="p-2 text-center align-top break-words">{p.user_department || '-'}</td>
                    <td className="p-2 text-center align-top break-words">{p.user_name || '-'}</td>
                    <td className="p-2 text-center align-top break-words">{jobNo}</td>
                    <td className="p-2 text-center align-top break-words">{teamName}</td>
                    <td className="p-2 align-top break-words">{loc}</td>
                    <td className="p-2 align-top break-words">{content}</td>
                    <td className="p-2 text-rose-600 font-bold text-center align-top break-words">{checksStr}</td>
                    <td className="p-2 font-bold text-center align-top break-words">{datesStr}</td>
                    <td className="p-2 align-top">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => onSelect(p.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex-1 flex items-center justify-center gap-1" title="読込">
                          <Download size={14} /> 読込
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 flex-1 flex items-center justify-center gap-1" title="削除">
                          <Trash2 size={14} /> 削除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-slate-50 rounded-b-xl text-right">
          <button onClick={onClose} className="bg-slate-500 text-white px-6 py-2 rounded text-sm hover:bg-slate-600 font-bold">閉じる</button>
        </div>
      </div>
    </div>
  );
}
