import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { MongoService } from '../mongo.service';
import { RequestUser, USER_ROLES } from '../common/auth/auth.types';
import { issueAuthToken } from '../common/auth/auth.utils';
import { createId } from '../common/utils/id';
import { ensureString, ensureStringArray } from '../common/utils/parse';

@Injectable()
export class AuthService {
  constructor(private readonly mongoService: MongoService) {}

  private usersCollection() {
    return this.mongoService.getDb().collection('users');
  }

  private athletesCollection() {
    return this.mongoService.getDb().collection('athletes');
  }

  private normalizeEmail(raw: any): string {
    return ensureString(raw, 'email').toLowerCase();
  }

  private hashPassword(password: string): string {
    const pepper = process.env.AUTH_PASSWORD_PEPPER || 'dev-pepper';
    return createHash('sha256').update(`${pepper}:${password}`).digest('hex');
  }

  private toPublicUser(user: any) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name ?? null,
      athleteId: user.athleteId ?? null,
      trainerAthleteIds: user.trainerAthleteIds ?? []
    };
  }

  async register(body: any) {
    const email = this.normalizeEmail(body.email);
    const password = ensureString(body.password, 'password');
    const role = ensureString(body.role, 'role') as RequestUser['role'];

    if (!USER_ROLES.includes(role)) {
      throw new BadRequestException('Invalid role. Allowed values: admin, trainer, athlete');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const exists = await this.usersCollection().findOne({ email });
    if (exists) {
      throw new BadRequestException('A user with this email already exists');
    }

    const now = new Date();
    const userId = createId(role);
    const name = body.name?.toString().trim() || email.split('@')[0];
    const trainerAthleteIds =
      role === 'trainer' && Array.isArray(body.trainerAthleteIds) && body.trainerAthleteIds.length > 0
        ? ensureStringArray(body.trainerAthleteIds, 'trainerAthleteIds')
        : [];
    const athleteId = role === 'athlete' ? body.athleteId?.toString().trim() || createId('athlete') : null;

    const userDoc: any = {
      id: userId,
      userId,
      email,
      role,
      name,
      passwordHash: this.hashPassword(password),
      trainerAthleteIds,
      athleteId,
      createdAt: now,
      updatedAt: now
    };

    await this.usersCollection().insertOne(userDoc);

    if (role === 'athlete') {
      await this.athletesCollection().updateOne(
        { athleteId },
        {
          $setOnInsert: {
            id: athleteId,
            athleteId,
            userId,
            firstName: body.firstName?.toString().trim() || name,
            lastName: body.lastName?.toString().trim() || 'Athlete',
            birthDate: new Date('2000-01-01T00:00:00.000Z'),
            gender: body.gender?.toString().trim() || 'unknown',
            trainingLevel: 'beginner',
            sports: ensureStringArray(body.sports ?? ['running'], 'sports'),
            createdAt: now,
            updatedAt: now
          }
        },
        { upsert: true }
      );
    }

    return {
      auth: { userId, role, token: issueAuthToken({ userId, role }) },
      user: this.toPublicUser(userDoc)
    };
  }

  async login(body: any) {
    const email = this.normalizeEmail(body.email);
    const password = ensureString(body.password, 'password');

    const user = await this.usersCollection().findOne({ email });
    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      auth: { userId: user.userId, role: user.role, token: issueAuthToken({ userId: user.userId, role: user.role }) },
      user: this.toPublicUser(user)
    };
  }

  async me(requestUser: RequestUser) {
    const user = await this.usersCollection().findOne({ userId: requestUser.userId, role: requestUser.role });
    if (!user) {
      throw new UnauthorizedException('User not found for provided auth headers');
    }

    return {
      auth: { userId: user.userId, role: user.role, token: issueAuthToken({ userId: user.userId, role: user.role }) },
      user: this.toPublicUser(user)
    };
  }
}

