import React, { useState, useEffect, useRef } from 'react';
import { useDialog } from './DialogContext';

export default function GaigyoModal({ onClose }: { onClose: () => void }) {
  const { showAlert } = useDialog();
  const [rows, setRows] = useState<any[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const fetchData = async () => {
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
          if(parsed.yorudatsu_csv_data) {
            try { yorudatsuData = JSON.parse(parsed.yorudatsu_csv_data); } catch(e) {}
          }

          for(let i=1; i<=5; i++) {
            const rawDate = parsed[`date_${i}`];
            if(!rawDate) continue;
            
            const reserve = parsed[`reserve_${i}`] ? ' （予備日）' : '';
            const gyomuName = jobContent + reserve;
            
            const leader = parsed[`our_leader_${i}`] || '';
            const phone = parsed[`our_phone_${i}`] || '';
            
            let workers = [];
            for(let w=1; w<=4; w++) {
              if(parsed[`our_w${w}_${i}`]) workers.push(parsed[`our_w${w}_${i}`]);
            }
            const workerStr = workers.join(', ');
            
            const start = parsed[`start_${i}`] || '';
            const end = parsed[`end_${i}`] || '';
            let dayNight = '';
            if(start) {
              const h = parseInt(start.split(':')[0], 10);
              dayNight = (h >= 6 && h < 18) ? '昼' : '夜';
            }
            
            const formatTime = (t: string) => {
              if(!t) return '';
              let parts = t.split(':');
              if(parts.length === 2) return parseInt(parts[0], 10) + ':' + parts[1];
              return t;
            };
            const timeStr = (start || end) ? `${formatTime(start)}～${formatTime(end)}` : '';
            
            let yoruNo = '';
            const ourCl = parsed[`our_cl_${i}`] || '';
            if(ourCl && yorudatsuData.length > 0) {
              const targetDate = new Date(rawDate).toISOString().split('T')[0];
              const targetName = ourCl.replace(/[\s　]/g, '');
              for(let r of yorudatsuData) {
                if(r.length > 28 && r[0].trim() !== '') {
                  let cDateStr = r[0].trim().replace(/\//g, '-');
                  let dParts = cDateStr.split('-');
                  if(dParts.length === 3) cDateStr = `${dParts[0]}-${dParts[1].padStart(2,'0')}-${dParts[2].padStart(2,'0')}`;
                  const cName = r[8] ? r[8].replace(/[\s　]/g, '') : '';
                  if(targetDate === cDateStr && targetName === cName) { yoruNo = r[2] ? r[2].trim() : ''; break; }
                } else if (r.length === 8 && r[0].trim() !== '') {
                  let cDateStr = r[0].trim().replace(/\//g, '-');
                  let dParts = cDateStr.split('-');
                  if(dParts.length === 3) cDateStr = `${dParts[0]}-${dParts[1].padStart(2,'0')}-${dParts[2].padStart(2,'0')}`;
                  const cName = r[2] ? r[2].replace(/[\s　]/g, '') : '';
                  if(targetDate === cDateStr && targetName === cName) { yoruNo = r[1] ? r[1].trim() : ''; break; }
                }
              }
            }
            
            if (yoruNo) {
              let numMatch = yoruNo.match(/\d+/);
              if (numMatch) { yoruNo = yoruNo.replace(numMatch[0], String(parseInt(numMatch[0], 10)).padStart(3, '0')); }
            }
            
            const isRyuchi = parsed[`chk_ryuchi_${i}`] ? '留置変更あり' : '';
            const partName = parsed[`part_name_${i}`] || '';
            const partLeader = parsed[`part_leader_${i}`] || '';
            const partPhone = parsed[`part_phone_${i}`] || '';
            const partCount = parsed[`part_count_${i}`] || '';
            const partGCount = parsed[`part_g_count_${i}`] || '';
            const partTCount = parsed[`part_t_count_${i}`] || '';
            const partOther = parsed[`part_other_${i}`] || '';

            newRows.push({
              id: `${p.id}-${i}`,
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
        showAlert('データの取得に失敗しました。');
      }
    };

    fetchData();
  }, []);

  const handleExport = async () => {
    if (!tableRef.current) return;
    
    const exportData = [];
    const trs = tableRef.current.querySelectorAll('tbody tr');
    trs.forEach(tr => {
      const rowData: string[] = [];
      const tds = tr.querySelectorAll('td');
      tds.forEach((td, idx) => {
        const input = td.querySelector('input');
        if (input) {
          rowData.push(input.value);
        } else if (idx === 3) {
          // 業務名 (remove html tags if any)
          rowData.push(td.innerText.replace(/\n/g, ' ').trim());
        } else {
          rowData.push(td.innerText.replace(/\n/g, ' ').trim());
        }
      });
      exportData.push(rowData);
    });

    try {
      const res = await fetch('/api/export/gaigyo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaigyo_data: exportData })
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
        showAlert('Excel出力に失敗しました。');
      }
    } catch (error) {
      console.error(error);
      showAlert('Excel出力エラー');
    }
  };

  const dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:relative print:block print:bg-transparent print:z-auto">
      <div className="bg-white rounded-xl shadow-xl w-[98%] max-w-[1800px] max-h-[95vh] overflow-hidden flex flex-col p-6 print:shadow-none print:border-none print:w-full print:max-h-none print:p-0 print:m-0">
        
        <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2 mb-4 print:hidden">
          <h3 className="text-xl font-bold m-0 flex items-center gap-2">
            📋 外業管理表 
            <span className="text-sm text-slate-500 font-normal">(※テキストボックスは自由に追記できます)</span>
          </h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600">🖨️ 印刷する</button>
            <button onClick={handleExport} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-700">📊 Excel出力</button>
            <button onClick={onClose} className="bg-rose-600 text-white px-4 py-1.5 rounded text-sm hover:bg-rose-700">閉じる</button>
          </div>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto flex-1 print:overflow-visible print:h-auto">
          <table ref={tableRef} className="w-full border-collapse text-[11px] whitespace-nowrap print:w-full print:page-break-inside-auto">
            <thead>
              <tr className="bg-indigo-700 text-white print:bg-slate-200 print:text-black print:border-black">
                <th className="border border-slate-300 p-1 w-[30px] print:border-black">No.</th>
                <th className="border border-slate-300 p-1 w-[90px] print:border-black">作業日</th>
                <th className="border border-slate-300 p-1 w-[40px] print:border-black">曜日</th>
                <th className="border border-slate-300 p-1 w-[150px] print:border-black">業務名</th>
                <th className="border border-slate-300 p-1 w-[80px] print:border-black">作業指揮者</th>
                <th className="border border-slate-300 p-1 w-[110px] print:border-black">携帯番号</th>
                <th className="border border-slate-300 p-1 w-[120px] print:border-black">作業員</th>
                <th className="border border-slate-300 p-1 w-[50px] print:border-black">昼夜別</th>
                <th className="border border-slate-300 p-1 w-[90px] print:border-black">時間帯</th>
                <th className="border border-slate-300 p-1 w-[80px] print:border-black">夜達番号等</th>
                <th className="border border-slate-300 p-1 w-[120px] print:border-black">関連夜達留変等</th>
                <th className="border border-slate-300 p-1 w-[120px] print:border-black">場所</th>
                <th className="border border-slate-300 p-1 w-[120px] print:border-black">業者名①</th>
                <th className="border border-slate-300 p-1 w-[80px] print:border-black">作業責任者</th>
                <th className="border border-slate-300 p-1 w-[110px] print:border-black">業者携帯</th>
                <th className="border border-slate-300 p-1 w-[40px] print:border-black">人数</th>
                <th className="border border-slate-300 p-1 w-[40px] print:border-black">列監</th>
                <th className="border border-slate-300 p-1 w-[40px] print:border-black">整理員</th>
                <th className="border border-slate-300 p-1 w-[120px] print:border-black">備考</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const d = new Date(r.rawDate);
                const w = dayOfWeekStr[d.getDay()];
                const dateFmt = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
                
                return (
                  <tr key={r.id} className="print:page-break-inside-avoid">
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{idx + 1}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{dateFmt}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{w}</td>
                    <td className="border border-slate-300 p-1 text-left whitespace-normal min-w-[150px] print:border-black print:text-black">
                      {r.gyomuName.includes('（予備日）') ? (
                        <>
                          {r.gyomuName.replace('（予備日）', '')}
                          <span className="text-rose-600 text-[10px] border border-rose-600 px-1 rounded ml-1 print:text-black print:border-black">（予備日）</span>
                        </>
                      ) : r.gyomuName}
                    </td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.leader}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.phone}</td>
                    <td className="border border-slate-300 p-1 text-left whitespace-normal min-w-[120px] print:border-black print:text-black">{r.workerStr}</td>
                    <td className="border border-slate-300 p-1 text-center font-bold print:border-black print:text-black">{r.dayNight}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.timeStr}</td>
                    <td className="border border-slate-300 p-1 text-center font-bold text-indigo-700 text-[12px] print:border-black print:text-black">{r.yoruNo}</td>
                    <td className="border border-slate-300 p-1 print:border-black">
                      <input type="text" defaultValue={r.isRyuchi} placeholder="入力可" className="w-full p-0.5 border border-slate-300 rounded-sm text-[11px] print:border-none print:bg-transparent print:text-black" />
                    </td>
                    <td className="border border-slate-300 p-1 text-left whitespace-normal min-w-[120px] print:border-black print:text-black">{r.location}</td>
                    <td className="border border-slate-300 p-1 text-left whitespace-normal print:border-black print:text-black">{r.partName}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.partLeader}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.partPhone}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.partCount}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.partGCount}</td>
                    <td className="border border-slate-300 p-1 text-center print:border-black print:text-black">{r.partTCount}</td>
                    <td className="border border-slate-300 p-1 print:border-black">
                      <input type="text" defaultValue={r.partOther} placeholder="入力可" className="w-full p-0.5 border border-slate-300 rounded-sm text-[11px] print:border-none print:bg-transparent print:text-black" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
