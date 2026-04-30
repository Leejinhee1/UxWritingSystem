-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rule_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "pattern" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "input_text" TEXT NOT NULL,
    "ui_category_detected" TEXT NOT NULL DEFAULT '',
    "violations" TEXT NOT NULL DEFAULT '[]',
    "suggestions" TEXT NOT NULL DEFAULT '[]',
    "accepted_suggestion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text_pattern" TEXT NOT NULL,
    "ui_type" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
