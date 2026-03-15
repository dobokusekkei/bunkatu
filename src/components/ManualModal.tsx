import React from 'react';

export default function ManualModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-indigo-900 m-0 flex items-center gap-2">
            <span className="text-2xl">📖</span> 安全作業計画書システム 完全マニュアル
          </h3>
          <button onClick={onClose} className="px-6 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-bold shadow-sm">
            閉じる
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 leading-relaxed space-y-8 bg-white">

          {/* 1. システムの全体的な流れ */}
          <section>
            <h4 className="text-lg font-bold text-indigo-800 border-b-2 border-indigo-200 pb-2 mb-4 flex items-center gap-2">
              <span>1️⃣</span> システムの基本的な流れ
            </h4>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="mb-3">本システムは、ブラウザ上で安全作業計画書を作成し、社内サーバー（データベース）に保存・管理した上で、Excel形式で出力するためのアプリです。</p>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li><b className="text-indigo-600">事前準備：</b> 画面上部のボタンから「名簿管理」「チーム管理」「テンプレート管理」を開き、よく使うデータを登録します。</li>
                <li><b className="text-indigo-600">データ入力：</b> メイン画面で基本情報、安全対策、作業日時（1日目〜5日目）、人員配置を入力します。</li>
                <li><b className="text-indigo-600">DBに保存：</b> 「DBに保存」ボタンを押すと、入力したデータがサーバーに保管されます。</li>
                <li><b className="text-indigo-600">Excel出力：</b> 画面一番下の「出力」ボタンを押すと、入力内容が所定のフォーマットに書き込まれたExcelファイルがダウンロードされます。</li>
              </ol>
            </div>
          </section>

          {/* 2. 名簿・チーム・部署管理について */}
          <section>
            <h4 className="text-lg font-bold text-indigo-800 border-b-2 border-indigo-200 pb-2 mb-4 flex items-center gap-2">
              <span>2️⃣</span> 名簿・チーム・部署の管理
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <b className="text-base text-slate-900 flex items-center gap-2 mb-2">👥 名簿管理とCSV一括登録</b>
                <p>当社社員および協力業者の名簿を登録します。登録したデータは、メイン画面の各プルダウン（作業指揮者、作業員、協力業者など）に自動で反映されます。</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 ml-2">
                  <li><b>CSV一括登録：</b> <code>区分(our/partner), 業者名, 氏名, 携帯番号</code> の4列で作成したCSVファイルを読み込ませることで、一括で名簿を登録できます。</li>
                </ul>
              </div>
              
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                <b className="text-base text-rose-900 flex items-center gap-2 mb-2">🏢 部署別のデータ管理（権限について）</b>
                <p>名簿やチームのデータは、作成したユーザーの「所属部署」に紐づいて管理されます。</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-rose-800 ml-2">
                  <li><b>一般ユーザー：</b> 自分が所属する部署に登録された名簿・チームだけがプルダウンに表示されます。</li>
                  <li><b>管理者ユーザー：</b> すべての部署のデータを閲覧・編集できます。「ユーザー管理」画面から新規アカウントの発行や権限の変更が可能です。</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 計画書入力画面の強力な機能 */}
          <section>
            <h4 className="text-lg font-bold text-indigo-800 border-b-2 border-indigo-200 pb-2 mb-4 flex items-center gap-2">
              <span>3️⃣</span> 計画書入力画面の便利機能（裏技）
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <b className="text-slate-900 flex items-center gap-2 mb-2">🖱️ 日付のドラッグ＆ドロップ（一括コピー）</b>
                <p className="text-slate-700">「3. 作業日時」などの各行の左端にある黄色の<b className="text-amber-700">「◯日目 ≡掴む≡」</b>の部分をマウスでクリックしたまま、別の日数の行へ移動してドロップしてください。</p>
                <p className="mt-2 text-slate-600 text-xs">その日の入力内容（時間、人員、チェックボックスなど）が一瞬で丸ごとコピーされます。連日同じ作業内容の時に入力を大幅に短縮できます。</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <b className="text-slate-900 flex items-center gap-2 mb-2">↔️ 作業員枠の増減（当社体制）</b>
                <p className="text-slate-700">「4. 当社体制」の右上にある<b className="text-blue-700">「＋ 作業員を追加表示」</b>ボタンを押すと、作業員の入力枠を最大4人分まで増やすことができます。</p>
                <p className="mt-2 text-slate-600 text-xs">枠を増やした場合は、画面内に水平スクロールバーが出現し、レイアウトを崩さずに入力が可能です。</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <b className="text-slate-900 flex items-center gap-2 mb-2">⭕️ 危険予知の自動図形描画</b>
                <p className="text-slate-700">「2. 予測される危険」で「触車」「感電」「墜落」などにチェックを入れると、Excel出力時に該当箇所に<b className="text-rose-600">自動で赤い丸（◯）</b>が描画されます。</p>
                <p className="mt-2 text-slate-600 text-xs">「その他」にチェックを入れ、横のテキストボックスに内容を入力した場合も、指定位置に図形と文字が正確に出力されます。</p>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <b className="text-slate-900 flex items-center gap-2 mb-2">🔠 全角入力の自動半角化（サニタイズ）</b>
                <p className="text-slate-700">工番、人数、携帯番号などの項目は、IME（日本語入力）をオンにして全角で入力しても、システムが裏側で自動的に<b className="text-indigo-700">半角英数・記号に変換</b>します。</p>
                <p className="mt-2 text-slate-600 text-xs">長音記号（ー）なども自動でハイフン（-）に変換され、フォーカスが外れた瞬間に不要な日本語は完全消去されるため、エラーを防ぎます。</p>
              </div>

            </div>
          </section>

          {/* 4. 夜達CSVの自動転記機能 */}
          <section>
            <h4 className="text-lg font-bold text-indigo-800 border-b-2 border-indigo-200 pb-2 mb-4 flex items-center gap-2">
              <span>4️⃣</span> 📁 夜達CSVの自動転記（超強力機能）
            </h4>
            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
              <p className="mb-3 text-slate-900 font-medium">「3. 作業日時」の右上にあるボタンから「夜間作業連絡票」のCSVファイルを読み込ませることで、手入力を極限まで減らすことができます。</p>
              
              <div className="bg-slate-100 p-3 rounded text-sm mb-3">
                <b>【自動転記の発動条件】</b><br/>
                入力した <b className="text-indigo-600">「作業日」</b> と <b className="text-indigo-600">「閉鎖責任者（氏名のスペース無視）」</b> が、読み込んだCSVデータと完全に一致した場合に発動します。
              </div>

              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li><b>自動抽出される項目：</b> 路線名（京都線・神戸線など）、作業場所（◯◯〜◯◯）、夜達番号、関連夜達等。</li>
                <li><b>Excel出力時の挙動：</b> 一致した日の「別紙（workシート）」の指定セルに、抽出したデータが自動的に書き込まれます。夜達番号は自動で3桁のゼロ埋め（例：005）に整形されます。</li>
                <li>一度読み込んだCSVデータは計画書と一緒にデータベースに保存されるため、再度データを開いた時も自動で復元されます。</li>
              </ul>
            </div>
          </section>

          {/* 5. データの検索と外業管理表 */}
          <section>
            <h4 className="text-lg font-bold text-indigo-800 border-b-2 border-indigo-200 pb-2 mb-4 flex items-center gap-2">
              <span>5️⃣</span> データの検索機能 と 外業管理表
            </h4>
            
            <div className="space-y-4">
              <div>
                <b className="text-base text-slate-900 flex items-center gap-2 mb-1">📂 保存データ一覧（高度な検索）</b>
                <p className="text-slate-700 mb-2">過去に保存した計画書を、様々な条件で瞬時に探し出すことができます。</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <li><b>作業日検索：</b> 登録日ではなく、計画書の中に入力された「1日目〜5日目の作業日」が指定期間に含まれるものを検索します。「当月前後」や「すべての期間」ボタンで一発切り替えが可能です。</li>
                  <li><b>キーワードAND検索：</b> 工番、場所、工事内容、外注業者名などをスペース区切りで入力すると、すべてを含むデータを絞り込めます。</li>
                  <li><b>立会・手配検索：</b> 「軌道」「電気」「停電」などのチェックボックスをポチポチ押すだけで、その手配が必要な計画書だけをリストアップできます。</li>
                </ul>
              </div>

              <div>
                <b className="text-base text-slate-900 flex items-center gap-2 mb-1">📋 外業管理表の自動生成</b>
                <p className="text-slate-700 mb-2">サーバーに保存されているすべての計画書データから、日付ごとの作業情報を自動で抽出し、一覧表を作成します。</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <li><b>昼夜の自動判定：</b> 入力された開始時間から「昼」「夜」を自動で判定します。</li>
                  <li><b>直接編集：</b> 表示された管理表の「留置変更」「備考」などのテキストボックスには、画面上で直接文字を打ち込むことができます。</li>
                  <li><b>A3横印刷＆Excel出力：</b> 「🖨️ 印刷する」ボタンを押せば、ブラウザから直接A3横サイズで綺麗に印刷できます。また、「📊 Excel出力」ボタンで一覧表をそのままExcel化してダウンロード可能です。</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
        
        {/* フッター（閉じるボタン） */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl text-right">
          <button onClick={onClose} className="px-6 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-bold shadow-sm">
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
