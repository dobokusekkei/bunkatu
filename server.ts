import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import exceljs from "exceljs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Initialize SQLite database
const db = new Database("anzen_db.sqlite");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    company TEXT,
    name TEXT,
    phone TEXT
  );
  CREATE TABLE IF NOT EXISTS saved_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    form_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS safety_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT
  );
  CREATE TABLE IF NOT EXISTS team_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT,
    contact1_name TEXT,
    contact1_phone TEXT,
    contact2_name TEXT,
    contact2_phone TEXT,
    group_name TEXT DEFAULT '',
    group_leader_name TEXT DEFAULT '',
    group_leader_phone TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    login_id TEXT UNIQUE,
    password TEXT,
    department TEXT,
    role TEXT
  );
`);

// Add user_name and user_department to saved_plans if they don't exist
try {
  db.exec("ALTER TABLE saved_plans ADD COLUMN user_name TEXT DEFAULT ''");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE saved_plans ADD COLUMN user_department TEXT DEFAULT ''");
} catch (e) {
  // Column already exists
}

// Insert default admin user if users table is empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, login_id, password, department, role) VALUES (?, ?, ?, ?, ?)").run(
    "初期管理者", "admin", "admin", "システム管理部", "管理者"
  );
}

// Insert default data if empty
const templateCount = db.prepare("SELECT COUNT(*) as count FROM safety_templates").get() as { count: number };
if (templateCount.count === 0) {
  const defaultSafety = "・健康状態の悪い者は、作業に従事しないこと。作業中に具合が悪くなった場合には、作業指揮者に必ず連絡すること。\n・作業時は、保護帽・安全靴を必ず着用して作業を行うこと。\n・作業中及び歩行中の禁煙を徹底すること。喫煙は、決められた場所にて行うこと。\n・通勤等で使用する車両の運行では、交通法規を遵守し交通災害の防止に努めること。また、使用する車両は定期検査等の法令に則った検査を実施していること。\n・点検工具の置忘れに注意すること。\n・作業員は、指示された作業内容、モーターカー運行状況、待避を厳守すること。\n・作業員は、線路閉鎖が完了し、作業指揮者からの指示があるまで線路内への立ち入りを禁ずる。";
  db.prepare("INSERT INTO safety_templates (title, content) VALUES (?, ?)").run("軌道内夜間作業", defaultSafety.trim());
}

const teamCount = db.prepare("SELECT COUNT(*) as count FROM team_settings").get() as { count: number };
if (teamCount.count === 0) {
  const teams = ['用地Ｔ', '設計1Ｔ', '設計2Ｔ', '設計3Ｔ', '設計4Ｔ'];
  const stmt = db.prepare("INSERT INTO team_settings (group_name, group_leader_name, group_leader_phone, team_name, contact1_name, contact1_phone, contact2_name, contact2_phone) VALUES ('', '', '', ?, '', '', '', '')");
  const insertMany = db.transaction((teams) => {
    for (const team of teams) stmt.run(team);
  });
  insertMany(teams);
}

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "管理者") return res.status(403).json({ error: "Forbidden" });
  next();
};

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { login_id, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE login_id = ? AND password = ?").get(login_id, password) as any;
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, name: user.name, department: user.department, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ status: "success", user: { id: user.id, name: user.name, department: user.department, role: user.role } });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ status: "success" });
});

app.get("/api/auth/me", authenticate, (req: any, res: any) => {
  res.json({ user: req.user });
});

// User Management Routes
app.get("/api/users", authenticate, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, name, login_id, department, role FROM users ORDER BY id").all();
  res.json(users);
});

app.post("/api/users", authenticate, requireAdmin, (req, res) => {
  const { name, login_id, password, department, role } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO users (name, login_id, password, department, role) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(name || '', login_id || '', password || '', department || '', role || '一般');
    res.json({ status: "success", id: info.lastInsertRowid });
  } catch (err: any) {
    console.error("User registration error:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "ログインIDが既に存在します" });
    } else {
      res.status(500).json({ error: "サーバーエラー" });
    }
  }
});

app.put("/api/users/:id", authenticate, requireAdmin, (req, res) => {
  const { name, login_id, password, department, role } = req.body;
  try {
    if (password) {
      const stmt = db.prepare("UPDATE users SET name=?, login_id=?, password=?, department=?, role=? WHERE id=?");
      stmt.run(name || '', login_id || '', password, department || '', role || '一般', req.params.id);
    } else {
      const stmt = db.prepare("UPDATE users SET name=?, login_id=?, department=?, role=? WHERE id=?");
      stmt.run(name || '', login_id || '', department || '', role || '一般', req.params.id);
    }
    res.json({ status: "success" });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "ログインIDが既に存在します" });
    } else {
      res.status(500).json({ error: "サーバーエラー" });
    }
  }
});

app.delete("/api/users/:id", authenticate, requireAdmin, (req, res) => {
  const stmt = db.prepare("DELETE FROM users WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ status: "success" });
});

app.post("/api/users/import", authenticate, requireAdmin, (req, res) => {
  const data = req.body.csv_data;
  const stmt = db.prepare("INSERT INTO users (name, login_id, password, department, role) VALUES (?, ?, ?, ?, ?)");
  const errors: string[] = [];
  
  db.transaction((rows) => {
    for (const row of rows) {
      if (row.length >= 5) {
        const name = row[0].trim();
        const login_id = row[1].trim();
        const password = row[2].trim();
        const department = row[3].trim();
        const role = row[4].trim();
        if (name && login_id && password) {
          try {
            stmt.run(name, login_id, password, department, role);
          } catch (err: any) {
            if (err.message.includes("UNIQUE constraint failed")) {
              errors.push(`ログインID '${login_id}' は既に存在します`);
            }
          }
        }
      }
    }
  })(data);
  
  if (errors.length > 0) {
    res.status(400).json({ error: errors.join("\\n") });
  } else {
    res.json({ status: "success" });
  }
});

// API Routes

// Personnel
app.get("/api/personnel", (req, res) => {
  const personnel = db.prepare("SELECT * FROM personnel ORDER BY company, name").all();
  res.json(personnel);
});

app.post("/api/personnel", (req, res) => {
  const { type, company, name, phone } = req.body;
  const stmt = db.prepare("INSERT INTO personnel (type, company, name, phone) VALUES (?, ?, ?, ?)");
  const info = stmt.run(type || '自社', company || '', name || '', phone || '');
  res.json({ status: "success", id: info.lastInsertRowid });
});

app.delete("/api/personnel/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM personnel WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ status: "success" });
});

app.post("/api/personnel/import", (req, res) => {
  const data = req.body.csv_data;
  const stmt = db.prepare("INSERT INTO personnel (type, company, name, phone) VALUES (?, ?, ?, ?)");
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      if (row.length >= 4) {
        const type = row[0].trim() === 'our' ? 'our' : 'partner';
        const company = row[1].trim();
        const name = row[2].trim();
        const phone = row[3].trim();
        if (name !== '') stmt.run(type, company, name, phone);
      }
    }
  });
  insertMany(data);
  res.json({ status: "success" });
});

// Plans
app.get("/api/plans", (req, res) => {
  const plans = db.prepare("SELECT id, title, created_at, user_name, user_department FROM saved_plans ORDER BY id DESC").all();
  res.json(plans);
});

app.get("/api/plans/all", (req, res) => {
  const plans = db.prepare("SELECT id, title, created_at, form_data, user_name, user_department FROM saved_plans ORDER BY id DESC").all();
  res.json(plans);
});

app.get("/api/plans/:id", (req, res) => {
  const plan = db.prepare("SELECT form_data FROM saved_plans WHERE id = ?").get(req.params.id);
  res.json(plan);
});

app.post("/api/plans/sample", authenticate, (req: any, res: any) => {
  try {
    const stmt = db.prepare("INSERT INTO saved_plans (title, form_data, user_name, user_department) VALUES (?, ?, ?, ?)");
    
    const dummyFormData = (i: number) => JSON.stringify({
      job_no: `JOB-${2026000 + i}`,
      location: `東京駅 第${i}ホーム`,
      job_content: `ホームドア設置工事 (第${i}工区)`,
      date_1: `2026-04-${String((i % 30) + 1).padStart(2, '0')}`,
      start_1: "23:00",
      end_1: "04:30",
      chk_kido_1: i % 2 === 0,
      chk_denki_1: i % 3 === 0,
      chk_teiden_1: i % 4 === 0,
      our_leader_1: "山田 太郎",
      our_cl_1: "山田 太郎"
    });

    db.transaction(() => {
      for (let i = 1; i <= 20; i++) {
        stmt.run(`[SAMPLE] サンプル工事データ ${i}`, dummyFormData(i), req.user?.name || '', req.user?.department || '');
      }
    })();
    
    // Generate sample personnel
    const personnelStmt = db.prepare("INSERT INTO personnel (type, company, name, phone) VALUES (?, ?, ?, ?)");
    db.transaction(() => {
      for (let i = 1; i <= 5; i++) {
        personnelStmt.run('自社', '自社', `自社社員 ${i}`, `090-0000-000${i}`);
        personnelStmt.run('協力会社', `協力会社A`, `協力社員 ${i}`, `080-0000-000${i}`);
      }
    })();

    // Generate sample teams
    const teamStmt = db.prepare("INSERT INTO team_settings (team_name, contact1_name, contact1_phone, contact2_name, contact2_phone, group_name, group_leader_name, group_leader_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    db.transaction(() => {
      for (let i = 1; i <= 3; i++) {
        teamStmt.run(`サンプルチーム${i}`, `連絡先${i}-1`, `090-1111-000${i}`, `連絡先${i}-2`, `090-2222-000${i}`, `サンプルグループ${i}`, `グループ長${i}`, `090-3333-000${i}`);
      }
    })();

    res.json({ status: "success", message: "20件のサンプルデータを生成しました。" });
  } catch (err) {
    console.error("Sample generation error:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

app.delete("/api/plans/sample", authenticate, (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM saved_plans WHERE title LIKE '[SAMPLE] %'").run();
    db.prepare("DELETE FROM personnel WHERE name LIKE '自社社員 %' OR name LIKE '協力社員 %'").run();
    db.prepare("DELETE FROM team_settings WHERE team_name LIKE 'サンプルチーム%'").run();
    res.json({ status: "success", message: "サンプルデータを削除しました。" });
  } catch (err) {
    console.error("Sample deletion error:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

app.post("/api/plans", authenticate, (req: any, res: any) => {
  try {
    let { title, form_data } = req.body;
    title = title.trim();
    
    let base_title = title;
    let counter = 2;
    const match = title.match(/^(.*)_(\d+)$/);
    if (match) {
      base_title = match[1];
      counter = parseInt(match[2], 10);
    }
    
    const checkStmt = db.prepare("SELECT id FROM saved_plans WHERE title = ?");
    if (checkStmt.get(title)) {
      while (true) {
        const new_title = `${base_title}_${counter}`;
        if (!checkStmt.get(new_title)) {
          title = new_title;
          break;
        }
        counter++;
      }
    }
    
    const stmt = db.prepare("INSERT INTO saved_plans (title, form_data, user_name, user_department) VALUES (?, ?, ?, ?)");
    const info = stmt.run(title, form_data, req.user?.name || '', req.user?.department || '');
    res.json({ status: "success", saved_title: title, id: info.lastInsertRowid });
  } catch (err) {
    console.error("Save plan error:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

app.put("/api/plans/:id", authenticate, (req: any, res: any) => {
  try {
    const { title, form_data } = req.body;
    const stmt = db.prepare("UPDATE saved_plans SET title = ?, form_data = ?, user_name = ?, user_department = ? WHERE id = ?");
    stmt.run(title, form_data, req.user?.name || '', req.user?.department || '', req.params.id);
    res.json({ status: "success", saved_title: title, id: req.params.id });
  } catch (err) {
    console.error("Update plan error:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
});

app.patch("/api/plans/:id/title", (req, res) => {
  const { title } = req.body;
  const stmt = db.prepare("UPDATE saved_plans SET title = ? WHERE id = ?");
  stmt.run(title, req.params.id);
  res.json({ status: "success" });
});

app.delete("/api/plans/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM saved_plans WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ status: "success" });
});

// Templates
app.get("/api/templates", (req, res) => {
  const templates = db.prepare("SELECT * FROM safety_templates ORDER BY id").all();
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const { title, content } = req.body;
  const stmt = db.prepare("INSERT INTO safety_templates (title, content) VALUES (?, ?)");
  const info = stmt.run(title || '', content || '');
  res.json({ status: "success", id: info.lastInsertRowid });
});

app.put("/api/templates/:id", (req, res) => {
  const { title, content } = req.body;
  const stmt = db.prepare("UPDATE safety_templates SET title = ?, content = ? WHERE id = ?");
  stmt.run(title || '', content || '', req.params.id);
  res.json({ status: "success" });
});

app.delete("/api/templates/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM safety_templates WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ status: "success" });
});

// Teams
app.get("/api/teams", (req, res) => {
  const teams = db.prepare("SELECT * FROM team_settings ORDER BY id").all();
  res.json(teams);
});

app.post("/api/teams", (req, res) => {
  const { group_name, group_leader_name, group_leader_phone, team_name, contact1_name, contact1_phone, contact2_name, contact2_phone } = req.body;
  const stmt = db.prepare("INSERT INTO team_settings (group_name, group_leader_name, group_leader_phone, team_name, contact1_name, contact1_phone, contact2_name, contact2_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const info = stmt.run(group_name || '', group_leader_name || '', group_leader_phone || '', team_name || '', contact1_name || '', contact1_phone || '', contact2_name || '', contact2_phone || '');
  res.json({ status: "success", id: info.lastInsertRowid });
});

app.put("/api/teams/:id", (req, res) => {
  const { group_name, group_leader_name, group_leader_phone, team_name, contact1_name, contact1_phone, contact2_name, contact2_phone } = req.body;
  const stmt = db.prepare("UPDATE team_settings SET group_name=?, group_leader_name=?, group_leader_phone=?, team_name=?, contact1_name=?, contact1_phone=?, contact2_name=?, contact2_phone=? WHERE id=?");
  stmt.run(group_name || '', group_leader_name || '', group_leader_phone || '', team_name || '', contact1_name || '', contact1_phone || '', contact2_name || '', contact2_phone || '', req.params.id);
  res.json({ status: "success" });
});

app.delete("/api/teams/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM team_settings WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ status: "success" });
});

// Excel Export - Gaigyo
app.post("/api/export/gaigyo", async (req, res) => {
  try {
    const data = req.body.gaigyo_data;
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('外業管理表', {
      pageSetup: {
        paperSize: 8 as any, // A3
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    const headers = ['No.', '作業日', '曜日', '業務名', '作業指揮者', '携帯番号', '作業員', '昼夜別', '時間帯', '夜達番号等', '関連夜達留変等', '場所', '業者名①', '作業責任者', '業者携帯', '人数', '列監', '整理員', '備考'];
    sheet.addRow(headers);

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005A9E' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    data.forEach((rowData: any[]) => {
      const row = sheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      row.getCell(4).alignment = { wrapText: true }; // 業務名
      row.getCell(7).alignment = { wrapText: true }; // 作業員
      row.getCell(12).alignment = { wrapText: true }; // 場所
      row.getCell(13).alignment = { wrapText: true }; // 業者名①
      row.getCell(19).alignment = { wrapText: true }; // 備考
    });

    const centerCols = [1, 2, 3, 6, 8, 9, 10, 15, 16, 17, 18];
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      centerCols.forEach(colIdx => {
        row.getCell(colIdx).alignment = Object.assign({}, row.getCell(colIdx).alignment, { horizontal: 'center' });
      });
      const smallFontCols = [10, 11, 18];
      smallFontCols.forEach(colIdx => {
        row.getCell(colIdx).font = { size: 9 };
      });
    }

    sheet.getColumn(1).width = 4.5;
    sheet.getColumn(2).width = 11.5;
    sheet.getColumn(3).width = 5.5;
    sheet.getColumn(4).width = 45;
    sheet.getColumn(6).width = 14.5;
    sheet.getColumn(7).width = 20;
    sheet.getColumn(8).width = 8;
    sheet.getColumn(9).width = 12.5;
    sheet.getColumn(10).width = 11;
    sheet.getColumn(11).width = 15;
    sheet.getColumn(12).width = 20;
    sheet.getColumn(13).width = 18;
    sheet.getColumn(15).width = 14.5;
    sheet.getColumn(16).width = 5.5;
    sheet.getColumn(17).width = 5.5;
    sheet.getColumn(18).width = 6.5;
    sheet.getColumn(19).width = 35;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment;filename="外業管理表_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx"`);
    res.setHeader('Cache-Control', 'max-age=0');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Excel出力エラー");
  }
});

