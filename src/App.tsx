import React, { useState, useEffect, useRef } from 'react';
import { Users, Save, Download, FolderOpen, ClipboardList, Settings, BookOpen, UserCog, LogOut } from 'lucide-react';
import PersonnelModal from './components/PersonnelModal';
import TemplateModal from './components/TemplateModal';
import TeamModal from './components/TeamModal';
import PlanListModal from './components/PlanListModal';
import GaigyoModal from './components/GaigyoModal';
import MainForm from './components/MainForm';
import Login from './components/Login';
import UserManagementModal from './components/UserManagementModal';
import ManualModal from './components/ManualModal';
import { useDialog } from './components/DialogContext';

export default function App() {
  const { showAlert, showConfirm } = useDialog();
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // モーダル開閉用のState
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlanListModalOpen, setIsPlanListModalOpen] = useState(false);
  const [isGaigyoModalOpen, setIsGaigyoModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // データ管理用のState
  const [loadedPlanId, setLoadedPlanId] = useState<number | null>(null);
  const [loadedDates, setLoadedDates] = useState<string[]>(['', '', '', '', '']);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({});
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [loadedTitle, setLoadedTitle] = useState('');
  const prevJobNoRef = useRef('');

  // Vercelテスト環境かどうかの判定フラグ
  const isVercel = import.meta.env.VITE_IS_VERCEL === 'true';

  // 初回ロード時の認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      if (isVercel) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, [isVercel]);

  // Vercel等のバックエンド不在環境でもアプリがクラッシュしないようにする安全なFetch関数
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return []; 
    }
  };

  const fetchData = async () => {
    if (!user) return;
    if (isVercel) {
      setPlans([]); setPersonnel([]); setTemplates([]); setTeams([]);
      return;
    }
    
    try {
      const [plansRes, personnelRes, templatesRes, teamsRes] = await Promise.all([
        safeFetch('/api/plans/all'), 
        safeFetch('/api/personnel'),
        safeFetch('/api/templates'), 
        safeFetch('/api/teams')
      ]);
      setPlans(plansRes);
      setPersonnel(personnelRes);
      setTemplates(templatesRes);
      setTeams(teamsRes);
    } catch (error) {
      showAlert('データの取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isPersonnelModalOpen, isTemplateModalOpen, isTeamModalOpen]);

  const handleLogout = async () => {
    if (!isVercel) {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    }
    setUser(null);
  };

  // ==========================================
  // 保存処理（タイトルの自動生成・上書き判定）
  // ==========================================
  const handleSave = async () => {
    const job = formData.job_no || '';
    const content = formData.job_content || '';
    let autoTitle = `${job}_${content}`.trim();
    if (!autoTitle || autoTitle === '_') {
      autoTitle = `無題の計画書_${new Date().getTime()}`;
    }

    if (isVercel) {
      showAlert('【テスト環境】保存シミュレーション完了（※実際には保存されません）');
      return;
    }

    const currentDates = ['', '', '', '', ''];
    for (let i = 1; i <= 5; i++) {
      currentDates[i-1] = formData[`date_${i}`] || '';
    }

    const payload = { title: autoTitle, form_data: JSON.stringify(formData) };

    const performSave = async (isOverwrite: boolean) => {
      try {
        let res = isOverwrite && loadedPlanId
          ? await fetch(`/api/plans/${loadedPlanId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          : await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setLoadedPlanId(data.id);
          setLoadedDates(currentDates); 
          fetchData();
          showAlert('データベースに保存しました。');
        } else {
          showAlert(data.error || '保存エラーが発生しました。');
        }
      } catch (error) {
        showAlert('保存エラーが発生しました。');
      }
    };

    if (loadedPlanId && JSON.stringify(loadedDates) === JSON.stringify(currentDates)) {
      showConfirm("⚠️ 日付が変更されていないため、既存のデータを「上書き保存」します。\nよろしいですか？\n(キャンセルを押すと新規データとして保存します)", 
        () => performSave(true), 
        () => performSave(false)
      );
    } else {
      performSave(false);
    }
  };

  // ==========================================
  // 読込処理
  // ==========================================
  const handleLoadPlan = async () => {
    if (!loadedPlanId) return;
    const plan = plans.find(p => p.id === loadedPlanId);
    if (plan) {
      try { 
        const parsed = JSON.parse(plan.form_data);
        setFormData(parsed); 
        
        const tempDates = ['', '', '', '', ''];
        for (let i = 1; i <= 5; i++) {
          tempDates[i-1] = parsed[`date_${i}`] || '';
        }
        setLoadedDates(tempDates);

      } catch (e) {
        console.error("データのパースに失敗しました", e);
      }
    }
  };

  // ==========================================
  // Excel出力処理
  // ==========================================
  const handleExportPlan = async () => {
    if (isVercel) {
      showAlert('【テスト環境】Excel出力シミュレーション（※Vercel上では実際のExcel生成は行われません）');
      return;
    }

    try {
      const res = await fetch('/api/export/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `安全作業計画書_${formData.job_no || '未定'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      } else {
        showAlert('Excel出力に失敗しました。');
      }
    } catch (error) {
      showAlert('Excel出力エラーが発生しました。');
    }
  };

  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-sm">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
          <div className="flex justify-between items-center border-b-2 border-indigo-900 pb-2 mb-4">
            <h2 className="text-xl font-bold text-indigo-900">安全作業計画書 入力・DB管理システム</h2>
            <div className="text-slate-700 font-medium">👤 {user.name} ({user.department})</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
            <button onClick={() => setIsPersonnelModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-xs">
              <Users size={16} /> 名簿管理
            </button>
            <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-xs">
              <Settings size={16} /> チーム管理
            </button>
            
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium text-xs">
              <Save size={16} /> DBに保存
            </button>
            
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            
            <button onClick={() => setIsPlanListModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-900 rounded hover:bg-amber-600 font-medium text-xs">
              <FolderOpen size={16} /> 保存データ一覧
            </button>
            <button onClick={() => setIsGaigyoModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-medium text-xs ml-1">
              <ClipboardList size={16} /> 外業管理表
            </button>
            
            <div className="flex-1"></div>
            
            <button onClick={() => setIsManualModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-700 font-medium text-xs">
              <BookOpen size={16} /> 使い方
            </button>
            {user.role === '管理者' && (
              <button onClick={() => setIsUserManagementModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium text-xs ml-1">
                <UserCog size={16} /> ユーザー管理
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 font-medium text-xs ml-1">
              <LogOut size={16} /> ログアウト
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <MainForm 
            formData={formData} 
            setFormData={setFormData} 
            personnel={personnel} 
            templates={templates} 
            teams={teams} 
            setIsTemplateModalOpen={setIsTemplateModalOpen}
            user={user} 
          />
          
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
            <button 
              onClick={handleExportPlan} 
              className="inline-flex items-center justify-center gap-2 px-10 py-3 bg-[#217346] text-white rounded-lg hover:bg-[#1e6b3e] font-bold text-lg shadow-md transition-colors"
            >
              <Download size={24} /> 出力 (Excel形式でダウンロード)
            </button>
          </div>
        </div>
      </div>

      {isPersonnelModalOpen && <PersonnelModal onClose={() => setIsPersonnelModalOpen(false)} />}
      {isTemplateModalOpen && <TemplateModal onClose={() => setIsTemplateModalOpen(false)} />}
      
      {/* ★ チーム管理モーダルに user と fetchData を渡す */}
      {isTeamModalOpen && <TeamModal onClose={() => setIsTeamModalOpen(false)} user={user} fetchData={fetchData} />}
      
      {isPlanListModalOpen && (
        <PlanListModal 
          onClose={() => setIsPlanListModalOpen(false)} 
          onSelect={(id) => { 
            setLoadedPlanId(id); 
            setTimeout(() => document.getElementById('trigger-load')?.click(), 0); 
          }} 
          plans={plans} 
          teams={teams} 
          fetchData={fetchData} 
        />
      )}
      {isGaigyoModalOpen && <GaigyoModal onClose={() => setIsGaigyoModalOpen(false)} />}
      {isUserManagementModalOpen && <UserManagementModal onClose={() => setIsUserManagementModalOpen(false)} />}
      {isManualModalOpen && <ManualModal onClose={() => setIsManualModalOpen(false)} />}
      
      <button id="trigger-load" className="hidden" onClick={handleLoadPlan}></button>
    </div>
  );
}
