import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const createSessionSchema = z.object({
  totalSize: z.number().nonnegative().optional().default(0),
  fileCount: z.number().int().positive().optional().default(1),
  expiresInMinutes: z.number().int().min(5).max(1440).optional().default(60),
});

export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validatedData = createSessionSchema.parse(req.body);
    
    // Generate unique room code
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.transferSession.findUnique({ where: { roomCode } });
      if (!existing) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }

    const expiresAt = new Date(Date.now() + validatedData.expiresInMinutes * 60 * 1000);

    const session = await prisma.transferSession.create({
      data: {
        roomCode,
        senderId: req.user.id,
        totalSize: BigInt(validatedData.totalSize),
        fileCount: validatedData.fileCount,
        status: 'WAITING',
        expiresAt,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      session: {
        ...session,
        totalSize: session.totalSize.toString(),
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Create session error:', error);
    return res.status(500).json({ message: 'Failed to create transfer session.' });
  }
};

export const getSessionByRoomCode = async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const cleanRoomCode = roomCode.toUpperCase().trim();

    const session = await prisma.transferSession.findUnique({
      where: { roomCode: cleanRoomCode },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Transfer session not found or expired.' });
    }

    if (session.expiresAt < new Date()) {
      if (session.status !== 'EXPIRED') {
        await prisma.transferSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });
      }
      return res.status(410).json({ message: 'This transfer session has expired.' });
    }

    return res.json({
      session: {
        ...session,
        totalSize: session.totalSize.toString(),
      },
    });
  } catch (error) {
    console.error('Get session by room code error:', error);
    return res.status(500).json({ message: 'Failed to retrieve transfer session.' });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.transferSession.findUnique({
      where: { id: sessionId },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    return res.json({
      session: {
        ...session,
        totalSize: session.totalSize.toString(),
      },
    });
  } catch (error) {
    console.error('Get session by ID error:', error);
    return res.status(500).json({ message: 'Failed to retrieve session details.' });
  }
};

export const getUserHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessions = await prisma.transferSession.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    const serializedSessions = sessions.map((s) => ({
      ...s,
      totalSize: s.totalSize.toString(),
    }));

    return res.json({ sessions: serializedSessions });
  } catch (error) {
    console.error('Get user history error:', error);
    return res.status(500).json({ message: 'Failed to fetch transfer history.' });
  }
};
