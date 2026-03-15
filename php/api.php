<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

// データ保存用フォルダの作成
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}
$dbFile = $dataDir . '/anzen_db.sqlite';
$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// ==========================================
// 1. データベース初期化 ＆ アップデート
// ==========================================
// ユーザーテーブル作成と初期管理者登録
$pdo->exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, login_id TEXT UNIQUE, password TEXT, name TEXT, department TEXT, role TEXT)");
$stmt = $pdo->query("SELECT COUNT(*) FROM users");
if ($stmt->fetchColumn() == 0) {
    $pw = password_hash('admin', PASSWORD_DEFAULT);
    $pdo->exec("INSERT INTO users (login_id, password, name, department, role) VALUES ('admin', '$pw', 'システム管理者', 'システム管理部', '管理者')");
}

// 既存テーブル作成
$pdo->exec("CREATE TABLE IF NOT EXISTS personnel (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, company TEXT, name TEXT, phone TEXT, department TEXT)");
$pdo->exec("CREATE TABLE IF NOT EXISTS saved_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, form_data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
$pdo->exec("CREATE TABLE IF NOT EXISTS safety_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT)");
$pdo->exec("CREATE TABLE IF NOT EXISTS team_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, group_name TEXT, group_leader_name TEXT, group_leader_phone TEXT, team_name TEXT, contact1_name TEXT, contact1_phone TEXT, contact2_name TEXT, contact2_phone TEXT, department TEXT)");

// 既存テーブルへのカラム追加（アップデート対応）
function addColumnIfNotExists($pdo, $table, $column, $type) {
    $rs = $pdo->query("PRAGMA table_info($table)");
    $columns = [];
    foreach($rs as $r) { $columns[] = $r['name']; }
    if (!in_array($column, $columns)) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $type");
    }
}
addColumnIfNotExists($pdo, 'personnel', 'department', 'TEXT DEFAULT ""');
addColumnIfNotExists($pdo, 'team_settings', 'department', 'TEXT DEFAULT ""');

// デフォルトの安全対策テンプレート追加
$default_safety = "・健康状態の悪い者は、作業に従事しないこと。作業中に具合が悪くなった場合には、作業指揮者に必ず連絡すること。\n・作業時は、保護帽・安全靴を必ず着用して作業を行うこと。\n・作業中及び歩行中の禁煙を徹底すること。喫煙は、決められた場所にて行うこと。\n・通勤等で使用する車両の運行では、交通法規を遵守し交通災害の防止に努めること。また、使用する車両は定期検査等の法令に則った検査を実施していること。\n・点検工具の置忘れに注意すること。\n・作業員は、指示された作業内容、モーターカー運行状況、待避を厳守すること。\n・作業員は、線路閉鎖が完了し、作業指揮者からの指示があるまで線路内への立ち入りを禁ずる。\n\n\n\n\n\n\n\n\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM safety_templates");
if ($stmt->fetchColumn() == 0) {
    $ins = $pdo->prepare("INSERT INTO safety_templates (title, content) VALUES (?, ?)");
    $ins->execute(["軌道内夜間作業", trim($default_safety)]);
}


