export class TokenResponse {
  accessToken: string;

  refreshToken: string;

  uniqueDeviceId: string;

  session?: object;

  sessionId?: string;
}
