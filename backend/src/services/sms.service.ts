
import { Twilio } from 'twilio';
import logger from '@/utils/logger';
import { config } from '@/config';

export class SmsService {
    private client: Twilio;
    private fromNumber: string;

    constructor() {
        const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = config.sms;

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            logger.warn('Twilio credentials not configured. SMS service will not work.');
            // Initialize with dummy data to prevent crash, but logs warn
            this.client = new Twilio('AC' + '0'.repeat(32), '0'.repeat(32));
            this.fromNumber = '';
        } else {
            this.client = new Twilio(twilioAccountSid, twilioAuthToken);
            this.fromNumber = twilioPhoneNumber;
        }
    }

    async sendSms(to: string, body: string): Promise<boolean> {
        if (!this.fromNumber) {
            logger.warn('SMS mock: Twilio not configured. Message:', { to, body });
            return true; // Pretend success
        }

        try {
            await this.client.messages.create({
                body,
                from: this.fromNumber,
                to,
            });
            logger.info(`SMS sent to ${to}`);
            return true;
        } catch (error) {
            logger.error('Failed to send SMS:', error);
            return false;
        }
    }
}

export const smsService = new SmsService();
