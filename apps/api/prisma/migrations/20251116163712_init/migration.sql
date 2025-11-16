-- CreateTable
CREATE TABLE "Chamber" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "quorumPercentage" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motion" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "votingStarted" TIMESTAMP(3),
    "votingEnded" TIMESTAMP(3),
    "result" TEXT,
    "debateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "motionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "speakingOrder" TEXT[],
    "timePerSpeaker" INTEGER NOT NULL DEFAULT 180,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "currentSpeakerIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speech" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Speech_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "motionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Government" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "leadPartyId" TEXT NOT NULL,
    "formedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "confidenceVotes" INTEGER NOT NULL DEFAULT 0,
    "noConfidenceVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Government_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Minister" (
    "id" TEXT NOT NULL,
    "governmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Minister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveAction" (
    "id" TEXT NOT NULL,
    "governmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabinetMeeting" (
    "id" TEXT NOT NULL,
    "governmentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT NOT NULL,
    "attendees" TEXT[],
    "minutes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CabinetMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "plaintiffId" TEXT NOT NULL,
    "defendantId" TEXT,
    "caseType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "targetLawId" TEXT,
    "targetActionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'filed',
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hearingDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "assignedJudge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judge" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "tenure" TEXT NOT NULL,
    "termYears" INTEGER,
    "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "casesHeard" INTEGER NOT NULL DEFAULT 0,
    "rulingsIssued" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Judge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruling" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "precedentSetting" BOOLEAN NOT NULL DEFAULT false,
    "constitutionalImpact" TEXT NOT NULL DEFAULT 'none',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appealable" BOOLEAN NOT NULL DEFAULT true,
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ruling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionalReview" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "grounds" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'routine',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedJudge" TEXT,
    "decision" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstitutionalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Precedent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "rulingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "principle" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Precedent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressRelease" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "embargoUntil" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "pollType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCoverage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "prominence" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT,
    "impact" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Narrative" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "narrativeType" TEXT NOT NULL,
    "participants" TEXT[],
    "sentiment" TEXT NOT NULL,
    "virality" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "mentions" INTEGER NOT NULL DEFAULT 1,
    "peakVirality" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Narrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRating" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "approval" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "disapproval" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "neutral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "electionType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "turnout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "certifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "partyId" TEXT,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slogan" TEXT,
    "platform" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "events" INTEGER NOT NULL DEFAULT 0,
    "endorsements" TEXT[],
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constituency" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "registeredVoters" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "votesCast" INTEGER NOT NULL DEFAULT 0,
    "turnoutPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Constituency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "constituencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partyId" TEXT,
    "independent" BOOLEAN NOT NULL DEFAULT false,
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "votesReceived" INTEGER NOT NULL DEFAULT 0,
    "votePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionVote" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "constituencyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chamber_gameId_idx" ON "Chamber"("gameId");

-- CreateIndex
CREATE INDEX "Chamber_type_idx" ON "Chamber"("type");

-- CreateIndex
CREATE INDEX "Motion_gameId_idx" ON "Motion"("gameId");

-- CreateIndex
CREATE INDEX "Motion_chamberId_idx" ON "Motion"("chamberId");

-- CreateIndex
CREATE INDEX "Motion_status_idx" ON "Motion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Debate_motionId_key" ON "Debate"("motionId");

-- CreateIndex
CREATE INDEX "Debate_status_idx" ON "Debate"("status");

-- CreateIndex
CREATE INDEX "Speech_debateId_idx" ON "Speech"("debateId");

-- CreateIndex
CREATE INDEX "Vote_motionId_idx" ON "Vote"("motionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_motionId_userId_key" ON "Vote"("motionId", "userId");

-- CreateIndex
CREATE INDEX "Government_gameId_idx" ON "Government"("gameId");

-- CreateIndex
CREATE INDEX "Government_status_idx" ON "Government"("status");

-- CreateIndex
CREATE INDEX "Minister_governmentId_idx" ON "Minister"("governmentId");

-- CreateIndex
CREATE INDEX "Minister_userId_idx" ON "Minister"("userId");

-- CreateIndex
CREATE INDEX "Minister_status_idx" ON "Minister"("status");

-- CreateIndex
CREATE INDEX "ExecutiveAction_governmentId_idx" ON "ExecutiveAction"("governmentId");

-- CreateIndex
CREATE INDEX "ExecutiveAction_status_idx" ON "ExecutiveAction"("status");

-- CreateIndex
CREATE INDEX "CabinetMeeting_governmentId_idx" ON "CabinetMeeting"("governmentId");

-- CreateIndex
CREATE INDEX "CabinetMeeting_status_idx" ON "CabinetMeeting"("status");

-- CreateIndex
CREATE INDEX "LegalCase_gameId_idx" ON "LegalCase"("gameId");

-- CreateIndex
CREATE INDEX "LegalCase_status_idx" ON "LegalCase"("status");

-- CreateIndex
CREATE INDEX "Judge_gameId_idx" ON "Judge"("gameId");

-- CreateIndex
CREATE INDEX "Judge_court_idx" ON "Judge"("court");

-- CreateIndex
CREATE INDEX "Judge_status_idx" ON "Judge"("status");

-- CreateIndex
CREATE INDEX "Ruling_caseId_idx" ON "Ruling"("caseId");

-- CreateIndex
CREATE INDEX "Ruling_judgeId_idx" ON "Ruling"("judgeId");

-- CreateIndex
CREATE INDEX "ConstitutionalReview_gameId_idx" ON "ConstitutionalReview"("gameId");

-- CreateIndex
CREATE INDEX "ConstitutionalReview_status_idx" ON "ConstitutionalReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Precedent_rulingId_key" ON "Precedent"("rulingId");

-- CreateIndex
CREATE INDEX "Precedent_impact_idx" ON "Precedent"("impact");

-- CreateIndex
CREATE INDEX "PressRelease_gameId_idx" ON "PressRelease"("gameId");

-- CreateIndex
CREATE INDEX "PressRelease_authorId_idx" ON "PressRelease"("authorId");

-- CreateIndex
CREATE INDEX "PressRelease_category_idx" ON "PressRelease"("category");

-- CreateIndex
CREATE INDEX "PressRelease_status_idx" ON "PressRelease"("status");

-- CreateIndex
CREATE INDEX "Poll_gameId_idx" ON "Poll"("gameId");

-- CreateIndex
CREATE INDEX "Poll_status_idx" ON "Poll"("status");

-- CreateIndex
CREATE INDEX "PollVote_pollId_idx" ON "PollVote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollId_userId_key" ON "PollVote"("pollId", "userId");

-- CreateIndex
CREATE INDEX "MediaCoverage_gameId_idx" ON "MediaCoverage"("gameId");

-- CreateIndex
CREATE INDEX "MediaCoverage_targetId_idx" ON "MediaCoverage"("targetId");

-- CreateIndex
CREATE INDEX "MediaCoverage_targetType_idx" ON "MediaCoverage"("targetType");

-- CreateIndex
CREATE INDEX "Narrative_gameId_idx" ON "Narrative"("gameId");

-- CreateIndex
CREATE INDEX "Narrative_status_idx" ON "Narrative"("status");

-- CreateIndex
CREATE INDEX "Narrative_virality_idx" ON "Narrative"("virality");

-- CreateIndex
CREATE INDEX "ApprovalRating_gameId_idx" ON "ApprovalRating"("gameId");

-- CreateIndex
CREATE INDEX "ApprovalRating_targetId_idx" ON "ApprovalRating"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRating_gameId_targetId_key" ON "ApprovalRating"("gameId", "targetId");

-- CreateIndex
CREATE INDEX "Election_gameId_idx" ON "Election"("gameId");

-- CreateIndex
CREATE INDEX "Election_status_idx" ON "Election"("status");

-- CreateIndex
CREATE INDEX "Campaign_electionId_idx" ON "Campaign"("electionId");

-- CreateIndex
CREATE INDEX "Campaign_candidateId_idx" ON "Campaign"("candidateId");

-- CreateIndex
CREATE INDEX "Constituency_electionId_idx" ON "Constituency"("electionId");

-- CreateIndex
CREATE INDEX "Constituency_region_idx" ON "Constituency"("region");

-- CreateIndex
CREATE INDEX "Candidate_electionId_idx" ON "Candidate"("electionId");

-- CreateIndex
CREATE INDEX "Candidate_constituencyId_idx" ON "Candidate"("constituencyId");

-- CreateIndex
CREATE INDEX "Candidate_userId_idx" ON "Candidate"("userId");

-- CreateIndex
CREATE INDEX "ElectionVote_electionId_idx" ON "ElectionVote"("electionId");

-- CreateIndex
CREATE INDEX "ElectionVote_constituencyId_idx" ON "ElectionVote"("constituencyId");

-- CreateIndex
CREATE INDEX "ElectionVote_candidateId_idx" ON "ElectionVote"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionVote_electionId_constituencyId_userId_key" ON "ElectionVote"("electionId", "constituencyId", "userId");

-- AddForeignKey
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speech" ADD CONSTRAINT "Speech_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minister" ADD CONSTRAINT "Minister_governmentId_fkey" FOREIGN KEY ("governmentId") REFERENCES "Government"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveAction" ADD CONSTRAINT "ExecutiveAction_governmentId_fkey" FOREIGN KEY ("governmentId") REFERENCES "Government"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetMeeting" ADD CONSTRAINT "CabinetMeeting_governmentId_fkey" FOREIGN KEY ("governmentId") REFERENCES "Government"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruling" ADD CONSTRAINT "Ruling_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LegalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruling" ADD CONSTRAINT "Ruling_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precedent" ADD CONSTRAINT "Precedent_rulingId_fkey" FOREIGN KEY ("rulingId") REFERENCES "Ruling"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Constituency" ADD CONSTRAINT "Constituency_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
