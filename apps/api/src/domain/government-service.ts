/**
 * Government Service
 * Handles government-related operations using Prisma database
 */

/**
 * @ignore
 */

import { getLogger } from '@political-sphere/shared';
import { GovernmentDB } from '../services/database.service.js';
import type { WhereClause } from '../services/database.service.js';

/** Helper to safely extract error message */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return getErrorMessage(error);
  return String(error);
}

/**
 * Logger instance for government service operations.
 * Tagged with service name for filtering and tracing.
 */
const logger = getLogger({ service: 'government' });

/**
 * Payload to create a new government entity
 */
export interface CreateGovernmentData {
  name: string;
  leaderId?: string;
}

/**
 * Payload to create a minister appointment within a government
 */
export interface CreateMinisterData {
  userId: string;
  governmentId: string;
  portfolio: string;
}

/**
 * Payload for an executive action (orders, decrees, policies)
 */
export interface CreateExecutiveActionData {
  title: string;
  description?: string;
  type: 'decree' | 'order' | 'policy';
}

/**
 * Payload for scheduling a cabinet meeting
 */
export interface CreateCabinetMeetingData {
  title: string;
  agenda?: string;
  scheduledAt: Date;
}

/**
 * GovernmentService exposes high-level operations for managing governments,
 * ministers, executive actions and cabinet meetings.
 *
 * Responsibilities:
 * - Create, list, update and dissolve governments
 * - Manage minister appointments and their lifecycle
 * - Record executive actions and schedule cabinet meetings
 *
 * This service provides application-level validation, structured logging and
 * error handling. It delegates persistence to `GovernmentDB` to keep domain
 * logic separate from storage concerns.
 */
export class GovernmentService {
  /**
   * Create a new government
   */
  async createGovernment(data: CreateGovernmentData) {
    try {
      logger.info('Creating government', { name: data.name });
      const government = await GovernmentDB.createGovernment({
        name: data.name,
        leaderId: data.leaderId,
        status: 'active',
        formedAt: new Date(),
      });
      logger.info('Government created', { id: government.id });
      return government;
    } catch (error) {
      logger.error('Failed to create government', { error: getErrorMessage(error), data });
      throw error;
    }
  }

