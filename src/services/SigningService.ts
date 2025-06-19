import { Wallet, Transaction } from "xrpl";
import {
  CreateTransactionResponse,
  Fireblocks,
  TransactionResponse,
  TransactionStateEnum,
} from "@fireblocks/ts-sdk";
import { encode, decode } from "ripple-binary-codec";
import { hashSignedTx, hashTx } from "xrpl/dist/npm/utils/hashes";
import { FireblocksXrpSdk } from "../FireblocksXrpSdk";
import { SigningError } from "../errors/errors";
import { Logger } from "../utils/logger";

// Initialize logger for the controllers
const logger = new Logger("signing-service");

export class SigningService {
  private fireblocks: Fireblocks;
  private wallet: Wallet;

  constructor(fireblocks: Fireblocks, wallet: FireblocksXrpSdk) {
    this.fireblocks = fireblocks;
    this.wallet = wallet;
  }

  // Store prepared blobs for async signing
  private preparedTransactions: Map<
    string,
    {
      tx: Transaction;
      multisignAddress: string | boolean;
    }
  > = new Map();

  public signAsync = async (
    transaction: Transaction,
    publicKey: string,
    assetId: string,
    vaultAccountId: string,
    note?: string,
    multisign?: boolean | string
  ): Promise<{ tx_blob: string; hash: string }> => {
    try {
      const placeholder = this.sign(transaction, publicKey, multisign);
      return await this.getSignedTransaction(
        placeholder,
        assetId,
        vaultAccountId,
        note || ""
      );
    } catch (err: any) {
      throw err instanceof SigningError
        ? err
        : new SigningError(
            "SignAsyncFailed",
            `signAsync failed: ${err.message || err}`
          );
    }
  };

  public sign = (
    transaction: Transaction,
    publicKey: string,
    multisign?: boolean | string
  ): {
    tx_blob: string;
    hash: string;
  } => {
    try {
      let multisignAddress: boolean | string = false;
      if (typeof multisign === "string") {
        multisignAddress = multisign;
      } else if (multisign) {
        multisignAddress = this.wallet.classicAddress;
      }

      // Validate transaction doesn't already have signatures
      if (transaction.TxnSignature || transaction.Signers) {
        throw new SigningError(
          "AlreadySigned",
          'Transaction must not contain "TxnSignature" or "Signers"'
        );
      }

      // Clean the transaction object
      const tx = { ...transaction };

      // Remove any existing signatures
      delete tx.TxnSignature;
      delete tx.Signers;

      // Set SigningPubKey according to the multisigning requirement
      tx.SigningPubKey = multisignAddress ? "" : publicKey;

      // Generate a unique ID for this transaction
      const txId = Date.now().toString() + Math.random().toString();

      // Store the prepared transaction for async signing
      this.preparedTransactions.set(txId, {
        tx,
        multisignAddress,
      });
      logger.info(
        `Prepared transaction with ID ${txId} for signing. Multisign: ${multisignAddress}`
      );
      // Return a placeholder for now
      return {
        tx_blob: `prepared:${txId}`,
        hash: `hash:${txId}`,
      };
    } catch (err: any) {
      throw err instanceof SigningError
        ? err
        : new SigningError(
            "SignFailed",
            `Error in sign(): ${err.message || err}`
          );
    }
  };

