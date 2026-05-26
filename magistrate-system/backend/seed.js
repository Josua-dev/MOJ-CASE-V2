/**
 * MOJ Case Tracking System — 500-case seed
 * Place in: magistrate-system/backend/seed.js
 * Run with: node seed.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'data/magistrate.db'));
db.pragma('journal_mode = WAL');
// Temporarily disable FK checks so users are inserted before cases reference them
db.pragma('foreign_keys = OFF');

// --- Ensure tables exist (same DDL as database.js) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'clerk',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY, case_number TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
    description TEXT, case_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'Medium', plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL, presiding_officer TEXT, assigned_to TEXT,
    hearing_date TEXT, next_action TEXT, created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS case_logs (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL, action TEXT NOT NULL,
    note TEXT, performed_by TEXT NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id));
`);

// --- Get or create admin user ---
let adminRow = db.prepare("SELECT id FROM users WHERE email = 'admin@moj.na'").get();
if (!adminRow) {
  const adminId = uuidv4();
  db.prepare('INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)')
    .run(adminId,'System Administrator','admin@moj.na',bcrypt.hashSync('Admin@1234',10),'admin');
  adminRow = { id: adminId };
  console.log('Created admin user');
} else {
  console.log('Using existing admin user:', adminRow.id);
}
const adminId = adminRow.id;

// --- Insert cases and logs ---
const insertCase = db.prepare(`INSERT OR IGNORE INTO cases
  (id,case_number,title,description,case_type,status,priority,plaintiff,defendant,
  presiding_officer,assigned_to,hearing_date,next_action,created_by,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

const insertLog = db.prepare(`INSERT OR IGNORE INTO case_logs
  (id,case_id,action,note,performed_by,performed_at)
  VALUES (?,?,?,?,?,?)`);

const seedAll = db.transaction(() => {
  insertCase.run('b79026c4-52a6-4b01-b5f1-53b2503ae09c','MOJ-2023-0001','State v. Haufiku','Drug possession charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Zanele Haufiku',
    'Magistrate P. Nghifindaka','','2024-01-13','Sentencing hearing',adminId,'2023-03-13','2023-03-13');
  insertCase.run('b8f8a2d5-2296-4685-91d2-441294bdc4de','MOJ-2026-0002','State v. Iiyambo','Reckless driving charge filed in Rundu.',
    'Criminal','Open','Low','State of Namibia','Thabo Iiyambo',
    'Magistrate P. Nghifindaka','','2026-11-03','Sentencing hearing',adminId,'2026-05-10','2026-05-10');
  insertCase.run('22108d2f-2f8c-4fd1-b87a-ccbe90002848','MOJ-2026-0003','Swanepoel v. Molefe','Property boundary dispute.',
    'Civil','Active','Medium','Nico Swanepoel','Haufiku Molefe',
    'Magistrate L. Shikongo','','2026-09-18','Final arguments',adminId,'2026-02-10','2026-02-10');
  insertCase.run('3e2de5b6-cd44-4f40-97f2-b576adeba781','MOJ-2023-0004','Angula v. Shikongo','Divorce and child custody matter.',
    'Family','Closed','Medium','Shikongo Angula','Riaan Shikongo',
    'Magistrate A. Haihambo','','2024-01-09','Final arguments',adminId,'2023-01-23','2023-01-23');
  insertCase.run('f934e824-3167-4ba4-8a44-5e58effa5eab','MOJ-2025-0005','Khumalo v. Shikongo','Defamation suit.',
    'Civil','Closed','Low','Pieter Khumalo','Zanele Shikongo',
    'Magistrate L. Shikongo','','2026-01-31','Awaiting defendant response',adminId,'2025-04-27','2025-04-27');
  insertCase.run('0b149599-3a5b-4151-854f-dad992ffe729','MOJ-2025-0006','State v. Mwatotele','Tax evasion charge filed in Katutura.',
    'Criminal','Active','Medium','State of Namibia','Nandi Mwatotele',
    'Magistrate P. Nghifindaka','','2026-11-14','Awaiting defendant response',adminId,'2025-05-17','2025-05-17');
  insertCase.run('4149da4d-c334-4a46-ad9f-fe3ae67f7fb8','MOJ-2024-0007','Botha v. Mostert','Unfair dismissal claim.',
    'Labour','Active','Medium','Sifiso Botha','Ndapewa Mostert',
    'Magistrate P. Nghifindaka','','2026-06-16','Awaiting defendant response',adminId,'2024-06-15','2024-06-15');
  insertCase.run('b6f0dd76-89fe-4bb2-a833-c3ab3eeb02c7','MOJ-2025-0008','Pretorius v. Plessis','Eviction proceeding.',
    'Civil','Closed','High','Sbu Pretorius','Marlene du Plessis',
    'Magistrate N. Nakale','','2025-11-26','Expert witness testimony',adminId,'2026-04-14','2026-04-14');
  insertCase.run('b65eb025-065b-4c38-83cc-d56ad2cae214','MOJ-2026-0009','Mahlangu v. Nghifindaka','Commercial lease dispute.',
    'Commercial','Active','Medium','Riaan Mahlangu','Mwatotele Nghifindaka',
    'Magistrate R. Kauari','','2026-06-25','Judgment delivery',adminId,'2026-05-07','2026-05-07');
  insertCase.run('70bac126-e8a4-4a0c-93ff-5e998ba9d476','MOJ-2026-0010','Mostert v. Ndlovu','Workplace harassment.',
    'Labour','Pending','Medium','Haufiku Mostert','Petrus Ndlovu',
    'Magistrate L. Shikongo','','2026-10-17','Awaiting defendant response',adminId,'2026-01-30','2026-01-30');
  insertCase.run('2c149bf4-cf59-4806-9ddc-9d24b24d4f23','MOJ-2026-0011','State v. Nghidinwa','Contempt of court charge filed in Rundu.',
    'Criminal','Active','Low','State of Namibia','Zanele Nghidinwa',
    'Magistrate A. Haihambo','','2026-10-09','Judgment delivery',adminId,'2026-02-15','2026-02-15');
  insertCase.run('2e4bad92-cda4-4f13-a7e8-5d5cf53ec319','MOJ-2024-0012','Ndlovu v. Barnard','Maintenance order matter.',
    'Family','Closed','Medium','Thabo Ndlovu','Josef Barnard',
    'Magistrate L. Shikongo','','2024-09-07','Pre-trial conference',adminId,'2024-06-14','2024-06-14');
  insertCase.run('d066c827-7b50-4ab8-8762-a4aeb02eb513','MOJ-2023-0013','State v. Pretorius','Extortion charge filed in Walvis Bay.',
    'Criminal','Closed','High','State of Namibia','Thandeka Pretorius',
    'Magistrate T. Amukoto','','2024-01-28','Final arguments',adminId,'2023-09-30','2023-09-30');
  insertCase.run('82f3ca3c-04f3-46cb-a84c-969907e3bdbb','MOJ-2025-0014','Nangolo v. Khumalo','Breach of supply contract.',
    'Commercial','Open','Medium','Amukoto Nangolo','Marlene Khumalo',
    'Magistrate A. Haihambo','','2026-11-20','Plea entry',adminId,'2026-05-25','2026-05-25');
  insertCase.run('aa70e9b4-dd83-475e-8d0a-201624d45679','MOJ-2025-0015','State v. Khumalo','Assault (grievous bodily harm) charge filed in Windhoek.',
    'Criminal','Pending','Medium','State of Namibia','Andile Khumalo',
    'Magistrate P. Nghifindaka','','2026-11-10','Witness testimony',adminId,'2025-02-06','2025-02-06');
  insertCase.run('10a4f486-b5ea-47c7-a957-2d88ea03dfe1','MOJ-2025-0016','State v. Pretorius','Drug possession charge filed in Oshakati.',
    'Criminal','Pending','Medium','State of Namibia','Uuyuni Pretorius',
    'Magistrate A. Haihambo','','2026-07-26','Awaiting defendant response',adminId,'2025-09-06','2025-09-06');
  insertCase.run('ec24ef98-8ffb-4fb6-a0e7-2a88b949718f','MOJ-2026-0017','Nghifindaka v. Haihambo','Property boundary dispute.',
    'Civil','Closed','High','Maria Nghifindaka','Haimbodi Haihambo',
    'Magistrate N. Nakale','','2026-01-25','Sentencing hearing',adminId,'2026-01-25','2026-01-25');
  insertCase.run('0b20a6bb-cbf0-4d6f-b10f-5c7baf0ed596','MOJ-2023-0018','State v. Amupolo','Fraud charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Uuyuni Amupolo',
    'Magistrate T. Amukoto','','2026-07-20','Sentencing hearing',adminId,'2023-04-09','2023-04-09');
  insertCase.run('202369ce-26f8-4430-8aa9-121c06442fd3','MOJ-2026-0019','Agency v. Mokoena','Personal injury claim.',
    'Civil','Closed','Low','Namibia Revenue Agency','Sipho Mokoena',
    'Senior Magistrate J. Botha','','2026-01-26','Final arguments',adminId,'2026-05-21','2026-05-21');
  insertCase.run('97465117-eed0-4ffa-9338-37c86a4a512b','MOJ-2026-0020','Louw v. Steyn','Retrenchment challenge.',
    'Labour','Open','High','Eino Louw','Shikongo Steyn',
    'Magistrate L. Shikongo','','2026-06-02','Mediation session',adminId,'2026-04-08','2026-04-08');
  insertCase.run('1f2cf78d-e162-4297-89ca-e02f74cdf64c','MOJ-2026-0021','State v. Grobler','Assault (common) charge filed in Windhoek.',
    'Criminal','Open','Medium','State of Namibia','Mukuve Grobler',
    'Magistrate P. Nghifindaka','','2026-06-17','Witness testimony',adminId,'2026-05-19','2026-05-19');
  insertCase.run('be46fd94-086a-4347-84bf-d8410c0c2834','MOJ-2026-0022','State v. Amukoto','Theft charge filed in Oshakati.',
    'Criminal','Open','Low','State of Namibia','Marlene Amukoto',
    'Magistrate R. Kauari','','2026-11-21','Documentary evidence submission',adminId,'2026-01-18','2026-01-18');
  insertCase.run('9af40853-8243-452a-87a5-0fc22baea3da','MOJ-2024-0023','State v. Grobler','Failure to appear charge filed in Katutura.',
    'Criminal','Pending','Low','State of Namibia','Haihambo Grobler',
    'Magistrate N. Nakale','','2026-10-24','Awaiting defendant response',adminId,'2024-10-25','2024-10-25');
  insertCase.run('b77d235e-ee9a-49bb-bf5d-a9a910449e36','MOJ-2025-0024','Pieterse v. Haihambo','Eviction proceeding.',
    'Civil','Active','High','Haufiku Pieterse','Sipho Haihambo',
    'Magistrate R. Kauari','','2026-08-17','Awaiting defendant response',adminId,'2025-11-27','2025-11-27');
  insertCase.run('62360f8d-73a8-4eab-8249-9e87c815fa11','MOJ-2023-0025','Steyn v. Amupolo','Eviction proceeding.',
    'Civil','Pending','Medium','Josef Steyn','Lerato Amupolo',
    'Magistrate R. Kauari','','2026-06-19','Expert witness testimony',adminId,'2023-06-28','2023-06-28');
  insertCase.run('1dc3c4ca-4712-4cfe-9e75-3ef69b5a75c6','MOJ-2025-0026','State v. Sithole','Drug possession charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Riaan Sithole',
    'Magistrate T. Amukoto','','2025-05-16','Expert witness testimony',adminId,'2025-03-10','2025-03-10');
  insertCase.run('c5de389e-74f2-40d0-9a5f-c00453fd3af2','MOJ-2025-0027','Louw v. Mokoena','Debt recovery.',
    'Civil','Closed','Medium','Nghifindaka Louw','Andile Mokoena',
    'Magistrate P. Nghifindaka','','2026-03-13','Awaiting defendant response',adminId,'2025-11-21','2025-11-21');
  insertCase.run('888ccab4-d16b-4abd-a74d-89112051a328','MOJ-2023-0028','Merwe v. Iiyambo','Divorce and child custody matter.',
    'Family','Closed','Medium','Iipumbu van der Merwe','Nghifikepunye Iiyambo',
    'Magistrate A. Haihambo','','2023-08-15','Mediation session',adminId,'2024-01-15','2024-01-15');
  insertCase.run('90782463-0085-4f78-8fe4-f69b466a6198','MOJ-2024-0029','State v. Tshabalala','Arson charge filed in Windhoek.',
    'Criminal','Closed','Medium','State of Namibia','Danie Tshabalala',
    'Magistrate R. Kauari','','2024-01-22','Plea entry',adminId,'2024-03-06','2024-03-06');
  insertCase.run('befa178a-a040-42e7-8236-3254c1483dff','MOJ-2024-0030','State v. Visser','Contravening by-law charge filed in Windhoek.',
    'Criminal','Active','High','State of Namibia','Lerato Visser',
    'Magistrate R. Kauari','','2026-08-01','Expert witness testimony',adminId,'2025-04-21','2025-04-21');
  insertCase.run('7d657933-39de-490d-b439-70977348f7bf','MOJ-2025-0031','Namibia v. Coetzee','IP infringement.',
    'Commercial','Closed','Medium','State of Namibia','Sifiso Coetzee',
    'Magistrate A. Haihambo','','2025-12-26','Mediation session',adminId,'2026-02-08','2026-02-08');
  insertCase.run('3163b26e-8a12-4a01-a3c2-c5d0c47086a3','MOJ-2024-0032','Radebe v. Shilongo','Debt recovery.',
    'Civil','Open','Medium','Kobus Radebe','Kamati Shilongo',
    'Magistrate N. Nakale','','2026-06-19','Legal aid assessment',adminId,'2024-05-22','2024-05-22');
  insertCase.run('91e04c13-5148-4c81-ae01-121027f9a9da','MOJ-2025-0033','State v. Sithole','Money laundering charge filed in Walvis Bay.',
    'Criminal','Open','Medium','State of Namibia','Johan Sithole',
    'Magistrate R. Kauari','','2026-08-08','Pre-trial conference',adminId,'2026-05-08','2026-05-08');
  insertCase.run('44f2aa4c-e40e-4ff5-8a96-8454a082257b','MOJ-2025-0034','Botha v. Nghifindaka','Divorce and child custody matter.',
    'Family','Active','Low','Sbu Botha','Nghidinwa Nghifindaka',
    'Magistrate N. Nakale','','2026-07-20','Expert witness testimony',adminId,'2025-10-23','2025-10-23');
  insertCase.run('f28eeb58-1b32-4b01-bb2d-7284c13ab260','MOJ-2024-0035','Wyk v. Shilongo','Domestic violence interdict matter.',
    'Family','Active','Low','Riaan van Wyk','Danie Shilongo',
    'Magistrate S. Iipumbu','','2026-11-18','Pre-trial conference',adminId,'2024-06-09','2024-06-09');
  insertCase.run('83c8b0e4-608d-4f6f-9ff8-945fb840d505','MOJ-2026-0036','Shaanika v. Barnard','Debt recovery.',
    'Civil','Pending','Medium','Francois Shaanika','Nakale Barnard',
    'Magistrate P. Nghifindaka','','2026-11-22','Plea entry',adminId,'2026-04-08','2026-04-08');
  insertCase.run('ce07c78d-bde9-408a-8d18-d35da7968a25','MOJ-2023-0037','Amupolo v. Haufiku','Personal injury claim.',
    'Civil','Active','Medium','Shikongo Amupolo','Amukoto Haufiku',
    'Magistrate N. Nakale','','2026-11-04','Final arguments',adminId,'2023-10-24','2023-10-24');
  insertCase.run('12966f10-206e-45ea-a386-d52bea43531e','MOJ-2024-0038','State v. Barnard','Driving under the influence charge filed in Katutura.',
    'Criminal','Active','Medium','State of Namibia','Mwatotele Barnard',
    'Magistrate T. Amukoto','','2026-08-01','Settlement negotiations',adminId,'2025-05-02','2025-05-02');
  insertCase.run('cc462655-308f-41e7-9002-be38b8982667','MOJ-2023-0039','Niipare v. Nakale','Debt recovery.',
    'Civil','Active','Low','Nghidinwa Niipare','Eino Nakale',
    'Senior Magistrate J. Botha','','2026-11-10','Plea entry',adminId,'2024-03-29','2024-03-29');
  insertCase.run('a6997262-5858-4e95-ba62-091b6f3ea052','MOJ-2023-0040','State v. Nangolo','Breach of contract charge filed in Windhoek.',
    'Criminal','Closed','High','State of Namibia','Shaanika Nangolo',
    'Magistrate P. Nghifindaka','','2024-05-05','Mediation session',adminId,'2024-02-16','2024-02-16');
  insertCase.run('62357dc0-da0c-4b6f-8bf3-f8b754a078ae','MOJ-2023-0041','Wyk v. Iiyambo','Retrenchment challenge.',
    'Labour','Open','High','Angula van Wyk','Nghifikepunye Iiyambo',
    'Magistrate S. Iipumbu','','2026-09-23','Final arguments',adminId,'2024-04-01','2024-04-01');
  insertCase.run('517d0a29-aa08-4668-91d5-d8108849f483','MOJ-2024-0042','Roux v. Mthembu','Workplace harassment.',
    'Labour','Active','Medium','Niipare le Roux','Iiyambo Mthembu',
    'Magistrate P. Nghifindaka','','2026-08-11','Settlement negotiations',adminId,'2024-11-22','2024-11-22');
  insertCase.run('2c35c0ef-d79c-46ed-a94f-3f4290aa3c95','MOJ-2025-0043','Holdings v. Niipare','Personal injury claim.',
    'Civil','Active','Medium','NamPower Holdings','Eino Niipare',
    'Magistrate S. Iipumbu','','2026-06-22','Expert witness testimony',adminId,'2025-10-04','2025-10-04');
  insertCase.run('2a4c9fd1-d9bb-4832-b1b5-f83ec9fff85a','MOJ-2026-0044','Hamukwaya v. Klerk','Commercial lease dispute.',
    'Commercial','Active','High','Niipare Hamukwaya','Thabo de Klerk',
    'Magistrate N. Nakale','','2026-09-17','Witness testimony',adminId,'2026-02-22','2026-02-22');
  insertCase.run('dfed0b00-525a-4e58-a636-80b176b24967','MOJ-2023-0045','Khumalo v. Khumalo','Domestic violence interdict matter.',
    'Family','Active','High','Nangolo Khumalo','Nghifindaka Khumalo',
    'Magistrate N. Nakale','','2026-10-19','Judgment delivery',adminId,'2024-01-18','2024-01-18');
  insertCase.run('ff70aadd-6022-4998-ac2a-3d6fc9a0b0b2','MOJ-2026-0046','Angula v. Amukoto','Adoption proceeding matter.',
    'Family','Closed','High','Angula Angula','Thabo Amukoto',
    'Magistrate R. Kauari','','2026-02-02','Settlement negotiations',adminId,'2026-04-30','2026-04-30');
  insertCase.run('00a5bcc4-806d-4153-b133-071bbfd1ab85','MOJ-2023-0047','Grobler v. Mostert','IP infringement.',
    'Commercial','Open','High','Shikongo Grobler','Eino Mostert',
    'Magistrate R. Kauari','','2026-09-07','Witness testimony',adminId,'2023-05-14','2023-05-14');
  insertCase.run('750c147e-10b1-4b4c-a923-c3b5549f823e','MOJ-2025-0048','State v. Roux','Tax evasion charge filed in Windhoek.',
    'Criminal','Active','Low','State of Namibia','Nandi le Roux',
    'Magistrate L. Shikongo','','2026-11-15','Legal aid assessment',adminId,'2025-04-25','2025-04-25');
  insertCase.run('1b58ee03-a96a-4eea-bc11-f8ac99b36322','MOJ-2024-0049','State v. Kamati','Reckless driving charge filed in Walvis Bay.',
    'Criminal','Pending','Medium','State of Namibia','Riaan Kamati',
    'Magistrate P. Nghifindaka','','2026-11-20','Mediation session',adminId,'2024-08-30','2024-08-30');
  insertCase.run('33be18ae-5f6f-4a12-8c6a-8ef45684dc5d','MOJ-2025-0050','Barnard v. Haufiku','Guardianship dispute matter.',
    'Family','Open','Low','Thabo Barnard','Nakale Haufiku',
    'Magistrate R. Kauari','','2026-10-28','Bail application',adminId,'2025-02-25','2025-02-25');
  insertCase.run('3679342a-a71f-4539-bb43-8bdae550e2a9','MOJ-2026-0051','Botha v. Angula','Debt recovery.',
    'Civil','Open','Medium','Nakale Botha','Maria Angula',
    'Magistrate T. Amukoto','','2026-11-02','Postponed — date TBD',adminId,'2026-03-19','2026-03-19');
  insertCase.run('17269b01-c59b-42bc-9a7c-de929100d7fe','MOJ-2025-0052','State v. Nghifindaka','Public disturbance charge filed in Rundu.',
    'Criminal','Pending','Medium','State of Namibia','Zanele Nghifindaka',
    'Magistrate L. Shikongo','','2026-10-05','Settlement negotiations',adminId,'2025-08-04','2025-08-04');
  insertCase.run('420aac06-f7f5-4426-b8dc-e386cf341605','MOJ-2026-0053','State v. Nghifindaka','Kidnapping charge filed in Rundu.',
    'Criminal','Active','Medium','State of Namibia','Shikongo Nghifindaka',
    'Magistrate A. Haihambo','','2026-10-03','Pre-trial conference',adminId,'2026-05-18','2026-05-18');
  insertCase.run('3adf0ece-ded6-45c8-9b7e-f1a35f549901','MOJ-2024-0054','State v. Mukuve','Possession of stolen goods charge filed in Khomasdal.',
    'Criminal','Active','High','State of Namibia','Angula Mukuve',
    'Magistrate P. Nghifindaka','','2026-10-25','Final arguments',adminId,'2024-08-25','2024-08-25');
  insertCase.run('5fac8cd3-d134-413b-a03d-052a5e46218f','MOJ-2025-0055','State v. Mwatotele','Perjury charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Kobus Mwatotele',
    'Magistrate S. Iipumbu','','2026-08-28','Final arguments',adminId,'2025-05-13','2025-05-13');
  insertCase.run('124d8f96-add3-49a4-9ed0-38ab0faaed4e','MOJ-2024-0056','State v. Iipumbu','Tax evasion charge filed in Rundu.',
    'Criminal','Open','High','State of Namibia','Shaanika Iipumbu',
    'Senior Magistrate J. Botha','','2026-08-02','Judgment delivery',adminId,'2025-01-23','2025-01-23');
  insertCase.run('cf729811-3bd9-4bcd-a737-d5296f30b5cd','MOJ-2026-0057','Mthembu v. Tshabalala','Retrenchment challenge.',
    'Labour','Closed','Low','Shaanika Mthembu','Shilongo Tshabalala',
    'Magistrate T. Amukoto','','2026-04-14','Bail application',adminId,'2026-02-26','2026-02-26');
  insertCase.run('e398b36e-485e-44b6-95ac-adfcb95b105f','MOJ-2026-0058','Wyk v. Grobler','Divorce and child custody matter.',
    'Family','Active','High','Riaan van Wyk','Nomsa Grobler',
    'Magistrate A. Haihambo','','2026-07-31','Bail application',adminId,'2026-03-06','2026-03-06');
  insertCase.run('166c33f1-75cc-4ee3-9e18-b7e294e0496b','MOJ-2024-0059','Coetzee v. Khumalo','Defamation suit.',
    'Civil','Open','High','Zanele Coetzee','Palesa Khumalo',
    'Magistrate A. Haihambo','','2026-10-14','Postponed — date TBD',adminId,'2024-10-28','2024-10-28');
  insertCase.run('14e64e52-74ab-4682-b076-2fe2c7950a25','MOJ-2024-0060','Pretorius v. Klerk','Debt recovery.',
    'Civil','Open','Medium','Shaanika Pretorius','Iiyambo de Klerk',
    'Magistrate A. Haihambo','','2026-06-15','Witness testimony',adminId,'2025-05-13','2025-05-13');
  insertCase.run('9d3aaac3-49cc-44ad-9873-acab5959024e','MOJ-2023-0061','State v. Jacobs','Failure to appear charge filed in Walvis Bay.',
    'Criminal','Pending','Medium','State of Namibia','Francois Jacobs',
    'Senior Magistrate J. Botha','','2026-08-28','Cross-examination',adminId,'2023-08-14','2023-08-14');
  insertCase.run('3f2e67ee-2c36-4d28-9a5d-b7e59eac5e85','MOJ-2023-0062','State v. Mahlangu','Arson charge filed in Oshakati.',
    'Criminal','Active','High','State of Namibia','Nico Mahlangu',
    'Magistrate T. Amukoto','','2026-06-15','Pre-trial conference',adminId,'2023-11-19','2023-11-19');
  insertCase.run('ef7cffb1-2fde-41d5-a774-f679c81b5a68','MOJ-2024-0063','State v. Amupolo','Contempt of court charge filed in Oshakati.',
    'Criminal','Pending','High','State of Namibia','Amukoto Amupolo',
    'Magistrate P. Nghifindaka','','2026-09-07','Final arguments',adminId,'2024-09-24','2024-09-24');
  insertCase.run('bd7202ff-d636-4bc5-b47c-e5e8914324d6','MOJ-2026-0064','Mokoena v. Mthembu','Personal injury claim.',
    'Civil','Pending','Low','Hamukwaya Mokoena','Lerato Mthembu',
    'Magistrate T. Amukoto','','2026-11-09','Final arguments',adminId,'2026-02-23','2026-02-23');
  insertCase.run('621284d5-981f-4a4d-8f82-946d574173b0','MOJ-2023-0065','State v. Botha','Driving under the influence charge filed in Khomasdal.',
    'Criminal','Open','High','State of Namibia','Palesa Botha',
    'Senior Magistrate J. Botha','','2026-09-30','Postponed — date TBD',adminId,'2023-11-01','2023-11-01');
  insertCase.run('9381dbd2-4c3b-4a5c-9a23-3a0fb233316f','MOJ-2025-0066','Mukuve v. Nghifindaka','Unfair dismissal claim.',
    'Labour','Open','Medium','Shilongo Mukuve','Nomsa Nghifindaka',
    'Magistrate A. Haihambo','','2026-11-09','Final arguments',adminId,'2026-02-10','2026-02-10');
  insertCase.run('c0c2efbb-8e8d-4cd8-b8a3-bddece4eac80','MOJ-2024-0067','State v. Plessis','Kidnapping charge filed in Oshakati.',
    'Criminal','Active','Medium','State of Namibia','Nangolo du Plessis',
    'Magistrate T. Amukoto','','2026-08-19','Witness testimony',adminId,'2024-03-25','2024-03-25');
  insertCase.run('e98ecece-7e17-4a10-a780-2fae020f6a32','MOJ-2023-0068','Amupolo v. Namibia','Retrenchment challenge.',
    'Labour','Closed','Medium','Nghifindaka Amupolo','State of Namibia',
    'Magistrate N. Nakale','','2023-10-04','Bail application',adminId,'2023-09-14','2023-09-14');
  insertCase.run('2dd59c25-4a49-4e93-8d5c-8bbcf9fe825a','MOJ-2025-0069','State v. Botha','Vandalism charge filed in Katutura.',
    'Criminal','Open','Medium','State of Namibia','Nakale Botha',
    'Magistrate L. Shikongo','','2026-08-09','Final arguments',adminId,'2025-12-11','2025-12-11');
  insertCase.run('2fba9da8-2567-46df-adde-8422ab03df11','MOJ-2026-0070','Radebe v. Mukuve','Unfair dismissal claim.',
    'Labour','Active','Medium','Kauari Radebe','Anna Mukuve',
    'Magistrate N. Nakale','','2026-06-25','Awaiting defendant response',adminId,'2026-05-06','2026-05-06');
  insertCase.run('940321be-94ba-46cf-9233-99355c6317d6','MOJ-2026-0071','Grobler v. Namibia','Discrimination complaint.',
    'Labour','Active','High','Sbu Grobler','FNB Namibia',
    'Magistrate L. Shikongo','','2026-08-21','Cross-examination',adminId,'2026-01-23','2026-01-23');
  insertCase.run('c053b1a2-e18d-499a-8921-db56c1770025','MOJ-2026-0072','Swanepoel v. Steyn','IP infringement.',
    'Commercial','Open','Medium','Andile Swanepoel','Thandeka Steyn',
    'Magistrate S. Iipumbu','','2026-11-09','Pre-trial conference',adminId,'2026-05-08','2026-05-08');
  insertCase.run('b6cf5d23-88a4-4fcc-bc92-6e81f4fc2b00','MOJ-2026-0073','State v. Kauari','Assault (grievous bodily harm) charge filed in Katutura.',
    'Criminal','Open','Medium','State of Namibia','Iipumbu Kauari',
    'Magistrate R. Kauari','','2026-06-05','Bail application',adminId,'2026-05-22','2026-05-22');
  insertCase.run('1426b739-9dbd-4f5e-94cb-88e257306663','MOJ-2023-0074','Merwe v. Iipumbu','Wage dispute.',
    'Labour','Open','Medium','Amupolo van der Merwe','Kauari Iipumbu',
    'Senior Magistrate J. Botha','','2026-08-15','Expert witness testimony',adminId,'2024-01-02','2024-01-02');
  insertCase.run('e9b6fe1e-60ed-40a4-b59e-1433aba19d83','MOJ-2026-0075','State v. Kauari','Trespassing charge filed in Oshakati.',
    'Criminal','Active','Medium','State of Namibia','Niipare Kauari',
    'Magistrate R. Kauari','','2026-08-11','Settlement negotiations',adminId,'2026-01-18','2026-01-18');
  insertCase.run('a7b2afbc-c35d-43e9-a5c7-a36fd65a3c3e','MOJ-2023-0076','Molefe v. Klerk','Eviction proceeding.',
    'Civil','Closed','Medium','Maria Molefe','Iipumbu de Klerk',
    'Senior Magistrate J. Botha','','2023-08-17','Settlement negotiations',adminId,'2023-03-18','2023-03-18');
  insertCase.run('253381b8-f52f-4a9a-ab14-8fcc943119b3','MOJ-2025-0077','Plessis v. Merwe','Debt recovery.',
    'Civil','Closed','Medium','Anna du Plessis','Kauari van der Merwe',
    'Magistrate N. Nakale','','2026-02-02','Sentencing hearing',adminId,'2026-03-15','2026-03-15');
  insertCase.run('d5ea27d1-92a2-49e9-a56b-22daf9d8b715','MOJ-2024-0078','Nangolo v. Wyk','Wage dispute.',
    'Labour','Open','Medium','Zanele Nangolo','Sipho van Wyk',
    'Magistrate S. Iipumbu','','2026-09-22','Settlement negotiations',adminId,'2024-02-21','2024-02-21');
  insertCase.run('568c6f85-bed2-44e0-995b-c9515aad2c67','MOJ-2026-0079','State v. Molefe','Unlawful termination of employment charge filed in Rundu.',
    'Criminal','Open','High','State of Namibia','Pieter Molefe',
    'Magistrate A. Haihambo','','2026-11-15','Legal aid assessment',adminId,'2026-04-12','2026-04-12');
  insertCase.run('b88c6c52-41ce-45f4-a96f-1bde853076f6','MOJ-2026-0080','Haufiku v. Khumalo','Divorce and child custody matter.',
    'Family','Closed','High','Iiyambo Haufiku','Palesa Khumalo',
    'Magistrate L. Shikongo','','2026-03-02','Pre-trial conference',adminId,'2026-01-18','2026-01-18');
  insertCase.run('f3d04bd8-7ed0-43f7-80a1-cf6530d56502','MOJ-2023-0081','Radebe v. Mthembu','Discrimination complaint.',
    'Labour','Open','Medium','Palesa Radebe','Nico Mthembu',
    'Magistrate L. Shikongo','','2026-06-16','Witness testimony',adminId,'2023-06-16','2023-06-16');
  insertCase.run('588c03ad-d13d-4a3a-a200-e5c593c916dd','MOJ-2026-0082','State v. Mthembu','Land dispute charge filed in Oshakati.',
    'Criminal','Open','Medium','State of Namibia','Mwatotele Mthembu',
    'Magistrate T. Amukoto','','2026-11-07','Pre-trial conference',adminId,'2026-04-08','2026-04-08');
  insertCase.run('c2947f0d-4637-41e5-ae13-081462d0721d','MOJ-2024-0083','Steyn v. Angula','Personal injury claim.',
    'Civil','Active','Medium','Shikongo Steyn','Mwatotele Angula',
    'Senior Magistrate J. Botha','','2026-06-04','Bail application',adminId,'2024-12-07','2024-12-07');
  insertCase.run('103cec52-71e8-4c34-a61d-0bac5c44e3fb','MOJ-2025-0084','Namibia v. Sithole','Personal injury claim.',
    'Civil','Closed','High','FNB Namibia','Kauari Sithole',
    'Magistrate A. Haihambo','','2025-06-04','Cross-examination',adminId,'2026-03-09','2026-03-09');
  insertCase.run('7baed00d-f298-4b18-9a20-65defcb1c6a1','MOJ-2025-0085','Haufiku v. Plessis','Property boundary dispute.',
    'Civil','Closed','Medium','Nakale Haufiku','Niipare du Plessis',
    'Magistrate L. Shikongo','','2025-07-22','Settlement negotiations',adminId,'2025-12-04','2025-12-04');
  insertCase.run('522a47a0-bf36-4192-b659-4b15d70d3f8d','MOJ-2026-0086','Roux v. Haufiku','Personal injury claim.',
    'Civil','Closed','Medium','Kapuka le Roux','Hamukwaya Haufiku',
    'Magistrate S. Iipumbu','','2026-03-06','Sentencing hearing',adminId,'2026-02-18','2026-02-18');
  insertCase.run('74d5daa1-7c50-48a3-9ff6-42a12a3518ac','MOJ-2023-0087','Namibia v. Plessis','Debt recovery.',
    'Civil','Closed','High','Telecom Namibia','Anna du Plessis',
    'Magistrate L. Shikongo','','2024-01-10','Pre-trial conference',adminId,'2023-07-06','2023-07-06');
  insertCase.run('9d772a2f-a40c-4d4b-bf86-117d3fece413','MOJ-2024-0088','Plessis v. Ndlovu','Guardianship dispute matter.',
    'Family','Pending','Medium','Palesa du Plessis','Petrus Ndlovu',
    'Magistrate R. Kauari','','2026-10-03','Bail application',adminId,'2025-04-12','2025-04-12');
  insertCase.run('c9ff2fa4-15f3-4745-b0e5-32b0035db7ec','MOJ-2023-0089','State v. Mokoena','Arson charge filed in Walvis Bay.',
    'Criminal','Closed','Medium','State of Namibia','Josef Mokoena',
    'Magistrate N. Nakale','','2023-10-13','Settlement negotiations',adminId,'2024-02-16','2024-02-16');
  insertCase.run('c10ae717-fbc8-47da-9d71-5c45237bac56','MOJ-2023-0090','Haufiku v. Shaanika','Discrimination complaint.',
    'Labour','Active','Medium','Zanele Haufiku','Thabo Shaanika',
    'Magistrate N. Nakale','','2026-09-05','Settlement negotiations',adminId,'2023-11-23','2023-11-23');
  insertCase.run('48704160-61e7-453f-8f39-c8daf2db9a25','MOJ-2024-0091','State v. Botha','Assault (common) charge filed in Khomasdal.',
    'Criminal','Closed','High','State of Namibia','Thandeka Botha',
    'Magistrate A. Haihambo','','2024-02-29','Awaiting defendant response',adminId,'2024-07-28','2024-07-28');
  insertCase.run('586872f4-d02c-4524-b4d7-0cefe2fa7f25','MOJ-2023-0092','Angula v. Hamukwaya','Personal injury claim.',
    'Civil','Pending','Medium','Shaanika Angula','Haimbodi Hamukwaya',
    'Magistrate N. Nakale','','2026-11-20','Cross-examination',adminId,'2023-07-09','2023-07-09');
  insertCase.run('4ff36779-034f-4a46-84a0-ba4e0bc9444e','MOJ-2026-0093','State v. Amupolo','Breach of contract charge filed in Katutura.',
    'Criminal','Closed','High','State of Namibia','Gerhard Amupolo',
    'Magistrate N. Nakale','','2026-04-05','Bail application',adminId,'2026-01-09','2026-01-09');
  insertCase.run('d36adef4-fc21-4b5f-b9b0-444f78df874f','MOJ-2025-0094','Mokoena v. Swanepoel','Adoption proceeding matter.',
    'Family','Open','High','Shikongo Mokoena','Hamukwaya Swanepoel',
    'Magistrate A. Haihambo','','2026-07-03','Sentencing hearing',adminId,'2026-05-11','2026-05-11');
  insertCase.run('314a5e0b-459c-48ec-8366-f9e406a5f652','MOJ-2023-0095','State v. Pieterse','Kidnapping charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Gerhard Pieterse',
    'Magistrate P. Nghifindaka','','2023-10-17','Mediation session',adminId,'2024-02-07','2024-02-07');
  insertCase.run('31b281e4-764a-486e-a015-491b570eec5d','MOJ-2024-0096','Louw v. Ndlovu','Property boundary dispute.',
    'Civil','Active','Medium','Uuyuni Louw','Francois Ndlovu',
    'Magistrate L. Shikongo','','2026-07-09','Bail application',adminId,'2025-03-15','2025-03-15');
  insertCase.run('61a4c281-1f5e-4b63-9d59-2f7f7d6dbad0','MOJ-2025-0097','Namibia v. Ndlovu','Property boundary dispute.',
    'Civil','Pending','Medium','FNB Namibia','Haihambo Ndlovu',
    'Magistrate L. Shikongo','','2026-06-15','Mediation session',adminId,'2025-05-16','2025-05-16');
  insertCase.run('deebf2d5-9fc8-4c72-83f8-99a95af2eb09','MOJ-2026-0098','Botha v. Nangolo','Workplace harassment.',
    'Labour','Closed','Medium','Angula Botha','Hamukwaya Nangolo',
    'Magistrate T. Amukoto','','2026-02-26','Cross-examination',adminId,'2026-05-09','2026-05-09');
  insertCase.run('7c6570ad-ec2e-4cf0-9ec5-5c8171d94345','MOJ-2023-0099','Amupolo v. Windhoek','Workplace harassment.',
    'Labour','Closed','High','Nghidinwa Amupolo','City of Windhoek',
    'Magistrate N. Nakale','','2023-09-09','Awaiting defendant response',adminId,'2023-02-25','2023-02-25');
  insertCase.run('2727d0ca-1114-425c-9ca1-e91af4255499','MOJ-2024-0100','Nghifindaka v. Niipare','Property boundary dispute.',
    'Civil','Pending','Medium','Nangolo Nghifindaka','Zanele Niipare',
    'Magistrate N. Nakale','','2026-08-16','Pre-trial conference',adminId,'2024-09-28','2024-09-28');
  insertCase.run('5a35365a-00ab-4a4a-9654-5d553691628d','MOJ-2024-0101','Sithole v. Mukuve','Partnership dissolution.',
    'Commercial','Active','Medium','Kapuka Sithole','Anna Mukuve',
    'Magistrate N. Nakale','','2026-09-26','Legal aid assessment',adminId,'2025-02-27','2025-02-27');
  insertCase.run('5575dc3c-8808-496e-bf8e-0797ee309650','MOJ-2024-0102','Plessis v. Iiyambo','Unfair dismissal claim.',
    'Labour','Open','Low','Mukuve du Plessis','Thandeka Iiyambo',
    'Magistrate T. Amukoto','','2026-06-26','Documentary evidence submission',adminId,'2024-08-09','2024-08-09');
  insertCase.run('c376ccea-652d-4e60-ba26-7cc405c6206d','MOJ-2025-0103','State v. Mwatotele','Contempt of court charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Palesa Mwatotele',
    'Magistrate N. Nakale','','2026-06-15','Settlement negotiations',adminId,'2026-04-14','2026-04-14');
  insertCase.run('84846cd1-e49d-47ea-b114-f167d84b4f3b','MOJ-2024-0104','State v. Tshabalala','Theft charge filed in Khomasdal.',
    'Criminal','Closed','High','State of Namibia','Iipumbu Tshabalala',
    'Magistrate P. Nghifindaka','','2024-06-28','Settlement negotiations',adminId,'2024-02-25','2024-02-25');
  insertCase.run('30966040-b9c2-4a90-bc3a-b26027bdec3c','MOJ-2026-0105','State v. Radebe','Armed robbery charge filed in Katutura.',
    'Criminal','Pending','Medium','State of Namibia','Petrus Radebe',
    'Magistrate L. Shikongo','','2026-08-20','Mediation session',adminId,'2026-03-11','2026-03-11');
  insertCase.run('0a7ff555-8985-4267-802e-b9f3be861330','MOJ-2024-0106','Haihambo v. Barnard','Partnership dissolution.',
    'Commercial','Open','Medium','Haimbodi Haihambo','Josef Barnard',
    'Magistrate L. Shikongo','','2026-10-15','Documentary evidence submission',adminId,'2025-01-17','2025-01-17');
  insertCase.run('4fd77a1e-09dd-4419-8895-8f364962e14b','MOJ-2023-0107','State v. Mukuve','Contravening by-law charge filed in Walvis Bay.',
    'Criminal','Open','Medium','State of Namibia','Amukoto Mukuve',
    'Magistrate L. Shikongo','','2026-08-10','Awaiting defendant response',adminId,'2023-02-11','2023-02-11');
  insertCase.run('0276e093-58ff-4a8a-94f9-fa6886b1102b','MOJ-2026-0108','Hamukwaya v. Barnard','Breach of supply contract.',
    'Commercial','Active','Medium','Mwatotele Hamukwaya','Hamukwaya Barnard',
    'Magistrate T. Amukoto','','2026-06-30','Legal aid assessment',adminId,'2026-04-21','2026-04-21');
  insertCase.run('8ae8a316-6166-464b-80fc-4033f09d6dda','MOJ-2023-0109','State v. Grobler','Theft charge filed in Windhoek.',
    'Criminal','Open','Medium','State of Namibia','Palesa Grobler',
    'Magistrate P. Nghifindaka','','2026-08-06','Final arguments',adminId,'2023-03-12','2023-03-12');
  insertCase.run('cf1ec854-8031-411b-982c-ab67a3c091ec','MOJ-2026-0110','Radebe v. Holdings','Breach of supply contract.',
    'Commercial','Open','Medium','Hamukwaya Radebe','TransNamib Holdings',
    'Magistrate N. Nakale','','2026-10-08','Judgment delivery',adminId,'2026-02-28','2026-02-28');
  insertCase.run('faa243d4-f412-4bdc-8894-1eed236dd59a','MOJ-2026-0111','State v. Merwe','Tax evasion charge filed in Walvis Bay.',
    'Criminal','Active','Low','State of Namibia','Ndapewa van der Merwe',
    'Magistrate S. Iipumbu','','2026-10-26','Pre-trial conference',adminId,'2026-04-20','2026-04-20');
  insertCase.run('10b34369-f579-462d-8295-ea45dcca8f27','MOJ-2026-0112','State v. Sithole','Driving under the influence charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Nghifikepunye Sithole',
    'Senior Magistrate J. Botha','','2026-06-24','Settlement negotiations',adminId,'2026-04-03','2026-04-03');
  insertCase.run('f878f3c7-e5df-4a82-8e2b-c21c96754730','MOJ-2023-0113','Agency v. Shilongo','Unpaid invoice dispute.',
    'Commercial','Closed','Medium','Namibia Revenue Agency','Haihambo Shilongo',
    'Magistrate S. Iipumbu','','2024-02-03','Sentencing hearing',adminId,'2023-06-20','2023-06-20');
  insertCase.run('367576da-646d-463d-905c-9b338d0d7070','MOJ-2025-0114','State v. Mahlangu','Vandalism charge filed in Rundu.',
    'Criminal','Open','Low','State of Namibia','Nangolo Mahlangu',
    'Magistrate R. Kauari','','2026-07-16','Bail application',adminId,'2025-04-12','2025-04-12');
  insertCase.run('26819996-4705-47fa-91c3-a600307e3105','MOJ-2023-0115','State v. Amupolo','Extortion charge filed in Oshakati.',
    'Criminal','Closed','High','State of Namibia','Shilongo Amupolo',
    'Senior Magistrate J. Botha','','2024-01-25','Final arguments',adminId,'2023-10-16','2023-10-16');
  insertCase.run('91fbabed-b29e-43c7-962f-48fc92e96787','MOJ-2025-0116','Mostert v. Jacobs','Domestic violence interdict matter.',
    'Family','Open','High','Danie Mostert','Shilongo Jacobs',
    'Magistrate T. Amukoto','','2026-11-10','Cross-examination',adminId,'2025-08-15','2025-08-15');
  insertCase.run('ff56e5de-4bd2-4a33-bbab-8bc9f238c6d5','MOJ-2023-0117','Windhoek v. Mwatotele','Eviction proceeding.',
    'Civil','Active','High','City of Windhoek','Angula Mwatotele',
    'Magistrate L. Shikongo','','2026-08-14','Witness testimony',adminId,'2023-07-08','2023-07-08');
  insertCase.run('60c94c5a-ee5c-407f-9547-a3e6e6caf87a','MOJ-2023-0118','Jacobs v. Merwe','Unfair dismissal claim.',
    'Labour','Closed','Medium','Nico Jacobs','Petrus van der Merwe',
    'Magistrate S. Iipumbu','','2023-09-14','Pre-trial conference',adminId,'2023-09-01','2023-09-01');
  insertCase.run('4b7547b4-430f-4994-9753-710a40d8d5b3','MOJ-2023-0119','Windhoek v. Shikongo','Debt recovery.',
    'Civil','Closed','High','Bank Windhoek','Palesa Shikongo',
    'Senior Magistrate J. Botha','','2023-11-09','Judgment delivery',adminId,'2023-09-25','2023-09-25');
  insertCase.run('b26793d3-e02d-4c90-b0e5-ae1678fc1220','MOJ-2023-0120','Louw v. Mukuve','Adoption proceeding matter.',
    'Family','Open','Medium','Palesa Louw','Kapuka Mukuve',
    'Magistrate T. Amukoto','','2026-09-08','Judgment delivery',adminId,'2023-12-14','2023-12-14');
  insertCase.run('3c4c29f1-aea2-458c-8fac-2e6625486713','MOJ-2024-0121','Mukuve v. Pretorius','Adoption proceeding matter.',
    'Family','Open','Medium','Shaanika Mukuve','Ndapewa Pretorius',
    'Magistrate S. Iipumbu','','2026-11-16','Bail application',adminId,'2025-05-10','2025-05-10');
  insertCase.run('0d138fa0-8f6b-463d-8bec-7cddc8d34fa6','MOJ-2023-0122','Haufiku v. Mokoena','Debt recovery.',
    'Civil','Pending','High','Mukuve Haufiku','Haihambo Mokoena',
    'Magistrate S. Iipumbu','','2026-11-20','Settlement negotiations',adminId,'2023-03-07','2023-03-07');
  insertCase.run('0491b6ef-285f-4acf-9194-8a5497d130ea','MOJ-2025-0123','State v. Khumalo','Fraud charge filed in Katutura.',
    'Criminal','Active','Medium','State of Namibia','Nomsa Khumalo',
    'Magistrate R. Kauari','','2026-10-04','Sentencing hearing',adminId,'2025-06-24','2025-06-24');
  insertCase.run('7c2d30c0-ad48-4a5b-9314-720712423083','MOJ-2023-0124','State v. Visser','Kidnapping charge filed in Rundu.',
    'Criminal','Closed','Medium','State of Namibia','Lerato Visser',
    'Magistrate R. Kauari','','2023-03-20','Pre-trial conference',adminId,'2023-07-12','2023-07-12');
  insertCase.run('609f40cb-7ecd-423f-b950-21bd2891b4fe','MOJ-2024-0125','Shaanika v. Amupolo','Wage dispute.',
    'Labour','Open','High','Amukoto Shaanika','Mukuve Amupolo',
    'Magistrate S. Iipumbu','','2026-08-01','Awaiting defendant response',adminId,'2025-01-03','2025-01-03');
  insertCase.run('6512bafa-aec8-4d5a-b9dc-0bcadc961356','MOJ-2024-0126','Haihambo v. Steyn','Debt recovery.',
    'Civil','Closed','High','Amukoto Haihambo','Niipare Steyn',
    'Magistrate P. Nghifindaka','','2025-04-29','Legal aid assessment',adminId,'2024-12-13','2024-12-13');
  insertCase.run('5b090094-79b1-4d87-95b0-6609d2fec4e6','MOJ-2024-0127','Sithole v. Nangolo','Property boundary dispute.',
    'Civil','Closed','Medium','Iipumbu Sithole','Nghidinwa Nangolo',
    'Magistrate A. Haihambo','','2024-09-03','Witness testimony',adminId,'2024-11-24','2024-11-24');
  insertCase.run('49fe6fab-10ed-4ac4-87a2-811c5b8eb7b7','MOJ-2024-0128','Dlamini v. Jacobs','Debt recovery.',
    'Civil','Active','Medium','Maria Dlamini','Haimbodi Jacobs',
    'Magistrate N. Nakale','','2026-07-28','Documentary evidence submission',adminId,'2025-04-29','2025-04-29');
  insertCase.run('a7ac68aa-5566-4a3c-aced-322af9a0b100','MOJ-2026-0129','State v. Mahlangu','Fraud charge filed in Windhoek.',
    'Criminal','Active','Medium','State of Namibia','Petrus Mahlangu',
    'Magistrate L. Shikongo','','2026-11-15','Legal aid assessment',adminId,'2026-01-26','2026-01-26');
  insertCase.run('765e4e6e-bd87-4620-a563-8813f4618dae','MOJ-2026-0130','State v. Louw','Reckless driving charge filed in Katutura.',
    'Criminal','Closed','High','State of Namibia','Thabo Louw',
    'Senior Magistrate J. Botha','','2026-01-21','Pre-trial conference',adminId,'2026-01-02','2026-01-02');
  insertCase.run('533ec35f-6f72-464c-9290-c1d6b517ebce','MOJ-2026-0131','State v. Kauari','Tax evasion charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Marlene Kauari',
    'Magistrate P. Nghifindaka','','2026-01-13','Bail application',adminId,'2026-02-01','2026-02-01');
  insertCase.run('a0bbaea9-caad-4ef7-9ff4-6bbdf034da53','MOJ-2026-0132','State v. Radebe','Driving under the influence charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Angula Radebe',
    'Magistrate R. Kauari','','2026-01-01','Bail application',adminId,'2026-04-20','2026-04-20');
  insertCase.run('12552c0e-5ae8-45b3-81f5-fbc7964bafeb','MOJ-2023-0133','Shikongo v. Louw','Divorce and child custody matter.',
    'Family','Open','Low','Iiyambo Shikongo','Josef Louw',
    'Magistrate N. Nakale','','2026-06-13','Settlement negotiations',adminId,'2023-08-29','2023-08-29');
  insertCase.run('94d044a6-be36-425d-9ff6-061ec2000f98','MOJ-2025-0134','State v. Botha','Public disturbance charge filed in Oshakati.',
    'Criminal','Active','Medium','State of Namibia','Thandeka Botha',
    'Magistrate T. Amukoto','','2026-08-26','Final arguments',adminId,'2025-10-25','2025-10-25');
  insertCase.run('b72276c2-386f-4a8b-80b9-ba8273a70a39','MOJ-2024-0135','Roux v. Steyn','Wage dispute.',
    'Labour','Closed','High','Nghidinwa le Roux','Johan Steyn',
    'Magistrate R. Kauari','','2024-02-02','Final arguments',adminId,'2024-03-10','2024-03-10');
  insertCase.run('7cf2a1ad-fc2e-4ba7-8492-2d6ac66f4e71','MOJ-2024-0136','State v. Botha','Vandalism charge filed in Rundu.',
    'Criminal','Active','Medium','State of Namibia','Sbu Botha',
    'Magistrate N. Nakale','','2026-10-01','Settlement negotiations',adminId,'2024-10-05','2024-10-05');
  insertCase.run('3963b21c-2171-48f1-bbfa-048e687a8984','MOJ-2025-0137','State v. Amukoto','Drug possession charge filed in Walvis Bay.',
    'Criminal','Closed','Medium','State of Namibia','Nghifikepunye Amukoto',
    'Magistrate A. Haihambo','','2025-07-08','Documentary evidence submission',adminId,'2026-02-14','2026-02-14');
  insertCase.run('2c27a588-1f0f-4ed7-9ddb-9bf740685efd','MOJ-2025-0138','State v. Mokoena','Drug possession charge filed in Walvis Bay.',
    'Criminal','Active','High','State of Namibia','Kobus Mokoena',
    'Magistrate S. Iipumbu','','2026-10-12','Expert witness testimony',adminId,'2026-02-13','2026-02-13');
  insertCase.run('edcd55b5-9e69-4cab-a4af-980d3a7f6f10','MOJ-2024-0139','Merwe v. Fourie','Debt recovery.',
    'Civil','Active','Low','Nangolo van der Merwe','Nghifikepunye Fourie',
    'Magistrate T. Amukoto','','2026-08-16','Legal aid assessment',adminId,'2024-12-04','2024-12-04');
  insertCase.run('0cbc779b-24b6-4cc6-b8fa-c6db2c921b32','MOJ-2023-0140','Mukuve v. Amukoto','Domestic violence interdict matter.',
    'Family','Pending','High','Nandi Mukuve','Iiyambo Amukoto',
    'Magistrate A. Haihambo','','2026-06-16','Awaiting defendant response',adminId,'2024-05-16','2024-05-16');
  insertCase.run('d64e6670-d1da-4c2d-9a56-b15ffe23b003','MOJ-2024-0141','State v. Kapuka','Public disturbance charge filed in Khomasdal.',
    'Criminal','Open','High','State of Namibia','Niipare Kapuka',
    'Magistrate L. Shikongo','','2026-08-01','Mediation session',adminId,'2024-02-04','2024-02-04');
  insertCase.run('2649399b-2741-4a3e-aec1-554fe5cd2e30','MOJ-2026-0142','State v. Pieterse','Unlawful possession of firearm charge filed in Katutura.',
    'Criminal','Pending','Medium','State of Namibia','Haufiku Pieterse',
    'Senior Magistrate J. Botha','','2026-09-23','Legal aid assessment',adminId,'2026-04-06','2026-04-06');
  insertCase.run('dd3ab66e-a032-4d07-931e-77323a06cae8','MOJ-2025-0143','Iiyambo v. Namibia','IP infringement.',
    'Commercial','Active','Medium','Eino Iiyambo','Telecom Namibia',
    'Magistrate P. Nghifindaka','','2026-07-19','Documentary evidence submission',adminId,'2025-01-14','2025-01-14');
  insertCase.run('c6d88a79-c30a-4680-98f0-6998d99bf955','MOJ-2025-0144','Merwe v. Haufiku','Workplace harassment.',
    'Labour','Open','Low','Francois van der Merwe','Pieter Haufiku',
    'Magistrate R. Kauari','','2026-09-25','Settlement negotiations',adminId,'2025-02-07','2025-02-07');
  insertCase.run('2273f628-4062-484c-bdf8-08b8937bd3d7','MOJ-2025-0145','State v. Tshabalala','Domestic violence charge filed in Katutura.',
    'Criminal','Pending','Medium','State of Namibia','Francois Tshabalala',
    'Magistrate A. Haihambo','','2026-11-12','Settlement negotiations',adminId,'2025-03-22','2025-03-22');
  insertCase.run('ef4759ef-4657-49d3-aafb-68f3037429b9','MOJ-2023-0146','Tshabalala v. Iiyambo','Personal injury claim.',
    'Civil','Closed','Medium','Nakale Tshabalala','Shikongo Iiyambo',
    'Magistrate P. Nghifindaka','','2023-01-14','Final arguments',adminId,'2023-09-10','2023-09-10');
  insertCase.run('0c929b63-f6f8-4431-ae88-b9a1f14afee8','MOJ-2023-0147','Windhoek v. Pieterse','Debt recovery.',
    'Civil','Active','High','Bank Windhoek','Kamati Pieterse',
    'Magistrate N. Nakale','','2026-10-27','Final arguments',adminId,'2023-07-29','2023-07-29');
  insertCase.run('4be82414-167b-42aa-8873-1404fff98209','MOJ-2025-0148','State v. Ndlovu','Domestic violence charge filed in Katutura.',
    'Criminal','Closed','Medium','State of Namibia','Andile Ndlovu',
    'Magistrate R. Kauari','','2026-04-12','Plea entry',adminId,'2025-09-15','2025-09-15');
  insertCase.run('2cb33504-59b4-42fb-8dc2-7ebf858ee686','MOJ-2024-0149','Louw v. Nghidinwa','Adoption proceeding matter.',
    'Family','Closed','Medium','Pieter Louw','Nomsa Nghidinwa',
    'Magistrate S. Iipumbu','','2024-05-25','Judgment delivery',adminId,'2025-04-03','2025-04-03');
  insertCase.run('8ed47613-b19f-4bc8-860f-a195b482c60c','MOJ-2025-0150','State v. Mwatotele','Trespassing charge filed in Oshakati.',
    'Criminal','Pending','Medium','State of Namibia','Kapuka Mwatotele',
    'Magistrate R. Kauari','','2026-11-08','Mediation session',adminId,'2025-12-04','2025-12-04');
  insertCase.run('c92e120a-33e8-4605-b9bd-e7e61ed511de','MOJ-2023-0151','State v. Shaanika','Tax evasion charge filed in Windhoek.',
    'Criminal','Open','Low','State of Namibia','Haimbodi Shaanika',
    'Magistrate A. Haihambo','','2026-10-26','Awaiting defendant response',adminId,'2023-04-18','2023-04-18');
  insertCase.run('960bdcbf-2b5e-40bd-bb01-c5b7030536e5','MOJ-2026-0152','Jacobs v. Amupolo','Debt recovery.',
    'Civil','Closed','Medium','Shaanika Jacobs','Lerato Amupolo',
    'Senior Magistrate J. Botha','','2026-03-18','Sentencing hearing',adminId,'2026-04-14','2026-04-14');
  insertCase.run('e9b98590-5075-42e7-855e-b62d58b50647','MOJ-2025-0153','State v. Iiyambo','Theft charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Amupolo Iiyambo',
    'Magistrate S. Iipumbu','','2026-09-04','Plea entry',adminId,'2025-03-08','2025-03-08');
  insertCase.run('761532b0-a03c-4012-8560-6b205d984cf2','MOJ-2023-0154','Kauari v. Fourie','Defamation suit.',
    'Civil','Active','Medium','Angula Kauari','Marlene Fourie',
    'Magistrate R. Kauari','','2026-08-15','Documentary evidence submission',adminId,'2023-01-26','2023-01-26');
  insertCase.run('514f49a8-e100-4f8f-b02d-39a77e1d2b62','MOJ-2025-0155','Dlamini v. Amukoto','Eviction proceeding.',
    'Civil','Closed','Medium','Nghifindaka Dlamini','Pieter Amukoto',
    'Senior Magistrate J. Botha','','2025-09-13','Judgment delivery',adminId,'2025-08-28','2025-08-28');
  insertCase.run('330d849b-99c0-4f91-a505-24166fb72b91','MOJ-2024-0156','Iipumbu v. Angula','Divorce and child custody matter.',
    'Family','Open','Low','Mwatotele Iipumbu','Palesa Angula',
    'Magistrate A. Haihambo','','2026-11-16','Cross-examination',adminId,'2024-11-01','2024-11-01');
  insertCase.run('2625fa61-3caa-4d41-a1d5-b216b0c11218','MOJ-2023-0157','Namibia v. Tshabalala','Commercial lease dispute.',
    'Commercial','Open','Medium','State of Namibia','Nomsa Tshabalala',
    'Magistrate S. Iipumbu','','2026-09-03','Final arguments',adminId,'2023-07-26','2023-07-26');
  insertCase.run('ef96d22d-5e99-4f69-9ab7-4e08f57edd2f','MOJ-2025-0158','State v. Shaanika','Theft charge filed in Katutura.',
    'Criminal','Active','High','State of Namibia','Mwatotele Shaanika',
    'Magistrate A. Haihambo','','2026-11-08','Settlement negotiations',adminId,'2026-05-22','2026-05-22');
  insertCase.run('f170a96d-8f2e-4d4c-a07c-638b99695dc6','MOJ-2025-0159','Shilongo v. Botha','Divorce and child custody matter.',
    'Family','Pending','Medium','Ndapewa Shilongo','Johan Botha',
    'Magistrate R. Kauari','','2026-10-10','Sentencing hearing',adminId,'2025-11-05','2025-11-05');
  insertCase.run('87756506-2180-45ca-b449-fd5e6c00b9c6','MOJ-2024-0160','Pretorius v. Shaanika','Domestic violence interdict matter.',
    'Family','Closed','High','Amupolo Pretorius','Anna Shaanika',
    'Senior Magistrate J. Botha','','2025-04-02','Mediation session',adminId,'2024-11-06','2024-11-06');
  insertCase.run('d406a06d-bf4d-4c83-a975-bd4f53602ac0','MOJ-2025-0161','Molefe v. Ndlovu','Guardianship dispute matter.',
    'Family','Pending','High','Josef Molefe','Mwatotele Ndlovu',
    'Magistrate A. Haihambo','','2026-06-06','Cross-examination',adminId,'2026-02-22','2026-02-22');
  insertCase.run('5b63e088-d30e-4736-96bc-f95a1d9ccd99','MOJ-2025-0162','State v. Khumalo','Drug possession charge filed in Windhoek.',
    'Criminal','Pending','High','State of Namibia','Nakale Khumalo',
    'Magistrate A. Haihambo','','2026-10-28','Awaiting defendant response',adminId,'2026-02-05','2026-02-05');
  insertCase.run('3b38a027-e26d-49a4-aefd-e7deb9c945f1','MOJ-2026-0163','State v. Niipare','Theft charge filed in Katutura.',
    'Criminal','Pending','High','State of Namibia','Nakale Niipare',
    'Magistrate R. Kauari','','2026-06-10','Settlement negotiations',adminId,'2026-03-04','2026-03-04');
  insertCase.run('7446f2f0-6752-4966-ae1c-5932c818f4cc','MOJ-2023-0164','Shilongo v. Plessis','Unfair dismissal claim.',
    'Labour','Active','High','Haimbodi Shilongo','Kauari du Plessis',
    'Magistrate R. Kauari','','2026-07-24','Plea entry',adminId,'2023-12-20','2023-12-20');
  insertCase.run('f84a1f1f-cdf4-4290-9d7b-918de55247fd','MOJ-2024-0165','Angula v. Angula','Domestic violence interdict matter.',
    'Family','Closed','High','Shikongo Angula','Petrus Angula',
    'Magistrate N. Nakale','','2024-03-29','Legal aid assessment',adminId,'2025-05-04','2025-05-04');
  insertCase.run('b1315dd9-dd52-4034-ba94-3506b814b353','MOJ-2025-0166','Roux v. Niipare','Retrenchment challenge.',
    'Labour','Open','Medium','Danie le Roux','Gerhard Niipare',
    'Magistrate A. Haihambo','','2026-07-29','Judgment delivery',adminId,'2025-06-02','2025-06-02');
  insertCase.run('fda634db-9e66-4c9e-8bd3-801b8224211a','MOJ-2025-0167','Shikongo v. Radebe','Wage dispute.',
    'Labour','Active','Medium','Uuyuni Shikongo','Ndapewa Radebe',
    'Magistrate A. Haihambo','','2026-11-22','Documentary evidence submission',adminId,'2025-10-21','2025-10-21');
  insertCase.run('9ce2099f-1b91-413e-ad29-344ca87ae425','MOJ-2025-0168','State v. Angula','Failure to appear charge filed in Oshakati.',
    'Criminal','Active','High','State of Namibia','Nomsa Angula',
    'Magistrate A. Haihambo','','2026-07-26','Postponed — date TBD',adminId,'2025-09-03','2025-09-03');
  insertCase.run('d3b03d4c-b422-46d8-b108-57fbb9539f06','MOJ-2023-0169','Windhoek v. Iipumbu','Property boundary dispute.',
    'Civil','Open','Low','Bank Windhoek','Nghidinwa Iipumbu',
    'Magistrate P. Nghifindaka','','2026-06-15','Awaiting defendant response',adminId,'2023-04-30','2023-04-30');
  insertCase.run('4a327544-aca0-450b-9d4c-0aa1c563fa38','MOJ-2024-0170','State v. Kapuka','Reckless driving charge filed in Khomasdal.',
    'Criminal','Pending','Medium','State of Namibia','Kauari Kapuka',
    'Magistrate N. Nakale','','2026-10-01','Awaiting defendant response',adminId,'2025-04-23','2025-04-23');
  insertCase.run('62237a9a-61fb-4399-82de-db5ed1ba6800','MOJ-2025-0171','Botha v. Kauari','Personal injury claim.',
    'Civil','Closed','Low','Kapuka Botha','Francois Kauari',
    'Magistrate T. Amukoto','','2025-04-29','Awaiting defendant response',adminId,'2025-10-21','2025-10-21');
  insertCase.run('03161aa7-668d-4b4f-9c89-6eb35f0c09b7','MOJ-2026-0172','Sithole v. Steyn','Retrenchment challenge.',
    'Labour','Open','Medium','Nangolo Sithole','Petrus Steyn',
    'Magistrate L. Shikongo','','2026-10-25','Witness testimony',adminId,'2026-03-18','2026-03-18');
  insertCase.run('b53caa9f-2a46-4d31-aba6-7acaba4ffcc8','MOJ-2026-0173','State v. Wyk','Breach of contract charge filed in Rundu.',
    'Criminal','Closed','High','State of Namibia','Lerato van Wyk',
    'Magistrate A. Haihambo','','2026-03-26','Sentencing hearing',adminId,'2026-01-29','2026-01-29');
  insertCase.run('049dc66a-570c-4c6f-86f2-c90c947de354','MOJ-2024-0174','State v. Visser','Money laundering charge filed in Rundu.',
    'Criminal','Closed','Medium','State of Namibia','Nomsa Visser',
    'Magistrate A. Haihambo','','2025-01-22','Pre-trial conference',adminId,'2024-12-11','2024-12-11');
  insertCase.run('0c4a47e8-7e90-4da2-93e4-dd03f46f7137','MOJ-2026-0175','Mthembu v. Louw','Guardianship dispute matter.',
    'Family','Open','High','Anna Mthembu','Sipho Louw',
    'Magistrate T. Amukoto','','2026-10-02','Mediation session',adminId,'2026-02-05','2026-02-05');
  insertCase.run('45e7f49c-4335-400a-9ad9-93c67392ec24','MOJ-2024-0176','Nkosi v. Niipare','Wage dispute.',
    'Labour','Closed','Medium','Nakale Nkosi','Josef Niipare',
    'Magistrate S. Iipumbu','','2025-01-05','Bail application',adminId,'2024-10-25','2024-10-25');
  insertCase.run('0bce3d71-66d6-487d-a2ba-6af5016f8f98','MOJ-2023-0177','Ndlovu v. Tshabalala','Discrimination complaint.',
    'Labour','Active','Medium','Shaanika Ndlovu','Palesa Tshabalala',
    'Magistrate N. Nakale','','2026-08-20','Awaiting defendant response',adminId,'2023-09-15','2023-09-15');
  insertCase.run('7e559901-6610-4c45-b0b5-af5ec39ac9b8','MOJ-2024-0178','Klerk v. Swanepoel','Wage dispute.',
    'Labour','Open','High','Kauari de Klerk','Hamukwaya Swanepoel',
    'Magistrate S. Iipumbu','','2026-10-20','Plea entry',adminId,'2024-12-25','2024-12-25');
  insertCase.run('99b6b08e-84f4-4fc5-817a-5e6d2c7210f7','MOJ-2023-0179','Iiyambo v. Kamati','Discrimination complaint.',
    'Labour','Pending','Medium','Andile Iiyambo','Nomsa Kamati',
    'Magistrate T. Amukoto','','2026-06-30','Expert witness testimony',adminId,'2023-10-16','2023-10-16');
  insertCase.run('6acbfa92-ef08-4add-a289-7ec5fd2a2e3d','MOJ-2024-0180','State v. Mokoena','Domestic violence charge filed in Walvis Bay.',
    'Criminal','Active','High','State of Namibia','Nghifindaka Mokoena',
    'Magistrate T. Amukoto','','2026-10-29','Awaiting defendant response',adminId,'2024-04-15','2024-04-15');
  insertCase.run('4cd57859-2d5e-43ed-aeb5-9608200b664e','MOJ-2024-0181','Louw v. Swanepoel','Commercial lease dispute.',
    'Commercial','Active','Low','Ndapewa Louw','Mukuve Swanepoel',
    'Senior Magistrate J. Botha','','2026-08-19','Awaiting defendant response',adminId,'2025-02-17','2025-02-17');
  insertCase.run('cd416231-fb84-4f76-9a14-3cf283eae89f','MOJ-2026-0182','Steyn v. Visser','Maintenance order matter.',
    'Family','Closed','Low','Johan Steyn','Haimbodi Visser',
    'Magistrate L. Shikongo','','2026-05-01','Expert witness testimony',adminId,'2026-01-18','2026-01-18');
  insertCase.run('0778406f-65c4-4f52-9f91-257c4cbd8687','MOJ-2026-0183','Pretorius v. Radebe','Divorce and child custody matter.',
    'Family','Active','High','Uuyuni Pretorius','Kamati Radebe',
    'Magistrate N. Nakale','','2026-11-18','Plea entry',adminId,'2026-01-21','2026-01-21');
  insertCase.run('a8960965-9f30-4eaa-9c27-7f98e617a9c4','MOJ-2026-0184','State v. Haufiku','Drug possession charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Shikongo Haufiku',
    'Magistrate L. Shikongo','','2026-03-18','Final arguments',adminId,'2026-01-06','2026-01-06');
  insertCase.run('78bd7e52-eb85-4826-b717-fbf51248b196','MOJ-2024-0185','Ltd v. Shaanika','Property boundary dispute.',
    'Civil','Active','Medium','NHE Ltd','Haimbodi Shaanika',
    'Magistrate R. Kauari','','2026-06-30','Bail application',adminId,'2024-04-06','2024-04-06');
  insertCase.run('78080b66-4122-4aed-959a-88fbf2a08e23','MOJ-2023-0186','State v. Plessis','Assault (common) charge filed in Walvis Bay.',
    'Criminal','Pending','Low','State of Namibia','Marlene du Plessis',
    'Senior Magistrate J. Botha','','2026-06-14','Pre-trial conference',adminId,'2023-12-11','2023-12-11');
  insertCase.run('27dfa058-fb23-4d0f-97a0-be96414c874a','MOJ-2026-0187','Kamati v. Kamati','Eviction proceeding.',
    'Civil','Pending','Medium','Kapuka Kamati','Anna Kamati',
    'Magistrate L. Shikongo','','2026-08-15','Mediation session',adminId,'2026-05-09','2026-05-09');
  insertCase.run('9a138972-3276-46cd-b0af-5412f32aeeca','MOJ-2025-0188','Bay v. Visser','Debt recovery.',
    'Civil','Active','Medium','City of Walvis Bay','Mukuve Visser',
    'Magistrate P. Nghifindaka','','2026-08-11','Plea entry',adminId,'2025-06-03','2025-06-03');
  insertCase.run('2da8b32e-db70-49dd-8edb-7b3f2a816f4f','MOJ-2025-0189','Angula v. Barnard','Unpaid invoice dispute.',
    'Commercial','Closed','Medium','Haufiku Angula','Sifiso Barnard',
    'Magistrate N. Nakale','','2025-06-03','Plea entry',adminId,'2025-03-18','2025-03-18');
  insertCase.run('84fd609f-8af7-4b94-ba64-28cfa73dc902','MOJ-2023-0190','Amupolo v. Angula','Unpaid invoice dispute.',
    'Commercial','Active','Medium','Pieter Amupolo','Pieter Angula',
    'Magistrate N. Nakale','','2026-07-24','Sentencing hearing',adminId,'2023-05-11','2023-05-11');
  insertCase.run('80d674d7-797d-4ba5-84fe-26d545a01a62','MOJ-2026-0191','State v. Swanepoel','Unlawful termination of employment charge filed in Khomasdal.',
    'Criminal','Closed','Low','State of Namibia','Kauari Swanepoel',
    'Magistrate P. Nghifindaka','','2026-02-25','Final arguments',adminId,'2026-05-24','2026-05-24');
  insertCase.run('d74afe6a-cbbd-4565-8120-8cf6d315bb31','MOJ-2023-0192','Mthembu v. Grobler','Defamation suit.',
    'Civil','Open','Low','Ndapewa Mthembu','Iipumbu Grobler',
    'Senior Magistrate J. Botha','','2026-11-03','Expert witness testimony',adminId,'2023-05-05','2023-05-05');
  insertCase.run('df889698-b2c8-4e8d-bd06-a100b554f8e0','MOJ-2026-0193','Haihambo v. Holdings','Retrenchment challenge.',
    'Labour','Pending','Medium','Nghifindaka Haihambo','TransNamib Holdings',
    'Magistrate A. Haihambo','','2026-10-11','Bail application',adminId,'2026-04-03','2026-04-03');
  insertCase.run('3fdf7c60-e5dc-4caa-aab1-ebd9ec471c39','MOJ-2025-0194','Louw v. Hamukwaya','Eviction proceeding.',
    'Civil','Active','Medium','Thabo Louw','Iipumbu Hamukwaya',
    'Magistrate N. Nakale','','2026-07-28','Witness testimony',adminId,'2025-10-16','2025-10-16');
  insertCase.run('026b47da-d680-4121-81f5-a414969b2de6','MOJ-2024-0195','Haufiku v. Louw','Debt recovery.',
    'Civil','Active','Medium','Kamati Haufiku','Petrus Louw',
    'Magistrate N. Nakale','','2026-08-03','Pre-trial conference',adminId,'2025-03-02','2025-03-02');
  insertCase.run('7b560c70-2e33-4206-9486-deca8ba234c8','MOJ-2026-0196','Angula v. Nangolo','Unfair dismissal claim.',
    'Labour','Open','Medium','Francois Angula','Andile Nangolo',
    'Magistrate R. Kauari','','2026-10-05','Mediation session',adminId,'2026-05-20','2026-05-20');
  insertCase.run('4a16dd39-596e-4caf-a123-6e2bda1a8d1c','MOJ-2023-0197','State v. Pieterse','Perjury charge filed in Katutura.',
    'Criminal','Closed','Low','State of Namibia','Sifiso Pieterse',
    'Magistrate N. Nakale','','2023-11-19','Mediation session',adminId,'2024-03-07','2024-03-07');
  insertCase.run('1ada32f0-dbf6-4f1b-af54-0c20a215557e','MOJ-2026-0198','Kauari v. Dlamini','Adoption proceeding matter.',
    'Family','Open','High','Iipumbu Kauari','Sipho Dlamini',
    'Senior Magistrate J. Botha','','2026-10-16','Witness testimony',adminId,'2026-01-02','2026-01-02');
  insertCase.run('f0e8a2c6-379b-4eaa-b6a9-9f48fc597c0c','MOJ-2025-0199','Coetzee v. Nangolo','Defamation suit.',
    'Civil','Open','High','Marlene Coetzee','Angula Nangolo',
    'Magistrate R. Kauari','','2026-06-26','Documentary evidence submission',adminId,'2026-04-16','2026-04-16');
  insertCase.run('789ed2b7-7c7d-4b71-8bd6-595a166fe1ba','MOJ-2025-0200','Niipare v. Barnard','Property boundary dispute.',
    'Civil','Closed','High','Marlene Niipare','Sifiso Barnard',
    'Magistrate T. Amukoto','','2025-07-27','Legal aid assessment',adminId,'2026-05-07','2026-05-07');
  insertCase.run('9b668e6a-8ad9-457d-afc3-f6f0c5df1bec','MOJ-2023-0201','State v. Nkosi','Perjury charge filed in Katutura.',
    'Criminal','Active','High','State of Namibia','Iiyambo Nkosi',
    'Magistrate N. Nakale','','2026-06-16','Judgment delivery',adminId,'2023-09-01','2023-09-01');
  insertCase.run('c5886d79-06e5-4c85-bd31-86752a7cf27d','MOJ-2026-0202','Mostert v. Pieterse','Domestic violence interdict matter.',
    'Family','Pending','Low','Kauari Mostert','Johan Pieterse',
    'Magistrate L. Shikongo','','2026-10-25','Sentencing hearing',adminId,'2026-02-24','2026-02-24');
  insertCase.run('ee19f97f-3c11-4b5f-ab94-40f062090355','MOJ-2023-0203','State v. Merwe','Kidnapping charge filed in Walvis Bay.',
    'Criminal','Closed','Medium','State of Namibia','Haufiku van der Merwe',
    'Magistrate L. Shikongo','','2023-03-15','Sentencing hearing',adminId,'2023-10-28','2023-10-28');
  insertCase.run('f7baa56e-702c-4add-bd51-e9b44da85983','MOJ-2024-0204','Wyk v. Shilongo','Defamation suit.',
    'Civil','Pending','High','Shaanika van Wyk','Pieter Shilongo',
    'Magistrate S. Iipumbu','','2026-07-07','Plea entry',adminId,'2025-01-21','2025-01-21');
  insertCase.run('ed44945b-5f0d-45f7-8a0c-fd291fa351a0','MOJ-2023-0205','State v. Amukoto','Vandalism charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Nangolo Amukoto',
    'Magistrate T. Amukoto','','2026-11-06','Legal aid assessment',adminId,'2023-11-06','2023-11-06');
  insertCase.run('a6c69489-3150-4eb7-b608-fe54878ec38e','MOJ-2025-0206','Visser v. Shikongo','Unfair dismissal claim.',
    'Labour','Active','Medium','Nghifikepunye Visser','Hamukwaya Shikongo',
    'Magistrate S. Iipumbu','','2026-09-06','Judgment delivery',adminId,'2026-04-27','2026-04-27');
  insertCase.run('ce4354f1-c04a-4d2f-851c-bb24604307e9','MOJ-2024-0207','State v. Plessis','Possession of stolen goods charge filed in Khomasdal.',
    'Criminal','Open','Medium','State of Namibia','Nico du Plessis',
    'Magistrate R. Kauari','','2026-11-11','Plea entry',adminId,'2024-12-30','2024-12-30');
  insertCase.run('d6413b22-6e07-4f0f-866f-58fd7b63fe4a','MOJ-2025-0208','State v. Pretorius','Assault (grievous bodily harm) charge filed in Katutura.',
    'Criminal','Open','Low','State of Namibia','Zanele Pretorius',
    'Magistrate A. Haihambo','','2026-08-10','Cross-examination',adminId,'2025-07-04','2025-07-04');
  insertCase.run('551fefb4-28d5-44f2-9d1b-1a7b7aaaaaa0','MOJ-2026-0209','Mokoena v. Shikongo','Unfair dismissal claim.',
    'Labour','Pending','High','Iipumbu Mokoena','Anna Shikongo',
    'Magistrate T. Amukoto','','2026-08-31','Witness testimony',adminId,'2026-01-23','2026-01-23');
  insertCase.run('27f1e2cd-1fca-4a37-8954-4a5b204d592b','MOJ-2025-0210','Pretorius v. Nakale','Unpaid invoice dispute.',
    'Commercial','Active','Low','Lerato Pretorius','Kobus Nakale',
    'Magistrate P. Nghifindaka','','2026-07-15','Pre-trial conference',adminId,'2025-09-24','2025-09-24');
  insertCase.run('0f953a1d-a118-42e2-abb7-2abe80883d40','MOJ-2026-0211','Wyk v. Nakale','Eviction proceeding.',
    'Civil','Active','Medium','Marlene van Wyk','Iiyambo Nakale',
    'Senior Magistrate J. Botha','','2026-09-02','Final arguments',adminId,'2026-01-20','2026-01-20');
  insertCase.run('5b8e1c54-a3b1-4f87-8fb6-909ea481124a','MOJ-2023-0212','State v. Molefe','Breach of contract charge filed in Khomasdal.',
    'Criminal','Active','Low','State of Namibia','Eino Molefe',
    'Magistrate N. Nakale','','2026-11-07','Legal aid assessment',adminId,'2024-03-06','2024-03-06');
  insertCase.run('4a657986-32a8-4cfa-a533-177e72ffb753','MOJ-2024-0213','Plessis v. Nghidinwa','Debt recovery.',
    'Civil','Active','Medium','Palesa du Plessis','Shaanika Nghidinwa',
    'Senior Magistrate J. Botha','','2026-09-11','Legal aid assessment',adminId,'2024-03-31','2024-03-31');
  insertCase.run('6b7e8038-7ec3-4292-b00b-c8aa37762d07','MOJ-2024-0214','Hamukwaya v. Visser','Adoption proceeding matter.',
    'Family','Active','Medium','Nomsa Hamukwaya','Uuyuni Visser',
    'Magistrate N. Nakale','','2026-10-24','Legal aid assessment',adminId,'2024-02-28','2024-02-28');
  insertCase.run('821e1184-669b-48ae-9e25-d755d98c9142','MOJ-2026-0215','Barnard v. Louw','Personal injury claim.',
    'Civil','Active','Medium','Iiyambo Barnard','Marlene Louw',
    'Magistrate T. Amukoto','','2026-11-21','Settlement negotiations',adminId,'2026-04-15','2026-04-15');
  insertCase.run('0b064592-7d49-4346-9e6f-99c203bff84e','MOJ-2026-0216','State v. Botha','Arson charge filed in Khomasdal.',
    'Criminal','Active','High','State of Namibia','Uuyuni Botha',
    'Magistrate N. Nakale','','2026-09-17','Judgment delivery',adminId,'2026-05-10','2026-05-10');
  insertCase.run('68cfc081-65b6-4a02-ab42-e66199d1a88d','MOJ-2023-0217','State v. Kamati','Tax evasion charge filed in Rundu.',
    'Criminal','Closed','Medium','State of Namibia','Johan Kamati',
    'Magistrate S. Iipumbu','','2023-11-10','Mediation session',adminId,'2023-11-28','2023-11-28');
  insertCase.run('f0048884-b37a-4a26-9c7c-3d62f28043a9','MOJ-2025-0218','Hamukwaya v. Amupolo','Partnership dissolution.',
    'Commercial','Open','Low','Iipumbu Hamukwaya','Sifiso Amupolo',
    'Magistrate T. Amukoto','','2026-10-10','Bail application',adminId,'2025-04-24','2025-04-24');
  insertCase.run('9390e387-8cb6-4b28-b2c5-597baae50ea8','MOJ-2026-0219','Kauari v. Ndlovu','Wage dispute.',
    'Labour','Closed','Medium','Palesa Kauari','Pieter Ndlovu',
    'Magistrate S. Iipumbu','','2026-01-27','Witness testimony',adminId,'2026-05-04','2026-05-04');
  insertCase.run('91cf984f-8be6-4b11-a1b6-149bb14257b3','MOJ-2025-0220','Wyk v. Pieterse','Workplace harassment.',
    'Labour','Closed','Medium','Amukoto van Wyk','Anna Pieterse',
    'Senior Magistrate J. Botha','','2025-02-19','Legal aid assessment',adminId,'2025-09-01','2025-09-01');
  insertCase.run('78a627ac-d896-458c-abf4-187d67c1776f','MOJ-2023-0221','State v. Mthembu','Domestic violence charge filed in Katutura.',
    'Criminal','Closed','Medium','State of Namibia','Mukuve Mthembu',
    'Magistrate T. Amukoto','','2023-03-26','Awaiting defendant response',adminId,'2024-02-14','2024-02-14');
  insertCase.run('18092971-5752-4af4-b75c-fc0d445632ba','MOJ-2026-0222','Plessis v. Amupolo','Discrimination complaint.',
    'Labour','Open','High','Thabo du Plessis','Nomsa Amupolo',
    'Magistrate R. Kauari','','2026-09-11','Mediation session',adminId,'2026-04-21','2026-04-21');
  insertCase.run('0384418a-1d1a-45f0-9023-c57bf324d97e','MOJ-2026-0223','Agency v. Windhoek','Unpaid invoice dispute.',
    'Commercial','Open','Medium','Namibia Revenue Agency','Bank Windhoek',
    'Magistrate P. Nghifindaka','','2026-10-27','Bail application',adminId,'2026-01-17','2026-01-17');
  insertCase.run('092d6e74-149d-40c8-90d3-a83eb95a37b4','MOJ-2026-0224','State v. Hamukwaya','Theft charge filed in Khomasdal.',
    'Criminal','Active','High','State of Namibia','Ndapewa Hamukwaya',
    'Magistrate S. Iipumbu','','2026-11-05','Pre-trial conference',adminId,'2026-04-10','2026-04-10');
  insertCase.run('f249afda-b61c-4104-8134-2fe630a59ee7','MOJ-2026-0225','State v. Mthembu','Contempt of court charge filed in Windhoek.',
    'Criminal','Closed','Medium','State of Namibia','Riaan Mthembu',
    'Magistrate T. Amukoto','','2026-03-22','Awaiting defendant response',adminId,'2026-02-04','2026-02-04');
  insertCase.run('1b67d20e-ddd9-4eda-8fe3-02d7503716e3','MOJ-2024-0226','Kapuka v. Iiyambo','Unpaid invoice dispute.',
    'Commercial','Active','Medium','Shaanika Kapuka','Francois Iiyambo',
    'Magistrate N. Nakale','','2026-10-04','Plea entry',adminId,'2024-04-05','2024-04-05');
  insertCase.run('9058a172-a3ab-4346-87a8-0d8c3ae8423e','MOJ-2024-0227','Nakale v. Coetzee','Guardianship dispute matter.',
    'Family','Closed','High','Sipho Nakale','Thandeka Coetzee',
    'Magistrate L. Shikongo','','2025-05-02','Settlement negotiations',adminId,'2024-07-02','2024-07-02');
  insertCase.run('cb67f22c-501c-49d5-9e97-bf7d18921cc6','MOJ-2026-0228','Bay v. Holdings','Partnership dissolution.',
    'Commercial','Closed','High','City of Walvis Bay','NamPower Holdings',
    'Magistrate N. Nakale','','2026-05-06','Postponed — date TBD',adminId,'2026-04-24','2026-04-24');
  insertCase.run('6d511fd1-7d90-4d95-931d-64d15a34aa73','MOJ-2024-0229','Roux v. Tshabalala','Eviction proceeding.',
    'Civil','Open','High','Kobus le Roux','Uuyuni Tshabalala',
    'Senior Magistrate J. Botha','','2026-06-30','Judgment delivery',adminId,'2024-09-18','2024-09-18');
  insertCase.run('62d8cda2-52ec-474e-8fb0-9abd7fd0d1bb','MOJ-2023-0230','Mthembu v. Amupolo','Workplace harassment.',
    'Labour','Pending','Medium','Haufiku Mthembu','Johan Amupolo',
    'Magistrate N. Nakale','','2026-11-16','Documentary evidence submission',adminId,'2024-01-12','2024-01-12');
  insertCase.run('33e74b2b-9ad4-411c-94f1-58fd8aa926e5','MOJ-2025-0231','State v. Radebe','Unlawful termination of employment charge filed in Rundu.',
    'Criminal','Active','Low','State of Namibia','Shaanika Radebe',
    'Magistrate P. Nghifindaka','','2026-10-30','Sentencing hearing',adminId,'2026-02-20','2026-02-20');
  insertCase.run('455a9a45-f9d5-4ae6-96c9-9a87d4873316','MOJ-2024-0232','State v. Angula','Failure to appear charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Maria Angula',
    'Magistrate P. Nghifindaka','','2024-10-18','Final arguments',adminId,'2024-01-31','2024-01-31');
  insertCase.run('663a3957-0cc2-44e9-9c0a-ada7b63457a8','MOJ-2025-0233','Kapuka v. Niipare','Personal injury claim.',
    'Civil','Pending','Medium','Kobus Kapuka','Thandeka Niipare',
    'Magistrate T. Amukoto','','2026-09-15','Mediation session',adminId,'2026-05-08','2026-05-08');
  insertCase.run('57c86d40-7c4d-4ee0-9959-0b2c2794c555','MOJ-2024-0234','State v. Nakale','Fraud charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Ndapewa Nakale',
    'Magistrate P. Nghifindaka','','2024-12-12','Final arguments',adminId,'2025-03-07','2025-03-07');
  insertCase.run('3906a625-97fc-42ec-b30f-66d7b886d2f8','MOJ-2026-0235','Haihambo v. Hamukwaya','Breach of supply contract.',
    'Commercial','Active','Low','Josef Haihambo','Anna Hamukwaya',
    'Magistrate T. Amukoto','','2026-08-12','Plea entry',adminId,'2026-05-12','2026-05-12');
  insertCase.run('4f330312-273d-4d9d-866e-1130e20476cf','MOJ-2023-0236','Nghifindaka v. Mostert','Workplace harassment.',
    'Labour','Closed','Medium','Gerhard Nghifindaka','Nghifindaka Mostert',
    'Magistrate T. Amukoto','','2023-07-23','Final arguments',adminId,'2023-10-01','2023-10-01');
  insertCase.run('52d783a7-fd40-480b-8618-f88b15c31606','MOJ-2024-0237','Dlamini v. Finance','Retrenchment challenge.',
    'Labour','Closed','Medium','Shikongo Dlamini','Ministry of Finance',
    'Magistrate L. Shikongo','','2024-11-16','Witness testimony',adminId,'2024-02-20','2024-02-20');
  insertCase.run('86d6a342-f010-4833-bc79-ddad0741e857','MOJ-2024-0238','State v. Mokoena','Tax evasion charge filed in Khomasdal.',
    'Criminal','Closed','Medium','State of Namibia','Kobus Mokoena',
    'Magistrate R. Kauari','','2025-03-24','Settlement negotiations',adminId,'2025-04-22','2025-04-22');
  insertCase.run('88d5d47f-c1ba-464a-aa75-4ddb8c413938','MOJ-2025-0239','State v. Kapuka','Assault (grievous bodily harm) charge filed in Rundu.',
    'Criminal','Open','High','State of Namibia','Nghifikepunye Kapuka',
    'Magistrate A. Haihambo','','2026-07-31','Postponed — date TBD',adminId,'2025-12-25','2025-12-25');
  insertCase.run('dec767ee-1ddb-44ef-813f-bdef95861c5e','MOJ-2023-0240','State v. Haufiku','Breach of contract charge filed in Windhoek.',
    'Criminal','Open','High','State of Namibia','Haihambo Haufiku',
    'Magistrate T. Amukoto','','2026-07-29','Mediation session',adminId,'2023-10-31','2023-10-31');
  insertCase.run('d6e7a0d2-7e1c-4629-9ebb-140646e4e844','MOJ-2023-0241','Khumalo v. Mokoena','Divorce and child custody matter.',
    'Family','Closed','Low','Nandi Khumalo','Eino Mokoena',
    'Magistrate N. Nakale','','2023-09-02','Postponed — date TBD',adminId,'2023-03-09','2023-03-09');
  insertCase.run('f57cc999-20e8-4542-bb53-8cd8a799aa1d','MOJ-2025-0242','Agency v. Nkosi','Eviction proceeding.',
    'Civil','Open','High','Namibia Revenue Agency','Nakale Nkosi',
    'Magistrate R. Kauari','','2026-11-22','Awaiting defendant response',adminId,'2026-05-24','2026-05-24');
  insertCase.run('001195c6-32a2-4604-904e-2de9970bd026','MOJ-2024-0243','Amupolo v. Sithole','Wage dispute.',
    'Labour','Active','Medium','Mwatotele Amupolo','Pieter Sithole',
    'Magistrate R. Kauari','','2026-11-06','Expert witness testimony',adminId,'2024-07-29','2024-07-29');
  insertCase.run('03308cfa-f1bf-4561-9a75-c78320e8b90b','MOJ-2026-0244','Mthembu v. Mwatotele','Adoption proceeding matter.',
    'Family','Active','Medium','Pieter Mthembu','Iipumbu Mwatotele',
    'Magistrate R. Kauari','','2026-11-14','Sentencing hearing',adminId,'2026-03-12','2026-03-12');
  insertCase.run('5f62a035-5aa6-4079-b783-9e2fbcbb54e1','MOJ-2023-0245','Nakale v. Ndlovu','Personal injury claim.',
    'Civil','Open','Medium','Marlene Nakale','Eino Ndlovu',
    'Magistrate N. Nakale','','2026-06-15','Bail application',adminId,'2023-11-27','2023-11-27');
  insertCase.run('baac4b00-1197-4361-82d0-f313ddbf47b9','MOJ-2026-0246','State v. Kamati','Contravening by-law charge filed in Khomasdal.',
    'Criminal','Pending','Low','State of Namibia','Eino Kamati',
    'Magistrate S. Iipumbu','','2026-07-05','Expert witness testimony',adminId,'2026-03-23','2026-03-23');
  insertCase.run('d787baa6-d102-4d69-b984-7108ed003aac','MOJ-2024-0247','Swanepoel v. Namibia','Retrenchment challenge.',
    'Labour','Closed','Low','Sbu Swanepoel','State of Namibia',
    'Magistrate L. Shikongo','','2024-01-08','Pre-trial conference',adminId,'2024-02-04','2024-02-04');
  insertCase.run('21b61cac-9fdd-4c9f-a329-7a38a10216d2','MOJ-2026-0248','Mokoena v. Swanepoel','Unpaid invoice dispute.',
    'Commercial','Closed','High','Kobus Mokoena','Amupolo Swanepoel',
    'Magistrate T. Amukoto','','2026-05-18','Awaiting defendant response',adminId,'2026-05-18','2026-05-18');
  insertCase.run('9217d02a-2e68-4c55-9284-40a7489090fb','MOJ-2023-0249','Haihambo v. Mwatotele','Property boundary dispute.',
    'Civil','Closed','High','Riaan Haihambo','Angula Mwatotele',
    'Magistrate P. Nghifindaka','','2023-02-14','Witness testimony',adminId,'2023-05-06','2023-05-06');
  insertCase.run('7be2c655-6eab-4fb7-87a8-ea12b4d5be31','MOJ-2024-0250','State v. Nangolo','Arson charge filed in Rundu.',
    'Criminal','Open','Medium','State of Namibia','Haihambo Nangolo',
    'Magistrate L. Shikongo','','2026-08-29','Mediation session',adminId,'2024-09-11','2024-09-11');
  insertCase.run('bbb9326b-c2f3-4894-8c7c-8d38b006c948','MOJ-2025-0251','State v. Dlamini','Trespassing charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Niipare Dlamini',
    'Magistrate A. Haihambo','','2026-07-02','Postponed — date TBD',adminId,'2026-03-30','2026-03-30');
  insertCase.run('6df8e1a2-84d6-4e2b-890b-76c1c64e40c1','MOJ-2023-0252','Bay v. Tshabalala','Personal injury claim.',
    'Civil','Closed','Low','City of Walvis Bay','Lerato Tshabalala',
    'Senior Magistrate J. Botha','','2023-07-04','Cross-examination',adminId,'2023-09-19','2023-09-19');
  insertCase.run('66ba5629-b9c1-45d9-8dea-29ce9a00b50c','MOJ-2023-0253','State v. Botha','Land dispute charge filed in Khomasdal.',
    'Criminal','Open','Low','State of Namibia','Marlene Botha',
    'Magistrate L. Shikongo','','2026-06-05','Settlement negotiations',adminId,'2024-03-17','2024-03-17');
  insertCase.run('fcb3eb75-4e94-47c8-954b-82cd7303f317','MOJ-2026-0254','State v. Wyk','Trespassing charge filed in Khomasdal.',
    'Criminal','Open','Low','State of Namibia','Haimbodi van Wyk',
    'Magistrate N. Nakale','','2026-08-04','Sentencing hearing',adminId,'2026-03-24','2026-03-24');
  insertCase.run('d5c11914-6267-4f97-9672-cea372bc403b','MOJ-2023-0255','Amukoto v. Haihambo','Domestic violence interdict matter.',
    'Family','Open','Low','Johan Amukoto','Nandi Haihambo',
    'Magistrate R. Kauari','','2026-10-12','Sentencing hearing',adminId,'2024-02-16','2024-02-16');
  insertCase.run('2e73b6a6-bc7a-456e-ae38-f4a19cde60fa','MOJ-2025-0256','Barnard v. Shaanika','Maintenance order matter.',
    'Family','Open','High','Nakale Barnard','Mukuve Shaanika',
    'Magistrate L. Shikongo','','2026-08-15','Legal aid assessment',adminId,'2025-04-13','2025-04-13');
  insertCase.run('4cd0958c-ce82-4dfa-8776-aeb0e586f41b','MOJ-2026-0257','Nkosi v. Dlamini','Maintenance order matter.',
    'Family','Pending','High','Nico Nkosi','Haimbodi Dlamini',
    'Magistrate P. Nghifindaka','','2026-08-03','Postponed — date TBD',adminId,'2026-05-20','2026-05-20');
  insertCase.run('56daf99c-aaf6-4391-a1bd-dc20f10800c2','MOJ-2025-0258','State v. Swanepoel','Domestic violence charge filed in Katutura.',
    'Criminal','Active','Low','State of Namibia','Zanele Swanepoel',
    'Magistrate N. Nakale','','2026-08-19','Settlement negotiations',adminId,'2026-01-13','2026-01-13');
  insertCase.run('563a81bd-f88a-4af0-b8cc-ecc878d46581','MOJ-2024-0259','Haihambo v. Mokoena','Eviction proceeding.',
    'Civil','Open','Low','Josef Haihambo','Mukuve Mokoena',
    'Magistrate P. Nghifindaka','','2026-10-13','Expert witness testimony',adminId,'2025-03-08','2025-03-08');
  insertCase.run('b164226b-931e-4ff8-bb70-c9464ba76999','MOJ-2023-0260','State v. Mukuve','Fraud charge filed in Katutura.',
    'Criminal','Closed','High','State of Namibia','Nghifikepunye Mukuve',
    'Magistrate T. Amukoto','','2023-02-01','Pre-trial conference',adminId,'2023-10-18','2023-10-18');
  insertCase.run('cdf89ac9-1944-42be-9f92-84d84ac1ca19','MOJ-2025-0261','Holdings v. Bay','Breach of supply contract.',
    'Commercial','Closed','Medium','NamPower Holdings','City of Walvis Bay',
    'Magistrate S. Iipumbu','','2025-04-30','Cross-examination',adminId,'2025-05-20','2025-05-20');
  insertCase.run('c6e3eafc-2f0e-4d56-8235-c060b485dbc3','MOJ-2024-0262','Swanepoel v. Louw','Unfair dismissal claim.',
    'Labour','Active','Medium','Niipare Swanepoel','Shikongo Louw',
    'Magistrate N. Nakale','','2026-09-01','Documentary evidence submission',adminId,'2024-10-01','2024-10-01');
  insertCase.run('00ef271c-a459-4353-bb73-9d4a2201e280','MOJ-2025-0263','State v. Amukoto','Domestic violence charge filed in Windhoek.',
    'Criminal','Open','Medium','State of Namibia','Maria Amukoto',
    'Magistrate R. Kauari','','2026-08-04','Documentary evidence submission',adminId,'2025-12-31','2025-12-31');
  insertCase.run('39b5244f-1418-4cfa-aeeb-538bfcc7e058','MOJ-2025-0264','Mthembu v. Haihambo','Property boundary dispute.',
    'Civil','Closed','Medium','Iipumbu Mthembu','Zanele Haihambo',
    'Magistrate L. Shikongo','','2025-08-20','Plea entry',adminId,'2026-03-14','2026-03-14');
  insertCase.run('855f7120-494e-4e0f-9753-fc9f8a51c576','MOJ-2023-0265','State v. Haufiku','Tax evasion charge filed in Rundu.',
    'Criminal','Open','Medium','State of Namibia','Josef Haufiku',
    'Magistrate R. Kauari','','2026-09-12','Sentencing hearing',adminId,'2024-02-26','2024-02-26');
  insertCase.run('38e10c6e-1454-4be8-9233-0eeea3b06127','MOJ-2023-0266','Mokoena v. Ndlovu','Property boundary dispute.',
    'Civil','Closed','Low','Thandeka Mokoena','Petrus Ndlovu',
    'Magistrate L. Shikongo','','2024-04-07','Documentary evidence submission',adminId,'2023-04-12','2023-04-12');
  insertCase.run('715e5dd9-5acc-4aea-a520-b76753af7134','MOJ-2024-0267','Swanepoel v. Mostert','IP infringement.',
    'Commercial','Closed','High','Maria Swanepoel','Kobus Mostert',
    'Senior Magistrate J. Botha','','2024-12-15','Witness testimony',adminId,'2024-07-14','2024-07-14');
  insertCase.run('8acacace-c536-4f0f-b52f-2f63c5943673','MOJ-2024-0268','Coetzee v. Nangolo','Personal injury claim.',
    'Civil','Active','High','Haimbodi Coetzee','Kamati Nangolo',
    'Senior Magistrate J. Botha','','2026-08-12','Witness testimony',adminId,'2024-02-14','2024-02-14');
  insertCase.run('1af6880b-c3b5-45bb-a4e5-80b5b9378551','MOJ-2023-0269','Shilongo v. Visser','Breach of supply contract.',
    'Commercial','Closed','Medium','Nakale Shilongo','Kobus Visser',
    'Senior Magistrate J. Botha','','2023-09-06','Judgment delivery',adminId,'2024-02-05','2024-02-05');
  insertCase.run('a9293101-cb45-49e4-a14b-3b9ccd79d467','MOJ-2024-0270','State v. Radebe','Vandalism charge filed in Oshakati.',
    'Criminal','Closed','Medium','State of Namibia','Haihambo Radebe',
    'Magistrate L. Shikongo','','2024-08-29','Final arguments',adminId,'2025-05-22','2025-05-22');
  insertCase.run('4c020ba4-203c-442f-b053-7c8769ac783e','MOJ-2023-0271','Klerk v. Kamati','Debt recovery.',
    'Civil','Closed','Medium','Andile de Klerk','Sifiso Kamati',
    'Magistrate A. Haihambo','','2024-02-10','Judgment delivery',adminId,'2024-02-22','2024-02-22');
  insertCase.run('21cf2566-460c-4680-b513-4179c67e5b2b','MOJ-2024-0272','State v. Niipare','Public disturbance charge filed in Oshakati.',
    'Criminal','Open','Medium','State of Namibia','Nghidinwa Niipare',
    'Magistrate S. Iipumbu','','2026-06-09','Expert witness testimony',adminId,'2024-10-29','2024-10-29');
  insertCase.run('78c463b4-d79b-436c-a371-c609cb5df5ae','MOJ-2024-0273','Holdings v. Khumalo','Property boundary dispute.',
    'Civil','Closed','High','NamPower Holdings','Nangolo Khumalo',
    'Magistrate A. Haihambo','','2024-01-20','Mediation session',adminId,'2024-09-08','2024-09-08');
  insertCase.run('2d2b91e4-6d09-491a-b272-cdb7e216c55e','MOJ-2025-0274','Jacobs v. Mahlangu','Eviction proceeding.',
    'Civil','Closed','Medium','Anna Jacobs','Thabo Mahlangu',
    'Magistrate S. Iipumbu','','2026-04-16','Postponed — date TBD',adminId,'2025-04-01','2025-04-01');
  insertCase.run('9a74ab22-f55e-4bd6-8848-d9b8cfa2e763','MOJ-2023-0275','Grobler v. Fourie','Guardianship dispute matter.',
    'Family','Open','Medium','Danie Grobler','Thandeka Fourie',
    'Magistrate N. Nakale','','2026-08-27','Pre-trial conference',adminId,'2023-02-21','2023-02-21');
  insertCase.run('c3a67c0b-215b-4d0e-9b3b-d4fa4a395974','MOJ-2026-0276','Wyk v. Steyn','Maintenance order matter.',
    'Family','Open','Medium','Danie van Wyk','Shaanika Steyn',
    'Magistrate P. Nghifindaka','','2026-09-06','Awaiting defendant response',adminId,'2026-02-14','2026-02-14');
  insertCase.run('b4e80973-5854-434b-bad7-765f7cb671c6','MOJ-2024-0277','State v. Khumalo','Tax evasion charge filed in Oshakati.',
    'Criminal','Closed','High','State of Namibia','Angula Khumalo',
    'Magistrate L. Shikongo','','2024-06-11','Mediation session',adminId,'2024-11-04','2024-11-04');
  insertCase.run('e8d503e9-c9d9-4356-a030-5540af875461','MOJ-2026-0278','State v. Mokoena','Kidnapping charge filed in Rundu.',
    'Criminal','Active','Low','State of Namibia','Iiyambo Mokoena',
    'Magistrate P. Nghifindaka','','2026-07-14','Legal aid assessment',adminId,'2026-03-23','2026-03-23');
  insertCase.run('381879f5-0c2c-4f7f-bb44-3d6cb0cbdc59','MOJ-2025-0279','Louw v. Nkosi','Unfair dismissal claim.',
    'Labour','Open','Medium','Maria Louw','Kapuka Nkosi',
    'Magistrate P. Nghifindaka','','2026-06-19','Sentencing hearing',adminId,'2025-12-21','2025-12-21');
  insertCase.run('722ae313-6af1-4648-95f3-e1f210921da1','MOJ-2026-0280','Radebe v. Iipumbu','Discrimination complaint.',
    'Labour','Closed','High','Eino Radebe','Zanele Iipumbu',
    'Magistrate R. Kauari','','2026-05-07','Expert witness testimony',adminId,'2026-04-16','2026-04-16');
  insertCase.run('89b584c3-0da2-4ec6-8f63-827866dd444f','MOJ-2024-0281','State v. Sithole','Assault (grievous bodily harm) charge filed in Khomasdal.',
    'Criminal','Active','Low','State of Namibia','Sbu Sithole',
    'Magistrate L. Shikongo','','2026-08-22','Bail application',adminId,'2024-01-11','2024-01-11');
  insertCase.run('645eb3d5-e39b-4452-935a-8c28cdc15564','MOJ-2026-0282','State v. Kapuka','Malicious damage to property charge filed in Oshakati.',
    'Criminal','Closed','Low','State of Namibia','Nghifikepunye Kapuka',
    'Magistrate T. Amukoto','','2026-01-08','Legal aid assessment',adminId,'2026-05-04','2026-05-04');
  insertCase.run('dcde997a-2ad4-41cb-bd95-e1f58ddc94e1','MOJ-2023-0283','State v. Wyk','Child maintenance default charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Kapuka van Wyk',
    'Magistrate P. Nghifindaka','','2026-10-21','Plea entry',adminId,'2023-12-23','2023-12-23');
  insertCase.run('55c91ac0-ebe9-4596-b076-01ef53d30c51','MOJ-2024-0284','State v. Nghifindaka','Assault (grievous bodily harm) charge filed in Khomasdal.',
    'Criminal','Open','High','State of Namibia','Sipho Nghifindaka',
    'Senior Magistrate J. Botha','','2026-09-02','Mediation session',adminId,'2024-01-28','2024-01-28');
  insertCase.run('18331205-6f0d-4328-95bd-240f9d6185c4','MOJ-2026-0285','Barnard v. Iipumbu','Debt recovery.',
    'Civil','Open','Low','Riaan Barnard','Ndapewa Iipumbu',
    'Magistrate P. Nghifindaka','','2026-06-22','Mediation session',adminId,'2026-03-16','2026-03-16');
  insertCase.run('ea97b0a8-2f41-43cf-b819-857d7ccc7679','MOJ-2025-0286','State v. Visser','Breach of contract charge filed in Windhoek.',
    'Criminal','Closed','High','State of Namibia','Josef Visser',
    'Magistrate R. Kauari','','2025-07-15','Legal aid assessment',adminId,'2026-03-30','2026-03-30');
  insertCase.run('39024d11-fb44-43c0-9cc7-bdbe6c22eb0a','MOJ-2026-0287','Kauari v. Hamukwaya','Personal injury claim.',
    'Civil','Open','Medium','Uuyuni Kauari','Haufiku Hamukwaya',
    'Magistrate L. Shikongo','','2026-06-23','Mediation session',adminId,'2026-01-25','2026-01-25');
  insertCase.run('6c07093d-aedd-4e4a-b1ef-9bed50f85a35','MOJ-2023-0288','Amukoto v. Botha','Commercial lease dispute.',
    'Commercial','Closed','High','Pieter Amukoto','Nghidinwa Botha',
    'Senior Magistrate J. Botha','','2023-05-01','Pre-trial conference',adminId,'2024-03-27','2024-03-27');
  insertCase.run('f0d8bd26-2406-48d1-b1ac-3dad67c2ae2a','MOJ-2024-0289','State v. Pretorius','Assault (common) charge filed in Walvis Bay.',
    'Criminal','Closed','High','State of Namibia','Nomsa Pretorius',
    'Magistrate R. Kauari','','2024-04-18','Mediation session',adminId,'2025-05-12','2025-05-12');
  insertCase.run('08bf5eec-b732-4d4a-bd09-e8287f1b48b5','MOJ-2026-0290','Iiyambo v. Mostert','Eviction proceeding.',
    'Civil','Closed','Medium','Ndapewa Iiyambo','Anna Mostert',
    'Magistrate A. Haihambo','','2026-01-23','Legal aid assessment',adminId,'2026-01-18','2026-01-18');
  insertCase.run('855292d7-4cc2-4bc5-877b-3f1f6e6233d2','MOJ-2023-0291','Sithole v. Steyn','Commercial lease dispute.',
    'Commercial','Open','High','Zanele Sithole','Zanele Steyn',
    'Magistrate R. Kauari','','2026-10-30','Mediation session',adminId,'2023-10-18','2023-10-18');
  insertCase.run('2da4cac0-9547-4f6a-bb1a-d1f7eeee5261','MOJ-2025-0292','Namibia v. Mwatotele','IP infringement.',
    'Commercial','Active','High','Telecom Namibia','Angula Mwatotele',
    'Senior Magistrate J. Botha','','2026-10-01','Pre-trial conference',adminId,'2025-11-08','2025-11-08');
  insertCase.run('d8a95196-a80c-4d6f-8618-21efc845175f','MOJ-2025-0293','Barnard v. Nakale','Property boundary dispute.',
    'Civil','Open','High','Danie Barnard','Kobus Nakale',
    'Magistrate A. Haihambo','','2026-06-07','Expert witness testimony',adminId,'2025-07-10','2025-07-10');
  insertCase.run('f27ea7a8-7f9f-47b8-9c66-fd8f5e00c61a','MOJ-2024-0294','State v. Kapuka','Assault (grievous bodily harm) charge filed in Katutura.',
    'Criminal','Active','High','State of Namibia','Nangolo Kapuka',
    'Magistrate S. Iipumbu','','2026-09-16','Bail application',adminId,'2025-01-08','2025-01-08');
  insertCase.run('6e21da8b-17c4-4b44-ba26-c2c090fb1ef5','MOJ-2026-0295','Merwe v. Roux','Discrimination complaint.',
    'Labour','Closed','Medium','Danie van der Merwe','Thandeka le Roux',
    'Magistrate L. Shikongo','','2026-01-17','Judgment delivery',adminId,'2026-02-10','2026-02-10');
  insertCase.run('cf468a37-f505-478a-aaa9-f833fdbf7dff','MOJ-2024-0296','Windhoek v. Coetzee','Defamation suit.',
    'Civil','Closed','Medium','Bank Windhoek','Nghidinwa Coetzee',
    'Magistrate L. Shikongo','','2024-08-21','Sentencing hearing',adminId,'2024-01-17','2024-01-17');
  insertCase.run('c8d3adf9-074f-4c1c-96e5-656c54c91627','MOJ-2026-0297','Iipumbu v. Radebe','Unpaid invoice dispute.',
    'Commercial','Closed','Low','Francois Iipumbu','Maria Radebe',
    'Magistrate L. Shikongo','','2026-05-06','Sentencing hearing',adminId,'2026-04-06','2026-04-06');
  insertCase.run('dc381dc6-4e03-46bd-ad0e-50e12dd65e15','MOJ-2023-0298','Khumalo v. Khumalo','Personal injury claim.',
    'Civil','Open','High','Gerhard Khumalo','Kamati Khumalo',
    'Magistrate L. Shikongo','','2026-10-26','Mediation session',adminId,'2024-03-13','2024-03-13');
  insertCase.run('9e9566b8-698b-4165-a71c-3532d481d1fc','MOJ-2025-0299','Nkosi v. Barnard','Partnership dissolution.',
    'Commercial','Pending','Low','Nangolo Nkosi','Nangolo Barnard',
    'Magistrate L. Shikongo','','2026-07-05','Cross-examination',adminId,'2026-04-12','2026-04-12');
  insertCase.run('211018b7-f644-4c0c-8eea-d819f9f19897','MOJ-2026-0300','Shaanika v. Nkosi','Commercial lease dispute.',
    'Commercial','Closed','Medium','Haihambo Shaanika','Zanele Nkosi',
    'Senior Magistrate J. Botha','','2026-04-30','Bail application',adminId,'2026-02-25','2026-02-25');
  insertCase.run('d7624cd7-03e2-4a34-a2a4-7a546bbdf38f','MOJ-2025-0301','Louw v. Merwe','Defamation suit.',
    'Civil','Active','Low','Kobus Louw','Kamati van der Merwe',
    'Senior Magistrate J. Botha','','2026-08-11','Documentary evidence submission',adminId,'2025-06-22','2025-06-22');
  insertCase.run('2be1bda0-d789-484d-8c6e-dae6e1538d06','MOJ-2024-0302','State v. Kapuka','Land dispute charge filed in Khomasdal.',
    'Criminal','Closed','High','State of Namibia','Thabo Kapuka',
    'Magistrate S. Iipumbu','','2025-01-04','Awaiting defendant response',adminId,'2024-03-12','2024-03-12');
  insertCase.run('16e8ea5a-2cf1-423b-a076-fbe063ba0d5c','MOJ-2026-0303','Mukuve v. Fourie','Commercial lease dispute.',
    'Commercial','Active','Low','Kauari Mukuve','Danie Fourie',
    'Magistrate P. Nghifindaka','','2026-10-16','Legal aid assessment',adminId,'2026-02-26','2026-02-26');
  insertCase.run('912611e0-6a24-4846-9fbf-e0cd9ff7903f','MOJ-2023-0304','Mokoena v. Plessis','Workplace harassment.',
    'Labour','Open','Medium','Kamati Mokoena','Sifiso du Plessis',
    'Magistrate R. Kauari','','2026-08-26','Awaiting defendant response',adminId,'2024-04-05','2024-04-05');
  insertCase.run('bc03df35-a015-4c66-8a50-e312a0ab7f2a','MOJ-2026-0305','Nghidinwa v. Hamukwaya','Adoption proceeding matter.',
    'Family','Active','Medium','Andile Nghidinwa','Shilongo Hamukwaya',
    'Magistrate A. Haihambo','','2026-09-30','Cross-examination',adminId,'2026-01-31','2026-01-31');
  insertCase.run('5b651e0d-eec7-44e0-983f-2f637512c710','MOJ-2024-0306','State v. Pretorius','Reckless driving charge filed in Khomasdal.',
    'Criminal','Closed','High','State of Namibia','Nico Pretorius',
    'Magistrate A. Haihambo','','2025-03-21','Plea entry',adminId,'2024-01-28','2024-01-28');
  insertCase.run('b51febe0-b36a-4b82-bc7b-8c6a0b58ce3c','MOJ-2026-0307','State v. Grobler','Tax evasion charge filed in Windhoek.',
    'Criminal','Active','Medium','State of Namibia','Francois Grobler',
    'Magistrate T. Amukoto','','2026-11-10','Cross-examination',adminId,'2026-03-27','2026-03-27');
  insertCase.run('d05fd0a1-8247-4580-a6ed-67b04daecd74','MOJ-2025-0308','Shaanika v. Nghidinwa','Debt recovery.',
    'Civil','Closed','Medium','Thandeka Shaanika','Nghifikepunye Nghidinwa',
    'Magistrate R. Kauari','','2026-01-26','Cross-examination',adminId,'2026-02-07','2026-02-07');
  insertCase.run('637f9bdb-6e9f-4738-a097-9fadd0e71cdd','MOJ-2026-0309','State v. Dlamini','Extortion charge filed in Windhoek.',
    'Criminal','Open','Medium','State of Namibia','Nomsa Dlamini',
    'Magistrate S. Iipumbu','','2026-10-15','Witness testimony',adminId,'2026-03-24','2026-03-24');
  insertCase.run('1fef4bef-53e7-4b69-afbe-19b358006e3e','MOJ-2024-0310','Fourie v. Botha','Defamation suit.',
    'Civil','Closed','Medium','Danie Fourie','Nandi Botha',
    'Magistrate A. Haihambo','','2024-07-15','Mediation session',adminId,'2024-02-22','2024-02-22');
  insertCase.run('05a77cdc-b055-4a58-9783-37992db9c399','MOJ-2025-0311','Amukoto v. Holdings','Unpaid invoice dispute.',
    'Commercial','Closed','Medium','Lerato Amukoto','NamPower Holdings',
    'Magistrate S. Iipumbu','','2025-07-03','Expert witness testimony',adminId,'2025-09-08','2025-09-08');
  insertCase.run('ed58ec09-6bdf-472b-8306-e2020d4a5a8f','MOJ-2023-0312','State v. Roux','Child maintenance default charge filed in Oshakati.',
    'Criminal','Open','Medium','State of Namibia','Sbu le Roux',
    'Magistrate L. Shikongo','','2026-11-12','Plea entry',adminId,'2024-03-24','2024-03-24');
  insertCase.run('9c63ef4d-e1a1-453e-a4d4-c046faf50db6','MOJ-2023-0313','State v. Amupolo','Possession of stolen goods charge filed in Windhoek.',
    'Criminal','Closed','Low','State of Namibia','Haimbodi Amupolo',
    'Magistrate L. Shikongo','','2023-03-01','Witness testimony',adminId,'2023-12-20','2023-12-20');
  insertCase.run('72ff0a2b-0456-4fa9-8a36-8b189512351a','MOJ-2024-0314','Shaanika v. Niipare','Personal injury claim.',
    'Civil','Closed','Low','Kobus Shaanika','Nangolo Niipare',
    'Magistrate A. Haihambo','','2024-02-21','Plea entry',adminId,'2024-12-04','2024-12-04');
  insertCase.run('602f213b-ce2d-42df-a1f4-76ff3b78ffdc','MOJ-2023-0315','State v. Roux','Failure to appear charge filed in Oshakati.',
    'Criminal','Active','Low','State of Namibia','Nomsa le Roux',
    'Magistrate T. Amukoto','','2026-11-04','Cross-examination',adminId,'2023-04-12','2023-04-12');
  insertCase.run('d06e9426-9c2f-4cd1-ab8e-8f511059b2ab','MOJ-2026-0316','Nkosi v. Mokoena','Property boundary dispute.',
    'Civil','Open','Low','Sipho Nkosi','Hamukwaya Mokoena',
    'Senior Magistrate J. Botha','','2026-10-03','Expert witness testimony',adminId,'2026-02-23','2026-02-23');
  insertCase.run('2beb7715-0c30-4dcb-a2c8-a01ed57beb77','MOJ-2026-0317','State v. Haihambo','Contempt of court charge filed in Khomasdal.',
    'Criminal','Open','Low','State of Namibia','Sifiso Haihambo',
    'Magistrate T. Amukoto','','2026-11-13','Expert witness testimony',adminId,'2026-03-07','2026-03-07');
  insertCase.run('aa1e37d0-0da9-4a62-ac50-9998958b1d7e','MOJ-2026-0318','State v. Grobler','Contravening by-law charge filed in Rundu.',
    'Criminal','Open','Medium','State of Namibia','Mwatotele Grobler',
    'Magistrate L. Shikongo','','2026-09-02','Settlement negotiations',adminId,'2026-03-16','2026-03-16');
  insertCase.run('7031dfe6-e30e-4ce8-ba62-5e45d7272289','MOJ-2023-0319','State v. Fourie','Trespassing charge filed in Khomasdal.',
    'Criminal','Closed','Low','State of Namibia','Kamati Fourie',
    'Magistrate L. Shikongo','','2023-12-06','Settlement negotiations',adminId,'2023-03-12','2023-03-12');
  insertCase.run('8309c65d-08cb-42f6-8ff5-88de5dbb98a4','MOJ-2025-0320','State v. Mostert','Kidnapping charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Shikongo Mostert',
    'Magistrate R. Kauari','','2026-09-12','Documentary evidence submission',adminId,'2025-07-25','2025-07-25');
  insertCase.run('b0eaf015-3361-4d30-89ba-a65f8e669ee1','MOJ-2026-0321','State v. Hamukwaya','Land dispute charge filed in Oshakati.',
    'Criminal','Open','Medium','State of Namibia','Haimbodi Hamukwaya',
    'Magistrate L. Shikongo','','2026-06-28','Settlement negotiations',adminId,'2026-02-10','2026-02-10');
  insertCase.run('3a4c2ffb-0503-4a32-be60-c7da8234bfc5','MOJ-2026-0322','State v. Nakale','Theft charge filed in Walvis Bay.',
    'Criminal','Pending','High','State of Namibia','Kauari Nakale',
    'Magistrate S. Iipumbu','','2026-07-05','Pre-trial conference',adminId,'2026-01-08','2026-01-08');
  insertCase.run('b14a1234-0cf2-494a-bdeb-e9f880dfd10e','MOJ-2026-0323','State v. Kamati','Driving under the influence charge filed in Rundu.',
    'Criminal','Open','Medium','State of Namibia','Kapuka Kamati',
    'Magistrate S. Iipumbu','','2026-10-27','Witness testimony',adminId,'2026-05-15','2026-05-15');
  insertCase.run('a5132ee5-92d2-44b6-ab2c-2c41ca935d17','MOJ-2025-0324','State v. Shikongo','Fraud charge filed in Oshakati.',
    'Criminal','Active','Medium','State of Namibia','Kamati Shikongo',
    'Senior Magistrate J. Botha','','2026-11-22','Legal aid assessment',adminId,'2025-12-06','2025-12-06');
  insertCase.run('197d0e7f-342c-482c-92fd-5c25016f5749','MOJ-2023-0325','State v. Pieterse','Vandalism charge filed in Walvis Bay.',
    'Criminal','Closed','Medium','State of Namibia','Lerato Pieterse',
    'Senior Magistrate J. Botha','','2024-03-21','Settlement negotiations',adminId,'2023-09-11','2023-09-11');
  insertCase.run('0e46b5ac-3c5d-43d1-8c67-7167945f51d3','MOJ-2025-0326','Namibia v. Amupolo','Property boundary dispute.',
    'Civil','Open','Medium','Standard Bank Namibia','Nakale Amupolo',
    'Magistrate N. Nakale','','2026-08-01','Plea entry',adminId,'2026-02-23','2026-02-23');
  insertCase.run('68041bae-3e62-429a-83f6-ddb65ae1996a','MOJ-2026-0327','Kauari v. Agency','Unfair dismissal claim.',
    'Labour','Active','Low','Ndapewa Kauari','Namibia Revenue Agency',
    'Senior Magistrate J. Botha','','2026-06-28','Postponed — date TBD',adminId,'2026-01-05','2026-01-05');
  insertCase.run('48de6319-c4a2-4e92-a3fa-cc4dbfa71b2f','MOJ-2025-0328','Molefe v. Roux','Eviction proceeding.',
    'Civil','Closed','High','Shikongo Molefe','Iipumbu le Roux',
    'Magistrate S. Iipumbu','','2025-01-28','Legal aid assessment',adminId,'2026-02-27','2026-02-27');
  insertCase.run('adc3a902-5125-4c7e-8a65-07bf6e8e86d2','MOJ-2025-0329','Steyn v. Niipare','Unfair dismissal claim.',
    'Labour','Open','Low','Iiyambo Steyn','Josef Niipare',
    'Magistrate P. Nghifindaka','','2026-08-31','Witness testimony',adminId,'2025-06-24','2025-06-24');
  insertCase.run('06162ea5-3bf4-4cd1-839f-1c03a1a1eddf','MOJ-2023-0330','State v. Coetzee','Theft charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Nomsa Coetzee',
    'Magistrate N. Nakale','','2026-11-05','Documentary evidence submission',adminId,'2023-05-11','2023-05-11');
  insertCase.run('72c6216f-d007-445b-965a-14e96fcd6271','MOJ-2024-0331','Ndlovu v. Amupolo','Guardianship dispute matter.',
    'Family','Open','High','Shilongo Ndlovu','Niipare Amupolo',
    'Magistrate L. Shikongo','','2026-11-21','Expert witness testimony',adminId,'2024-11-20','2024-11-20');
  insertCase.run('6256d5fc-348b-4d21-af00-b2dc10b4f89a','MOJ-2024-0332','Roux v. Niipare','Discrimination complaint.',
    'Labour','Open','Low','Amupolo le Roux','Francois Niipare',
    'Magistrate N. Nakale','','2026-10-03','Settlement negotiations',adminId,'2024-10-26','2024-10-26');
  insertCase.run('ae732507-4668-422e-84c8-71d16c819244','MOJ-2024-0333','State v. Mwatotele','Perjury charge filed in Katutura.',
    'Criminal','Open','High','State of Namibia','Haimbodi Mwatotele',
    'Magistrate S. Iipumbu','','2026-09-08','Judgment delivery',adminId,'2025-03-27','2025-03-27');
  insertCase.run('96bd8395-972a-4a99-8310-c44682a6fbfb','MOJ-2025-0334','Plessis v. Iiyambo','Partnership dissolution.',
    'Commercial','Active','Medium','Shaanika du Plessis','Shaanika Iiyambo',
    'Senior Magistrate J. Botha','','2026-07-07','Final arguments',adminId,'2025-03-10','2025-03-10');
  insertCase.run('3e50ee01-27f5-4008-9061-d8bea545cb8e','MOJ-2024-0335','Visser v. Angula','Defamation suit.',
    'Civil','Open','Medium','Kamati Visser','Amupolo Angula',
    'Magistrate S. Iipumbu','','2026-07-05','Expert witness testimony',adminId,'2024-12-10','2024-12-10');
  insertCase.run('0bdff0ea-2c2b-4779-b0cb-d8b5c7f099cf','MOJ-2023-0336','Nghifindaka v. Nangolo','Divorce and child custody matter.',
    'Family','Pending','High','Palesa Nghifindaka','Sipho Nangolo',
    'Magistrate N. Nakale','','2026-10-16','Awaiting defendant response',adminId,'2024-01-18','2024-01-18');
  insertCase.run('c5362535-545c-4e1f-869e-49ebb78e4f61','MOJ-2023-0337','Louw v. Namibia','Partnership dissolution.',
    'Commercial','Open','Low','Mwatotele Louw','State of Namibia',
    'Magistrate L. Shikongo','','2026-07-13','Sentencing hearing',adminId,'2023-05-17','2023-05-17');
  insertCase.run('29f1d189-00a9-4435-b4af-411c2f492611','MOJ-2024-0338','State v. Iiyambo','Unlawful termination of employment charge filed in Katutura.',
    'Criminal','Active','High','State of Namibia','Mukuve Iiyambo',
    'Magistrate T. Amukoto','','2026-11-21','Pre-trial conference',adminId,'2025-03-20','2025-03-20');
  insertCase.run('29b8e2af-23aa-432a-b104-e01b44af325b','MOJ-2026-0339','Grobler v. Jacobs','Property boundary dispute.',
    'Civil','Pending','Medium','Mwatotele Grobler','Iipumbu Jacobs',
    'Magistrate L. Shikongo','','2026-09-09','Expert witness testimony',adminId,'2026-04-08','2026-04-08');
  insertCase.run('162f256e-d6f6-4343-99a9-1434be8205f5','MOJ-2025-0340','Angula v. Mwatotele','Personal injury claim.',
    'Civil','Pending','High','Shilongo Angula','Mukuve Mwatotele',
    'Magistrate P. Nghifindaka','','2026-11-14','Expert witness testimony',adminId,'2025-11-21','2025-11-21');
  insertCase.run('903c002d-a584-4f14-9607-09d4f7e7540b','MOJ-2024-0341','Shikongo v. Nghifindaka','Defamation suit.',
    'Civil','Active','Medium','Riaan Shikongo','Johan Nghifindaka',
    'Magistrate T. Amukoto','','2026-07-16','Mediation session',adminId,'2025-05-07','2025-05-07');
  insertCase.run('e58147e7-402f-4b4c-bfca-2727812b6e03','MOJ-2024-0342','Windhoek v. Jacobs','Eviction proceeding.',
    'Civil','Open','Medium','Bank Windhoek','Nangolo Jacobs',
    'Senior Magistrate J. Botha','','2026-07-11','Postponed — date TBD',adminId,'2025-04-24','2025-04-24');
  insertCase.run('cedb15cd-905c-4f20-96e8-744e74ac0e7d','MOJ-2025-0343','Khumalo v. Pieterse','Discrimination complaint.',
    'Labour','Closed','Medium','Haihambo Khumalo','Haihambo Pieterse',
    'Magistrate T. Amukoto','','2025-06-12','Final arguments',adminId,'2025-12-29','2025-12-29');
  insertCase.run('1643180c-231d-4391-bf57-5d59c3d36a8b','MOJ-2026-0344','State v. Steyn','Reckless driving charge filed in Oshakati.',
    'Criminal','Active','Medium','State of Namibia','Josef Steyn',
    'Magistrate P. Nghifindaka','','2026-08-25','Awaiting defendant response',adminId,'2026-03-26','2026-03-26');
  insertCase.run('b56deb74-f62f-436f-b858-d26dd3c37f73','MOJ-2023-0345','State v. Shaanika','Driving under the influence charge filed in Windhoek.',
    'Criminal','Closed','Medium','State of Namibia','Angula Shaanika',
    'Senior Magistrate J. Botha','','2023-11-25','Sentencing hearing',adminId,'2024-04-08','2024-04-08');
  insertCase.run('689821c9-c610-46e1-8481-b0156f7950c9','MOJ-2026-0346','State v. Shilongo','Breach of contract charge filed in Walvis Bay.',
    'Criminal','Active','Medium','State of Namibia','Amupolo Shilongo',
    'Magistrate A. Haihambo','','2026-09-05','Witness testimony',adminId,'2026-05-13','2026-05-13');
  insertCase.run('aeb4cdcd-4ccb-4e55-92c2-e437c519dcd4','MOJ-2024-0347','Nkosi v. Pieterse','Maintenance order matter.',
    'Family','Pending','Low','Uuyuni Nkosi','Iiyambo Pieterse',
    'Magistrate T. Amukoto','','2026-10-17','Mediation session',adminId,'2025-05-12','2025-05-12');
  insertCase.run('690ec231-8cde-4efe-bfa8-c3e8de31cddb','MOJ-2024-0348','Roux v. Plessis','Unpaid invoice dispute.',
    'Commercial','Closed','Low','Mukuve le Roux','Nandi du Plessis',
    'Magistrate P. Nghifindaka','','2024-12-25','Judgment delivery',adminId,'2025-02-28','2025-02-28');
  insertCase.run('dd860caf-0a5a-4088-9bf9-893a2dd3f72f','MOJ-2025-0349','State v. Pieterse','Unlawful possession of firearm charge filed in Katutura.',
    'Criminal','Open','Low','State of Namibia','Iipumbu Pieterse',
    'Magistrate L. Shikongo','','2026-08-05','Mediation session',adminId,'2026-02-11','2026-02-11');
  insertCase.run('0b4a0051-ed2f-4c87-bcde-60fdffb41c36','MOJ-2025-0350','Angula v. Holdings','Commercial lease dispute.',
    'Commercial','Active','High','Riaan Angula','TransNamib Holdings',
    'Magistrate N. Nakale','','2026-06-06','Plea entry',adminId,'2025-06-11','2025-06-11');
  insertCase.run('2ceb0a50-fc10-4e98-ac33-90b1845ed2c3','MOJ-2023-0351','State v. Mokoena','Contempt of court charge filed in Walvis Bay.',
    'Criminal','Active','Low','State of Namibia','Nangolo Mokoena',
    'Magistrate A. Haihambo','','2026-08-18','Final arguments',adminId,'2023-12-18','2023-12-18');
  insertCase.run('66e3ac41-3739-4fef-bacb-1d36a663b5cb','MOJ-2023-0352','Nghidinwa v. Ltd','Workplace harassment.',
    'Labour','Open','Medium','Palesa Nghidinwa','NHE Ltd',
    'Magistrate R. Kauari','','2026-10-19','Postponed — date TBD',adminId,'2023-07-20','2023-07-20');
  insertCase.run('b04952d8-3cc9-4b02-beac-8a5ef602792b','MOJ-2023-0353','State v. Iiyambo','Assault (grievous bodily harm) charge filed in Khomasdal.',
    'Criminal','Open','Low','State of Namibia','Uuyuni Iiyambo',
    'Magistrate L. Shikongo','','2026-09-10','Pre-trial conference',adminId,'2023-11-02','2023-11-02');
  insertCase.run('2312c693-80b8-4eb7-bb20-a3a9486967fc','MOJ-2024-0354','Louw v. Ndlovu','Maintenance order matter.',
    'Family','Open','High','Angula Louw','Nomsa Ndlovu',
    'Magistrate R. Kauari','','2026-07-28','Mediation session',adminId,'2024-04-04','2024-04-04');
  insertCase.run('2cdb248d-eed2-4506-9be0-bdefe84547f5','MOJ-2023-0355','Coetzee v. Molefe','Workplace harassment.',
    'Labour','Closed','Low','Zanele Coetzee','Nghifindaka Molefe',
    'Magistrate A. Haihambo','','2023-05-09','Awaiting defendant response',adminId,'2023-02-04','2023-02-04');
  insertCase.run('70110f6b-f1e9-4014-a1e2-de68861c872d','MOJ-2024-0356','State v. Shaanika','Extortion charge filed in Khomasdal.',
    'Criminal','Active','Low','State of Namibia','Petrus Shaanika',
    'Magistrate P. Nghifindaka','','2026-09-25','Legal aid assessment',adminId,'2024-09-05','2024-09-05');
  insertCase.run('78f8abc4-f6c5-427d-bf4d-fc1ce97ce36e','MOJ-2025-0357','Plessis v. Nghifindaka','Domestic violence interdict matter.',
    'Family','Active','Medium','Nghidinwa du Plessis','Kamati Nghifindaka',
    'Magistrate L. Shikongo','','2026-07-28','Legal aid assessment',adminId,'2025-05-07','2025-05-07');
  insertCase.run('63c1ac5d-f59c-46d1-a05b-8a48a4771b4e','MOJ-2025-0358','Sithole v. Bay','Unfair dismissal claim.',
    'Labour','Active','High','Iipumbu Sithole','City of Walvis Bay',
    'Magistrate S. Iipumbu','','2026-10-04','Final arguments',adminId,'2025-06-06','2025-06-06');
  insertCase.run('7e844eb6-53c6-4c0b-b943-5f6e4feaaef9','MOJ-2024-0359','Hamukwaya v. Roux','Eviction proceeding.',
    'Civil','Active','Low','Shilongo Hamukwaya','Ndapewa le Roux',
    'Magistrate T. Amukoto','','2026-10-09','Expert witness testimony',adminId,'2024-01-10','2024-01-10');
  insertCase.run('5f75a683-da89-46f9-bf62-b0e89dad2104','MOJ-2023-0360','Wyk v. Pretorius','Debt recovery.',
    'Civil','Pending','High','Shilongo van Wyk','Palesa Pretorius',
    'Magistrate R. Kauari','','2026-07-29','Legal aid assessment',adminId,'2023-07-20','2023-07-20');
  insertCase.run('2681a666-8b76-456b-b0c9-5dd4e10360e7','MOJ-2023-0361','Shilongo v. Finance','Unpaid invoice dispute.',
    'Commercial','Active','Low','Haufiku Shilongo','Ministry of Finance',
    'Magistrate P. Nghifindaka','','2026-11-06','Settlement negotiations',adminId,'2024-05-08','2024-05-08');
  insertCase.run('d6460c2a-ffb2-4104-9e46-367f8840efc9','MOJ-2024-0362','Louw v. Mukuve','Wage dispute.',
    'Labour','Active','Low','Nandi Louw','Johan Mukuve',
    'Magistrate P. Nghifindaka','','2026-07-31','Final arguments',adminId,'2024-09-06','2024-09-06');
  insertCase.run('87adb711-f929-40b3-9dc6-7127873527fd','MOJ-2025-0363','Nangolo v. Plessis','Partnership dissolution.',
    'Commercial','Active','High','Nghidinwa Nangolo','Kobus du Plessis',
    'Magistrate L. Shikongo','','2026-11-15','Witness testimony',adminId,'2026-05-18','2026-05-18');
  insertCase.run('8cf9c7ac-c935-4f0e-aeb3-d80fa5b79034','MOJ-2024-0364','Louw v. Nangolo','IP infringement.',
    'Commercial','Closed','High','Haihambo Louw','Sifiso Nangolo',
    'Magistrate S. Iipumbu','','2025-04-04','Pre-trial conference',adminId,'2024-11-30','2024-11-30');
  insertCase.run('22a85481-bc49-4cea-8555-eaf1634e05b0','MOJ-2025-0365','Fourie v. Kapuka','Workplace harassment.',
    'Labour','Closed','High','Amukoto Fourie','Amupolo Kapuka',
    'Magistrate L. Shikongo','','2025-03-13','Judgment delivery',adminId,'2026-03-28','2026-03-28');
  insertCase.run('6b5f85fe-8780-446a-a189-9526ebffd860','MOJ-2024-0366','State v. Ndlovu','Land dispute charge filed in Rundu.',
    'Criminal','Active','Low','State of Namibia','Kapuka Ndlovu',
    'Magistrate P. Nghifindaka','','2026-08-25','Plea entry',adminId,'2025-02-19','2025-02-19');
  insertCase.run('a3020a24-b39a-41d7-8d26-e90997d30626','MOJ-2024-0367','Ltd v. Mahlangu','Breach of supply contract.',
    'Commercial','Open','Medium','NHE Ltd','Nakale Mahlangu',
    'Magistrate L. Shikongo','','2026-10-31','Mediation session',adminId,'2024-10-20','2024-10-20');
  insertCase.run('2009c9db-3d0d-498c-a187-0afeb50d66eb','MOJ-2024-0368','Swanepoel v. Mwatotele','Debt recovery.',
    'Civil','Open','High','Pieter Swanepoel','Amukoto Mwatotele',
    'Magistrate L. Shikongo','','2026-11-18','Expert witness testimony',adminId,'2025-01-03','2025-01-03');
  insertCase.run('2065bdd5-b764-44d1-90c1-4239c508d83c','MOJ-2026-0369','State v. Shilongo','Failure to appear charge filed in Katutura.',
    'Criminal','Open','High','State of Namibia','Hamukwaya Shilongo',
    'Magistrate R. Kauari','','2026-11-08','Final arguments',adminId,'2026-02-16','2026-02-16');
  insertCase.run('6c32d001-0109-41c8-acbb-820eb1dd2cbb','MOJ-2025-0370','Dlamini v. Haufiku','Retrenchment challenge.',
    'Labour','Pending','Low','Zanele Dlamini','Amupolo Haufiku',
    'Magistrate P. Nghifindaka','','2026-07-05','Plea entry',adminId,'2025-07-17','2025-07-17');
  insertCase.run('3175e926-f7b1-4fe7-aa4b-41ced0c048e0','MOJ-2024-0371','State v. Klerk','Theft charge filed in Windhoek.',
    'Criminal','Open','High','State of Namibia','Amupolo de Klerk',
    'Magistrate L. Shikongo','','2026-10-16','Expert witness testimony',adminId,'2025-02-05','2025-02-05');
  insertCase.run('fda70a4c-fe6f-4431-ae75-f9b63015a4b1','MOJ-2026-0372','State v. Niipare','Domestic violence charge filed in Walvis Bay.',
    'Criminal','Pending','Low','State of Namibia','Johan Niipare',
    'Magistrate N. Nakale','','2026-09-04','Judgment delivery',adminId,'2026-04-18','2026-04-18');
  insertCase.run('d9957279-45fe-4190-b83a-7aab33fc55dd','MOJ-2024-0373','Niipare v. Pretorius','Workplace harassment.',
    'Labour','Closed','High','Haufiku Niipare','Nghifikepunye Pretorius',
    'Magistrate S. Iipumbu','','2025-01-14','Pre-trial conference',adminId,'2025-02-15','2025-02-15');
  insertCase.run('b31cb2f6-0046-448a-9402-7d78f1fd7dca','MOJ-2023-0374','Nangolo v. Shikongo','Personal injury claim.',
    'Civil','Pending','High','Riaan Nangolo','Sipho Shikongo',
    'Magistrate A. Haihambo','','2026-06-03','Sentencing hearing',adminId,'2023-01-03','2023-01-03');
  insertCase.run('02ade229-e27e-47d6-8e93-255e5dca67d1','MOJ-2025-0375','Nghifindaka v. Mostert','IP infringement.',
    'Commercial','Active','Low','Uuyuni Nghifindaka','Angula Mostert',
    'Magistrate R. Kauari','','2026-10-29','Plea entry',adminId,'2025-11-30','2025-11-30');
  insertCase.run('24757803-31e4-436a-bb26-0dea2c577c27','MOJ-2026-0376','State v. Pretorius','Unlawful termination of employment charge filed in Rundu.',
    'Criminal','Active','High','State of Namibia','Mukuve Pretorius',
    'Magistrate A. Haihambo','','2026-09-11','Bail application',adminId,'2026-03-30','2026-03-30');
  insertCase.run('3e1c438b-86e0-4d42-ac1c-6fda072c0322','MOJ-2024-0377','Iiyambo v. Merwe','Unfair dismissal claim.',
    'Labour','Closed','Medium','Petrus Iiyambo','Mwatotele van der Merwe',
    'Magistrate T. Amukoto','','2024-07-24','Sentencing hearing',adminId,'2024-09-17','2024-09-17');
  insertCase.run('5511ceff-d3b7-4bb4-8b00-e0da6ed65257','MOJ-2023-0378','State v. Pieterse','Failure to appear charge filed in Katutura.',
    'Criminal','Closed','Medium','State of Namibia','Pieter Pieterse',
    'Senior Magistrate J. Botha','','2023-08-11','Expert witness testimony',adminId,'2023-11-04','2023-11-04');
  insertCase.run('e28d3eb4-e57c-405c-b194-d1abfccf229e','MOJ-2023-0379','Nkosi v. Nangolo','Partnership dissolution.',
    'Commercial','Active','Medium','Amukoto Nkosi','Hamukwaya Nangolo',
    'Magistrate L. Shikongo','','2026-07-16','Final arguments',adminId,'2024-02-24','2024-02-24');
  insertCase.run('1cd4199b-0bb6-4170-ba27-fc117ff103f5','MOJ-2024-0380','State v. Mokoena','Failure to appear charge filed in Walvis Bay.',
    'Criminal','Closed','Low','State of Namibia','Lerato Mokoena',
    'Magistrate S. Iipumbu','','2024-01-01','Sentencing hearing',adminId,'2024-12-01','2024-12-01');
  insertCase.run('2fc9e83e-8550-4456-a241-62c403c364ab','MOJ-2026-0381','Iiyambo v. Radebe','Partnership dissolution.',
    'Commercial','Pending','Medium','Kapuka Iiyambo','Maria Radebe',
    'Magistrate L. Shikongo','','2026-06-25','Postponed — date TBD',adminId,'2026-01-18','2026-01-18');
  insertCase.run('d13bff95-052d-4388-a4b8-f294bedb8ecd','MOJ-2024-0382','Pieterse v. Steyn','Defamation suit.',
    'Civil','Active','High','Iipumbu Pieterse','Amupolo Steyn',
    'Magistrate L. Shikongo','','2026-09-14','Bail application',adminId,'2024-03-30','2024-03-30');
  insertCase.run('4b8788bc-9a20-472c-a175-2ddf546573e2','MOJ-2025-0383','Roux v. Haufiku','Debt recovery.',
    'Civil','Closed','High','Petrus le Roux','Shikongo Haufiku',
    'Magistrate N. Nakale','','2026-01-30','Pre-trial conference',adminId,'2025-09-05','2025-09-05');
  insertCase.run('70c989cb-bd8d-4ecc-97b2-1a0ea6b762ba','MOJ-2023-0384','Niipare v. Kauari','Workplace harassment.',
    'Labour','Open','Medium','Mwatotele Niipare','Anna Kauari',
    'Magistrate T. Amukoto','','2026-07-28','Plea entry',adminId,'2023-11-21','2023-11-21');
  insertCase.run('89f821fc-9f5d-4ed7-b444-d6f52735dd0b','MOJ-2023-0385','Finance v. Grobler','Defamation suit.',
    'Civil','Open','Medium','Ministry of Finance','Kauari Grobler',
    'Magistrate T. Amukoto','','2026-08-28','Plea entry',adminId,'2023-12-11','2023-12-11');
  insertCase.run('b020f78f-fe93-46c3-8e18-e243e50c2bb5','MOJ-2024-0386','Swanepoel v. Coetzee','Personal injury claim.',
    'Civil','Open','Medium','Sbu Swanepoel','Sifiso Coetzee',
    'Senior Magistrate J. Botha','','2026-08-01','Postponed — date TBD',adminId,'2024-04-12','2024-04-12');
  insertCase.run('dd6c72e2-22df-43a2-8c8f-7f31162f5508','MOJ-2025-0387','State v. Nakale','Money laundering charge filed in Windhoek.',
    'Criminal','Closed','Low','State of Namibia','Hamukwaya Nakale',
    'Magistrate T. Amukoto','','2025-12-13','Expert witness testimony',adminId,'2025-02-10','2025-02-10');
  insertCase.run('4baf2ca1-233c-47d5-a74e-8fae4d240937','MOJ-2023-0388','Nakale v. Agency','Workplace harassment.',
    'Labour','Active','Medium','Kobus Nakale','Namibia Revenue Agency',
    'Senior Magistrate J. Botha','','2026-10-27','Expert witness testimony',adminId,'2024-05-19','2024-05-19');
  insertCase.run('13e42503-4d2f-4da1-a502-671c35ed3f69','MOJ-2024-0389','State v. Amukoto','Unlawful termination of employment charge filed in Rundu.',
    'Criminal','Pending','High','State of Namibia','Maria Amukoto',
    'Senior Magistrate J. Botha','','2026-10-08','Judgment delivery',adminId,'2024-01-17','2024-01-17');
  insertCase.run('a98302bf-c35d-4230-b585-01ff607428d2','MOJ-2024-0390','Swanepoel v. Grobler','Workplace harassment.',
    'Labour','Open','High','Mwatotele Swanepoel','Zanele Grobler',
    'Magistrate S. Iipumbu','','2026-06-05','Postponed — date TBD',adminId,'2024-01-05','2024-01-05');
  insertCase.run('f92da36d-5965-45ac-b6e7-4227cb30933c','MOJ-2025-0391','State v. Tshabalala','Malicious damage to property charge filed in Walvis Bay.',
    'Criminal','Pending','Medium','State of Namibia','Petrus Tshabalala',
    'Magistrate P. Nghifindaka','','2026-11-05','Bail application',adminId,'2025-08-30','2025-08-30');
  insertCase.run('f32b69da-e68f-4cd8-8cd6-ddbde728c1eb','MOJ-2026-0392','Pretorius v. Haufiku','Personal injury claim.',
    'Civil','Active','Medium','Nakale Pretorius','Nakale Haufiku',
    'Magistrate S. Iipumbu','','2026-08-12','Settlement negotiations',adminId,'2026-04-13','2026-04-13');
  insertCase.run('51caf643-f10d-4828-887d-fa1b9d357db8','MOJ-2025-0393','Visser v. Nakale','Personal injury claim.',
    'Civil','Pending','High','Sipho Visser','Haimbodi Nakale',
    'Magistrate N. Nakale','','2026-07-10','Sentencing hearing',adminId,'2025-03-16','2025-03-16');
  insertCase.run('a0abc9ed-9530-4f6a-bc1e-6cf30d01972c','MOJ-2025-0394','Swanepoel v. Nghidinwa','Unfair dismissal claim.',
    'Labour','Active','Medium','Andile Swanepoel','Kauari Nghidinwa',
    'Magistrate L. Shikongo','','2026-07-13','Plea entry',adminId,'2025-02-20','2025-02-20');
  insertCase.run('c5bf5adf-4a51-49ab-a7bd-c809686f5401','MOJ-2025-0395','Haufiku v. Coetzee','Adoption proceeding matter.',
    'Family','Active','Medium','Maria Haufiku','Nangolo Coetzee',
    'Magistrate S. Iipumbu','','2026-07-03','Witness testimony',adminId,'2025-07-30','2025-07-30');
  insertCase.run('04f681b2-31dc-4bad-8a0f-3b3d9053f0d4','MOJ-2024-0396','Shaanika v. Haihambo','Personal injury claim.',
    'Civil','Active','Medium','Eino Shaanika','Palesa Haihambo',
    'Senior Magistrate J. Botha','','2026-09-24','Final arguments',adminId,'2025-01-12','2025-01-12');
  insertCase.run('822ca63e-87de-4ca7-a2e4-25d6d19e8b8f','MOJ-2025-0397','Kapuka v. Mwatotele','IP infringement.',
    'Commercial','Closed','High','Anna Kapuka','Kobus Mwatotele',
    'Magistrate T. Amukoto','','2025-06-25','Documentary evidence submission',adminId,'2025-03-24','2025-03-24');
  insertCase.run('6591d1e0-20f9-40f4-b1b4-e0b17bc1ae61','MOJ-2026-0398','Wyk v. Mukuve','Domestic violence interdict matter.',
    'Family','Closed','High','Thandeka van Wyk','Marlene Mukuve',
    'Magistrate N. Nakale','','2026-01-06','Mediation session',adminId,'2026-02-17','2026-02-17');
  insertCase.run('7dd32d41-66cd-4989-9139-81b94c067dec','MOJ-2023-0399','Roux v. Nangolo','Property boundary dispute.',
    'Civil','Open','High','Thabo le Roux','Ndapewa Nangolo',
    'Magistrate T. Amukoto','','2026-10-01','Documentary evidence submission',adminId,'2023-02-02','2023-02-02');
  insertCase.run('78e852c8-fb8a-43b7-ab93-f64dc5784cf0','MOJ-2023-0400','Plessis v. Amupolo','Personal injury claim.',
    'Civil','Pending','Medium','Marlene du Plessis','Palesa Amupolo',
    'Magistrate T. Amukoto','','2026-09-09','Awaiting defendant response',adminId,'2024-04-21','2024-04-21');
  insertCase.run('380338a6-ea3f-4c12-8254-385b8dc1b391','MOJ-2024-0401','State v. Haihambo','Unlawful termination of employment charge filed in Oshakati.',
    'Criminal','Open','Low','State of Namibia','Kauari Haihambo',
    'Magistrate S. Iipumbu','','2026-08-24','Settlement negotiations',adminId,'2025-04-13','2025-04-13');
  insertCase.run('a1309210-b61b-43d5-8954-0e2bbc07bff8','MOJ-2025-0402','Nghifindaka v. Angula','Workplace harassment.',
    'Labour','Open','Medium','Nakale Nghifindaka','Iiyambo Angula',
    'Senior Magistrate J. Botha','','2026-11-11','Awaiting defendant response',adminId,'2026-01-19','2026-01-19');
  insertCase.run('056ec0e6-fcac-49df-ae0f-e2d19afc0610','MOJ-2025-0403','Louw v. Namibia','Unfair dismissal claim.',
    'Labour','Pending','Medium','Haimbodi Louw','State of Namibia',
    'Magistrate T. Amukoto','','2026-09-03','Cross-examination',adminId,'2025-06-07','2025-06-07');
  insertCase.run('1d6635d7-840d-4895-a50b-85a88f0f8a3f','MOJ-2024-0404','Iipumbu v. Nkosi','Guardianship dispute matter.',
    'Family','Active','High','Haufiku Iipumbu','Danie Nkosi',
    'Magistrate L. Shikongo','','2026-10-05','Postponed — date TBD',adminId,'2025-04-17','2025-04-17');
  insertCase.run('c481d189-3048-47b7-99d7-d6dc8699175f','MOJ-2024-0405','State v. Amukoto','Driving under the influence charge filed in Katutura.',
    'Criminal','Pending','Medium','State of Namibia','Nghifikepunye Amukoto',
    'Magistrate P. Nghifindaka','','2026-10-23','Plea entry',adminId,'2025-03-27','2025-03-27');
  insertCase.run('2f93440b-64a9-4fe1-85ab-952aaacb63a4','MOJ-2026-0406','Niipare v. Kapuka','Commercial lease dispute.',
    'Commercial','Open','Medium','Angula Niipare','Palesa Kapuka',
    'Magistrate T. Amukoto','','2026-10-12','Plea entry',adminId,'2026-03-03','2026-03-03');
  insertCase.run('6e6a5206-9950-44b6-a5d0-8dc1975d974c','MOJ-2025-0407','Amupolo v. Nakale','Unpaid invoice dispute.',
    'Commercial','Open','Low','Angula Amupolo','Angula Nakale',
    'Magistrate R. Kauari','','2026-06-30','Mediation session',adminId,'2025-05-29','2025-05-29');
  insertCase.run('3c96cb8c-c7c6-49b4-9a1e-428caad5c2fc','MOJ-2025-0408','State v. Mostert','Fraud charge filed in Rundu.',
    'Criminal','Open','Low','State of Namibia','Palesa Mostert',
    'Magistrate L. Shikongo','','2026-06-28','Mediation session',adminId,'2026-05-13','2026-05-13');
  insertCase.run('028edc63-d4e3-4592-b32b-792e46724b10','MOJ-2026-0409','State v. Kauari','Contempt of court charge filed in Walvis Bay.',
    'Criminal','Open','Low','State of Namibia','Petrus Kauari',
    'Magistrate R. Kauari','','2026-07-27','Witness testimony',adminId,'2026-05-07','2026-05-07');
  insertCase.run('feaeb552-17db-42f4-8ba7-2311c20b5f19','MOJ-2025-0410','Jacobs v. Pieterse','Discrimination complaint.',
    'Labour','Closed','Low','Nico Jacobs','Ndapewa Pieterse',
    'Magistrate S. Iipumbu','','2026-01-20','Documentary evidence submission',adminId,'2026-03-08','2026-03-08');
  insertCase.run('0fc99e71-8baa-4313-9e13-f06c41e0845a','MOJ-2025-0411','Mthembu v. Coetzee','IP infringement.',
    'Commercial','Closed','Low','Amukoto Mthembu','Johan Coetzee',
    'Magistrate T. Amukoto','','2025-05-08','Final arguments',adminId,'2026-01-01','2026-01-01');
  insertCase.run('271a61a1-580c-47f1-ab7f-99faba67d454','MOJ-2024-0412','Iiyambo v. Iipumbu','Workplace harassment.',
    'Labour','Active','Medium','Mukuve Iiyambo','Sbu Iipumbu',
    'Magistrate S. Iipumbu','','2026-06-12','Mediation session',adminId,'2024-11-18','2024-11-18');
  insertCase.run('92fb3449-a448-45eb-99fc-ef039a9e8cf7','MOJ-2023-0413','Ndlovu v. Mthembu','Property boundary dispute.',
    'Civil','Open','Medium','Shilongo Ndlovu','Ndapewa Mthembu',
    'Magistrate N. Nakale','','2026-07-14','Legal aid assessment',adminId,'2023-01-08','2023-01-08');
  insertCase.run('630dbbe8-bb5b-4380-bc21-0579c184bcfc','MOJ-2023-0414','Nakale v. Bay','Workplace harassment.',
    'Labour','Closed','Medium','Lerato Nakale','City of Walvis Bay',
    'Magistrate S. Iipumbu','','2023-05-08','Final arguments',adminId,'2023-02-15','2023-02-15');
  insertCase.run('4bda392d-091b-4e7d-8f5e-32b9c6965bba','MOJ-2023-0415','State v. Iiyambo','Arson charge filed in Rundu.',
    'Criminal','Active','Medium','State of Namibia','Anna Iiyambo',
    'Magistrate T. Amukoto','','2026-07-31','Mediation session',adminId,'2023-09-07','2023-09-07');
  insertCase.run('ef6118a3-a3a2-4c46-8ba6-7dc36370ba85','MOJ-2026-0416','Merwe v. Iiyambo','Defamation suit.',
    'Civil','Open','High','Nghifindaka van der Merwe','Amukoto Iiyambo',
    'Magistrate S. Iipumbu','','2026-08-05','Postponed — date TBD',adminId,'2026-02-04','2026-02-04');
  insertCase.run('45b356f1-07c8-4f60-80c3-5ff94b6381f2','MOJ-2026-0417','Iiyambo v. Pieterse','Eviction proceeding.',
    'Civil','Pending','Medium','Nangolo Iiyambo','Lerato Pieterse',
    'Magistrate S. Iipumbu','','2026-08-11','Legal aid assessment',adminId,'2026-04-30','2026-04-30');
  insertCase.run('262eefac-c7dc-4350-858e-9a8601c4746b','MOJ-2024-0418','Shikongo v. Shaanika','Workplace harassment.',
    'Labour','Active','Medium','Amupolo Shikongo','Thabo Shaanika',
    'Magistrate S. Iipumbu','','2026-11-12','Cross-examination',adminId,'2024-01-01','2024-01-01');
  insertCase.run('bb669d99-76e1-4d14-9e85-3c6c0b607637','MOJ-2025-0419','State v. Iiyambo','Fraud charge filed in Oshakati.',
    'Criminal','Closed','High','State of Namibia','Niipare Iiyambo',
    'Magistrate P. Nghifindaka','','2025-09-12','Judgment delivery',adminId,'2025-12-16','2025-12-16');
  insertCase.run('635c0bdb-b3f5-4340-8571-76ad23a14380','MOJ-2026-0420','Coetzee v. Nakale','Maintenance order matter.',
    'Family','Open','Low','Johan Coetzee','Zanele Nakale',
    'Magistrate T. Amukoto','','2026-07-17','Witness testimony',adminId,'2026-02-03','2026-02-03');
  insertCase.run('0596b4fb-f54c-46e4-8359-7b55d876b49f','MOJ-2023-0421','State v. Jacobs','Public disturbance charge filed in Katutura.',
    'Criminal','Pending','High','State of Namibia','Sbu Jacobs',
    'Senior Magistrate J. Botha','','2026-10-31','Judgment delivery',adminId,'2023-11-16','2023-11-16');
  insertCase.run('86858631-b078-425a-92ad-1538eb4215d5','MOJ-2023-0422','State v. Tshabalala','Child maintenance default charge filed in Rundu.',
    'Criminal','Open','High','State of Namibia','Andile Tshabalala',
    'Magistrate T. Amukoto','','2026-11-12','Cross-examination',adminId,'2024-02-15','2024-02-15');
  insertCase.run('f3fbb18a-208e-4278-a683-9222548332b2','MOJ-2026-0423','Pieterse v. Nangolo','Divorce and child custody matter.',
    'Family','Closed','Low','Danie Pieterse','Gerhard Nangolo',
    'Magistrate A. Haihambo','','2026-01-19','Judgment delivery',adminId,'2026-01-11','2026-01-11');
  insertCase.run('e690946f-c032-467f-8a55-9e5e32896529','MOJ-2024-0424','Kauari v. Nghidinwa','Commercial lease dispute.',
    'Commercial','Open','Medium','Iipumbu Kauari','Niipare Nghidinwa',
    'Magistrate P. Nghifindaka','','2026-07-17','Pre-trial conference',adminId,'2024-11-16','2024-11-16');
  insertCase.run('3b99511d-5fba-4c47-8115-e0d49e5e645c','MOJ-2025-0425','Amukoto v. Fourie','Discrimination complaint.',
    'Labour','Closed','High','Iipumbu Amukoto','Hamukwaya Fourie',
    'Magistrate T. Amukoto','','2025-04-03','Mediation session',adminId,'2026-02-10','2026-02-10');
  insertCase.run('aca5293d-6f9a-4341-b3c5-69d76fcb5f12','MOJ-2025-0426','Wyk v. Mwatotele','Maintenance order matter.',
    'Family','Pending','Medium','Nghifikepunye van Wyk','Anna Mwatotele',
    'Magistrate S. Iipumbu','','2026-11-11','Plea entry',adminId,'2026-01-27','2026-01-27');
  insertCase.run('ea7ed323-bf1d-447b-aed6-10b7a3b883d5','MOJ-2024-0427','Botha v. Dlamini','Commercial lease dispute.',
    'Commercial','Closed','Medium','Kapuka Botha','Nangolo Dlamini',
    'Magistrate S. Iipumbu','','2025-05-06','Cross-examination',adminId,'2024-08-17','2024-08-17');
  insertCase.run('e71e9623-6093-4373-b54a-e463a8adde98','MOJ-2025-0428','State v. Niipare','Kidnapping charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Niipare Niipare',
    'Magistrate P. Nghifindaka','','2026-06-07','Settlement negotiations',adminId,'2025-06-11','2025-06-11');
  insertCase.run('c8da460f-3598-4802-8b31-0d78b3de8749','MOJ-2024-0429','State v. Hamukwaya','Driving under the influence charge filed in Katutura.',
    'Criminal','Open','High','State of Namibia','Josef Hamukwaya',
    'Magistrate S. Iipumbu','','2026-08-08','Mediation session',adminId,'2024-03-11','2024-03-11');
  insertCase.run('33202732-b560-4e8c-96fc-25909ed66bb9','MOJ-2025-0430','Nakale v. Niipare','Eviction proceeding.',
    'Civil','Open','High','Francois Nakale','Shaanika Niipare',
    'Magistrate P. Nghifindaka','','2026-08-24','Postponed — date TBD',adminId,'2025-02-09','2025-02-09');
  insertCase.run('64ce5bbb-1782-4a8c-866d-042c62b4d746','MOJ-2023-0431','Kauari v. Roux','Personal injury claim.',
    'Civil','Open','High','Nghifikepunye Kauari','Riaan le Roux',
    'Magistrate T. Amukoto','','2026-08-26','Final arguments',adminId,'2023-01-29','2023-01-29');
  insertCase.run('b3e4ef6a-3652-483b-920b-4d302ec63599','MOJ-2023-0432','Agency v. Jacobs','IP infringement.',
    'Commercial','Open','Medium','Namibia Revenue Agency','Nico Jacobs',
    'Magistrate L. Shikongo','','2026-10-24','Legal aid assessment',adminId,'2023-10-04','2023-10-04');
  insertCase.run('0cdf021a-4f2e-4222-b118-251525a304f7','MOJ-2026-0433','State v. Molefe','Assault (grievous bodily harm) charge filed in Walvis Bay.',
    'Criminal','Open','High','State of Namibia','Thandeka Molefe',
    'Magistrate A. Haihambo','','2026-07-09','Final arguments',adminId,'2026-04-11','2026-04-11');
  insertCase.run('bbac9827-428a-4f74-a51a-f6e253339b63','MOJ-2023-0434','Iiyambo v. Namibia','Commercial lease dispute.',
    'Commercial','Active','Low','Kauari Iiyambo','FNB Namibia',
    'Magistrate N. Nakale','','2026-07-05','Judgment delivery',adminId,'2023-08-11','2023-08-11');
  insertCase.run('323b2290-0d93-4e2a-b041-4e61fe0eb7df','MOJ-2024-0435','Ltd v. Nghifindaka','Defamation suit.',
    'Civil','Open','Medium','NHE Ltd','Haimbodi Nghifindaka',
    'Magistrate N. Nakale','','2026-10-27','Legal aid assessment',adminId,'2024-12-16','2024-12-16');
  insertCase.run('438094e3-2f6d-459f-a5e2-0c49d9469bd3','MOJ-2025-0436','Amupolo v. Mahlangu','Debt recovery.',
    'Civil','Active','Medium','Angula Amupolo','Angula Mahlangu',
    'Magistrate L. Shikongo','','2026-07-15','Final arguments',adminId,'2025-06-06','2025-06-06');
  insertCase.run('f1b33220-b381-450c-a752-1fe3fed3665b','MOJ-2024-0437','Holdings v. Mthembu','Eviction proceeding.',
    'Civil','Closed','Medium','TransNamib Holdings','Andile Mthembu',
    'Magistrate R. Kauari','','2025-03-12','Final arguments',adminId,'2025-01-07','2025-01-07');
  insertCase.run('811b2af0-1eb4-418b-add0-cf3cba59fd31','MOJ-2025-0438','State v. Swanepoel','Drug possession charge filed in Oshakati.',
    'Criminal','Active','Low','State of Namibia','Petrus Swanepoel',
    'Magistrate A. Haihambo','','2026-06-07','Cross-examination',adminId,'2025-08-30','2025-08-30');
  insertCase.run('d999c498-b8e7-4d77-b226-8d443f7291a7','MOJ-2025-0439','Botha v. Steyn','Wage dispute.',
    'Labour','Pending','Medium','Haihambo Botha','Andile Steyn',
    'Magistrate L. Shikongo','','2026-11-18','Plea entry',adminId,'2025-10-26','2025-10-26');
  insertCase.run('dbb54bcc-9b2d-491d-ba81-c7574dee8d31','MOJ-2025-0440','State v. Mukuve','Public disturbance charge filed in Windhoek.',
    'Criminal','Active','Low','State of Namibia','Hamukwaya Mukuve',
    'Magistrate T. Amukoto','','2026-08-10','Plea entry',adminId,'2025-12-05','2025-12-05');
  insertCase.run('24cd6682-4342-40be-b56a-ba6c036aaf0e','MOJ-2026-0441','Agency v. Iiyambo','Property boundary dispute.',
    'Civil','Active','Low','Namibia Revenue Agency','Shikongo Iiyambo',
    'Magistrate S. Iipumbu','','2026-06-24','Cross-examination',adminId,'2026-05-17','2026-05-17');
  insertCase.run('0c69c1a6-427c-41f1-bf6b-a16898552080','MOJ-2025-0442','Nghidinwa v. Mthembu','Adoption proceeding matter.',
    'Family','Active','High','Maria Nghidinwa','Danie Mthembu',
    'Magistrate R. Kauari','','2026-08-31','Witness testimony',adminId,'2025-06-27','2025-06-27');
  insertCase.run('4ae9a37f-48df-48e3-a713-251e3df8d397','MOJ-2023-0443','Pretorius v. Wyk','Debt recovery.',
    'Civil','Active','Low','Hamukwaya Pretorius','Pieter van Wyk',
    'Magistrate A. Haihambo','','2026-08-28','Sentencing hearing',adminId,'2023-03-19','2023-03-19');
  insertCase.run('f51972eb-b659-4600-8b57-f38f300b0c5c','MOJ-2024-0444','Pretorius v. Hamukwaya','Commercial lease dispute.',
    'Commercial','Open','Medium','Uuyuni Pretorius','Thandeka Hamukwaya',
    'Magistrate N. Nakale','','2026-11-03','Bail application',adminId,'2025-04-10','2025-04-10');
  insertCase.run('d3b80a28-75ab-4905-bb3c-5797fb08bdbc','MOJ-2024-0445','State v. Kamati','Malicious damage to property charge filed in Khomasdal.',
    'Criminal','Active','Medium','State of Namibia','Kamati Kamati',
    'Magistrate N. Nakale','','2026-07-09','Expert witness testimony',adminId,'2025-05-14','2025-05-14');
  insertCase.run('961e1cb8-ee61-4a30-abb3-bde65786e41f','MOJ-2023-0446','State v. Barnard','Breach of contract charge filed in Rundu.',
    'Criminal','Active','Medium','State of Namibia','Haimbodi Barnard',
    'Magistrate L. Shikongo','','2026-09-15','Final arguments',adminId,'2023-06-13','2023-06-13');
  insertCase.run('8ab4451e-2c96-4056-9699-a5e140ce430e','MOJ-2025-0447','State v. Shaanika','Money laundering charge filed in Khomasdal.',
    'Criminal','Closed','Medium','State of Namibia','Haufiku Shaanika',
    'Magistrate T. Amukoto','','2025-01-14','Mediation session',adminId,'2025-04-05','2025-04-05');
  insertCase.run('f77a9dd9-e4c6-4c6c-8742-fa45d1defc08','MOJ-2024-0448','Bay v. Merwe','Defamation suit.',
    'Civil','Open','Low','City of Walvis Bay','Kauari van der Merwe',
    'Magistrate S. Iipumbu','','2026-10-02','Documentary evidence submission',adminId,'2024-12-18','2024-12-18');
  insertCase.run('2dc28652-4669-4703-9bf2-898c977636de','MOJ-2024-0449','Namibia v. Khumalo','Unpaid invoice dispute.',
    'Commercial','Active','High','State of Namibia','Haimbodi Khumalo',
    'Magistrate R. Kauari','','2026-07-29','Mediation session',adminId,'2024-04-08','2024-04-08');
  insertCase.run('8afe8c35-5ea8-44f3-bff5-41406a042c76','MOJ-2024-0450','Nghifindaka v. Mwatotele','Retrenchment challenge.',
    'Labour','Closed','High','Marlene Nghifindaka','Johan Mwatotele',
    'Magistrate S. Iipumbu','','2025-03-30','Settlement negotiations',adminId,'2024-08-22','2024-08-22');
  insertCase.run('1c78bc0d-3b1b-4d47-a130-9fcd522dd2bf','MOJ-2023-0451','State v. Angula','Possession of stolen goods charge filed in Rundu.',
    'Criminal','Active','High','State of Namibia','Haihambo Angula',
    'Magistrate L. Shikongo','','2026-08-03','Expert witness testimony',adminId,'2024-05-24','2024-05-24');
  insertCase.run('2a607eba-fc8f-4d29-a829-caaaf0cf20e7','MOJ-2026-0452','State v. Fourie','Contravening by-law charge filed in Khomasdal.',
    'Criminal','Open','Medium','State of Namibia','Shikongo Fourie',
    'Senior Magistrate J. Botha','','2026-08-14','Plea entry',adminId,'2026-03-19','2026-03-19');
  insertCase.run('b11a1c1b-ebb8-447e-bb42-123e062c0c82','MOJ-2023-0453','State v. Roux','Unlawful possession of firearm charge filed in Rundu.',
    'Criminal','Active','High','State of Namibia','Francois le Roux',
    'Magistrate T. Amukoto','','2026-06-30','Postponed — date TBD',adminId,'2023-09-14','2023-09-14');
  insertCase.run('5900296f-d549-406a-860d-477be9879b30','MOJ-2026-0454','Louw v. Niipare','Maintenance order matter.',
    'Family','Active','Low','Pieter Louw','Anna Niipare',
    'Magistrate R. Kauari','','2026-09-26','Cross-examination',adminId,'2026-02-21','2026-02-21');
  insertCase.run('9c15d5ee-ba60-4a1a-a5dc-034781af9055','MOJ-2023-0455','State v. Wyk','Arson charge filed in Oshakati.',
    'Criminal','Closed','High','State of Namibia','Eino van Wyk',
    'Magistrate S. Iipumbu','','2023-12-29','Documentary evidence submission',adminId,'2023-09-26','2023-09-26');
  insertCase.run('17261a69-9fb7-4570-99a9-1a17d11c35c0','MOJ-2026-0456','Roux v. Barnard','Partnership dissolution.',
    'Commercial','Open','Medium','Francois le Roux','Haimbodi Barnard',
    'Magistrate S. Iipumbu','','2026-07-13','Pre-trial conference',adminId,'2026-02-08','2026-02-08');
  insertCase.run('21f875d2-076e-47ec-a1c5-846b3cc7f557','MOJ-2026-0457','Namibia v. Haihambo','Debt recovery.',
    'Civil','Closed','Medium','Telecom Namibia','Sipho Haihambo',
    'Magistrate T. Amukoto','','2026-02-21','Expert witness testimony',adminId,'2026-02-03','2026-02-03');
  insertCase.run('3aa737ca-cfd5-4135-8dec-4effffe5cae3','MOJ-2023-0458','Mwatotele v. Iiyambo','Workplace harassment.',
    'Labour','Open','Medium','Pieter Mwatotele','Marlene Iiyambo',
    'Senior Magistrate J. Botha','','2026-09-23','Cross-examination',adminId,'2023-07-29','2023-07-29');
  insertCase.run('73822348-bdc9-40c0-abc0-1f6eea263bca','MOJ-2024-0459','State v. Botha','Extortion charge filed in Oshakati.',
    'Criminal','Open','Medium','State of Namibia','Nico Botha',
    'Magistrate L. Shikongo','','2026-06-11','Awaiting defendant response',adminId,'2024-06-27','2024-06-27');
  insertCase.run('284acabe-9fc2-45c1-bf81-930339aeb916','MOJ-2025-0460','Haufiku v. Shaanika','Adoption proceeding matter.',
    'Family','Open','Low','Lerato Haufiku','Palesa Shaanika',
    'Magistrate T. Amukoto','','2026-07-17','Plea entry',adminId,'2026-05-24','2026-05-24');
  insertCase.run('2a18c824-6577-46fd-bd3b-6367c1975067','MOJ-2024-0461','Tshabalala v. Klerk','Retrenchment challenge.',
    'Labour','Closed','Medium','Anna Tshabalala','Nandi de Klerk',
    'Magistrate L. Shikongo','','2024-06-02','Documentary evidence submission',adminId,'2025-01-28','2025-01-28');
  insertCase.run('c4ebe37d-3b05-4478-9dfa-f6928aa257e3','MOJ-2025-0462','Swanepoel v. Jacobs','Unfair dismissal claim.',
    'Labour','Open','Low','Haihambo Swanepoel','Angula Jacobs',
    'Magistrate A. Haihambo','','2026-09-15','Legal aid assessment',adminId,'2025-09-27','2025-09-27');
  insertCase.run('5e51866d-3ff7-4957-812f-da6bf7b8a526','MOJ-2023-0463','Nangolo v. Radebe','Wage dispute.',
    'Labour','Closed','Medium','Sbu Nangolo','Angula Radebe',
    'Magistrate N. Nakale','','2023-06-12','Pre-trial conference',adminId,'2024-03-10','2024-03-10');
  insertCase.run('6382f38c-a177-45e5-9919-16e797eaf2f6','MOJ-2026-0464','Ndlovu v. Ltd','Unfair dismissal claim.',
    'Labour','Closed','Medium','Sipho Ndlovu','NHE Ltd',
    'Magistrate P. Nghifindaka','','2026-02-19','Postponed — date TBD',adminId,'2026-03-16','2026-03-16');
  insertCase.run('394648f4-e18f-49e3-b297-d515a4096fec','MOJ-2026-0465','Steyn v. Barnard','Partnership dissolution.',
    'Commercial','Open','Medium','Shaanika Steyn','Nandi Barnard',
    'Magistrate S. Iipumbu','','2026-06-04','Judgment delivery',adminId,'2026-02-24','2026-02-24');
  insertCase.run('de065219-f1f7-420d-b3a9-bbf85ddaa633','MOJ-2025-0466','State v. Dlamini','Kidnapping charge filed in Katutura.',
    'Criminal','Open','Medium','State of Namibia','Angula Dlamini',
    'Magistrate S. Iipumbu','','2026-10-25','Plea entry',adminId,'2026-01-06','2026-01-06');
  insertCase.run('943f7f20-e7b0-44b0-abb7-ae93841f4b14','MOJ-2024-0467','Kapuka v. Iipumbu','Maintenance order matter.',
    'Family','Closed','Medium','Johan Kapuka','Thandeka Iipumbu',
    'Senior Magistrate J. Botha','','2025-02-12','Expert witness testimony',adminId,'2024-08-30','2024-08-30');
  insertCase.run('7d943bd4-fc81-4e1a-a2d4-50518d018bf2','MOJ-2025-0468','Wyk v. Angula','Unfair dismissal claim.',
    'Labour','Closed','High','Nakale van Wyk','Iipumbu Angula',
    'Magistrate L. Shikongo','','2025-06-03','Settlement negotiations',adminId,'2025-09-24','2025-09-24');
  insertCase.run('2c8c6c40-83a2-4d66-b40d-86a3bf029c6c','MOJ-2025-0469','Nghidinwa v. Fourie','Adoption proceeding matter.',
    'Family','Open','Medium','Eino Nghidinwa','Uuyuni Fourie',
    'Magistrate A. Haihambo','','2026-08-27','Settlement negotiations',adminId,'2025-01-16','2025-01-16');
  insertCase.run('3781066b-55fe-4529-affe-63931b1fc3fe','MOJ-2026-0470','State v. Kauari','Assault (grievous bodily harm) charge filed in Walvis Bay.',
    'Criminal','Pending','Low','State of Namibia','Kobus Kauari',
    'Magistrate A. Haihambo','','2026-06-10','Postponed — date TBD',adminId,'2026-03-22','2026-03-22');
  insertCase.run('5034fd29-ca90-415b-bbf3-406015e79654','MOJ-2024-0471','Tshabalala v. Roux','Maintenance order matter.',
    'Family','Active','Medium','Riaan Tshabalala','Johan le Roux',
    'Magistrate P. Nghifindaka','','2026-07-16','Judgment delivery',adminId,'2024-06-03','2024-06-03');
  insertCase.run('24e9f23b-72f6-400f-a433-b9a248dfc7f9','MOJ-2023-0472','Nangolo v. Mahlangu','Unfair dismissal claim.',
    'Labour','Pending','Medium','Kapuka Nangolo','Anna Mahlangu',
    'Magistrate P. Nghifindaka','','2026-10-03','Legal aid assessment',adminId,'2024-04-17','2024-04-17');
  insertCase.run('40fd66fa-4ee2-4e77-94f6-7fba9650e637','MOJ-2024-0473','Barnard v. Haufiku','Eviction proceeding.',
    'Civil','Closed','Low','Sipho Barnard','Johan Haufiku',
    'Senior Magistrate J. Botha','','2025-03-18','Plea entry',adminId,'2024-12-31','2024-12-31');
  insertCase.run('0284d0c0-65bb-407b-a85f-f2dd2c1afdb1','MOJ-2026-0474','State v. Grobler','Reckless driving charge filed in Katutura.',
    'Criminal','Open','Medium','State of Namibia','Gerhard Grobler',
    'Magistrate L. Shikongo','','2026-11-12','Pre-trial conference',adminId,'2026-03-21','2026-03-21');
  insertCase.run('8b38d08a-f908-48a9-857f-dba5d8df4d0f','MOJ-2025-0475','Namibia v. Nkosi','Eviction proceeding.',
    'Civil','Pending','Medium','Telecom Namibia','Riaan Nkosi',
    'Senior Magistrate J. Botha','','2026-08-10','Awaiting defendant response',adminId,'2025-03-02','2025-03-02');
  insertCase.run('1d649cb3-b024-4ec4-a145-2c5822d1db7d','MOJ-2023-0476','Pieterse v. Shaanika','Defamation suit.',
    'Civil','Pending','Medium','Lerato Pieterse','Danie Shaanika',
    'Magistrate S. Iipumbu','','2026-08-13','Bail application',adminId,'2023-03-14','2023-03-14');
  insertCase.run('a6a21d72-6dbc-4136-bc8e-ee507faa6f3b','MOJ-2026-0477','State v. Jacobs','Assault (grievous bodily harm) charge filed in Walvis Bay.',
    'Criminal','Open','Low','State of Namibia','Eino Jacobs',
    'Senior Magistrate J. Botha','','2026-06-29','Expert witness testimony',adminId,'2026-01-13','2026-01-13');
  insertCase.run('082055ad-47ad-414a-8430-3129fa8ce15b','MOJ-2026-0478','State v. Klerk','Extortion charge filed in Oshakati.',
    'Criminal','Closed','High','State of Namibia','Nghidinwa de Klerk',
    'Magistrate S. Iipumbu','','2026-02-20','Bail application',adminId,'2026-03-27','2026-03-27');
  insertCase.run('54020390-4869-4c8d-a0b3-aa788d8d425b','MOJ-2026-0479','State v. Roux','Breach of contract charge filed in Walvis Bay.',
    'Criminal','Open','High','State of Namibia','Nghidinwa le Roux',
    'Magistrate T. Amukoto','','2026-11-13','Cross-examination',adminId,'2026-03-21','2026-03-21');
  insertCase.run('4e9b3e75-82de-40a4-86ed-3b373dbc19b5','MOJ-2024-0480','Haihambo v. Dlamini','Property boundary dispute.',
    'Civil','Open','Medium','Anna Haihambo','Nghifindaka Dlamini',
    'Magistrate S. Iipumbu','','2026-11-19','Plea entry',adminId,'2024-04-03','2024-04-03');
  insertCase.run('777dc458-2f83-44ca-bb57-15d3a8fb66a1','MOJ-2026-0481','State v. Radebe','Money laundering charge filed in Oshakati.',
    'Criminal','Active','High','State of Namibia','Niipare Radebe',
    'Senior Magistrate J. Botha','','2026-08-13','Settlement negotiations',adminId,'2026-02-13','2026-02-13');
  insertCase.run('4b2d46b8-120c-4929-b0e0-ed19d3f0d529','MOJ-2023-0482','Haihambo v. Mthembu','Commercial lease dispute.',
    'Commercial','Closed','Low','Uuyuni Haihambo','Haimbodi Mthembu',
    'Magistrate S. Iipumbu','','2023-02-06','Judgment delivery',adminId,'2023-11-29','2023-11-29');
  insertCase.run('ffc7c35b-43dc-4362-bf92-683dd0d6c3e4','MOJ-2024-0483','Nghifindaka v. Angula','Wage dispute.',
    'Labour','Active','Low','Nghifikepunye Nghifindaka','Petrus Angula',
    'Magistrate S. Iipumbu','','2026-10-31','Sentencing hearing',adminId,'2025-02-20','2025-02-20');
  insertCase.run('ae7438f9-8c14-4dae-9e45-f70858c84bd1','MOJ-2023-0484','Barnard v. Mwatotele','Unfair dismissal claim.',
    'Labour','Open','High','Francois Barnard','Nandi Mwatotele',
    'Magistrate S. Iipumbu','','2026-09-23','Judgment delivery',adminId,'2023-02-19','2023-02-19');
  insertCase.run('3a1bebfc-a1d1-4564-914c-18b66798ca33','MOJ-2026-0485','Nghidinwa v. Klerk','Maintenance order matter.',
    'Family','Active','Low','Haufiku Nghidinwa','Sipho de Klerk',
    'Magistrate T. Amukoto','','2026-10-28','Sentencing hearing',adminId,'2026-02-05','2026-02-05');
  insertCase.run('2d6f3ca7-7452-4cd6-8bc4-275cf87a5afd','MOJ-2025-0486','Barnard v. Merwe','Partnership dissolution.',
    'Commercial','Pending','High','Mwatotele Barnard','Nghifikepunye van der Merwe',
    'Magistrate P. Nghifindaka','','2026-08-22','Sentencing hearing',adminId,'2025-12-15','2025-12-15');
  insertCase.run('15353f26-5d1f-4905-a872-2d5b4bae86ed','MOJ-2023-0487','State v. Iiyambo','Assault (common) charge filed in Windhoek.',
    'Criminal','Pending','High','State of Namibia','Josef Iiyambo',
    'Magistrate R. Kauari','','2026-06-17','Settlement negotiations',adminId,'2023-05-31','2023-05-31');
  insertCase.run('45784673-6e02-4fee-951f-c8c4f6f9ae0e','MOJ-2025-0488','State v. Amukoto','Tax evasion charge filed in Khomasdal.',
    'Criminal','Closed','Medium','State of Namibia','Shilongo Amukoto',
    'Magistrate L. Shikongo','','2025-12-26','Sentencing hearing',adminId,'2025-08-10','2025-08-10');
  insertCase.run('ff1ec74c-6b3a-4a0c-9759-7f3f31f2352e','MOJ-2026-0489','Kauari v. Ltd','Unpaid invoice dispute.',
    'Commercial','Pending','Medium','Josef Kauari','NHE Ltd',
    'Magistrate R. Kauari','','2026-07-20','Cross-examination',adminId,'2026-02-05','2026-02-05');
  insertCase.run('72310e08-afd6-4f0e-9c02-29aa2fdf63f2','MOJ-2024-0490','State v. Nghifindaka','Fraud charge filed in Windhoek.',
    'Criminal','Open','Low','State of Namibia','Hamukwaya Nghifindaka',
    'Magistrate R. Kauari','','2026-10-04','Postponed — date TBD',adminId,'2025-03-29','2025-03-29');
  insertCase.run('7ecba652-c0a5-4b76-9cf9-5b41c44aab1c','MOJ-2024-0491','Amupolo v. Visser','IP infringement.',
    'Commercial','Closed','High','Iipumbu Amupolo','Sifiso Visser',
    'Magistrate N. Nakale','','2024-08-20','Pre-trial conference',adminId,'2024-04-02','2024-04-02');
  insertCase.run('58a7ce8c-e068-4c57-bfed-086b9eac455b','MOJ-2026-0492','Namibia v. Iipumbu','Defamation suit.',
    'Civil','Closed','Medium','State of Namibia','Nakale Iipumbu',
    'Magistrate N. Nakale','','2026-04-04','Expert witness testimony',adminId,'2026-05-20','2026-05-20');
  insertCase.run('0526c082-bcc3-4fc7-b93d-26a17b659679','MOJ-2026-0493','State v. Mokoena','Driving under the influence charge filed in Walvis Bay.',
    'Criminal','Open','Medium','State of Namibia','Angula Mokoena',
    'Senior Magistrate J. Botha','','2026-10-13','Judgment delivery',adminId,'2026-01-21','2026-01-21');
  insertCase.run('f64bd564-f8e9-4702-b5c4-437cd093495a','MOJ-2023-0494','Iipumbu v. Wyk','Defamation suit.',
    'Civil','Pending','Low','Amupolo Iipumbu','Nakale van Wyk',
    'Magistrate S. Iipumbu','','2026-06-04','Judgment delivery',adminId,'2024-02-03','2024-02-03');
  insertCase.run('1f7cb411-72d3-4ae0-a721-f9ee277ae395','MOJ-2026-0495','Kamati v. Jacobs','Guardianship dispute matter.',
    'Family','Closed','Medium','Kapuka Kamati','Sbu Jacobs',
    'Magistrate A. Haihambo','','2026-03-19','Mediation session',adminId,'2026-01-10','2026-01-10');
  insertCase.run('6deecf74-a55e-41ce-a5fc-218c33439082','MOJ-2023-0496','Louw v. Shaanika','Defamation suit.',
    'Civil','Closed','Low','Kobus Louw','Thandeka Shaanika',
    'Magistrate A. Haihambo','','2023-03-06','Cross-examination',adminId,'2023-02-12','2023-02-12');
  insertCase.run('fd5300d8-a14e-4bb2-bd06-88c79410bbd9','MOJ-2025-0497','State v. Mukuve','Breach of contract charge filed in Khomasdal.',
    'Criminal','Closed','Low','State of Namibia','Nico Mukuve',
    'Magistrate R. Kauari','','2026-01-14','Expert witness testimony',adminId,'2025-10-30','2025-10-30');
  insertCase.run('f4d5492f-f5d8-440d-ba78-de3d1abed1c8','MOJ-2024-0498','Mahlangu v. Kauari','Retrenchment challenge.',
    'Labour','Open','Low','Nangolo Mahlangu','Haufiku Kauari',
    'Magistrate S. Iipumbu','','2026-07-09','Documentary evidence submission',adminId,'2025-05-10','2025-05-10');
  insertCase.run('c5210131-5070-4814-9d20-b57c86eac608','MOJ-2024-0499','Jacobs v. Ndlovu','Unfair dismissal claim.',
    'Labour','Closed','Medium','Maria Jacobs','Haufiku Ndlovu',
    'Magistrate P. Nghifindaka','','2025-03-07','Pre-trial conference',adminId,'2025-01-10','2025-01-10');
  insertCase.run('4f0c8c58-7bb4-4a74-a25b-8d6d670c0337','MOJ-2026-0500','Mahlangu v. Nkosi','Workplace harassment.',
    'Labour','Active','High','Sbu Mahlangu','Nghifikepunye Nkosi',
    'Magistrate P. Nghifindaka','','2026-10-01','Plea entry',adminId,'2026-04-10','2026-04-10');

  insertLog.run('c4e8ebcd-ae38-44da-9a67-1b702642543a','b79026c4-52a6-4b01-b5f1-53b2503ae09c','Case Created','Case MOJ-2023-0001 opened.',adminId,'2023-03-13');
  insertLog.run('edbfc87e-f1ca-4de7-a4ae-e0d1560a8090','b8f8a2d5-2296-4685-91d2-441294bdc4de','Case Created','Case MOJ-2026-0002 opened.',adminId,'2026-05-10');
  insertLog.run('eb9deb9b-2ea9-4d63-a351-33fc123de87a','22108d2f-2f8c-4fd1-b87a-ccbe90002848','Case Created','Case MOJ-2026-0003 opened.',adminId,'2026-02-10');
  insertLog.run('92c63e59-6d8d-47ad-ad4f-069ee9b13ddd','3e2de5b6-cd44-4f40-97f2-b576adeba781','Case Created','Case MOJ-2023-0004 opened.',adminId,'2023-01-23');
  insertLog.run('4e9bc362-a89a-4bdb-a74c-efa33c8cab62','3e2de5b6-cd44-4f40-97f2-b576adeba781','Status Updated','Status changed to "Closed"',adminId,'2023-02-19');
  insertLog.run('e831d85e-2b8c-4b77-92c1-a6df0377d6e9','f934e824-3167-4ba4-8a44-5e58effa5eab','Case Created','Case MOJ-2025-0005 opened.',adminId,'2025-04-27');
  insertLog.run('67b25aa3-3332-424c-aa25-48b0071b6e1c','f934e824-3167-4ba4-8a44-5e58effa5eab','Status Updated','Status changed to "Closed"',adminId,'2025-05-24');
  insertLog.run('24ea4ad9-e459-4f21-bd8e-2080338668c7','0b149599-3a5b-4151-854f-dad992ffe729','Case Created','Case MOJ-2025-0006 opened.',adminId,'2025-05-17');
  insertLog.run('bfe7f768-159a-49cf-a315-3688e5bc2f4c','0b149599-3a5b-4151-854f-dad992ffe729','Status Updated','Status changed to "Active"',adminId,'2025-05-25');
  insertLog.run('f168f47c-6a24-4192-84d9-d8b9375bd4c6','4149da4d-c334-4a46-ad9f-fe3ae67f7fb8','Case Created','Case MOJ-2024-0007 opened.',adminId,'2024-06-15');
  insertLog.run('353d25eb-a247-4087-a774-3f1f5926be59','b6f0dd76-89fe-4bb2-a833-c3ab3eeb02c7','Case Created','Case MOJ-2025-0008 opened.',adminId,'2026-04-14');
  insertLog.run('0015838a-e5e5-4a91-9cb4-a897752ea1cd','b6f0dd76-89fe-4bb2-a833-c3ab3eeb02c7','Status Updated','Status changed to "Closed"',adminId,'2026-05-08');
  insertLog.run('4789eec6-7415-4f50-96e0-bfaab066d0b7','b65eb025-065b-4c38-83cc-d56ad2cae214','Case Created','Case MOJ-2026-0009 opened.',adminId,'2026-05-07');
  insertLog.run('d81c7cba-bc8c-4592-9611-8672a29c5434','70bac126-e8a4-4a0c-93ff-5e998ba9d476','Case Created','Case MOJ-2026-0010 opened.',adminId,'2026-01-30');
  insertLog.run('9e71b293-29b1-4563-a571-9afabc563720','2c149bf4-cf59-4806-9ddc-9d24b24d4f23','Case Created','Case MOJ-2026-0011 opened.',adminId,'2026-02-15');
  insertLog.run('23327d7b-bb91-4711-b846-eca1ad388171','2c149bf4-cf59-4806-9ddc-9d24b24d4f23','Status Updated','Status changed to "Active"',adminId,'2026-02-22');
  insertLog.run('28b0efec-5569-4bd7-a586-351e06e04932','2e4bad92-cda4-4f13-a7e8-5d5cf53ec319','Case Created','Case MOJ-2024-0012 opened.',adminId,'2024-06-14');
  insertLog.run('a59b1582-f6c4-464e-aad0-7c70a25c7af3','d066c827-7b50-4ab8-8762-a4aeb02eb513','Case Created','Case MOJ-2023-0013 opened.',adminId,'2023-09-30');
  insertLog.run('2e032568-56cd-4f88-957c-0869ebe58a4a','d066c827-7b50-4ab8-8762-a4aeb02eb513','Status Updated','Status changed to "Closed"',adminId,'2023-10-06');
  insertLog.run('14835d25-d4c6-453a-882c-b54eedf77c8f','82f3ca3c-04f3-46cb-a84c-969907e3bdbb','Case Created','Case MOJ-2025-0014 opened.',adminId,'2026-05-25');
  insertLog.run('c2ba71ab-140c-4953-8c6a-73326791b637','aa70e9b4-dd83-475e-8d0a-201624d45679','Case Created','Case MOJ-2025-0015 opened.',adminId,'2025-02-06');
  insertLog.run('3f662eea-5120-430c-9c9f-5b68190474ae','10a4f486-b5ea-47c7-a957-2d88ea03dfe1','Case Created','Case MOJ-2025-0016 opened.',adminId,'2025-09-06');
  insertLog.run('6e2c5b52-12a1-438d-80b1-6814ae409916','ec24ef98-8ffb-4fb6-a0e7-2a88b949718f','Case Created','Case MOJ-2026-0017 opened.',adminId,'2026-01-25');
  insertLog.run('cdc5427c-e176-4150-835c-78ea9f92565b','ec24ef98-8ffb-4fb6-a0e7-2a88b949718f','Status Updated','Status changed to "Closed"',adminId,'2026-02-15');
  insertLog.run('5c49dcc8-b6ce-427e-9142-f202a6c1b996','0b20a6bb-cbf0-4d6f-b10f-5c7baf0ed596','Case Created','Case MOJ-2023-0018 opened.',adminId,'2023-04-09');
  insertLog.run('0299ef72-c1a1-4159-b9c2-459bbb9ff512','202369ce-26f8-4430-8aa9-121c06442fd3','Case Created','Case MOJ-2026-0019 opened.',adminId,'2026-05-21');
  insertLog.run('a56621a2-b844-47f7-93fc-db7dcb05618d','97465117-eed0-4ffa-9338-37c86a4a512b','Case Created','Case MOJ-2026-0020 opened.',adminId,'2026-04-08');
  insertLog.run('dcb568b1-6e15-445e-b2cc-8f70a7371897','1f2cf78d-e162-4297-89ca-e02f74cdf64c','Case Created','Case MOJ-2026-0021 opened.',adminId,'2026-05-19');
  insertLog.run('3a0d1899-660d-489e-a411-34ebe28270c2','be46fd94-086a-4347-84bf-d8410c0c2834','Case Created','Case MOJ-2026-0022 opened.',adminId,'2026-01-18');
  insertLog.run('ad8e2c9d-df32-41d5-b5e7-784efe375c21','9af40853-8243-452a-87a5-0fc22baea3da','Case Created','Case MOJ-2024-0023 opened.',adminId,'2024-10-25');
  insertLog.run('6cd8aab0-5255-4163-8d41-c1a58bdcad7b','b77d235e-ee9a-49bb-bf5d-a9a910449e36','Case Created','Case MOJ-2025-0024 opened.',adminId,'2025-11-27');
  insertLog.run('453ab008-1e0c-4b42-91ee-ba23ee4bb8c4','b77d235e-ee9a-49bb-bf5d-a9a910449e36','Status Updated','Status changed to "Active"',adminId,'2025-12-01');
  insertLog.run('cf7d8e3a-ed8c-4e5c-8363-fe00bcac8a87','62360f8d-73a8-4eab-8249-9e87c815fa11','Case Created','Case MOJ-2023-0025 opened.',adminId,'2023-06-28');
  insertLog.run('85e24dd3-3624-4459-b61c-e82678918230','1dc3c4ca-4712-4cfe-9e75-3ef69b5a75c6','Case Created','Case MOJ-2025-0026 opened.',adminId,'2025-03-10');
  insertLog.run('b4608baa-2591-4f44-8e73-1c037f7603bc','c5de389e-74f2-40d0-9a5f-c00453fd3af2','Case Created','Case MOJ-2025-0027 opened.',adminId,'2025-11-21');
  insertLog.run('5fb934b9-f336-4aa4-b482-d46195f8e699','c5de389e-74f2-40d0-9a5f-c00453fd3af2','Status Updated','Status changed to "Closed"',adminId,'2025-11-23');
  insertLog.run('aaafdb1f-3129-4f12-9762-ebb8d5e1c560','888ccab4-d16b-4abd-a74d-89112051a328','Case Created','Case MOJ-2023-0028 opened.',adminId,'2024-01-15');
  insertLog.run('48a8dc85-2f55-4c34-929a-067e1c7feb9e','90782463-0085-4f78-8fe4-f69b466a6198','Case Created','Case MOJ-2024-0029 opened.',adminId,'2024-03-06');
  insertLog.run('3b515450-9a14-4aee-9945-6d2fa10cb4f5','90782463-0085-4f78-8fe4-f69b466a6198','Status Updated','Status changed to "Closed"',adminId,'2024-03-13');
  insertLog.run('42c87864-fc2f-4878-bea1-3b980a094064','befa178a-a040-42e7-8236-3254c1483dff','Case Created','Case MOJ-2024-0030 opened.',adminId,'2025-04-21');
  insertLog.run('39b65fb3-a086-4b59-918c-e8ee233326a9','7d657933-39de-490d-b439-70977348f7bf','Case Created','Case MOJ-2025-0031 opened.',adminId,'2026-02-08');
  insertLog.run('76b41982-db6b-4a30-a16d-029d4b857282','3163b26e-8a12-4a01-a3c2-c5d0c47086a3','Case Created','Case MOJ-2024-0032 opened.',adminId,'2024-05-22');
  insertLog.run('4ce405d7-17ad-457e-882e-1afa4e680f81','91e04c13-5148-4c81-ae01-121027f9a9da','Case Created','Case MOJ-2025-0033 opened.',adminId,'2026-05-08');
  insertLog.run('c0f3bfb1-02b3-4ab9-8b06-d3b5ec0f6219','44f2aa4c-e40e-4ff5-8a96-8454a082257b','Case Created','Case MOJ-2025-0034 opened.',adminId,'2025-10-23');
  insertLog.run('4a3c1e28-a448-4df4-9fd6-5f2e3b13122a','44f2aa4c-e40e-4ff5-8a96-8454a082257b','Status Updated','Status changed to "Active"',adminId,'2025-11-18');
  insertLog.run('80cb42a4-d106-453f-a5bd-19141a352a4b','f28eeb58-1b32-4b01-bb2d-7284c13ab260','Case Created','Case MOJ-2024-0035 opened.',adminId,'2024-06-09');
  insertLog.run('15782db6-4111-48de-bd08-8a66358aba48','f28eeb58-1b32-4b01-bb2d-7284c13ab260','Status Updated','Status changed to "Active"',adminId,'2024-06-20');
  insertLog.run('4f8e79e4-9a84-4be3-925a-eb0c87adbeca','83c8b0e4-608d-4f6f-9ff8-945fb840d505','Case Created','Case MOJ-2026-0036 opened.',adminId,'2026-04-08');
  insertLog.run('9d0fd41a-e167-4e8a-a2e7-210097ec63d8','ce07c78d-bde9-408a-8d18-d35da7968a25','Case Created','Case MOJ-2023-0037 opened.',adminId,'2023-10-24');
  insertLog.run('b1f63f17-6aaa-49b3-a4fb-ae0da0539746','ce07c78d-bde9-408a-8d18-d35da7968a25','Status Updated','Status changed to "Active"',adminId,'2023-11-19');
  insertLog.run('46ac53e1-f202-4225-8d8d-daf57bbdb5bf','12966f10-206e-45ea-a386-d52bea43531e','Case Created','Case MOJ-2024-0038 opened.',adminId,'2025-05-02');
  insertLog.run('e37e5dae-4bb3-4e64-947d-1eb231b5b17d','cc462655-308f-41e7-9002-be38b8982667','Case Created','Case MOJ-2023-0039 opened.',adminId,'2024-03-29');
  insertLog.run('e7cf549d-a621-4ed0-941a-d9c46f8e0da1','a6997262-5858-4e95-ba62-091b6f3ea052','Case Created','Case MOJ-2023-0040 opened.',adminId,'2024-02-16');
  insertLog.run('74f1541c-e2c1-4fa6-979b-54753d3789a4','a6997262-5858-4e95-ba62-091b6f3ea052','Status Updated','Status changed to "Closed"',adminId,'2024-03-17');
  insertLog.run('23ce0c9e-09b9-4eed-aaba-fc267b79991b','62357dc0-da0c-4b6f-8bf3-f8b754a078ae','Case Created','Case MOJ-2023-0041 opened.',adminId,'2024-04-01');
  insertLog.run('5e167e11-f6a6-49b5-ac97-9fc89ddd562d','517d0a29-aa08-4668-91d5-d8108849f483','Case Created','Case MOJ-2024-0042 opened.',adminId,'2024-11-22');
  insertLog.run('9cfb29d3-c025-49f0-a84e-b7ba50e34947','517d0a29-aa08-4668-91d5-d8108849f483','Status Updated','Status changed to "Active"',adminId,'2024-12-15');
  insertLog.run('3c130c19-549c-4d35-ae97-2896b572677e','2c35c0ef-d79c-46ed-a94f-3f4290aa3c95','Case Created','Case MOJ-2025-0043 opened.',adminId,'2025-10-04');
  insertLog.run('4ad9b53c-027f-4e30-b71a-95d61b369217','2c35c0ef-d79c-46ed-a94f-3f4290aa3c95','Status Updated','Status changed to "Active"',adminId,'2025-10-07');
  insertLog.run('66124fa4-dff5-469f-8bb3-22f3132563d5','2a4c9fd1-d9bb-4832-b1b5-f83ec9fff85a','Case Created','Case MOJ-2026-0044 opened.',adminId,'2026-02-22');
  insertLog.run('e2ee2921-ff38-4a66-bef9-2925bf2fac1c','dfed0b00-525a-4e58-a636-80b176b24967','Case Created','Case MOJ-2023-0045 opened.',adminId,'2024-01-18');
  insertLog.run('1384c9e5-4add-4387-afdb-75152149883e','dfed0b00-525a-4e58-a636-80b176b24967','Status Updated','Status changed to "Active"',adminId,'2024-01-19');
  insertLog.run('7a84b956-0006-49e4-a04e-3f1beedd6c68','ff70aadd-6022-4998-ac2a-3d6fc9a0b0b2','Case Created','Case MOJ-2026-0046 opened.',adminId,'2026-04-30');
  insertLog.run('e885fb3e-34cb-4f19-9d26-7f878614a210','ff70aadd-6022-4998-ac2a-3d6fc9a0b0b2','Status Updated','Status changed to "Closed"',adminId,'2026-05-01');
  insertLog.run('c247fa33-5d64-422f-99b4-b6ab63d8dc70','00a5bcc4-806d-4153-b133-071bbfd1ab85','Case Created','Case MOJ-2023-0047 opened.',adminId,'2023-05-14');
  insertLog.run('528f1756-110b-49ea-8e41-93617529f300','750c147e-10b1-4b4c-a923-c3b5549f823e','Case Created','Case MOJ-2025-0048 opened.',adminId,'2025-04-25');
  insertLog.run('2ad59996-a7bd-4fb4-814a-88e936a48437','750c147e-10b1-4b4c-a923-c3b5549f823e','Status Updated','Status changed to "Active"',adminId,'2025-05-03');
  insertLog.run('c7ab4223-c8a1-4692-9c56-3923e13338a0','1b58ee03-a96a-4eea-bc11-f8ac99b36322','Case Created','Case MOJ-2024-0049 opened.',adminId,'2024-08-30');
  insertLog.run('fd77ad68-37c1-4638-b3d8-f622312c97d8','33be18ae-5f6f-4a12-8c6a-8ef45684dc5d','Case Created','Case MOJ-2025-0050 opened.',adminId,'2025-02-25');
  insertLog.run('ad33a9af-8342-4101-bd71-c2764a24130f','3679342a-a71f-4539-bb43-8bdae550e2a9','Case Created','Case MOJ-2026-0051 opened.',adminId,'2026-03-19');
  insertLog.run('f3ff0e6a-7abe-4496-85cd-dcdc1a49bfa3','17269b01-c59b-42bc-9a7c-de929100d7fe','Case Created','Case MOJ-2025-0052 opened.',adminId,'2025-08-04');
  insertLog.run('dcb2e923-0b30-4a41-a9bf-224bdebc1bd4','420aac06-f7f5-4426-b8dc-e386cf341605','Case Created','Case MOJ-2026-0053 opened.',adminId,'2026-05-18');
  insertLog.run('e48fa288-3fea-43b0-bdd0-96fb4b2a626d','420aac06-f7f5-4426-b8dc-e386cf341605','Status Updated','Status changed to "Active"',adminId,'2026-05-29');
  insertLog.run('5916cb12-10a1-45a8-81c5-9ef3c5fb3013','3adf0ece-ded6-45c8-9b7e-f1a35f549901','Case Created','Case MOJ-2024-0054 opened.',adminId,'2024-08-25');
  insertLog.run('af6ceab0-0436-4de5-bb7e-c924d302b8bb','5fac8cd3-d134-413b-a03d-052a5e46218f','Case Created','Case MOJ-2025-0055 opened.',adminId,'2025-05-13');
  insertLog.run('56212181-e545-45a8-a918-961c06892209','5fac8cd3-d134-413b-a03d-052a5e46218f','Status Updated','Status changed to "Active"',adminId,'2025-05-30');
  insertLog.run('197fabda-13c3-4c15-9d05-0339c2959de9','124d8f96-add3-49a4-9ed0-38ab0faaed4e','Case Created','Case MOJ-2024-0056 opened.',adminId,'2025-01-23');
  insertLog.run('6f5b20f8-8d5c-4476-bff8-8fab5be2f07f','cf729811-3bd9-4bcd-a737-d5296f30b5cd','Case Created','Case MOJ-2026-0057 opened.',adminId,'2026-02-26');
  insertLog.run('559f5ca2-6143-4601-a583-9b1c6c2dbec9','cf729811-3bd9-4bcd-a737-d5296f30b5cd','Status Updated','Status changed to "Closed"',adminId,'2026-03-10');
  insertLog.run('bd4c5810-2a9d-4e08-b17f-aaaa20f3559f','e398b36e-485e-44b6-95ac-adfcb95b105f','Case Created','Case MOJ-2026-0058 opened.',adminId,'2026-03-06');
  insertLog.run('2ad7fd3d-f757-4861-a528-6c7e8137391b','e398b36e-485e-44b6-95ac-adfcb95b105f','Status Updated','Status changed to "Active"',adminId,'2026-03-31');
  insertLog.run('8be54435-8631-4081-8a10-9fde0018a4f8','166c33f1-75cc-4ee3-9e18-b7e294e0496b','Case Created','Case MOJ-2024-0059 opened.',adminId,'2024-10-28');
  insertLog.run('06850e19-6fc2-4be1-9205-9d60abd37363','14e64e52-74ab-4682-b076-2fe2c7950a25','Case Created','Case MOJ-2024-0060 opened.',adminId,'2025-05-13');
  insertLog.run('f5b30828-c07d-4d55-b19a-e39df8084eab','9d3aaac3-49cc-44ad-9873-acab5959024e','Case Created','Case MOJ-2023-0061 opened.',adminId,'2023-08-14');
  insertLog.run('e5da8c32-e3c4-4cbe-8872-acf394f5b175','3f2e67ee-2c36-4d28-9a5d-b7e59eac5e85','Case Created','Case MOJ-2023-0062 opened.',adminId,'2023-11-19');
  insertLog.run('7af0a27e-1c9c-4777-82aa-5692e656126f','3f2e67ee-2c36-4d28-9a5d-b7e59eac5e85','Status Updated','Status changed to "Active"',adminId,'2023-11-22');
  insertLog.run('13005fec-35cd-4e4e-82fe-fa43034e630e','ef7cffb1-2fde-41d5-a774-f679c81b5a68','Case Created','Case MOJ-2024-0063 opened.',adminId,'2024-09-24');
  insertLog.run('7b5e44d0-0b0a-4488-ab8c-a52d59b82183','bd7202ff-d636-4bc5-b47c-e5e8914324d6','Case Created','Case MOJ-2026-0064 opened.',adminId,'2026-02-23');
  insertLog.run('05796e62-c8cc-4a43-aa78-ade33fae8edd','621284d5-981f-4a4d-8f82-946d574173b0','Case Created','Case MOJ-2023-0065 opened.',adminId,'2023-11-01');
  insertLog.run('3529a1ec-c7e4-4354-85b2-df772695ce9e','9381dbd2-4c3b-4a5c-9a23-3a0fb233316f','Case Created','Case MOJ-2025-0066 opened.',adminId,'2026-02-10');
  insertLog.run('953efd07-8641-4595-85a7-9037d0853368','c0c2efbb-8e8d-4cd8-b8a3-bddece4eac80','Case Created','Case MOJ-2024-0067 opened.',adminId,'2024-03-25');
  insertLog.run('c6dfb6a9-77d1-474e-881d-b1f57e80fbcc','c0c2efbb-8e8d-4cd8-b8a3-bddece4eac80','Status Updated','Status changed to "Active"',adminId,'2024-04-09');
  insertLog.run('e155b2bb-9612-432d-ab48-8f1cec7b329a','e98ecece-7e17-4a10-a780-2fae020f6a32','Case Created','Case MOJ-2023-0068 opened.',adminId,'2023-09-14');
  insertLog.run('9aad9bef-af1b-4a18-bb42-8a3d58c983aa','e98ecece-7e17-4a10-a780-2fae020f6a32','Status Updated','Status changed to "Closed"',adminId,'2023-10-04');
  insertLog.run('a3c77750-25dd-44c7-ba2b-367409360de6','2dd59c25-4a49-4e93-8d5c-8bbcf9fe825a','Case Created','Case MOJ-2025-0069 opened.',adminId,'2025-12-11');
  insertLog.run('ac06db2c-cf06-4b1f-a676-09d65305cfce','2fba9da8-2567-46df-adde-8422ab03df11','Case Created','Case MOJ-2026-0070 opened.',adminId,'2026-05-06');
  insertLog.run('98697376-8d18-46f5-ace3-2f5503efd2ec','2fba9da8-2567-46df-adde-8422ab03df11','Status Updated','Status changed to "Active"',adminId,'2026-05-17');
  insertLog.run('50f5b309-bb46-416f-bd04-e8ea126dcb56','940321be-94ba-46cf-9233-99355c6317d6','Case Created','Case MOJ-2026-0071 opened.',adminId,'2026-01-23');
  insertLog.run('707c0275-cc7e-45eb-bd95-20e395bd5be4','940321be-94ba-46cf-9233-99355c6317d6','Status Updated','Status changed to "Active"',adminId,'2026-01-24');
  insertLog.run('d65a340d-cf3e-4a5b-bb79-fef549fb1427','c053b1a2-e18d-499a-8921-db56c1770025','Case Created','Case MOJ-2026-0072 opened.',adminId,'2026-05-08');
  insertLog.run('f3108ce9-7d93-4c52-94c5-2417d5a9413a','b6cf5d23-88a4-4fcc-bc92-6e81f4fc2b00','Case Created','Case MOJ-2026-0073 opened.',adminId,'2026-05-22');
  insertLog.run('6f083d2b-2620-4dac-8e17-080470c59cd0','1426b739-9dbd-4f5e-94cb-88e257306663','Case Created','Case MOJ-2023-0074 opened.',adminId,'2024-01-02');
  insertLog.run('e338316b-141b-4f33-8bee-e68d0ad8cc1e','e9b6fe1e-60ed-40a4-b59e-1433aba19d83','Case Created','Case MOJ-2026-0075 opened.',adminId,'2026-01-18');
  insertLog.run('df2b10b8-7999-445e-8f67-e3f96f96eada','a7b2afbc-c35d-43e9-a5c7-a36fd65a3c3e','Case Created','Case MOJ-2023-0076 opened.',adminId,'2023-03-18');
  insertLog.run('e688d306-dd88-4217-8881-8d8968427981','253381b8-f52f-4a9a-ab14-8fcc943119b3','Case Created','Case MOJ-2025-0077 opened.',adminId,'2026-03-15');
  insertLog.run('d20b78d4-9b79-4603-a5d5-9b8eb69bb320','d5ea27d1-92a2-49e9-a56b-22daf9d8b715','Case Created','Case MOJ-2024-0078 opened.',adminId,'2024-02-21');
  insertLog.run('2dfbb96c-813e-47e2-84c5-9df3df065d07','568c6f85-bed2-44e0-995b-c9515aad2c67','Case Created','Case MOJ-2026-0079 opened.',adminId,'2026-04-12');
  insertLog.run('43ace235-dae0-43da-925f-9d8be047a23f','b88c6c52-41ce-45f4-a96f-1bde853076f6','Case Created','Case MOJ-2026-0080 opened.',adminId,'2026-01-18');
  insertLog.run('7a21c6ad-19cf-4f0b-9c7a-dc02ee42041c','b88c6c52-41ce-45f4-a96f-1bde853076f6','Status Updated','Status changed to "Closed"',adminId,'2026-01-22');
  insertLog.run('8c330514-b2eb-43ca-bbaf-e97bcabe0f63','f3d04bd8-7ed0-43f7-80a1-cf6530d56502','Case Created','Case MOJ-2023-0081 opened.',adminId,'2023-06-16');
  insertLog.run('0d377902-32e0-4438-b932-90c990d943e9','588c03ad-d13d-4a3a-a200-e5c593c916dd','Case Created','Case MOJ-2026-0082 opened.',adminId,'2026-04-08');
  insertLog.run('d5fb3981-41f6-4680-9693-b2af8592cf05','c2947f0d-4637-41e5-ae13-081462d0721d','Case Created','Case MOJ-2024-0083 opened.',adminId,'2024-12-07');
  insertLog.run('236345e2-b950-4e01-bfe9-cd79cdad9b78','103cec52-71e8-4c34-a61d-0bac5c44e3fb','Case Created','Case MOJ-2025-0084 opened.',adminId,'2026-03-09');
  insertLog.run('8fe0a185-be0b-42b8-8056-b026f362d725','7baed00d-f298-4b18-9a20-65defcb1c6a1','Case Created','Case MOJ-2025-0085 opened.',adminId,'2025-12-04');
  insertLog.run('6d7071cd-0734-4bce-ac5c-9e05d0d254b3','7baed00d-f298-4b18-9a20-65defcb1c6a1','Status Updated','Status changed to "Closed"',adminId,'2025-12-28');
  insertLog.run('a5e3b395-afec-4dea-bbe2-2cff48374a15','522a47a0-bf36-4192-b659-4b15d70d3f8d','Case Created','Case MOJ-2026-0086 opened.',adminId,'2026-02-18');
  insertLog.run('c7b7de57-cb1f-4881-86e8-0fbdd96ed752','522a47a0-bf36-4192-b659-4b15d70d3f8d','Status Updated','Status changed to "Closed"',adminId,'2026-03-19');
  insertLog.run('a08bed83-8a9c-4015-828a-ace9023a2ad9','74d5daa1-7c50-48a3-9ff6-42a12a3518ac','Case Created','Case MOJ-2023-0087 opened.',adminId,'2023-07-06');
  insertLog.run('592b505e-d7fa-4ec3-bd3d-358fb4e5c8e5','9d772a2f-a40c-4d4b-bf86-117d3fece413','Case Created','Case MOJ-2024-0088 opened.',adminId,'2025-04-12');
  insertLog.run('2126bfb7-b2d9-41ab-9b59-159f4ed1b122','c9ff2fa4-15f3-4745-b0e5-32b0035db7ec','Case Created','Case MOJ-2023-0089 opened.',adminId,'2024-02-16');
  insertLog.run('4a871de6-b5e7-4168-931d-ad44097f6011','c10ae717-fbc8-47da-9d71-5c45237bac56','Case Created','Case MOJ-2023-0090 opened.',adminId,'2023-11-23');
  insertLog.run('bea62509-d6f2-4510-9465-c6030a70469f','48704160-61e7-453f-8f39-c8daf2db9a25','Case Created','Case MOJ-2024-0091 opened.',adminId,'2024-07-28');
  insertLog.run('187f850c-4808-4590-bcf6-5dc4e70b5f0a','48704160-61e7-453f-8f39-c8daf2db9a25','Status Updated','Status changed to "Closed"',adminId,'2024-08-01');
  insertLog.run('2e9c1760-407b-4fe0-80ba-992081b95078','586872f4-d02c-4524-b4d7-0cefe2fa7f25','Case Created','Case MOJ-2023-0092 opened.',adminId,'2023-07-09');
  insertLog.run('0ac1dbe0-1a3c-4370-b9e3-82d8646ed8be','4ff36779-034f-4a46-84a0-ba4e0bc9444e','Case Created','Case MOJ-2026-0093 opened.',adminId,'2026-01-09');
  insertLog.run('dc04dd6d-05ca-46fa-b748-8c16b703cc12','4ff36779-034f-4a46-84a0-ba4e0bc9444e','Status Updated','Status changed to "Closed"',adminId,'2026-01-13');
  insertLog.run('35d86fc2-dde5-4664-a312-8a612848cb38','d36adef4-fc21-4b5f-b9b0-444f78df874f','Case Created','Case MOJ-2025-0094 opened.',adminId,'2026-05-11');
  insertLog.run('0e4437f9-0703-4419-a1bf-f69dc6c1394f','314a5e0b-459c-48ec-8366-f9e406a5f652','Case Created','Case MOJ-2023-0095 opened.',adminId,'2024-02-07');
  insertLog.run('a22387ed-7345-4e09-af19-56cd0ff2d889','31b281e4-764a-486e-a015-491b570eec5d','Case Created','Case MOJ-2024-0096 opened.',adminId,'2025-03-15');
  insertLog.run('bb134f2f-136b-4be5-a7b1-00173ad037c0','61a4c281-1f5e-4b63-9d59-2f7f7d6dbad0','Case Created','Case MOJ-2025-0097 opened.',adminId,'2025-05-16');
  insertLog.run('8345a553-df58-44a0-bdbf-117ed988202a','deebf2d5-9fc8-4c72-83f8-99a95af2eb09','Case Created','Case MOJ-2026-0098 opened.',adminId,'2026-05-09');
  insertLog.run('55a8f7f7-20f0-442a-bc25-f4fc112604b2','deebf2d5-9fc8-4c72-83f8-99a95af2eb09','Status Updated','Status changed to "Closed"',adminId,'2026-05-10');
  insertLog.run('6b300e00-8586-4254-8d93-049194673838','7c6570ad-ec2e-4cf0-9ec5-5c8171d94345','Case Created','Case MOJ-2023-0099 opened.',adminId,'2023-02-25');
  insertLog.run('ae7889b0-46aa-49ee-918f-e18947d8f5a1','7c6570ad-ec2e-4cf0-9ec5-5c8171d94345','Status Updated','Status changed to "Closed"',adminId,'2023-02-28');
  insertLog.run('a2486169-8569-4e09-8868-69de75849038','2727d0ca-1114-425c-9ca1-e91af4255499','Case Created','Case MOJ-2024-0100 opened.',adminId,'2024-09-28');
  insertLog.run('ff05f8aa-005d-4276-b5f9-b3ef222b7739','5a35365a-00ab-4a4a-9654-5d553691628d','Case Created','Case MOJ-2024-0101 opened.',adminId,'2025-02-27');
  insertLog.run('2de53387-0589-4a8c-930d-7538a5a20fbd','5575dc3c-8808-496e-bf8e-0797ee309650','Case Created','Case MOJ-2024-0102 opened.',adminId,'2024-08-09');
  insertLog.run('f38c3d53-1f04-4162-91bf-f8ebc9a7ccb9','c376ccea-652d-4e60-ba26-7cc405c6206d','Case Created','Case MOJ-2025-0103 opened.',adminId,'2026-04-14');
  insertLog.run('d21208e4-7ae6-44ba-b7f5-dbdc1e4975ca','84846cd1-e49d-47ea-b114-f167d84b4f3b','Case Created','Case MOJ-2024-0104 opened.',adminId,'2024-02-25');
  insertLog.run('6c67986b-7082-49b0-8201-b68500f92ad0','84846cd1-e49d-47ea-b114-f167d84b4f3b','Status Updated','Status changed to "Closed"',adminId,'2024-03-22');
  insertLog.run('5d8db38e-3693-47b3-bc2b-523e7289a5f0','30966040-b9c2-4a90-bc3a-b26027bdec3c','Case Created','Case MOJ-2026-0105 opened.',adminId,'2026-03-11');
  insertLog.run('1a3e9e31-6d56-4b35-8d75-c950462bc693','0a7ff555-8985-4267-802e-b9f3be861330','Case Created','Case MOJ-2024-0106 opened.',adminId,'2025-01-17');
  insertLog.run('f1a50ecd-41a4-44e6-bac6-e83dc841c8b5','4fd77a1e-09dd-4419-8895-8f364962e14b','Case Created','Case MOJ-2023-0107 opened.',adminId,'2023-02-11');
  insertLog.run('bce7d9b4-db91-462b-ad15-88c5a0aba26f','0276e093-58ff-4a8a-94f9-fa6886b1102b','Case Created','Case MOJ-2026-0108 opened.',adminId,'2026-04-21');
  insertLog.run('30d19e15-51db-4661-891a-4cb6b6e39ba5','8ae8a316-6166-464b-80fc-4033f09d6dda','Case Created','Case MOJ-2023-0109 opened.',adminId,'2023-03-12');
  insertLog.run('17aba0a8-2a66-4c86-a45d-287ec608ba3d','cf1ec854-8031-411b-982c-ab67a3c091ec','Case Created','Case MOJ-2026-0110 opened.',adminId,'2026-02-28');
  insertLog.run('5bc8aaf1-bf81-4628-8a44-60789cd0d0f4','faa243d4-f412-4bdc-8894-1eed236dd59a','Case Created','Case MOJ-2026-0111 opened.',adminId,'2026-04-20');
  insertLog.run('8b1dad58-7a18-4a3a-b489-29202de43267','10b34369-f579-462d-8295-ea45dcca8f27','Case Created','Case MOJ-2026-0112 opened.',adminId,'2026-04-03');
  insertLog.run('b25d00a7-c14e-45a3-81ce-977576ad7d2f','10b34369-f579-462d-8295-ea45dcca8f27','Status Updated','Status changed to "Active"',adminId,'2026-04-20');
  insertLog.run('8f2ef1d0-5536-4492-a6e1-90efd2f92f84','f878f3c7-e5df-4a82-8e2b-c21c96754730','Case Created','Case MOJ-2023-0113 opened.',adminId,'2023-06-20');
  insertLog.run('abffda3f-5921-49fc-b36f-58914cb4deba','f878f3c7-e5df-4a82-8e2b-c21c96754730','Status Updated','Status changed to "Closed"',adminId,'2023-07-02');
  insertLog.run('e38ffecc-39aa-4cfa-ae8c-19db56858f74','367576da-646d-463d-905c-9b338d0d7070','Case Created','Case MOJ-2025-0114 opened.',adminId,'2025-04-12');
  insertLog.run('d0e3095c-e63e-4759-ae22-320042384822','26819996-4705-47fa-91c3-a600307e3105','Case Created','Case MOJ-2023-0115 opened.',adminId,'2023-10-16');
  insertLog.run('38ca0321-2fe6-47cc-b717-ef9c235081fe','26819996-4705-47fa-91c3-a600307e3105','Status Updated','Status changed to "Closed"',adminId,'2023-11-05');
  insertLog.run('e0b15cdb-4d6f-4aa6-87e0-176d06572d0c','91fbabed-b29e-43c7-962f-48fc92e96787','Case Created','Case MOJ-2025-0116 opened.',adminId,'2025-08-15');
  insertLog.run('00c82d47-b29b-4bba-9489-f84b90fdd21a','ff56e5de-4bd2-4a33-bbab-8bc9f238c6d5','Case Created','Case MOJ-2023-0117 opened.',adminId,'2023-07-08');
  insertLog.run('cbc9249e-ce63-4026-ae73-b2ecc2d0cd7a','60c94c5a-ee5c-407f-9547-a3e6e6caf87a','Case Created','Case MOJ-2023-0118 opened.',adminId,'2023-09-01');
  insertLog.run('47253ab1-dcc2-434c-acae-ba0fe88a3a12','60c94c5a-ee5c-407f-9547-a3e6e6caf87a','Status Updated','Status changed to "Closed"',adminId,'2023-09-07');
  insertLog.run('9567c24f-5ae7-40ae-b540-cc31e51a44cf','4b7547b4-430f-4994-9753-710a40d8d5b3','Case Created','Case MOJ-2023-0119 opened.',adminId,'2023-09-25');
  insertLog.run('aee69a00-5223-4e85-8150-f6d8665da436','4b7547b4-430f-4994-9753-710a40d8d5b3','Status Updated','Status changed to "Closed"',adminId,'2023-10-17');
  insertLog.run('ea0793ce-26b9-485f-a6fc-71d5b36679b2','b26793d3-e02d-4c90-b0e5-ae1678fc1220','Case Created','Case MOJ-2023-0120 opened.',adminId,'2023-12-14');
  insertLog.run('72481ec3-c7f2-465f-9bed-9a299aa55d31','3c4c29f1-aea2-458c-8fac-2e6625486713','Case Created','Case MOJ-2024-0121 opened.',adminId,'2025-05-10');
  insertLog.run('f6518932-e2bb-458d-96a1-7f15eae9f79d','0d138fa0-8f6b-463d-8bec-7cddc8d34fa6','Case Created','Case MOJ-2023-0122 opened.',adminId,'2023-03-07');
  insertLog.run('cf69bfed-7359-4fce-977a-2b8c7ec8ed66','0491b6ef-285f-4acf-9194-8a5497d130ea','Case Created','Case MOJ-2025-0123 opened.',adminId,'2025-06-24');
  insertLog.run('31f9ab18-6a42-47d2-ad55-8b20361ee0db','7c2d30c0-ad48-4a5b-9314-720712423083','Case Created','Case MOJ-2023-0124 opened.',adminId,'2023-07-12');
  insertLog.run('17a9187a-9daa-41c2-ae09-3acd9df396c5','7c2d30c0-ad48-4a5b-9314-720712423083','Status Updated','Status changed to "Closed"',adminId,'2023-08-07');
  insertLog.run('5c680d37-34c9-4b40-9e4c-2c5643ea90e9','609f40cb-7ecd-423f-b950-21bd2891b4fe','Case Created','Case MOJ-2024-0125 opened.',adminId,'2025-01-03');
  insertLog.run('0220e19e-ea7c-4f12-b97c-d3bcff32cd4c','6512bafa-aec8-4d5a-b9dc-0bcadc961356','Case Created','Case MOJ-2024-0126 opened.',adminId,'2024-12-13');
  insertLog.run('346144f5-ecff-4cd3-9ee3-94d782296152','6512bafa-aec8-4d5a-b9dc-0bcadc961356','Status Updated','Status changed to "Closed"',adminId,'2024-12-27');
  insertLog.run('431521a7-7fb5-45a9-8641-a5a0ed53c60f','5b090094-79b1-4d87-95b0-6609d2fec4e6','Case Created','Case MOJ-2024-0127 opened.',adminId,'2024-11-24');
  insertLog.run('eba37d0b-17e1-4627-9813-b6140d840965','49fe6fab-10ed-4ac4-87a2-811c5b8eb7b7','Case Created','Case MOJ-2024-0128 opened.',adminId,'2025-04-29');
  insertLog.run('bf065062-9f0d-404e-af5f-448f7ddd7faf','49fe6fab-10ed-4ac4-87a2-811c5b8eb7b7','Status Updated','Status changed to "Active"',adminId,'2025-05-07');
  insertLog.run('a5530d79-3dee-43eb-b8df-3ec6b159626a','a7ac68aa-5566-4a3c-aced-322af9a0b100','Case Created','Case MOJ-2026-0129 opened.',adminId,'2026-01-26');
  insertLog.run('e5e206a3-86eb-4140-9cce-bc6f5ce3d91b','765e4e6e-bd87-4620-a563-8813f4618dae','Case Created','Case MOJ-2026-0130 opened.',adminId,'2026-01-02');
  insertLog.run('c9a92f9e-fc98-46fa-ab21-54c89f9585cc','765e4e6e-bd87-4620-a563-8813f4618dae','Status Updated','Status changed to "Closed"',adminId,'2026-01-26');
  insertLog.run('03723086-39d6-452c-8643-4d3145054fa5','533ec35f-6f72-464c-9290-c1d6b517ebce','Case Created','Case MOJ-2026-0131 opened.',adminId,'2026-02-01');
  insertLog.run('25c3457f-0a4d-44b7-be98-36a6302f2570','533ec35f-6f72-464c-9290-c1d6b517ebce','Status Updated','Status changed to "Closed"',adminId,'2026-02-05');
  insertLog.run('d4129dc1-9317-4522-9b97-dca2d1931045','a0bbaea9-caad-4ef7-9ff4-6bbdf034da53','Case Created','Case MOJ-2026-0132 opened.',adminId,'2026-04-20');
  insertLog.run('267cde49-9e95-4436-a92c-c49d42d6fbbc','a0bbaea9-caad-4ef7-9ff4-6bbdf034da53','Status Updated','Status changed to "Closed"',adminId,'2026-05-12');
  insertLog.run('53b8bef6-c35b-433f-9f2d-02f95dea7116','12552c0e-5ae8-45b3-81f5-fbc7964bafeb','Case Created','Case MOJ-2023-0133 opened.',adminId,'2023-08-29');
  insertLog.run('4679f0c5-e2a3-4989-84c3-26d82d21830e','94d044a6-be36-425d-9ff6-061ec2000f98','Case Created','Case MOJ-2025-0134 opened.',adminId,'2025-10-25');
  insertLog.run('74061b0d-28d9-4891-b73e-97885e575468','b72276c2-386f-4a8b-80b9-ba8273a70a39','Case Created','Case MOJ-2024-0135 opened.',adminId,'2024-03-10');
  insertLog.run('2ef91148-8134-402c-85d2-e057d2e247ed','7cf2a1ad-fc2e-4ba7-8492-2d6ac66f4e71','Case Created','Case MOJ-2024-0136 opened.',adminId,'2024-10-05');
  insertLog.run('a7b639c1-79f1-4373-9e06-a9f2869f5cb9','3963b21c-2171-48f1-bbfa-048e687a8984','Case Created','Case MOJ-2025-0137 opened.',adminId,'2026-02-14');
  insertLog.run('9eeb09da-cde5-48dc-8fa2-388aa48b7b9a','3963b21c-2171-48f1-bbfa-048e687a8984','Status Updated','Status changed to "Closed"',adminId,'2026-02-27');
  insertLog.run('f38b0b62-51be-44b3-bc7e-bdaa04b917dc','2c27a588-1f0f-4ed7-9ddb-9bf740685efd','Case Created','Case MOJ-2025-0138 opened.',adminId,'2026-02-13');
  insertLog.run('5dd2b38b-f5eb-48a7-a5bd-b31e9cf943f1','edcd55b5-9e69-4cab-a4af-980d3a7f6f10','Case Created','Case MOJ-2024-0139 opened.',adminId,'2024-12-04');
  insertLog.run('7b179ebb-2b71-42e9-b831-cfa3ccc72f1e','0cbc779b-24b6-4cc6-b8fa-c6db2c921b32','Case Created','Case MOJ-2023-0140 opened.',adminId,'2024-05-16');
  insertLog.run('0d8708c9-cf47-40fb-9dbc-9715c2181b0d','d64e6670-d1da-4c2d-9a56-b15ffe23b003','Case Created','Case MOJ-2024-0141 opened.',adminId,'2024-02-04');
  insertLog.run('efffd6a9-86fb-448f-ad42-00fe73f29c67','2649399b-2741-4a3e-aec1-554fe5cd2e30','Case Created','Case MOJ-2026-0142 opened.',adminId,'2026-04-06');
  insertLog.run('002e415c-ab21-4954-8400-3a5f1aeec690','dd3ab66e-a032-4d07-931e-77323a06cae8','Case Created','Case MOJ-2025-0143 opened.',adminId,'2025-01-14');
  insertLog.run('1c9708c3-78cd-46b2-91d9-6dbc5afeb9f4','c6d88a79-c30a-4680-98f0-6998d99bf955','Case Created','Case MOJ-2025-0144 opened.',adminId,'2025-02-07');
  insertLog.run('662eaf98-0585-4bd8-b6e9-a04214eb52a9','2273f628-4062-484c-bdf8-08b8937bd3d7','Case Created','Case MOJ-2025-0145 opened.',adminId,'2025-03-22');
  insertLog.run('72cc08eb-e3b6-43ef-83aa-847249965425','ef4759ef-4657-49d3-aafb-68f3037429b9','Case Created','Case MOJ-2023-0146 opened.',adminId,'2023-09-10');
  insertLog.run('39faf2e3-aef5-45e0-ac8b-6eeb9078a972','ef4759ef-4657-49d3-aafb-68f3037429b9','Status Updated','Status changed to "Closed"',adminId,'2023-09-13');
  insertLog.run('79d3e3f4-d790-464f-b2cb-9a8e6069a90c','0c929b63-f6f8-4431-ae88-b9a1f14afee8','Case Created','Case MOJ-2023-0147 opened.',adminId,'2023-07-29');
  insertLog.run('c70f4a89-c207-4113-bb48-fc2bdfd24905','0c929b63-f6f8-4431-ae88-b9a1f14afee8','Status Updated','Status changed to "Active"',adminId,'2023-08-15');
  insertLog.run('6c5f8c5d-20ec-4164-a151-6bb588b2f6ae','4be82414-167b-42aa-8873-1404fff98209','Case Created','Case MOJ-2025-0148 opened.',adminId,'2025-09-15');
  insertLog.run('dbe01aac-0e07-464f-a5e6-094edaf05dd0','2cb33504-59b4-42fb-8dc2-7ebf858ee686','Case Created','Case MOJ-2024-0149 opened.',adminId,'2025-04-03');
  insertLog.run('bb105858-ef15-4efa-96e5-117040d2ee0e','8ed47613-b19f-4bc8-860f-a195b482c60c','Case Created','Case MOJ-2025-0150 opened.',adminId,'2025-12-04');
  insertLog.run('cdf7f616-d8f5-4292-a2ef-10884a310acf','c92e120a-33e8-4605-b9bd-e7e61ed511de','Case Created','Case MOJ-2023-0151 opened.',adminId,'2023-04-18');
  insertLog.run('6cb90833-156e-49c9-959c-6320556d628d','960bdcbf-2b5e-40bd-bb01-c5b7030536e5','Case Created','Case MOJ-2026-0152 opened.',adminId,'2026-04-14');
  insertLog.run('2fda66e4-0550-416e-bcd0-b0c96bd74917','960bdcbf-2b5e-40bd-bb01-c5b7030536e5','Status Updated','Status changed to "Closed"',adminId,'2026-04-21');
  insertLog.run('681fe6aa-ecb4-4786-bb1e-90e37e78f2f7','e9b98590-5075-42e7-855e-b62d58b50647','Case Created','Case MOJ-2025-0153 opened.',adminId,'2025-03-08');
  insertLog.run('cd20562a-182a-494e-817c-61298295704d','761532b0-a03c-4012-8560-6b205d984cf2','Case Created','Case MOJ-2023-0154 opened.',adminId,'2023-01-26');
  insertLog.run('534c8770-1a93-4943-b865-3ed7a09e021d','761532b0-a03c-4012-8560-6b205d984cf2','Status Updated','Status changed to "Active"',adminId,'2023-02-19');
  insertLog.run('b922e223-98b5-4eb4-9221-0f9069ff325c','514f49a8-e100-4f8f-b02d-39a77e1d2b62','Case Created','Case MOJ-2025-0155 opened.',adminId,'2025-08-28');
  insertLog.run('a2f90f2d-e300-4084-ba31-5942d6ef037f','514f49a8-e100-4f8f-b02d-39a77e1d2b62','Status Updated','Status changed to "Closed"',adminId,'2025-09-05');
  insertLog.run('c5362f2d-b2bf-4c53-8004-b037d380cf59','330d849b-99c0-4f91-a505-24166fb72b91','Case Created','Case MOJ-2024-0156 opened.',adminId,'2024-11-01');
  insertLog.run('a277b8ad-6b6f-490c-a171-2d4d119f3779','2625fa61-3caa-4d41-a1d5-b216b0c11218','Case Created','Case MOJ-2023-0157 opened.',adminId,'2023-07-26');
  insertLog.run('d43b9de9-18fe-4ec0-a543-ff9b9d9caa94','ef96d22d-5e99-4f69-9ab7-4e08f57edd2f','Case Created','Case MOJ-2025-0158 opened.',adminId,'2026-05-22');
  insertLog.run('a83cfe64-d98f-4883-81b5-d9914074106b','ef96d22d-5e99-4f69-9ab7-4e08f57edd2f','Status Updated','Status changed to "Active"',adminId,'2026-06-04');
  insertLog.run('e49fe4ce-e461-47a1-9e56-52537bc70e2a','f170a96d-8f2e-4d4c-a07c-638b99695dc6','Case Created','Case MOJ-2025-0159 opened.',adminId,'2025-11-05');
  insertLog.run('f25d4253-0fd7-433f-afa3-67f075381ce8','87756506-2180-45ca-b449-fd5e6c00b9c6','Case Created','Case MOJ-2024-0160 opened.',adminId,'2024-11-06');
  insertLog.run('0236ca5b-0796-4145-a7cb-64867b663694','d406a06d-bf4d-4c83-a975-bd4f53602ac0','Case Created','Case MOJ-2025-0161 opened.',adminId,'2026-02-22');
  insertLog.run('0eb86961-5f0d-447e-9337-c94924e17d04','5b63e088-d30e-4736-96bc-f95a1d9ccd99','Case Created','Case MOJ-2025-0162 opened.',adminId,'2026-02-05');
  insertLog.run('550da218-b81b-432d-a0ec-5af15e0c454f','3b38a027-e26d-49a4-aefd-e7deb9c945f1','Case Created','Case MOJ-2026-0163 opened.',adminId,'2026-03-04');
  insertLog.run('5485fbbf-a5db-44fe-8874-a7757eb93985','7446f2f0-6752-4966-ae1c-5932c818f4cc','Case Created','Case MOJ-2023-0164 opened.',adminId,'2023-12-20');
  insertLog.run('4831cfd5-83ca-4437-9390-9c4e9d8f374e','7446f2f0-6752-4966-ae1c-5932c818f4cc','Status Updated','Status changed to "Active"',adminId,'2024-01-06');
  insertLog.run('c00d4270-62ff-4223-9f7c-fa303b332c9c','f84a1f1f-cdf4-4290-9d7b-918de55247fd','Case Created','Case MOJ-2024-0165 opened.',adminId,'2025-05-04');
  insertLog.run('83c9f2d2-c7d8-47dc-9425-0d3f5bc1420f','f84a1f1f-cdf4-4290-9d7b-918de55247fd','Status Updated','Status changed to "Closed"',adminId,'2025-06-01');
  insertLog.run('7042780c-3916-416e-9aea-2851ea90c63a','b1315dd9-dd52-4034-ba94-3506b814b353','Case Created','Case MOJ-2025-0166 opened.',adminId,'2025-06-02');
  insertLog.run('12c432f5-a96a-405d-a4cb-e1ded3e66d93','fda634db-9e66-4c9e-8bd3-801b8224211a','Case Created','Case MOJ-2025-0167 opened.',adminId,'2025-10-21');
  insertLog.run('053a087e-136b-45cb-a303-6b73a2e60972','9ce2099f-1b91-413e-ad29-344ca87ae425','Case Created','Case MOJ-2025-0168 opened.',adminId,'2025-09-03');
  insertLog.run('480357f2-63f0-4123-90d9-fa9c15bbd0bf','9ce2099f-1b91-413e-ad29-344ca87ae425','Status Updated','Status changed to "Active"',adminId,'2025-09-08');
  insertLog.run('26e1ae1e-1192-4425-9186-db91011e0627','d3b03d4c-b422-46d8-b108-57fbb9539f06','Case Created','Case MOJ-2023-0169 opened.',adminId,'2023-04-30');
  insertLog.run('22ade72a-06e1-48c4-a33b-00e332f6f1d0','4a327544-aca0-450b-9d4c-0aa1c563fa38','Case Created','Case MOJ-2024-0170 opened.',adminId,'2025-04-23');
  insertLog.run('41e2447b-c4ae-4521-827b-3c7f6667ae3a','62237a9a-61fb-4399-82de-db5ed1ba6800','Case Created','Case MOJ-2025-0171 opened.',adminId,'2025-10-21');
  insertLog.run('4bc6ce78-5208-42b6-8880-f5c92c8d1adc','62237a9a-61fb-4399-82de-db5ed1ba6800','Status Updated','Status changed to "Closed"',adminId,'2025-10-23');
  insertLog.run('a1e90dcc-2450-46a3-b2a7-215510aa1458','03161aa7-668d-4b4f-9c89-6eb35f0c09b7','Case Created','Case MOJ-2026-0172 opened.',adminId,'2026-03-18');
  insertLog.run('3700427b-2bac-4442-a407-180c7ce1926e','b53caa9f-2a46-4d31-aba6-7acaba4ffcc8','Case Created','Case MOJ-2026-0173 opened.',adminId,'2026-01-29');
  insertLog.run('5f8f42ba-b2d0-402e-a660-4ad631eea624','049dc66a-570c-4c6f-86f2-c90c947de354','Case Created','Case MOJ-2024-0174 opened.',adminId,'2024-12-11');
  insertLog.run('58a2c549-1db6-4807-8bb0-c645c9ea81f8','049dc66a-570c-4c6f-86f2-c90c947de354','Status Updated','Status changed to "Closed"',adminId,'2025-01-07');
  insertLog.run('0c4b3c5b-7a1f-4cd9-8f00-e763af927b7c','0c4a47e8-7e90-4da2-93e4-dd03f46f7137','Case Created','Case MOJ-2026-0175 opened.',adminId,'2026-02-05');
  insertLog.run('89450a67-4bed-4910-905b-c3cb9650edfc','45e7f49c-4335-400a-9ad9-93c67392ec24','Case Created','Case MOJ-2024-0176 opened.',adminId,'2024-10-25');
  insertLog.run('5b6fe32c-ccf8-4a3e-adf5-b7ba58939372','0bce3d71-66d6-487d-a2ba-6af5016f8f98','Case Created','Case MOJ-2023-0177 opened.',adminId,'2023-09-15');
  insertLog.run('3a84a981-920f-4998-80cd-e42b40827cdb','7e559901-6610-4c45-b0b5-af5ec39ac9b8','Case Created','Case MOJ-2024-0178 opened.',adminId,'2024-12-25');
  insertLog.run('01d388ac-8aae-4df8-ac10-d519cc7cae06','99b6b08e-84f4-4fc5-817a-5e6d2c7210f7','Case Created','Case MOJ-2023-0179 opened.',adminId,'2023-10-16');
  insertLog.run('9535c96f-79b6-4784-86b0-2567b618ac24','6acbfa92-ef08-4add-a289-7ec5fd2a2e3d','Case Created','Case MOJ-2024-0180 opened.',adminId,'2024-04-15');
  insertLog.run('4635b6fb-d20d-44e1-81f6-eb61fedce02e','6acbfa92-ef08-4add-a289-7ec5fd2a2e3d','Status Updated','Status changed to "Active"',adminId,'2024-04-30');
  insertLog.run('a9facd6e-0fb1-4bba-94de-bb05774fb96e','4cd57859-2d5e-43ed-aeb5-9608200b664e','Case Created','Case MOJ-2024-0181 opened.',adminId,'2025-02-17');
  insertLog.run('eaed1b18-275f-485e-83a9-e56400e9cf8d','cd416231-fb84-4f76-9a14-3cf283eae89f','Case Created','Case MOJ-2026-0182 opened.',adminId,'2026-01-18');
  insertLog.run('0a01f4f2-8379-452b-a3b2-3c0a78c0c0eb','cd416231-fb84-4f76-9a14-3cf283eae89f','Status Updated','Status changed to "Closed"',adminId,'2026-02-11');
  insertLog.run('06a21842-e7b6-422b-af7a-93aab5d20573','0778406f-65c4-4f52-9f91-257c4cbd8687','Case Created','Case MOJ-2026-0183 opened.',adminId,'2026-01-21');
  insertLog.run('01da8efe-df21-4fc8-8f9b-8ae61fde0db6','a8960965-9f30-4eaa-9c27-7f98e617a9c4','Case Created','Case MOJ-2026-0184 opened.',adminId,'2026-01-06');
  insertLog.run('38d52925-6763-4177-b425-bd4427f1dfe7','a8960965-9f30-4eaa-9c27-7f98e617a9c4','Status Updated','Status changed to "Closed"',adminId,'2026-01-19');
  insertLog.run('1d33c9d1-374d-4c69-801a-c8950bb71c34','78bd7e52-eb85-4826-b717-fbf51248b196','Case Created','Case MOJ-2024-0185 opened.',adminId,'2024-04-06');
  insertLog.run('697833e2-059c-41f5-aaf3-a5ca62d5c6c3','78080b66-4122-4aed-959a-88fbf2a08e23','Case Created','Case MOJ-2023-0186 opened.',adminId,'2023-12-11');
  insertLog.run('a5cf6f70-1242-48ce-a219-80da0ce4b38e','27dfa058-fb23-4d0f-97a0-be96414c874a','Case Created','Case MOJ-2026-0187 opened.',adminId,'2026-05-09');
  insertLog.run('b598fe0c-7ff6-4d32-90c2-91a7f8ae855b','9a138972-3276-46cd-b0af-5412f32aeeca','Case Created','Case MOJ-2025-0188 opened.',adminId,'2025-06-03');
  insertLog.run('9b741f4a-5c3f-47c7-8921-b3c2b1749506','9a138972-3276-46cd-b0af-5412f32aeeca','Status Updated','Status changed to "Active"',adminId,'2025-06-05');
  insertLog.run('77e4d341-5bb9-4c5f-a1f8-cf2ba0047248','2da8b32e-db70-49dd-8edb-7b3f2a816f4f','Case Created','Case MOJ-2025-0189 opened.',adminId,'2025-03-18');
  insertLog.run('b8e03592-fdd8-47ce-b1ef-03a279896892','2da8b32e-db70-49dd-8edb-7b3f2a816f4f','Status Updated','Status changed to "Closed"',adminId,'2025-04-17');
  insertLog.run('ad3622df-8390-4d50-b889-9f79fd4c2d96','84fd609f-8af7-4b94-ba64-28cfa73dc902','Case Created','Case MOJ-2023-0190 opened.',adminId,'2023-05-11');
  insertLog.run('5f7ece31-1655-40ca-bf46-e9fc539772d7','80d674d7-797d-4ba5-84fe-26d545a01a62','Case Created','Case MOJ-2026-0191 opened.',adminId,'2026-05-24');
  insertLog.run('db09ac06-5abc-4aca-9ee9-0a7de2f5e56d','d74afe6a-cbbd-4565-8120-8cf6d315bb31','Case Created','Case MOJ-2023-0192 opened.',adminId,'2023-05-05');
  insertLog.run('82d61693-a7b5-4c5c-90fc-b2fac15ec5b4','df889698-b2c8-4e8d-bd06-a100b554f8e0','Case Created','Case MOJ-2026-0193 opened.',adminId,'2026-04-03');
  insertLog.run('7e6dde55-0e69-46e0-a863-9bdc83c5fe04','3fdf7c60-e5dc-4caa-aab1-ebd9ec471c39','Case Created','Case MOJ-2025-0194 opened.',adminId,'2025-10-16');
  insertLog.run('9b466016-ebdc-45a6-9304-e95dcec52835','3fdf7c60-e5dc-4caa-aab1-ebd9ec471c39','Status Updated','Status changed to "Active"',adminId,'2025-10-26');
  insertLog.run('1d5e2c6d-e516-4cd3-a01c-86ce0944964e','026b47da-d680-4121-81f5-a414969b2de6','Case Created','Case MOJ-2024-0195 opened.',adminId,'2025-03-02');
  insertLog.run('809ecfc1-6198-4ac9-ad34-0aadfaddb177','026b47da-d680-4121-81f5-a414969b2de6','Status Updated','Status changed to "Active"',adminId,'2025-03-23');
  insertLog.run('dd82e842-9f7c-4fcc-9306-dfe11e9430f4','7b560c70-2e33-4206-9486-deca8ba234c8','Case Created','Case MOJ-2026-0196 opened.',adminId,'2026-05-20');
  insertLog.run('ca21bfeb-8285-4bea-9804-e4cac8a2e9e4','4a16dd39-596e-4caf-a123-6e2bda1a8d1c','Case Created','Case MOJ-2023-0197 opened.',adminId,'2024-03-07');
  insertLog.run('38b5307c-94d8-470c-999c-b12462e51656','1ada32f0-dbf6-4f1b-af54-0c20a215557e','Case Created','Case MOJ-2026-0198 opened.',adminId,'2026-01-02');
  insertLog.run('9faa8c6d-ebe5-4704-89b4-ead16df06525','f0e8a2c6-379b-4eaa-b6a9-9f48fc597c0c','Case Created','Case MOJ-2025-0199 opened.',adminId,'2026-04-16');
  insertLog.run('9c05b7a9-cf2a-4975-8c4e-4d9d002d855d','789ed2b7-7c7d-4b71-8bd6-595a166fe1ba','Case Created','Case MOJ-2025-0200 opened.',adminId,'2026-05-07');
  insertLog.run('28db5a46-ead7-4fc0-bdd9-de90704b90dc','789ed2b7-7c7d-4b71-8bd6-595a166fe1ba','Status Updated','Status changed to "Closed"',adminId,'2026-06-04');
  insertLog.run('96901ff4-82d1-46e7-9cd4-e204d548c391','9b668e6a-8ad9-457d-afc3-f6f0c5df1bec','Case Created','Case MOJ-2023-0201 opened.',adminId,'2023-09-01');
  insertLog.run('b29d4afb-6930-4620-b1ae-159a473a2549','c5886d79-06e5-4c85-bd31-86752a7cf27d','Case Created','Case MOJ-2026-0202 opened.',adminId,'2026-02-24');
  insertLog.run('9d2273e1-0fe8-4e91-a000-9baee6b0373d','ee19f97f-3c11-4b5f-ab94-40f062090355','Case Created','Case MOJ-2023-0203 opened.',adminId,'2023-10-28');
  insertLog.run('48170eb4-65c0-48f0-ba88-620f43374e5c','ee19f97f-3c11-4b5f-ab94-40f062090355','Status Updated','Status changed to "Closed"',adminId,'2023-11-07');
  insertLog.run('ef94414e-05d8-4fc0-ae5f-9349ca2a7e81','f7baa56e-702c-4add-bd51-e9b44da85983','Case Created','Case MOJ-2024-0204 opened.',adminId,'2025-01-21');
  insertLog.run('4712aa0d-0835-43fe-a1d6-5dd43accb092','ed44945b-5f0d-45f7-8a0c-fd291fa351a0','Case Created','Case MOJ-2023-0205 opened.',adminId,'2023-11-06');
  insertLog.run('266f0876-d258-4281-b317-0970f70966ae','a6c69489-3150-4eb7-b608-fe54878ec38e','Case Created','Case MOJ-2025-0206 opened.',adminId,'2026-04-27');
  insertLog.run('2d5a49f5-fd73-49e7-afab-76203fc953bf','a6c69489-3150-4eb7-b608-fe54878ec38e','Status Updated','Status changed to "Active"',adminId,'2026-05-07');
  insertLog.run('b9e95924-1a27-47ad-9c4b-77713f60830d','ce4354f1-c04a-4d2f-851c-bb24604307e9','Case Created','Case MOJ-2024-0207 opened.',adminId,'2024-12-30');
  insertLog.run('da209cc7-19d8-493c-bce3-09a70b2bd273','d6413b22-6e07-4f0f-866f-58fd7b63fe4a','Case Created','Case MOJ-2025-0208 opened.',adminId,'2025-07-04');
  insertLog.run('2be7eea2-61d2-4055-ad1b-a1935a96e519','551fefb4-28d5-44f2-9d1b-1a7b7aaaaaa0','Case Created','Case MOJ-2026-0209 opened.',adminId,'2026-01-23');
  insertLog.run('99c9a990-62f7-4f22-8046-1275c3ab4e1e','27f1e2cd-1fca-4a37-8954-4a5b204d592b','Case Created','Case MOJ-2025-0210 opened.',adminId,'2025-09-24');
  insertLog.run('2e7bf5d6-621f-442d-abaf-f2cd24b4b2d4','0f953a1d-a118-42e2-abb7-2abe80883d40','Case Created','Case MOJ-2026-0211 opened.',adminId,'2026-01-20');
  insertLog.run('b9d7d891-032c-4170-804d-991b30f38d16','0f953a1d-a118-42e2-abb7-2abe80883d40','Status Updated','Status changed to "Active"',adminId,'2026-02-04');
  insertLog.run('dc6f599c-89b3-4eff-81b2-19b1792e36bf','5b8e1c54-a3b1-4f87-8fb6-909ea481124a','Case Created','Case MOJ-2023-0212 opened.',adminId,'2024-03-06');
  insertLog.run('d42d5a9a-925f-4444-954d-c3b635283a7e','5b8e1c54-a3b1-4f87-8fb6-909ea481124a','Status Updated','Status changed to "Active"',adminId,'2024-04-02');
  insertLog.run('5d8ccd84-048f-4d0b-bd29-76b01265a9f6','4a657986-32a8-4cfa-a533-177e72ffb753','Case Created','Case MOJ-2024-0213 opened.',adminId,'2024-03-31');
  insertLog.run('7f46ab85-d877-493b-baf7-744f1a4ffcdb','4a657986-32a8-4cfa-a533-177e72ffb753','Status Updated','Status changed to "Active"',adminId,'2024-04-26');
  insertLog.run('24a2ee6b-3d5c-44b7-8c28-7766ebde7c28','6b7e8038-7ec3-4292-b00b-c8aa37762d07','Case Created','Case MOJ-2024-0214 opened.',adminId,'2024-02-28');
  insertLog.run('e60e97c2-68fa-46ed-8d91-b14d343616e5','821e1184-669b-48ae-9e25-d755d98c9142','Case Created','Case MOJ-2026-0215 opened.',adminId,'2026-04-15');
  insertLog.run('c3188879-9065-4ee3-be1a-92038c3e0e41','821e1184-669b-48ae-9e25-d755d98c9142','Status Updated','Status changed to "Active"',adminId,'2026-05-11');
  insertLog.run('7e904083-48d9-48c0-99b3-6e139353fb8a','0b064592-7d49-4346-9e6f-99c203bff84e','Case Created','Case MOJ-2026-0216 opened.',adminId,'2026-05-10');
  insertLog.run('112611be-bb5c-494a-9fac-92ec4379d3b3','0b064592-7d49-4346-9e6f-99c203bff84e','Status Updated','Status changed to "Active"',adminId,'2026-06-05');
  insertLog.run('71f2abba-74c3-469b-a47d-ebcbce0364e7','68cfc081-65b6-4a02-ab42-e66199d1a88d','Case Created','Case MOJ-2023-0217 opened.',adminId,'2023-11-28');
  insertLog.run('b7a78d72-fead-45ea-96f1-62ce23fcf0a5','68cfc081-65b6-4a02-ab42-e66199d1a88d','Status Updated','Status changed to "Closed"',adminId,'2023-12-23');
  insertLog.run('d1464c79-945d-4e6e-8525-dd82feb79aa1','f0048884-b37a-4a26-9c7c-3d62f28043a9','Case Created','Case MOJ-2025-0218 opened.',adminId,'2025-04-24');
  insertLog.run('86c483e0-5678-4118-bcc5-100ef7d344f9','9390e387-8cb6-4b28-b2c5-597baae50ea8','Case Created','Case MOJ-2026-0219 opened.',adminId,'2026-05-04');
  insertLog.run('015e666c-0c27-4234-9c85-17d701c87b29','91cf984f-8be6-4b11-a1b6-149bb14257b3','Case Created','Case MOJ-2025-0220 opened.',adminId,'2025-09-01');
  insertLog.run('e9a22cb3-e35a-407e-84d4-7f9f27c56627','78a627ac-d896-458c-abf4-187d67c1776f','Case Created','Case MOJ-2023-0221 opened.',adminId,'2024-02-14');
  insertLog.run('77d09b6f-e73d-48f9-8b89-dbb76337c362','78a627ac-d896-458c-abf4-187d67c1776f','Status Updated','Status changed to "Closed"',adminId,'2024-02-25');
  insertLog.run('69f64bea-9ffc-4b37-91f9-9477c15f76e3','18092971-5752-4af4-b75c-fc0d445632ba','Case Created','Case MOJ-2026-0222 opened.',adminId,'2026-04-21');
  insertLog.run('11f925e8-0d5e-4299-a6db-13785261c456','0384418a-1d1a-45f0-9023-c57bf324d97e','Case Created','Case MOJ-2026-0223 opened.',adminId,'2026-01-17');
  insertLog.run('5e9ba3f4-b034-4ce5-86e3-170cbf6fdd9e','092d6e74-149d-40c8-90d3-a83eb95a37b4','Case Created','Case MOJ-2026-0224 opened.',adminId,'2026-04-10');
  insertLog.run('9defcaab-d366-47f9-84d3-d2dd4403a678','f249afda-b61c-4104-8134-2fe630a59ee7','Case Created','Case MOJ-2026-0225 opened.',adminId,'2026-02-04');
  insertLog.run('ccb208d8-abff-476a-86df-1c8d721a4084','1b67d20e-ddd9-4eda-8fe3-02d7503716e3','Case Created','Case MOJ-2024-0226 opened.',adminId,'2024-04-05');
  insertLog.run('d4e10dd6-1172-43db-9d18-f1af56047a4b','1b67d20e-ddd9-4eda-8fe3-02d7503716e3','Status Updated','Status changed to "Active"',adminId,'2024-04-10');
  insertLog.run('fc5befdd-594e-4bca-96d6-17ba2511939a','9058a172-a3ab-4346-87a8-0d8c3ae8423e','Case Created','Case MOJ-2024-0227 opened.',adminId,'2024-07-02');
  insertLog.run('e61aaa06-e107-422a-9673-802f63965e41','9058a172-a3ab-4346-87a8-0d8c3ae8423e','Status Updated','Status changed to "Closed"',adminId,'2024-07-19');
  insertLog.run('6cad1a1f-736c-4c9b-b7fc-d848534a04b6','cb67f22c-501c-49d5-9e97-bf7d18921cc6','Case Created','Case MOJ-2026-0228 opened.',adminId,'2026-04-24');
  insertLog.run('201af55b-4adb-43be-9a40-997ac7804a4f','6d511fd1-7d90-4d95-931d-64d15a34aa73','Case Created','Case MOJ-2024-0229 opened.',adminId,'2024-09-18');
  insertLog.run('9aa82f3b-16ad-4fac-b36f-9d616ccbfc42','62d8cda2-52ec-474e-8fb0-9abd7fd0d1bb','Case Created','Case MOJ-2023-0230 opened.',adminId,'2024-01-12');
  insertLog.run('b1cae5b9-919e-4710-9b32-30e6b45f5774','33e74b2b-9ad4-411c-94f1-58fd8aa926e5','Case Created','Case MOJ-2025-0231 opened.',adminId,'2026-02-20');
  insertLog.run('6b891f53-78ed-4a61-96d8-24d0433bdc54','33e74b2b-9ad4-411c-94f1-58fd8aa926e5','Status Updated','Status changed to "Active"',adminId,'2026-03-06');
  insertLog.run('c1bd563d-4892-4347-ad19-564bc0be2852','455a9a45-f9d5-4ae6-96c9-9a87d4873316','Case Created','Case MOJ-2024-0232 opened.',adminId,'2024-01-31');
  insertLog.run('ef9c3ff1-2359-4bb1-9f2b-85a5e2cd79b5','455a9a45-f9d5-4ae6-96c9-9a87d4873316','Status Updated','Status changed to "Closed"',adminId,'2024-02-11');
  insertLog.run('3a7a6515-9973-4a95-b37e-3f59c86f73e0','663a3957-0cc2-44e9-9c0a-ada7b63457a8','Case Created','Case MOJ-2025-0233 opened.',adminId,'2026-05-08');
  insertLog.run('1b2dc23a-843c-43ce-b265-e19ec2fd12e2','57c86d40-7c4d-4ee0-9959-0b2c2794c555','Case Created','Case MOJ-2024-0234 opened.',adminId,'2025-03-07');
  insertLog.run('c3da90ea-cd2f-4f0f-95d1-1948d113f67c','57c86d40-7c4d-4ee0-9959-0b2c2794c555','Status Updated','Status changed to "Closed"',adminId,'2025-03-28');
  insertLog.run('8d3d624e-850c-4c38-917f-0a57eebf9dd6','3906a625-97fc-42ec-b30f-66d7b886d2f8','Case Created','Case MOJ-2026-0235 opened.',adminId,'2026-05-12');
  insertLog.run('3b89c371-1145-498e-9292-4f0d0e8e44cc','3906a625-97fc-42ec-b30f-66d7b886d2f8','Status Updated','Status changed to "Active"',adminId,'2026-06-09');
  insertLog.run('4ee5bb1d-e37d-4ccc-bec4-655532cca1ce','4f330312-273d-4d9d-866e-1130e20476cf','Case Created','Case MOJ-2023-0236 opened.',adminId,'2023-10-01');
  insertLog.run('acfba1ce-38d8-43af-8b6c-6e4cee908ed3','4f330312-273d-4d9d-866e-1130e20476cf','Status Updated','Status changed to "Closed"',adminId,'2023-10-12');
  insertLog.run('bffad98c-b678-4ab6-be9d-bf7baed4beec','52d783a7-fd40-480b-8618-f88b15c31606','Case Created','Case MOJ-2024-0237 opened.',adminId,'2024-02-20');
  insertLog.run('39fa8812-aa5c-4b9b-92b0-addc5db5460d','52d783a7-fd40-480b-8618-f88b15c31606','Status Updated','Status changed to "Closed"',adminId,'2024-03-05');
  insertLog.run('7f757b77-4751-4f71-b8fa-bcb32c38d697','86d6a342-f010-4833-bc79-ddad0741e857','Case Created','Case MOJ-2024-0238 opened.',adminId,'2025-04-22');
  insertLog.run('1dd66775-51c7-4890-bde5-0d7f6cc45da8','88d5d47f-c1ba-464a-aa75-4ddb8c413938','Case Created','Case MOJ-2025-0239 opened.',adminId,'2025-12-25');
  insertLog.run('abc426cc-674f-4310-83a9-52b541c1f7c8','dec767ee-1ddb-44ef-813f-bdef95861c5e','Case Created','Case MOJ-2023-0240 opened.',adminId,'2023-10-31');
  insertLog.run('4b739dca-607a-4247-a82d-c990d5517a6b','d6e7a0d2-7e1c-4629-9ebb-140646e4e844','Case Created','Case MOJ-2023-0241 opened.',adminId,'2023-03-09');
  insertLog.run('a765fe24-bc44-468a-ad13-d0c4cf8d7c6e','f57cc999-20e8-4542-bb53-8cd8a799aa1d','Case Created','Case MOJ-2025-0242 opened.',adminId,'2026-05-24');
  insertLog.run('eddd6954-3787-48a8-9994-046d6f4804d2','001195c6-32a2-4604-904e-2de9970bd026','Case Created','Case MOJ-2024-0243 opened.',adminId,'2024-07-29');
  insertLog.run('914bd7c1-6e42-4e18-ae0c-793d2b2ad299','001195c6-32a2-4604-904e-2de9970bd026','Status Updated','Status changed to "Active"',adminId,'2024-08-17');
  insertLog.run('69b434ff-2818-4f55-a6f3-567a4f9aa569','03308cfa-f1bf-4561-9a75-c78320e8b90b','Case Created','Case MOJ-2026-0244 opened.',adminId,'2026-03-12');
  insertLog.run('68029dce-d5ce-43d7-aa4d-5ff12d6bd74b','03308cfa-f1bf-4561-9a75-c78320e8b90b','Status Updated','Status changed to "Active"',adminId,'2026-03-22');
  insertLog.run('9f07cacb-2ba8-4b95-8d1b-13068b3eb503','5f62a035-5aa6-4079-b783-9e2fbcbb54e1','Case Created','Case MOJ-2023-0245 opened.',adminId,'2023-11-27');
  insertLog.run('de746811-62d7-4a92-9a6c-2cc37c743820','baac4b00-1197-4361-82d0-f313ddbf47b9','Case Created','Case MOJ-2026-0246 opened.',adminId,'2026-03-23');
  insertLog.run('f622b33d-af87-4b51-9319-bcd731532370','d787baa6-d102-4d69-b984-7108ed003aac','Case Created','Case MOJ-2024-0247 opened.',adminId,'2024-02-04');
  insertLog.run('8d502b9c-598c-4c9e-a803-d74e5e727812','d787baa6-d102-4d69-b984-7108ed003aac','Status Updated','Status changed to "Closed"',adminId,'2024-02-25');
  insertLog.run('0e0154ae-c7ca-4f2b-8b7a-cdc8c84357fa','21b61cac-9fdd-4c9f-a329-7a38a10216d2','Case Created','Case MOJ-2026-0248 opened.',adminId,'2026-05-18');
  insertLog.run('0c831ecf-b281-4526-847d-df92be77cf08','21b61cac-9fdd-4c9f-a329-7a38a10216d2','Status Updated','Status changed to "Closed"',adminId,'2026-05-31');
  insertLog.run('e7c0088d-99c0-4072-a7ca-3a76c08eb5de','9217d02a-2e68-4c55-9284-40a7489090fb','Case Created','Case MOJ-2023-0249 opened.',adminId,'2023-05-06');
  insertLog.run('0416d5cc-40cf-4700-91f8-63fb41e182cf','7be2c655-6eab-4fb7-87a8-ea12b4d5be31','Case Created','Case MOJ-2024-0250 opened.',adminId,'2024-09-11');
  insertLog.run('7ac9935b-25ee-413a-92cb-abe745314912','bbb9326b-c2f3-4894-8c7c-8d38b006c948','Case Created','Case MOJ-2025-0251 opened.',adminId,'2026-03-30');
  insertLog.run('962f84df-7d90-4661-bbe4-c7c8a07421cc','6df8e1a2-84d6-4e2b-890b-76c1c64e40c1','Case Created','Case MOJ-2023-0252 opened.',adminId,'2023-09-19');
  insertLog.run('ad9a3d5d-1811-4c88-b835-4c8b19e66c1f','66ba5629-b9c1-45d9-8dea-29ce9a00b50c','Case Created','Case MOJ-2023-0253 opened.',adminId,'2024-03-17');
  insertLog.run('0728c618-305c-484d-b76b-d6dba643aa67','fcb3eb75-4e94-47c8-954b-82cd7303f317','Case Created','Case MOJ-2026-0254 opened.',adminId,'2026-03-24');
  insertLog.run('25d28c17-e7a9-4cce-b6d0-429c2f3041c2','d5c11914-6267-4f97-9672-cea372bc403b','Case Created','Case MOJ-2023-0255 opened.',adminId,'2024-02-16');
  insertLog.run('65d4c1b1-d0c5-4e9d-b38e-bf79ec572d7c','2e73b6a6-bc7a-456e-ae38-f4a19cde60fa','Case Created','Case MOJ-2025-0256 opened.',adminId,'2025-04-13');
  insertLog.run('68b7756b-7ec8-4b4b-8ae0-8ea06ad2c3b4','4cd0958c-ce82-4dfa-8776-aeb0e586f41b','Case Created','Case MOJ-2026-0257 opened.',adminId,'2026-05-20');
  insertLog.run('1ae748a7-6854-4ef3-825a-73cf09c129b0','56daf99c-aaf6-4391-a1bd-dc20f10800c2','Case Created','Case MOJ-2025-0258 opened.',adminId,'2026-01-13');
  insertLog.run('cbaa6926-964a-4a03-a068-3d40f4cbca45','56daf99c-aaf6-4391-a1bd-dc20f10800c2','Status Updated','Status changed to "Active"',adminId,'2026-01-15');
  insertLog.run('784fbc51-7c74-4b75-abf8-ee67a45aeae9','563a81bd-f88a-4af0-b8cc-ecc878d46581','Case Created','Case MOJ-2024-0259 opened.',adminId,'2025-03-08');
  insertLog.run('dbdafc68-1065-41de-ac2d-b2a35521d8f3','b164226b-931e-4ff8-bb70-c9464ba76999','Case Created','Case MOJ-2023-0260 opened.',adminId,'2023-10-18');
  insertLog.run('3728ff42-856f-44f1-a708-b898c2a3869a','cdf89ac9-1944-42be-9f92-84d84ac1ca19','Case Created','Case MOJ-2025-0261 opened.',adminId,'2025-05-20');
  insertLog.run('af9363d3-e002-402a-9a5c-d80b7b6c490f','c6e3eafc-2f0e-4d56-8235-c060b485dbc3','Case Created','Case MOJ-2024-0262 opened.',adminId,'2024-10-01');
  insertLog.run('2b71b7a9-e52e-4ca6-9330-df159d2dd21f','00ef271c-a459-4353-bb73-9d4a2201e280','Case Created','Case MOJ-2025-0263 opened.',adminId,'2025-12-31');
  insertLog.run('5c7c1177-6003-4e87-8610-dac54e365172','39b5244f-1418-4cfa-aeeb-538bfcc7e058','Case Created','Case MOJ-2025-0264 opened.',adminId,'2026-03-14');
  insertLog.run('09b42d11-171f-4981-a2bd-efb67c3a59cd','39b5244f-1418-4cfa-aeeb-538bfcc7e058','Status Updated','Status changed to "Closed"',adminId,'2026-03-19');
  insertLog.run('17d81931-c5f8-459a-ba68-c2f03d48b896','855f7120-494e-4e0f-9753-fc9f8a51c576','Case Created','Case MOJ-2023-0265 opened.',adminId,'2024-02-26');
  insertLog.run('68828635-db09-4d6e-8af1-c10cc6dbca3d','38e10c6e-1454-4be8-9233-0eeea3b06127','Case Created','Case MOJ-2023-0266 opened.',adminId,'2023-04-12');
  insertLog.run('f75be267-ec46-41bc-95c5-fdecac12489c','38e10c6e-1454-4be8-9233-0eeea3b06127','Status Updated','Status changed to "Closed"',adminId,'2023-04-14');
  insertLog.run('6b860b6b-b6b5-400e-ac26-5b4963a22e78','715e5dd9-5acc-4aea-a520-b76753af7134','Case Created','Case MOJ-2024-0267 opened.',adminId,'2024-07-14');
  insertLog.run('2e331c69-08a8-45bc-90ca-9378aa7a5894','715e5dd9-5acc-4aea-a520-b76753af7134','Status Updated','Status changed to "Closed"',adminId,'2024-07-16');
  insertLog.run('9eb078fc-2998-4c75-bbac-861ec839f088','8acacace-c536-4f0f-b52f-2f63c5943673','Case Created','Case MOJ-2024-0268 opened.',adminId,'2024-02-14');
  insertLog.run('37a155f2-f741-45e8-a39f-f734bce1c90e','8acacace-c536-4f0f-b52f-2f63c5943673','Status Updated','Status changed to "Active"',adminId,'2024-03-11');
  insertLog.run('bc0afe37-d2bd-4ac1-886b-f6021278ebde','1af6880b-c3b5-45bb-a4e5-80b5b9378551','Case Created','Case MOJ-2023-0269 opened.',adminId,'2024-02-05');
  insertLog.run('cb6149fa-d261-4396-8b50-f4d71434eaa9','a9293101-cb45-49e4-a14b-3b9ccd79d467','Case Created','Case MOJ-2024-0270 opened.',adminId,'2025-05-22');
  insertLog.run('cabb37c1-a7a6-42bf-b930-2a6a07c00f60','a9293101-cb45-49e4-a14b-3b9ccd79d467','Status Updated','Status changed to "Closed"',adminId,'2025-05-28');
  insertLog.run('b930f736-0f21-47dd-a7e4-2dd48c1f9136','4c020ba4-203c-442f-b053-7c8769ac783e','Case Created','Case MOJ-2023-0271 opened.',adminId,'2024-02-22');
  insertLog.run('cd0611e7-6bda-44f1-98cb-b19fe403a72d','21cf2566-460c-4680-b513-4179c67e5b2b','Case Created','Case MOJ-2024-0272 opened.',adminId,'2024-10-29');
  insertLog.run('687d17af-161a-4ab7-bed8-48033bcecbb6','78c463b4-d79b-436c-a371-c609cb5df5ae','Case Created','Case MOJ-2024-0273 opened.',adminId,'2024-09-08');
  insertLog.run('359f8170-a25d-4f5f-8adc-ba9fdd9a4e29','78c463b4-d79b-436c-a371-c609cb5df5ae','Status Updated','Status changed to "Closed"',adminId,'2024-09-09');
  insertLog.run('e06b5a71-f1c2-44d2-8704-8d0559657203','2d2b91e4-6d09-491a-b272-cdb7e216c55e','Case Created','Case MOJ-2025-0274 opened.',adminId,'2025-04-01');
  insertLog.run('4edf9c1c-5878-47ad-b866-17dbbc3e5d11','2d2b91e4-6d09-491a-b272-cdb7e216c55e','Status Updated','Status changed to "Closed"',adminId,'2025-04-06');
  insertLog.run('da4327cf-83ed-4183-b62e-87c257e729a7','9a74ab22-f55e-4bd6-8848-d9b8cfa2e763','Case Created','Case MOJ-2023-0275 opened.',adminId,'2023-02-21');
  insertLog.run('d46d259f-d0b5-422a-b680-eee67447f6d8','c3a67c0b-215b-4d0e-9b3b-d4fa4a395974','Case Created','Case MOJ-2026-0276 opened.',adminId,'2026-02-14');
  insertLog.run('580fe53f-ae6f-4165-a28d-f910a11eb7b4','b4e80973-5854-434b-bad7-765f7cb671c6','Case Created','Case MOJ-2024-0277 opened.',adminId,'2024-11-04');
  insertLog.run('5c1682f0-ecde-475b-a9c8-40601d8ead55','e8d503e9-c9d9-4356-a030-5540af875461','Case Created','Case MOJ-2026-0278 opened.',adminId,'2026-03-23');
  insertLog.run('43e06edb-371b-483f-826a-2e5ac6b4bd4e','e8d503e9-c9d9-4356-a030-5540af875461','Status Updated','Status changed to "Active"',adminId,'2026-04-16');
  insertLog.run('8ac06e32-c150-4e29-912e-7b5d2d3d697c','381879f5-0c2c-4f7f-bb44-3d6cb0cbdc59','Case Created','Case MOJ-2025-0279 opened.',adminId,'2025-12-21');
  insertLog.run('f6927932-7503-4a43-9778-1abc3d5e30fe','722ae313-6af1-4648-95f3-e1f210921da1','Case Created','Case MOJ-2026-0280 opened.',adminId,'2026-04-16');
  insertLog.run('de3296a7-9284-423b-a40c-88172ddfb96e','722ae313-6af1-4648-95f3-e1f210921da1','Status Updated','Status changed to "Closed"',adminId,'2026-05-08');
  insertLog.run('82261ff0-cccf-4139-af7d-1e5da33b62ce','89b584c3-0da2-4ec6-8f63-827866dd444f','Case Created','Case MOJ-2024-0281 opened.',adminId,'2024-01-11');
  insertLog.run('96f4c9a4-7c62-4154-b5bc-6281efa0f8d9','645eb3d5-e39b-4452-935a-8c28cdc15564','Case Created','Case MOJ-2026-0282 opened.',adminId,'2026-05-04');
  insertLog.run('4864f773-8bd5-49bc-a096-9efdbed6266e','645eb3d5-e39b-4452-935a-8c28cdc15564','Status Updated','Status changed to "Closed"',adminId,'2026-05-10');
  insertLog.run('28e61268-83ac-439b-ace8-240aa49b3519','dcde997a-2ad4-41cb-bd95-e1f58ddc94e1','Case Created','Case MOJ-2023-0283 opened.',adminId,'2023-12-23');
  insertLog.run('5b2cddeb-e99c-4f5b-be70-ea63e5d85cfc','dcde997a-2ad4-41cb-bd95-e1f58ddc94e1','Status Updated','Status changed to "Active"',adminId,'2024-01-02');
  insertLog.run('7074540a-a41c-4187-ab2a-015a5a5f4134','55c91ac0-ebe9-4596-b076-01ef53d30c51','Case Created','Case MOJ-2024-0284 opened.',adminId,'2024-01-28');
  insertLog.run('857dea10-f5e7-41e4-8c8d-be6f3917dc60','18331205-6f0d-4328-95bd-240f9d6185c4','Case Created','Case MOJ-2026-0285 opened.',adminId,'2026-03-16');
  insertLog.run('647f6ce8-f29a-4382-bfa3-184045ca07f7','ea97b0a8-2f41-43cf-b819-857d7ccc7679','Case Created','Case MOJ-2025-0286 opened.',adminId,'2026-03-30');
  insertLog.run('dcf15a4e-1f7d-4352-93be-e88625d596bf','39024d11-fb44-43c0-9cc7-bdbe6c22eb0a','Case Created','Case MOJ-2026-0287 opened.',adminId,'2026-01-25');
  insertLog.run('82a15418-8cd0-4e5b-b5eb-7d98fe6f2c75','6c07093d-aedd-4e4a-b1ef-9bed50f85a35','Case Created','Case MOJ-2023-0288 opened.',adminId,'2024-03-27');
  insertLog.run('f2334f99-b89a-4f46-a31a-0bf7e17f2b03','6c07093d-aedd-4e4a-b1ef-9bed50f85a35','Status Updated','Status changed to "Closed"',adminId,'2024-04-13');
  insertLog.run('3fc3342d-b139-4938-a171-5b860152e5d8','f0d8bd26-2406-48d1-b1ac-3dad67c2ae2a','Case Created','Case MOJ-2024-0289 opened.',adminId,'2025-05-12');
  insertLog.run('0146a84f-c6c1-4447-aec1-5df6012ac2ac','08bf5eec-b732-4d4a-bd09-e8287f1b48b5','Case Created','Case MOJ-2026-0290 opened.',adminId,'2026-01-18');
  insertLog.run('ddd1389b-b6f9-4de9-8b42-dcf6d641ea6b','08bf5eec-b732-4d4a-bd09-e8287f1b48b5','Status Updated','Status changed to "Closed"',adminId,'2026-02-15');
  insertLog.run('2f263346-f1a9-4cfe-ab43-f275b70cc9b2','855292d7-4cc2-4bc5-877b-3f1f6e6233d2','Case Created','Case MOJ-2023-0291 opened.',adminId,'2023-10-18');
  insertLog.run('4da58828-f330-4b6c-ad52-c9c660eb234c','2da4cac0-9547-4f6a-bb1a-d1f7eeee5261','Case Created','Case MOJ-2025-0292 opened.',adminId,'2025-11-08');
  insertLog.run('3e8c4759-ccc5-4219-afc1-30f1ff414b53','d8a95196-a80c-4d6f-8618-21efc845175f','Case Created','Case MOJ-2025-0293 opened.',adminId,'2025-07-10');
  insertLog.run('ce4338de-9b63-496f-9667-beb46ee601ac','f27ea7a8-7f9f-47b8-9c66-fd8f5e00c61a','Case Created','Case MOJ-2024-0294 opened.',adminId,'2025-01-08');
  insertLog.run('b9a3417a-a3fd-45b3-ab5b-4524d27c71ab','f27ea7a8-7f9f-47b8-9c66-fd8f5e00c61a','Status Updated','Status changed to "Active"',adminId,'2025-02-07');
  insertLog.run('8bc216f6-64c8-4ed4-93f8-51f5ddbf86c4','6e21da8b-17c4-4b44-ba26-c2c090fb1ef5','Case Created','Case MOJ-2026-0295 opened.',adminId,'2026-02-10');
  insertLog.run('7e823d7a-7816-4aa7-865d-3d75c7665617','6e21da8b-17c4-4b44-ba26-c2c090fb1ef5','Status Updated','Status changed to "Closed"',adminId,'2026-02-11');
  insertLog.run('f4d559b9-c8ea-451f-9e2f-07ff002675bf','cf468a37-f505-478a-aaa9-f833fdbf7dff','Case Created','Case MOJ-2024-0296 opened.',adminId,'2024-01-17');
  insertLog.run('ca3f3e50-989b-4126-b981-996b13021bc1','c8d3adf9-074f-4c1c-96e5-656c54c91627','Case Created','Case MOJ-2026-0297 opened.',adminId,'2026-04-06');
  insertLog.run('5e45d0bb-27e0-42fb-9727-f0f6daad52a3','c8d3adf9-074f-4c1c-96e5-656c54c91627','Status Updated','Status changed to "Closed"',adminId,'2026-04-15');
  insertLog.run('45088b33-249f-4b1f-abf0-ea1613b9b1c1','dc381dc6-4e03-46bd-ad0e-50e12dd65e15','Case Created','Case MOJ-2023-0298 opened.',adminId,'2024-03-13');
  insertLog.run('9bf0079a-d4b7-4083-97a2-969bc8ba3acd','9e9566b8-698b-4165-a71c-3532d481d1fc','Case Created','Case MOJ-2025-0299 opened.',adminId,'2026-04-12');
  insertLog.run('7b0fa341-fe11-4d92-8f48-a825c65e6a3f','211018b7-f644-4c0c-8eea-d819f9f19897','Case Created','Case MOJ-2026-0300 opened.',adminId,'2026-02-25');
  insertLog.run('c0287291-ff5b-4cee-80a9-7b1fe4a24573','211018b7-f644-4c0c-8eea-d819f9f19897','Status Updated','Status changed to "Closed"',adminId,'2026-03-24');
  insertLog.run('0fdfe9a1-1560-4a59-8b3c-2eaa17503d81','d7624cd7-03e2-4a34-a2a4-7a546bbdf38f','Case Created','Case MOJ-2025-0301 opened.',adminId,'2025-06-22');
  insertLog.run('0130b89e-b843-4fdf-9786-763b1bafff63','2be1bda0-d789-484d-8c6e-dae6e1538d06','Case Created','Case MOJ-2024-0302 opened.',adminId,'2024-03-12');
  insertLog.run('1b90fec1-66eb-4ac1-bcf0-06090437cdb8','16e8ea5a-2cf1-423b-a076-fbe063ba0d5c','Case Created','Case MOJ-2026-0303 opened.',adminId,'2026-02-26');
  insertLog.run('7ba0f60d-5b8a-4c0b-843c-a0ad9a0b6fd7','912611e0-6a24-4846-9fbf-e0cd9ff7903f','Case Created','Case MOJ-2023-0304 opened.',adminId,'2024-04-05');
  insertLog.run('bf2ace75-ba29-45c3-8ff2-897961cf245d','bc03df35-a015-4c66-8a50-e312a0ab7f2a','Case Created','Case MOJ-2026-0305 opened.',adminId,'2026-01-31');
  insertLog.run('a2707143-b272-41a0-9c41-e6bd365c190d','5b651e0d-eec7-44e0-983f-2f637512c710','Case Created','Case MOJ-2024-0306 opened.',adminId,'2024-01-28');
  insertLog.run('2f0d22be-9051-485b-a4eb-b5e3e7141ca3','5b651e0d-eec7-44e0-983f-2f637512c710','Status Updated','Status changed to "Closed"',adminId,'2024-02-16');
  insertLog.run('21287628-8c44-4ec9-88b2-1255e0b2debd','b51febe0-b36a-4b82-bc7b-8c6a0b58ce3c','Case Created','Case MOJ-2026-0307 opened.',adminId,'2026-03-27');
  insertLog.run('b8fa58a9-f59b-4e8c-adf0-19fd8c7f020f','d05fd0a1-8247-4580-a6ed-67b04daecd74','Case Created','Case MOJ-2025-0308 opened.',adminId,'2026-02-07');
  insertLog.run('85b84b1f-9950-4084-b2fc-85258afe1813','d05fd0a1-8247-4580-a6ed-67b04daecd74','Status Updated','Status changed to "Closed"',adminId,'2026-02-23');
  insertLog.run('4e02ece9-9b4a-4db9-a80f-fd2645881788','637f9bdb-6e9f-4738-a097-9fadd0e71cdd','Case Created','Case MOJ-2026-0309 opened.',adminId,'2026-03-24');
  insertLog.run('e6257f6b-aac6-482a-916d-071821ac3a8b','1fef4bef-53e7-4b69-afbe-19b358006e3e','Case Created','Case MOJ-2024-0310 opened.',adminId,'2024-02-22');
  insertLog.run('74e720b2-49f5-438c-98ab-a9f23347e0d1','1fef4bef-53e7-4b69-afbe-19b358006e3e','Status Updated','Status changed to "Closed"',adminId,'2024-03-08');
  insertLog.run('2bc6d9a3-1aa0-4dc0-bb14-24dea979ddae','05a77cdc-b055-4a58-9783-37992db9c399','Case Created','Case MOJ-2025-0311 opened.',adminId,'2025-09-08');
  insertLog.run('fe566966-be27-473a-9280-ba615d99efef','ed58ec09-6bdf-472b-8306-e2020d4a5a8f','Case Created','Case MOJ-2023-0312 opened.',adminId,'2024-03-24');
  insertLog.run('0c27ffb9-b560-4597-8171-9e0b46eee898','9c63ef4d-e1a1-453e-a4d4-c046faf50db6','Case Created','Case MOJ-2023-0313 opened.',adminId,'2023-12-20');
  insertLog.run('876db8af-0b1d-49e2-80cc-871bafdaabf1','9c63ef4d-e1a1-453e-a4d4-c046faf50db6','Status Updated','Status changed to "Closed"',adminId,'2024-01-05');
  insertLog.run('fbecfe31-5d9f-475e-8dbe-d3235e513633','72ff0a2b-0456-4fa9-8a36-8b189512351a','Case Created','Case MOJ-2024-0314 opened.',adminId,'2024-12-04');
  insertLog.run('9d1a95d6-4688-4ddc-88e2-6044e473cfbe','72ff0a2b-0456-4fa9-8a36-8b189512351a','Status Updated','Status changed to "Closed"',adminId,'2025-01-02');
  insertLog.run('374f4adf-828e-4bba-a1d4-7d8d0340a9e7','602f213b-ce2d-42df-a1f4-76ff3b78ffdc','Case Created','Case MOJ-2023-0315 opened.',adminId,'2023-04-12');
  insertLog.run('ab094227-12a5-43fc-8d90-de389e7f1d96','602f213b-ce2d-42df-a1f4-76ff3b78ffdc','Status Updated','Status changed to "Active"',adminId,'2023-04-24');
  insertLog.run('9d7dc97a-5bb1-46d1-b19c-0bae83c8ca6d','d06e9426-9c2f-4cd1-ab8e-8f511059b2ab','Case Created','Case MOJ-2026-0316 opened.',adminId,'2026-02-23');
  insertLog.run('c6caacab-4d5c-444d-bf8b-253ac2adbd15','2beb7715-0c30-4dcb-a2c8-a01ed57beb77','Case Created','Case MOJ-2026-0317 opened.',adminId,'2026-03-07');
  insertLog.run('72279fd4-4b69-4355-b648-8df4a383b7bf','aa1e37d0-0da9-4a62-ac50-9998958b1d7e','Case Created','Case MOJ-2026-0318 opened.',adminId,'2026-03-16');
  insertLog.run('4004a8af-3e4a-44df-b0fa-23aba98904d2','7031dfe6-e30e-4ce8-ba62-5e45d7272289','Case Created','Case MOJ-2023-0319 opened.',adminId,'2023-03-12');
  insertLog.run('b4487286-3425-4274-a3a5-567a429ad060','7031dfe6-e30e-4ce8-ba62-5e45d7272289','Status Updated','Status changed to "Closed"',adminId,'2023-04-01');
  insertLog.run('b6601109-0541-4b7b-9b56-424e2179ec69','8309c65d-08cb-42f6-8ff5-88de5dbb98a4','Case Created','Case MOJ-2025-0320 opened.',adminId,'2025-07-25');
  insertLog.run('c5a09339-88ad-4b2f-a57c-249072fce169','8309c65d-08cb-42f6-8ff5-88de5dbb98a4','Status Updated','Status changed to "Active"',adminId,'2025-08-10');
  insertLog.run('5a233837-c6ba-4090-a484-0fdd6ba4e2a7','b0eaf015-3361-4d30-89ba-a65f8e669ee1','Case Created','Case MOJ-2026-0321 opened.',adminId,'2026-02-10');
  insertLog.run('58f4ce0b-b734-4b56-afce-dfaec425682b','3a4c2ffb-0503-4a32-be60-c7da8234bfc5','Case Created','Case MOJ-2026-0322 opened.',adminId,'2026-01-08');
  insertLog.run('b63dcad1-ed5e-45a2-a87e-b78a21be1433','b14a1234-0cf2-494a-bdeb-e9f880dfd10e','Case Created','Case MOJ-2026-0323 opened.',adminId,'2026-05-15');
  insertLog.run('975f4353-87ba-47fa-98a2-23755ce005ba','a5132ee5-92d2-44b6-ab2c-2c41ca935d17','Case Created','Case MOJ-2025-0324 opened.',adminId,'2025-12-06');
  insertLog.run('d0f62182-b6d3-4608-bb08-67930e8ff89e','a5132ee5-92d2-44b6-ab2c-2c41ca935d17','Status Updated','Status changed to "Active"',adminId,'2025-12-26');
  insertLog.run('599a3c40-2f8e-471b-bfef-8c5ab86b3914','197d0e7f-342c-482c-92fd-5c25016f5749','Case Created','Case MOJ-2023-0325 opened.',adminId,'2023-09-11');
  insertLog.run('21a53d08-07ab-4c3b-956d-ed2c63ca70eb','0e46b5ac-3c5d-43d1-8c67-7167945f51d3','Case Created','Case MOJ-2025-0326 opened.',adminId,'2026-02-23');
  insertLog.run('ac054bbe-b39b-455b-8f46-90373b9cf0a5','68041bae-3e62-429a-83f6-ddb65ae1996a','Case Created','Case MOJ-2026-0327 opened.',adminId,'2026-01-05');
  insertLog.run('9abcddf5-59b2-4cd6-b4a2-ef0ecc3202ad','68041bae-3e62-429a-83f6-ddb65ae1996a','Status Updated','Status changed to "Active"',adminId,'2026-01-31');
  insertLog.run('a50cb80e-d53b-4677-915e-96f2822a07a3','48de6319-c4a2-4e92-a3fa-cc4dbfa71b2f','Case Created','Case MOJ-2025-0328 opened.',adminId,'2026-02-27');
  insertLog.run('16d7d461-3ff0-406d-aae5-5ecbf80172f9','48de6319-c4a2-4e92-a3fa-cc4dbfa71b2f','Status Updated','Status changed to "Closed"',adminId,'2026-03-22');
  insertLog.run('8d7ffa2a-2247-407c-96e5-94e805bcd396','adc3a902-5125-4c7e-8a65-07bf6e8e86d2','Case Created','Case MOJ-2025-0329 opened.',adminId,'2025-06-24');
  insertLog.run('0b7cf3fe-5004-411a-b64c-740972d96788','06162ea5-3bf4-4cd1-839f-1c03a1a1eddf','Case Created','Case MOJ-2023-0330 opened.',adminId,'2023-05-11');
  insertLog.run('2edc17ec-8fe6-46d0-9e75-705f4ad82fb4','72c6216f-d007-445b-965a-14e96fcd6271','Case Created','Case MOJ-2024-0331 opened.',adminId,'2024-11-20');
  insertLog.run('5c8bcfce-b984-4bfb-94f3-cd0eea7eb55a','6256d5fc-348b-4d21-af00-b2dc10b4f89a','Case Created','Case MOJ-2024-0332 opened.',adminId,'2024-10-26');
  insertLog.run('2718bda9-58b1-4f83-81c6-29534786d1e5','ae732507-4668-422e-84c8-71d16c819244','Case Created','Case MOJ-2024-0333 opened.',adminId,'2025-03-27');
  insertLog.run('262105be-8c5f-4db7-a436-de602ddc3bf6','96bd8395-972a-4a99-8310-c44682a6fbfb','Case Created','Case MOJ-2025-0334 opened.',adminId,'2025-03-10');
  insertLog.run('f3b7b455-85d5-4dcf-aced-c9049935d364','96bd8395-972a-4a99-8310-c44682a6fbfb','Status Updated','Status changed to "Active"',adminId,'2025-04-09');
  insertLog.run('4270df7d-aabc-4efe-9779-6aa32543bf80','3e50ee01-27f5-4008-9061-d8bea545cb8e','Case Created','Case MOJ-2024-0335 opened.',adminId,'2024-12-10');
  insertLog.run('8dfa51a2-75a6-40fe-b0f6-b663162978a3','0bdff0ea-2c2b-4779-b0cb-d8b5c7f099cf','Case Created','Case MOJ-2023-0336 opened.',adminId,'2024-01-18');
  insertLog.run('83cae818-aefa-403d-9043-4e8ac7ff3c28','c5362535-545c-4e1f-869e-49ebb78e4f61','Case Created','Case MOJ-2023-0337 opened.',adminId,'2023-05-17');
  insertLog.run('6413ca12-709c-46bd-beae-b9445acb655c','29f1d189-00a9-4435-b4af-411c2f492611','Case Created','Case MOJ-2024-0338 opened.',adminId,'2025-03-20');
  insertLog.run('1e11fc4d-f9a6-4562-8716-de04b4f6216f','29f1d189-00a9-4435-b4af-411c2f492611','Status Updated','Status changed to "Active"',adminId,'2025-04-07');
  insertLog.run('f227fa3f-53c4-4c65-83ee-6f397b76a5f7','29b8e2af-23aa-432a-b104-e01b44af325b','Case Created','Case MOJ-2026-0339 opened.',adminId,'2026-04-08');
  insertLog.run('1e6bb77b-319b-4a14-9a7a-021b3ce5a745','162f256e-d6f6-4343-99a9-1434be8205f5','Case Created','Case MOJ-2025-0340 opened.',adminId,'2025-11-21');
  insertLog.run('8ba60bac-ffa9-4091-ae69-8c9a639ccc0f','903c002d-a584-4f14-9607-09d4f7e7540b','Case Created','Case MOJ-2024-0341 opened.',adminId,'2025-05-07');
  insertLog.run('b356beb0-94c4-4cdb-ac53-f0af10d53389','903c002d-a584-4f14-9607-09d4f7e7540b','Status Updated','Status changed to "Active"',adminId,'2025-05-12');
  insertLog.run('8a93ce6a-3b90-4104-b367-50cf020deea5','e58147e7-402f-4b4c-bfca-2727812b6e03','Case Created','Case MOJ-2024-0342 opened.',adminId,'2025-04-24');
  insertLog.run('a06192d0-bdbb-4965-90a6-255f5ff69934','cedb15cd-905c-4f20-96e8-744e74ac0e7d','Case Created','Case MOJ-2025-0343 opened.',adminId,'2025-12-29');
  insertLog.run('5e323228-6e1c-4809-a0d4-7f0d6a111db9','1643180c-231d-4391-bf57-5d59c3d36a8b','Case Created','Case MOJ-2026-0344 opened.',adminId,'2026-03-26');
  insertLog.run('4c590dea-d3c6-460b-baed-91a13a4b735a','1643180c-231d-4391-bf57-5d59c3d36a8b','Status Updated','Status changed to "Active"',adminId,'2026-04-13');
  insertLog.run('81fb4141-91bc-4857-8136-d6643087008b','b56deb74-f62f-436f-b858-d26dd3c37f73','Case Created','Case MOJ-2023-0345 opened.',adminId,'2024-04-08');
  insertLog.run('ad08971b-af38-49ac-adba-8c2d350bdb04','b56deb74-f62f-436f-b858-d26dd3c37f73','Status Updated','Status changed to "Closed"',adminId,'2024-04-19');
  insertLog.run('c88796cc-4284-4914-b86d-ad0c377b5ac4','689821c9-c610-46e1-8481-b0156f7950c9','Case Created','Case MOJ-2026-0346 opened.',adminId,'2026-05-13');
  insertLog.run('e725b3a7-bade-43fa-9475-a3be49b5d3ef','aeb4cdcd-4ccb-4e55-92c2-e437c519dcd4','Case Created','Case MOJ-2024-0347 opened.',adminId,'2025-05-12');
  insertLog.run('169bad3e-1b0a-409f-9a99-16b14f13703b','690ec231-8cde-4efe-bfa8-c3e8de31cddb','Case Created','Case MOJ-2024-0348 opened.',adminId,'2025-02-28');
  insertLog.run('19dfebca-4181-4ef9-8266-1059b091fd15','dd860caf-0a5a-4088-9bf9-893a2dd3f72f','Case Created','Case MOJ-2025-0349 opened.',adminId,'2026-02-11');
  insertLog.run('6f201295-bf8e-4e95-9e37-b1ae1f1ac6eb','0b4a0051-ed2f-4c87-bcde-60fdffb41c36','Case Created','Case MOJ-2025-0350 opened.',adminId,'2025-06-11');
  insertLog.run('c46d8f20-76a3-4550-a9c6-86989d5742eb','2ceb0a50-fc10-4e98-ac33-90b1845ed2c3','Case Created','Case MOJ-2023-0351 opened.',adminId,'2023-12-18');
  insertLog.run('120681ec-558d-403c-8fcb-b089bcdee795','66e3ac41-3739-4fef-bacb-1d36a663b5cb','Case Created','Case MOJ-2023-0352 opened.',adminId,'2023-07-20');
  insertLog.run('d71baed0-e0e6-4324-850b-ac4b1049ede2','b04952d8-3cc9-4b02-beac-8a5ef602792b','Case Created','Case MOJ-2023-0353 opened.',adminId,'2023-11-02');
  insertLog.run('3c48d8f5-8273-4fcc-8f0d-faec96a072cc','2312c693-80b8-4eb7-bb20-a3a9486967fc','Case Created','Case MOJ-2024-0354 opened.',adminId,'2024-04-04');
  insertLog.run('6b40b7de-5772-4b5d-a95e-a854b176c183','2cdb248d-eed2-4506-9be0-bdefe84547f5','Case Created','Case MOJ-2023-0355 opened.',adminId,'2023-02-04');
  insertLog.run('f6efd50c-fff5-4e97-87a5-2173a67105cc','70110f6b-f1e9-4014-a1e2-de68861c872d','Case Created','Case MOJ-2024-0356 opened.',adminId,'2024-09-05');
  insertLog.run('3495c6e9-87fb-4ddb-808b-62e51759cd15','70110f6b-f1e9-4014-a1e2-de68861c872d','Status Updated','Status changed to "Active"',adminId,'2024-09-10');
  insertLog.run('c580c9df-84e1-480a-9187-77bc11d897ae','78f8abc4-f6c5-427d-bf4d-fc1ce97ce36e','Case Created','Case MOJ-2025-0357 opened.',adminId,'2025-05-07');
  insertLog.run('36970349-9fa8-4bf3-a62d-7983db364f6a','78f8abc4-f6c5-427d-bf4d-fc1ce97ce36e','Status Updated','Status changed to "Active"',adminId,'2025-05-12');
  insertLog.run('d2a2b174-52a1-4408-8d63-a9634ce80554','63c1ac5d-f59c-46d1-a05b-8a48a4771b4e','Case Created','Case MOJ-2025-0358 opened.',adminId,'2025-06-06');
  insertLog.run('b84bf91c-4485-4579-be58-ba3fc8d55697','63c1ac5d-f59c-46d1-a05b-8a48a4771b4e','Status Updated','Status changed to "Active"',adminId,'2025-07-04');
  insertLog.run('26e1754c-bcd1-465d-bc3a-2c1e90401deb','7e844eb6-53c6-4c0b-b943-5f6e4feaaef9','Case Created','Case MOJ-2024-0359 opened.',adminId,'2024-01-10');
  insertLog.run('1b84d8f2-ee81-4f53-9f29-7b48978a59c7','5f75a683-da89-46f9-bf62-b0e89dad2104','Case Created','Case MOJ-2023-0360 opened.',adminId,'2023-07-20');
  insertLog.run('94e21c97-e77d-484b-8eb3-e07941251869','2681a666-8b76-456b-b0c9-5dd4e10360e7','Case Created','Case MOJ-2023-0361 opened.',adminId,'2024-05-08');
  insertLog.run('bc8c8a69-53ce-4f91-8028-785deb2b53a2','2681a666-8b76-456b-b0c9-5dd4e10360e7','Status Updated','Status changed to "Active"',adminId,'2024-05-27');
  insertLog.run('0f6da049-d64f-486f-97ca-150d181d4d8d','d6460c2a-ffb2-4104-9e46-367f8840efc9','Case Created','Case MOJ-2024-0362 opened.',adminId,'2024-09-06');
  insertLog.run('550d49a7-47bd-4ddd-b057-d183f4521c05','d6460c2a-ffb2-4104-9e46-367f8840efc9','Status Updated','Status changed to "Active"',adminId,'2024-10-02');
  insertLog.run('a500e6a9-7977-4c0b-84b7-ba114d044b3e','87adb711-f929-40b3-9dc6-7127873527fd','Case Created','Case MOJ-2025-0363 opened.',adminId,'2026-05-18');
  insertLog.run('eb16659c-a603-461f-bbbf-8591008e64e8','87adb711-f929-40b3-9dc6-7127873527fd','Status Updated','Status changed to "Active"',adminId,'2026-06-06');
  insertLog.run('09d4a310-75cc-4e3c-8324-f02ecfc1e99a','8cf9c7ac-c935-4f0e-aeb3-d80fa5b79034','Case Created','Case MOJ-2024-0364 opened.',adminId,'2024-11-30');
  insertLog.run('0f88befd-5a06-411f-8aae-9287809abc3d','22a85481-bc49-4cea-8555-eaf1634e05b0','Case Created','Case MOJ-2025-0365 opened.',adminId,'2026-03-28');
  insertLog.run('b923051e-f4a7-4df6-b9f7-04245617be66','6b5f85fe-8780-446a-a189-9526ebffd860','Case Created','Case MOJ-2024-0366 opened.',adminId,'2025-02-19');
  insertLog.run('12abfb0a-bd93-4541-ab27-073b0ed73109','6b5f85fe-8780-446a-a189-9526ebffd860','Status Updated','Status changed to "Active"',adminId,'2025-02-26');
  insertLog.run('34ce4f5d-58c7-47ff-91ce-b03f3164424d','a3020a24-b39a-41d7-8d26-e90997d30626','Case Created','Case MOJ-2024-0367 opened.',adminId,'2024-10-20');
  insertLog.run('31346d1e-d738-478c-a3af-97bb1266cdb2','2009c9db-3d0d-498c-a187-0afeb50d66eb','Case Created','Case MOJ-2024-0368 opened.',adminId,'2025-01-03');
  insertLog.run('a84154d5-818a-4fb8-8eea-e979fc520c77','2065bdd5-b764-44d1-90c1-4239c508d83c','Case Created','Case MOJ-2026-0369 opened.',adminId,'2026-02-16');
  insertLog.run('aa5a135f-4a64-4b23-ac53-9ef274633b4c','6c32d001-0109-41c8-acbb-820eb1dd2cbb','Case Created','Case MOJ-2025-0370 opened.',adminId,'2025-07-17');
  insertLog.run('56952697-1d2c-4f75-aee5-6476654c78ac','3175e926-f7b1-4fe7-aa4b-41ced0c048e0','Case Created','Case MOJ-2024-0371 opened.',adminId,'2025-02-05');
  insertLog.run('e5c13bd3-0efa-4327-8ab4-736ade302032','fda70a4c-fe6f-4431-ae75-f9b63015a4b1','Case Created','Case MOJ-2026-0372 opened.',adminId,'2026-04-18');
  insertLog.run('67dcaa5a-7893-463a-868c-bb7f64bf638d','d9957279-45fe-4190-b83a-7aab33fc55dd','Case Created','Case MOJ-2024-0373 opened.',adminId,'2025-02-15');
  insertLog.run('1bebfeba-fc6a-4869-8c97-3fa56baf3698','d9957279-45fe-4190-b83a-7aab33fc55dd','Status Updated','Status changed to "Closed"',adminId,'2025-02-23');
  insertLog.run('4db7934c-c658-49cf-a554-22bcd00a0874','b31cb2f6-0046-448a-9402-7d78f1fd7dca','Case Created','Case MOJ-2023-0374 opened.',adminId,'2023-01-03');
  insertLog.run('fc0e5dbd-dd52-46ea-aa4c-961c07e14a31','02ade229-e27e-47d6-8e93-255e5dca67d1','Case Created','Case MOJ-2025-0375 opened.',adminId,'2025-11-30');
  insertLog.run('3fb30537-73ac-4893-ae80-b85e90dd8416','02ade229-e27e-47d6-8e93-255e5dca67d1','Status Updated','Status changed to "Active"',adminId,'2025-12-14');
  insertLog.run('a1577d1b-9fc6-4f09-9e57-dea9731a6bf6','24757803-31e4-436a-bb26-0dea2c577c27','Case Created','Case MOJ-2026-0376 opened.',adminId,'2026-03-30');
  insertLog.run('38714f2c-6780-4b02-8942-a0dbe7c62b3f','3e1c438b-86e0-4d42-ac1c-6fda072c0322','Case Created','Case MOJ-2024-0377 opened.',adminId,'2024-09-17');
  insertLog.run('5c3f5e2d-22ff-4dde-96b6-447f45ce1fe1','5511ceff-d3b7-4bb4-8b00-e0da6ed65257','Case Created','Case MOJ-2023-0378 opened.',adminId,'2023-11-04');
  insertLog.run('ecda4ec5-9191-4743-9ead-836afa9180b1','e28d3eb4-e57c-405c-b194-d1abfccf229e','Case Created','Case MOJ-2023-0379 opened.',adminId,'2024-02-24');
  insertLog.run('79b8d50b-2701-409e-8df3-a12aab1fc28b','1cd4199b-0bb6-4170-ba27-fc117ff103f5','Case Created','Case MOJ-2024-0380 opened.',adminId,'2024-12-01');
  insertLog.run('96317b30-5f2a-4043-bb81-2ea2be45086e','2fc9e83e-8550-4456-a241-62c403c364ab','Case Created','Case MOJ-2026-0381 opened.',adminId,'2026-01-18');
  insertLog.run('061fe398-dd29-47aa-ba09-eb9470971e6b','d13bff95-052d-4388-a4b8-f294bedb8ecd','Case Created','Case MOJ-2024-0382 opened.',adminId,'2024-03-30');
  insertLog.run('eb819535-2554-48e0-8c46-3a9d099cca2e','d13bff95-052d-4388-a4b8-f294bedb8ecd','Status Updated','Status changed to "Active"',adminId,'2024-04-25');
  insertLog.run('2ecf4904-54ff-454a-bcb2-6ae7f52f2db9','4b8788bc-9a20-472c-a175-2ddf546573e2','Case Created','Case MOJ-2025-0383 opened.',adminId,'2025-09-05');
  insertLog.run('0626ca19-4b85-4c2b-b10d-d580a7a6da22','4b8788bc-9a20-472c-a175-2ddf546573e2','Status Updated','Status changed to "Closed"',adminId,'2025-10-03');
  insertLog.run('e6a0ede6-7071-482e-882b-b8c4ad1a2041','70c989cb-bd8d-4ecc-97b2-1a0ea6b762ba','Case Created','Case MOJ-2023-0384 opened.',adminId,'2023-11-21');
  insertLog.run('198aa419-8630-4837-9176-a62a1a761b93','89f821fc-9f5d-4ed7-b444-d6f52735dd0b','Case Created','Case MOJ-2023-0385 opened.',adminId,'2023-12-11');
  insertLog.run('cfa37395-dbee-48a5-8698-2ecacd23978b','b020f78f-fe93-46c3-8e18-e243e50c2bb5','Case Created','Case MOJ-2024-0386 opened.',adminId,'2024-04-12');
  insertLog.run('3f9d7032-6a75-45ba-a682-258e98cd95bc','dd6c72e2-22df-43a2-8c8f-7f31162f5508','Case Created','Case MOJ-2025-0387 opened.',adminId,'2025-02-10');
  insertLog.run('74a88f8c-c035-431f-a1ea-b32954d09d86','dd6c72e2-22df-43a2-8c8f-7f31162f5508','Status Updated','Status changed to "Closed"',adminId,'2025-02-28');
  insertLog.run('7ace14c3-1822-475c-8649-4baef6c57f4c','4baf2ca1-233c-47d5-a74e-8fae4d240937','Case Created','Case MOJ-2023-0388 opened.',adminId,'2024-05-19');
  insertLog.run('95f843b8-964a-4f1e-84c2-f8668fbfd53e','13e42503-4d2f-4da1-a502-671c35ed3f69','Case Created','Case MOJ-2024-0389 opened.',adminId,'2024-01-17');
  insertLog.run('7237e313-8aa3-48c9-a088-c1a8f3e558a2','a98302bf-c35d-4230-b585-01ff607428d2','Case Created','Case MOJ-2024-0390 opened.',adminId,'2024-01-05');
  insertLog.run('8a405a05-20af-44d8-b0a8-8fd88c3d7d28','f92da36d-5965-45ac-b6e7-4227cb30933c','Case Created','Case MOJ-2025-0391 opened.',adminId,'2025-08-30');
  insertLog.run('8a484ec7-df2e-4df9-a4fc-b22b6ea09ad6','f32b69da-e68f-4cd8-8cd6-ddbde728c1eb','Case Created','Case MOJ-2026-0392 opened.',adminId,'2026-04-13');
  insertLog.run('a280319c-33ff-445f-b932-c2388f4c4aa0','f32b69da-e68f-4cd8-8cd6-ddbde728c1eb','Status Updated','Status changed to "Active"',adminId,'2026-05-07');
  insertLog.run('52185a2b-5885-49c5-b348-dba4edc98804','51caf643-f10d-4828-887d-fa1b9d357db8','Case Created','Case MOJ-2025-0393 opened.',adminId,'2025-03-16');
  insertLog.run('08f1d08b-248d-48ef-b50e-020f1dfc218d','a0abc9ed-9530-4f6a-bc1e-6cf30d01972c','Case Created','Case MOJ-2025-0394 opened.',adminId,'2025-02-20');
  insertLog.run('58be921b-0c83-4ff6-abbd-987c9a5822ad','a0abc9ed-9530-4f6a-bc1e-6cf30d01972c','Status Updated','Status changed to "Active"',adminId,'2025-03-03');
  insertLog.run('bd23ee72-9d27-426e-b876-099c2a1439b0','c5bf5adf-4a51-49ab-a7bd-c809686f5401','Case Created','Case MOJ-2025-0395 opened.',adminId,'2025-07-30');
  insertLog.run('756b81d8-753d-40cb-bc86-ab504a8fa335','c5bf5adf-4a51-49ab-a7bd-c809686f5401','Status Updated','Status changed to "Active"',adminId,'2025-08-20');
  insertLog.run('9c7bc06d-419a-41e2-aa29-2a077ae00697','04f681b2-31dc-4bad-8a0f-3b3d9053f0d4','Case Created','Case MOJ-2024-0396 opened.',adminId,'2025-01-12');
  insertLog.run('15e3f21f-b871-40ea-8d7b-0c467fe26114','04f681b2-31dc-4bad-8a0f-3b3d9053f0d4','Status Updated','Status changed to "Active"',adminId,'2025-02-02');
  insertLog.run('8336815b-29f7-4107-88c2-a152cd618d97','822ca63e-87de-4ca7-a2e4-25d6d19e8b8f','Case Created','Case MOJ-2025-0397 opened.',adminId,'2025-03-24');
  insertLog.run('7e94db80-e7d0-4ba5-a26e-95472ec71e1d','6591d1e0-20f9-40f4-b1b4-e0b17bc1ae61','Case Created','Case MOJ-2026-0398 opened.',adminId,'2026-02-17');
  insertLog.run('cc58dfa6-3a15-46e5-b43a-406e0790ecc9','6591d1e0-20f9-40f4-b1b4-e0b17bc1ae61','Status Updated','Status changed to "Closed"',adminId,'2026-03-12');
  insertLog.run('a25064f5-d8cc-4598-9de8-d9c68ff977ca','7dd32d41-66cd-4989-9139-81b94c067dec','Case Created','Case MOJ-2023-0399 opened.',adminId,'2023-02-02');
  insertLog.run('01c72b43-d11b-406d-8e25-f079dffc92bf','78e852c8-fb8a-43b7-ab93-f64dc5784cf0','Case Created','Case MOJ-2023-0400 opened.',adminId,'2024-04-21');
  insertLog.run('899dfe40-fbd4-4534-97e0-0920bcbfc1ee','380338a6-ea3f-4c12-8254-385b8dc1b391','Case Created','Case MOJ-2024-0401 opened.',adminId,'2025-04-13');
  insertLog.run('0259d428-36ff-43d4-a4d1-d65b74c16d24','a1309210-b61b-43d5-8954-0e2bbc07bff8','Case Created','Case MOJ-2025-0402 opened.',adminId,'2026-01-19');
  insertLog.run('4d1a452d-665c-4ab4-89a9-3f836668d3a2','056ec0e6-fcac-49df-ae0f-e2d19afc0610','Case Created','Case MOJ-2025-0403 opened.',adminId,'2025-06-07');
  insertLog.run('4980c34d-cf6d-4e7e-b003-f995a6269c56','1d6635d7-840d-4895-a50b-85a88f0f8a3f','Case Created','Case MOJ-2024-0404 opened.',adminId,'2025-04-17');
  insertLog.run('d8760664-e39b-4fe5-9042-8e662f41547e','1d6635d7-840d-4895-a50b-85a88f0f8a3f','Status Updated','Status changed to "Active"',adminId,'2025-05-07');
  insertLog.run('6fed7175-1cf6-4ac3-a24d-995f6971484f','c481d189-3048-47b7-99d7-d6dc8699175f','Case Created','Case MOJ-2024-0405 opened.',adminId,'2025-03-27');
  insertLog.run('26a829b4-64d9-4099-a263-b05f18051261','2f93440b-64a9-4fe1-85ab-952aaacb63a4','Case Created','Case MOJ-2026-0406 opened.',adminId,'2026-03-03');
  insertLog.run('61a338fd-7ce9-49c7-a45b-eb07784357fc','6e6a5206-9950-44b6-a5d0-8dc1975d974c','Case Created','Case MOJ-2025-0407 opened.',adminId,'2025-05-29');
  insertLog.run('2f32c322-9f88-400e-899d-01afdffccddd','3c96cb8c-c7c6-49b4-9a1e-428caad5c2fc','Case Created','Case MOJ-2025-0408 opened.',adminId,'2026-05-13');
  insertLog.run('558c01ef-06ad-4443-ae3b-fc07cb4ce899','028edc63-d4e3-4592-b32b-792e46724b10','Case Created','Case MOJ-2026-0409 opened.',adminId,'2026-05-07');
  insertLog.run('4c287fcd-5585-42ab-8999-cf038498fe57','feaeb552-17db-42f4-8ba7-2311c20b5f19','Case Created','Case MOJ-2025-0410 opened.',adminId,'2026-03-08');
  insertLog.run('82b80040-bc50-4583-a313-44f3fa36ace0','feaeb552-17db-42f4-8ba7-2311c20b5f19','Status Updated','Status changed to "Closed"',adminId,'2026-03-15');
  insertLog.run('3a253fb5-5e48-428d-948c-e2ffa55fec67','0fc99e71-8baa-4313-9e13-f06c41e0845a','Case Created','Case MOJ-2025-0411 opened.',adminId,'2026-01-01');
  insertLog.run('583441cd-6eaa-4103-92fa-c359e832ace0','0fc99e71-8baa-4313-9e13-f06c41e0845a','Status Updated','Status changed to "Closed"',adminId,'2026-01-05');
  insertLog.run('1cd59da1-f10c-40b7-b15c-e6e6ad20ac85','271a61a1-580c-47f1-ab7f-99faba67d454','Case Created','Case MOJ-2024-0412 opened.',adminId,'2024-11-18');
  insertLog.run('033710b8-ada0-4406-9523-077111e1797a','92fb3449-a448-45eb-99fc-ef039a9e8cf7','Case Created','Case MOJ-2023-0413 opened.',adminId,'2023-01-08');
  insertLog.run('dbf5acc3-dcb2-4677-8b68-2c268f733d60','630dbbe8-bb5b-4380-bc21-0579c184bcfc','Case Created','Case MOJ-2023-0414 opened.',adminId,'2023-02-15');
  insertLog.run('0647f21b-fcfa-4a36-934b-efb28d5c5c63','630dbbe8-bb5b-4380-bc21-0579c184bcfc','Status Updated','Status changed to "Closed"',adminId,'2023-03-12');
  insertLog.run('ac373ae0-19ce-4964-a842-e01b5988c9cf','4bda392d-091b-4e7d-8f5e-32b9c6965bba','Case Created','Case MOJ-2023-0415 opened.',adminId,'2023-09-07');
  insertLog.run('175c048a-bcc6-4f4a-98ce-7c9a55742e6a','4bda392d-091b-4e7d-8f5e-32b9c6965bba','Status Updated','Status changed to "Active"',adminId,'2023-10-03');
  insertLog.run('7f9899a6-b461-40eb-9f53-eb4acf3b598b','ef6118a3-a3a2-4c46-8ba6-7dc36370ba85','Case Created','Case MOJ-2026-0416 opened.',adminId,'2026-02-04');
  insertLog.run('defd8cd8-8eac-4fe2-863d-de681844c652','45b356f1-07c8-4f60-80c3-5ff94b6381f2','Case Created','Case MOJ-2026-0417 opened.',adminId,'2026-04-30');
  insertLog.run('575f5a64-425c-44b1-a06e-9007221082e8','262eefac-c7dc-4350-858e-9a8601c4746b','Case Created','Case MOJ-2024-0418 opened.',adminId,'2024-01-01');
  insertLog.run('db179b59-fdf5-4101-840e-da9d8b00e842','262eefac-c7dc-4350-858e-9a8601c4746b','Status Updated','Status changed to "Active"',adminId,'2024-01-09');
  insertLog.run('9b1f65ac-9d7f-4f4d-9850-ca4564eb7d82','bb669d99-76e1-4d14-9e85-3c6c0b607637','Case Created','Case MOJ-2025-0419 opened.',adminId,'2025-12-16');
  insertLog.run('78327e56-0b70-4e00-aed0-fbf34ca4272a','635c0bdb-b3f5-4340-8571-76ad23a14380','Case Created','Case MOJ-2026-0420 opened.',adminId,'2026-02-03');
  insertLog.run('8852962e-aae6-4847-a17c-e746f52cd37f','0596b4fb-f54c-46e4-8359-7b55d876b49f','Case Created','Case MOJ-2023-0421 opened.',adminId,'2023-11-16');
  insertLog.run('4203016e-7d6e-42a6-999a-fc72b9cddbe6','86858631-b078-425a-92ad-1538eb4215d5','Case Created','Case MOJ-2023-0422 opened.',adminId,'2024-02-15');
  insertLog.run('a98df57e-ba07-4b76-9a92-0b5f73f76e1a','f3fbb18a-208e-4278-a683-9222548332b2','Case Created','Case MOJ-2026-0423 opened.',adminId,'2026-01-11');
  insertLog.run('1b00af9a-b120-4cd3-bf04-9cee4a32c4a7','e690946f-c032-467f-8a55-9e5e32896529','Case Created','Case MOJ-2024-0424 opened.',adminId,'2024-11-16');
  insertLog.run('30fdbfa6-2b49-4b74-a47d-ad28093edd38','3b99511d-5fba-4c47-8115-e0d49e5e645c','Case Created','Case MOJ-2025-0425 opened.',adminId,'2026-02-10');
  insertLog.run('34f2c820-0e08-447f-a4b8-fa44b93c8e3c','3b99511d-5fba-4c47-8115-e0d49e5e645c','Status Updated','Status changed to "Closed"',adminId,'2026-02-25');
  insertLog.run('f087c31a-b827-44ac-92e6-a67168801133','aca5293d-6f9a-4341-b3c5-69d76fcb5f12','Case Created','Case MOJ-2025-0426 opened.',adminId,'2026-01-27');
  insertLog.run('08072a2c-da13-4334-8b47-605348470a81','ea7ed323-bf1d-447b-aed6-10b7a3b883d5','Case Created','Case MOJ-2024-0427 opened.',adminId,'2024-08-17');
  insertLog.run('d91419c9-5c88-459c-8055-3349d099c758','e71e9623-6093-4373-b54a-e463a8adde98','Case Created','Case MOJ-2025-0428 opened.',adminId,'2025-06-11');
  insertLog.run('d4a96b99-8089-4d40-bacf-1d2c97011a91','e71e9623-6093-4373-b54a-e463a8adde98','Status Updated','Status changed to "Active"',adminId,'2025-06-28');
  insertLog.run('ba1ee873-fe80-4b0d-b944-0336b3209f71','c8da460f-3598-4802-8b31-0d78b3de8749','Case Created','Case MOJ-2024-0429 opened.',adminId,'2024-03-11');
  insertLog.run('89f0c7a5-cd14-4ece-97b1-95d1e2252008','33202732-b560-4e8c-96fc-25909ed66bb9','Case Created','Case MOJ-2025-0430 opened.',adminId,'2025-02-09');
  insertLog.run('24b88837-aacc-4d23-a903-331713300aa9','64ce5bbb-1782-4a8c-866d-042c62b4d746','Case Created','Case MOJ-2023-0431 opened.',adminId,'2023-01-29');
  insertLog.run('d79fbc02-e10e-4b5a-9ff6-3a99587a81f2','b3e4ef6a-3652-483b-920b-4d302ec63599','Case Created','Case MOJ-2023-0432 opened.',adminId,'2023-10-04');
  insertLog.run('f42de7f8-5139-498f-b730-0cd3a3ee1bef','0cdf021a-4f2e-4222-b118-251525a304f7','Case Created','Case MOJ-2026-0433 opened.',adminId,'2026-04-11');
  insertLog.run('567ec787-fe02-457e-955e-1995dd3b2a2c','bbac9827-428a-4f74-a51a-f6e253339b63','Case Created','Case MOJ-2023-0434 opened.',adminId,'2023-08-11');
  insertLog.run('174aa1e5-5d1d-4d7c-868b-efa00f0df9c3','323b2290-0d93-4e2a-b041-4e61fe0eb7df','Case Created','Case MOJ-2024-0435 opened.',adminId,'2024-12-16');
  insertLog.run('04e0c158-b8c5-4c9f-a2e9-2ab3908dee97','438094e3-2f6d-459f-a5e2-0c49d9469bd3','Case Created','Case MOJ-2025-0436 opened.',adminId,'2025-06-06');
  insertLog.run('a1f57722-37ad-4250-84a5-dc5e947614e8','f1b33220-b381-450c-a752-1fe3fed3665b','Case Created','Case MOJ-2024-0437 opened.',adminId,'2025-01-07');
  insertLog.run('ffc1a1e3-f0ac-4bc2-854a-26a192e35c0c','f1b33220-b381-450c-a752-1fe3fed3665b','Status Updated','Status changed to "Closed"',adminId,'2025-02-04');
  insertLog.run('358b9992-9a81-4859-b014-a8b48419075a','811b2af0-1eb4-418b-add0-cf3cba59fd31','Case Created','Case MOJ-2025-0438 opened.',adminId,'2025-08-30');
  insertLog.run('f5e1fd96-a535-4163-85ff-a0131c2957b1','d999c498-b8e7-4d77-b226-8d443f7291a7','Case Created','Case MOJ-2025-0439 opened.',adminId,'2025-10-26');
  insertLog.run('0860f9db-89fb-403e-9afc-b1fd22fe91c9','dbb54bcc-9b2d-491d-ba81-c7574dee8d31','Case Created','Case MOJ-2025-0440 opened.',adminId,'2025-12-05');
  insertLog.run('018a8e1f-0b57-4b0b-8889-0ae32e9166d0','24cd6682-4342-40be-b56a-ba6c036aaf0e','Case Created','Case MOJ-2026-0441 opened.',adminId,'2026-05-17');
  insertLog.run('18d65f2c-68a6-4199-82e8-3e2aa17061a8','0c69c1a6-427c-41f1-bf6b-a16898552080','Case Created','Case MOJ-2025-0442 opened.',adminId,'2025-06-27');
  insertLog.run('c7fd96d1-71b5-4ec7-91cc-9cb0fdd1b363','4ae9a37f-48df-48e3-a713-251e3df8d397','Case Created','Case MOJ-2023-0443 opened.',adminId,'2023-03-19');
  insertLog.run('3a3ddb0b-2770-4f74-ba14-945fa3255727','4ae9a37f-48df-48e3-a713-251e3df8d397','Status Updated','Status changed to "Active"',adminId,'2023-04-10');
  insertLog.run('ea439825-96be-4130-8684-02c3833606dc','f51972eb-b659-4600-8b57-f38f300b0c5c','Case Created','Case MOJ-2024-0444 opened.',adminId,'2025-04-10');
  insertLog.run('d81a06b4-3c1f-424e-8e94-72456f29b0fd','d3b80a28-75ab-4905-bb3c-5797fb08bdbc','Case Created','Case MOJ-2024-0445 opened.',adminId,'2025-05-14');
  insertLog.run('ef6cd92d-a4fa-4c08-93fe-3782814c9c8e','961e1cb8-ee61-4a30-abb3-bde65786e41f','Case Created','Case MOJ-2023-0446 opened.',adminId,'2023-06-13');
  insertLog.run('29bea586-c2d1-45a4-9d89-25b18335192c','961e1cb8-ee61-4a30-abb3-bde65786e41f','Status Updated','Status changed to "Active"',adminId,'2023-07-12');
  insertLog.run('89dd7aeb-1ca8-4687-97f0-e6a0b4298d9f','8ab4451e-2c96-4056-9699-a5e140ce430e','Case Created','Case MOJ-2025-0447 opened.',adminId,'2025-04-05');
  insertLog.run('afc98ade-2596-4f93-b98f-6a4c1f3f82f3','8ab4451e-2c96-4056-9699-a5e140ce430e','Status Updated','Status changed to "Closed"',adminId,'2025-04-25');
  insertLog.run('a42f2db4-f302-47fe-af7d-aa6190b6c68c','f77a9dd9-e4c6-4c6c-8742-fa45d1defc08','Case Created','Case MOJ-2024-0448 opened.',adminId,'2024-12-18');
  insertLog.run('c6043699-96b3-4792-87cc-1e0059be4c51','2dc28652-4669-4703-9bf2-898c977636de','Case Created','Case MOJ-2024-0449 opened.',adminId,'2024-04-08');
  insertLog.run('1d3735e7-ff78-4b46-89bf-d61c565aae73','2dc28652-4669-4703-9bf2-898c977636de','Status Updated','Status changed to "Active"',adminId,'2024-04-11');
  insertLog.run('609fd455-700f-452d-8ebc-4c9bb3da91e3','8afe8c35-5ea8-44f3-bff5-41406a042c76','Case Created','Case MOJ-2024-0450 opened.',adminId,'2024-08-22');
  insertLog.run('5c47ef96-4012-4080-ab50-836279d276ac','8afe8c35-5ea8-44f3-bff5-41406a042c76','Status Updated','Status changed to "Closed"',adminId,'2024-09-04');
  insertLog.run('962c2d4e-1425-4cd4-9b99-eb413926b381','1c78bc0d-3b1b-4d47-a130-9fcd522dd2bf','Case Created','Case MOJ-2023-0451 opened.',adminId,'2024-05-24');
  insertLog.run('dc4d582f-17d4-4ebf-92e3-ed3d187adbb1','2a607eba-fc8f-4d29-a829-caaaf0cf20e7','Case Created','Case MOJ-2026-0452 opened.',adminId,'2026-03-19');
  insertLog.run('13010300-b1ce-477d-a692-7421ad963acb','b11a1c1b-ebb8-447e-bb42-123e062c0c82','Case Created','Case MOJ-2023-0453 opened.',adminId,'2023-09-14');
  insertLog.run('e27b5f9f-0c13-4102-93ae-bfd7b5798feb','b11a1c1b-ebb8-447e-bb42-123e062c0c82','Status Updated','Status changed to "Active"',adminId,'2023-09-27');
  insertLog.run('5fdaf114-9a41-4650-ac02-c9b6091de87c','5900296f-d549-406a-860d-477be9879b30','Case Created','Case MOJ-2026-0454 opened.',adminId,'2026-02-21');
  insertLog.run('15fe3b64-8937-4902-920f-0476d0d33d2d','5900296f-d549-406a-860d-477be9879b30','Status Updated','Status changed to "Active"',adminId,'2026-02-25');
  insertLog.run('a9847123-b620-4e8a-aee7-3ffa239237ba','9c15d5ee-ba60-4a1a-a5dc-034781af9055','Case Created','Case MOJ-2023-0455 opened.',adminId,'2023-09-26');
  insertLog.run('4ad72edf-8cfd-434d-94f8-260cbf786b91','9c15d5ee-ba60-4a1a-a5dc-034781af9055','Status Updated','Status changed to "Closed"',adminId,'2023-10-02');
  insertLog.run('c697bee8-d81f-4551-8257-681f868a9bcf','17261a69-9fb7-4570-99a9-1a17d11c35c0','Case Created','Case MOJ-2026-0456 opened.',adminId,'2026-02-08');
  insertLog.run('307dc2b2-7204-4f7d-b1a3-27272eab0156','21f875d2-076e-47ec-a1c5-846b3cc7f557','Case Created','Case MOJ-2026-0457 opened.',adminId,'2026-02-03');
  insertLog.run('28556890-e03c-4346-bcff-3a9a53b08a16','21f875d2-076e-47ec-a1c5-846b3cc7f557','Status Updated','Status changed to "Closed"',adminId,'2026-02-21');
  insertLog.run('2c6726fe-ad89-4738-a461-46c1d0815d95','3aa737ca-cfd5-4135-8dec-4effffe5cae3','Case Created','Case MOJ-2023-0458 opened.',adminId,'2023-07-29');
  insertLog.run('494029d3-9c59-45d5-aee3-ac4f547ce186','73822348-bdc9-40c0-abc0-1f6eea263bca','Case Created','Case MOJ-2024-0459 opened.',adminId,'2024-06-27');
  insertLog.run('c63dba10-21c9-46ca-a342-cde7819d9ea6','284acabe-9fc2-45c1-bf81-930339aeb916','Case Created','Case MOJ-2025-0460 opened.',adminId,'2026-05-24');
  insertLog.run('72a9f4fa-50ac-42db-a0ce-2c3a04e494e7','2a18c824-6577-46fd-bd3b-6367c1975067','Case Created','Case MOJ-2024-0461 opened.',adminId,'2025-01-28');
  insertLog.run('5d9056e2-c708-494d-ae8f-499faa4b9c01','2a18c824-6577-46fd-bd3b-6367c1975067','Status Updated','Status changed to "Closed"',adminId,'2025-01-31');
  insertLog.run('9a54063b-e88f-47b7-a197-8f5bbeb88b60','c4ebe37d-3b05-4478-9dfa-f6928aa257e3','Case Created','Case MOJ-2025-0462 opened.',adminId,'2025-09-27');
  insertLog.run('b4b70c49-763d-4f66-aab9-8dfc2dcd4765','5e51866d-3ff7-4957-812f-da6bf7b8a526','Case Created','Case MOJ-2023-0463 opened.',adminId,'2024-03-10');
  insertLog.run('cfa8f591-a6a8-4af5-97d6-85d73dab0e89','5e51866d-3ff7-4957-812f-da6bf7b8a526','Status Updated','Status changed to "Closed"',adminId,'2024-03-26');
  insertLog.run('040e3af3-7ef2-49c9-993b-72b47e788bde','6382f38c-a177-45e5-9919-16e797eaf2f6','Case Created','Case MOJ-2026-0464 opened.',adminId,'2026-03-16');
  insertLog.run('237db838-e9f5-4d09-9779-ba243a538850','6382f38c-a177-45e5-9919-16e797eaf2f6','Status Updated','Status changed to "Closed"',adminId,'2026-03-23');
  insertLog.run('652441ca-ae3e-404e-958f-117a50bfc9c3','394648f4-e18f-49e3-b297-d515a4096fec','Case Created','Case MOJ-2026-0465 opened.',adminId,'2026-02-24');
  insertLog.run('fc94a56d-c152-4489-a74a-3ddcf6ef84cd','de065219-f1f7-420d-b3a9-bbf85ddaa633','Case Created','Case MOJ-2025-0466 opened.',adminId,'2026-01-06');
  insertLog.run('15cd5aa4-8231-4592-9b40-9ec41e87c04a','943f7f20-e7b0-44b0-abb7-ae93841f4b14','Case Created','Case MOJ-2024-0467 opened.',adminId,'2024-08-30');
  insertLog.run('abb4a5c1-10f3-46f9-9363-a17fdd7feb4a','943f7f20-e7b0-44b0-abb7-ae93841f4b14','Status Updated','Status changed to "Closed"',adminId,'2024-09-28');
  insertLog.run('fa4ed68f-a09d-400e-ae58-f556dca6a1da','7d943bd4-fc81-4e1a-a2d4-50518d018bf2','Case Created','Case MOJ-2025-0468 opened.',adminId,'2025-09-24');
  insertLog.run('80173b14-c461-4fde-820c-8192707030de','2c8c6c40-83a2-4d66-b40d-86a3bf029c6c','Case Created','Case MOJ-2025-0469 opened.',adminId,'2025-01-16');
  insertLog.run('f2e18a7c-de1d-4ea9-aace-82fa64cf0608','3781066b-55fe-4529-affe-63931b1fc3fe','Case Created','Case MOJ-2026-0470 opened.',adminId,'2026-03-22');
  insertLog.run('b5798c57-3ab0-47a3-a61b-1fc728d660ae','5034fd29-ca90-415b-bbf3-406015e79654','Case Created','Case MOJ-2024-0471 opened.',adminId,'2024-06-03');
  insertLog.run('51e84323-d674-4bd2-933f-0aca9bf7fa11','5034fd29-ca90-415b-bbf3-406015e79654','Status Updated','Status changed to "Active"',adminId,'2024-06-18');
  insertLog.run('918f3dd0-ce5a-446a-a719-178f54f85d23','24e9f23b-72f6-400f-a433-b9a248dfc7f9','Case Created','Case MOJ-2023-0472 opened.',adminId,'2024-04-17');
  insertLog.run('85daaf10-4e6d-4ba1-a3ba-b1a35890b4d6','40fd66fa-4ee2-4e77-94f6-7fba9650e637','Case Created','Case MOJ-2024-0473 opened.',adminId,'2024-12-31');
  insertLog.run('92483205-91c4-4fd2-b0fe-792878c429dc','40fd66fa-4ee2-4e77-94f6-7fba9650e637','Status Updated','Status changed to "Closed"',adminId,'2025-01-11');
  insertLog.run('76a5c687-bcbd-480f-835f-c9fea56cf765','0284d0c0-65bb-407b-a85f-f2dd2c1afdb1','Case Created','Case MOJ-2026-0474 opened.',adminId,'2026-03-21');
  insertLog.run('09a45cbf-140f-4775-854c-5c38184a2ccc','8b38d08a-f908-48a9-857f-dba5d8df4d0f','Case Created','Case MOJ-2025-0475 opened.',adminId,'2025-03-02');
  insertLog.run('ef99edc7-f8b7-4ce5-8fa5-e27acda15022','1d649cb3-b024-4ec4-a145-2c5822d1db7d','Case Created','Case MOJ-2023-0476 opened.',adminId,'2023-03-14');
  insertLog.run('17c4db48-e016-4f22-9031-48d633a877bf','a6a21d72-6dbc-4136-bc8e-ee507faa6f3b','Case Created','Case MOJ-2026-0477 opened.',adminId,'2026-01-13');
  insertLog.run('87331e2a-ef8b-4cb3-9960-f856684515f8','082055ad-47ad-414a-8430-3129fa8ce15b','Case Created','Case MOJ-2026-0478 opened.',adminId,'2026-03-27');
  insertLog.run('0f62fd9d-0906-4307-a598-dd182c2803af','54020390-4869-4c8d-a0b3-aa788d8d425b','Case Created','Case MOJ-2026-0479 opened.',adminId,'2026-03-21');
  insertLog.run('1d79a2e4-0de9-40fa-ad10-7c6921b8f04b','4e9b3e75-82de-40a4-86ed-3b373dbc19b5','Case Created','Case MOJ-2024-0480 opened.',adminId,'2024-04-03');
  insertLog.run('48a8df58-a45c-4175-af3c-feb25539aa8d','777dc458-2f83-44ca-bb57-15d3a8fb66a1','Case Created','Case MOJ-2026-0481 opened.',adminId,'2026-02-13');
  insertLog.run('96e48a3d-02b7-4ef0-ba94-7f2c1fe11f74','4b2d46b8-120c-4929-b0e0-ed19d3f0d529','Case Created','Case MOJ-2023-0482 opened.',adminId,'2023-11-29');
  insertLog.run('df679033-00e6-4edc-84ca-a88c78c71f9b','ffc7c35b-43dc-4362-bf92-683dd0d6c3e4','Case Created','Case MOJ-2024-0483 opened.',adminId,'2025-02-20');
  insertLog.run('5aa8ad2a-0170-4a5c-822e-4bed8b4a88d4','ae7438f9-8c14-4dae-9e45-f70858c84bd1','Case Created','Case MOJ-2023-0484 opened.',adminId,'2023-02-19');
  insertLog.run('6f0711dc-b909-47c8-af08-06ea3a830556','3a1bebfc-a1d1-4564-914c-18b66798ca33','Case Created','Case MOJ-2026-0485 opened.',adminId,'2026-02-05');
  insertLog.run('7327e8a9-8a0f-4301-85dc-c479e437c07a','3a1bebfc-a1d1-4564-914c-18b66798ca33','Status Updated','Status changed to "Active"',adminId,'2026-02-20');
  insertLog.run('261c6ac6-b893-42f5-a6c8-96a662932a85','2d6f3ca7-7452-4cd6-8bc4-275cf87a5afd','Case Created','Case MOJ-2025-0486 opened.',adminId,'2025-12-15');
  insertLog.run('622864ae-5a2e-4ff7-b4fe-70e3baacb7a3','15353f26-5d1f-4905-a872-2d5b4bae86ed','Case Created','Case MOJ-2023-0487 opened.',adminId,'2023-05-31');
  insertLog.run('0ef0d868-b0b4-4af7-8090-7bd45930448c','45784673-6e02-4fee-951f-c8c4f6f9ae0e','Case Created','Case MOJ-2025-0488 opened.',adminId,'2025-08-10');
  insertLog.run('29faffac-5f44-4038-a201-aaf52b24ec55','45784673-6e02-4fee-951f-c8c4f6f9ae0e','Status Updated','Status changed to "Closed"',adminId,'2025-08-23');
  insertLog.run('0faf04b6-42fa-4194-8a04-7ac3609b8bbd','ff1ec74c-6b3a-4a0c-9759-7f3f31f2352e','Case Created','Case MOJ-2026-0489 opened.',adminId,'2026-02-05');
  insertLog.run('9fcd0929-b9ff-4398-8246-c96f8befa250','72310e08-afd6-4f0e-9c02-29aa2fdf63f2','Case Created','Case MOJ-2024-0490 opened.',adminId,'2025-03-29');
  insertLog.run('716dcdd5-385b-4dd2-8f1e-4f4e46d791f2','7ecba652-c0a5-4b76-9cf9-5b41c44aab1c','Case Created','Case MOJ-2024-0491 opened.',adminId,'2024-04-02');
  insertLog.run('20b0104e-f65c-4cbe-ae69-14d103a647c4','7ecba652-c0a5-4b76-9cf9-5b41c44aab1c','Status Updated','Status changed to "Closed"',adminId,'2024-04-21');
  insertLog.run('24d6d138-e8c4-43e9-99b3-37603927b3ce','58a7ce8c-e068-4c57-bfed-086b9eac455b','Case Created','Case MOJ-2026-0492 opened.',adminId,'2026-05-20');
  insertLog.run('67bdae57-d448-4e9b-ab8b-8aaef964627f','0526c082-bcc3-4fc7-b93d-26a17b659679','Case Created','Case MOJ-2026-0493 opened.',adminId,'2026-01-21');
  insertLog.run('b39e171e-386f-4962-951e-764523b38807','f64bd564-f8e9-4702-b5c4-437cd093495a','Case Created','Case MOJ-2023-0494 opened.',adminId,'2024-02-03');
  insertLog.run('a5fd5398-eb48-4094-b9d8-6396fa308823','1f7cb411-72d3-4ae0-a721-f9ee277ae395','Case Created','Case MOJ-2026-0495 opened.',adminId,'2026-01-10');
  insertLog.run('565aa7e8-ceae-4b33-8f92-900596a41f21','1f7cb411-72d3-4ae0-a721-f9ee277ae395','Status Updated','Status changed to "Closed"',adminId,'2026-01-29');
  insertLog.run('703b7be2-9fdb-466b-8be4-316ed6916890','6deecf74-a55e-41ce-a5fc-218c33439082','Case Created','Case MOJ-2023-0496 opened.',adminId,'2023-02-12');
  insertLog.run('51d4b3ca-a973-47f9-a2b8-18ab866b5dda','fd5300d8-a14e-4bb2-bd06-88c79410bbd9','Case Created','Case MOJ-2025-0497 opened.',adminId,'2025-10-30');
  insertLog.run('6589a63b-560a-4d71-97bc-0dc4739d02bd','fd5300d8-a14e-4bb2-bd06-88c79410bbd9','Status Updated','Status changed to "Closed"',adminId,'2025-11-08');
  insertLog.run('c85cf2dd-a9ba-414b-b722-288d89172670','f4d5492f-f5d8-440d-ba78-de3d1abed1c8','Case Created','Case MOJ-2024-0498 opened.',adminId,'2025-05-10');
  insertLog.run('48e609d3-8cff-4d55-a9cf-e4c52f262556','c5210131-5070-4814-9d20-b57c86eac608','Case Created','Case MOJ-2024-0499 opened.',adminId,'2025-01-10');
  insertLog.run('83682313-11aa-47eb-9b91-fe183ebd19ae','4f0c8c58-7bb4-4a74-a25b-8d6d670c0337','Case Created','Case MOJ-2026-0500 opened.',adminId,'2026-04-10');
  insertLog.run('f86d7cb4-cddf-4491-8b06-665b04753d03','4f0c8c58-7bb4-4a74-a25b-8d6d670c0337','Status Updated','Status changed to "Active"',adminId,'2026-04-25');
});

seedAll();
db.pragma('foreign_keys = ON');
const count = db.prepare('SELECT COUNT(*) as c FROM cases').get().c;
console.log(`✅  Done — ${count} total cases now in magistrate.db`);
db.close();