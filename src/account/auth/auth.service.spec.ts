import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RegisterCustomerDto,
  RegisterUserDto,
  VerifyEmailAndSavePasswordDto,
} from './auth.dto';
import { Action, Gender, Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/.';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MailerModule } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RbacModule } from '../../rbac/rbac.module';
import moment from 'moment';
import {
  getIpAddress,
  getUserAgent,
  maskSensitive,
} from '../../generic/generic.utils';
import { RoleGroupService, RoleService } from '../../rbac/rbac.service';

const firstName = faker.person.firstName();
const lastName = faker.person.lastName();
const email = `olaleyeemmanuel+${firstName}@gmail.com`;
let password = 'StrongPassword123!';

const request = {
  headers: { 'user-agent': 'TestAgent' },
  ip: '127.0.0.1',
} as any;

describe('AuthService Integration', () => {
  //

  let authService: AuthService | any;
  let prismaService: PrismaService;
  let mailService: MailService;
  let logService: LogService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const testDatabase = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env', // Ensure you have a test-specific .env file if required
        }),
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: {
              host: configService.get('MAIL_HOST'),
              // port: configService.get('MAIL_PORT', 587),
              secure: false, // Use true for 465 (SSL)
              auth: {
                user: configService.get('MAIL_USER'),
                pass: configService.get('MAIL_PASSWORD'),
              },
            },
            defaults: {
              from: `"${configService.get('APP_NAME')}" <${configService.get('MAIL_FROM')}>`,
            },
            template: {
              dir: join(__dirname, '../../notification/mail/templates'), // Path to email templates
              adapter:
                new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
              options: {
                strict: true,
              },
            },
          }),
        }),
        RbacModule,
      ],
      providers: [
        AuthService,
        PrismaService,
        LogService,
        MailService,
        ConfigService,
        JwtService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService) as any;
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    logService = module.get<LogService>(LogService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    // Clean up test database tables before each test
    await testDatabase.emailVerification.deleteMany({
      where: { user: { email } },
    });
    await testDatabase.log.deleteMany({
      where: { user: { email } },
    });
    await testDatabase.user.deleteMany({
      where: { email },
    });

    // Disconnect the test database
    await testDatabase.$disconnect();
  });

  describe('Register', () => {
    // Register
    it('should register a user, create verification data, log the action, and send an email', async () => {
      const registerUserDto: RegisterUserDto | any = {
        name: firstName + ' ' + lastName,
        email: email,
        password: password,
      };

      // Act
      const result = (await authService.registerBusinessOwner(
        registerUserDto,
        request,
      )) as any;

      // Assert
      expect(result.statusCode).toEqual(HttpStatus.CREATED);

      // Verify the user exists in the database
      const user = await testDatabase.user.findUnique({
        where: { email: registerUserDto.email },
      });
      expect(user).not.toBeNull();
      expect(user.name).toBe(registerUserDto.name);

      // Verify the email verification record exists in the database
      const emailVerification = await testDatabase.emailVerification.findFirst({
        where: { user_id: user.id },
      });
      expect(emailVerification).not.toBeNull();
      expect(emailVerification.is_verified).toBe(false);

      // Verify the log is created
      const log = await testDatabase.log.findFirst({
        where: {
          user_id: user.id,
          action: Action.CREATE,
        },
      });
      expect(log).not.toBeNull();
    });

    it('should throw a BadRequestException if email already exists', async () => {
      const registerUserDto: RegisterUserDto | any = {
        name: firstName + ' ' + lastName,
        email: email,
        password: await bcrypt.hash(password, 10),
      };
      const request = {
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;

      // Act & Assert
      await expect(
        authService.registerBusinessOwner(registerUserDto, request),
      ).rejects.toThrow('Email address is already in use.');
    });
  });

  describe('Verify email', () => {
    // Verify email
    it('should verify email successfully with a valid token', async () => {
      // Create the user and email verification in the database
      const user = await prismaService.user.findUnique({
        where: { email },
        include: { email_verification: true },
      });

      const response = await authService.verifyEmail({
        token: user.email_verification.verification_token,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    it('should throw BadRequestException if token is invalid', async () => {
      const mockToken = 'invalid-token';

      try {
        await authService.verifyEmail({ token: mockToken });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should throw BadRequestException if token is expired', async () => {
      const mockToken = uuidv4();
      const dummyEmail = `${uuidv4()}@example.com`;
      const dummyUserId = uuidv4();

      const mockEmailVerification = {
        verification_token: mockToken,
        expires_at: new Date(Date.now() - 3600 * 1000), // Token expired
        is_verified: false,
        user: {
          id: dummyUserId,
          email: dummyEmail,
          name: firstName,
          password_hash: await bcrypt.hash(password, 10),
        },
      };

      // Create the user and email verification in the database
      await prismaService.user.create({
        data: mockEmailVerification.user as any,
      });

      await prismaService.emailVerification.create({
        data: {
          user_id: mockEmailVerification.user.id,
          verification_token: mockEmailVerification.verification_token,
          expires_at: mockEmailVerification.expires_at,
          is_verified: mockEmailVerification.is_verified,
        },
      });

      try {
        await authService.verifyEmail({ token: mockToken });

        // Clear dummy details
        await prismaService.emailVerification.deleteMany({
          where: { user_id: mockEmailVerification.user.id },
        });
        await prismaService.user.deleteMany({
          where: { id: mockEmailVerification.user.id },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Resend email verification', () => {
    it('should throw BadRequestException if user does not exist', async () => {
      const mockEmail = 'nonexistent@example.com';

      try {
        await authService.resendEmailVerification(
          { email: mockEmail },
          {} as any,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('User with this email does not exist.');
      }
    });

    it('should return message if email is already verified', async () => {
      const response = await authService.resendEmailVerification(
        { email },
        {} as any,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.message).toBe('Email is already verified.');
    });

    it('should resend the verification email if token expired or missing', async () => {
      const mockEmail = `${uuidv4()}@example.com`;
      const mockUser = {
        id: uuidv4(),
        email: mockEmail,
        name: firstName,
        password_hash: await bcrypt.hash(password, 10),
      };
      const mockEmailVerification = {
        is_verified: false,
        expires_at: new Date(Date.now() - 3600 * 1000),
      };

      // Create the user and email verification in the database
      await prismaService.user.create({
        data: mockUser,
      });

      await prismaService.emailVerification.create({
        data: {
          user_id: mockUser.id,
          verification_token: uuidv4(),
          expires_at: mockEmailVerification.expires_at,
          is_verified: mockEmailVerification.is_verified,
        },
      });

      const response = await authService.resendEmailVerification(
        { email: mockEmail } as any,
        request,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);

      // Clear dummy details
      await prismaService.emailVerification.deleteMany({
        where: { user_id: mockUser.id },
      });
      await prismaService.user.deleteMany({
        where: { id: mockUser.id },
      });
    });

    it('should resend the verification email if token is still valid', async () => {
      const mockEmail = `${uuidv4()}@example.com`;
      const mockUser = {
        id: uuidv4(),
        email: mockEmail,
        name: firstName,
        password_hash: await bcrypt.hash(password, 10),
      };
      const mockEmailVerification = {
        is_verified: false,
        verification_token: uuidv4(),
        expires_at: new Date(Date.now() + 3600 * 1000),
      };

      // Create the user and email verification in the database
      await prismaService.user.create({
        data: mockUser,
      });

      await prismaService.emailVerification.create({
        data: {
          user_id: mockUser.id,
          verification_token: mockEmailVerification.verification_token,
          expires_at: mockEmailVerification.expires_at,
          is_verified: mockEmailVerification.is_verified,
        },
      });

      const response = await authService.resendEmailVerification(
        { email: mockEmail } as any,
        request,
      );

      expect(response.statusCode).toBe(HttpStatus.OK);

      // Clear dummy details
      await prismaService.emailVerification.deleteMany({
        where: { user_id: mockUser.id },
      });
      await prismaService.user.deleteMany({
        where: { id: mockUser.id },
      });
    });
  });

  describe('Login', () => {
    // Request OTP - Login
    it('should send an OTP if login credentials are valid', async () => {
      const result = await authService.requestOtp({
        email,
        password,
      });

      expect(result.statusCode).toEqual(HttpStatus.OK);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      await expect(
        authService.requestOtp({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    // Verify Otp -  Login
    it('should verify the OTP and return an access token', async () => {
      // Create a user in the test database
      const user = await prismaService.user.findUnique({
        where: {
          email,
        },
      });

      // Create an OTP in the database
      await prismaService.otp.upsert({
        where: { user_id: user.id },
        create: {
          user_id: user.id,
          otp: '123456',
          expires_at: moment().add(5, 'minutes').toDate(),
        },
        update: {
          otp: '123456',
        },
      });

      const result = await authService.verifyOtp(
        {
          email: user.email,
          otp: '123456',
        },
        request,
      );

      expect(result).toHaveProperty('statusCode', 200);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      await expect(
        authService.verifyOtp(
          {
            email,
            otp: 'wrong-otp',
          },
          request,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired OTP', async () => {
      const password_hash = await bcrypt.hash(password, 10);

      // Create a user in the test database
      const user = await prismaService.user.create({
        data: {
          name: firstName,
          email: `test+${uuidv4()}@example.com`,
          password_hash,
        },
      });

      // Create an expired OTP in the database
      await prismaService.otp.create({
        data: {
          user_id: user.id,
          otp: '123456',
          expires_at: moment().subtract(1, 'minute').toDate(),
        },
      });

      await expect(
        authService.verifyOtp(
          {
            email: user.email,
            otp: '123456',
          },
          request,
        ),
      ).rejects.toThrow(BadRequestException);

      // Delete user
      await prismaService.user.deleteMany({
        where: { email: user.email },
      });
    });
  });

  describe('Password reset request', () => {
    it('should send password reset email if the user exists', async () => {
      // Call the service method
      const result = await authService.requestPasswordReset({ email });

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.OK);
    });

    it('should throw BadRequestException if the user does not exist', async () => {
      const mock_email = 'nonexistent@example.com';

      await expect(
        authService.requestPasswordReset({ email: mock_email }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Password reset', () => {
    it('should reset the password if the token is valid and user exists', async () => {
      // Insert a test user
      const testUser = await prismaService.user.create({
        data: {
          name: firstName,
          email: `user+${uuidv4()}@example.com`,
          password_hash: await bcrypt.hash(password, 10),
        },
      });

      // Generate a reset token
      const reset_token = jwtService.sign(
        { sub: testUser.id, email: testUser.email },
        {
          secret: configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
          expiresIn: '1h',
        },
      );

      // Call the service method
      const new_password = 'newPassword123';
      const result = await authService.resetPassword(
        {
          reset_token,
          new_password,
        },
        request,
      );

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.OK);

      // Verify that the password was updated
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });

      const isPasswordValid = await bcrypt.compare(
        new_password,
        updatedUser.password_hash,
      );
      expect(isPasswordValid).toBe(true);

      // Clear details
      await prismaService.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should throw BadRequestException if the token is invalid or expired', async () => {
      const reset_token = 'invalid-token';

      await expect(
        authService.resetPassword(
          {
            reset_token,
            new_password: 'newPassword123',
          },
          request,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the user does not exist', async () => {
      const reset_token = 'mock-reset-token';
      const new_password = 'newPassword123';

      // Arrange: Directly call the method that will interact with the real database
      // We simulate that the token is valid but the user does not exist
      const tokenPayload = {
        sub: 'nonexistent-user-id', // The ID that doesn't exist in the user repository
        email: 'nonexistent@example.com',
      };

      // Assuming jwtService.verify will decode the token and return the payload (replace with your actual decoding logic)
      jest.spyOn(jwtService, 'verify').mockReturnValue(tokenPayload);

      await expect(
        authService.resetPassword({ reset_token, new_password }, request),
      ).rejects.toThrow(new BadRequestException('User not found.'));
    });
  });

  describe('Get profile', () => {
    const mockUser = {
      id: uuidv4(),
      name: faker.person.firstName(),
      email: 'johndoe@example.com',
      phone: '+123456789',
      password_hash: '123456',
      is_email_verified: true,
      is_phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        name: 'Admin',
        role_id: 'admin',
        role_group: { id: uuidv4(), name: 'Business Admin' },
      },
    };

    beforeAll(async () => {
      // Insert mock user into the test database
      await testDatabase.roleGroup.create({
        data: {
          id: mockUser.role.role_group.id,
          name: mockUser.role.role_group.name,
        },
      });

      const role = await testDatabase.role.create({
        data: {
          name: mockUser.role.name,
          role_id: mockUser.role.role_id,
          role_group_id: mockUser.role.role_group.id,
        },
      });

      const user = await testDatabase.user.create({
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          password_hash: await bcrypt.hash(mockUser.password_hash, 10),
          is_email_verified: mockUser.is_email_verified,
          is_phone_verified: mockUser.is_phone_verified,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
          role_identity: role.id,
        },
      });
    });

    afterAll(async () => {
      // Clean up test database
      await testDatabase.user.deleteMany({
        where: { id: mockUser.id },
      });
      await testDatabase.role.deleteMany({
        where: { role_id: mockUser.role.role_id },
      });
      await testDatabase.roleGroup.delete({
        where: { id: mockUser.role.role_group.id },
      });
    });

    it('should return the user profile successfully', async () => {
      const result = await authService.getProfile({ sub: mockUser.id } as any);

      expect(result.statusCode).toEqual(HttpStatus.OK);
      // toEqual({
      //   statusCode: HttpStatus.OK,
      //   data: {
      //     ...mockUser,
      //     created_at: expect.any(Date),
      //     updated_at: expect.any(Date),
      //   },
      // });
    });

    it('should return null if the user does not exist', async () => {
      const result = await authService.getProfile({
        sub: 'non-existent-id',
      } as any);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: null,
      });
    });
  });

  describe('Update name', () => {
    const mockUser = {
      id: uuidv4(),
      name: faker.person.firstName(),
      email: 'johndoe@example.com',
      phone: '+123456789',
      password_hash: '123456',
      is_email_verified: true,
      is_phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        name: 'Admin',
        role_id: 'admin',
        role_group: { id: uuidv4(), name: 'Business Admin' },
      },
    };

    const updateNameDto = { new_name: 'John Updated' };

    beforeAll(async () => {
      // Insert mock user into the test database
      await testDatabase.user.create({
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          password_hash: await bcrypt.hash(mockUser.password_hash, 10),
          is_email_verified: mockUser.is_email_verified,
          is_phone_verified: mockUser.is_phone_verified,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
          role: {
            create: {
              name: mockUser.role.name,
              role_id: mockUser.role.role_id,
              role_group: {
                create: {
                  id: mockUser.role.role_group.id,
                  name: mockUser.role.role_group.name,
                },
              },
            },
          },
        },
      });
    });

    afterAll(async () => {
      // Clean up test database
      await testDatabase.user.deleteMany({
        where: { id: mockUser.id },
      });
      await testDatabase.role.deleteMany({
        where: { role_id: mockUser.role.role_id },
      });
      await testDatabase.roleGroup.delete({
        where: { id: mockUser.role.role_group.id },
      });
    });

    it('should update the user name successfully', async () => {
      const result = await authService.updateName(
        { sub: mockUser.id } as any,
        updateNameDto,
      );

      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('Name updated successfully.');

      // Fetch the updated user from the database to verify the change
      const updatedUser = await testDatabase.user.findUnique({
        where: { id: mockUser.id },
      });

      expect(updatedUser.name).toBe(updateNameDto.new_name);
    });

    it('should throw an error if the user does not exist', async () => {
      const nonExistentUserId = uuidv4();
      try {
        await authService.updateName(
          { sub: nonExistentUserId } as any,
          updateNameDto,
        );
      } catch (error) {
        expect(error.response.message).toBe('User not found.');
        expect(error.status).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('Request email update otp', () => {
    const mockUser = {
      id: uuidv4(),
      name: faker.person.firstName(),
      email: `olaleyeemmanuel+${uuidv4()}@example.com`,
      phone: '+123456789',
      password_hash: '123456',
      is_email_verified: true,
      is_phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        name: 'Admin',
        role_id: 'admin',
        role_group: { id: uuidv4(), name: 'Business Admin' },
      },
    };

    const emailDto = { email: `olaleyeemmanuel+new-${uuidv4()}@example.com` };

    beforeAll(async () => {
      // Insert mock user into the test database
      await testDatabase.user.create({
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          password_hash: await bcrypt.hash(mockUser.password_hash, 10),
          is_email_verified: mockUser.is_email_verified,
          is_phone_verified: mockUser.is_phone_verified,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
          role: {
            create: {
              name: mockUser.role.name,
              role_id: mockUser.role.role_id,
              role_group: {
                create: {
                  id: mockUser.role.role_group.id,
                  name: mockUser.role.role_group.name,
                },
              },
            },
          },
        },
      });
    });

    afterAll(async () => {
      // Clean up test database
      await testDatabase.user.deleteMany({
        where: { id: mockUser.id },
      });
      await testDatabase.role.deleteMany({
        where: { role_id: mockUser.role.role_id },
      });
      await testDatabase.roleGroup.delete({
        where: { id: mockUser.role.role_group.id },
      });
    });

    it('should send OTP to the new email address successfully', async () => {
      const result = await authService.requestEmailUpdateOtp(
        { sub: mockUser.id, email: mockUser.email, name: mockUser.name } as any,
        emailDto,
      );

      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('OTP sent to the new email address.');

      // Verify OTP is saved in the database
      const otpRecord = await testDatabase.otp.findUnique({
        where: { user_id: mockUser.id },
      });

      expect(otpRecord).toBeTruthy();
      expect(otpRecord.otp).toHaveLength(6); // OTP should be 6 digits
      expect(otpRecord.expires_at.getTime()).toBeGreaterThan(
        new Date().getTime(),
      ); // OTP should not be expired
    });

    it('should throw an error if email is already in use', async () => {
      // Simulate an existing user with the new email address
      await testDatabase.user.create({
        data: {
          id: uuidv4(),
          name: faker.person.firstName(),
          email: emailDto.email,
          phone: '+987654321',
          password_hash: await bcrypt.hash('password', 10),
          is_email_verified: true,
          is_phone_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          role: {
            create: {
              name: 'User test',
              role_id: uuidv4(),
              role_group: {
                create: {
                  id: uuidv4(),
                  name: 'General User',
                },
              },
            },
          },
        },
      });

      try {
        await authService.requestEmailUpdateOtp(
          {
            sub: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
          } as any,
          emailDto,
        );
      } catch (error) {
        expect(error.response.message).toBe('Email address already in use.');
        expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      }

      await testDatabase.user.deleteMany({ where: { email: emailDto.email } });
      await testDatabase.role.deleteMany({ where: { name: 'User test' } });
      await testDatabase.roleGroup.deleteMany({
        where: { name: 'General User' },
      });
    });
  });

  describe('Verify and update email', () => {
    const mockUser = {
      id: uuidv4(),
      name: faker.person.firstName(),
      email: 'johndoe@example.com',
      phone: '+123456789',
      password_hash: '123456',
      is_email_verified: true,
      is_phone_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        name: 'Admin',
        role_id: uuidv4(),
        role_group: { id: uuidv4(), name: 'Business Admin' },
      },
    };

    const newEmail = 'newemail@example.com';
    const otp = '123456'; // Mock OTP for testing

    let otpRecord;

    beforeAll(async () => {
      // Insert mock user into the test database
      await testDatabase.user.create({
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          password_hash: await bcrypt.hash(mockUser.password_hash, 10),
          is_email_verified: mockUser.is_email_verified,
          is_phone_verified: mockUser.is_phone_verified,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
          role: {
            create: {
              name: mockUser.role.name,
              role_id: mockUser.role.role_id,
              role_group: {
                create: {
                  id: mockUser.role.role_group.id,
                  name: mockUser.role.role_group.name,
                },
              },
            },
          },
        },
      });

      // Insert OTP record into the test database
      otpRecord = await testDatabase.otp.create({
        data: {
          user_id: mockUser.id,
          otp,
          expires_at: moment().add(5, 'minutes').toDate(), // OTP expires in 5 minutes
        },
      });
    });

    afterAll(async () => {
      // Clean up test database
      await testDatabase.user.deleteMany({
        where: { id: mockUser.id },
      });
      await testDatabase.role.deleteMany({
        where: { role_id: mockUser.role.role_id },
      });
      await testDatabase.roleGroup.delete({
        where: { id: mockUser.role.role_group.id },
      });
      await testDatabase.otp.deleteMany({
        where: { user_id: mockUser.id },
      });
    });

    it('should update the email successfully if OTP is valid', async () => {
      const result = await authService.verifyAndUpdateEmail(
        { sub: mockUser.id, name: mockUser.name, email: mockUser.email } as any,
        { email: newEmail, otp },
      );

      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('Email updated successfully.');

      // Verify the user's email has been updated
      const updatedUser = await testDatabase.user.findUnique({
        where: { id: mockUser.id },
      });

      expect(updatedUser.email).toBe(newEmail);

      // Verify OTP record has been deleted
      const deletedOtpRecord = await testDatabase.otp.findUnique({
        where: { user_id: mockUser.id },
      });

      expect(deletedOtpRecord).toBeNull();
    });

    it('should throw an error if OTP is invalid or expired', async () => {
      const invalidOtp = '000000';
      try {
        await authService.verifyAndUpdateEmail(
          {
            sub: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
          } as any,
          { email: newEmail, otp: invalidOtp },
        );
      } catch (error) {
        expect(error.response.message).toBe('Invalid or expired OTP.');
        expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should throw an error if OTP has already been used or deleted', async () => {
      await testDatabase.otp.create({
        data: {
          user_id: mockUser.id,
          otp,
          expires_at: moment().add(5, 'minutes').toDate(), // OTP expires in 5 minutes
        },
      });

      // Simulate OTP deletion by manually deleting the record
      await testDatabase.otp.delete({
        where: { user_id: mockUser.id },
      });

      try {
        await authService.verifyAndUpdateEmail(
          {
            sub: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
          } as any,
          {
            email: newEmail,
            otp,
          },
        );
      } catch (error) {
        expect(error.response.message).toBe('Invalid or expired OTP.');
        expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('Save personal info', () => {
    const mockUser = {
      id: uuidv4(),
      name: faker.person.firstName(),
      email: 'johndoe@example.com',
      password_hash: '123456',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockPersonalInfo = {
      address: '123 Main Street',
      bio: 'This is a short bio.',
      date_of_birth: '1990-01-01',
      gender: 'male',
      profile_picture: 'https://example.com/profile-picture.jpg',
    };

    beforeAll(async () => {
      // Insert mock user into the test database
      await testDatabase.user.create({
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          password_hash: await bcrypt.hash(mockUser.password_hash, 10),
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
        },
      });
    });

    afterAll(async () => {
      // Clean up test database
      await testDatabase.profile.deleteMany({
        where: { user_id: mockUser.id },
      });
      await testDatabase.user.deleteMany({
        where: { id: mockUser.id },
      });
    });

    it('should save personal information successfully when no profile exists', async () => {
      const result = await authService.savePersonalInfo(
        { sub: mockUser.id } as any,
        mockPersonalInfo,
      );

      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('Personal information saved successfully.');

      // Verify the personal information has been saved
      const savedProfile = await testDatabase.profile.findUnique({
        where: { user_id: mockUser.id },
      });

      expect(savedProfile).toMatchObject({
        user_id: mockUser.id,
        address: mockPersonalInfo.address,
        bio: mockPersonalInfo.bio,
        date_of_birth: new Date(mockPersonalInfo.date_of_birth),
        gender: mockPersonalInfo.gender,
        profile_picture: mockPersonalInfo.profile_picture,
      });
    });

    it('should update personal information if the profile already exists', async () => {
      const updatedPersonalInfo = {
        address: '456 New Street',
        bio: 'Updated bio.',
        date_of_birth: '1985-05-15',
        gender: 'female',
        profile_picture: 'https://example.com/updated-profile-picture.jpg',
      };

      // Update personal information using the service
      const result = await authService.savePersonalInfo(
        { sub: mockUser.id } as any,
        updatedPersonalInfo,
      );

      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('Personal information saved successfully.');

      // Verify the personal information has been updated
      const updatedProfile = await testDatabase.profile.findUnique({
        where: { user_id: mockUser.id },
      });

      expect(updatedProfile).toMatchObject({
        user_id: mockUser.id,
        address: updatedPersonalInfo.address,
        bio: updatedPersonalInfo.bio,
        date_of_birth: new Date(updatedPersonalInfo.date_of_birth),
        gender: updatedPersonalInfo.gender,
        profile_picture: updatedPersonalInfo.profile_picture,
      });
    });
  });
});

describe('AuthService Integration - Register Customer (Mocked DB)', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let logService: LogService;
  let mailService: MailService;

  const mockRequest = {
    headers: { 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
  } as any;

  const mockRegisterCustomerDto: RegisterCustomerDto | any = {
    name: 'John Doe',
    email: 'johndoe@example.com',
  };

  const mockUser: any = {
    id: uuidv4(),
    name: mockRegisterCustomerDto.name,
    email: mockRegisterCustomerDto.email,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEmailVerification: any = {
    id: uuidv4(),
    user_id: mockUser.id,
    verification_token: uuidv4(),
    expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    is_verified: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockLog = {
    id: uuidv4(),
    user_id: mockUser.id,
    action: Action.CUSTOMER_REGISTRATION,
    entity: 'User',
    entity_id: mockUser.id,
    metadata: `Customer with email ${mockRegisterCustomerDto.email} registered successfully.`,
    ip_address: getIpAddress(mockRequest),
    user_agent: getUserAgent(mockRequest),
    created_at: new Date(),
  };

  const mockVerifyEmailAndSavePasswordDto: VerifyEmailAndSavePasswordDto = {
    token: 'valid-token',
    password: 'NewPassword123!',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn().mockResolvedValue(mockUser), // Mocked create method
              update: jest.fn().mockResolvedValue({
                ...mockUser,
                is_email_verified: true,
                password_hash: await bcrypt.hash(
                  mockVerifyEmailAndSavePasswordDto.password,
                  10,
                ),
              }),
            },
            emailVerification: {
              create: jest.fn().mockResolvedValue(mockEmailVerification),
              findFirst: jest.fn().mockResolvedValue(mockEmailVerification),
              update: jest.fn().mockResolvedValue({
                ...mockEmailVerification,
                is_verified: true,
              }),
            },
            log: {
              create: jest.fn().mockResolvedValue(mockLog),
            },
          },
        },
        {
          provide: LogService,
          useValue: {
            createLog: jest.fn().mockResolvedValue(mockLog),
          },
        },
        {
          provide: MailService,
          useValue: {
            welcomeCustomerEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '1h';
            }),
          },
        },
        {
          provide: RoleService,
          useValue: {
            fetchOne: jest
              .fn()
              .mockResolvedValue({ id: uuidv4(), name: 'USER' }), // Mock RoleService
          },
        },
        {
          provide: RoleGroupService,
          useValue: {}, // Mock RoleGroupService
        },
        JwtService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    mailService = module.get<MailService>(MailService);
  });

  describe('Register customer', () => {
    it('should register a new customer successfully', async () => {
      // Mock the user repository to return null (no existing user)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await authService.registerCustomer(
        mockRegisterCustomerDto,
        mockRequest,
      );

      // Assert
      expect(result.statusCode).toEqual(HttpStatus.CREATED);
      expect(result.message).toContain('Account registered successfully');

      // Verify the user creation was called
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: mockRegisterCustomerDto.name,
          email: mockRegisterCustomerDto.email,
          password_hash: expect.any(String), // Hashed password
        },
      });

      // Verify the email verification creation was called
      expect(prismaService.emailVerification.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          verification_token: expect.any(String),
          expires_at: expect.any(Date),
          is_verified: false,
        },
      });

      // Verify the log creation was called
      expect(logService.createLog).toHaveBeenCalledWith({
        user_id: mockUser.id,
        action: Action.CUSTOMER_REGISTRATION,
        entity: 'User',
        entity_id: mockUser.id,
        metadata: `Customer with email ${mockRegisterCustomerDto.email} registered successfully.`,
        ip_address: getIpAddress(mockRequest),
        user_agent: getUserAgent(mockRequest),
      });

      // Verify the email was sent
      expect(mailService.welcomeCustomerEmail).toHaveBeenCalledWith(
        mockUser,
        expect.any(String), // Verification token
      );
    });

    it('should throw BadRequestException if email is already in use', async () => {
      // Mock the user repository to return an existing user
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.registerCustomer(mockRegisterCustomerDto, mockRequest),
      ).rejects.toThrow(BadRequestException);

      // Verify the user creation was not called
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should handle errors during registration', async () => {
      // Mock the user repository to throw an error
      jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        authService.registerCustomer(mockRegisterCustomerDto, mockRequest),
      ).rejects.toThrow('Database error');
    });
  });

  // describe('Verify email and save password', () => {
  //   it('should verify email and save password successfully', async () => {
  //     // Act
  //     const result = await authService.verifyEmailAndSavePassword(
  //       mockRequest,
  //       mockVerifyEmailAndSavePasswordDto,
  //     );

  //     // Assert
  //     expect(result.statusCode).toEqual(HttpStatus.OK);
  //     expect(result.message).toBe(
  //       'Email verified and password saved successfully.',
  //     );

  //     // Verify the email verification was updated
  //     expect(prismaService.emailVerification.update).toHaveBeenCalledWith({
  //       where: { id: mockEmailVerification.id },
  //       data: { is_verified: true },
  //     });

  //     // Verify the user was updated
  //     expect(prismaService.user.update).toHaveBeenCalledWith({
  //       where: { id: mockEmailVerification.user_id },
  //       data: {
  //         is_email_verified: true,
  //         password_hash: expect.any(String), // Hashed password
  //       },
  //     });
  //   });

  //   it('should throw an error if the token is invalid', async () => {
  //     // Mock the email verification repository to return null (invalid token)
  //     jest
  //       .spyOn(prismaService.emailVerification, 'findFirst')
  //       .mockResolvedValue(null);

  //     // Act & Assert
  //     await expect(
  //       authService.verifyEmailAndSavePassword(
  //         mockRequest,
  //         mockVerifyEmailAndSavePasswordDto,
  //       ),
  //     ).rejects.toThrow('Invalid or non-existent verification token.');
  //   });

  //   it('should throw an error if the token is expired', async () => {
  //     // Mock the email verification repository to return an expired token
  //     const expiredEmailVerification = {
  //       ...mockEmailVerification,
  //       expires_at: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
  //     };
  //     jest
  //       .spyOn(prismaService.emailVerification, 'findFirst')
  //       .mockResolvedValue(expiredEmailVerification);

  //     // Act & Assert
  //     await expect(
  //       authService.verifyEmailAndSavePassword(
  //         mockRequest,
  //         mockVerifyEmailAndSavePasswordDto,
  //       ),
  //     ).rejects.toThrow('Verification token has expired.');
  //   });
  // });

  describe('Verify email and save password', () => {
    it('should verify email and save password successfully', async () => {
      const hashedPassword = await bcrypt.hash(
        mockVerifyEmailAndSavePasswordDto.password,
        10,
      );

      // @ts-ignore
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);

      // Act
      const result = await authService.verifyEmailAndSavePassword(
        mockRequest,
        mockVerifyEmailAndSavePasswordDto,
      );

      // Assert
      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe(
        'Email verified and password saved successfully.',
      );

      // Verify the email verification was updated
      expect(prismaService.emailVerification.update).toHaveBeenCalledWith({
        where: {
          verification_token: mockVerifyEmailAndSavePasswordDto.token,
          deleted_at: null,
        }, // Corrected where clause
        data: { is_verified: true },
      });

      // Verify the user was updated
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockEmailVerification.user_id, deleted_at: null },
        data: {
          is_email_verified: true,
          password_hash: hashedPassword, // Hashed password
        },
      });
    });

    it('should throw an error if the token is invalid', async () => {
      // Mock the email verification repository to return null (invalid token)
      jest
        .spyOn(prismaService.emailVerification, 'findFirst')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.verifyEmailAndSavePassword(
          mockRequest,
          mockVerifyEmailAndSavePasswordDto,
        ),
      ).rejects.toThrow('Invalid or non-existent verification token.');
    });

    it('should throw an error if the token is expired', async () => {
      // Mock the email verification repository to return an expired token
      const expiredEmailVerification = {
        ...mockEmailVerification,
        expires_at: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
      };
      jest
        .spyOn(prismaService.emailVerification, 'findFirst')
        .mockResolvedValue(expiredEmailVerification);

      // Act & Assert
      await expect(
        authService.verifyEmailAndSavePassword(
          mockRequest,
          mockVerifyEmailAndSavePasswordDto,
        ),
      ).rejects.toThrow('Verification token has expired.');
    });
  });

  describe('Get user', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        subscriptions: [{ id: 'sub-456', is_active: true }],
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      const result = await authService.getUser(prismaService.user, 'user-123');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { subscriptions: { where: { is_active: true } } },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        authService.getUser(prismaService.user, 'non-existent-id'),
      ).rejects.toThrow(
        new NotFoundException("Account with 'non-existent-id' not found."),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: { subscriptions: { where: { is_active: true } } },
      });
    });
  });
});
