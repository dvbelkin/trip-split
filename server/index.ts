import "dotenv/config";
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
fs.mkdirSync("data", { recursive: true });
fs.mkdirSync("data/avatars", { recursive: true });
fs.mkdirSync("data/covers", { recursive: true });
const db = new Database("data/trips.db");
db.pragma("foreign_keys=ON");
db.pragma("journal_mode=WAL");
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS trips(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,name TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'RUB',start_date TEXT,end_date TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY,trip_id INTEGER NOT NULL,name TEXT NOT NULL,color TEXT NOT NULL,FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,trip_id INTEGER NOT NULL,name TEXT NOT NULL,color TEXT NOT NULL,icon TEXT DEFAULT 'tag',FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY,trip_id INTEGER NOT NULL,title TEXT NOT NULL,amount INTEGER NOT NULL,date TEXT NOT NULL,paid_by INTEGER NOT NULL,category_id INTEGER NOT NULL,FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,FOREIGN KEY(paid_by) REFERENCES members(id),FOREIGN KEY(category_id) REFERENCES categories(id));
CREATE TABLE IF NOT EXISTS expense_participants(expense_id INTEGER NOT NULL,member_id INTEGER NOT NULL,PRIMARY KEY(expense_id,member_id),FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE CASCADE,FOREIGN KEY(member_id) REFERENCES members(id));`);
try {
  db.exec(
    "ALTER TABLE members ADD COLUMN user_id INTEGER REFERENCES users(id)",
  );
} catch {}
try {
  db.exec(
    "ALTER TABLE expenses ADD COLUMN created_by INTEGER REFERENCES users(id)",
  );
} catch {}
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
} catch {}
try {
  db.exec("ALTER TABLE trips ADD COLUMN cover TEXT");
} catch {}
try {
  db.exec(
    "ALTER TABLE expenses ADD COLUMN paid_from_fund INTEGER NOT NULL DEFAULT 0",
  );
} catch {}
db.exec(`CREATE TABLE IF NOT EXISTS contributions(
  id INTEGER PRIMARY KEY, trip_id INTEGER NOT NULL, member_id INTEGER NOT NULL,
  amount INTEGER NOT NULL, date TEXT NOT NULL, note TEXT, created_by INTEGER NOT NULL,
  FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY(member_id) REFERENCES members(id), FOREIGN KEY(created_by) REFERENCES users(id)
)`);
db.exec(`UPDATE members SET user_id=(SELECT user_id FROM trips WHERE trips.id=members.trip_id)
  WHERE user_id IS NULL AND id=(SELECT MIN(m2.id) FROM members m2 WHERE m2.trip_id=members.trip_id)
  AND NOT EXISTS(SELECT 1 FROM members linked WHERE linked.trip_id=members.trip_id AND linked.user_id IS NOT NULL)`);
db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_member_trip_user ON members(trip_id,user_id) WHERE user_id IS NOT NULL",
);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/avatars", express.static("data/avatars"));
app.use("/covers", express.static("data/covers"));
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: "data/avatars",
    filename: (_req, file, cb) =>
      cb(
        null,
        `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.mimetype,
      ),
    ),
});
const coverUpload = multer({
  storage: multer.diskStorage({
    destination: "data/covers",
    filename: (_req, file, cb) =>
      cb(
        null,
        `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});
const secret = process.env.JWT_SECRET || "local-dev-secret-change-me";
type Req = express.Request & { userId?: number };
const auth: express.RequestHandler = (req: Req, res, next) => {
  try {
    req.userId = (
      jwt.verify(
        (req.headers.authorization || "").replace("Bearer ", ""),
        secret,
      ) as any
    ).id;
    next();
  } catch {
    res.status(401).json({ error: "Войдите в аккаунт" });
  }
};
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || String(password).length < 6)
      return res
        .status(400)
        .json({ error: "Заполните поля, пароль — минимум 6 символов" });
    const info = db
      .prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)")
      .run(name, email.toLowerCase(), bcrypt.hashSync(password, 10));
    res.json({
      token: jwt.sign({ id: info.lastInsertRowid }, secret, {
        expiresIn: "30d",
      }),
      user: { name, email, avatar: null },
    });
  } catch {
    return res.status(409).json({ error: "Этот email уже зарегистрирован" });
  }
});
app.post("/api/auth/login", (req, res) => {
  const user = db
    .prepare("SELECT * FROM users WHERE email=?")
    .get(String(req.body.email).toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(req.body.password || "", user.password))
    return res.status(401).json({ error: "Неверный email или пароль" });
  res.json({
    token: jwt.sign({ id: user.id }, secret, { expiresIn: "30d" }),
    user: { name: user.name, email: user.email, avatar: user.avatar },
  });
});
app.use("/api", auth);
app.get("/api/me", (req: Req, res) => {
  const user = db
    .prepare("SELECT id,name,email,avatar FROM users WHERE id=?")
    .get(req.userId);
  res.json(user);
});
app.patch("/api/me", (req: Req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2 || name.length > 60)
    return res
      .status(400)
      .json({ error: "Имя должно содержать от 2 до 60 символов" });
  db.transaction(() => {
    db.prepare("UPDATE users SET name=? WHERE id=?").run(name, req.userId);
    db.prepare("UPDATE members SET name=? WHERE user_id=?").run(
      name,
      req.userId,
    );
  })();
  res.json(
    db
      .prepare("SELECT id,name,email,avatar FROM users WHERE id=?")
      .get(req.userId),
  );
});
app.patch("/api/me/password", (req: Req, res) => {
  const user = db
    .prepare("SELECT password FROM users WHERE id=?")
    .get(req.userId) as any;
  if (
    !bcrypt.compareSync(String(req.body.currentPassword || ""), user.password)
  )
    return res.status(400).json({ error: "Текущий пароль указан неверно" });
  if (String(req.body.newPassword || "").length < 6)
    return res.status(400).json({ error: "Новый пароль — минимум 6 символов" });
  db.prepare("UPDATE users SET password=? WHERE id=?").run(
    bcrypt.hashSync(req.body.newPassword, 10),
    req.userId,
  );
  res.json({ ok: true });
});
app.post("/api/me/avatar", avatarUpload.single("avatar"), (req: Req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ error: "Выберите JPG, PNG, WebP или GIF до 1 МБ" });
  const user = db
    .prepare("SELECT avatar FROM users WHERE id=?")
    .get(req.userId) as any;
  if (user.avatar)
    fs.rmSync(path.join("data/avatars", path.basename(user.avatar)), {
      force: true,
    });
  const avatar = `/avatars/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar=? WHERE id=?").run(avatar, req.userId);
  res.json(
    db
      .prepare("SELECT id,name,email,avatar FROM users WHERE id=?")
      .get(req.userId),
  );
});
app.get("/api/trips", (req: Req, res) =>
  res.json(
    db
      .prepare(
        `SELECT t.*,COUNT(DISTINCT m.id) member_count,COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id=t.id),0) expense_total FROM trips t LEFT JOIN members m ON m.trip_id=t.id WHERE t.user_id=? OR EXISTS(SELECT 1 FROM members access WHERE access.trip_id=t.id AND access.user_id=?) GROUP BY t.id ORDER BY t.id DESC`,
      )
      .all(req.userId, req.userId),
  ),
);
app.post("/api/trips", (req: Req, res) => {
  const { name, currency = "RUB", start_date, end_date, owner_name } = req.body;
  if (!name) return res.status(400).json({ error: "Укажите название" });
  const run = db.transaction(() => {
    const t = db
      .prepare(
        "INSERT INTO trips(user_id,name,currency,start_date,end_date) VALUES(?,?,?,?,?)",
      )
      .run(req.userId, name, currency, start_date || null, end_date || null);
    const id = Number(t.lastInsertRowid);
    const user = db
      .prepare("SELECT name FROM users WHERE id=?")
      .get(req.userId) as any;
    db.prepare(
      "INSERT INTO members(trip_id,name,color,user_id) VALUES(?,?,?,?)",
    ).run(id, owner_name || user.name || "Я", "#295943", req.userId);
    [
      ["Жильё", "#7d9d8c", "home"],
      ["Еда", "#e87b5f", "utensils"],
      ["Транспорт", "#e2b457", "car"],
      ["Развлечения", "#7189bf", "ticket"],
    ].forEach((c) =>
      db
        .prepare(
          "INSERT INTO categories(trip_id,name,color,icon) VALUES(?,?,?,?)",
        )
        .run(id, ...c),
    );
    return id;
  });
  const id = run();
  res.json(
    db
      .prepare("SELECT *,1 member_count,0 expense_total FROM trips WHERE id=?")
      .get(id),
  );
});
const own = (id: string, u?: number) =>
  db.prepare("SELECT * FROM trips WHERE id=? AND user_id=?").get(id, u) as any;
const access = (id: string, u?: number) =>
  db
    .prepare(
      "SELECT t.* FROM trips t LEFT JOIN members m ON m.trip_id=t.id AND m.user_id=? WHERE t.id=? AND (t.user_id=? OR m.id IS NOT NULL)",
    )
    .get(u, id, u) as any;
function payload(id: number) {
  const trip = db.prepare("SELECT * FROM trips WHERE id=?").get(id);
  const members = db
    .prepare("SELECT * FROM members WHERE trip_id=? ORDER BY id")
    .all(id) as any[];
  const categories = db
    .prepare("SELECT * FROM categories WHERE trip_id=? ORDER BY id")
    .all(id) as any[];
  const expenses = (
    db
      .prepare(
        `SELECT e.*,m.name paid_by_name,c.name category_name,c.color category_color FROM expenses e JOIN members m ON m.id=e.paid_by JOIN categories c ON c.id=e.category_id WHERE e.trip_id=? ORDER BY e.date DESC,e.id DESC`,
      )
      .all(id) as any[]
  ).map((e) => ({
    ...e,
    participant_ids: (
      db
        .prepare(
          "SELECT member_id FROM expense_participants WHERE expense_id=?",
        )
        .all(e.id) as any[]
    ).map((x) => x.member_id),
  }));
  const contributions = db
    .prepare(
      `SELECT c.*,m.name member_name,m.color member_color FROM contributions c JOIN members m ON m.id=c.member_id WHERE c.trip_id=? ORDER BY c.date DESC,c.id DESC`,
    )
    .all(id) as any[];
  const balances = new Map(
    members.map((m) => [m.id, { ...m, paid: 0, share: 0, balance: 0 }]),
  );
  for (const e of expenses) {
    if (e.paid_from_fund) continue;
    balances.get(e.paid_by).paid += e.amount;
    const base = Math.floor(e.amount / e.participant_ids.length),
      rem = e.amount % e.participant_ids.length;
    e.participant_ids.forEach(
      (p: number, i: number) =>
        (balances.get(p).share += base + (i < rem ? 1 : 0)),
    );
  }
  for (const b of balances.values()) b.balance = b.paid - b.share;
  const debtors = [...balances.values()]
      .filter((b) => b.balance < 0)
      .map((b) => ({ ...b, left: -b.balance })),
    creditors = [...balances.values()]
      .filter((b) => b.balance > 0)
      .map((b) => ({ ...b, left: b.balance })),
    settlements: any[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left);
    settlements.push({ from: debtors[i].name, to: creditors[j].name, amount });
    debtors[i].left -= amount;
    creditors[j].left -= amount;
    if (!debtors[i].left) i++;
    if (!creditors[j].left) j++;
  }
  const byCategory = categories
    .map((c) => ({
      ...c,
      amount: expenses
        .filter((e) => e.category_id === c.id)
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter((c) => c.amount);
  return {
    trip,
    members,
    categories,
    expenses,
    dashboard: {
      total: expenses.reduce((s, e) => s + e.amount, 0),
      expense_count: expenses.length,
      byCategory,
      byMember: [...balances.values()],
      settlements,
      fundTotal: contributions.reduce((s, c) => s + c.amount, 0),
      fundSpent: expenses
        .filter((e) => e.paid_from_fund)
        .reduce((s, e) => s + e.amount, 0),
    },
    contributions,
  };
}
app.get("/api/trips/:id", (req: Req, res) => {
  if (!access(req.params.id, req.userId))
    return res.status(404).json({ error: "Поездка не найдена" });
  res.json(payload(+req.params.id));
});
app.patch("/api/trips/:id", (req: Req, res) => {
  if (!own(req.params.id, req.userId))
    return res
      .status(403)
      .json({ error: "Только владелец может изменить поездку" });
  const name = String(req.body.name || "").trim();
  if (name.length < 2 || name.length > 80)
    return res
      .status(400)
      .json({ error: "Название должно содержать от 2 до 80 символов" });
  db.prepare("UPDATE trips SET name=? WHERE id=?").run(name, req.params.id);
  res.json(db.prepare("SELECT * FROM trips WHERE id=?").get(req.params.id));
});
app.post("/api/trips/:id/members", (req: Req, res) => {
  if (!own(req.params.id, req.userId)) return res.sendStatus(404);
  const colors = ["#7189bf", "#e87b5f", "#a87db1", "#e2b457", "#4c9a91"];
  const x = db
    .prepare("INSERT INTO members(trip_id,name,color) VALUES(?,?,?)")
    .run(
      req.params.id,
      req.body.name,
      colors[Math.floor(Math.random() * colors.length)],
    );
  res.json(
    db.prepare("SELECT * FROM members WHERE id=?").get(x.lastInsertRowid),
  );
});
app.post("/api/trips/:id/invite", (req: Req, res) => {
  if (!own(req.params.id, req.userId))
    return res
      .status(403)
      .json({ error: "Только владелец может приглашать участников" });
  const user = db
    .prepare("SELECT id,name,email FROM users WHERE email=?")
    .get(String(req.body.email || "").toLowerCase()) as any;
  if (!user)
    return res
      .status(404)
      .json({ error: "Пользователь с таким email не зарегистрирован" });
  try {
    const colors = ["#7189bf", "#e87b5f", "#a87db1", "#e2b457", "#4c9a91"];
    const x = db
      .prepare(
        "INSERT INTO members(trip_id,name,color,user_id) VALUES(?,?,?,?)",
      )
      .run(
        req.params.id,
        user.name,
        colors[Math.floor(Math.random() * colors.length)],
        user.id,
      );
    res.json({
      ...db.prepare("SELECT * FROM members WHERE id=?").get(x.lastInsertRowid),
      email: user.email,
    });
  } catch {
    return res
      .status(409)
      .json({ error: "Этот пользователь уже участвует в поездке" });
  }
});
app.patch("/api/members/:id", (req: Req, res) => {
  const m = db
    .prepare(
      "SELECT m.*,t.user_id owner_id FROM members m JOIN trips t ON t.id=m.trip_id WHERE m.id=?",
    )
    .get(req.params.id) as any;
  if (!m || m.owner_id !== req.userId)
    return res.status(403).json({ error: "Недостаточно прав" });
  if (!String(req.body.name || "").trim())
    return res.status(400).json({ error: "Укажите имя" });
  db.prepare("UPDATE members SET name=? WHERE id=?").run(
    String(req.body.name).trim(),
    m.id,
  );
  res.json(db.prepare("SELECT * FROM members WHERE id=?").get(m.id));
});
app.delete("/api/members/:id", (req: Req, res) => {
  const m = db
    .prepare(
      "SELECT m.*,t.user_id owner_id FROM members m JOIN trips t ON t.id=m.trip_id WHERE m.id=?",
    )
    .get(req.params.id) as any;
  if (!m || m.owner_id !== req.userId)
    return res.status(403).json({ error: "Недостаточно прав" });
  if (m.user_id === m.owner_id)
    return res.status(400).json({ error: "Нельзя удалить владельца поездки" });
  const paidExpense = db
    .prepare("SELECT title FROM expenses WHERE paid_by=? LIMIT 1")
    .get(m.id) as { title: string } | undefined;
  if (paidExpense)
    return res.status(409).json({
      error: `Участник указан плательщиком в расходе «${paidExpense.title}». Сначала выберите другого плательщика в этой записи`,
    });
  db.transaction(() => {
    const affected = db
      .prepare("SELECT expense_id FROM expense_participants WHERE member_id=?")
      .all(m.id) as { expense_id: number }[];
    db.prepare("DELETE FROM expense_participants WHERE member_id=?").run(m.id);
    const remaining = db
      .prepare("SELECT id FROM members WHERE trip_id=? AND id<>?")
      .all(m.trip_id, m.id) as { id: number }[];
    const countParticipants = db.prepare(
      "SELECT COUNT(*) count FROM expense_participants WHERE expense_id=?",
    );
    const addParticipant = db.prepare(
      "INSERT OR IGNORE INTO expense_participants(expense_id,member_id) VALUES(?,?)",
    );
    for (const { expense_id } of affected) {
      const { count } = countParticipants.get(expense_id) as { count: number };
      if (count === 0) {
        for (const participant of remaining)
          addParticipant.run(expense_id, participant.id);
      }
    }
    db.prepare("DELETE FROM members WHERE id=?").run(m.id);
  })();
  res.status(204).end();
});
app.post("/api/trips/:id/categories", (req: Req, res) => {
  if (!own(req.params.id, req.userId)) return res.sendStatus(404);
  const x = db
    .prepare("INSERT INTO categories(trip_id,name,color) VALUES(?,?,?)")
    .run(req.params.id, req.body.name, req.body.color || "#7189bf");
  res.json(
    db.prepare("SELECT * FROM categories WHERE id=?").get(x.lastInsertRowid),
  );
});
app.patch("/api/categories/:id", (req: Req, res) => {
  const c = db
    .prepare(
      "SELECT c.*,t.user_id owner_id FROM categories c JOIN trips t ON t.id=c.trip_id WHERE c.id=?",
    )
    .get(req.params.id) as any;
  if (!c || c.owner_id !== req.userId)
    return res.status(403).json({ error: "Недостаточно прав" });
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Укажите название" });
  db.prepare("UPDATE categories SET name=?,color=? WHERE id=?").run(
    name,
    req.body.color || c.color,
    c.id,
  );
  res.json(db.prepare("SELECT * FROM categories WHERE id=?").get(c.id));
});
app.delete("/api/categories/:id", (req: Req, res) => {
  const c = db
    .prepare(
      "SELECT c.*,t.user_id owner_id FROM categories c JOIN trips t ON t.id=c.trip_id WHERE c.id=?",
    )
    .get(req.params.id) as any;
  if (!c || c.owner_id !== req.userId)
    return res.status(403).json({ error: "Недостаточно прав" });
  if (
    db.prepare("SELECT 1 FROM expenses WHERE category_id=? LIMIT 1").get(c.id)
  )
    return res
      .status(409)
      .json({ error: "Статья уже используется в расходах" });
  db.prepare("DELETE FROM categories WHERE id=?").run(c.id);
  res.status(204).end();
});
app.post(
  "/api/trips/:id/cover",
  coverUpload.single("cover"),
  (req: Req, res) => {
    const trip = own(req.params.id, req.userId);
    if (!trip)
      return res
        .status(403)
        .json({ error: "Только владелец может менять обложку" });
    if (!req.file)
      return res
        .status(400)
        .json({ error: "Выберите JPG, PNG или WebP до 2 МБ" });
    if (trip.cover)
      fs.rmSync(path.join("data/covers", path.basename(trip.cover)), {
        force: true,
      });
    const cover = `/covers/${req.file.filename}`;
    db.prepare("UPDATE trips SET cover=? WHERE id=?").run(cover, req.params.id);
    res.json({ cover });
  },
);
app.post("/api/trips/:id/contributions", (req: Req, res) => {
  if (!access(req.params.id, req.userId)) return res.sendStatus(404);
  const { member_id, amount, date, note } = req.body;
  if (!member_id || Number(amount) <= 0)
    return res.status(400).json({ error: "Укажите участника и сумму" });
  const x = db
    .prepare(
      "INSERT INTO contributions(trip_id,member_id,amount,date,note,created_by) VALUES(?,?,?,?,?,?)",
    )
    .run(
      req.params.id,
      member_id,
      Math.round(Number(amount) * 100),
      date,
      note || null,
      req.userId,
    );
  res.json(
    db.prepare("SELECT * FROM contributions WHERE id=?").get(x.lastInsertRowid),
  );
});
app.delete("/api/contributions/:id", (req: Req, res) => {
  const c = db
    .prepare(
      "SELECT c.*,t.user_id owner_id FROM contributions c JOIN trips t ON t.id=c.trip_id WHERE c.id=?",
    )
    .get(req.params.id) as any;
  if (!c || (c.owner_id !== req.userId && c.created_by !== req.userId))
    return res.status(403).json({ error: "Недостаточно прав" });
  db.prepare("DELETE FROM contributions WHERE id=?").run(c.id);
  res.status(204).end();
});
app.post("/api/trips/:id/expenses", (req: Req, res) => {
  if (!access(req.params.id, req.userId)) return res.sendStatus(404);
  const {
    title,
    amount,
    date,
    paid_by,
    category_id,
    participant_ids,
    paid_from_fund,
  } = req.body;
  if (!title || !amount || !participant_ids?.length)
    return res.status(400).json({ error: "Заполните данные расхода" });
  db.transaction(() => {
    const e = db
      .prepare(
        "INSERT INTO expenses(trip_id,title,amount,date,paid_by,category_id,created_by,paid_from_fund) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(
        req.params.id,
        title,
        Math.round(Number(amount) * 100),
        date,
        paid_by,
        category_id,
        req.userId,
        paid_from_fund ? 1 : 0,
      );
    for (const p of participant_ids)
      db.prepare("INSERT INTO expense_participants VALUES(?,?)").run(
        e.lastInsertRowid,
        p,
      );
  })();
  res.json({ ok: true });
});
app.patch("/api/expenses/:id", (req: Req, res) => {
  const e = db
    .prepare(
      "SELECT e.*,t.user_id owner_id FROM expenses e JOIN trips t ON t.id=e.trip_id WHERE e.id=?",
    )
    .get(req.params.id) as any;
  if (!e || !access(String(e.trip_id), req.userId)) return res.sendStatus(404);
  if (e.owner_id !== req.userId && e.created_by !== req.userId)
    return res
      .status(403)
      .json({ error: "Можно редактировать только свои расходы" });
  const {
    title,
    amount,
    date,
    paid_by,
    category_id,
    participant_ids,
    paid_from_fund,
  } = req.body;
  if (!title || !amount || !participant_ids?.length)
    return res.status(400).json({ error: "Заполните данные расхода" });
  db.transaction(() => {
    db.prepare(
      "UPDATE expenses SET title=?,amount=?,date=?,paid_by=?,category_id=?,paid_from_fund=? WHERE id=?",
    ).run(
      title,
      Math.round(Number(amount) * 100),
      date,
      paid_by,
      category_id,
      paid_from_fund ? 1 : 0,
      e.id,
    );
    db.prepare("DELETE FROM expense_participants WHERE expense_id=?").run(e.id);
    for (const p of participant_ids)
      db.prepare("INSERT INTO expense_participants VALUES(?,?)").run(e.id, p);
  })();
  res.json({ ok: true });
});
app.delete("/api/expenses/:id", (req: Req, res) => {
  const e = db
    .prepare(
      "SELECT e.*,t.user_id owner_id FROM expenses e JOIN trips t ON t.id=e.trip_id WHERE e.id=?",
    )
    .get(req.params.id) as any;
  if (!e || !access(String(e.trip_id), req.userId)) return res.sendStatus(404);
  if (e.owner_id !== req.userId && e.created_by !== req.userId)
    return res.status(403).json({ error: "Можно удалить только свой расход" });
  db.prepare("DELETE FROM expenses WHERE id=?").run(e.id);
  res.status(204).end();
});
const dist = path.resolve("dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/*splat", (_, res) => res.sendFile(path.join(dist, "index.html")));
}
const port = Number(process.env.PORT) || 3001;
app.listen(port, "127.0.0.1", () =>
  console.log(`API: http://127.0.0.1:${port}`),
);
