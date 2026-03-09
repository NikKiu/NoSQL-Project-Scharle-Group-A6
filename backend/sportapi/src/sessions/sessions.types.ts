export interface TrainingSessionDocument {
  sessionId: string;
  athleteId: string;
  sport: string;
  status: 'active' | 'finished';
  sensorTypes: string[];
  startAt: Date;
  endAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
