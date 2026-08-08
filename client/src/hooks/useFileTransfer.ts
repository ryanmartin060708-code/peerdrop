import { useState, useRef, useCallback } from 'react';
import { WebRTCManager } from '../services/webrtc/WebRTCManager.js';
import { FileChunkSender, calculateSHA256 } from '../services/transfer/Chunker.js';
import { FileReceiver } from '../services/transfer/Receiver.js';
import { FileMetadata, FileProgress, ControlMessage } from '../types/index.js';

export function useFileTransfer(webrtc: WebRTCManager | null) {
  const [files, setFiles] = useState<File[]>([]);
  const [incomingMetadata, setIncomingMetadata] = useState<FileMetadata[] | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [progress, setProgress] = useState<FileProgress[]>([]);
  const [transferState, setTransferState] = useState<
    'idle' | 'waiting_approval' | 'transferring' | 'paused' | 'completed' | 'cancelled' | 'rejected' | 'failed'
  >('idle');
  const [sha256Verified, setSha256Verified] = useState<boolean | null>(null);

  const chunkSenderRef = useRef<FileChunkSender | null>(null);
  const receiverRef = useRef<FileReceiver | null>(null);

  // Helper formatting size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const formatETA = (seconds: number): string => {
    if (seconds <= 0 || !isFinite(seconds)) return '0s';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Sender: Add files
  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    const newProgress: FileProgress[] = newFiles.map((file) => ({
      fileId: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size: file.size,
      transferredBytes: 0,
      progressPercentage: 0,
      status: 'pending',
      speedBytesPerSec: 0,
      etaSeconds: 0,
    }));
    setProgress((prev) => [...prev, ...newProgress]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setProgress([]);
    setTransferState('idle');
  };

  // Sender: Start request by preparing metadata & sending METADATA_REQUEST
  const requestTransfer = async () => {
    if (!webrtc || files.length === 0) return;

    setTransferState('waiting_approval');

    const metadataList: FileMetadata[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sha256 = await calculateSHA256(file);
      const totalChunks = Math.ceil(file.size / (64 * 1024));
      metadataList.push({
        fileId: progress[i]?.fileId || `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sha256,
        totalChunks,
      });
    }

    webrtc.sendControl({
      type: 'METADATA_REQUEST',
      payload: { files: metadataList },
    });
  };

  // Sender: Initiate sending file queue sequentially
  const startSending = async () => {
    if (!webrtc || files.length === 0) return;

    setTransferState('transferring');

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];
      const metadata: FileMetadata = {
        fileId: progress[i]?.fileId || `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sha256: await calculateSHA256(file),
        totalChunks: Math.ceil(file.size / (64 * 1024)),
      };

      const sender = new FileChunkSender(file, metadata, webrtc);
      chunkSenderRef.current = sender;

      await new Promise<void>((resolve, reject) => {
        sender.startTransfer(
          (bytesSent, totalBytes, speed, eta) => {
            const pct = (bytesSent / totalBytes) * 100;
            setProgress((prev) => {
              const copy = [...prev];
              copy[i] = {
                ...copy[i],
                transferredBytes: bytesSent,
                progressPercentage: pct,
                speedBytesPerSec: speed,
                etaSeconds: eta,
                status: 'transferring',
              };
              return copy;
            });
          },
          () => {
            setProgress((prev) => {
              const copy = [...prev];
              copy[i] = {
                ...copy[i],
                transferredBytes: file.size,
                progressPercentage: 100,
                status: 'completed',
              };
              return copy;
            });
            webrtc.sendControl({ type: 'FILE_COMPLETE', payload: { fileId: metadata.fileId } });
            resolve();
          },
          (err) => {
            setProgress((prev) => {
              const copy = [...prev];
              copy[i] = { ...copy[i], status: 'failed', error: err.message };
              return copy;
            });
            reject(err);
          }
        );
      });
    }

    setTransferState('completed');
    webrtc.sendControl({ type: 'ALL_COMPLETE' });
  };

  // Receiver: Accept incoming transfer request
  const acceptTransfer = () => {
    if (!webrtc || !incomingMetadata) return;
    webrtc.sendControl({ type: 'ACCEPT_TRANSFER' });
    setTransferState('transferring');

    // Setup receiver for first file
    if (incomingMetadata.length > 0) {
      receiverRef.current = new FileReceiver(incomingMetadata[0]);
    }
  };

  // Receiver: Reject incoming request
  const rejectTransfer = () => {
    if (!webrtc) return;
    webrtc.sendControl({ type: 'REJECT_TRANSFER' });
    setTransferState('rejected');
  };

  // Control Message Event Processor
  const handleControlMessage = useCallback((msg: ControlMessage) => {
    console.log('[Transfer] Control message received:', msg);

    switch (msg.type) {
      case 'METADATA_REQUEST':
        setIncomingMetadata(msg.payload.files);
        setTransferState('waiting_approval');
        const initialProgress: FileProgress[] = msg.payload.files.map((meta: FileMetadata) => ({
          fileId: meta.fileId,
          name: meta.name,
          size: meta.size,
          transferredBytes: 0,
          progressPercentage: 0,
          status: 'pending',
          speedBytesPerSec: 0,
          etaSeconds: 0,
        }));
        setProgress(initialProgress);
        break;

      case 'ACCEPT_TRANSFER':
        startSending();
        break;

      case 'REJECT_TRANSFER':
        setTransferState('rejected');
        break;

      case 'CANCEL_TRANSFER':
        if (chunkSenderRef.current) chunkSenderRef.current.cancel();
        setTransferState('cancelled');
        break;

      case 'FILE_COMPLETE':
        if (receiverRef.current) {
          receiverRef.current.completeAndVerify().then(({ blob, isVerified }) => {
            setSha256Verified(isVerified);
            const currentMeta = incomingMetadata ? incomingMetadata[currentFileIndex] : null;
            if (currentMeta) {
              receiverRef.current?.triggerDownload(blob, currentMeta.name);
            }

            setProgress((prev) => {
              const copy = [...prev];
              if (copy[currentFileIndex]) {
                copy[currentFileIndex] = {
                  ...copy[currentFileIndex],
                  status: isVerified ? 'verified' : 'completed',
                  progressPercentage: 100,
                };
              }
              return copy;
            });

            // Prepare receiver for next file if any
            if (incomingMetadata && currentFileIndex + 1 < incomingMetadata.length) {
              const nextIndex = currentFileIndex + 1;
              setCurrentFileIndex(nextIndex);
              receiverRef.current = new FileReceiver(incomingMetadata[nextIndex]);
            }
          });
        }
        break;

      case 'ALL_COMPLETE':
        setTransferState('completed');
        break;
    }
  }, [incomingMetadata, currentFileIndex]);

  // Handle Incoming Binary File Chunk
  const handleFileChunk = useCallback(
    (chunk: ArrayBuffer) => {
      if (receiverRef.current) {
        receiverRef.current.addChunk(chunk, (received, total, speed, eta) => {
          const pct = (received / total) * 100;
          setProgress((prev) => {
            const copy = [...prev];
            if (copy[currentFileIndex]) {
              copy[currentFileIndex] = {
                ...copy[currentFileIndex],
                transferredBytes: received,
                progressPercentage: pct,
                speedBytesPerSec: speed,
                etaSeconds: eta,
                status: 'transferring',
              };
            }
            return copy;
          });
        });
      }
    },
    [currentFileIndex]
  );

  const cancelTransfer = () => {
    if (chunkSenderRef.current) chunkSenderRef.current.cancel();
    if (webrtc) webrtc.sendControl({ type: 'CANCEL_TRANSFER' });
    setTransferState('cancelled');
  };

  return {
    files,
    incomingMetadata,
    progress,
    transferState,
    currentFileIndex,
    sha256Verified,
    addFiles,
    removeFile,
    clearFiles,
    requestTransfer,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    handleControlMessage,
    handleFileChunk,
    formatBytes,
    formatSpeed,
    formatETA,
  };
}
