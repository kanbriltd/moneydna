-- CreateTable
CREATE TABLE "CompanionProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moneyStory" TEXT,
    "temperament" TEXT,
    "planning" TEXT,
    "riskComfort" TEXT,
    "lifeStage" TEXT,
    "supportsFamily" BOOLEAN NOT NULL DEFAULT false,
    "goodLife" TEXT,
    "biggestFear" TEXT,
    "futureVision" TEXT,
    "dnaType" TEXT,
    "dnaLabel" TEXT,
    "dnaSummary" TEXT,
    "dnaConfidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER,
    "confidenceSetAt" DATETIME,
    "traitSaver" INTEGER NOT NULL DEFAULT 50,
    "traitPlanner" INTEGER NOT NULL DEFAULT 50,
    "traitImpulse" INTEGER NOT NULL DEFAULT 50,
    "traitRisk" INTEGER NOT NULL DEFAULT 50,
    "traitDiscipline" INTEGER NOT NULL DEFAULT 50,
    "discoveryComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "props" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoneySituation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "monthlyIncome" REAL,
    "monthlySavings" REAL,
    "paydayDay" INTEGER,
    "topExpense1" TEXT,
    "topExpense2" TEXT,
    "hasDebt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MoneySituation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "forDate" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "insight" TEXT NOT NULL DEFAULT '',
    "estimatedImpact" REAL NOT NULL DEFAULT 0,
    "goalName" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "skipReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "why" TEXT NOT NULL DEFAULT '',
    "basedOn" TEXT NOT NULL DEFAULT '[]',
    "band" TEXT NOT NULL DEFAULT 'low',
    "historyNote" TEXT,
    CONSTRAINT "DailyDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanionProfile_userId_key" ON "CompanionProfile"("userId");

-- CreateIndex
CREATE INDEX "CompanionProfile_userId_idx" ON "CompanionProfile"("userId");

-- CreateIndex
CREATE INDEX "Event_userId_createdAt_idx" ON "Event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MoneySituation_userId_key" ON "MoneySituation"("userId");

-- CreateIndex
CREATE INDEX "MoneySituation_userId_idx" ON "MoneySituation"("userId");

-- CreateIndex
CREATE INDEX "DailyDecision_userId_createdAt_idx" ON "DailyDecision"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDecision_userId_forDate_key" ON "DailyDecision"("userId", "forDate");
