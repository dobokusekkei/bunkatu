import React, { useState, useEffect } from 'react';
import { useDialog } from './DialogContext';

export default function GaigyoModal({ onClose }: { onClose: () => void }) {
  const { showAlert } = useDialog();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchGaigyoData = async () => {
      try {
        const res = await fetch('/api/plans/all');
        const data = await res.json();
        
        let newRows: any[] = [];
        data.forEach((p: any) => {
          let parsed: any = {};
          try { parsed = JSON.parse(p.form_data); } catch(e) {}
          
          const jobContent = parsed.job_content || '';
          const location = parsed.location || '';
          
          let yorudatsuData: any[] = [];
          if (parsed.yorudatsu_csv_data) {
            try { yorudatsuData = JSON.parse(parsed.yorudatsu_csv_data); } catch(e) {}
          }

          for (let i = 1; i <= 5; i++) {
            const rawDate = parsed['date_'+i];
            if (!rawDate) continue;
            
            const reserve = parsed['reserve_'+i] ? ' （予備日）' : '';
            const gyomuName = jobContent + reserve;
            
            const leader = parsed['our_leader_'+i] || '';
            const phone = parsed['our_phone_'+i] || '';
            
            let workers = [];
            for (let w = 1; w <= 4; w++) {
              if (parsed['our_w'+w+'_'+i]) workers.push(parsed['our_w'+w+'_'+i]);
            }
            const workerStr = workers.join(', ');
            
            const start = parsed['start_'+i] || '';
            const end = parsed['end_'+i] || '';
            let dayNight = '';
            if (start) {
              const h = parseInt(start.split(':')[0], 10);
              dayNight = (h >= 6 && h < 18) ? '昼' : '夜';
            }
            const formatTime = (t: string) => t ? parseInt(t.split(':')[0], 10) + ':' + t.split(':')[1] : '';
            const timeStr = (start || end) ? `${formatTime(start)}～${formatTime(end)}` : '';
            
            let yoruNo = '';
            const ourCl = parsed['our_cl_'+i] || '';
            if (ourCl && yorudatsuData.length > 0) {
              const targetDate = new Date(rawDate).toISOString().split('T')[0];
              const targetName = ourCl.replace(/[\s　]/g, '');
              
              for (let r of yorudatsuData) {
                if (r.length > 28 && r[0].trim() !== '') {
                  let cDateStr = r[0].trim().replace(/\//g, '-');
                  let dParts = cDateStr.split('-');
                  if (dParts.length === 3) cDateStr = `${dParts[0]}-${dParts[1].padStart(2,'0')}-${dParts[2].padStart(2,'0')}`;
                  const cName = r[8] ? r[8].replace(/[\s　]/g, '') : '';
                  
                  if (targetDate === cDateStr && targetName === cName) { 
                    yoruNo = r[2] ? r[2].trim() : ''; 
                    break; 
                  }
                } else if (r.length === 8 && r[0].trim() !== '') {
                  let cDateStr = r[0].trim().replace(/\//g, '-');
                  let dParts = cDateStr.split('-');
                  if (dParts.length === 3) cDateStr = `${dParts[0]}-${dParts[1].padStart(2,'0')}-${dParts[2].padStart(2,'0')}`;
                  const cName = r[2] ? r[2].replace(/[\s　]/g, '') : '';
                  
                  if (targetDate === cDateStr && targetName === cName) { 
                    yoruNo = r[1] ? r[1].trim() : ''; 
                    break; 
                  }
                }
              }
            }
            
            if (yoruNo) {
              let numMatch = yoruNo.match(/\d+/);
              if (numMatch) {
                yoruNo = yoruNo.replace(numMatch[0], String(parseInt(numMatch[0], 10)).padStart(3, '0'));
              }
            }
            
            const isRyuchi = parsed['chk_ryuchi_'+i] ? 'あり' : '';
            const partName = parsed['part_name_'+i] || '';
            const partLeader = parsed['part_leader_'+i] || '';
            const partPhone = parsed['part_phone_'+i] || '';
            const partCount = parsed['part_count_'+i] || '';
            const partGCount = parsed['part_g_count_'+i] || '';
            const partTCount = parsed['part_t_count_'+i] || '';
            const partOther = parsed['part_other_'+i] || '';

            newRows.push({
              rawDate, gyomuName, leader, phone, workerStr,
              dayNight, timeStr, yoruNo, isRyuchi, location,
              partName, partLeader, partPhone, partCount,
              partGCount, partTCount, partOther
            });
          }
        });
        
        newRows.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
        setRows(newRows);
      } catch (error) {
        console.error(error);
        showAlert('外業管理表データの生成に失敗しました。');
      }
    };
    
    fetchGaigyoData();
  }, []);

  const exportGaigyoExcel = async () => {
    try {
      const exportData = rows.map(r => [
        '',
        r.rawDate,
        '',
        r.gyomuName,
        r.leader,
        r.phone,
        r.workerStr,
        r.dayNight,
        r.timeStr,
        r.yoruNo,
        r.isRyuchi,
        r.location,
        r.partName,
        r.partLeader,
        r.partPhone,
        r.partCount,
        r.partGCount,
        r.partTCount,
        r.partOther
      ]);

      const res = await fetch('/api/export/gaigyo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `外業管理表_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        showAlert('【テスト環境】Excel出力シミュレーション（※Vercel上では出力されません）');
      }
    } catch (error) {
      showAlert('【テスト環境】Excel出力シミュレーション（※Vercel上では出力されません）');
    }
  };

  const dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[1800px] max-h-[95vh] flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
          <h3 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            📋 外業管理表
            <small className="text-slate-500 font-normal text-sm ml-2">(※テキストボックスは自由に追記できます)</small>
          </h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-bold flex items-center gap-1">
              🖨️ 印刷する
            </button>
            <button onClick={exportGaigyoExcel} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold flex items-center gap-1">
              📊 Excel出力
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 font-bold">
              閉じる
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <th className="p-2 border border-slate-300 w-[30px]">No.</th>
                <th className="p-2 border border-slate-300 w-[90px]">作業日</th>
                <th className="p-2 border border-slate-300 w-[40px]">曜日</th>
                <th className="p-2 border border-slate-300 w-[150px]">業務名</th>
                <th className="p-2 border border-slate-300 w-[80px]">作業指揮者</th>
                <th className="p-2 border border-slate-300 w-[110px]">携帯番号</th>
                <th className="p-2 border border-slate-300 w-[120px]">作業員</th>
                <th className="p-2 border border-slate-300 w-[50px]">昼夜別</th>
                <th className="p-2 border border-slate-300 w-[90px]">時間帯</th>
                <th className="p-2 border border-slate-300 w-[80px]">夜達番号等</th>
                <th className="p-2 border border-slate-300 w-[120px]">関連夜達留変等</th>
                <th className="p-2 border border-slate-300 w-[120px]">場所</th>
                <th className="p-2 border border-slate-300 w-[120px]">業者名①</th>
                <th className="p-2 border border-slate-300 w-[80px]">作業責任者</th>
                <th className="p-2 border border-slate-300 w-[110px]">業者携帯</th>
                <th className="p-2 border border-slate-300 w-[40px]">人数</th>
                <th className="p-2 border border-slate-300 w-[40px]">列監</th>
                <th className="p-2 border border-slate-300 w-[40px]">整理員</th>
                <th className="p-2 border border-slate-300 w-[120px]">備考</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const d = new Date(r.rawDate);
                const w = dayOfWeekStr[d.getDay()];
                const dateFmt = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
                
                return (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="p-1 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-1 border border-slate-300 text-center">{dateFmt}</td>
                    <td className="p-1 border border-slate-300 text-center">{w}</td>
                    <td className="p-1 border border-slate-300">{r.gyomuName}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.leader}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.phone}</td>
                    <td className="p-1 border border-slate-300">{r.workerStr}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.dayNight}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.timeStr}</td>
                    <td className="p-1 border border-slate-300 text-center font-bold text-indigo-700">{r.yoruNo}</td>
                    <td className="p-0 border border-slate-300"><input type="text" defaultValue={r.isRyuchi} className="w-full p-1 border-none focus:ring-1 focus:ring-indigo-500" /></td>
                    <td className="p-1 border border-slate-300">{r.location}</td>
                    <td className="p-1 border border-slate-300">{r.partName}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.partLeader}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.partPhone}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.partCount}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.partGCount}</td>
                    <td className="p-1 border border-slate-300 text-center">{r.partTCount}</td>
                    <td className="p-0 border border-slate-300"><input type="text" defaultValue={r.partOther} className="w-full p-1 border-none focus:ring-1 focus:ring-indigo-500" /></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={19} className="p-8 text-center text-slate-500">外業管理表のデータがありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
