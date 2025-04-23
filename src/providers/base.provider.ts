import type * as type from '../types';

export interface IEmailProvider {
    readonly providerName: string;

    createAccount(): Promise<type.IApiResponse<type.IEmailAccount>>;
    getMessages(account: type.IEmailAccount): Promise<type.IApiResponse<type.IEmailMessageSummary[]>>;
    getMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<type.IEmailMessage>>;
    deleteMessage?(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<void>>;
    deleteAccount?(account: type.IEmailAccount): Promise<type.IApiResponse<void>>;
}

export async function makeRequest<T>(
    url: string,
    options: type.IRequestOptions,
    expectedStatus: number = 200 | 201 | 204 | 205
): Promise<type.IApiResponse<T>> {
    try {
        const fetchOptions: RequestInit = {
            method: options.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        };

        if (options.body) {
            fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        } else if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
            //@ts-ignore
            if (!fetchOptions.headers!['Content-Type']) {
                //@ts-ignore
                fetchOptions.headers!['Content-Type'] = 'application/json';
            }
        }

        let requestUrl = url;
        if (options.params) {
            const query = new URLSearchParams(options.params as Record<string, string>).toString();
            if (query) {
                requestUrl += `?${query}`;
            }
        }

        const response = await fetch(requestUrl, fetchOptions);

        let responseData: any;
        const contentType = response.headers.get('content-type');

        if (response.status === 204) {
             responseData = null;
        } else if (contentType?.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            const message = responseData?.message || responseData?.detail || responseData?.error || (typeof responseData === 'string' ? responseData : response.statusText);
            return {
                success: false,
                status: response.status,
                message: `API Error: ${message || 'Unknown error'}`,
                error: responseData,
            };
        }

        const expectedStatuses: any = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        if (!expectedStatuses.includes(response.status)) {
            console.warn(`Received status ${response.status} but expected ${expectedStatuses.join('/')} for ${options.method} ${url}`);
        }

        return {
            success: true,
            status: response.status,
            data: responseData as T,
        };

    } catch (error: any) {
        console.error(`Request failed for ${options.method} ${url}:`, error);
        return {
            success: false,
            message: `Network or client error: ${error.message || 'Unknown client error'}`,
            error: error,
        };
    }
}
