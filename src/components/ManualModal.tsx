import React from 'react';

interface ManualModalProps {
  onClose: () => void;
}

export default function ManualModal({ onClose }: ManualModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f4f7f6] rounded-xl shadow-xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 m-0">システムの使い方</h3>
          <button onClick={onClose} className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-bold transition-colors">
            閉じる
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 text-[15px] leading-relaxed text-slate-800 bg-white m-4 rounded-lg shadow-sm">
          
          <h1 className="text-2xl text-[#005a9e] border-b-4 border-[#005a9e] pb-2 mb-6 text-center font-bold">
            📖 安全作業計画書システム ご利用マニュアル
          </h1>
          <p className="mb-8 text-center">本システムは、安全作業計画書の作成、Excel出力、および過去データのデータベース管理を効率化するためのツールです。</p>

          {/* セクション1 */}
          <h2 className="text-[18px] text-[#005a9e] border-l-[6px] border-[#005a9e] pl-3 mt-10 mb-4 bg-[#f0f8ff] py-2 font-bold">
            1. 画面上部（ツールバー）の機能
          </h2>
          <p className="mb-4">画面上部のボタンから、各種管理画面や保存機能にアクセスできます。</p>
          <ul className="list-none space-y-3 pl-2">
            <li><span className="inline-block px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold mr-2">👥 名簿管理</span> 当社社員や協力業者の氏名・携帯番号を登録します。</li>
            <li><span className="inline-block px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold mr-2">💾 DBに保存</span> 現在入力している計画書をデータベースに保存します。</li>
            <li><span className="inline-block px-2 py-1 bg-amber-500 text-slate-900 rounded text-xs font-bold mr-2">📂 保存データ一覧</span> 保存済みの計画書を検索・読み込み・削除します。</li>
            <li><span className="inline-block px-2 py-1 bg-cyan-600 text-white rounded text-xs font-bold mr-2">📋 外業管理表</span> 登録されている全データを集約し、外業管理表として一覧表示・印刷・Excel出力します。</li>
            <li><span className="inline-block px-2 py-1 bg-slate-500 text-white rounded text-xs font-bold mr-2">⚙️ ユーザー管理</span> システムにログインできるアカウントを追加・編集します（※管理者のみ表示）。</li>
            <li><span className="inline-block px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold mr-2">🚪 ログアウト</span> システムから安全にログアウトします。</li>
          </ul>

          {/* セクション2 */}
          <h2 className="text-[18px] text-[#005a9e] border-l-[6px] border-[#005a9e] pl-3 mt-10 mb-4 bg-[#f0f8ff] py-2 font-bold">
            2. 計画書の作成と入力補助
          </h2>
          
          <h3 className="text-base text-slate-800 border-b border-dashed border-slate-300 pb-1 mt-6 mb-3 font-bold">📝 基本情報と安全対策</h3>
          <p className="mb-3">工番、作業場所、工事内容などの基本情報を入力します。安全対策の文章は、事前に登録したテンプレートから一発で呼び出すことが可能です。</p>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li><b>チームの選択:</b> プルダウンの横にある <span className="inline-block px-1.5 py-0.5 bg-slate-500 text-white rounded text-xs">⚙️</span> ボタンから、チーム情報の登録・編集ができます。</li>
            <li><b>安全対策テンプレート:</b> プルダウンで選択すると、自動的に文章が入力欄にセットされます。</li>
          </ul>

          <h3 className="text-base text-slate-800 border-b border-dashed border-slate-300 pb-1 mt-6 mb-3 font-bold">📁 夜達CSVの自動転記システム</h3>
          <div className="bg-[#fff3cd] border-l-4 border-[#ffeeba] p-4 my-4 rounded">
            <b className="text-[#856404]">💡 夜達CSVを取り込むと…</b><br/>
            作業日時と「当社の閉鎖責任者（または指揮者）」が一致する夜達データを探し出し、Excel出力時に<b>「駅名（構内/駅間の自動判定）」「夜達番号」「路線名」などを自動でExcelに転記</b>します。
          </div>
          <ol className="list-decimal pl-6 space-y-1 mb-6">
            <li>「夜達CSVを取り込む」ボタンを押し、対象のCSVファイルを選択します。</li>
            <li>「✅ 夜達CSVの読み込みが完了しました！」と出れば準備完了です。</li>
            <li>あとは通常通り作業日と人員を入力してExcelを出力するだけで、裏側で自動マッチングが行われます。</li>
          </ol>

          <h3 className="text-base text-slate-800 border-b border-dashed border-slate-300 pb-1 mt-6 mb-3 font-bold">⚡ 便利な入力サポート機能</h3>
          <table className="w-full border-collapse text-sm mb-6">
            <tbody>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 w-1/4 text-left">昼・夜ボタン</th>
                <td className="border border-slate-300 p-2">
                  <span className="inline-block px-2 py-0.5 bg-amber-400 text-slate-900 rounded text-xs mr-1">昼</span> を押すと「09:00～17:00」、
                  <span className="inline-block px-2 py-0.5 bg-slate-600 text-white rounded text-xs mr-1">夜</span> を押すと「00:00～05:00」が自動入力されます。また、夜間の場合は「当社 指揮者」と同じ名前が「閉鎖責任者」に自動コピーされます。
                </td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">ドラッグ＆ドロップ<br/>（コピー）</th>
                <td className="border border-slate-300 p-2">各行の左端にある「≡掴む≡」をマウスで掴み、別の日付の行へドロップすると、<b>その日の入力内容（人員やチェック項目など）が丸ごとコピー</b>されます。連続する作業日に便利です。</td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">作業員の増減</th>
                <td className="border border-slate-300 p-2">「＋ 作業員を追加表示」を押すと、当社の作業員入力枠を最大4名まで増やすことができます。</td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">手配・立会チェック</th>
                <td className="border border-slate-300 p-2">軌道、電気、停電、トロ、表示板、鳴止、留変 のチェックボックスで必要な立会等を選択します。</td>
              </tr>
            </tbody>
          </table>

          {/* セクション3 */}
          <h2 className="text-[18px] text-[#005a9e] border-l-[6px] border-[#005a9e] pl-3 mt-10 mb-4 bg-[#f0f8ff] py-2 font-bold">
            3. データの保存・検索・読み込み
          </h2>

          <h3 className="text-base text-slate-800 border-b border-dashed border-slate-300 pb-1 mt-6 mb-3 font-bold">💾 データの保存</h3>
          <p className="mb-3">入力が終わったら、ツールバーの <span className="inline-block px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold">💾 DBに保存</span> をクリックします。</p>
          <div className="bg-[#fff3cd] border-l-4 border-[#ffeeba] p-4 my-4 rounded">
            <b className="text-[#856404]">💡 タイトルの自動生成</b><br/>
            保存名を入力する必要はありません。システムが自動的に<b>「工番 ＋ 工事内容」</b>の組み合わせでタイトルを生成して保存します。
          </div>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li>過去のデータを読み込んで修正した場合、<b>「作業日時」が変更されていなければ「上書き保存」</b>するかどうか確認されます。日付が変わっている場合は、自動的に別日の「新規データ」として保存されます。</li>
          </ul>

          <h3 className="text-base text-slate-800 border-b border-dashed border-slate-300 pb-1 mt-6 mb-3 font-bold">🔍 高度な検索とデータの読み込み</h3>
          <p className="mb-3">
            ツールバーの <span className="inline-block px-2 py-1 bg-amber-500 text-slate-900 rounded text-xs font-bold">📂 保存データ一覧</span> を開くと、保存されたデータが表示されます。
            <b>初期状態では「先月1日～来月末日」のデータのみが表示</b>されています。
          </p>
          
          <table className="w-full border-collapse text-sm mb-4">
            <tbody>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 w-1/4 text-left">📅 登録日の範囲</th>
                <td className="border border-slate-300 p-2">指定した期間内に登録・保存されたデータを絞り込みます。</td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">🔍 キーワード検索</th>
                <td className="border border-slate-300 p-2">工番、作業場所、氏名などのフリーワードで検索します。<b>スペースで区切ると複数条件（AND検索）</b>になります。<br/>例：「梅田 軌道」と入力すると、両方を含む計画書だけが表示されます。</td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">🏢 チーム選択</th>
                <td className="border border-slate-300 p-2">特定のチームの計画書だけを絞り込んで表示します。</td>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 p-2 text-left">✅ 手配・立会検索</th>
                <td className="border border-slate-300 p-2">チェックした立会項目を<b>「すべて」含んでいる計画書</b>だけを絞り込みます。<br/>例：「停電」と「トロ」にチェックすると、両方とも行う計画書だけが残ります。</td>
              </tr>
            </tbody>
          </table>
          <p className="mb-6">目的のデータが見つかったら、行の右側にある <span className="inline-block px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold">読込</span> ボタンを押すと、メイン画面にデータが復元されます。</p>

          {/* セクション4 */}
          <h2 className="text-[18px] text-[#005a9e] border-l-[6px] border-[#005a9e] pl-3 mt-10 mb-4 bg-[#f0f8ff] py-2 font-bold">
            4. 各種マスター登録（名簿・チーム等）
          </h2>
          <p className="mb-3">名簿やチーム、テンプレートなどは、各項目横の <span className="inline-block px-1.5 py-0.5 bg-slate-500 text-white rounded text-xs">⚙️</span> ボタン、またはツールバーから管理できます。</p>
          <ul className="list-disc pl-6 space-y-1 mb-6">
            <li><b>1件ずつ登録:</b> フォームに入力して追加します。</li>
            <li><b>CSV一括登録:</b> 指定のフォーマット（カンマ区切り）で作成したCSVファイルを読み込ませることで、数十件のデータを一瞬で取り込むことができます。</li>
          </ul>

          {/* セクション5 */}
          <h2 className="text-[18px] text-[#005a9e] border-l-[6px] border-[#005a9e] pl-3 mt-10 mb-4 bg-[#f0f8ff] py-2 font-bold">
            5. Excelの出力
          </h2>
          <p className="mb-3">すべての入力が完了したら、画面の一番下にある緑色のボタンを押してください。</p>
          <div className="text-center my-6">
            <span className="inline-block bg-[#217346] text-white px-8 py-3 rounded text-lg font-bold shadow-md">
              出力 (Excel形式でダウンロード)
            </span>
          </div>
          <p className="mb-6">自動的に所定のExcelフォーマット（メインシートおよび別紙のworkシート等）にデータが転記され、ファイルがダウンロードされます。ダウンロード前に「DBに保存しますか？」という確認が出ますので、保存し忘れを防ぐことができます。</p>

        </div>
      </div>
    </div>
  );
}
