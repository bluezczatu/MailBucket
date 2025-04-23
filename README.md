# MailBucket | Temp Email Aggregator

[![npm version](https://badge.fury.io/js/mailbucket.svg)](https://badge.fury.io/js/mailbucket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An npm library that aggregates multiple APIs for creating and receiving temporary/disposable emails through a unified interface.

## 🤔 Why?

Working directly with various temporary email service APIs can be cumbersome. Each has its own authentication method, endpoints, and response structure. This library aims to provide a single, consistent way to interact with multiple providers, simplifying the process of generating temporary emails and fetching messages programmatically.

## ✨ Features

*   Unified API for multiple temp email providers.
*   Create new temporary email accounts/addresses.
*   Fetch incoming messages for an address.
*   List available domains (per provider).
*   Delete accounts (where supported by the provider API).
*   TypeScript support (optional, but recommended).

## ✅ Supported Providers

This library currently supports the following temporary email service APIs:

*   [mail.tm](https://mail.tm)
*   [mail.gw](https://mail.gw)
*   [emailnator.com](https://emailnator.com)

*Note: Provider availability and API stability depend on the external services themselves.*

## 💾 Installation

```bash
npm install mailbucket
# or
pnpm install mailbucket
```

# Code
```typescript
import { MailBucket } from "mailbucket"

async function main() {
    const client = new MailBucket();

    console.log("Available providers:", client.getAvailableProviders()); // Or create using a specific provider client.createAccount(<provider>);

    let accountResponse = await client.createAccount();

    if (!accountResponse.success || !accountResponse.data) { console.error("Failed to create account:", accountResponse.message); return; }
    console.log(`Created Account: ${accountResponse.data.address} (Provider: ${accountResponse.data.providerName})`);

    console.log("Waiting for emails... Check your inbox:", accountResponse.data.address);
    await new Promise(resolve => setTimeout(resolve, 30000));

    const messagesResponse = await client.getMessages(accountResponse.data);
    if (!messagesResponse.success || !messagesResponse.data) { console.error("Failed to get messages:", messagesResponse.message); return; }
    if (!messagesResponse.data[0]){ console.log("No messages for:", accountResponse.data.address); return; }

    const messageDetailResponse = await client.getMessage(accountResponse.data, messagesResponse.data[0].id);
    if (!messageDetailResponse.success || !messageDetailResponse.data) { return }

    console.log("Subject:", messageDetailResponse.data.subject);
    console.log("From:", messageDetailResponse.data.from);
    console.log("Body (HTML snippet):", messageDetailResponse.data.bodyHtml?.substring(0, 200) || 'N/A');
    console.log("Body (Text snippet):", messageDetailResponse.data.bodyText?.substring(0, 200) || 'N/A');

    console.log(messageDetailResponse.data)
}

main().catch(console.error);
```

# Powered by [hckrteam.com](https://hckrteam.com)
