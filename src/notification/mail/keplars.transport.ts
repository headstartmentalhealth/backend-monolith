
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class KeplarsTransport implements nodemailer.Transport {
  name = 'Keplars';
  version = '1.0.0';

  constructor(private apiKey: string) {}

  send(
    mail: any,
    callback: (err: Error | null, info: nodemailer.SentMessageInfo) => void,
  ): void {
    this.sendMail(mail)
      .then((info) => callback(null, info))
      .catch((err) => callback(err, null));
  }

  verify(callback?: (err: Error | null, success: true) => void): Promise<true> {
    const promise = Promise.resolve(true as const);
    if (callback) {
      promise
        .then(() => callback(null, true))
        .catch((err) => callback(err, null));
    }
    return promise;
  }

  async sendMail(mail: any): Promise<nodemailer.SentMessageInfo> {
    const url = 'https://api.keplars.com/api/v1/send-email/instant';

    try {
      const { to, from, subject, html, text } = mail.data;
      
      // Extract raw address
      // Normalize `to` to an array
      const rawTo = Array.isArray(to) ? to : [to];

      const toArray = rawTo
        .map((recipient) => {
          if (typeof recipient === 'string') {
            return recipient;
          }
          if (typeof recipient === 'object' && recipient !== null && 'address' in recipient) {
            return recipient.address;
          }
          return null;
        })
        .filter((email) => email && typeof email === 'string');

      if (toArray.length === 0) {
        console.warn(`No valid recipients found for email. Subject: "${subject}", From: "${JSON.stringify(from)}"`);
        return {
          messageId: 'no-recipients',
          envelope: { from: JSON.stringify(from), to: [] },
          accepted: [],
          rejected: [],
          pending: [],
          response: 'No valid recipients',
        };
      }

      // Handle 'from' object
      const fromObj = typeof from === 'string' 
        ? { email: from } 
        : ( from as { name: string; address: string } ) 
            ? { name: (from as any).name || (from as any).address, email: (from as any).address }
            : from;

      // Handle 'replyTo' object
      let replyToObj = undefined;
      const { replyTo } = mail.data;
      
      if (replyTo) {
          replyToObj = typeof replyTo === 'string'
            ? { name: 'TechCrush', email: replyTo }
            : ( replyTo as { name: string; address: string } )
                ? { name: (replyTo as any).name || 'TechCrush', email: (replyTo as any).address }
                : replyTo;
      }

      const payload = {
        to: toArray,
        from: fromObj,
        from_name: 'TechCrush',
        reply_to: replyToObj,
        subject,
        body: html, // Mapped from 'html' to 'body' as per user test
        text
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
      });

      console.log(response.data);

      return {
        messageId: response.data.id || 'unknown',
        envelope: { from: JSON.stringify(from), to: toArray },
        accepted: toArray,
        rejected: [],
        pending: [],
        response: JSON.stringify(response.data),
      };
    } catch (error) {
      console.error('Keplars API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
