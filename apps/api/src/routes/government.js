/**
 * Government Routes
 * Handles cabinet management, ministerial appointments, and executive actions
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const CreateGovernmentSchema = z.object({
  gameId: z.string().uuid(),
  primeMinisterId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['coalition', 'majority', 'minority']),
  formationDate: z.string().datetime(),
});

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

const ExecutiveActionSchema = z.object({
  governmentId: z.string().uuid(),
  ministerId: z.string().uuid(),
  type: z.enum(['order', 'regulation', 'appointment', 'treaty', 'emergency']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  requiresParliamentApproval: z.boolean().default(false),
});

const CabinetMeetingSchema = z.object({
  governmentId: z.string().uuid(),
  agenda: z.string().min(1).max(2000),
  scheduledDate: z.string().datetime(),
  attendees: z.array(z.string().uuid()),
});

// In-memory storage
const governments = new Map();
const ministers = new Map();
const executiveActions = new Map();
const cabinetMeetings = new Map();

/**
 * Create a new government
 * POST /api/government
 */
router.post('/', async (req, res) => {
  try {
    const validated = CreateGovernmentSchema.parse(req.body);
    
    const governmentId = `gov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const government = {
      id: governmentId,
      ...validated,
      status: 'active',
      confidence: 100,
      createdAt: new Date().toISOString(),
      dissolvedAt: null,
    };
    
    governments.set(governmentId, government);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to create government',
      message: error.message,
    });
  }
});

/**
 * Get government by ID
 * GET /api/government/:id
 */
router.get('/:id', (req, res) => {
  const government = governments.get(req.params.id);
  
  if (!government) {
    return res.status(404).json({
      success: false,
      error: 'Government not found',
    });
  }
  
  // Get all ministers for this government
  const governmentMinisters = Array.from(ministers.values())
    .filter(m => m.governmentId === government.id);
  
  res.json({
    success: true,
    data: {
      ...government,
      ministers: governmentMinisters,
    },
  });
});

/**
 * List governments for a game
 * GET /api/government?gameId=xxx
 */
router.get('/', (req, res) => {
  const { gameId } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  const gameGovernments = Array.from(governments.values())
    .filter(g => g.gameId === gameId);
  
  res.json({
    success: true,
    data: gameGovernments,
  });
});

/**
 * Appoint a minister
 * POST /api/government/ministers
 */
router.post('/ministers', async (req, res) => {
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
    const existingMinister = Array.from(ministers.values())
      .find(m => m.governmentId === validated.governmentId && m.position === validated.position);
    
    if (existingMinister) {
      return res.status(400).json({
        success: false,
        error: 'Position already filled',
        currentMinister: existingMinister,
      });
    }
    
    const ministerId = `minister-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const minister = {
      id: ministerId,
      ...validated,
      appointedAt: new Date().toISOString(),
      resignedAt: null,
      status: 'active',
    };
    
    ministers.set(ministerId, minister);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to appoint minister',
      message: error.message,
    });
  }
});

/**
 * Remove a minister
 * DELETE /api/government/ministers/:id
 */
router.delete('/ministers/:id', (req, res) => {
  const minister = ministers.get(req.params.id);
  
  if (!minister) {
    return res.status(404).json({
      success: false,
      error: 'Minister not found',
    });
  }
  
  minister.status = 'resigned';
  minister.resignedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: minister,
  });
});

/**
 * List ministers for a government
 * GET /api/government/:governmentId/ministers
 */
router.get('/:governmentId/ministers', (req, res) => {
  const governmentMinisters = Array.from(ministers.values())
    .filter(m => m.governmentId === req.params.governmentId && m.status === 'active');
  
  res.json({
    success: true,
    data: governmentMinisters,
  });
});

/**
 * Create an executive action
 * POST /api/government/actions
 */
router.post('/actions', async (req, res) => {
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
    const action = {
      id: actionId,
      ...validated,
      status: validated.requiresParliamentApproval ? 'pending_approval' : 'enacted',
      createdAt: new Date().toISOString(),
      enactedAt: validated.requiresParliamentApproval ? null : new Date().toISOString(),
    };
    
    executiveActions.set(actionId, action);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to create executive action',
      message: error.message,
    });
  }
});

/**
 * Get executive action by ID
 * GET /api/government/actions/:id
 */
router.get('/actions/:id', (req, res) => {
  const action = executiveActions.get(req.params.id);
  
  if (!action) {
    return res.status(404).json({
      success: false,
      error: 'Executive action not found',
    });
  }
  
  res.json({
    success: true,
    data: action,
  });
});

/**
 * List executive actions for a government
 * GET /api/government/:governmentId/actions
 */
router.get('/:governmentId/actions', (req, res) => {
  const governmentActions = Array.from(executiveActions.values())
    .filter(a => a.governmentId === req.params.governmentId);
  
  res.json({
    success: true,
    data: governmentActions,
  });
});

/**
 * Schedule a cabinet meeting
 * POST /api/government/cabinet-meetings
 */
router.post('/cabinet-meetings', async (req, res) => {
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
    const meeting = {
      id: meetingId,
      ...validated,
      status: 'scheduled',
      decisions: [],
      createdAt: new Date().toISOString(),
    };
    
    cabinetMeetings.set(meetingId, meeting);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to schedule cabinet meeting',
      message: error.message,
    });
  }
});

/**
 * Get cabinet meeting by ID
 * GET /api/government/cabinet-meetings/:id
 */
router.get('/cabinet-meetings/:id', (req, res) => {
  const meeting = cabinetMeetings.get(req.params.id);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Cabinet meeting not found',
    });
  }
  
  res.json({
    success: true,
    data: meeting,
  });
});

/**
 * Dissolve a government
 * POST /api/government/:id/dissolve
 */
router.post('/:id/dissolve', (req, res) => {
  const government = governments.get(req.params.id);
  
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
  
  res.json({
    success: true,
    data: government,
  });
});

/**
 * Vote of no confidence
 * POST /api/government/:id/no-confidence
 */
router.post('/:id/no-confidence', (req, res) => {
  const government = governments.get(req.params.id);
  
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
    government.status = 'dissolved';
    government.dissolvedAt = new Date().toISOString();
  }
  
  res.json({
    success: true,
    data: government,
  });
});

export default router;
