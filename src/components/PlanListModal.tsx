import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from './DialogContext';

interface PlanListModalProps {
  onClose: () => void;
  onSelect: (id: number) => void;
  plans: any[];
  fetchData: () => void;
  teams?: any[]; // チーム名解決および検索用
}

export default function PlanListModal({ onClose, onSelect, plans, fetchData, teams = [] }: PlanListModalProps) {
  const { showConfirm, showAlert } = useDialog();

  // --- 検索フィルター用 State ---
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);

  // デフォルト日付のセット（先月1日 〜 来月末日）
  const setDefaultDateRange = () => {
    const now = new Date();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const format = (d: Date) => {
      const m = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return `${d.getFullYear()}-${m}-${day}`;
    };

    setFromDate(format(firstDayOfLastMonth));
    setToDate(format(lastDayOfNextMonth));
  };

  // 初回表示時にデフォルト日付をセット
  useEffect(() => {
    setDefaultDateRange();
  }, []);

  const handleCheckChange = (val: string) => {
    setSelectedChecks(prev => 
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    );
  };

  const resetFilter = () => {
    setKeyword('');
    setSelectedTeam('');
    setSelectedChecks([]);
    setDefaultDateRange();
  };

  const handleDelete = async (id: number) => {
    showConfirm('この保存データを削除しますか？', async () => {
      try {
        const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
        } else {
          showAlert('削除に失敗しました。');
        }
      } catch (error) {
        showAlert('削除エラーが発生しました。');
      }
    });
  };

  // --- データの整形とフィルタリング処理 ---
  const filteredPlans = useMemo(() => {
    const keywords = keyword.toLowerCase().split(/\s+/).filter(k => k);

    return plans.map(p => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(p.form_data);
      } catch(e) {}

      const jobNo = parsed.job_no || '';
      let teamName = '';
      if (parsed.team_id) {
        const t = teams.find(x => x.id == parsed.team_id);
        if (t) teamName = t.team_name;
      }
      const loc = parsed.location || '';
      const content = parsed.job_content || '';
      const creatorName = parsed.creator_name || p.user_name || '不明';
      const creatorDept = parsed.creator_department || p.user_department || '不明';
      const createdAtRaw = p.created_at ? p.created_at.split(' ')[0] : '';

      let dates = [];
      for (let i = 1; i <= 5; i++) {
        if (parsed[`date_${i}`]) {
          const d = parsed[`date_${i}`].split('-');
          dates.push(`${parseInt(d[1])}/${parseInt(d[2])}`);
        }
      }
      const datesStr = dates.join(', ');

      let parts = new Set<string>();
      for (let i = 1; i <= 5; i++) {
        if (parsed[`part_name_${i}`]) parts.add(parsed[`part_name_${i}`]);
      }
      const partsStr = Array.from(parts).join('、');

      // 手配・立会の略称変更
      let checks = new Set<string>();
      let checksArray: string[] = [];
      for (let i = 1; i <= 5; i++) {
        if (parsed[`chk_kido_${i}`]) { checks.add('軌道'); checksArray.push('軌道'); }
        if (parsed[`chk_denki_${i}`]) { checks.add('電気'); checksArray.push('電気'); }
        if (parsed[`chk_teiden_${i}`]) { checks.add('停電'); checksArray.push('停電'); }
        if (parsed[`chk_toro_${i}`]) { checks.add('トロ'); checksArray.push('トロ'); }
        if (parsed[`chk_kanban_${i}`]) { checks.add('表示板'); checksArray.push('表示板'); } // 変更
        if (parsed[`chk_fumikiri_${i}`]) { checks.add('鳴止'); checksArray.push('鳴止'); } // 変更
        if (parsed[`chk_ryuchi_${i}`]) { checks.add('留変'); checksArray.push('留変'); } // 変更
      }
      const checksStr = Array.from(checks).join('、');

      const searchText = [jobNo, teamName, loc, content, creatorName, creatorDept, datesStr, partsStr].join(' ').toLowerCase();

      return {
        id: p.id,
        createdAt: createdAtRaw,
        creatorDept,
        creatorName,
        jobNo,
        teamName,
        loc,
        content,
        checksStr,
        checksArray,
        datesStr,
        partsStr,
        searchText
      };
    }).filter(p => {
      // 1. 登録日のフィルタリング (範囲指定)
      if (fromDate && p.createdAt < fromDate) return false;
      if (toDate && p.createdAt > toDate) return false;

      // 2. キーワードのフィルタリング (AND検索)
      for (let k of keywords) {
        if (!p.searchText.includes(k)) return false;
      }

      // 3. チームのフィルタリング (OR検索 / 完全一致)
      if (selectedTeam && p.teamName !== selectedTeam) return false;

      // 4. 手配・立会のフィルタリング (すべて含む AND検索)
      for (let reqCheck of selectedChecks) {
        if (!p.checksArray.includes(reqCheck)) return false;
      }

      return true;
    });
  }, [plans, teams, fromDate, toDate, keyword, selectedTeam, selectedChecks]);

  // プルダウン用のユニークなチーム名リスト
  const uniqueTeamNames = useMemo(() => {
    return Array.from(new Set(teams.map(t => t.team_name))).filter(Boolean);
  }, [teams]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[1500px] max-h-[95vh] flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 m-0">📂 保存データ一覧</h3>
          <button onClick={onClose} className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-bold">
            閉じる
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* 検索・絞り込みフィルター エリア */}
          <div className="bg-[#f1f8ff] p-4 rounded-lg mb-4 border border-[#cce5ff] text-[13px]">
            <div className="flex flex-wrap gap-4 items-center mb-3">
              <div>
                <b className="text-[#005a9e] mr-2">📅 登録日:</b>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1" />
                <span className="mx-2">～</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1" />
                <button onClick={() => {setFromDate(''); setToDate('');}} className="ml-2 px-2 py-1 bg-slate-400 text-white rounded text-xs hover:bg-slate-500">クリア</button>
              </div>
              <div>
                <b className="text-[#005a9e] mr-2">🔍 キーワード (複数AND検索):</b>
                <input 
                  type="text" 
                  value={keyword} 
                  onChange={e => setKeyword(e.target.value)} 
                  placeholder="工番、場所、氏名など" 
                  className="border rounded px-2 py-1 w-64"
                />
              </div>
              <div>
                <b className="text-[#005a9e] mr-2">🏢 チーム:</b>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="border rounded px-2 py-1 w-40">
                  <option value="">すべて表示</option>
                  {uniqueTeamNames.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <b className="text-[#005a9e] min-w-[80px] leading-tight">✅ 手配・立会<br/>(AND検索):</b>
              {['軌道', '電気', '停電', 'トロ', '表示板', '鳴止', '留変'].map(chk => (
                <label key={chk} className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedChecks.includes(chk)}
                    onChange={() => handleCheckChange(chk)}
                    className="cursor-pointer"
                  /> {chk}
                </label>
              ))}
              <button 
                onClick={resetFilter} 
                className="ml-auto px-3 py-1.5 bg-slate-500 text-white rounded font-medium hover:bg-slate-600"
              >
                🔄 検索条件をすべてリセット
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* DB保存名の列を削除し、レイアウトを調整 */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2 w-[8%]">登録日</th>
                  <th className="border border-slate-300 p-2 w-[9%]">部署</th>
                  <th className="border border-slate-300 p-2 w-[9%]">氏名</th>
                  <th className="border border-slate-300 p-2 w-[8%]">工番</th>
                  <th className="border border-slate-300 p-2 w-[8%]">チーム</th>
                  <th className="border border-slate-300 p-2 w-[14%]">作業場所</th>
                  <th className="border border-slate-300 p-2 w-[16%]">工事内容</th>
                  <th className="border border-slate-300 p-2 w-[9%]">手配・立会</th>
                  <th className="border border-slate-300 p-2 w-[10%]">作業日時</th>
                  <th className="border border-slate-300 p-2 w-[10%]">外注業者</th>
                  <th className="border border-slate-300 p-2 w-[90px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(p => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-indigo-50/30">
                    <td className="border border-slate-300 p-2 text-center">{p.createdAt}</td>
                    <td className="border border-slate-300 p-2">{p.creatorDept}</td>
                    <td className="border border-slate-300 p-2">{p.creatorName}</td>
                    <td className="border border-slate-300 p-2">{p.jobNo}</td>
                    <td className="border border-slate-300 p-2">{p.teamName}</td>
                    <td className="border border-slate-300 p-2">{p.loc}</td>
                    <td className="border border-slate-300 p-2">{p.content}</td>
                    <td className="border border-slate-300 p-2 text-red-600 font-bold text-[11px] leading-tight">{p.checksStr}</td>
                    <td className="border border-slate-300 p-2 font-bold">{p.datesStr}</td>
                    <td className="border border-slate-300 p-2">{p.partsStr}</td>
                    <td className="border border-slate-300 p-2">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { onSelect(p.id); onClose(); }} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">
                          読込
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700">
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPlans.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">条件に一致するデータが見つかりません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
