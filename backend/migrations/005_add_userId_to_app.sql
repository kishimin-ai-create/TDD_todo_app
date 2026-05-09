ALTER TABLE App
  ADD COLUMN userId CHAR(36) NOT NULL DEFAULT '' AFTER id,
  ADD INDEX idx_app_userId (userId);
