import React, { useState, useEffect } from 'react';
import { useDialog } from './DialogContext';

export default function TemplateModal({ onClose }: { onClose: () => void }) {
  const { showAlert, showConfirm } = useDialog();
  const [templates, setTemplates] = useState<any[]>([]);
  const [id, setId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error(error);
      showAlert('テンプレートの取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!title || !content) return showAlert('タイトルと本文を入力してください。');
    
    try {
      if (id) {
        await fetch(`/api/templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
      } else {
        await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
      }
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error(error);
      showAlert('保存に失敗しました。');
    }
  };

  const handleEdit = (t: any) => {
    setId(t.id);
    setTitle(t.title);
    setContent(t.content ? t.content.replace(/\\n/g, '\n') : '');
  };

  const handleDelete = async (deleteId: number) => {
    showConfirm('このテンプレートを削除しますか？\n（元に戻すことはできません）', async () => {
      try {
        await fetch(`/api/templates/${deleteId}`, { method: 'DELETE' });
        if (id === deleteId) resetForm();
        fetchTemplates();
      } catch (error) {
        console.error(error);
        showAlert('削除に失敗しました。');
      }
    });
  };

  const resetForm = () => {
    setId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">安全対策 テンプレート管理</h3>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
          <b className="block mb-3 text-sm">{id ? 'テンプレートの編集' : '新規作成'}</b>
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1">タイトル:</label>
            <input 
              type="text" 
              className="w-64 border rounded p-1.5 text-sm" 
              placeholder="例：軌道内昼間作業用"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1">安全対策 本文:</label>
            <textarea 
              className="w-full border rounded p-2 text-sm" 
              rows={6}
              placeholder="ここに安全対策の文章を入力してください"
              value={content} 
              onChange={e => setContent(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className={`px-4 py-1.5 rounded text-sm text-white ${id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {id ? '💾 更新する' : '＋ 登録する'}
            </button>
            <button onClick={resetForm} className="bg-slate-500 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-600">
              クリア
            </button>
          </div>
        </div>

        <b className="block mb-2 text-sm">登録済みテンプレート一覧</b>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              <th className="p-2">タイトル</th>
              <th className="p-2 w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b">
                <td className="p-2 font-bold whitespace-pre-wrap">{t.title}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(t)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 mr-1">編集</button>
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
