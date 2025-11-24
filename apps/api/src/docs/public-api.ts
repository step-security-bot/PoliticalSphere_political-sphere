/**
 * Public API documentation shim
 *
 * This file creates documented aliases for important exported types and
 * interfaces so Compodoc can surface them and improve documentation coverage.
 * Keep entries minimal and neutral; these are documentation-only helpers.
 */

/**
 * Logger interface used by the API (documentation alias).
 * @see {@link ../logger.ts}
 */
export type LoggerDoc = import('../logger').Logger;

/**
 * Authentication-related types (documentation aliases).
 */
export type AuthUserDoc = import('../auth/auth.middleware').AuthUser;

/**
 * Request object extended with authentication information.
 * Mirrors `AuthRequest` used by middleware to attach `AuthUser` to a request.
 */
export type AuthRequestDoc = import('express').Request;

/**
 * Request/Response helpers used across routes.
 */
export type RequestDoc = import('express').Request;

/**
 * Standard API response shape used across the server routes.
 */
export type ResponseDoc = import('express').Response | unknown;

/**
 * Payload sent when registering a new account (documentation alias).
 */
export type RegisterInputDoc = import('../auth/auth.service').RegisterInput;

/**
 * Payload used for login requests (documentation alias).
 */
export type LoginInputDoc = import('../auth/auth.service').LoginInput;

/**
 * JWT token payload shape (documentation alias).
 */
export type TokenPayloadDoc = import('../auth/auth.service').TokenPayload;

/**
 * Government domain type (documentation alias).
 */
export type GovernmentDoc = import('../routes/government').Government;

/**
 * Minister appointment domain type (documentation alias).
 */
export type MinisterDoc = import('../routes/government').Minister;

/**
 * Executive action domain type (documentation alias).
 */
export type ExecutiveActionDoc = import('../routes/government').ExecutiveAction;

/**
 * Cabinet meeting domain type (documentation alias).
 */
export type CabinetMeetingDoc = import('../routes/government').CabinetMeeting;

/**
 * Election domain type (documentation alias).
 */
export type ElectionDoc = import('../routes/elections').Election;

/**
 * Campaign domain type (documentation alias).
 */
export type CampaignDoc = import('../routes/elections').Campaign;

/**
 * Constituency domain type (documentation alias).
 */
export type ConstituencyDoc = import('../routes/elections').Constituency;

/**
 * Candidate domain type (documentation alias).
 */
export type CandidateDoc = import('../routes/elections').Candidate;

/**
 * Vote record domain type (documentation alias).
 */
export type VoteRecordDoc = import('../routes/elections').VoteRecord;

/**
 * Parliamentary chamber type (documentation alias).
 */
export type ChamberDoc = import('../domain/parliament-service').Chamber;

/**
 * Motion type used in parliamentary proceedings (documentation alias).
 */
export type MotionDoc = import('../domain/parliament-service').Motion;

/**
 * Vote type used in parliamentary proceedings (documentation alias).
 */
export type VoteDoc = import('../domain/parliament-service').Vote;

/**
 * Vote results summary type (documentation alias).
 */
export type VoteResultsDoc = import('../domain/parliament-service').VoteResults;

/**
 * News item type used by the news service (documentation alias).
 */
export type NewsItemDoc = unknown;

/**
 * Game state snapshot used by the game service (documentation alias).
 */
export type GameStateDoc = import('../game/game.service').GameState;

// NOTE: Keep this file small and documentation-only. Do NOT add runtime logic here.
