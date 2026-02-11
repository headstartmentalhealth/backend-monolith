import {
  Controller,
  Post,
  Body,
  Query,
  Req,
  Get,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { AuthPayload, GenericPayload } from '@/generic/generic.payload';
import {
  AcceptInviteDto,
  FilterContactsDto,
  FilterInvitesDto,
  FilterUserDto,
  InviteContactDto,
  NewsletterSubscriptionDto,
  SendMessageDto,
} from './contact.dto';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { Public } from '../auth/decorators/auth.decorator';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { ContactDto, TokenDto } from './contact.payload';

@Controller('v1/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Invite contact
   * @param req
   * @param inviteContactDto
   * @returns
   */
  @Post('invite')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  async inviteMember(
    @Req() req: AuthPayload & Request,
    @Body() inviteContactDto: InviteContactDto,
  ): Promise<GenericPayload> {
    return this.contactService.inviteMember(req, inviteContactDto);
  }

  /**
   * Accept invite
   * @param request
   * @param acceptInviteDto
   * @returns
   */
  @Post('accept-invite')
  @Public()
  async acceptInvite(
    @Req() request: Request,
    @Body() acceptInviteDto: AcceptInviteDto,
  ): Promise<GenericPayload> {
    return this.contactService.acceptInvite(request, acceptInviteDto);
  }

  /**
   * Get all/filtered invites
   * @param request
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  @Get('invites/:business_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  async getInvites(
    @Req() request: AuthPayload,
    @Param() param: { business_id: string },
    @Query() filterInvitesDto: FilterInvitesDto & QueryDto,
  ) {
    return this.contactService.getInvites(request, param, filterInvitesDto);
  }

  /**
   * Get invite details by token
   * @param param
   * @returns
   */
  @Get('invite/:token')
  @HttpCode(HttpStatus.OK)
  @Public()
  async getInviteByToken(@Param() param: TokenDto) {
    return this.contactService.getInviteByToken(param);
  }

  /**
   * Re-invite member
   * @param request
   * @returns
   */
  @Post('reinvite-member/:invite_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  async reinviteMember(
    @Req() request: AuthPayload & Request,
    @Param() param: ContactDto,
  ): Promise<GenericPayload> {
    return this.contactService.reinviteMember(request, param);
  }

  /**
   * Remove member
   * @param request
   * @returns
   */
  @Post('remove-member/:invite_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  async removeMember(
    @Req() request: AuthPayload & Request,
    @Param() param: ContactDto,
  ): Promise<GenericPayload> {
    return this.contactService.removeMember(request, param);
  }

  /**
   * Deactivate member
   * @param request
   * @returns
   */
  @Post('deactivate-member/:invite_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  async deactivateMember(
    @Req() request: AuthPayload & Request,
    @Param() param: ContactDto,
  ): Promise<GenericPayload> {
    return this.contactService.deactivateMember(request, param);
  }

  /**
   * Restore member
   * @param request
   * @returns
   */
  @Post('restore-member/:invite_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.OWNER_SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async restoreMember(
    @Req() request: AuthPayload & Request,
    @Param() param: ContactDto,
  ): Promise<GenericPayload> {
    return this.contactService.restoreMember(request, param);
  }

  /**
   * Get all/filtered invites
   * @param request
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  @Get('fetch/:business_id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async getContacts(
    @Req() request: AuthPayload,
    @Param() param: { business_id: string },
    @Query() filterContactDto: FilterInvitesDto & QueryDto,
  ) {
    return this.contactService.getBusinessContacts(
      request,
      param,
      filterContactDto,
    );
  }

  /**
   * Get all/filtered business customers - admin
   * @param request
   * @param param
   * @param FilterUserDto
   * @returns
   */
  @Get('fetch-customers')
  @Roles(
    Role.OWNER_SUPER_ADMIN,
    Role.OWNER_ADMIN,
    Role.BUSINESS_SUPER_ADMIN,
    Role.BUSINESS_ADMIN,
  )
  async getBusinessCustomers(
    @Req() request: AuthPayload,
    @Query() filterUserDto: FilterUserDto,
  ) {
    return this.contactService.getBusinessCustomers(request, filterUserDto);
  }

  /**
   * Get all/filtered contacts
   * @param request
   * @param param
   * @param FilterUserDto
   * @returns
   */
  @Get('fetch-contacts')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async getBusinessContacts(
    @Req() request: AuthPayload,
    @Query() filterUserDto: FilterContactsDto,
  ) {
    return this.contactService.fetchContacts(request, filterUserDto);
  }

  /**
   * Get all/filtered org contacts
   * @param request
   * @param param
   * @param FilterUserDto
   * @returns
   */
  @Get('fetch-org-contacts')
  @Roles(Role.USER)
  async fetchOrgContacts(
    @Req() request: AuthPayload,
    @Query() filterUserDto: FilterContactsDto,
  ) {
    return this.contactService.fetchOrgContacts(request, filterUserDto);
  }

  /**
   * Get business customer details - admin & business owner
   * @param request
   * @param param
   * @returns
   */
  @Get('fetch-customer/:id')
  @Roles(
    Role.OWNER_SUPER_ADMIN,
    Role.OWNER_ADMIN,
    Role.BUSINESS_SUPER_ADMIN,
    Role.BUSINESS_ADMIN,
  )
  async getBusinessCustomer(
    @Req() request: AuthPayload,
    @Param() param: IdDto,
  ) {
    return this.contactService.getBusinessCustomer(request, param);
  }

  @Post('send-contact-message')
  @Public()
  sendMessage(
    @Req() req: Request,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<GenericPayload> {
    return this.contactService.sendMessage(req, sendMessageDto);
  }

  @Post('subscribe-newsletter')
  @Public()
  subscribeNewsletter(
    @Req() request: Request,
    @Body() newsletterSubscriptionDto: NewsletterSubscriptionDto,
  ): Promise<GenericPayload> {
    return this.contactService.subscribe(request, newsletterSubscriptionDto);
  }
}
