CREATE TABLE IF NOT EXISTS clicks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	link_index INTEGER NOT NULL,
	link_title TEXT NOT NULL,
	destination_url TEXT NOT NULL,
	referer TEXT DEFAULT '',
	country TEXT DEFAULT '',
	user_agent TEXT DEFAULT '',
	clicked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_clicks_link ON clicks(link_index);
CREATE INDEX idx_clicks_time ON clicks(clicked_at);
