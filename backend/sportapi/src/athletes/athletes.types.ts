export interface AthleteDocument {
  athleteId: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  weightKg?: number;
  heightCm?: number;
  trainingLevel: string;
  sports: string[];
  loadZones?: {
    z1?: { min: number; max: number };
    z2?: { min: number; max: number };
    z3?: { min: number; max: number };
    z4?: { min: number; max: number };
    z5?: { min: number; max: number };
  };
  createdAt: Date;
  updatedAt: Date;
}
