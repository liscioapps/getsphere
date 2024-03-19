export interface IntegrationProgress {
  data: Record<string, any>
  platform: string;
  reportStatus: 'ok' | 'in-progress';
  segmentId: string;
  segmentName: string;
  type: string;
}

export interface IntegrationProgressPart {
  message: string;
  percentage: number,
  status: 'ok' | 'in-progress' | 'test' | 'sth'
}
