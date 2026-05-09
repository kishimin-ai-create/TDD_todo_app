CREATE TABLE IF NOT EXISTS User (
  id           CHAR(36)     NOT NULL,
  email        VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(200) NOT NULL,
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
