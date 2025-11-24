/**
 * Government Routes
 * Handles cabinet management, ministerial appointments, and executive actions
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';

/**
 * Express router for government-related endpoints.
 * Handles cabinet management, ministerial appointments, executive actions, and cabinet meetings.
 */
const router = express.Router();

// Validation schemas

/**
 * Zod schema for creating a new government.
 * Validates government data including game ID, prime minister, name, type, and formation date.
 */
const CreateGovernmentSchema = z.object({
  gameId: z.string().uuid(),
  primeMinisterId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['coalition', 'majority', 'minority']),
  formationDate: z.string().datetime(),
});

/**
 * Zod schema for appointing a minister to a government.
 * Validates minister appointment data including government ID, user ID, position, and department.
 */
const AppointMinisterSchema = z.object({
  governmentId: z.string().uuid(),
  userId: z.string().uuid(),
  position: z.enum([
    'prime_minister',
    'chancellor',
    'foreign_secretary',
    'home_secretary',
    'defence_secretary',
    'health_secretary',
    'education_secretary',
    'justice_secretary',
    'environment_secretary',
    'transport_secretary',
    'business_secretary',
    'work_pensions_secretary',
  ]),
  department: z.string().min(1).max(200),
});

/**
 * Zod schema for creating an executive action.
 * Validates action data including government ID, minister ID, type, title, description, and approval requirements.
 */
const ExecutiveActionSchema = z.object({
  governmentId: z.string().uuid(),
  ministerId: z.string().uuid(),
  type: z.enum(['order', 'regulation', 'appointment', 'treaty', 'emergency']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  requiresParliamentApproval: z.boolean().default(false),
});

/**
 * Zod schema for scheduling a cabinet meeting.
 * Validates meeting data including government ID, agenda, scheduled date, and attendees.
 */
const CabinetMeetingSchema = z.object({
  governmentId: z.string().uuid(),
  agenda: z.string().min(1).max(2000),
  scheduledDate: z.string().datetime(),
  attendees: z.array(z.string().uuid()),
});

// Domain types
/**
 * Government represents an administration formed within a game.
 * It tracks leadership, formation date and status.
 */
export interface Government {
  id: string;
  gameId: string;
  primeMinisterId: string;
  name: string;
  type: 'coalition' | 'majority' | 'minority';
  formationDate: string;
  status: 'active' | 'dissolved';
  confidence: number;
  createdAt: string;
  dissolvedAt: string | null;
}

/**
 * Minister represents an appointment within a government for a user.
 */
export interface Minister {
  id: string;
  governmentId: string;
  userId: string;
  position: string;
  department: string;
  appointedAt: string;
  resignedAt: string | null;
  status: 'active' | 'resigned';
}

/**
 * ExecutiveAction represents an action taken by a government minister.
 */
export interface ExecutiveAction {
  id: string;
  governmentId: string;
  ministerId: string;
  type: 'order' | 'regulation' | 'appointment' | 'treaty' | 'emergency';
  title: string;
  description: string;
  requiresParliamentApproval: boolean;
  status: 'pending_approval' | 'enacted' | 'rejected';
  createdAt: string;
  enactedAt: string | null;
}

/**
 * CabinetMeeting represents a scheduled or completed cabinet meeting.
 */
export interface CabinetMeeting {
  id: string;
  governmentId: string;
  agenda: string;
  scheduledDate: string;
  attendees: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  decisions: string[];
  createdAt: string;
}

// In-memory storage

/**
 * In-memory store for government records.
 * Maps government ID to Government object. Placeholder for database layer.
 */
const governments = new Map<string, Government>();
/**
 * In-memory store for minister records.
 * Maps minister ID to Minister object. Placeholder for database layer.
 */
const ministers = new Map<string, Minister>();
/**
 * In-memory store for executive action records.
 * Maps action ID to ExecutiveAction object. Placeholder for database layer.
 */
const executiveActions = new Map<string, ExecutiveAction>();
/**
 * In-memory store for cabinet meeting records.
 * Maps meeting ID to CabinetMeeting object. Placeholder for database layer.
 */
const cabinetMeetings = new Map<string, CabinetMeeting>();

/**
 * Create a new government
 * @param req - Express request object containing government creation data
 * @param res - Express response object
 * @returns Promise resolving to response with created government data
 */
router.post('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = CreateGovernmentSchema.parse(req.body);

    const governmentId = `gov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const government: Government = {
      id: governmentId,
      gameId: validated.gameId,
      primeMinisterId: validated.primeMinisterId,
      name: validated.name,
      type: validated.type,
      formationDate: validated.formationDate,
      status: 'active' as 'active' | 'dissolved',
      confidence: 100,
      createdAt: new Date().toISOString(),
      dissolvedAt: null,
    };

    governments.set(governmentId, government);

    return res.status(201).json({
      success: true,
      data: government,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create government',
      message: (error as Error).message,
    });
  }
});

/**
 * Get government by ID
 * @param req - Express request object with government ID in params
 * @param res - Express response object
 * @returns Response with government data or error
 */
router.get('/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Government ID required',
    });
  }
  const government = governments.get(id);

  if (!government) {
    return res.status(404).json({
      success: false,
      error: 'Government not found',
    });
  }

  // Get all ministers for this government
  const governmentMinisters = Array.from(ministers.values()).filter(
    m => m.governmentId === government.id
  );

  return res.json({
    success: true,
    data: {
      ...government,
      ministers: governmentMinisters,
    },
  });
});

/**
 * List governments for a game
 * @param req - Express request object with optional gameId query parameter
 * @param res - Express response object
 * @returns Response with array of governments or error
 */
router.get('/', (req: Request, res: Response): Response => {
  const { gameId } = req.query as { gameId?: string };

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  const gameGovernments = Array.from(governments.values()).filter(g => g.gameId === gameId);

  return res.json({
    success: true,
    data: gameGovernments,
  });
});

/**
 * Appoint a minister to a government position
 * @param req - Express request object with minister appointment data in body
 * @param res - Express response object
 * @returns Promise resolving to response with appointed minister data
 */
router.post('/ministers', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = AppointMinisterSchema.parse(req.body);

    // Verify government exists
    const government = governments.get(validated.governmentId);
    if (!government) {
      return res.status(404).json({
        success: false,
        error: 'Government not found',
      });
    }

    // Check if position already filled
    const existingMinister = Array.from(ministers.values()).find(
      m => m.governmentId === validated.governmentId && m.position === validated.position
    );

    if (existingMinister) {
      return res.status(400).json({
        success: false,
        error: 'Position already filled',
        currentMinister: existingMinister,
      });
    }

    const ministerId = `minister-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const minister: Minister = {
      id: ministerId,
      governmentId: validated.governmentId,
      userId: validated.userId,
      position: validated.position,
      department: validated.department,
      appointedAt: new Date().toISOString(),
      resignedAt: null,
      status: 'active' as 'active' | 'resigned',
    };

    ministers.set(ministerId, minister);

    return res.status(201).json({
      success: true,
      data: minister,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to appoint minister',
      message: (error as Error).message,
    });
  }
});