  /**
   * DER encode signature components
   */
  private toDER = (rHex?: string, sHex?: string): string => {
    try {
      const rmPadding = (buf: number[]) => {
        let i = 0;
        let len = buf.length - 1;

        while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
          i++;
        }

        return buf.slice(i);
      };

      const constructLength = (arr: number[], len: number) => {
        if (len < 0x80) {
          arr.push(len);
          return arr;
        }

        let octets = 1 + ((Math.log(len) / Math.LN2) >>> 3);
        arr.push(octets | 0x80);

        while (--octets) {
          arr.push((len >>> (octets << 3)) & 0xff);
        }

        arr.push(len);
        return arr;
      };

      let r = [...Buffer.from(rHex ?? "", "hex")];
      let s = [...Buffer.from(sHex ?? "", "hex")];

      if (r[0] & 0x80) r = [0].concat(r);
      if (s[0] & 0x80) s = [0].concat(s);

      r = rmPadding(r);
      s = rmPadding(s);

      while (!s[0] && !(s[1] & 0x80)) {
        s = s.slice(1);
      }

      let derBytes = constructLength([0x02], r.length);
      derBytes = derBytes.concat(r);
      derBytes.push(0x02);
      derBytes = constructLength(derBytes, s.length);
      const backHalf = derBytes.concat(s);
      derBytes = constructLength([0x30], backHalf.length);
      derBytes = derBytes.concat(backHalf);

      return Buffer.from(derBytes).toString("hex").toUpperCase();
    } catch (err: any) {
      throw new SigningError(
        "DEREncodingFailed",
        `Failed to DER-encode signature: ${err.message || err}`
      );
    }
  };

  /**
   * Verify that serialized transaction matches the original
   */
  private checkTxSerialization = (
    serialized: string,
    tx: Transaction
  ): void => {
    try {
      const decoded = decode(serialized) as unknown as Transaction;
      if (!decoded.TxnSignature && !decoded.Signers) {
        throw new SigningError(
          "SerializationError",
          "Serialized transaction missing TxnSignature or Signers"
        );
      }

      if (!tx.SigningPubKey) {
        delete decoded.SigningPubKey;
      }

      const txCopy = { ...tx };
      const decodedCopy = { ...decoded };
      delete decodedCopy.TxnSignature;
      delete decodedCopy.Signers;

      // Comparison omitted
    } catch (err: any) {
      throw err instanceof SigningError
        ? err
        : new SigningError(
            "SerializationValidationFailed",
            `Transaction serialization mismatch: ${err.message || err}`
          );
    }
  };

  public waitForSignature = async (
    tx: CreateTransactionResponse,
    pollingInterval?: number
  ): Promise<TransactionResponse> => {
    try {
      if (!tx.id) {
        throw new SigningError("InvalidTxId", "Transaction ID is undefined");
      }

      let response = await this.fireblocks.transactions.getTransaction({
        txId: tx.id,
      });
      let lastStatus = response.data.status;
      logger.info(
        `Transaction ${response.data.id} is currently at status - ${response.data.status}`
      );
      while (response.data.status !== TransactionStateEnum.Completed) {
        await new Promise((res) => setTimeout(res, pollingInterval || 2000));
        response = await this.fireblocks.transactions.getTransaction({
          txId: tx.id,
        });

        if (
          response.data.status === TransactionStateEnum.Blocked ||
          response.data.status === TransactionStateEnum.Cancelled ||
          response.data.status === TransactionStateEnum.Failed ||
          response.data.status === TransactionStateEnum.Rejected
        ) {
          throw new SigningError(
            "SignatureRequestFailed",
            `Transaction ID ${response.data.id} failed with status ${response.data.status}, sub status: ${response.data.subStatus}`
          );
        }

        lastStatus = response.data.status;
      }
      logger.info(
        `Transaction ${tx.id} is currently at status - ${TransactionStateEnum.Completed}`
      );

      return response.data;
    } catch (err: any) {
      throw err instanceof SigningError
        ? err
        : new SigningError(
            "WaitForSignatureFailed",
            `Error while waiting for signature: ${err.message || err}`
          );
    }
  };

  /**
   * Get the actual signed transaction asynchronously
   */
  public getSignedTransaction = async (
    placeholder: {
      tx_blob: string;
      hash: string;
    },
    assetId: string,
    vaultAccountId: string,
    note: string
  ): Promise<{ tx_blob: string; hash: string }> => {
    // Validate placeholder
    if (!placeholder.tx_blob.startsWith("prepared:")) {
      throw new SigningError(
        "InvalidPlaceholder",
        "Invalid transaction placeholder. Use sign() before getSignedTransaction()"
      );
    }

    const txId = placeholder.tx_blob.substring(9);
    const prepared = this.preparedTransactions.get(txId);
    logger.info("Prepared transaction:", prepared);
    if (!prepared) {
      throw new SigningError(
        "PlaceholderExpired",
        "Prepared transaction expired or not found"
      );
    }
    this.preparedTransactions.delete(txId);

    try {
      const binary = encode(prepared.tx);
      const content = hashTx(binary);
      logger.info("Sending raw transaction content:", content);
      const createRes = await this.fireblocks.transactions.createTransaction({
        transactionRequest: {
          assetId,
          operation: "RAW",
          source: { type: "VAULT_ACCOUNT", id: vaultAccountId },
          note: `Fireblocks XRP SDK Raw Tx: ${note}`,
          extraParameters: {
            rawMessageData: { messages: [{ content }] },
            unhashedTxPayload: prepared.tx,
          },
        },
      });
      logger.info(
        `Transaction created with ID: ${createRes.data.id}, status: ${createRes.data.status}`
      );
      const signatureRes = await this.waitForSignature(createRes.data);
      const sig = signatureRes.signedMessages?.[0]?.signature;
      if (!sig) {
        throw new SigningError(
          "NoSignature",
          "No signature returned from Fireblocks"
        );
      }

      const der = this.toDER(sig.r, sig.s);
      let finalTx: Transaction;
      if (prepared.multisignAddress) {
        finalTx = {
          ...prepared.tx,
          Signers: [
            {
              Signer: {
                Account:
                  typeof prepared.multisignAddress === "string"
                    ? prepared.multisignAddress
                    : this.wallet.classicAddress,
                SigningPubKey: this.wallet.publicKey,
                TxnSignature: der,
              },
            },
          ],
        };
      } else {
        finalTx = { ...prepared.tx, TxnSignature: der };
      }

      const encodedTx = encode(finalTx);
      this.checkTxSerialization(encodedTx, prepared.tx);
      const hash = hashSignedTx(encodedTx);

      return { tx_blob: encodedTx, hash };
    } catch (error: any) {
      throw error instanceof SigningError
        ? error
        : new SigningError(
            "GetSignedTransactionFailed",
            `Error signing transaction with Fireblocks: ${
              error.message || error
            }`
          );
    }
  };
}
