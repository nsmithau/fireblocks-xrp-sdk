# Fireblocks XRP SDK

A stateless SDK and REST API server for Fireblocks customers, simplifying advanced operations on the Ripple Ledger (XRPL).

---

## ⚡ Project Overview

**Fireblocks XRP SDK** enables secure, advanced XRP ledger operations via simple SDK calls or a stateless REST API.  
Built for Fireblocks customers who want seamless DEX, token, and issuer operations on Ripple.

> **Disclaimer**  
> This SDK relies on Fireblocks' RAW signing capabilities. Customers are fully responsible for safe usage, setup, and transaction outcomes. Fireblocks is not liable for any loss of funds resulting from the use of this code. Contact the Fireblocks Professional Services team for assistance.

### **Prerequisites**

- Fireblocks workspace and API credentials ([how to create an API key](https://developers.fireblocks.com/reference/quickstart)).
- RAW signing is enabled on your Fireblocks workspace. (Contact your Customer Success Manager for more information)
- TAP rules set to allow RAW transactions.
- Node.js v18+ for SDK usage.
- Docker (for REST API server).

---

## 🚀 Features

- **Advanced XRPL support:** DEX (OfferCreate/Cancel, CrossCurrencyPayment), token & XRP transfers, setting trust lines, account settings, clawback, freeze/unfreeze and burn.
- **Fireblocks wallet integration:** Secure MPC key management, raw signing flows, and transaction creation.
- **Raw content validation with callback handler support** Any Raw transaction created by the SDK includes the unhashed payload for further validation actions on your callback handler before signing.
- **Stateless, pool-managed SDK:** Efficient use of Fireblocks APIs with per-vault pooling.
- **REST API:** Simple to run as a Docker container.

---

## 📦 Installation

### **SDK / Library Usage**

Clone this repository and install dependencies:

```bash
git clone https://github.com/fireblocks/fireblocks-xrp-sdk.git
cd fireblocks-xrp-sdk
npm install
```

### REST API (Docker)

Build and run the REST API server:

```bash
cp .env.example .env
# Edit .env to your configuration
docker-compose up --build
```

- By default, the API server runs on port `3000`.
- To change the port, set the `PORT` variable in your `.env` file.

> The project includes a sample `docker-compose.yml` and `.env.example` for quick setup.

---

## ⚙️ Configuration

All configuration is via environment variables.

Start by copying `.env.example` to `.env` and editing for your environment:

```bash
cp .env.example .env
```

| Variable Name                 | Required | Default  | Purpose                                                                                                                |
| ----------------------------- | :------: | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `FIREBLOCKS_API_KEY`          |   Yes    | –        | Your Fireblocks API key UUID                                                                                           |
| `FIREBLOCKS_API_SECRET`       |   Yes    | –        | Path or inline string of Fireblocks private key                                                                        |
| `FIREBLOCKS_VAULT_ACCOUNT_ID` |   Yes    | –        | Vault account to use for transactions                                                                                  |
| `FIREBLOCKS_ASSET_ID`         |    No    | XRP_TEST | Use `XRP` for mainnet, `XRP_TEST` for testnet                                                                          |
| `FIREBLOCKS_BASE_PATH`        |    No    | US       | Fireblocks API environment (see [docs](https://developers.fireblocks.com/docs/workspace-environments) for region URLs) |
| `SDK_LOG_LEVEL`               |    No    | info     | Log level: debug, info, warn, error, fatal                                                                             |
| `PORT`                        |    No    | 3000     | API server port (REST mode)                                                                                            |

---

## 🔑 Mounting Your Fireblocks Private Key in Docker

The SDK and REST API require access to your Fireblocks API private key (FIREBLOCKS_API_SECRET) for signing and secure communication with Fireblocks.
When running inside Docker, you must mount this file and reference it correctly.

1. Store Your Private Key
   Place your Fireblocks API private key file in the project directory under ./secrets/fireblocks_secret.key:

```bash
your-project-root/
│
├─ secrets/
│ └─ fireblocks_secret.key
├─ .env
├─ docker-compose.yml
└─ ...
```

#### **Important: Never commit your private key to source control.**

2. Reference the Private Key in `.env`
   Set the environment variable in your `.env` file to match the path inside the container:

```bash
FIREBLOCKS_API_SECRET=/secrets/fireblocks_secret.key
```

3. How Docker Compose Mounts the Key
   Your `docker-compose.yml` already mounts both the secrets folder and the .env file into the container:

```yaml
services:
  fireblocks-xrp-sdk:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./secrets/fireblocks_secret.key:/secrets/fireblocks_secret.key:ro
      - ./.env:/app/.env:ro
    ports:
      - "3000:3000"
    env_file: ./.env
    environment:
      - FIREBLOCKS_API_SECRET=/secrets/fireblocks_secret.key
    restart: unless-stopped
```

This setup ensures that:

Your private key is available in the container at `/secrets/fireblocks_secret.key`.

The `.env` file with your Fireblocks credentials is available at `/app/.env`.

The `FIREBLOCKS_API_SECRET` environment variable tells the SDK where to find the key.

4. Running the API Server
   Build and run the container with:

```bash
docker-compose up --build
```

5. Security Notes
   Do not include your private key in the repo.
   Only give read permissions (:ro) to the mounted secret.
   Consider using secrets management solutions for production deployments.

## 🛠️ Usage

### SDK Usage Example

Sample usage via direct SDK in Node.js (see `/examples` for more):

```ts
import { FbksXrpApiService } from "./src/api/ApiService";
import { TransactionType } from "./src/pool/types";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const apiService = new FbksXrpApiService({
    apiKey: process.env.FIREBLOCKS_API_KEY || "",
    apiSecret: process.env.FIREBLOCKS_API_SECRET || "",
    assetId: process.env.FIREBLOCKS_ASSET_ID || "XRP_TEST",
    basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  });

  const params = {
    sellAmount: "10",
    buyAmount: {
      currency: "THT",
      issuer: "rpbkpPF8PrPuMN8NgEVkCsJDCWwP9KePFq",
      value: "2",
    },
    flags: {
      tfPassiveOffer: true,
      tfSellOffer: true,
    },
  };

  const opts: ExecuteTransactionOpts = {
    vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
    transactionType: TransactionType.OFFER_CREATE,
    params,
  };

  const res = await apiService.executeTransaction(opts);

  if ("result" in res) {
    console.log(`Tx submitted: ${res.result.hash}`);
  } else {
    console.log(`Transaction submitted with ID: ${res.id}`);
  }

  await apiService.shutdown();
})();
```

> See more SDK samples in `/examples/`.

### Raw content validation support

Any transaction created by the SDK (excluding `xrpTransfer()` that does not rely on Raw signing) includes the unhased transaction payload as an additional `extraParameters` key (`unhashedTxPayload`), this is passed to allow pre-signature validation by a callback handler instance connected to your Fireblocks API Co-Signer instance.

In the transaction object received by the callback handler, the `extraParameters` object will have this structure:

```json
{
  "rawMessageData": {
    "messages": [
      {
        "content": "4147FCCCB874E67DDB05C3D353972EFA21DC0D18F6F0B3768C22AFDAAEEC10E7"
      }
    ]
  },
  "unhashedTxPayload": {
    "Fee": "10",
    "Amount": {
      "value": "100",
      "issuer": "rhsMZjNb4ehEHdfLbMCRBnwMr7XAnicnVS",
      "currency": "FBX"
    },
    "Account": "rpbkpPF8PrPuMN8NgEVkCsJDCWwP9KePFq",
    "Sequence": 7855319,
    "Destination": "rfSeUdwJC4ejRZ3mNfdH7KMWPyGGx6UTmf",
    "SigningPubKey": "03077CBD3FC5F7B9FC8364C83900A78659AF60D16C62DB2860C498C3593D29BA2D",
    "TransactionType": "Payment",
    "LastLedgerSequence": 8224033
  }
}
```

Use the `unhashedTxPayload` parameter to validate the raw message (`content`) before signing it.

### REST API Usage

#### 1. Run API Server

```bash
docker-compose up --build
```

#### 2. API Authentication

All requests require valid Fireblocks API credentials via environment parameters.
No additional API key/JWT is needed on REST endpoints.

#### 3. Try Endpoints (cURL)

**OfferCreate example:**

```bash
curl -X POST http://localhost:3000/api/dex/offerCreate/<vaultAccountId> \
  -H "Content-Type: application/json" \
  -d '{
    "sellAmount": "10",
    "buyAmount": {
      "currency": "THT",
      "issuer": "rpbkpPF8PrPuMN8NgEVkCsJDCWwP9KePFq",
      "value": "2"
    },
    "flags": {
      "tfPassiveOffer": true,
      "tfSellOffer": true
    }
  }'
```

#### 4. Postman Collection

Import [`Fireblocks-XRP-SDK-API.postman_collection.json`](https://github.com/fireblocks/fireblocks-xrp-sdk/blob/main/Fireblocks-XRP-SDK-API.postman_collection.json)
_All REST API routes and sample payloads are included for testing._

### 5. Success Response JSON Example

```json
{
  "api_version": 2,
  "id": 28,
  "result": {
    "close_time_iso": "2025-06-18T18:32:21Z",
    "ctid": "C07D2C9900000001",
    "hash": "4B2FA0715A4DBBBBC64AEDB456EB66C5EB51622563E9844301221379BEE0A0B2",
    "ledger_hash": "A9694DDCED235E2DCB12A83EF6635DD3ED6D3C6453382667684D8129A5C6E436",
    "ledger_index": 8203417,
    "meta": {
      "AffectedNodes": [
        {
          "CreatedNode": {
            "LedgerEntryType": "Offer",
            "LedgerIndex": "99DABC072D601478026701338BC2B949EF8496E9EBEC2178CFFADC4E8DAB11C3",
            "NewFields": {
              "Account": "rNZxC1fL1qREWqu9N5A74nHWwqo39XoNYB",
              "BookDirectory": "C0E0F7D521A20EE39BA81685BF4169312FF9FB83CFFB999D54071AFD498D0000",
              "Flags": 196608,
              "Sequence": 7855642,
              "TakerGets": "10",
              "TakerPays": {
                "currency": "THT",
                "issuer": "rpbkpPF8PrPuMN8NgEVkCsJDCWwP9KePFq",
                "value": "2"
              }
            }
          }
        },
        {
          "ModifiedNode": {
            "FinalFields": {
              "Flags": 0,
              "Owner": "rNZxC1fL1qREWqu9N5A74nHWwqo39XoNYB",
              "RootIndex": "AAEC4ADFADE1BF6FB00855A846C68D52268D942F4E25EC2A87BDE6815A4FED0A"
            },
            "LedgerEntryType": "DirectoryNode",
            "LedgerIndex": "AAEC4ADFADE1BF6FB00855A846C68D52268D942F4E25EC2A87BDE6815A4FED0A",
            "PreviousTxnID": "F6B1A95D26D57322EC872B2C3D65518DC47430218827C3F0349388F963E27CCB",
            "PreviousTxnLgrSeq": 8167686
          }
        },
        {
          "ModifiedNode": {
            "FinalFields": {
              "ExchangeRate": "54071afd498d0000",
              "Flags": 0,
              "RootIndex": "C0E0F7D521A20EE39BA81685BF4169312FF9FB83CFFB999D54071AFD498D0000",
              "TakerGetsCurrency": "0000000000000000000000000000000000000000",
              "TakerGetsIssuer": "0000000000000000000000000000000000000000",
              "TakerPaysCurrency": "0000000000000000000000005448540000000000",
              "TakerPaysIssuer": "118A2EE1CD3C489E36DDD301C7E702DC0D8DF53F"
            },
            "LedgerEntryType": "DirectoryNode",
            "LedgerIndex": "C0E0F7D521A20EE39BA81685BF4169312FF9FB83CFFB999D54071AFD498D0000",
            "PreviousTxnID": "F6B1A95D26D57322EC872B2C3D65518DC47430218827C3F0349388F963E27CCB",
            "PreviousTxnLgrSeq": 8167686
          }
        },
        {
          "ModifiedNode": {
            "FinalFields": {
              "Account": "rNZxC1fL1qREWqu9N5A74nHWwqo39XoNYB",
              "Balance": "40999850",
              "Flags": 0,
              "OwnerCount": 4,
              "Sequence": 7855643
            },
            "LedgerEntryType": "AccountRoot",
            "LedgerIndex": "E3D4BE3CCB2AF535B829037621B57F5B3914AC4ECED4B65D407386FB4938199B",
            "PreviousFields": {
              "Balance": "40999860",
              "OwnerCount": 3,
              "Sequence": 7855642
            },
            "PreviousTxnID": "7660C7BF2BDA0CC2EC15AFA3CDC5ECCBB7676AB20655D927C743FA4E8408E00F",
            "PreviousTxnLgrSeq": 8203373
          }
        }
      ],
      "TransactionIndex": 0,
      "TransactionResult": "tesSUCCESS"
    },
    "tx_json": {
      "Account": "rNZxC1fL1qREWqu9N5A74nHWwqo39XoNYB",
      "Fee": "10",
      "Flags": 589824,
      "LastLedgerSequence": 8203434,
      "Sequence": 7855642,
      "SigningPubKey": "031CD7DD2D580A62D45F2A180F04F39DC9222570A23E0F092E1D7C49E68B731FB4",
      "TakerGets": "10",
      "TakerPays": {
        "currency": "THT",
        "issuer": "rpbkpPF8PrPuMN8NgEVkCsJDCWwP9KePFq",
        "value": "2"
      },
      "TransactionType": "OfferCreate",
      "TxnSignature": "3045022100FD948DE8CC15EE77F6DB1FF47BD27B93422CE65CEDD320B82E7B06BAE253AA21022001B12BAC6ACBB65B8A6FDEF6E7E665128DD0BD98ED37463F9E41C1B659F27613",
      "date": 803586741,
      "ledger_index": 8203417
    },
    "validated": true
  },
  "type": "response"
}
```

---

## 📚 API & Documentation Endpoints

The running API server exposes interactive documentation and SDK reference for easier integration and onboarding:

| Purpose               | URL                               | Description                                               |
| --------------------- | --------------------------------- | --------------------------------------------------------- |
| **Swagger UI**        | `http://localhost:3000/api-docs`  | Interactive REST API explorer for all endpoints.          |
| **TypeDoc Reference** | `http://localhost:3000/type-docs` | SDK Classes/Methods documentation (generated by TypeDoc). |

> Both URLs assume the default port `3000`—change if you modify your server port.
> The TypeDoc reference is also available [here](https://fireblocks.github.io/fireblocks-xrp-sdk/).

**DEX Routes:**

- `POST /api/dex/offerCreate/:vaultAccountId`
- `POST /api/dex/offerCancel/:vaultAccountId`
- `POST /api/dex/crossCurrencyPayment/:vaultAccountId`

**Token Routes:**

- `POST /api/token/tokenTransfer/:vaultAccountId`
- `POST /api/token/accountSet/:vaultAccountId`
- `POST /api/token/burnToken/:vaultAccountId`
- `POST /api/token/clawback/:vaultAccountId`
- `POST /api/token/freezeToken/:vaultAccountId`
- `POST /api/token/trustSet/:vaultAccountId`
- `POST /api/token/xrpTransfer/:vaultAccountId`

**Each endpoint expects a JSON body and returns a transaction result.**
_See Postman or `/examples/` for detailed payloads._

### Error Handling

All errors return a JSON.

Bad request example (400):

```json
{
  "error": "Missing vault account ID",
  "message": "Vault account Id is missing from the request URL"
}
```

Not found example (404):

```json
{
  "error": "Not Found",
  "message": "Cannot POST /api/dex/offerCanc"
}
```

---

## 🧪 Development & Contribution

- **Run tests:**

  ```bash
  npm run test
  ```

- **CI/CD:**
  The project uses GitHub Actions for lint, build, and tests.
- **Contributions:**
  PRs and issues are welcome!

---

## 🛡️ Security & Responsibility

> RAW signing is a powerful operation.
> Ensure your Fireblocks workspace is properly configured.
> **Fireblocks is not responsible for loss of funds caused by incorrect use of this SDK or API.**

---

## 📝 License

MIT License

---

## 💬 Support

For setup help, troubleshooting, or feature requests, please contact the Fireblocks Professional Services team.

---