app.post("/api/export/plan", async (req, res) => {
  try {
    const data = req.body;
    const workbook = new exceljs.Workbook();
    
    let teamInfo: any = null;
    if (data.team_id) {
      teamInfo = db.prepare("SELECT * FROM team_settings WHERE id = ?").get(data.team_id);
    }

    let hasDays = false;
    for (let i = 1; i <= 5; i++) {
      if (data[`date_${i}`]) {
        hasDays = true;
        const sheetName = `Day${i}_${data[`date_${i}`].replace(/-/g, '')}`;
        const sheet = workbook.addWorksheet(sheetName);
        
        // Style setup
        sheet.getColumn(1).width = 20;
        sheet.getColumn(2).width = 40;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 40;

        // Title
        sheet.mergeCells('A1:D1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '安全作業計画書';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        sheet.addRow([]);

        // Basic Info
        sheet.addRow(['工番', data.job_no, '工事内容', data.job_content]);
        sheet.addRow(['作業場所', data.location, 'チーム', teamInfo ? teamInfo.team_name : '']);
        
        if (teamInfo) {
          sheet.addRow(['グループ名', teamInfo.group_name, 'グループ長', `${teamInfo.group_leader_name} (${teamInfo.group_leader_phone})`]);
          sheet.addRow(['連絡先1', `${teamInfo.contact1_name} (${teamInfo.contact1_phone})`, '連絡先2', `${teamInfo.contact2_name} (${teamInfo.contact2_phone})`]);
        }
        sheet.addRow([]);

        // Day Info
        const reserve = data[`reserve_${i}`] ? ' (予備日)' : '';
        sheet.addRow(['作業日', `${data[`date_${i}`]}${reserve}`, '作業時間', `${data[`start_${i}`] || ''} ～ ${data[`end_${i}`] || ''}`]);
        sheet.addRow([]);

        // Personnel
        sheet.addRow(['【自社体制】']);
        sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
        sheet.addRow(['連絡責任者', data[`our_cl_${i}`] || '', '作業指揮者', data[`our_leader_${i}`] || '']);
        sheet.addRow(['携帯番号', data[`our_phone_${i}`] || '', '作業員', [data[`our_w1_${i}`], data[`our_w2_${i}`], data[`our_w3_${i}`], data[`our_w4_${i}`]].filter(Boolean).join(', ')]);
        sheet.addRow([]);

        sheet.addRow(['【協力会社・外注】']);
        sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
        sheet.addRow(['業者名', data[`part_name_${i}`] || '', '責任者', data[`part_leader_${i}`] || '']);
        sheet.addRow(['電話番号', data[`part_phone_${i}`] || '', '人数', data[`part_count_${i}`] || '']);
        sheet.addRow(['列監', data[`part_g_count_${i}`] || '', '整理員', data[`part_t_count_${i}`] || '']);
        sheet.addRow(['備考', data[`part_other_${i}`] || '']);
        sheet.addRow([]);

        // Checks
        sheet.addRow(['【手配・立会・確認事項】']);
        sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
        const checks = [];
        if (data[`chk_kido_${i}`]) checks.push('軌道');
        if (data[`chk_denki_${i}`]) checks.push('電気');
        if (data[`chk_teiden_${i}`]) checks.push('停電');
        if (data[`chk_toro_${i}`]) checks.push('トロ');
        if (data[`chk_kanban_${i}`]) checks.push('看板');
        if (data[`chk_fumikiri_${i}`]) checks.push('踏切');
        if (data[`chk_ryuchi_${i}`]) checks.push('留置変更あり');
        sheet.addRow(['確認項目', checks.join(', ')]);
        sheet.addRow([]);

        // Safety
        sheet.addRow(['【安全対策・指示事項】']);
        sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
        const safetyRow = sheet.addRow([data.safety_measures || '']);
        sheet.mergeCells(`A${safetyRow.number}:D${safetyRow.number}`);
        safetyRow.height = 100;
        safetyRow.getCell(1).alignment = { wrapText: true, vertical: 'top' };
        
        // Borders
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber > 2) {
            row.eachCell((cell) => {
              if (cell.value) {
                cell.border = {
                  top: { style: 'thin' }, left: { style: 'thin' },
                  bottom: { style: 'thin' }, right: { style: 'thin' }
                };
              }
            });
          }
        });
      }
    }

    if (!hasDays) {
      const sheet = workbook.addWorksheet('安全作業計画書');
      sheet.addRow(['作業日が設定されていません。']);
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment;filename="安全作業計画書_${data.job_no || 'draft'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx"`);
    res.setHeader('Cache-Control', 'max-age=0');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Excel出力エラー");
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