  /**
   * Get government by ID
   */
  async getGovernment(id: string) {
    try {
      const government = await GovernmentDB.getGovernment(id);
      if (!government) {
        throw new Error(`Government with id ${id} not found`);
      }
      return government;
    } catch (error) {
      logger.error('Failed to get government', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * List governments with optional filtering
   */
  async listGovernments(options: { status?: string; limit?: number } = {}) {
    try {
      const where: WhereClause = {};
      if (options.status) {
        where.status = options.status;
      }

      const governments = await GovernmentDB.listGovernments(where, {
        orderBy: { formedAt: 'desc' },
        take: options.limit || 50,
      });

      return governments;
    } catch (error) {
      logger.error('Failed to list governments', { options, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Update government
   */
  async updateGovernment(
    id: string,
    data: Partial<CreateGovernmentData & { status: string; dissolvedAt?: Date }>
  ) {
    try {
      logger.info('Updating government', { id, data });
      const government = await GovernmentDB.updateGovernment(id, data);
      logger.info('Government updated', { id });
      return government;
    } catch (error) {
      logger.error('Failed to update government', { id, data, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Dissolve government
   */
  async dissolveGovernment(id: string) {
    try {
      logger.info('Dissolving government', { id });
      const government = await this.updateGovernment(id, {
        status: 'dissolved',
        dissolvedAt: new Date(),
      });
      logger.info('Government dissolved', { id });
      return government;
    } catch (error) {
      logger.error('Failed to dissolve government', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Create minister
   */
  async createMinister(data: CreateMinisterData) {
    try {
      logger.info('Creating minister', { userId: data.userId, portfolio: data.portfolio });
      const minister = await GovernmentDB.createMinister({
        userId: data.userId,
        governmentId: data.governmentId,
        portfolio: data.portfolio,
        appointedAt: new Date(),
      });
      logger.info('Minister created', { id: minister.id });
      return minister;
    } catch (error) {
      logger.error('Failed to create minister', { error: getErrorMessage(error), data });
      throw error;
    }
  }

  /**
   * Get minister by ID
   */
  async getMinister(id: string) {
    try {
      const minister = await GovernmentDB.getMinister(id);
      if (!minister) {
        throw new Error(`Minister with id ${id} not found`);
      }
      return minister;
    } catch (error) {
      logger.error('Failed to get minister', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * List ministers for a government
   */
  async listMinisters(governmentId: string) {
    try {
      const ministers = await GovernmentDB.listMinisters({ governmentId });
      return ministers;
    } catch (error) {
      logger.error('Failed to list ministers', { governmentId, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Update minister
   */
  async updateMinister(id: string, data: Partial<CreateMinisterData & { resignedAt?: Date }>) {
    try {
      logger.info('Updating minister', { id, data });
      const minister = await GovernmentDB.updateMinister(id, data);
      logger.info('Minister updated', { id });
      return minister;
    } catch (error) {
      logger.error('Failed to update minister', { id, data, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Resign minister
   */
  async resignMinister(id: string) {
    try {
      logger.info('Minister resigning', { id });
      const minister = await this.updateMinister(id, { resignedAt: new Date() });
      logger.info('Minister resigned', { id });
      return minister;
    } catch (error) {
      logger.error('Failed to resign minister', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Create executive action
   */
  async createExecutiveAction(data: CreateExecutiveActionData) {
    try {
      logger.info('Creating executive action', { title: data.title, type: data.type });
      const action = await GovernmentDB.createExecutiveAction({
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'proposed',
      });
      logger.info('Executive action created', { id: action.id });
      return action;
    } catch (error) {
      logger.error('Failed to create executive action', { error: getErrorMessage(error), data });
      throw error;
    }
  }

  /**
   * Get executive action by ID
   */
  async getExecutiveAction(id: string) {
    try {
      const action = await GovernmentDB.getExecutiveAction(id);
      if (!action) {
        throw new Error(`Executive action with id ${id} not found`);
      }
      return action;
    } catch (error) {
      logger.error('Failed to get executive action', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * List executive actions
   */
  async listExecutiveActions(options: { type?: string; status?: string; limit?: number } = {}) {
    try {
      const where: WhereClause = {};
      if (options.type) where.type = options.type;
      if (options.status) where.status = options.status;

      const actions = await GovernmentDB.listExecutiveActions(where, {
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
      });

      return actions;
    } catch (error) {
      logger.error('Failed to list executive actions', { options, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Sign executive action
   */
  async signExecutiveAction(id: string) {
    try {
      logger.info('Signing executive action', { id });
      const action = await GovernmentDB.updateExecutiveAction(id, {
        status: 'signed',
        signedAt: new Date(),
      });
      logger.info('Executive action signed', { id });
      return action;
    } catch (error) {
      logger.error('Failed to sign executive action', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Create cabinet meeting
   */
  async createCabinetMeeting(data: CreateCabinetMeetingData) {
    try {
      logger.info('Creating cabinet meeting', { title: data.title });
      const meeting = await GovernmentDB.createCabinetMeeting({
        title: data.title,
        agenda: data.agenda,
        scheduledAt: data.scheduledAt,
        status: 'scheduled',
      });
      logger.info('Cabinet meeting created', { id: meeting.id });
      return meeting;
    } catch (error) {
      logger.error('Failed to create cabinet meeting', { error: getErrorMessage(error), data });
      throw error;
    }
  }

  /**
   * Get cabinet meeting by ID
   */
  async getCabinetMeeting(id: string) {
    try {
      const meeting = await GovernmentDB.getCabinetMeeting(id);
      if (!meeting) {
        throw new Error(`Cabinet meeting with id ${id} not found`);
      }
      return meeting;
    } catch (error) {
      logger.error('Failed to get cabinet meeting', { id, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Update cabinet meeting
   */
  async updateCabinetMeeting(
    id: string,
    data: Partial<CreateCabinetMeetingData & { status: string; minutes?: string }>
  ) {
    try {
      logger.info('Updating cabinet meeting', { id, data });
      const meeting = await GovernmentDB.updateCabinetMeeting(id, data);
      logger.info('Cabinet meeting updated', { id });
      return meeting;
    } catch (error) {
      logger.error('Failed to update cabinet meeting', { id, data, error: getErrorMessage(error) });
      throw error;
    }
  }
}

// Export singleton instance
/**
 * Shared `governmentService` instance used by route handlers. Tests should
 * instantiate `GovernmentService` directly when isolation is required.
 */
export const governmentService = new GovernmentService();
