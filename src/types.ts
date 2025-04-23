
export type HttpMethod = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";

export { MailBucket } from './index'

export interface IRequestOptions {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: string | object;
    params?: Record<string, string | number>;
}

export interface IApiResponse<T> {
    success: boolean;
    status?: number;
    message?: string;
    data?: T;
    error?: any;
}

export interface IEmailAccount {
    providerName: string;
    address: string;
    providerData: Record<string, any>;
}

export interface IEmailMessageSummary {
    id: string;
    from: string;
    subject: string;
    intro?: string;
    receivedAt: Date | string;
    seen?: boolean;
}

export interface IEmailMessage extends IEmailMessageSummary {
    bodyHtml?: string;
    bodyText?: string;
    attachments?: IAttachment[];
}

export interface IAttachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
}

export interface IMailTmDomain {
    id: string;
    domain: string;
    isActive: boolean;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IMailTmMessage {
    id: string;
    accountId: string;
    msgid: string;
    from: { address: string; name: string };
    to: { address: string; name: string }[];
    subject: string;
    intro: string;
    seen: boolean;
    isDeleted: boolean;
    hasAttachments: boolean;
    size: number;
    downloadUrl: string;
    createdAt: string;
    updatedAt: string;
    receivedAt: string,
    cc?: any[];
    bcc?: any[];
    html?: string[];
    text?: string;
    attachments?: IMailTmAttachment[];
}

export interface IMailTmAttachment {
    id: string;
    filename: string;
    contentType: string;
    disposition: string;
    transferEncoding: string;
    related: boolean;
    size: number;
    downloadUrl: string;
}

export interface IMailTmToken {
    token: string;
    id: string;
}

export interface IMailTmAccount {
    id: string;
    address: string;
    quota: number;
    used: number;
    isDisabled: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IEmailnatorCreateResponse {
    email: string[];
}

export interface IEmailnatorMessageData {
    messageID: string;
    from: string;
    subject: string;
    time: string;
}

export interface IEmailnatorMessageListResponse {
    messageData: IEmailnatorMessageData[];
}

export interface IEmailnatorMessageDetailResponse {
    messageID: string;
    from: string;
    subject: string;
    time: string;
    content: string;
}