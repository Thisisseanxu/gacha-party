-- 徽章攻略系统 D1 数据库初始化脚本
-- 运行命令：wrangler d1 execute gacha-party-hz --file=hz_schema.sql --remote

-- 全局版本控制（单行表，id 固定为 1）
CREATE TABLE IF NOT EXISTS hz_guide_meta (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  version TEXT NOT NULL DEFAULT '0',
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- 已审核通过的攻略
CREATE TABLE IF NOT EXISTS hz_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  char_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  approved_at INTEGER NOT NULL
);

-- 待审核的投稿
CREATE TABLE IF NOT EXISTS hz_pending (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  char_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL,
  submitted_at INTEGER NOT NULL
);

-- 初始化版本行
INSERT OR IGNORE INTO hz_guide_meta (id, version, updated_at) VALUES (1, '0', 0);
