export interface SensorEventDocument {
  eventId: string;
  athleteId: string;
  sessionId: string;
  timestamp: Date;
  sensorType: string;
  metrics: Record<string, any>;
  heartRate?: number;
  speed?: number;
  distanceDelta?: number;
  lat?: number;
  lon?: number;
  powerW?: number;
  createdAt: Date;
}
