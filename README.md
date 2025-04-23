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
