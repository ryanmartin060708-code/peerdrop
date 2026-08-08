import { ControlMessage, ChatMessage, FileMetadata } from '../../types/index.js';

export interface WebRTCEvents {
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onControlMessage: (message: ControlMessage) => void;
  onFileChunk: (chunk: ArrayBuffer) => void;
  onChatMessage: (message: ChatMessage) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onError: (error: Error) => void;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private controlChannel: RTCDataChannel | null = null;
  private fileChannel: RTCDataChannel | null = null;
  private chatChannel: RTCDataChannel | null = null;

  private events: WebRTCEvents;
  private isInitiator: boolean;

  constructor(isInitiator: boolean, events: WebRTCEvents) {
    this.isInitiator = isInitiator;
    this.events = events;
    this.initPeerConnection();
  }

  private initPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.events.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log(`[WebRTC] Connection state: ${this.peerConnection.connectionState}`);
        this.events.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    if (this.isInitiator) {
      this.setupDataChannelsAsInitiator();
    } else {
      this.setupDataChannelsAsReceiver();
    }
  }

  private setupDataChannelsAsInitiator() {
    if (!this.peerConnection) return;

    // Control Channel
    this.controlChannel = this.peerConnection.createDataChannel('control', { ordered: true });
    this.bindControlChannelEvents(this.controlChannel);

    // File Channel
    this.fileChannel = this.peerConnection.createDataChannel('file', { ordered: true });
    this.fileChannel.binaryType = 'arraybuffer';
    this.bindFileChannelEvents(this.fileChannel);

    // Chat Channel
    this.chatChannel = this.peerConnection.createDataChannel('chat', { ordered: true });
    this.bindChatChannelEvents(this.chatChannel);
  }

  private setupDataChannelsAsReceiver() {
    if (!this.peerConnection) return;

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log(`[WebRTC] Receiver received DataChannel: ${channel.label}`);

      if (channel.label === 'control') {
        this.controlChannel = channel;
        this.bindControlChannelEvents(this.controlChannel);
      } else if (channel.label === 'file') {
        this.fileChannel = channel;
        this.fileChannel.binaryType = 'arraybuffer';
        this.bindFileChannelEvents(this.fileChannel);
      } else if (channel.label === 'chat') {
        this.chatChannel = channel;
        this.bindChatChannelEvents(this.chatChannel);
      }
    };
  }

  private bindControlChannelEvents(channel: RTCDataChannel) {
    channel.onopen = () => console.log('[WebRTC] Control channel open');
    channel.onmessage = (event) => {
      try {
        const msg: ControlMessage = JSON.parse(event.data);
        this.events.onControlMessage(msg);
      } catch (err) {
        console.error('[WebRTC] Invalid control JSON message:', err);
      }
    };
  }

  private bindFileChannelEvents(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('[WebRTC] File channel open');
      channel.bufferedAmountLowThreshold = 256 * 1024; // 256 KB backpressure threshold
    };
    channel.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.events.onFileChunk(event.data);
      }
    };
  }

  private bindChatChannelEvents(channel: RTCDataChannel) {
    channel.onopen = () => console.log('[WebRTC] Chat channel open');
    channel.onmessage = (event) => {
      try {
        const msg: ChatMessage = JSON.parse(event.data);
        this.events.onChatMessage(msg);
      } catch (err) {
        console.error('[WebRTC] Invalid chat message:', err);
      }
    };
  }

  // Offer / Answer creation
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('[WebRTC] Failed to add ICE candidate:', err);
    }
  }

  // Sending Methods
  public sendControl(msg: ControlMessage): boolean {
    if (this.controlChannel && this.controlChannel.readyState === 'open') {
      this.controlChannel.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  public sendFileChunk(chunk: ArrayBuffer): boolean {
    if (this.fileChannel && this.fileChannel.readyState === 'open') {
      this.fileChannel.send(chunk);
      return true;
    }
    return false;
  }

  public sendChatMessage(msg: ChatMessage): boolean {
    if (this.chatChannel && this.chatChannel.readyState === 'open') {
      this.chatChannel.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  public getBufferedAmount(): number {
    return this.fileChannel ? this.fileChannel.bufferedAmount : 0;
  }

  public setOnBufferedAmountLow(callback: () => void) {
    if (this.fileChannel) {
      this.fileChannel.onbufferedamountlow = callback;
    }
  }

  public close() {
    if (this.controlChannel) this.controlChannel.close();
    if (this.fileChannel) this.fileChannel.close();
    if (this.chatChannel) this.chatChannel.close();
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    console.log('[WebRTC] Connections closed');
  }
}
