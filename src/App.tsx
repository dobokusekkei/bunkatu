import React, { useState, useEffect, useRef } from 'react';
import { Users, Save, Download, FolderOpen, ClipboardList, Settings, FileText, LogOut, BookOpen, UserCog } from 'lucide-react';
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

  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlanListModalOpen, setIsPlanListModalOpen] = useState(false);
  const [isGaigyoModalOpen, setIsGaigyoModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [saveName, setSaveName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({});
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [loadedTitle, setLoadedTitle] = useState('');
  const prevJobNoRef = useRef('');

  // 初回ロード時の認証チェック
  // VercelではAPIがないため失敗しますが、エラーを握り潰してログイン画面へ誘導します
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        // Vercel等の環境でAPIが存在しない場合はスルーします
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // ★ ネットワークエラーを吸収する安全なFetch関数
  // Vercel環境で404エラーHTMLが返ってきた場合でも、空配列を返してアプリのクラッシュを防ぎます
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
    const [fetchedPlans, fetchedPersonnel, fetchedTemplates, fetchedTeams] = await Promise.all([
      safeFetch('/api/plans/all'),
      safeFetch('/api/personnel'),
      safeFetch('/api/templates'),
      safeFetch('/api/teams')
    ]);
    setPlans(fetchedPlans);
    setPersonnel(fetchedPersonnel);
    setTemplates(fetchedTemplates);
    setTeams(fetchedTeams);
  };

  useEffect(() => {
    fetchData();
  }, [user, isPersonnelModalOpen, isTemplateModalOpen, isTeamModalOpen]);

  // saveNameとjob_noの同期処理
  useEffect(() => {
    if (formData.job_no !== prevJobNoRef.current) {
      if (!saveName || saveName === '未定' || saveName === loadedTitle || saveName === prevJobNoRef.current) {
        setSaveName(formData.job_no || '');
      }
      prevJobNoRef.current = formData.job_no || '';
    }
  }, [formData.job_no, saveName, loadedTitle]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // APIエラー時でも強制的にログアウト状態にします
    } finally {
      setUser(null);
    }
  };

  const handleSave = async () => {
    if (!saveName) {
      showAlert('DB保存名を入力してください。');
      return;
    }

    const payload = {
      title: saveName,
      form_data: JSON.stringify(formData)
    };

    const performSave = async (isOverwrite: boolean) => {
      try {
        let res;
        if (isOverwrite && loadedPlanId) {
          res = await fetch(`/api/plans/${loadedPlanId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setSaveName(data.saved_title);
          setLoadedTitle(data.saved_title);
          setLoadedPlanId(data.id);
          fetchData();
          showAlert('データベースに保存しました。');
        } else {
          showAlert(data.error || '保存エラーが発生しました。');
        }
      } catch (error) {
        // ★ Vercelテスト用：通信エラー時は保存した「フリ」をしてテストを続行させます
        showAlert('【テスト環境】入力内容の保存シミュレーション完了（※Vercel上のため実際には保存されません）');
      }
    };

    if (loadedPlanId && loadedTitle === saveName) {
      showConfirm("⚠️ 日付も保存名も変更されていないため、既存のデータを「上書き保存」します。\nよろしいですか？\n(「キャンセル」を押すと別のデータとして新規保存します)", 
        () => performSave(true),
        () => performSave(false)
      );
    } else {
      performSave(false);
    }
  };

  const handleLoadPlan = async () => {
    if (!loadedPlanId) return;
    const plan = plans.find(p => p.id === loadedPlanId);
    if (plan) {
      setSaveName(plan.title);
      setLoadedTitle(plan.title);
      try {
        setFormData(JSON.parse(plan.form_data));
      } catch (e) {
        console.error("Failed to parse plan data", e);
      }
    }
  };

  const handleExportPlan = async () => {
    try {
      const res = await fetch('/api/export/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `安全作業計画書_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // ★ Vercel等のバックエンド不在環境ではシミュレーション結果を表示します
        showAlert('【テスト環境】Excel出力シミュレーション（※Vercel上では実際のExcel生成サーバーが動作しません）');
      }
    } catch (error) {
      showAlert('【テスト環境】Excel出力シミュレーション（※Vercel上では実際のExcel生成サーバーが動作しません）');
    }
  };

  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-sm">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
          <div className="flex justify-between items-center border-b-2 border-indigo-900 pb-2 mb-4">
            <h2 className="text-xl font-bold text-indigo-900">
              安全作業計画書 入力・DB管理システム
            </h2>
            <div className="text-slate-700 font-medium">
              👤 {user.name} ({user.department})
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
            <button onClick={() => setIsPersonnelModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-xs">
              <Users size={16} /> 名簿管理
            </button>
            <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-xs">
              <Settings size={16} /> チーム管理
            </button>
            
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            
            <label className="font-bold text-xs text-slate-700">DB保存名:</label>
            <input 
              type="text" 
              className="border border-slate-300 rounded px-2 py-1 w-40 text-xs focus:outline-none focus:border-indigo-500" 
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button 
              onClick={handleSave} 
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium text-xs"
            >
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
          />

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-center">
            <button 
              onClick={handleExportPlan} 
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-lg shadow-md transition-colors"
            >
              <Download size={24} /> Excel を生成してダウンロード
            </button>
          </div>
        </div>

      </div>

      {isPersonnelModalOpen && <PersonnelModal onClose={() => setIsPersonnelModalOpen(false)} />}
      {isTemplateModalOpen && <TemplateModal onClose={() => setIsTemplateModalOpen(false)} />}
      {isTeamModalOpen && <TeamModal onClose={() => setIsTeamModalOpen(false)} />}
      {isPlanListModalOpen && <PlanListModal onClose={() => setIsPlanListModalOpen(false)} onSelect={(id) => { setLoadedPlanId(id); setTimeout(() => document.getElementById('trigger-load')?.click(), 0); }} plans={plans} fetchData={fetchData} />}
      {isGaigyoModalOpen && <GaigyoModal onClose={() => setIsGaigyoModalOpen(false)} />}
      {isUserManagementModalOpen && <UserManagementModal onClose={() => setIsUserManagementModalOpen(false)} />}
      {isManualModalOpen && <ManualModal onClose={() => setIsManualModalOpen(false)} />}
      
      {/* Hidden button to trigger load from modal */}
      <button id="trigger-load" className="hidden" onClick={handleLoadPlan}></button>
    </div>
  );
}
