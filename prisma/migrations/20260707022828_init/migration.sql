-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "weeklyGoalHours" REAL NOT NULL DEFAULT 20,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "alwaysOnTop" BOOLEAN NOT NULL DEFAULT false,
    "launchOnStartup" BOOLEAN NOT NULL DEFAULT false,
    "backupFolderPath" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "StudySession_startedAt_idx" ON "StudySession"("startedAt");

-- CreateIndex
CREATE INDEX "StudySession_endedAt_idx" ON "StudySession"("endedAt");
