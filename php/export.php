<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('memory_limit', '1024M'); 

// ★ 指示通り、Composerのautoloadは1つ上の階層を指定
$autoload_path = realpath(__DIR__ . '/../vendor/autoload.php');
if (!$autoload_path || !file_exists($autoload_path)) {
    die(json_encode(['status' => 'error', 'message' => "システムエラー: vendor/autoload.php が見つかりません。"]));
}
require $autoload_path;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

$holidays = [
    '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
    '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06',
    '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23',
    '2026-10-12', '2026-11-03', '2026-11-23'
];

function isHolidayOrWeekend($dateString, $holidays) {
    $timestamp = strtotime($dateString);
    $w = date('w', $timestamp);
    if ($w == 0 || $w == 6) return true;
    if (in_array(date('Y-m-d', $timestamp), $holidays)) return true;
    return false;
}

$input = file_get_contents('php://input');
$req = json_decode($input, true) ?? [];
$action = $req['action'] ?? '';
$postData = $req['data'] ?? [];

// ==========================================
// 外業管理表のExcel出力処理
// ==========================================
if ($action === 'export_gaigyo') {
    try {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('外業管理表');
        
        $headers = ['No.', '作業日', '曜日', '業務名', '作業指揮者', '携帯番号', '作業員', '昼夜別', '時間帯', '夜達番号等', '関連夜達留変等', '場所', '業者名①', '作業責任者', '業者携帯', '人数', '列監', '整理員', '備考'];
        $sheet->fromArray($headers, null, 'A1');
        
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF005A9E']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]
        ];
        $sheet->getStyle('A1:S1')->applyFromArray($headerStyle);
        
        $rowNum = 2;
        if (is_array($postData)) {
            foreach($postData as $row) {
                $colIdx = 1;
                foreach ($row as $cellValue) {
                    $colLetter = Coordinate::stringFromColumnIndex($colIdx);
                    $sheet->setCellValueExplicit($colLetter . $rowNum, (string)$cellValue, DataType::TYPE_STRING);
                    $colIdx++;
                }
                $sheet->getStyle('A'.$rowNum.':S'.$rowNum)->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]
                ]);
                $sheet->getStyle('D'.$rowNum)->getAlignment()->setWrapText(true);
                $sheet->getStyle('G'.$rowNum)->getAlignment()->setWrapText(true);
                $sheet->getStyle('L'.$rowNum)->getAlignment()->setWrapText(true);
                $sheet->getStyle('M'.$rowNum)->getAlignment()->setWrapText(true);
                $sheet->getStyle('S'.$rowNum)->getAlignment()->setWrapText(true);
                $rowNum++;
            }
        }
        
        if ($rowNum > 2) {
            $centerCols = ['A', 'B', 'C', 'F', 'H', 'I', 'J', 'O', 'P', 'Q', 'R'];
            foreach($centerCols as $c) {
                $sheet->getStyle($c.'2:'.$c.($rowNum-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $smallFontCols = ['J', 'K', 'R'];
            foreach($smallFontCols as $c) {
                $sheet->getStyle($c.'2:'.$c.($rowNum-1))->getFont()->setSize(9);
            }
        }

        $sheet->getColumnDimension('A')->setAutoSize(false)->setWidth(4.5);
        $sheet->getColumnDimension('B')->setAutoSize(false)->setWidth(11.5);
        $sheet->getColumnDimension('C')->setAutoSize(false)->setWidth(5.5);
        $sheet->getColumnDimension('D')->setAutoSize(false)->setWidth(45);
        $sheet->getColumnDimension('E')->setAutoSize(true);
        $sheet->getColumnDimension('F')->setAutoSize(false)->setWidth(14.5);
        $sheet->getColumnDimension('G')->setAutoSize(false)->setWidth(20);
        $sheet->getColumnDimension('H')->setAutoSize(false)->setWidth(8);
        $sheet->getColumnDimension('I')->setAutoSize(false)->setWidth(12.5);
        $sheet->getColumnDimension('J')->setAutoSize(false)->setWidth(11);
        $sheet->getColumnDimension('K')->setAutoSize(false)->setWidth(15);
        $sheet->getColumnDimension('L')->setAutoSize(false)->setWidth(20);
        $sheet->getColumnDimension('M')->setAutoSize(false)->setWidth(18);
        $sheet->getColumnDimension('N')->setAutoSize(true);
        $sheet->getColumnDimension('O')->setAutoSize(false)->setWidth(14.5);
        $sheet->getColumnDimension('P')->setAutoSize(false)->setWidth(5.5);
        $sheet->getColumnDimension('Q')->setAutoSize(false)->setWidth(5.5);
        $sheet->getColumnDimension('R')->setAutoSize(false)->setWidth(6.5);
        $sheet->getColumnDimension('S')->setAutoSize(false)->setWidth(35);

        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A3);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0); 
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="外業管理表_'.date('Ymd').'.xlsx"');
        header('Cache-Control: max-age=0');
        
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    }
}