/**
 * Remove a minister from their position
 * @param req - Express request object with minister ID in params
 * @param res - Express response object
 * @returns Response confirming minister removal
 */
router.delete('/ministers/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Minister ID required',
    });
  }
  const minister = ministers.get(id);

  if (!minister) {
    return res.status(404).json({
      success: false,
      error: 'Minister not found',
    });
  }

  minister.status = 'resigned' as 'active' | 'resigned';
  minister.resignedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: minister,
  });
});

/**
 * List ministers for a government
 * @param req - Express request object with government ID in params
 * @param res - Express response object
 * @returns Response with array of active ministers for the government
 */
router.get('/:governmentId/ministers', (req: Request, res: Response): Response => {
  const governmentMinisters = Array.from(ministers.values()).filter(
    m => m.governmentId === req.params.governmentId && m.status === 'active'
  );

  return res.json({
    success: true,
    data: governmentMinisters,
  });
});

/**
 * Create an executive action
 * @param req - Express request object containing executive action data in body
 * @param res - Express response object
 * @returns Promise resolving to response with created executive action data
 */
router.post('/actions', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = ExecutiveActionSchema.parse(req.body);

    // Verify government and minister exist
    const government = governments.get(validated.governmentId);
    if (!government) {
      return res.status(404).json({
        success: false,
        error: 'Government not found',
      });
    }

    const minister = ministers.get(validated.ministerId);
    if (!minister || minister.governmentId !== validated.governmentId) {
      return res.status(404).json({
        success: false,
        error: 'Minister not found or not part of this government',
      });
    }

    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action: ExecutiveAction = {
      id: actionId,
      governmentId: validated.governmentId,
      ministerId: validated.ministerId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
      requiresParliamentApproval: validated.requiresParliamentApproval,
      status: (validated.requiresParliamentApproval ? 'pending_approval' : 'enacted') as
        | 'pending_approval'
        | 'enacted'
        | 'rejected',
      createdAt: new Date().toISOString(),
      enactedAt: validated.requiresParliamentApproval ? null : new Date().toISOString(),
    };

    executiveActions.set(actionId, action);

    return res.status(201).json({
      success: true,
      data: action,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create executive action',
      message: (error as Error).message,
    });
  }
});