// ==========================================
// 2. リクエストの受け取りとルーティング
// ==========================================
$input = file_get_contents('php://input');
$req = json_decode($input, true) ?? [];
$action = $req['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        // --- 認証系 ---
        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE login_id = ?");
            $stmt->execute([$req['login_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user && password_verify($req['password'], $user['password'])) {
                unset($user['password']);
                $_SESSION['user'] = $user;
                echo json_encode(['status' => 'success', 'user' => $user]);
            } else {
                echo json_encode(['status' => 'error', 'error' => 'IDまたはパスワードが違います']);
            }
            break;

        case 'me':
            if (isset($_SESSION['user'])) {
                echo json_encode(['status' => 'success', 'user' => $_SESSION['user']]);
            } else {
                http_response_code(401);
                echo json_encode(['status' => 'error', 'error' => 'Not authenticated']);
            }
            break;

        case 'logout':
            session_destroy();
            echo json_encode(['status' => 'success']);
            break;

        // --- 計画書関連 ---
        case 'save_plan':
            $title = trim($req['title']);
            $form_data = $req['form_data'];
            
            // タイトルの重複チェックと連番付与
            if (preg_match('/^(.*)_(\d+)$/', $title, $matches)) {
                $base_title = $matches[1];
                $counter = (int)$matches[2];
            } else {
                $base_title = $title;
                $counter = 2;
            }
            $check = $pdo->prepare("SELECT id FROM saved_plans WHERE title = ?");
            $check->execute([$title]);
            if ($check->fetch()) {
                while (true) {
                    $new_title = $base_title . '_' . $counter;
                    $check->execute([$new_title]);
                    if (!$check->fetch()) {
                        $title = $new_title;
                        break;
                    }
                    $counter++;
                }
            }
            $stmt = $pdo->prepare("INSERT INTO saved_plans (title, form_data) VALUES (?, ?)");
            $stmt->execute([$title, $form_data]);
            echo json_encode(['status' => 'success', 'saved_title' => $title, 'id' => $pdo->lastInsertId()]);
            break;

        case 'overwrite_plan':
            $stmt = $pdo->prepare("UPDATE saved_plans SET title = ?, form_data = ? WHERE id = ?");
            $stmt->execute([$req['title'], $req['form_data'], $req['id']]);
            echo json_encode(['status' => 'success', 'saved_title' => $req['title'], 'id' => $req['id']]);
            break;

        case 'get_plans':
            $stmt = $pdo->query("SELECT id, title, created_at FROM saved_plans ORDER BY id DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'get_plans_all':
            $stmt = $pdo->query("SELECT id, title, created_at, form_data FROM saved_plans ORDER BY id DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'delete_plan':
            $stmt = $pdo->prepare("DELETE FROM saved_plans WHERE id = ?");
            $stmt->execute([$req['id']]);
            echo json_encode(['status' => 'success']);
            break;

        // --- 名簿関連 ---
        case 'get_personnel':
            $stmt = $pdo->query("SELECT * FROM personnel ORDER BY company, name");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'save_personnel':
            if (!empty($req['id'])) {
                $stmt = $pdo->prepare("UPDATE personnel SET type=?, company=?, name=?, phone=?, department=? WHERE id=?");
                $stmt->execute([$req['type'], $req['company'], $req['name'], $req['phone'], $req['department'], $req['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO personnel (type, company, name, phone, department) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$req['type'], $req['company'], $req['name'], $req['phone'], $req['department']]);
            }
            echo json_encode(['status' => 'success']);
            break;

        case 'import_personnel':
            $stmt = $pdo->prepare("INSERT INTO personnel (type, company, name, phone, department) VALUES (?, ?, ?, ?, ?)");
            $pdo->beginTransaction();
            foreach ($req['data'] as $row) {
                if ($row['name'] !== '') {
                    $stmt->execute([$row['type'], $row['company'], $row['name'], $row['phone'], $row['department']]);
                }
            }
            $pdo->commit();
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_personnel':
            $stmt = $pdo->prepare("DELETE FROM personnel WHERE id = ?");
            $stmt->execute([$req['id']]);
            echo json_encode(['status' => 'success']);
            break;

        // --- チーム関連 ---
        case 'get_teams':
            $stmt = $pdo->query("SELECT * FROM team_settings ORDER BY id");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'save_team':
            if (!empty($req['id'])) {
                $stmt = $pdo->prepare("UPDATE team_settings SET group_name=?, group_leader_name=?, group_leader_phone=?, team_name=?, contact1_name=?, contact1_phone=?, contact2_name=?, contact2_phone=?, department=? WHERE id=?");
                $stmt->execute([
                    $req['group_name'], $req['group_leader_name'], $req['group_leader_phone'],
                    $req['team_name'], $req['contact1_name'], $req['contact1_phone'], $req['contact2_name'], $req['contact2_phone'], $req['department'], $req['id']
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO team_settings (group_name, group_leader_name, group_leader_phone, team_name, contact1_name, contact1_phone, contact2_name, contact2_phone, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $req['group_name'], $req['group_leader_name'], $req['group_leader_phone'],
                    $req['team_name'], $req['contact1_name'], $req['contact1_phone'], $req['contact2_name'], $req['contact2_phone'], $req['department']
                ]);
            }
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_team':
            $stmt = $pdo->prepare("DELETE FROM team_settings WHERE id = ?");
            $stmt->execute([$req['id']]);
            echo json_encode(['status' => 'success']);
            break;

        // --- テンプレート関連 ---
        case 'get_templates':
            $stmt = $pdo->query("SELECT * FROM safety_templates ORDER BY id");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'save_template':
            if (!empty($req['id'])) {
                $stmt = $pdo->prepare("UPDATE safety_templates SET title=?, content=? WHERE id=?");
                $stmt->execute([$req['title'], $req['content'], $req['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO safety_templates (title, content) VALUES (?, ?)");
                $stmt->execute([$req['title'], $req['content']]);
            }
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_template':
            $stmt = $pdo->prepare("DELETE FROM safety_templates WHERE id = ?");
            $stmt->execute([$req['id']]);
            echo json_encode(['status' => 'success']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'error' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
