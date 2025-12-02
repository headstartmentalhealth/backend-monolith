import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Action,
  EmailVerification,
  Otp,
  Prisma,
  Profile,
  Subscription,
  User,
  Role as DBRole,
  BusinessInformation,
  BusinessContact,
  Payment,
  PaymentStatus,
  PurchaseType,
  MemberStatus,
  JoinedVia,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
  LoginDto,
  RegisterCustomerDto,
  RegisterUserDto,
  RequestPasswordResetDto,
  ResendEmailDto,
  ResetPasswordDto,
  ResolveAccountDto,
  SavePersonalInfoDto,
  TokenDto,
  UpdateNameDto,
  UpdatePasswordDto,
  VerifyEmailAndSavePasswordDto,
  VerifyEmailDto,
  VerifyOtpDto,
} from './auth.dto';
import {
  generateOtp,
  getIpAddress,
  getUserAgent,
  onlyBusinessLogin,
  onlyOwnerLogin,
  onlyUserLogin,
  TransactionError,
} from '../../generic/generic.utils';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
} from '../../generic/generic.payload';
import { AuthDataPayload, LoginPayload } from './auth.payload';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '../../rbac/rbac.service';
import { BUSINESS, Role } from '../../generic/generic.data';
import { EmailDto } from '../../generic/generic.dto';
import * as moment from 'moment';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import {
  OnboardActionType,
  SigninOption,
  SigninOptionProvider,
  SSODto,
} from './sso.dto';
import { GoogleSSOService } from './providers/sso/google.provider';
import { CartService } from '@/cart/cart.service';

@Injectable()
export class AuthService {
  private readonly model = 'User';

  private readonly userRepository: PrismaBaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserWhereInput,
    Prisma.UserUpsertArgs
  >;
  private readonly emailVerificationRepository: PrismaBaseRepository<
    EmailVerification,
    Prisma.EmailVerificationCreateInput,
    Prisma.EmailVerificationUpdateInput,
    Prisma.EmailVerificationWhereUniqueInput,
    Prisma.EmailVerificationWhereInput,
    Prisma.EmailVerificationUpsertArgs
  >;
  private rateLimiter: RateLimiterMemory;
  private readonly otpRepository: PrismaBaseRepository<
    Otp,
    Prisma.OtpCreateInput,
    Prisma.OtpUpdateInput,
    Prisma.OtpWhereUniqueInput,
    Prisma.OtpWhereInput,
    Prisma.OtpUpsertArgs
  >;
  private readonly profileRepository: PrismaBaseRepository<
    Profile,
    Prisma.ProfileCreateInput,
    Prisma.ProfileUpdateInput,
    Prisma.ProfileWhereUniqueInput,
    Prisma.ProfileWhereInput,
    Prisma.ProfileUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService, // Inject the LogService
    private readonly mailService: MailService, //  Inject the MailService
    private readonly configService: ConfigService, //  Inject the MailService
    private readonly jwtService: JwtService, //  Inject the JwtService
    private readonly roleService: RoleService,
    private readonly cartService: CartService,
    private readonly logger: Logger, // Inject the Logger
    private readonly paystackService: PaystackService,

