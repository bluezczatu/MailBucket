import type * as type from './types';
import { IEmailProvider } from './providers/base.provider';
import { MailTmProvider } from './providers/mailtm.provider';

export interface MailBucketConfig {
    providers?: IEmailProvider[];
}

export class MailBucket {
    private providers: Map<string, IEmailProvider>;

    constructor(config?: MailBucketConfig) {
        this.providers = new Map<string, IEmailProvider>();

        if (config?.providers && config.providers.length > 0) {
            config.providers.forEach(p => this.registerProvider(p));
        } else {
            this.registerProvider(new MailTmProvider({ baseUrl: 'https://api.mail.tm', providerName: 'mail.tm' }));
            this.registerProvider(new MailTmProvider({ baseUrl: 'https://api.mail.gw', providerName: 'mail.gw' }));
        }
    }

    public registerProvider(provider: IEmailProvider): void {
        if (this.providers.has(provider.providerName)) {
            //console.warn(`Provider "${provider.providerName}" is already registered. Overwriting.`);
        }
        this.providers.set(provider.providerName, provider);
         //console.log(`Registered provider: ${provider.providerName}`);
    }

    public getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    public getProvider(name: string): IEmailProvider | undefined {
        return this.providers.get(name);
    }

    public async createAccount(providerName?: string): Promise<type.IApiResponse<type.IEmailAccount>> {
        let provider: IEmailProvider | undefined;

        if (providerName) {
            provider = this.getProvider(providerName);
            if (!provider) {
                return { success: false, message: `Provider "${providerName}" not found.` };
            }
             //console.log(`Using specified provider: ${providerName}`);
        } else {
            const availableProviders = this.getAvailableProviders();
            if (availableProviders.length === 0) {
                return { success: false, message: 'No email providers registered.' };
            }
            const randomProviderName = availableProviders[Math.floor(Math.random() * availableProviders.length)];
            provider = this.getProvider(randomProviderName);
             //console.log(`Using random provider: ${randomProviderName}`);
            if (!provider) {
                 return { success: false, message: `Failed to get random provider instance for "${randomProviderName}".` };
            }
        }

        try {
            //console.log(`Creating account using ${provider.providerName}...`);
            const result = await provider.createAccount();
             if(result.success) {
                //console.log(`Account created: ${result.data?.address} via ${provider.providerName}`);
             } else {
                //console.error(`Failed to create account via ${provider.providerName}: ${result.message}`);
             }
            return result;
        } catch (error: any) {
            console.error(`Unexpected error during account creation with ${provider.providerName}:`, error);
            return { success: false, message: `Client error during account creation: ${error.message}`, error };
        }
    }

    public async getMessages(account: type.IEmailAccount): Promise<type.IApiResponse<type.IEmailMessageSummary[]>> {
        const provider = this.getProvider(account.providerName);
        if (!provider) {
            return { success: false, message: `Provider "${account.providerName}" associated with this account not found.` };
        }
        //console.log(`Fetching messages for ${account.address} via ${provider.providerName}...`);
        return provider.getMessages(account);
    }

    public async getMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<type.IEmailMessage>> {
        const provider = this.getProvider(account.providerName);
         if (!provider) {
            return { success: false, message: `Provider "${account.providerName}" associated with this account not found.` };
        }
        //console.log(`Fetching message ${messageId} for ${account.address} via ${provider.providerName}...`);
        return provider.getMessage(account, messageId);
    }

    public async deleteMessage(account: type.IEmailAccount, messageId: string): Promise<type.IApiResponse<void>> {
        const provider = this.getProvider(account.providerName);
         if (!provider) {
            return { success: false, message: `Provider "${account.providerName}" associated with this account not found.` };
        }
         if (!provider.deleteMessage) {
             return { success: false, message: `Provider "${account.providerName}" does not support deleting messages.` };
        }
        //console.log(`Deleting message ${messageId} for ${account.address} via ${provider.providerName}...`);
        return provider.deleteMessage(account, messageId);
    }

    public async deleteAccount(account: type.IEmailAccount): Promise<type.IApiResponse<void>> {
        const provider = this.getProvider(account.providerName);
         if (!provider) {
            return { success: false, message: `Provider "${account.providerName}" associated with this account not found.` };
        }
         if (!provider.deleteAccount) {
             return { success: false, message: `Provider "${account.providerName}" does not support deleting accounts.` };
        }
        //console.log(`Deleting account ${account.address} via ${provider.providerName}...`);
        return provider.deleteAccount(account);
    }
}
