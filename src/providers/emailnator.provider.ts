import type * as type from '../types';
import { IEmailProvider, makeRequest } from './base.provider';
import axios from 'axios';
import * as cheerio from 'cheerio';

const EMAILNATOR_BASE_URL = 'https://www.emailnator.com';
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0"; // Example

export class EmailnatorProvider implements IEmailProvider {
    readonly providerName = 'emailnator';

    private async getSessionTokens(): Promise<type.IApiResponse<{ cookie: string; xsrfToken: string }>> {
        try {
            const res = await axios.get(EMAILNATOR_BASE_URL, {
                headers: { 'User-Agent': USER_AGENT }
            });

            const cookiesHeader = res.headers['set-cookie'];
            if (!cookiesHeader || cookiesHeader.length === 0) {
                return { success: false, message: 'Could not retrieve cookies from Emailnator.' };
            }

            const cookies = decodeURIComponent(cookiesHeader.join('; '));
            const xsrfToken = cookies.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const sessionToken = cookies.match(/gmailnator_session=([^;]+)/)?.[1];

            if (!xsrfToken || !sessionToken) {
                console.error("Failed to parse tokens from cookies:", cookies);
                return { success: false, message: 'Could not parse XSRF or session token from cookies.' };
            }

            const cookieDone = `XSRF-TOKEN=${xsrfToken}; gmailnator_session=${sessionToken}`;
            return { success: true, data: { cookie: cookieDone, xsrfToken } };
        } catch (error: any) {
            console.error("Error getting Emailnator session:", error);
            const message = error.response?.data?.message || error.message || 'Failed to initialize Emailnator session';
            return { success: false, message, error };
        }
    }

    async createAccount(): Promise<type.IApiResponse<type.IEmailAccount>> {
        const tokenResponse = await this.getSessionTokens();
        if (!tokenResponse.success || !tokenResponse.data) {
            return tokenResponse as any;
        }
        const { cookie, xsrfToken } = tokenResponse.data;

        try {
            const resCreate = await axios.post<type.IEmailnatorCreateResponse>(
                `${EMAILNATOR_BASE_URL}/generate-email`,
                { "email": ["domain", "plusGmail", "dotGmail", "googleMail"] },
                {
                    headers: {
                        "User-Agent": USER_AGENT,
                        "Accept": "application/json, text/plain, */*",
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "Cookie": cookie,
                        "X-XSRF-TOKEN": xsrfToken,
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-origin",
                    }
                }
            );

            if (resCreate.status !== 200 || !resCreate.data?.email || resCreate.data.email.length === 0) {
                 return { success: false, status: resCreate.status, message: 'Failed to generate email address from Emailnator.' };
            }

            const emailAddress = resCreate.data.email[0];

            return {
                success: true,
                data: {
                    providerName: this.providerName,
                    address: emailAddress,
                    providerData: {
                        cookie: cookie,
                        xsrfToken: xsrfToken
                    }
                }
            };
        } catch (error: any) {
            console.error("Error creating Emailnator account:", error);
             const message = error.response?.data?.message || error.message || 'Failed to create Emailnator account';
            return { success: false, status: error.response?.status, message, error };
        }
    }

    async getMessages(account: type.IEmailAccount): Promise<type.IApiResponse<type.IEmailMessageSummary[]>> {
         if (account.providerName !== this.providerName) {
            return { success: false, message: 'Invalid account type for EmailnatorProvider' };
        }
        const { cookie, xsrfToken } = account.providerData;
        const emailAddress = account.address;

        if (!cookie || !xsrfToken || !emailAddress) {
             return { success: false, message: 'Missing required provider data (cookie, token, or email) in account object.' };
        }

        try {
            const response = await axios.post<type.IEmailnatorMessageListResponse>(
                `${EMAILNATOR_BASE_URL}/message-list`,
                { "email": emailAddress },
                {
                     headers: {
                        "User-Agent": USER_AGENT,
                        "Accept": "application/json, text/plain, */*",
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "Cookie": cookie,
                        "X-XSRF-TOKEN": xsrfToken,
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-origin",
                    }
                }
            );

            if (response.status !== 200 || !response.data?.messageData) {
                 return { success: false, status: response.status, message: 'Failed to retrieve messages from Emailnator.' };
            }

            const messages: type.IEmailMessageSummary[] = response.data.messageData.map(msg => ({
                id: msg.messageID,
                from: msg.from,
                subject: msg.subject,
                receivedAt: msg.time,
            }));

            let blackList = {
                "ADSVPN": true
            }

            for (let i = 0; i < messages.length; i++) {
                //@ts-ignore
                if (blackList[messages[i].id]){
                    messages.splice(i, 1);
                }
            }

            return { success: true, data: messages };

        } catch (error: any) {
             console.error(`Error getting Emailnator messages for ${emailAddress}:`, error);
             const message = error.response?.data?.message || error.message || 'Failed to get Emailnator messages';
            return { success: false, status: error.response?.status, message, error };
        }
    }

    async getMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<type.IEmailMessage>> {
        if (account.providerName !== this.providerName) {
            return { success: false, message: 'Invalid account type for EmailnatorProvider' };
        }
        const { cookie, xsrfToken } = account.providerData;
        const emailAddress = account.address;

        if (!cookie || !xsrfToken || !emailAddress || !messageId) {
             return { success: false, message: 'Missing required provider data (cookie, token, email, or messageId) in account object.' };
        }

        try {
             const response = await axios.post<type.IEmailnatorMessageDetailResponse>(
                `${EMAILNATOR_BASE_URL}/message-list`,
                {
                    "email": emailAddress,
                    "messageID": messageId
                },
                {
                     headers: {
                        "User-Agent": USER_AGENT,
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "Cookie": cookie,
                        "X-XSRF-TOKEN": xsrfToken,
                         "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-origin",
                        "Referer": `${EMAILNATOR_BASE_URL}/inbox/${emailAddress}/${messageId}`
                    }
                }
            );

            const contentType = response.headers['content-type'];
            let messageData: Partial<type.IEmailMessage> = {};

            if (contentType?.includes('html')) {

                const $ = cheerio.load(response.data);
                messageData = {
                    id: messageId,
                    bodyHtml: response.data as any,
                    bodyText: $('[dir=ltr]').text(),
                    from: $('div').text().split('From: ')[1].split('Subject: ')[0],
                    subject: $('div').text().split('Subject: ')[1].split('Time: ')[0],
                    receivedAt: $('div').text().split('Time: ')[0]
                };
            } else if (contentType?.includes('json') && typeof response.data === 'object') {
                 const detail = response.data as type.IEmailnatorMessageDetailResponse;
                 messageData = {
                    id: detail.messageID || messageId,
                    from: detail.from,
                    subject: detail.subject,
                    receivedAt: detail.time,
                    bodyHtml: detail.content,
                 };
            } else {
                  return { success: false, status: response.status, message: `Unexpected content type received from Emailnator: ${contentType}` };
            }


            if (response.status !== 200) {
                return { success: false, status: response.status, message: 'Failed to retrieve message details from Emailnator.' };
            }

            return { success: true, data: messageData as type.IEmailMessage };

        } catch (error: any) {
             console.error(`Error getting Emailnator message ${messageId} for ${emailAddress}:`, error);
             const message = error.response?.data?.message || error.message || 'Failed to get Emailnator message details';
             return { success: false, status: error.response?.status, message, error };
        }
    }
}