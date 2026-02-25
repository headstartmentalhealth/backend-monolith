import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  ValidationPipe,
  Get,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
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
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
} from '../../generic/generic.payload';
import { LoginPayload } from './auth.payload';
import { Public } from './decorators/auth.decorator';
import { EmailVerification, Profile, User } from '@prisma/client';
import { EmailDto } from '@/generic/generic.dto';
import { SSODto } from './sso.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user
   * @param registerUserDto DTO containing user registration details
   * @param request The HTTP request object
   * @returns GenericPayloadAlias with registration status, message, and data
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ValidationPipe({ whitelist: true }))
    registerUserDto: RegisterUserDto,
    @Req() request: Request,
  ): Promise<
    GenericPayloadAlias<{
      is_first_signup: boolean;
      user_id: string;
      email: string;
    }>
  > {
    return await this.authService.register(registerUserDto, request);
  }

  /**
   * Resend email verification
   * @param resendEmailDto DTO containing resend email details
   * @param request The HTTP request object
   * @returns GenericPayload with resend email status and message
   */
  @Post('resend-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  async registerEmail(
    @Body(new ValidationPipe({ whitelist: true }))
    resendEmailDto: ResendEmailDto,
    @Req() request: Request,
  ): Promise<GenericPayload> {
    return await this.authService.resendEmailVerification(
      resendEmailDto,
      request,
    );
  }

  /**
   * Verify email
   * @param registerUserDto DTO containing verify email details
   * @returns GenericPayload with verify email status and message
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ValidationPipe({ whitelist: true }))
    verifyEmailDto: VerifyEmailDto,
    @Req() request: Request,
  ): Promise<GenericPayload | LoginPayload> {
    return await this.authService.verifyEmail(verifyEmailDto, request);
  }

  /**
   * Login otp request
   * @param loginDto
   * @returns GenericPayload with login request otp status and message
   */
  @Post('request-otp')
  @Public()
  async requestOtp(
    @Body(new ValidationPipe({ whitelist: true })) loginDto: LoginDto,
  ): Promise<GenericPayload> {
    return this.authService.requestOtp(loginDto);
  }

  /**
   * Verify otp request
   * @param verifyOtpDto
   * @param request
   * @returns GenericPayload with verify login otp status and message
   */
  @Post('verify-otp')
  @Public()
  async verifyOtp(
    @Body(new ValidationPipe({ whitelist: true })) verifyOtpDto: VerifyOtpDto,
    @Req() request: Request,
  ): Promise<LoginPayload> {
    return this.authService.verifyOtp(verifyOtpDto, request);
  }

  /**
   * Direct Sign-in for Mobile/Public access
   * @param loginDto
   * @param request
   * @returns LoginPayload
   */
  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body(new ValidationPipe({ whitelist: true })) loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<LoginPayload> {
    return this.authService.signin(loginDto, request);
  }

  /**
   * Logout user
   * @param req
   * @returns GenericPayload
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthPayload): Promise<GenericPayload> {
    return this.authService.logout(req.user);
  }

  /**
   * Login otp request (users' only)
   * @param loginDto
   * @returns GenericPayload with login request otp status and message
   */
  @Post('request-account-otp')
  @Public()
  async requestUserOtp(
    @Body(new ValidationPipe({ whitelist: true })) loginDto: LoginDto,
  ): Promise<GenericPayload> {
    return this.authService.requestUserOtp(loginDto);
  }

  /**
   * Verify otp request (users' only)
   * @param verifyOtpDto
   * @param request
   * @returns GenericPayload with verify login otp status and message
   */
  @Post('verify-account-otp')
  @Public()
  async verifyUserOtp(
    @Body(new ValidationPipe({ whitelist: true })) verifyOtpDto: VerifyOtpDto,
    @Req() request: Request,
  ): Promise<LoginPayload> {
    return this.authService.verifyUserOtp(verifyOtpDto, request);
  }

  /**
   * Google login sso
   * @param request
   * @param ssoDto
   * @returns
   */
  @Post('sso')
  @Public()
  @HttpCode(HttpStatus.OK)
  sso(@Req() request: Request, @Body() ssoDto: SSODto) {
    return this.authService.sso(request, ssoDto);
  }

  /**
   * Request password reset
   * @param verifyOtpDto
   * @param request
   * @returns GenericPayload with request password reset status and message
   */
  @Post('request-password-reset')
  @Public()
  async requestPasswordRequest(
    @Body(new ValidationPipe({ whitelist: true }))
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<GenericPayload> {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  /**
   * Verify token
   * @param tokenDto
   * @param request
   * @returns GenericPayload with request password reset status and message
   */
  @Post('verify-password-token')
  @HttpCode(HttpStatus.OK)
  @Public()
  async verifyPasswordToken(
    @Body(new ValidationPipe({ whitelist: true }))
    tokenDto: TokenDto,
  ): Promise<GenericPayloadAlias<{ userId: string; email: string }>> {
    return this.authService.verifyPasswordResetToken(tokenDto);
  }

  /**
   * Reset password
   * @param verifyOtpDto
   * @param request
   * @returns GenericPayload with reset password status and message
   */
  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true }))
    resetPasswordDto: ResetPasswordDto,
    @Req() request: Request,
  ): Promise<GenericPayload> {
    return this.authService.resetPassword(resetPasswordDto, request);
  }

  /**
   * View profile
   * @param req
   * @returns GenericDataPayload
   */
  @Get('view-profile')
  async viewProfile(
    @Req() req: AuthPayload,
  ): Promise<GenericDataPayload<User>> {
    return this.authService.getProfile(req.user);
  }

  /**
   * Update name
   * @param req
   * @param updateNameDto
   * @returns GenericPayload
   */
  @Patch('update-name')
  async updateName(
    @Req() req: AuthPayload,
    @Body() updateNameDto: UpdateNameDto,
  ): Promise<GenericPayload> {
    return this.authService.updateName(req.user, updateNameDto);
  }

  /**
   * Request email update
   * @param req
   * @param emailDto
   * @returns GenericPayload
   */
  @Post('update-email-request')
  async requestEmailUpdate(
    @Req() req: AuthPayload,
    @Body() emailDto: EmailDto,
  ): Promise<GenericPayload> {
    return this.authService.requestEmailUpdateOtp(req.user, emailDto);
  }

  /**
   * Verify otp and update email
   * @param req
   * @param verifyOtpDto
   * @returns GenericPayload
   */
  @Patch('update-email')
  async verifyAndUpdateEmail(
    @Req() req: AuthPayload,
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<GenericPayload> {
    return this.authService.verifyAndUpdateEmail(req.user, verifyOtpDto);
  }

  /**
   * Save personal info
   * @param req
   * @param savePersonalInfoDto
   * @returns GenericPayload
   */
  @Post('save-personal-info')
  async savePersonalInfo(
    @Req() req: AuthPayload,
    @Body() savePersonalInfoDto: SavePersonalInfoDto,
  ): Promise<GenericPayload> {
    return this.authService.savePersonalInfo(req.user, savePersonalInfoDto);
  }

  /**
   * Registers a new customer
   * @param registerCustomerDto DTO containing user registration details
   * @param request The HTTP request object
   * @returns GenericPayloadAlias with registration status, message, and data
   */
  @Post('register-customer')
  @Public()
  @HttpCode(HttpStatus.OK)
  async registerCustomer(
    @Body(new ValidationPipe({ whitelist: true }))
    registerCustomerDto: RegisterCustomerDto,
    @Req() request: Request,
  ): Promise<
    GenericPayloadAlias<{
      id: string;
      name: string;
      email: string;
      phone: string;
      is_first_signup: boolean;
    }>
  > {
    return await this.authService.registerCustomer(
      registerCustomerDto,
      request,
    );
  }

  /**
   * Verify email and save password
   * @param registerUserDto DTO containing verify email details
   * @returns GenericPayload with verify email status and message
   */
  @Post('verify-email-save-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmailAndSavePassword(
    @Req() request: Request,
    @Body(new ValidationPipe({ whitelist: true }))
    verifyEmailAndSavePasswordDto: VerifyEmailAndSavePasswordDto,
  ): Promise<GenericPayload> {
    return await this.authService.verifyEmailAndSavePassword(
      request,
      verifyEmailAndSavePasswordDto,
    );
  }

  /**
   * Verify email token
   * @param tokenDto DTO containing verify email token details
   * @returns GenericPayload with verify email token status and message
   */
  @Post('verify-email-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmailToken(
    @Req() request: Request,
    @Body(new ValidationPipe({ whitelist: true }))
    tokenDto: TokenDto,
  ): Promise<GenericPayloadAlias<EmailVerification>> {
    return await this.authService.verifyEmailToken(request, tokenDto);
  }

  /**
   * Request password creation
   * @param emailDto DTO containing password creation details
   * @returns GenericPayload
   */
  @Post('request-password-creation')
  @Public()
  @HttpCode(HttpStatus.OK)
  async requestNewAccountEmailToken(
    @Req() request: Request,
    @Body(new ValidationPipe({ whitelist: true }))
    emailDto: EmailDto,
  ): Promise<GenericPayload> {
    return await this.authService.requestNewAccountEmailToken(
      request,
      emailDto,
    );
  }

  /**
   * Save profile info
   * @param req
   * @param saveProfileInfoDto
   * @returns GenericPayload
   */
  @Post('save-profile-info')
  async saveProfileInfo(
    @Req() req: AuthPayload,
    @Body() savePersonalInfoDto: SavePersonalInfoDto,
  ): Promise<GenericPayloadAlias<User & { profile: Profile }>> {
    return this.authService.saveProfileInfo(req.user, savePersonalInfoDto);
  }

  /**
   * Update account password
   * @param req
   * @param saveProfileInfoDto
   * @returns GenericPayload
   */
  @Post('update-password')
  async updatePassword(
    @Req() req: AuthPayload & Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<GenericPayload> {
    return this.authService.updatePassword(req, updatePasswordDto);
  }

  /**
   * Get user's first signup status
   * @param req
   * @returns
   */
  @Get('first-signup-status')
  async getFirstSignupStatus(
    @Req() req: AuthPayload,
  ): Promise<GenericDataPayload<{ is_first_signup: boolean }>> {
    return {
      statusCode: HttpStatus.OK,
      data: await this.authService.getFirstSignupStatus(req.user.sub),
    };
  }

  @Get('fetch-banks')
  async fetchBanks(
    @Req() req: AuthPayload & Request,
  ): Promise<GenericDataPayload<any>> {
    return this.authService.fetchBanks();
  }

  @Post('resolve-account')
  async resolveAccount(@Body() dto: ResolveAccountDto) {
    return this.authService.resolveAccountNumber(dto);
  }

  /**
   * Delete (soft-delete) the current user's account
   */
  @Delete('delete-account')
  async deleteAccount(@Req() req: AuthPayload): Promise<GenericPayload> {
    return this.authService.deleteAccount(req.user);
  }
}
