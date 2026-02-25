import * as nodemailer from 'nodemailer';
export declare class KeplarsTransport implements nodemailer.Transport {
    private apiKey;
    name: string;
    version: string;
    constructor(apiKey: string);
    send(mail: any, callback: (err: Error | null, info: nodemailer.SentMessageInfo) => void): void;
    verify(callback?: (err: Error | null, success: true) => void): Promise<true>;
    sendMail(mail: any): Promise<nodemailer.SentMessageInfo>;
}
