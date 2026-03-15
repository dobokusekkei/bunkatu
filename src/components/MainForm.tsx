import React, { useState } from 'react';
import { useDialog } from './DialogContext';
import { FileText } from 'lucide-react';

export default function MainForm({ 
  formData, 
  setFormData, 
  personnel, 
  templates, 
  teams,
  setIsTemplateModalOpen,
  user
}: { 
  formData: any, 
  setFormData: any, 
  personnel: any[], 
  templates: any[], 
  teams: any[],
  setIsTemplateModalOpen: (open: boolean) => void,
  user: any
}) {
  const { showAlert, showConfirm } = useDialog();
  const [workerCols, setWorkerCols] = useState(1);
  
  // ★ ユーザーの部署に基づいて、選択可能なチームを絞り込む
  const filteredTeams = teams.filter(t => {
    if (user.role === '管理者') return true; // 管理者はすべて選択可能
    return t.department === user.department; // 一般ユーザーは自分の部署のチームのみ
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => {
        const newData = { ...prev, [name]: value };
        
        if (name.startsWith('start_') || name.startsWith('our_leader_')) {
          const dayMatch = name.match(/_(\d+)$/);
          if (dayMatch) {
            const day = dayMatch[1];
            const leader = name.startsWith('our_leader_') ? value : newData[`our_leader_${day}`];
            const start = name.startsWith('start_') ? value : newData[`start_${day}`];
            
            if (leader && start) {
              const hour = parseInt(start.split(':')[0], 10);
              if (hour <= 5 || hour >= 18) {
                newData[`our_cl_${day}`] = leader;
              } else {
                newData[`our_cl_${day}`] = '';
              }
            } else if (!start) {
              newData[`our_cl_${day}`] = '';
            }
          }
        }
        return newData;
      });
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    if (!tId) return;
    const t = templates.find(x => x.id == tId);
    if (t) {
      setFormData((prev: any) => ({
        ...prev,
        safety_measures: t.content ? t.content.replace(/\\n/g, '\n') : ''
      }));
    }
    e.target.value = '';
  };

  const handleDangerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev: any) => {
      const currentDangers = prev.dangers || [];
      if (checked) {
        return { ...prev, dangers: [...currentDangers, value] };
      } else {
        return { ...prev, dangers: currentDangers.filter((d: string) => d !== value) };
      }
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      setFormData((prev: any) => ({
        ...prev,
        yorudatsu_csv_data: JSON.stringify(rows)
      }));
      showAlert('夜間作業連絡票CSVを読み込みました。');
    };
    reader.readAsText(file, 'Shift_JIS');
  };

  const clearDay = (day: number) => {
    showConfirm(`${day}日目のこの項目の入力内容をクリアしますか？`, () => {
      setFormData((prev: any) => {
        const newData = { ...prev };
        Object.keys(newData).forEach(key => {
          if (key.endsWith(`_${day}`)) {
            if (typeof newData[key] === 'boolean') {
              newData[key] = false;
            } else {
              newData[key] = '';
            }
          }
        });
        return newData;
      });
    });
  };

  const handleDragStart = (e: React.DragEvent, day: number) => {
    e.dataTransfer.setData('text/plain', day.toString());
  };

  const handleDrop = (e: React.DragEvent, toDay: number) => {
    e.preventDefault();
    const fromDay = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromDay && fromDay !== toDay) {
      showConfirm(`${fromDay}日目のデータを${toDay}日目にコピーしますか？`, () => {
        setFormData((prev: any) => {
          const newData = { ...prev };
          Object.keys(prev).forEach(key => {
            if (key.endsWith(`_${fromDay}`)) {
              const newKey = key.replace(`_${fromDay}`, `_${toDay}`);
              newData[newKey] = prev[key];
            }
          });
          return newData;
        });
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const setTime = (start: string, end: string, day: number) => {
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [`start_${day}`]: start,
        [`end_${day}`]: end
      };
      
      const leader = newData[`our_leader_${day}`];
      if (leader && start) {
        const hour = parseInt(start.split(':')[0], 10);
        if (hour <= 5 || hour >= 18) {
          newData[`our_cl_${day}`] = leader;
        } else {
          newData[`our_cl_${day}`] = '';
        }
      } else if (!start) {
        newData[`our_cl_${day}`] = '';
      }
      return newData;
    });
  };

  const days = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-full mx-auto overflow-x-auto">
      {/* 1. 基本情報 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2 flex justify-between items-center">
        1. 基本情報
      </div>
      <table className="w-full border-collapse border border-slate-300 bg-white text-sm mb-4">
        <tbody>
          <tr>
            <td className="bg-slate-100 p-2 border border-slate-300 w-[10%]">工番 (L12)</td>
            <td className="p-2 border border-slate-300 w-[12%]"><input type="text" name="job_no" value={formData.job_no || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
            <td className="bg-slate-100 p-2 border border-slate-300 w-[8%]">チーム</td>
            <td className="p-2 border border-slate-300 w-[15%]">
              {/* ★ 絞り込んだチーム(filteredTeams)のみを表示 */}
              <select name="team_id" value={formData.team_id || ''} onChange={handleChange} className="w-full border rounded p-1">
                <option value="">選択</option>
                {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
              </select>
            </td>
            <td className="bg-slate-100 p-2 border border-slate-300 w-[12%]">作業場所 (B13)</td>
            <td className="p-2 border border-slate-300 w-[43%]"><input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
          </tr>
          <tr>
            <td className="bg-slate-100 p-2 border border-slate-300">工事内容 (B12)</td>
            <td colSpan={5} className="p-2 border border-slate-300"><input type="text" name="job_content" value={formData.job_content || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
          </tr>
          <tr>
            <td className="bg-slate-100 p-2 border border-slate-300 align-top">作業内容 (B35)</td>
            <td colSpan={5} className="p-2 border border-slate-300"><textarea name="work_detail" value={formData.work_detail || ''} onChange={handleChange} rows={6} className="w-full border rounded p-1"></textarea></td>
          </tr>
        </tbody>
      </table>

      {/* 2. 予測される危険 ＆ 安全対策 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2 flex justify-between items-center">
        2. 予測される危険 ＆ 安全対策
      </div>
      <div className="p-4 border border-slate-300 bg-white mb-4">
        <div className="mb-4 flex flex-wrap gap-4 items-center min-h-[40px]">
          <span className="font-bold">予測される危険 (該当箇所に赤丸を描画します):</span>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="dangers" value="触車" checked={formData.dangers?.includes('触車') || false} onChange={handleDangerChange} /> 触車</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="dangers" value="感電" checked={formData.dangers?.includes('感電') || false} onChange={handleDangerChange} /> 感電</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="dangers" value="墜落" checked={formData.dangers?.includes('墜落') || false} onChange={handleDangerChange} /> 墜落</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="dangers" value="その他" checked={formData.dangers?.includes('その他') || false} onChange={handleDangerChange} /> その他</label>
          {formData.dangers?.includes('その他') && (
            <input type="text" name="danger_other_text" value={formData.danger_other_text || ''} onChange={handleChange} placeholder="内容(10文字程度)" maxLength={10} className="border rounded p-1 w-48" />
          )}
        </div>
        <div className="flex justify-between items-end mb-1">
          <label className="font-bold">安全対策 (B55)</label>
          <div className="flex items-center gap-2">
            <select onChange={handleTemplateSelect} className="border rounded p-1 text-xs bg-slate-100">
              <option value="">テンプレートから入力...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <button type="button" onClick={() => setIsTemplateModalOpen(true)} className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-xs">
              <FileText size={14} /> テンプレート管理
            </button>
          </div>
        </div>
        <textarea name="safety_measures" value={formData.safety_measures || ''} onChange={handleChange} rows={10} className="w-full border rounded p-2 text-sm"></textarea>
      </div>

      {/* 3. 作業日時 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2 flex items-center gap-4">
        3. 作業日時
        <div className="text-xs font-normal flex items-center bg-white text-slate-800 px-2 py-1 rounded">
          <span className="bg-amber-400 text-slate-900 px-1 rounded mr-2 font-bold">自動転記</span>
          📁 夜達CSVを取り込む: 
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="ml-2 text-xs w-[350px] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-slate-200 rounded bg-white" />
          {formData.yorudatsu_csv_data && <span className="text-emerald-600 font-bold ml-2">✅ 読込済</span>}
        </div>
      </div>
      <div className="overflow-x-auto mb-4 border border-slate-300">
        <table className="w-max border-collapse bg-white text-sm text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border w-[80px]">コピー</th>
              <th className="p-2 border w-[210px]">作業日時</th>
              <th className="p-2 border w-[280px]">時間入力</th>
              <th className="p-2 border w-[345px]">手配・立会確認</th>
              <th className="p-2 border w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={`day-${day}`}>
                <td className="p-2 border bg-amber-200 cursor-grab border-r-4 border-r-slate-300 text-center whitespace-nowrap" draggable onDragStart={(e) => handleDragStart(e, day)} onDrop={(e) => handleDrop(e, day)} onDragOver={handleDragOver}>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold">{day}日目</span>
                    <span className="text-[10px] text-slate-600">≡掴む≡</span>
                  </div>
                </td>
                <td className="p-2 border">
                  <div className="flex items-center justify-center gap-2">
                    <input type="date" name={`date_${day}`} value={formData[`date_${day}`] || ''} onChange={handleChange} className="border rounded p-1 w-[135px]" />
                    <label className="text-xs cursor-pointer whitespace-nowrap"><input type="checkbox" name={`reserve_${day}`} checked={formData[`reserve_${day}`] || false} onChange={handleChange} /> 予備日</label>
                  </div>
                </td>
                <td className="p-2 border">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setTime('09:00', '17:00', day)} className="bg-amber-400 px-2 py-1 rounded text-xs font-bold">昼</button>
                    <button type="button" onClick={() => setTime('00:00', '05:00', day)} className="bg-slate-600 text-white px-2 py-1 rounded text-xs font-bold">夜</button>
                    <input type="time" name={`start_${day}`} value={formData[`start_${day}`] || ''} onChange={handleChange} className="border rounded p-1 w-[90px]" />
                    ～
                    <input type="time" name={`end_${day}`} value={formData[`end_${day}`] || ''} onChange={handleChange} className="border rounded p-1 w-[90px]" />
                  </div>
                </td>
                <td className="p-2 border text-left">
                  <div className="flex flex-wrap gap-2 w-full">
                    <label className="text-xs cursor-pointer w-[75px]"><input type="checkbox" name={`chk_kido_${day}`} checked={formData[`chk_kido_${day}`] || false} onChange={handleChange} /> 軌道立会</label>
                    <label className="text-xs cursor-pointer w-[75px]"><input type="checkbox" name={`chk_denki_${day}`} checked={formData[`chk_denki_${day}`] || false} onChange={handleChange} /> 電気立会</label>
                    <label className="text-xs cursor-pointer w-[60px]"><input type="checkbox" name={`chk_teiden_${day}`} checked={formData[`chk_teiden_${day}`] || false} onChange={handleChange} /> 停電</label>
                    <label className="text-xs cursor-pointer w-[75px]"><input type="checkbox" name={`chk_toro_${day}`} checked={formData[`chk_toro_${day}`] || false} onChange={handleChange} /> トロ使用</label>
                    <label className="text-xs cursor-pointer w-[85px]"><input type="checkbox" name={`chk_kanban_${day}`} checked={formData[`chk_kanban_${day}`] || false} onChange={handleChange} /> 工事表示板</label>
                    <label className="text-xs cursor-pointer w-[75px]"><input type="checkbox" name={`chk_fumikiri_${day}`} checked={formData[`chk_fumikiri_${day}`] || false} onChange={handleChange} /> 踏切鳴止</label>
                    <label className="text-xs cursor-pointer w-[75px]"><input type="checkbox" name={`chk_ryuchi_${day}`} checked={formData[`chk_ryuchi_${day}`] || false} onChange={handleChange} /> 留置変更</label>
                  </div>
                </td>
                <td className="p-2 border text-center">
                  <button type="button" onClick={() => clearDay(day)} className="border border-rose-500 text-rose-500 px-3 py-1 rounded text-xs hover:bg-rose-500 hover:text-white whitespace-nowrap">クリア</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. 当社体制 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2 flex justify-between items-center">
        4. 当社体制
        <div>
          {workerCols < 4 && <button type="button" onClick={() => setWorkerCols(prev => prev + 1)} className="bg-amber-400 text-slate-900 px-2 py-1 rounded text-xs font-bold mr-2">＋ 作業員を追加表示</button>}
          {workerCols > 1 && <button type="button" onClick={() => setWorkerCols(prev => prev - 1)} className="bg-rose-500 text-white px-2 py-1 rounded text-xs font-bold">－ 枠を減らす</button>}
        </div>
      </div>
      <div className="overflow-x-auto mb-4 border border-slate-300">
        <table className="w-max border-collapse bg-white text-sm text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border w-[80px]">コピー</th>
              <th className="p-2 border w-[140px]">当社 指揮者</th>
              <th className="p-2 border w-[140px]">携帯番号</th>
              <th className="p-2 border w-[140px]">作業員1</th>
              {workerCols >= 2 && <th className="p-2 border w-[140px]">作業員2</th>}
              {workerCols >= 3 && <th className="p-2 border w-[140px]">作業員3</th>}
              {workerCols >= 4 && <th className="p-2 border w-[140px]">作業員4</th>}
              <th className="p-2 border w-[140px]">閉鎖責任者</th>
              <th className="p-2 border w-[140px]">監視員1</th>
              <th className="p-2 border w-[140px]">監視員2</th>
              <th className="p-2 border w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const handleLeaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                handleChange(e);
                const val = e.target.value;
                const p = personnel.find(x => x.name === val);
                if (p) {
                  setFormData((prev: any) => ({ ...prev, [`our_phone_${day}`]: p.phone }));
                } else {
                  setFormData((prev: any) => ({ ...prev, [`our_phone_${day}`]: '' }));
                }
              };

              return (
                <tr key={`our-${day}`}>
                  <td className="p-2 border bg-amber-200 cursor-grab border-r-4 border-r-slate-300 text-center whitespace-nowrap" draggable onDragStart={(e) => handleDragStart(e, day)} onDrop={(e) => handleDrop(e, day)} onDragOver={handleDragOver}>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bold">{day}日目</span>
                      <span className="text-[10px] text-slate-600">≡掴む≡</span>
                    </div>
                  </td>
                  <td className="p-2 border">
                    <select name={`our_leader_${day}`} value={formData[`our_leader_${day}`] || ''} onChange={handleLeaderChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border"><input type="text" name={`our_phone_${day}`} value={formData[`our_phone_${day}`] || ''} readOnly className="w-full border rounded p-1 bg-slate-100" /></td>
                  <td className="p-2 border">
                    <select name={`our_w1_${day}`} value={formData[`our_w1_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  {workerCols >= 2 && <td className="p-2 border">
                    <select name={`our_w2_${day}`} value={formData[`our_w2_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>}
                  {workerCols >= 3 && <td className="p-2 border">
                    <select name={`our_w3_${day}`} value={formData[`our_w3_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>}
                  {workerCols >= 4 && <td className="p-2 border">
                    <select name={`our_w4_${day}`} value={formData[`our_w4_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>}
                  <td className="p-2 border">
                    <select name={`our_cl_${day}`} value={formData[`our_cl_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border">
                    <select name={`our_g1_${day}`} value={formData[`our_g1_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border">
                    <select name={`our_g2_${day}`} value={formData[`our_g2_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {personnel.filter(p => p.type === 'our').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border text-center">
                    <button type="button" onClick={() => clearDay(day)} className="border border-rose-500 text-rose-500 px-3 py-1 rounded text-xs hover:bg-rose-500 hover:text-white whitespace-nowrap">クリア</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. 協力業者 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2">
        5. 協力業者
      </div>
      <div className="overflow-x-auto mb-4 border border-slate-300">
        <table className="w-max border-collapse bg-white text-sm text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border w-[80px]">コピー</th>
              <th className="p-2 border w-[250px]">協力業者 業者名</th>
              <th className="p-2 border w-[140px]">協力業者 責任者</th>
              <th className="p-2 border w-[140px]">携帯番号</th>
              <th className="p-2 border w-[60px]">従事者</th>
              <th className="p-2 border w-[60px]">監視員</th>
              <th className="p-2 border w-[60px]">誘導員</th>
              <th className="p-2 border w-[60px]">その他</th>
              <th className="p-2 border w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const companies = Array.from(new Set(personnel.filter(p => p.type === 'partner').map(p => p.company)));
              const currentCompany = formData[`part_name_${day}`];
              const leaders = personnel.filter(p => p.type === 'partner' && p.company === currentCompany);

              const handleLeaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                handleChange(e);
                const val = e.target.value;
                const p = personnel.find(x => x.name === val);
                if (p) {
                  setFormData((prev: any) => ({ ...prev, [`part_phone_${day}`]: p.phone }));
                } else {
                  setFormData((prev: any) => ({ ...prev, [`part_phone_${day}`]: '' }));
                }
              };

              return (
                <tr key={`part-${day}`}>
                  <td className="p-2 border bg-amber-200 cursor-grab border-r-4 border-r-slate-300 text-center whitespace-nowrap" draggable onDragStart={(e) => handleDragStart(e, day)} onDrop={(e) => handleDrop(e, day)} onDragOver={handleDragOver}>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bold">{day}日目</span>
                      <span className="text-[10px] text-slate-600">≡掴む≡</span>
                    </div>
                  </td>
                  <td className="p-2 border">
                    <select name={`part_name_${day}`} value={formData[`part_name_${day}`] || ''} onChange={(e) => { handleChange(e); setFormData((prev: any) => ({ ...prev, [`part_leader_${day}`]: '', [`part_phone_${day}`]: '' })); }} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border">
                    <select name={`part_leader_${day}`} value={formData[`part_leader_${day}`] || ''} onChange={handleLeaderChange} className="w-full border rounded p-1">
                      <option value="">選択</option>
                      {leaders.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border"><input type="text" name={`part_phone_${day}`} value={formData[`part_phone_${day}`] || ''} readOnly className="w-full border rounded p-1 bg-slate-100" /></td>
                  <td className="p-2 border"><input type="text" name={`part_count_${day}`} value={formData[`part_count_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                  <td className="p-2 border"><input type="text" name={`part_g_count_${day}`} value={formData[`part_g_count_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                  <td className="p-2 border"><input type="text" name={`part_t_count_${day}`} value={formData[`part_t_count_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                  <td className="p-2 border"><input type="text" name={`part_other_${day}`} value={formData[`part_other_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                  <td className="p-2 border text-center">
                    <button type="button" onClick={() => clearDay(day)} className="border border-rose-500 text-rose-500 px-3 py-1 rounded text-xs hover:bg-rose-500 hover:text-white whitespace-nowrap">クリア</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. 発注者立会人 */}
      <div className="bg-indigo-600 text-white p-2 font-bold rounded mt-6 mb-2">
        6. 発注者立会人
      </div>
      <div className="overflow-x-auto mb-4 border border-slate-300">
        <table className="w-max border-collapse bg-white text-sm text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border w-[80px]">コピー</th>
              <th className="p-2 border w-[100px]">人数 (C列)</th>
              <th className="p-2 border w-[500px]">所属部署・氏名 (D列)</th>
              <th className="p-2 border w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={`client-${day}`}>
                <td className="p-2 border bg-amber-200 cursor-grab border-r-4 border-r-slate-300 text-center whitespace-nowrap" draggable onDragStart={(e) => handleDragStart(e, day)} onDrop={(e) => handleDrop(e, day)} onDragOver={handleDragOver}>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold">{day}日目</span>
                    <span className="text-[10px] text-slate-600">≡掴む≡</span>
                  </div>
                </td>
                <td className="p-2 border"><input type="text" name={`client_num_${day}`} value={formData[`client_num_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                <td className="p-2 border"><input type="text" name={`client_name_${day}`} value={formData[`client_name_${day}`] || ''} onChange={handleChange} className="w-full border rounded p-1" /></td>
                <td className="p-2 border text-center">
                  <button type="button" onClick={() => clearDay(day)} className="border border-rose-500 text-rose-500 px-3 py-1 rounded text-xs hover:bg-rose-500 hover:text-white whitespace-nowrap">クリア</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
