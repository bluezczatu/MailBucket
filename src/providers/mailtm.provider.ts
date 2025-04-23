
import type * as type from '../types';
import { IEmailProvider, makeRequest } from './base.provider';

function makeHash(size: number): string {
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    const select = () => charset.charAt(Math.floor(Math.random() * charset.length));
    return Array.from({ length: size }, select).join("");
}

interface MailTmConfig {
    baseUrl: string;
    providerName: 'mail.tm' | 'mail.gw';
}

export class MailTmProvider implements IEmailProvider {
    readonly providerName: 'mail.tm' | 'mail.gw';
    private readonly baseUrl: string;

    constructor(config: MailTmConfig) {
        this.baseUrl = config.baseUrl;
        this.providerName = config.providerName;
    }

    private async getDomains(): Promise<type.IApiResponse<type.IMailTmDomain[]>> {
        return makeRequest<type.IMailTmDomain[]>(`${this.baseUrl}/domains`, { method: 'GET' });
    }

    private async registerAccount(address: string, password: string): Promise<type.IApiResponse<type.IMailTmAccount>> {
         return makeRequest<type.IMailTmAccount>(`${this.baseUrl}/accounts`, {
             method: 'POST',
             body: { address, password }
         }, 201);
    }

     private async getToken(address: string, password: string): Promise<type.IApiResponse<type.IMailTmToken>> {
         return makeRequest<type.IMailTmToken>(`${this.baseUrl}/token`, {
             method: 'POST',
             body: { address, password }
         });
    }

    async createAccount(): Promise<type.IApiResponse<type.IEmailAccount>> {
        const domainRes = await this.getDomains();
        if (!domainRes.success || !domainRes.data || domainRes.data.length === 0) {
            return { success: false, message: `Failed to get domains from ${this.providerName}: ${domainRes.message}`, error: domainRes.error };
        }
        const domain = domainRes.data[Math.floor(Math.random() * domainRes.data.length)].domain;

        const username = `${makeHash(10)}@${domain}`;
        const password = makeHash(12);

        const registerRes = await this.registerAccount(username, password);
        if (!registerRes.success || !registerRes.data) {
             return { success: false, message: `Failed to register account with ${this.providerName}: ${registerRes.message}`, error: registerRes.error };
        }

        const tokenRes = await this.getToken(username, password);
         if (!tokenRes.success || !tokenRes.data) {
             return { success: false, message: `Failed to login/get token from ${this.providerName} after registration: ${tokenRes.message}`, error: tokenRes.error };
        }

        return {
            success: true,
            data: {
                providerName: this.providerName,
                address: username,
                providerData: {
                    token: tokenRes.data.token,
                    accountId: registerRes.data.id,
                    password: password
                }
            }
        };
    }

    async getMessages(account: type.IEmailAccount): Promise<type.IApiResponse<type.IEmailMessageSummary[]>> {
        if (account.providerName !== this.providerName) {
            return { success: false, message: `Invalid account type for ${this.providerName}` };
        }
        const { token } = account.providerData;
        if (!token) {
             return { success: false, message: 'Missing token in account providerData.' };
        }

        const response = await makeRequest<type.IMailTmMessage[]>(`${this.baseUrl}/messages`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.success || !response.data) {
            return response as any;
        }

        const messages: type.IEmailMessageSummary[] = response.data.map(msg => ({
            id: msg.id,
            from: `${msg.from.name} <${msg.from.address}>`,
            subject: msg.subject,
            intro: msg.intro,
            receivedAt: new Date(msg.createdAt),
            seen: msg.seen
        }));

        return { success: true, data: messages };
    }

    async getMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<type.IEmailMessage>> {
        if (account.providerName !== this.providerName) {
            return { success: false, message: `Invalid account type for ${this.providerName}` };
        }
        const { token } = account.providerData;
         if (!token || !messageId) {
             return { success: false, message: 'Missing token or messageId.' };
        }

        const response = await makeRequest<type.IMailTmMessage>(`${this.baseUrl}/messages/${messageId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

         if (!response.success || !response.data) {
            return response as any;
        }

        const msg = response.data;

        const message: type.IEmailMessage = {
            id: msg.id,
            from: `${msg.from.name} <${msg.from.address}>`,
            subject: msg.subject,
            intro: msg.intro,
            receivedAt: new Date(msg.createdAt),
            seen: msg.seen,
            bodyHtml: msg.html?.join(''),
            bodyText: msg.text,
            attachments: msg.attachments?.map(att => ({
                id: att.id,
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
            }))
        };

        return { success: true, data: message };
    }

    async deleteMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<void>> {
         if (account.providerName !== this.providerName) {
            return { success: false, message: `Invalid account type for ${this.providerName}` };
        }
        const { token } = account.providerData;
         if (!token || !messageId) {
             return { success: false, message: 'Missing token or messageId.' };
        }

        return makeRequest<void>(`${this.baseUrl}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }, 204);
    }

    async deleteAccount(account: type.IEmailAccount): Promise<type.IApiResponse<void>> {
         if (account.providerName !== this.providerName) {
            return { success: false, message: `Invalid account type for ${this.providerName}` };
        }
        const { token, accountId } = account.providerData;
         if (!token || !accountId) {
             return { success: false, message: 'Missing token or accountId in account providerData.' };
        }

        return makeRequest<void>(`${this.baseUrl}/accounts/${accountId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }, 204);
    }
}
