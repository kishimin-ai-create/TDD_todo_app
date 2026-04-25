CREATE TABLE IF NOT EXISTS Todo (
  id        CHAR(36)     NOT NULL,
  appId     CHAR(36)     NOT NULL,
  title     VARCHAR(200) NOT NULL,
  completed BOOLEAN      NOT NULL DEFAULT FALSE,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME     NULL     DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX idx_todo_appId (appId),
  INDEX idx_todo_app_active (appId, deletedAt, completed),
  INDEX idx_todo_deletedAt (deletedAt),
  CONSTRAINT fk_todo_app FOREIGN KEY (appId) REFERENCES App (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
