CREATE TABLE IF NOT EXISTS events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  event    TEXT    NOT NULL,  -- page_view | click_maps_app | click_direct_review
  platform TEXT    NOT NULL,  -- iOS | Android | other
  ts       INTEGER NOT NULL   -- Unix ms (UTC)
);
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
