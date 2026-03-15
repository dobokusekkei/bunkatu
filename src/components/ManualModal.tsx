import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ManualModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <BookOpen size={20} /> 使い方・マニュアル
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 font-bold text-xl">&times;</button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6 text-slate-800 space-y-6">
          <section>
            <h4 className="font-bold text-lg border-b border-slate-300 pb-1 mb-2">1. ログインとユーザー管理</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>ログイン画面でIDとパスワードを入力してログインします。</li>
              <li>管理者権限を持つユーザーは、画面右上の「ユーザー管理」ボタンからユーザーの追加・編集・削除、CSV一括インポートが可能です。</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg border-b border-slate-300 pb-1 mb-2">2. 安全作業計画書の作成</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>画面中央のフォームに必要事項を入力します。</li>
              <li>「名簿管理」「テンプレート管理」「チーム管理」ボタンから、よく使うデータを登録しておくと入力がスムーズになります。</li>
              <li>作業日時や体制などは、1日目から5日目までまとめて入力できます。</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg border-b border-slate-300 pb-1 mb-2">3. データの保存と読み込み</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>入力したデータは「DB保存名」を入力して「DBに保存」ボタンで保存できます。</li>
              <li>保存したデータは「保存データ一覧」ボタンから確認・読み込み・削除が可能です。</li>
              <li>同じデータを読み込んで編集し、再度保存すると「上書き保存」するか「新規保存」するかを選択できます。</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg border-b border-slate-300 pb-1 mb-2">4. Excel出力</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>画面最下部の「Excel を生成してダウンロード」ボタンをクリックすると、入力した内容がExcel形式でダウンロードされます。</li>
            </ul>
          </section>
        </div>

        <div className="p-4 border-t bg-slate-50 rounded-b-xl text-right">
          <button onClick={onClose} className="bg-slate-500 text-white px-6 py-2 rounded text-sm hover:bg-slate-600 font-bold">閉じる</button>
        </div>
      </div>
    </div>
  );
}
