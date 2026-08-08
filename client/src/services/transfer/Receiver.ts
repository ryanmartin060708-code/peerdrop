import { FileMetadata } from '../../types/index.js';

export class FileReceiver {
  private metadata: FileMetadata;
  private chunks: ArrayBuffer[] = [];
  private receivedBytes: number = 0;
  private startTime: number = 0;
  private lastProgressTime: number = 0;
  private lastBytes: number = 0;

  constructor(metadata: FileMetadata) {
    this.metadata = metadata;
    this.startTime = Date.now();
    this.lastProgressTime = this.startTime;
  }

  public addChunk(
    chunk: ArrayBuffer,
    onProgress: (received: number, total: number, speed: number, eta: number) => void
  ) {
    this.chunks.push(chunk);
    this.receivedBytes += chunk.byteLength;

    const now = Date.now();
    const timeDiffSec = (now - this.lastProgressTime) / 1000;
    if (timeDiffSec >= 0.2 || this.receivedBytes === this.metadata.size) {
      const bytesDiff = this.receivedBytes - this.lastBytes;
      const speed = timeDiffSec > 0 ? bytesDiff / timeDiffSec : 0;
      const remaining = this.metadata.size - this.receivedBytes;
      const eta = speed > 0 ? remaining / speed : 0;

      onProgress(this.receivedBytes, this.metadata.size, speed, eta);

      this.lastProgressTime = now;
      this.lastBytes = this.receivedBytes;
    }
  }

  public async completeAndVerify(): Promise<{ blob: Blob; isVerified: boolean; hashHex: string }> {
    // Combine ArrayBuffer chunks into single Blob
    const blob = new Blob(this.chunks, { type: this.metadata.type || 'application/octet-stream' });
    
    // Calculate receiver SHA-256
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const receiverHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const isVerified = receiverHash.toLowerCase() === this.metadata.sha256.toLowerCase();

    return {
      blob,
      isVerified,
      hashHex: receiverHash,
    };
  }

  public triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  public reset() {
    this.chunks = [];
    this.receivedBytes = 0;
  }
}
