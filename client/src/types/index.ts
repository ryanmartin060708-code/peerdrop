export type SessionStatus =
  | 'WAITING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'TRANSFERRING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface TransferSession {
  id: string;
  roomCode: string;
  senderId: string;
  receiverId?: string | null;
  status: SessionStatus;
  totalSize: string;
  fileCount: number;
  createdAt: string;
  expiresAt: string;
  sender?: User;
  receiver?: User;
}

export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  sha256: string;
  totalChunks: number;
}

export interface FileProgress {
  fileId: string;
  name: string;
  size: number;
  transferredBytes: number;
  progressPercentage: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'verified';
  speedBytesPerSec: number;
  etaSeconds: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ControlMessage {
  type: 'METADATA_REQUEST' | 'ACCEPT_TRANSFER' | 'REJECT_TRANSFER' | 'CANCEL_TRANSFER' | 'PAUSE_TRANSFER' | 'RESUME_TRANSFER' | 'FILE_COMPLETE' | 'ALL_COMPLETE';
  payload?: any;
}