// ==========================================
// 安全作業計画書 Excel生成処理
// ==========================================
if ($action === 'export_plan') {
    $spreadsheet = null;
    try {
        // ★ 指示通り、templateフォルダ内を参照
        $templatePath = __DIR__ . '/template/template.xlsx';
        if (!file_exists($templatePath)) throw new Exception("テンプレートファイルが見つかりません。templateフォルダを確認してください。");

        $dbFile = __DIR__ . '/data/anzen_db.sqlite';
        $pdo = new PDO('sqlite:' . $dbFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getSheet(0);

        $sheet->setCellValue('L12', $postData['job_no'] ?? '');
        $sheet->setCellValue('B12', $postData['job_content'] ?? '');
        $sheet->setCellValue('B13', $postData['location'] ?? '');
        $sheet->setCellValue('B35', $postData['work_detail'] ?? '');
        $sheet->getStyle('B35')->getAlignment()->setWrapText(true);
        $sheet->setCellValue('B55', $postData['safety_measures'] ?? '');
        $sheet->getStyle('B55')->getAlignment()->setWrapText(true);
        $sheet->setCellValue('K54', $postData['danger_other_text'] ?? '');

        if (!empty($postData['dangers'])) {
            $ellipsePath = __DIR__ . '/template/circle.png';
            if (file_exists($ellipsePath)) {
                $dangerMap = ['触車' => 'B54', '感電' => 'D54', '墜落' => 'G54', 'その他' => 'I54'];
                foreach ($postData['dangers'] as $danger) {
                    if (isset($dangerMap[$danger])) {
                        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                        $drawing->setName('Danger_Circle');
                        $drawing->setPath($ellipsePath);
                        $drawing->setCoordinates($dangerMap[$danger]);
                        if ($danger === 'その他') {
                            $drawing->setOffsetX(115); $drawing->setOffsetY(-2);
                        } else {
                            $drawing->setOffsetX(60); $drawing->setOffsetY(-2); 
                        }
                        $drawing->setWorksheet($sheet);
                    }
                }
            }
        }

        $teamInfo = null;
        if (!empty($postData['team_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM team_settings WHERE id = ?");
            $stmt->execute([$postData['team_id']]);
            $teamInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        $yorudatsu_data = [];
        if (!empty($postData['yorudatsu_csv_data'])) {
            $yorudatsu_data = json_decode($postData['yorudatsu_csv_data'], true) ?? [];
        }

        $has_closure_overall = false;

        for ($i = 1; $i <= 5; $i++) {
            $r_date = 6 + $i; 
            $raw_date = $postData["date_{$i}"] ?? '';
            $sheet->setCellValue('C'.$r_date, $raw_date ? date('Y年n月j日', strtotime($raw_date)) : '');
            
            $raw_start = $postData["start_{$i}"] ?? '';
            $raw_end = $postData["end_{$i}"] ?? '';
            $fmt_start = $raw_start !== '' ? date('G:i', strtotime($raw_start)) : '';
            $fmt_end   = $raw_end !== '' ? date('G:i', strtotime($raw_end)) : '';
            
            $sheet->setCellValue('G'.$r_date, $fmt_start);
            $sheet->setCellValue('I'.$r_date, $fmt_end);
            $sheet->setCellValue('J'.$r_date, $postData["reserve_{$i}"] ? '（予備日）' : '');

            $r_our = 17 + $i;
            $sheet->setCellValue('D'.$r_our, $postData["our_leader_{$i}"] ?? '');
            $sheet->setCellValue('E'.$r_our, $postData["our_phone_{$i}"] ?? '');
            $sheet->setCellValue('F'.$r_our, $postData["our_w1_{$i}"] ?? '');
            $sheet->setCellValue('G'.$r_our, $postData["our_w2_{$i}"] ?? '');
            $sheet->setCellValue('H'.$r_our, $postData["our_w3_{$i}"] ?? '');
            $sheet->setCellValue('I'.$r_our, $postData["our_w4_{$i}"] ?? '');
            
            $our_cl = $postData["our_cl_{$i}"] ?? '';
            $sheet->setCellValue('J'.$r_our, $our_cl);
            $sheet->setCellValue('K'.$r_our, $postData["our_g1_{$i}"] ?? '');
            $sheet->setCellValue('L'.$r_our, $postData["our_g2_{$i}"] ?? '');

            $r_part = 23 + $i;
            $sheet->setCellValue('D'.$r_part, $postData["part_name_{$i}"] ?? '');
            $sheet->setCellValue('F'.$r_part, $postData["part_leader_{$i}"] ?? '');
            $sheet->setCellValue('G'.$r_part, $postData["part_phone_{$i}"] ?? '');
            $sheet->setCellValue('H'.$r_part, $postData["part_count_{$i}"] ?? '');
            $sheet->setCellValue('I'.$r_part, $postData["part_g_count_{$i}"] ?? '');
            $sheet->setCellValue('J'.$r_part, $postData["part_t_count_{$i}"] ?? '');
            $sheet->setCellValue('K'.$r_part, $postData["part_other_{$i}"] ?? '');

            $r_client = 29 + $i;
            $sheet->setCellValue('C'.$r_client, $postData["client_num_{$i}"] ?? '');
            $sheet->setCellValue('D'.$r_client, $postData["client_name_{$i}"] ?? '');

            if ($raw_date !== '') {
                if ($our_cl !== '') {
                    $has_closure_overall = true;
                    $sheetWork = $spreadsheet->getSheetByName("work{$i}d");
                    
                    if ($sheetWork !== null) {
                        if ($teamInfo) {
                            $sheetWork->setCellValue('C62', $teamInfo['group_leader_name'] ?? '');
                            $sheetWork->setCellValue('F62', $teamInfo['group_leader_phone'] ?? '');
                        }

                        $current_date = date('Y-m-d', strtotime($raw_date));
                        $next_date    = date('Y-m-d', strtotime($raw_date . ' +1 day'));
                        
                        if (isHolidayOrWeekend($current_date, $holidays)) {
                            $sheetWork->setCellValue('K13', '（土休2号）');
                        } else {
                            $sheetWork->setCellValue('K13', '（平日1号）');
                        }
                        
                        if (isHolidayOrWeekend($next_date, $holidays)) {
                            $sheetWork->setCellValue('V13', '（土休2号）');
                        } else {
                            $sheetWork->setCellValue('V13', '（平日1号）');
                        }

                        if (!empty($yorudatsu_data)) {
                            $target_date = date('Y-m-d', strtotime($raw_date));
                            $target_name = str_replace([' ', '　'], '', $our_cl); 
                            
                            foreach ($yorudatsu_data as $row) {
                                if (count($row) > 28) {
                                    $csv_date_str = trim($row[0]); 
                                    if ($csv_date_str === '') continue;
                                    $csv_date = date('Y-m-d', strtotime(str_replace('/', '-', $csv_date_str)));
                                    $csv_name = str_replace([' ', '　'], '', trim($row[8])); 
                                    
                                    if ($target_date === $csv_date && $target_name === $csv_name) {
                                        $sheetWork->setCellValue('H6', trim($row[2]));
                                        $sheetWork->setCellValue('G8', trim($row[10]));
                                        
                                        $w_val = trim($row[22]);
                                        $line_g9 = ''; $line_e22 = '';
                                        if ($w_val === '京都本線') { $line_g9 = '京都線'; $line_e22 = '京都'; }
                                        elseif ($w_val === '神戸本線') { $line_g9 = '神戸線'; $line_e22 = '神戸'; }
                                        elseif ($w_val === '宝塚本線') { $line_g9 = '宝塚線'; $line_e22 = '宝塚'; }
                                        else { $line_g9 = $w_val; $line_e22 = $w_val; }

                                        $y_val = trim($row[24]); $z_val = trim($row[25]);
                                        $place_str = '';
                                        if ($y_val !== '' || $z_val !== '') {
                                            $place_str = ($y_val === $z_val) ? $y_val . '構内' : $y_val . '～' . $z_val;
                                        }
                                        
                                        $sheetWork->setCellValue('G9', trim($line_g9 . ' ' . $place_str));
                                        $sheetWork->setCellValue('E22', $line_e22);
                                        $sheetWork->setCellValue('G10', trim($row[28]));
                                        break; 
                                    }
                                } 
                                elseif (count($row) === 8) {
                                    $csv_date_str = trim($row[0]); 
                                    if ($csv_date_str === '') continue;
                                    $csv_date = date('Y-m-d', strtotime(str_replace('/', '-', $csv_date_str)));
                                    $csv_name = str_replace([' ', '　'], '', trim($row[2])); 
                                    
                                    if ($target_date === $csv_date && $target_name === $csv_name) {
                                        $sheetWork->setCellValue('H6', trim($row[1]));
                                        $sheetWork->setCellValue('G8', trim($row[3]));
                                        
                                        $w_val = trim($row[4]);
                                        $line_g9 = ''; $line_e22 = '';
                                        if ($w_val === '京都本線') { $line_g9 = '京都線'; $line_e22 = '京都'; }
                                        elseif ($w_val === '神戸本線') { $line_g9 = '神戸線'; $line_e22 = '神戸'; }
                                        elseif ($w_val === '宝塚本線') { $line_g9 = '宝塚線'; $line_e22 = '宝塚'; }
                                        else { $line_g9 = $w_val; $line_e22 = $w_val; }

                                        $y_val = trim($row[5]); $z_val = trim($row[6]);
                                        $place_str = '';
                                        if ($y_val !== '' || $z_val !== '') {
                                            $place_str = ($y_val === $z_val) ? $y_val . '構内' : $y_val . '～' . $z_val;
                                        }
                                        
                                        $sheetWork->setCellValue('G9', trim($line_g9 . ' ' . $place_str));
                                        $sheetWork->setCellValue('E22', $line_e22);
                                        $sheetWork->setCellValue('G10', trim($row[7]));
                                        break; 
                                    }
                                }
                            }
                        }

                        $barPath = __DIR__ . '/template/bar600.png';
                        if (file_exists($barPath)) {
                            if (empty($postData["chk_kido_{$i}"])) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($barPath); $draw->setCoordinates('D141'); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                            }
                            if (empty($postData["chk_denki_{$i}"])) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($barPath); $draw->setCoordinates('D142'); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                            }
                            if (empty($postData["chk_teiden_{$i}"])) {
                                $teidenCellsC = ['C34', 'C35', 'C36', 'C37', 'C46', 'C47'];
                                foreach ($teidenCellsC as $cell) {
                                    $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                    $draw->setPath($barPath); $draw->setCoordinates($cell); $draw->setOffsetX(5); $draw->setOffsetY(10); $draw->setWorksheet($sheetWork);
                                }
                                $teidenCellsD = ['D143'];
                                foreach ($teidenCellsD as $cell) {
                                    $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                    $draw->setPath($barPath); $draw->setCoordinates($cell); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                                }
                            }
                            if (empty($postData["chk_toro_{$i}"])) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($barPath); $draw->setCoordinates('D146'); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                            }
                            if (empty($postData["chk_kanban_{$i}"])) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($barPath); $draw->setCoordinates('D148'); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                            }
                            if (empty($postData["chk_fumikiri_{$i}"])) {
                                $fumiCellsC = ['C45'];
                                foreach ($fumiCellsC as $cell) {
                                    $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                    $draw->setPath($barPath); $draw->setCoordinates($cell); $draw->setOffsetX(5); $draw->setOffsetY(10); $draw->setWorksheet($sheetWork);
                                }
                                $fumiCellsD = ['D151'];
                                foreach ($fumiCellsD as $cell) {
                                    $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                    $draw->setPath($barPath); $draw->setCoordinates($cell); $draw->setOffsetX(-16); $draw->setOffsetY(13); $draw->setWorksheet($sheetWork);
                                }
                            }
                            if (empty($postData["chk_ryuchi_{$i}"])) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($barPath); $draw->setCoordinates('C42'); $draw->setOffsetX(5); $draw->setOffsetY(10); $draw->setWorksheet($sheetWork);
                            }
                        }
                    }
                } else {
                    $sheetWork = $spreadsheet->getSheetByName("work{$i}d");
                    if ($sheetWork !== null) $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheetWork));

                    $sheetChecklist = $spreadsheet->getSheetByName("checklist{$i}d");
                    if ($sheetChecklist !== null) {
                        $bar400Path = __DIR__ . '/template/bar400.png';
                        if (file_exists($bar400Path)) {
                            $offsetX_bar400 = 0; $offsetY_bar400 = 10;
                            $is_shokusha = !empty($postData['dangers']) && in_array('触車', $postData['dangers']);
                            $cells400 = $is_shokusha ? ['B22', 'B30', 'B32', 'B61'] : ['B22', 'B23', 'B30', 'B32', 'B59', 'B61'];
                            
                            foreach ($cells400 as $cell) {
                                $draw = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                                $draw->setPath($bar400Path); $draw->setCoordinates($cell); $draw->setOffsetX($offsetX_bar400); $draw->setOffsetY($offsetY_bar400); $draw->setWorksheet($sheetChecklist);
                            }
                        }
                    }
                    
                    $sheetKinkyu1 = $spreadsheet->getSheetByName("緊急連絡");
                    if ($sheetKinkyu1 !== null) {
                        $baseRow = 7 + ($i - 1) * 6;
                        $sheetKinkyu1->setCellValue('Q' . $baseRow, ''); $sheetKinkyu1->setCellValue('P' . ($baseRow + 1), ''); $sheetKinkyu1->setCellValue('P' . ($baseRow + 2), '');
                    }
                }

            } else {
                $sheetChecklist = $spreadsheet->getSheetByName("checklist{$i}d");
                if ($sheetChecklist !== null) $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheetChecklist));
                $sheetWork = $spreadsheet->getSheetByName("work{$i}d");
                if ($sheetWork !== null) $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheetWork));
                $sheetKinkyu1 = $spreadsheet->getSheetByName("緊急連絡");
                if ($sheetKinkyu1 !== null) {
                    $baseRow = 7 + ($i - 1) * 6;
                    $sheetKinkyu1->setCellValue('Q' . $baseRow, ''); $sheetKinkyu1->setCellValue('P' . ($baseRow + 1), ''); $sheetKinkyu1->setCellValue('P' . ($baseRow + 2), '');
                }
            }
        }

        if (!$has_closure_overall) {
            $sheetKinkyu1 = $spreadsheet->getSheetByName("緊急連絡");
            if ($sheetKinkyu1 !== null) $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheetKinkyu1));
            $sheetKinkyu2 = $spreadsheet->getSheetByName("緊急連絡 (業者様用)");
            if ($sheetKinkyu2 !== null) $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheetKinkyu2));
        } else {
            if ($teamInfo) {
                $sheetKinkyu1 = $spreadsheet->getSheetByName("緊急連絡");
                if ($sheetKinkyu1 !== null) {
                    $sheetKinkyu1->setCellValue('Q37', $teamInfo['contact1_name']); $sheetKinkyu1->setCellValue('R37', $teamInfo['contact1_phone']);
                    $sheetKinkyu1->setCellValue('Q38', $teamInfo['contact2_name']); $sheetKinkyu1->setCellValue('R38', $teamInfo['contact2_phone']);
                }
            }
        }
        
        $spreadsheet->setActiveSheetIndex(0);
        $job_no = preg_replace('/[^a-zA-Z0-9_-]/', '', $postData['job_no'] ?? 'draft');
        $outFileName = "安全作業計画書_" . $job_no . "_" . date('Ymd') . ".xlsx";
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $outFileName . '"');
        header('Cache-Control: max-age=0');
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        $spreadsheet->disconnectWorksheets(); unset($spreadsheet);
        exit;
    } catch (Exception $e) {
        if ($spreadsheet !== null) { $spreadsheet->disconnectWorksheets(); unset($spreadsheet); }
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    }
}