/**
 * Get executive action by ID
 * @param req - Express request object with action ID in params
 * @param res - Express response object
 * @returns Response with executive action data or error
 */
router.get('/actions/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Action ID required',
    });
  }
  const action = executiveActions.get(id);

  if (!action) {
    return res.status(404).json({
      success: false,
      error: 'Executive action not found',
    });
  }

  return res.json({
    success: true,
    data: action,
  });
});

/**
 * List executive actions for a government
 * @param req - Express request object with government ID in params
 * @param res - Express response object
 * @returns Response with array of executive actions for the government
 */
router.get('/:governmentId/actions', (req: Request, res: Response): Response => {
  const governmentActions = Array.from(executiveActions.values()).filter(
    a => a.governmentId === req.params.governmentId
  );

  return res.json({
    success: true,
    data: governmentActions,
  });
});

/**
 * Schedule a cabinet meeting
 * @param req - Express request object containing cabinet meeting data in body
 * @param res - Express response object
 * @returns Promise resolving to response with scheduled cabinet meeting data
 */
router.post('/cabinet-meetings', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = CabinetMeetingSchema.parse(req.body);

    // Verify government exists
    const government = governments.get(validated.governmentId);
    if (!government) {
      return res.status(404).json({
        success: false,
        error: 'Government not found',
      });
    }

    const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meeting: CabinetMeeting = {
      id: meetingId,
      governmentId: validated.governmentId,
      agenda: validated.agenda,
      scheduledDate: validated.scheduledDate,
      attendees: validated.attendees,
      status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed',
      decisions: [],
      createdAt: new Date().toISOString(),
    };

    cabinetMeetings.set(meetingId, meeting);

    return res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to schedule cabinet meeting',
      message: (error as Error).message,
    });
  }
});

/**
 * Get cabinet meeting by ID
 * @param req - Express request object with cabinet meeting ID in params
 * @param res - Express response object
 * @returns Response with cabinet meeting data or error
 */
router.get('/cabinet-meetings/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Cabinet meeting ID required',
    });
  }
  const meeting = cabinetMeetings.get(id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Cabinet meeting not found',
    });
  }

  return res.json({
    success: true,
    data: meeting,
  });
});

/**
 * Dissolve a government
 * @param req - Express request object with government ID in params
 * @param res - Express response object
 * @returns Response with dissolved government data
 */
router.post('/:id/dissolve', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Government ID required',
    });
  }
  const government = governments.get(id);

  if (!government) {
    return res.status(404).json({
      success: false,
      error: 'Government not found',
    });
  }

  if (government.status !== 'active') {
    return res.status(400).json({
      success: false,
      error: 'Government is not active',
    });
  }

  government.status = 'dissolved';
  government.dissolvedAt = new Date().toISOString();

  // Resign all ministers
  Array.from(ministers.values())
    .filter(m => m.governmentId === government.id && m.status === 'active')
    .forEach(m => {
      m.status = 'resigned';
      m.resignedAt = new Date().toISOString();
    });

  return res.json({
    success: true,
    data: government,
  });
});

/**
 * Vote of no confidence
 * @param req - Express request object with government ID in params
 * @param res - Express response object
 * @returns Response with updated government data after confidence vote
 */
router.post('/:id/no-confidence', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Government ID required',
    });
  }
  const government = governments.get(id);

  if (!government) {
    return res.status(404).json({
      success: false,
      error: 'Government not found',
    });
  }

  // Reduce confidence
  government.confidence = Math.max(0, government.confidence - 10);

  // If confidence drops below threshold, dissolve
  if (government.confidence < 50) {
    government.status = 'dissolved' as 'active' | 'dissolved';
    government.dissolvedAt = new Date().toISOString();
  }

  return res.json({
    success: true,
    data: government,
  });
});

/**
 * Government API router: endpoints to manage governments, ministers,
 * executive actions and cabinet meetings.
 */
export default router;
