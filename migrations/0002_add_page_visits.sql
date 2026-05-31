CREATE TABLE IF NOT EXISTS page_visits (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	referer TEXT DEFAULT '',
	country TEXT DEFAULT '',
	user_agent TEXT DEFAULT '',
	visited_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_page_visits_time ON page_visits(visited_at);
