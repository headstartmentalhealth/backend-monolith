import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrevoProvider {
  private readonly brevoApiKey: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    this.fromEmail = this.configService.get<string>('MAIL_FROM');
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, any> = {},
  ) {
    const htmlContent = this.renderTemplate(templateName, templateData);

    const payload = {
      sender: {
        name: 'Do Excess',
        email: this.fromEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent,
    };

    try {
      const response = await axios.post(this.brevoApiUrl, payload, {
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Email sent:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'Error sending email:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private renderTemplate(templateName: string, data: Record<string, any>) {
    const templatePath = join(
      __dirname,
      '../../notification/mail/templates',
      `${templateName}.hbs`,
    );

    const templateFile = readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateFile);
    return template(data);
  }
}
