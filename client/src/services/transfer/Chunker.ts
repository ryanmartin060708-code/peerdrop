import { FileMetadata } from '../../types/index.js';
import { WebRTCManager } from '../webrtc/WebRTCManager.js';

export const CHUNK_SIZE = 64 * 1024; // 64 KB

export async function calculateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export class FileChunkSender {
  private file: File;
  private metadata: FileMetadata;
  private webrtc: WebRTCManager;
  private isCancelled: boolean = false;
  private isPaused: boolean = false;

  constructor(file: File, metadata: FileMetadata, webrtc: WebRTCManager) {
    this.file = file;
    this.metadata = metadata;
    this.webrtc = webrtc;
  }

  public async startTransfer(
    onProgress: (bytesSent: number, totalBytes: number, speedBytesPerSec: number, etaSec: number) => void,
    onComplete: () => void,
    onError: (err: Error) => void
  ) {
    try {
      const totalSize = this.file.size;
      let offset = 0;
      let startTime = Date.now();
      let lastProgressTime = startTime;
      let lastBytesSent = 0;

      while (offset < totalSize) {
        if (this.isCancelled) {
          console.log('[Chunker] Transfer cancelled');
          return;
        }

        while (this.isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (this.isCancelled) return;
        }

        // Apply backpressure if WebRTC buffer has exceeded threshold (e.g., > 1 MB)
        if (this.webrtc.getBufferedAmount() > 1024 * 1024) {
          await new Promise<void>((resolve) => {
            this.webrtc.setOnBufferedAmountLow(() => resolve());
            setTimeout(resolve, 50); // fallback timeout
          });
        }

        const slice = this.file.slice(offset, offset + CHUNK_SIZE);
        const chunkBuffer = await slice.arrayBuffer();

        const success = this.webrtc.sendFileChunk(chunkBuffer);
        if (!success) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          continue;
        }

        offset += chunkBuffer.byteLength;

        // Telemetry calculations
        const now = Date.now();
        const timeDiffSec = (now - lastProgressTime) / 1000;
        if (timeDiffSec >= 0.2 || offset === totalSize) {
          const bytesDiff = offset - lastBytesSent;
          const speed = timeDiffSec > 0 ? bytesDiff / timeDiffSec : 0;
          const remainingBytes = totalSize - offset;
          const eta = speed > 0 ? remainingBytes / speed : 0;

          onProgress(offset, totalSize, speed, eta);

          lastProgressTime = now;
          lastBytesSent = offset;
        }
      }

      onComplete();
    } catch (err: any) {
      onError(err);
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }
}
