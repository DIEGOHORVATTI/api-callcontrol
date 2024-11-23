export interface UserConnectData {
  username: string;
  maxCalls: number;
}

export interface UserDisconnectData {
  username: string;
}

export interface CallData {
  callId: string;
  media: string;
  startDate: Date;
  service: string;
  caller: string;
}

export interface CallResponse {
  callId: string;
  error?: string;
}