    private readonly googleSSOService: GoogleSSOService,
  ) {
    this.userRepository = new PrismaBaseRepository<
      User,
      Prisma.UserCreateInput,
      Prisma.UserUpdateInput,
      Prisma.UserWhereUniqueInput,
      Prisma.UserWhereInput,
      Prisma.UserUpsertArgs
    >('user', prisma);
    this.emailVerificationRepository = new PrismaBaseRepository<
      EmailVerification,
      Prisma.EmailVerificationCreateInput,
      Prisma.EmailVerificationUpdateInput,
      Prisma.EmailVerificationWhereUniqueInput,
      Prisma.EmailVerificationWhereInput,
      Prisma.EmailVerificationUpsertArgs
    >('emailVerification', prisma);

    // Initialize rate limiter: maximum of 5 attempts in 10 minutes
    this.rateLimiter = new RateLimiterMemory({
      points: 5, // Maximum 5 failed login attempts
      duration: 600, // Per 10 minutes
    });

    this.otpRepository = new PrismaBaseRepository<
      Otp,
      Prisma.OtpCreateInput,
      Prisma.OtpUpdateInput,
      Prisma.OtpWhereUniqueInput,
      Prisma.OtpWhereInput,
      Prisma.OtpUpsertArgs
    >('otp', prisma);
    this.profileRepository = new PrismaBaseRepository<
      Profile,
      Prisma.ProfileCreateInput,
      Prisma.ProfileUpdateInput,
      Prisma.ProfileWhereUniqueInput,
      Prisma.ProfileWhereInput,
      Prisma.ProfileUpsertArgs
    >('profile', prisma);
  }

  /**
   * Register user (Initiation)
   * @param registerUserDto
   * @param request
   * @returns
   */
  async register(
    registerUserDto: RegisterUserDto,
    request: Request,
  ): Promise<
    GenericPayloadAlias<{
      is_first_signup: boolean;
      user_id: string;
      email: string;
    }>
  > {
    const {
      name,
      email,
      phone,
      country,
      country_dial_code,
      password,
      allowOtp,
      role,
    } = registerUserDto;

    /** Step 1: Validate Role **/
    const allowedRoles = [Role.BUSINESS_SUPER_ADMIN, Role.USER];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Forbidden resource: Only ${allowedRoles.join(', ')} accounts can be registered.`,
      );
    }

    /** Step 2: Check for Existing User **/
    const include: Prisma.UserInclude = { role: true };
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      include,
    });

    const isFirstSignup = !existingUser;

    if (existingUser) {
      if (existingUser.is_email_verified) {
        if (existingUser.role.role_id !== role) {
          throw new ConflictException(
            'This email address has already been registered under a different account type.',
          );
        }
        throw new ConflictException('Email address is already in use.');
      }
    }

    /** Step 3: Hash Password **/
    const hashedPassword = await bcrypt.hash(password, 10);

    /** Step 4: Retrieve Role **/
    const role_identity = await this.roleService.fetchOne(role);

    /** Step 5: Create or Update User **/
    // Prisma `upsert` cannot accept multiple unique conditions.
    // We'll emulate it manually for clarity.
    let user: User & { role: DBRole };
    if (existingUser) {
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          password_hash: hashedPassword,
          role_identity: role_identity.id,
          is_first_signup: isFirstSignup,
        },
        include,
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role_identity: role_identity.id,
          is_first_signup: true,
        },
        include,
      });
    }

    /** Step 6: Create Profile **/
    await this.profileRepository.create({
      user: { connect: { id: user.id } },
      country_code: country,
      country_dial_code,
    });

    /** Step 7: Generate Verification Data **/
    const verificationToken = allowOtp ? generateOtp() : uuidv4();
    const expiresAt = moment()
      .add(allowOtp ? 5 : 60, 'minutes')
      .toDate();

    await this.emailVerificationRepository.upsert({
      where: { user_id: user.id },
      create: {
        user: { connect: { id: user.id } },
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
      },
      update: {
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
      },
    });

    /** Step 8: Log Action **/
    await this.logService.createLog({
      user_id: user.id,
      action: Action.CREATE,
      entity: 'User',
      entity_id: user.id,
      metadata: `User[${role}] with email ${email} registered successfully.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    /** Step 9: Send Verification Email **/
    await this.mailService.emailVerification(user, {
      token: verificationToken,
      allowOtp,
    });

    /** Step 10: Return Response **/
    return {
      statusCode: HttpStatus.CREATED,
      message: allowOtp
        ? 'Success! Please check your email to verify your account.'
        : 'Success! Please check your email for verification.',
      data: {
        is_first_signup: user.is_first_signup ?? isFirstSignup,
        user_id: user.id,
        email: user.email,
      },
    };
  }

  /**
   * Generate authentication token and login payload
   * @param user
   * @param request
   * @returns LoginPayload
   */
  private async generateAuthTokenAndPayload(
    user: User & { role: { role_id: Role } },
    request: Request,
  ): Promise<LoginPayload> {
    // Generate Access Token
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role.role_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY'),
    });

    // Log the Login Action
    await this.logService.createLog({
      user_id: user.id,
      action: Action.LOGIN,
      entity: 'User',
      entity_id: user.id,
      metadata: `User[${user.role.role_id}] with email ${user.email} logged in successfully after email verification.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    return {
      statusCode: 200,
      message: 'Email verified and login successful.',
      accessToken,
      data: {
        role: user.role.role_id as Role,
      },
    };
  }

  /**
   * Reusable logic to verify email
   * @param verifyEmailDto
   * @param omitUpdate
   * @param request
   * @param generateAuth
   * @returns
   */
  private async verifyEmailLogic(
    verifyEmailDto: VerifyEmailDto,
    omitUpdate?: boolean,
    request?: Request,
    generateAuth?: boolean,
  ): Promise<EmailVerification | GenericPayload | LoginPayload> {
    const { token, email } = verifyEmailDto;

    const includes: Prisma.EmailVerificationInclude = {
      user: {
        include: { role: true },
      },
    };

    // 1. Validate Token
    const emailVerification: EmailVerification & {
      user: User & { role: { role_id: Role } };
    } = await this.emailVerificationRepository.findOne(
      {
        verification_token: token,
        ...(email && {
          user: {
            email,
          },
        }),
      },
      includes,
    );

    if (!emailVerification) {
      throw new BadRequestException(
        'Invalid or non-existent verification code.',
      );
    }

    // 2. Check if Token is Already Used
    if (emailVerification.is_verified) {
      return emailVerification;
    }

    // 3. Check if Token is Expired
    if (moment(emailVerification.expires_at).isBefore(moment())) {
      throw new BadRequestException('Verification code has expired.');
    }

    // 4. Mark Email as Verified
    await this.emailVerificationRepository.update(
      { verification_token: token, ...(email && { user: { email } }) },
      { is_verified: true },
    );

    // 5. Update User's Status - This should be omitted if omitUpdate is true i.e, !true = false
    if (!omitUpdate) {
      await this.userRepository.update(
        { id: emailVerification.user_id },
        {
          is_email_verified: true,
          is_first_signup: false, // Set to false when email is verified (first signup completed)
        }, // Adjust based on your User model fields
      );

      // 6. Invoke the verified email notification
      await this.mailService.verifiedEmail(emailVerification.user);

      // 7. Generate authentication token if this is first-time verification and generateAuth is true
      if (generateAuth && emailVerification.user.is_first_signup && request) {
        return await this.generateAuthTokenAndPayload(
          emailVerification.user,
          request,
        );
      }
    }

    return emailVerification;
  }

  /**
   * Handles the logic of verifying an email token, updating the user, and optionally generating auth token
   * @param dto - Contains token and/or email
   * @param options - Flags and context for handling logic variations
   * @returns EmailVerification | LoginPayload | GenericPayload
   */
  private async handleEmailVerification(
    dto: VerifyEmailDto,
    options: {
      omitUserUpdate?: boolean;
      request?: Request;
      generateAuth?: boolean;
    } = {},
  ): Promise<
    | EmailVerification
    | GenericPayload
    | GenericPayloadAlias<EmailVerification>
    | LoginPayload
  > {
    const { token, email } = dto;
    const { omitUserUpdate = false, request, generateAuth = false } = options;

    const includeRelations: Prisma.EmailVerificationInclude = {
      user: { include: { role: true } },
    };

    // 1. Fetch email verification record
    const emailVerification = await this.emailVerificationRepository.findOne(
      {
        verification_token: token,
        ...(email && { user: { email } }),
      },
      includeRelations,
    );

    if (!emailVerification) {
      throw new BadRequestException(
        'Invalid or non-existent verification code.',
      );
    }

    // 2. Already verified
    if (emailVerification.is_verified) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email is already verified.',
      };
    }

    // 3. Expired token
    const isExpired = moment(emailVerification.expires_at).isBefore(moment());
    if (isExpired) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Verification code has expired.',
        data: {
          expires_at: emailVerification.expires_at,
          is_verified: emailVerification.is_verified,
          created_at: emailVerification.created_at,
          expired: true,
          email: emailVerification.user.email,
        },
      });
    }

    // 4. Mark email as verified
    await this.emailVerificationRepository.update(
      {
        verification_token: token,
        ...(email && { user: { email } }),
      },
      { is_verified: true },
    );

    // 5. Update user (if allowed)
    if (!omitUserUpdate) {
      await this.userRepository.update(
        { id: emailVerification.user_id },
        {
          is_email_verified: true,
          is_first_signup: false,
        },
      );

      // 6. Send notification
      await this.mailService.verifiedEmail(emailVerification.user);

      // 7. Generate auth if required
      if (generateAuth && emailVerification.user.is_first_signup && request) {
        return await this.generateAuthTokenAndPayload(
          emailVerification.user,
          request,
        );
      }
    }

    return emailVerification;
  }

  /**
   * Verify user email based on the verification token.
   * @param verifyEmailDto
   * @param request
   * @returns
   */
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    request?: Request,
  ): Promise<GenericPayload | LoginPayload> {
    const response = await this.verifyEmailLogic(
      verifyEmailDto,
      false, // Don't omit update
      request,
      true, // Generate auth for first-time verification
    );

    // If response is LoginPayload (first-time verification), return it directly
    if ('accessToken' in response) {
      return response as LoginPayload;
    }

    // If response has statusCode/message, return them; otherwise, return default
    if ('statusCode' in response && 'message' in response) {
      return {
        statusCode: response.statusCode || HttpStatus.OK,
        message: response.message || 'Email successfully verified.',
      };
    }
    // Otherwise, it's a raw EmailVerification object
    return {
      statusCode: HttpStatus.OK,
      message: 'Email successfully verified.',
    };
  }

  /**
   * Resend email verification
   * @param resendEmailDto
   * @param request
   * @returns
   */
  async resendEmailVerification(
    resendEmailDto: ResendEmailDto,
    request: Request,
  ): Promise<GenericPayload> {
    const { email, allowOtp } = resendEmailDto;

    // 1. Check if User Exists
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User with this email does not exist.');
    }

    // 2. Check if Email is Already Verified
    const emailVerification = await this.prisma.emailVerification.findUnique({
      where: { user_id: user.id },
    });

    if (emailVerification?.is_verified) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Email is already verified.',
      };
    }

    // 3. Check if Existing Token is Expired or Missing
    if (
      !emailVerification ||
      moment(emailVerification.expires_at).isBefore(moment())
    ) {
      // Generate New Token
      let newToken = uuidv4();
      let newExpiresAt = moment().add(1, 'hour').toDate();

      if (allowOtp) {
        newToken = generateOtp();
        newExpiresAt = moment().add(5, 'minutes').toDate();
      }

      if (emailVerification) {
        // Update Existing Token
        await this.prisma.emailVerification.update({
          where: { user_id: user.id },
          data: {
            verification_token: newToken,
            expires_at: newExpiresAt,
            is_verified: false,
          },
        });
      } else {
        // Create New Token
        await this.prisma.emailVerification.create({
          data: {
            user_id: user.id,
            verification_token: newToken,
            expires_at: newExpiresAt,
            is_verified: false,
          },
        });
      }

      // Log Token Regeneration
      await this.logService.createLog({
        user_id: user.id,
        action: Action.RESEND_VERIFICATION,
        entity: 'EmailVerification',
        entity_id: user.id,
        metadata: `New email verification token generated for user with email ${email}.`,
        ip_address: getIpAddress(request),
        user_agent: getUserAgent(request),
      });

      // Send Verification Email
      await this.mailService.emailVerification(user, {
        token: newToken,
        allowOtp,
      });

      return {
        statusCode: HttpStatus.OK,
        message:
          'A new verification email has been sent. Please check your inbox.',
      };
    }

    // 4. Token is Still Valid - Resend Without Generating a New One
    await this.mailService.resendEmailVerification(
      user,
      emailVerification.verification_token,
      allowOtp,
    );

    return {
      statusCode: HttpStatus.OK,
      message:
        'Verification email resent successfully. Please check your inbox.',
    };
  }

  /**
   * Request OTP for Login (Owners' only)
   * @param loginDto
   */
  async requestOtp(loginDto: LoginDto): Promise<GenericPayload> {
    const { email, password } = loginDto;

    // 1. Rate Limiting
    // try {
    //   await this.rateLimiter.consume(email);
    // } catch {
    //   throw new BadRequestException(
    //     'Too many login attempts. Please try again later.',
    //   );
    // }

    const includes: Prisma.UserInclude = { role: true };

    // 2. Validate User Credentials
    const user = await this.userRepository.findOne(
      {
        email,
      },
      includes,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Restrict login to only platform owners
    onlyOwnerLogin(user.role.role_id as Role);

    // 3. Generate OTP
    const otp = generateOtp(); // Generate 6-digit OTP
    const expiresAt = moment().add(5, 'minutes').toDate(); // OTP valid for 5 minutes

    // Save OTP to Database
    await this.otpRepository.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        otp,
        expires_at: expiresAt,
      },
      update: {
        otp, // Update the OTP if the record exists
        expires_at: expiresAt, // Update the expiration date
      },
    });

    // 4. Send OTP via Email
    await this.mailService.loginRequest(user, otp);

    return {
      statusCode: HttpStatus.OK,
      message: 'OTP sent to your email. Please verify it to log in.',
    };
  }

  /**
   * Verify OTP and Login (Owners' only)
   * @param verifyOtpDto
   * @returns LoginPayload
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    request: Request,
  ): Promise<LoginPayload> {
    const { email, otp } = verifyOtpDto;

    const includes: Prisma.OtpInclude = { user: { include: { role: true } } };

    // 1. Validate OTP
    const otpRecord: Prisma.OtpWhereUniqueInput =
      await this.otpRepository.findOne(
        {
          user: { email },
          otp,
        } as Prisma.OtpWhereUniqueInput,
        includes,
      );

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP.');
    }

    // Restrict login to only platform owners
    onlyOwnerLogin(otpRecord.user.role.role_id as Role);

    if (moment(otpRecord.expires_at as string).isBefore(moment())) {
      throw new BadRequestException('OTP has expired.');
    }

    // 2. Generate Access Token
    const payload = {
      sub: otpRecord.user.id,
      name: otpRecord.user.name,
      email: otpRecord.user.email,
      role: otpRecord.user.role.role_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY'),
    });

    // 4. Log the Login Action
    await this.logService.createLog({
      user_id: otpRecord.user.id as string,
      action: Action.LOGIN, // Assuming "LOGIN" is defined in your Action enum
      entity: 'User',
      entity_id: otpRecord.user.id as string,
      metadata: `User[${otpRecord.user.role.role_id}] with email ${otpRecord.user.email} logged in successfully.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    // 3. Delete OTP after successful login
    await this.otpRepository.forceDelete({ id: otpRecord.id });

    return {
      statusCode: 200,
      message: 'Login successful.',
      accessToken,
      data: {
        role: otpRecord.user.role.role_id as Role,
      },
    };
  }

  /**
   * Request OTP for Login (Users' only)
   * @param loginDto
   */
  async requestUserOtp(loginDto: LoginDto): Promise<GenericPayload> {
    const { email, password } = loginDto;

    // 1. Rate Limiting
    try {
      await this.rateLimiter.consume(email);
    } catch {
      throw new BadRequestException(
        'Too many login attempts. Please try again later.',
      );
    }

    const includes: Prisma.UserInclude = { role: true };

    // 2. Validate User Credentials
    const user = await this.userRepository.findOne(
      {
        email,
      },
      includes,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.signin_option !== SigninOption.INTERNAL) {
      throw new UnauthorizedException(
        `This account was registered with ${user.signin_option.toLowerCase()}. Please sign in using ${user.signin_option.toLowerCase()}.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Restrict login to only users (business owners, their associates and customers)
    // onlyBusinessLogin(user.role.role_id as Role);

    // 3. Generate OTP
    const otp = generateOtp(); // Generate 6-digit OTP
    const expiresAt = moment().add(5, 'minutes').toDate(); // OTP valid for 5 minutes

    // Save OTP to Database
    await this.otpRepository.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        otp,
        expires_at: expiresAt,
      },
      update: {
        otp, // Update the OTP if the record exists
        expires_at: expiresAt, // Update the expiration date
      },
    });

    // 4. Send OTP via Email
    await this.mailService.loginRequest(user, otp);

    return {
      statusCode: HttpStatus.OK,
      message: 'OTP sent to your email. Please verify it to log in.',
    };
  }

  /**
   * Verify OTP and Login (Users' only)
   * @param verifyOtpDto
   * @returns LoginPayload
   */
  async verifyUserOtp(
    verifyOtpDto: VerifyOtpDto,
    request: Request,
  ): Promise<LoginPayload> {
    const { email, otp } = verifyOtpDto;

    const includes: Prisma.OtpInclude = { user: { include: { role: true } } };

    // 1. Validate OTP
    const otpRecord: Prisma.OtpWhereUniqueInput =
      await this.otpRepository.findOne(
        {
          user: { email },
          otp,
        } as Prisma.OtpWhereUniqueInput,
        includes,
      );

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP.');
    }

    // Restrict login to only users (business owners, their associates and customers)
    // onlyBusinessLogin(otpRecord.user.role.role_id as Role);

    if (moment(otpRecord.expires_at as string).isBefore(moment())) {
      throw new BadRequestException('OTP has expired.');
    }

    // 2. Generate Access Token
    const payload = {
      sub: otpRecord.user.id,
      name: otpRecord.user.name,
      email: otpRecord.user.email,
      role: otpRecord.user.role.role_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRY'),
    });

    // 4. Log the Login Action
    await this.logService.createLog({
      user_id: otpRecord.user.id as string,
      action: Action.LOGIN, // Assuming "LOGIN" is defined in your Action enum
      entity: 'User',
      entity_id: otpRecord.user.id as string,
      metadata: `User[${otpRecord.user.role.role_id}] with email ${otpRecord.user.email} logged in successfully.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    // 3. Delete OTP after successful login
    await this.otpRepository.forceDelete({ id: otpRecord.id });

    return {
      statusCode: 200,
      message: 'Login successful.',
      accessToken,
      data: {
        role: otpRecord.user.role.role_id as Role,
      },
    };
  }

  // private async generateToken(request: Request, payload: AuthDataPayload) {
  //   const accessToken = this.jwtService.sign(payload, {
  //     secret: this.configService.get<string>('JWT_SECRET'),
  //     expiresIn: this.configService.get<string>('JWT_EXPIRY'),
  //   });

  //   // 4. Log the Login Action
  //   await this.logService.createLog({
  //     user_id: payload.sub as string,
  //     action: Action.LOGIN, // Assuming "LOGIN" is defined in your Action enum
  //     entity: 'User',
  //     entity_id: payload.sub as string,
  //     metadata: `User[${payload.role}] with email ${payload.email} logged in successfully.`,
  //     ip_address: getIpAddress(request),
  //     user_agent: getUserAgent(request),
  //   });
  // }

  /**
   * Initiate single sign-on
   * @param request
   * @param ssoDto
   * @returns
   */
  async sso(request: Request, ssoDto: SSODto) {
    const { provider, token, platform, role: roleId, action_type } = ssoDto;

    if (provider !== SigninOptionProvider.GOOGLE) {
      throw new BadRequestException('Unsupported SSO provider');
    }

    // Step 1: Verify Token from Google SSO
    const ssoPayload = await this.googleSSOService.verify(token, platform);

    // Mock data
    // const ssoPayload = {
    //   iss: 'https://accounts.google.com',
    //   azp: '1234987819200.apps.googleusercontent.com',
    //   aud: '1234987819200.apps.googleusercontent.com',
    //   sub: '110169484474386276334',
    //   email: 'testuser@gmail.com',
    //   email_verified: true,
    //   verified_email: true,
    //   nbf: 1622545200,
    //   name: 'Test User',
    //   picture: 'https://lh3.googleusercontent.com/a-/AOh14GhXqY2J5qZ2...',
    //   given_name: 'Test',
    //   family_name: 'User',
    //   iat: 1622548800,
    //   exp: 1622552400,
    //   jti: 'abc123def456ghi789jkl012mno345pqr678stu',
    // };

    const includes: Prisma.UserInclude = {
      role: true,
      profile: true,
    };

    // Step 2: Fetch User from DB
    let user = await this.userRepository.findOne(
      { email: ssoPayload.email },
      includes,
    );

    if (user && action_type === OnboardActionType.SIGNUP) {
      throw new BadRequestException(
        'You have already registered your account. Please sign in to continue.',
      );
    }

    let role = null;
    if (roleId) {
      role = await this.prisma.role.findFirst({
        where: { role_id: roleId },
      });

      if (!role) throw new NotFoundException('Role not found');
    }

    if (action_type === OnboardActionType.SIGNIN) {
      if (user) {
        if (user.signin_option !== provider) {
          throw new BadRequestException(
            `Account was not registered with ${provider}`,
          );
        }

        if (!user.is_email_verified) {
          throw new UnauthorizedException(
            'Your account has not been verified.',
          );
        }

        if (user.is_suspended) {
          throw new UnauthorizedException('Your account has been suspended.');
        }
      } else {
        throw new NotFoundException(`You have to register your account first.`);
      }
    } else if (action_type === OnboardActionType.SIGNUP) {
      // Create new user
      const newUserPayload = {
        name: ssoPayload.given_name,
        email: ssoPayload.email,
        is_email_verified:
          ssoPayload.email_verified || ssoPayload.verified_email,
        signin_option: provider,
        ...(role && { role_identity: role?.id }),
      };

      user = await this.prisma.user.create({
        data: newUserPayload,
        include: includes,
      });
    } else {
      throw new BadRequestException(
        'Invalid signup action type. Please use SIGNIN or SIGNUP.',
      );
    }

    // Step 6: Log Login Action
    await this.logService.createLog({
      user_id: user.id,
      action: Action.LOGIN,
      entity: 'User',
      entity_id: user.id,
      metadata: `User[${user.role?.role_id}] with email ${user.email} logged in via ${provider} successfully.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    // Step 7: Post-login Hooks
    await this.saveOnLogin(user);

    // Step 8: Final Response with token and user info
    return this.generateToken(user);
  }

  async saveOnLogin(user: User) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        updated_at: new Date(),
        // You can also update last_login, login_count, etc.
      },
    });

    // Optional: Emit login event or analytics
    // this.analyticsService.trackLogin(user.id);
  }

  async generateToken(user: User & { role: DBRole } & { profile: Profile }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.role_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRY'),
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      accessToken: accessToken,
      data: {
        role: user.role?.role_id,
      },
    };
  }

  /**
   * Request Password Reset
   * @param email
   * @returns GenericPayload
   */
  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<GenericPayload> {
    const { email } = requestPasswordResetDto;

    // 1. Rate Limiting
    try {
      await this.rateLimiter.consume(email);
    } catch {
      throw new BadRequestException(
        'Too many attempts. Please try again later.',
      );
    }

    const includes: Prisma.UserInclude = { role: true };

    // 1b. Find User by Email
    const user = await this.userRepository.findOne({ email }, includes);
    if (!user) {
      throw new BadRequestException('Email address does not exist.');
    }

    // 2. Generate Password Reset Token
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
        expiresIn: '15m', // Reset token valid for 15 minutes
      },
    );

    // 3. Send Reset Email
    await this.mailService.requestPasswordReset(user, resetToken);

    return {
      statusCode: HttpStatus.OK,
      message:
        'Password reset email sent successfully. Please check your mailbox',
    };
  }

  /**
   * Verify Password Reset Token
   * @param token - JWT password reset token
   * @returns Decoded payload if valid
   */
  async verifyPasswordResetToken(
    tokenDto: TokenDto,
  ): Promise<GenericPayloadAlias<{ userId: string; email: string }>> {
    try {
      const { token } = tokenDto;

      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
      });

      // Optionally, confirm user still exists
      const user = await this.userRepository.findOne(
        { id: decoded.sub, email: decoded.email },
        { role: true },
      );

      if (!user) {
        throw new BadRequestException('Invalid or expired token.');
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Token is valid.',
        data: { userId: user.id, email: user.email },
      };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  /**
   * Reset Password
   * @param resetPasswordDto
   * @returns GenericPayload
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    request: Request,
  ): Promise<GenericPayload> {
    const { reset_token, new_password } = resetPasswordDto;

    // 1. Verify Reset Token
    let payload: any;
    try {
      payload = this.jwtService.verify(reset_token, {
        secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // 2. Find User by ID
    const user = await this.userRepository.findOne({ id: payload.sub });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // 3. Hash and Update Password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await this.userRepository.update(
      { id: user.id },
      { password_hash: hashedPassword },
    );

    // 4. Log the Login Action
    await this.logService.createLog({
      user_id: user.id as string,
      action: Action.RESET_PASSWORD,
      entity: 'User',
      entity_id: user.id as string,
      metadata: `User with email ${user.email} has reset password successfully.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    // 5. Send password updated email
    await this.mailService.updatedPassword(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully.',
    };
  }

  /**
   * Get profile with accessible businesses and their active subscriptions
   * @param data
   * @returns GenericDataPayload
   */
  async getProfile(
    data: AuthPayload['user'],
  ): Promise<GenericDataPayload<User & { accessible_businesses?: any[] }>> {
    const { sub } = data;

    const select: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      is_email_verified: true,
      is_phone_verified: true,
      created_at: true,
      updated_at: true,
      role: {
        select: {
          name: true,
          role_id: true,
        },
      },
      profile: {
        select: {
          bio: true,
          address: true,
          profile_picture: true,
          gender: true,
          date_of_birth: true,
        },
      },
    };
    const user = await this.userRepository.findOne(
      { id: sub },
      undefined,
      select,
    );

    // Get businesses that the user has access to
    const accessibleBusinesses = await this.getAccessibleBusinesses(sub);

    return {
      statusCode: HttpStatus.OK,
      data: {
        ...user,
        accessible_businesses: accessibleBusinesses,
      },
    };
  }

  /**
   * Get businesses that the user has access to along with their active subscriptions
   * @param userId
   * @returns Array of businesses with active subscriptions
   */
  private async getAccessibleBusinesses(userId: string): Promise<any[]> {
    const now = new Date();

    // Get businesses where user has made successful payments for any product
    const businessesWithPayments = await this.prisma.payment.findMany({
      where: {
        user_id: userId,
        payment_status: PaymentStatus.SUCCESS,
        purchase_type: {
          in: [
            PurchaseType.COURSE,
            PurchaseType.TICKET,
            PurchaseType.PRODUCT,
            PurchaseType.SUBSCRIPTION,
          ],
        },
        purchase: {
          path: ['business_id'],
          not: null,
        },
      },
      select: {
        purchase: true,
        purchase_type: true,
        created_at: true,
      },
    });

    // Get businesses where user is a business contact with user role
    const businessesAsContact = await this.prisma.businessContact.findMany({
      where: {
        user_id: userId,
        role: 'user',
        status: MemberStatus.active,
      },
      include: {
        business: {
          select: {
            id: true,
            business_name: true,
            industry: true,
            logo_url: true,
            created_at: true,
          },
        },
      },
    });

    // Get businesses where user has active subscriptions
    const businessesWithSubscriptions = await this.prisma.subscription.findMany(
      {
        where: {
          user_id: userId,
          is_active: true,
          end_date: {
            gte: now,
          },
        },
        include: {
          subscription_plan: {
            select: {
              id: true,
              name: true,
              description: true,
              business: {
                select: {
                  id: true,
                  business_name: true,
                  industry: true,
                  logo_url: true,
                  created_at: true,
                },
              },
            },
          },
        },
      },
    );

    // Combine and deduplicate businesses
    const businessMap = new Map();

    // Add businesses from payments
    businessesWithPayments.forEach((payment) => {
      if (
        payment.purchase &&
        typeof payment.purchase === 'object' &&
        'business_id' in payment.purchase
      ) {
        const purchaseData = payment.purchase as { business_id: string };
        businessMap.set(purchaseData.business_id, {
          business_id: purchaseData.business_id,
          access_type: 'purchase',
          access_date: payment.created_at,
          purchase_type: payment.purchase_type,
        });
      }
    });

    // Add businesses from contacts
    businessesAsContact.forEach((contact) => {
      const businessId = contact.business.id;
      if (!businessMap.has(businessId)) {
        businessMap.set(businessId, {
          business_id: businessId,
          business: contact.business,
          access_type: 'contact',
          access_date: contact.joined_at,
          role: contact.role,
        });
      }
    });

    // Add businesses from subscriptions
    businessesWithSubscriptions.forEach((subscription) => {
      const businessId = subscription.subscription_plan.business.id;
      const existing = businessMap.get(businessId);

      if (existing) {
        // Update existing entry with subscription info
        existing.active_subscription = {
          id: subscription.id,
          plan_name: subscription.plan_name_at_subscription,
          plan_price: subscription.plan_price_at_subscription,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          auto_renew: subscription.auto_renew,
          days_until_expiry: Math.ceil(
            (new Date(subscription.end_date).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          is_expiring_soon:
            Math.ceil(
              (new Date(subscription.end_date).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ) <= 7,
          status: 'active',
          subscription_plan: subscription.subscription_plan,
        };
        existing.access_type = 'subscription';
      } else {
        // Create new entry
        businessMap.set(businessId, {
          business_id: businessId,
          business: subscription.subscription_plan.business,
          access_type: 'subscription',
          access_date: subscription.created_at,
          active_subscription: {
            id: subscription.id,
            plan_name: subscription.plan_name_at_subscription,
            plan_price: subscription.plan_price_at_subscription,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            auto_renew: subscription.auto_renew,
            days_until_expiry: Math.ceil(
              (new Date(subscription.end_date).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
            is_expiring_soon:
              Math.ceil(
                (new Date(subscription.end_date).getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              ) <= 7,
            status: 'active',
            subscription_plan: subscription.subscription_plan,
          },
        });
      }
    });

    // Convert map to array and fetch business details for entries without business info
    const businesses = Array.from(businessMap.values());

    // Fetch business details for entries that don't have them
    for (const business of businesses) {
      if (!business.business) {
        const businessDetails =
          await this.prisma.businessInformation.findUnique({
            where: { id: business.business_id },
            select: {
              id: true,
              business_name: true,
              industry: true,
              logo_url: true,
              created_at: true,
            },
          });
        business.business = businessDetails;
      }
    }

    return businesses;
  }

  /**
   * Update Name
   * @param auth
   * @param updateNameDto
   * @returns GenericPayload
   */
  async updateName(
    auth: AuthPayload['user'],
    updateNameDto: UpdateNameDto,
  ): Promise<GenericPayload> {
    // 1. Check User Existence
    const user = await this.userRepository.findOne({ id: auth.sub });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 2. Update User's Name
    await this.userRepository.update(
      { id: user.id },
      { name: updateNameDto.new_name },
    );

    // 3. Return Success Response
    return { statusCode: HttpStatus.OK, message: 'Name updated successfully.' };
  }

  /**
   * Request OTP
   * @param auth
   * @param emailDto
   * @returns
   */
  async requestEmailUpdateOtp(
    auth: AuthPayload['user'],
    emailDto: EmailDto,
  ): Promise<GenericPayload> {
    const { email } = emailDto;

    // Check if email is already in use
    const existingUser = await this.userRepository.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email address already in use.');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    const expires_at = moment().add(5, 'minutes').toDate(); // OTP valid for 5 minutes

    // Save OTP in the database
    await this.otpRepository.upsert({
      where: { user_id: auth.sub },
      create: {
        user_id: auth.sub,
        otp,
        expires_at,
      },
      update: {
        otp,
        expires_at,
      },
    });

    // Request otp for email update
    await this.mailService.requestEmailUpdate(
      { name: auth.name, email: auth.email } as User,
      otp,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'OTP sent to the new email address.',
    };
  }

  /**
   * Verify and update email
   * @param auth
   * @param verifyOtpDto
   * @returns GenericPayload
   */
  async verifyAndUpdateEmail(
    auth: AuthPayload['user'],
    verifyOtpDto: VerifyOtpDto,
  ): Promise<GenericPayload> {
    const { email, otp } = verifyOtpDto;

    // Validate OTP
    const otpRecord = await this.otpRepository.findOne({
      user_id: auth.sub,
      otp,
      expires_at: { gte: new Date() }, // Ensure OTP is not expired
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    // Update the email in the user record
    await this.userRepository.update({ id: auth.sub }, { email });

    // Delete the OTP record to prevent reuse
    await this.otpRepository.forceDelete({ user_id: auth.sub });

    // Send mail for update email address
    await this.mailService.updatedEmail({
      name: auth.name,
      email: auth.email,
    } as User);

    return {
      statusCode: HttpStatus.OK,
      message: 'Email updated successfully.',
    };
  }

  /**
   * Save personal data
   * @param auth
   * @param savePersonalData
   * @returns GenericPayload
   */
  async savePersonalInfo(
    auth: AuthPayload['user'],
    savePersonalInfoDto: SavePersonalInfoDto,
  ): Promise<GenericPayload> {
    // 1. Upsert Personal Data
    await this.profileRepository.upsert({
      where: { user_id: auth.sub },
      create: {
        user_id: auth.sub,
        address: savePersonalInfoDto.address,
        bio: savePersonalInfoDto.bio,
        date_of_birth: new Date(
          savePersonalInfoDto.date_of_birth,
        ).toISOString(),
        gender: savePersonalInfoDto.gender,
        profile_picture: savePersonalInfoDto.profile_picture,
      },
      update: {
        address: savePersonalInfoDto.address,
        bio: savePersonalInfoDto.bio,
        date_of_birth: new Date(
          savePersonalInfoDto.date_of_birth,
        ).toISOString(),
        gender: savePersonalInfoDto.gender,
        profile_picture: savePersonalInfoDto.profile_picture,
      },
    });

    // 2. Return Success Response
    return {
      statusCode: HttpStatus.OK,
      message: 'Personal information saved successfully.',
    };
  }

  /**
   * Register customer
   * @param registerCustomerDto
   * @param request
   * @returns
   */
  async registerCustomer(
    registerCustomerDto: RegisterCustomerDto,
    request: Request,
  ): Promise<
    GenericPayloadAlias<{
      id: string;
      name: string;
      email: string;
      phone: string;
      is_first_signup: boolean;
    }>
  > {
    const { name, email, phone, business_id } = registerCustomerDto;

    // 1. Ensure business exists
    const business = await this.prisma.businessInformation.findFirst({
      where: { OR: [{ id: business_id }, { business_slug: business_id }] },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    const { user, verificationToken, already_registered } =
      await this.prisma.$transaction(async (prisma) => {
        // 2a. Retrieve the user role
        const role_identity = await this.roleService.fetchOneTrx(
          Role.USER,
          prisma,
        );

        // **3. Create User if non-existent**
        const user = await prisma.user.upsert({
          where: { email },
          create: {
            name,
            email,
            phone,
            role_identity: role_identity.id,
            is_first_signup: true, // This is definitely the first signup for customers
          },
          update: {},
          include: { role: true, email_verification: true },
        });

        // 4. Check if business contact already exists for this business and email
        let existingContact = await prisma.businessContact.findFirst({
          where: {
            business_id: business.id,
            email: email,
          },
        });

        if (!existingContact) {
          existingContact = await prisma.businessContact.create({
            data: {
              business_id: business.id,
              user_id: user.id,
              role: Role.USER,
              email: user.email,
              name: user.name,
              joined_via: JoinedVia.PURCHASE,
              status: 'active',
            },
          });
        }

        let already_registered = false;
        // **5. Generate Email Verification Data**
        const verificationToken = uuidv4();
        const expiresAt = moment().add(1, 'hour').toDate(); // Token valid for 1 hour

        if (!user.email_verification) {
          await prisma.emailVerification.create({
            data: {
              user: { connect: { id: user.id } },
              verification_token: verificationToken,
              expires_at: expiresAt,
              is_verified: false,
            },
          });
        } else {
          already_registered = true;
        }

        // 6. Add items to cart
        if (registerCustomerDto?.items) {
          const auth: AuthPayload['user'] = {
            sub: user.id,
            role: user.role.role_id as Role,
            email: user.email,
            name: user.name,
          };
          await this.cartService.addItems(
            request,
            auth,
            { items: registerCustomerDto.items },
            prisma,
          );
        }

        // 7. Log Registration Action
        await this.logService.createWithTrx(
          {
            user_id: user.id,
            action: Action.CUSTOMER_REGISTRATION,
            entity: 'User',
            entity_id: user.id,
            metadata: `Customer with email ${email} registered successfully.`,
            ip_address: getIpAddress(request),
            user_agent: getUserAgent(request),
          },
          prisma.log,
        );

        return { user, verificationToken, already_registered };
      });

    let message = 'Account already registered.';
    let statusCode = HttpStatus.OK;

    if (!already_registered) {
      message =
        'Account registered successfully. Please check your email for verification.';
      statusCode = HttpStatus.CREATED;
      // 7. Send Verification Email
      await this.mailService.welcomeCustomerEmail(user, verificationToken);
    }

    return {
      statusCode,
      message,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.email,
        is_first_signup: user.is_first_signup ?? true,
      },
    };
  }

  /**
   * Verify email and save password
   * @param request
   * @param verifyEmailAndSavePasswordDto
   * @returns
   */
  async verifyEmailAndSavePassword(
    request: Request,
    verifyEmailAndSavePasswordDto: VerifyEmailAndSavePasswordDto,
  ): Promise<GenericPayload> {
    const { token, password } = verifyEmailAndSavePasswordDto;

    const email_verification = (await this.verifyEmailLogic(
      { token },
      true,
      request,
      true,
    )) as EmailVerification;

    // **2. Hash Password**
    const hashed_password = await bcrypt.hash(password, 10);

    await this.userRepository.update(
      { id: email_verification.user_id },
      {
        is_email_verified: true,
        password_hash: hashed_password,
        is_first_signup: false, // Set to false when email is verified and password is saved (first signup completed)
      }, // Adjust based on your User model fields
    );

    // Clear token once password has been set
    await this.emailVerificationRepository.update(
      {
        id: email_verification.id,
      },
      {
        verification_token: null,
        expires_at: null,
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Email verified and password saved successfully.',
    };
  }

  /**
   * Verify email token
   * @param request
   * @param verifyEmailAndSavePasswordDto
   * @returns
   */
  async verifyEmailToken(
    request: Request,
    tokenDto: TokenDto,
  ): Promise<GenericPayloadAlias<EmailVerification>> {
    const { token } = tokenDto;

    const email_verification = (await this.handleEmailVerification(
      { token },
      { omitUserUpdate: false, request, generateAuth: true },
    )) as EmailVerification;

    return {
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully.',
    };
  }

  /**
   * Request New Account email token (For users that came to the platform through an organization purchase)
   * @param request
   * @param emailDto
   * @returns
   */
  async requestNewAccountEmailToken(
    request: Request,
    emailDto: EmailDto,
  ): Promise<GenericPayloadAlias<EmailVerification>> {
    const { email } = emailDto;

    // 1. Rate Limiting
    try {
      await this.rateLimiter.consume(email);
    } catch {
      throw new BadRequestException(
        'Too many attempts. Please try again later.',
      );
    }

    const includes: Prisma.UserInclude = { role: true };

    // 2. Find User by Email
    const user = await this.userRepository.findOne({ email }, includes);
    if (!user) {
      throw new BadRequestException('Email address does not exist.');
    }

    // 3. Ensure account does not already have a password
    if (user.password_hash) {
      throw new ForbiddenException('Account already has a password.');
    }

    // 4. Generate new token + expiry
    const verificationToken = uuidv4();
    const expiresAt = moment().add(24, 'hour').toDate();

    // 5. Upsert EmailVerification (replace if exists)
    await this.prisma.emailVerification.upsert({
      where: { user_id: user.id },
      update: {
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        verification_token: verificationToken,
        expires_at: expiresAt,
        is_verified: false,
      },
    });

    // 6. Send Password Creation Email
    await this.mailService.requestPasswordCreationLink(user, verificationToken);

    return {
      statusCode: HttpStatus.OK,
      message:
        'Password creation email sent successfully. Please check your mailbox',
    };
  }

  /**
   * Get user details - (invoked in the SubscriptionService)
   * @param userRepo
   * @param user_id
   * @returns
   */
  async getUser(
    userRepo: Prisma.UserDelegate<DefaultArgs, Prisma.PrismaClientOptions>,
    user_id: string,
  ) {
    const user = await userRepo.findUnique({
      where: { id: user_id },
      include: { subscriptions: { where: { is_active: true } } },
    });

    // throw error if user is non-existent
    if (!user) {
      throw new NotFoundException(`Account with '${user_id}' not found.`);
    }

    return user;
  }

  /**
   * Get user details by email - (invoked in the SubscriptionService)
   * @param userRepo
   * @param user_id
   * @returns
   */
  async getUserByEmail(
    userRepo: Prisma.UserDelegate<DefaultArgs, Prisma.PrismaClientOptions>,
    email: string,
  ) {
    const user = await userRepo.findUnique({
      where: { email },
      include: { subscriptions: { where: { is_active: true } } },
    });

    // throw error if user is non-existent
    if (!user) {
      throw new NotFoundException(`Account with '${email}' not found.`);
    }

    return user;
  }

  /**
   * Save profile data
   * @param auth
   * @param saveProfileData
   * @returns GenericPayload
   */
  async saveProfileInfo(
    auth: AuthPayload['user'],
    savePersonalInfoDto: SavePersonalInfoDto,
  ): Promise<GenericPayloadAlias<User & { profile: Profile }>> {
    const { phone, address, bio, date_of_birth, gender, profile_picture } =
      savePersonalInfoDto;
    // 1. Update User Data
    const user = await this.userRepository.update(
      { id: auth.sub },
      {
        name: savePersonalInfoDto.name,
        phone,
      },
    );

    // 2. Update Profile Data
    const profile = await this.profileRepository.upsert({
      where: { user_id: auth.sub },
      create: {
        user_id: auth.sub,
        address,
        bio,
        ...(date_of_birth && {
          date_of_birth: new Date(date_of_birth).toISOString(),
        }),
        gender,
        profile_picture,
      },
      update: {
        address,
        bio,
        ...(date_of_birth && {
          date_of_birth: new Date(date_of_birth).toISOString(),
        }),
        gender,
        profile_picture,
      },
    });

    const account = await this.userRepository.findOne(
      { id: auth.sub },
      { role: true },
    );

    // 3. Return Success Response
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile information saved successfully.',
      data: Object.assign({}, user, { profile }, { role: account.role }),
    };
  }

  /**
   * Update account password
   * @param request
   * @param updatePasswordDto
   * @returns
   */
  async updatePassword(
    request: AuthPayload & Request,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { current_password, new_password, confirm_password } =
      updatePasswordDto;

    try {
      const { user } = await this.prisma.$transaction(async (prisma) => {
        // 1. Validate new password matches confirmation
        if (new_password !== confirm_password) {
          throw new UnprocessableEntityException(
            'New password and confirmation do not match',
          );
        }

        // 2. Fetch the current user with password hash
        const user = await prisma.user.findUnique({
          where: { id: auth.sub },
        });

        if (!user) {
          throw new NotFoundException('Account not found');
        }

        // 3. Verify current password matches
        const is_password_valid = await bcrypt.compare(
          current_password,
          user.password_hash,
        );

        if (!is_password_valid) {
          throw new BadRequestException('Current password is incorrect');
        }

        // 4. Hash and update the new password
        const saltRounds = 10;
        const hashed_password = await bcrypt.hash(new_password, saltRounds);

        await prisma.user.update({
          where: { id: auth.sub },
          data: { password_hash: hashed_password },
        });

        // Create log
        await this.logService.createWithTrx(
          {
            user_id: auth.sub,
            action: Action.RESET_PASSWORD,
            entity: this.model,
            entity_id: user.id,
            metadata: `User with ${user.id} (${auth.role}) has updated their password successfully.`,
            ip_address: getIpAddress(request),
            user_agent: getUserAgent(request),
          },
          prisma.log,
        );

        return { user };
      });

      // Send email notification about password update
      await this.mailService.accountPasswordUpdateEmail(user, {
        role: auth.role,
      });

      // Return success response
      return {
        statusCode: HttpStatus.OK,
        message: 'Password updated successfully',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  async fetchBanks() {
    const banks = await this.paystackService.getBanks();

    return {
      statusCode: HttpStatus.OK,
      data: banks,
    };
  }

  async resolveAccountNumber(resolveAccountDto: ResolveAccountDto) {
    const { account_number, bank_code } = resolveAccountDto;

    const bank = await this.paystackService.resolveAccountNumber(
      account_number,
      bank_code,
    );

    return {
      statusCode: HttpStatus.OK,
      data: bank,
    };
  }

  /**
   * Get user's first signup status
   * @param userId
   * @returns
   */
  async getFirstSignupStatus(
    userId: string,
  ): Promise<{ is_first_signup: boolean }> {
    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      is_first_signup: user.is_first_signup,
    };
  }

  /**
   * Soft-delete the current user's account
   * @param auth
   * @returns GenericPayload
   */
  async deleteAccount(auth: AuthPayload['user']): Promise<GenericPayload> {
    // 1. Check User Existence
    const user = await this.userRepository.findOne({ id: auth.sub });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 2. Soft-delete the user (set deleted_at)
    await this.userRepository.update(
      { id: user.id },
      { deleted_at: new Date() },
    );

    // 3. Log the deletion action
    await this.logService.createLog({
      user_id: user.id,
      action: Action.DELETE,
      entity: 'User',
      entity_id: user.id,
      metadata: `User with email ${user.email} soft-deleted their account.`,
    });

    // 4. Return Success Response
    return {
      statusCode: HttpStatus.OK,
      message: 'Account deleted successfully.',
    };
  }
}
