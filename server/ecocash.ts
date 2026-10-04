import crypto from 'crypto';
import type { EcoCashTransaction, VoucherCurrency } from '../src/types';

/**
 * EcoCash integration — DEMO MODE. No real EcoCash merchant/API credentials
 * exist yet; this simulates the request-to-pay (on-ramp) and payout
 * (off-ramp) lifecycle realistically enough to showcase, but every call
 * resolves locally rather than hitting EcoCash's real gateway. Swap the
 * body of requestToPay/payout for real HTTP calls once Thami has merchant
 * credentials — the function signatures and webhook contract are designed
 * not to change when that happens.
 */

const transactions = new Map<string, EcoCashTransaction>();

function reference(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function verifyEcoCashWebhookSignature(rawPayload: string, signatureHeader: string | null | undefined): boolean {
  const secret = process.env.ECOCASH_WEBHOOK_SECRET || '';
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('hex');
  const sigBuf = Buffer.from(signatureHeader.trim(), 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/** On-ramp: request-to-pay push to the user's EcoCash number. */
export async function requestToPay(phone: string, amount: number, currency: VoucherCurrency): Promise<EcoCashTransaction> {
  const txn: EcoCashTransaction = {
    id: `ecc_${Date.now()}`,
    direction: 'ONRAMP',
    phone,
    amount,
    currency,
    status: 'PENDING',
    reference: reference('ECO-ON'),
    createdAt: new Date().toISOString(),
  };
  transactions.set(txn.id, txn);
  return txn;
}

/**
 * Off-ramp: cash-out to EcoCash. Caller (the wallet checkout layer) must
 * have already confirmed the funds come from the real multi-currency
 * WALLET, never the closed-loop voucher balance — this function has no
 * way to tell the two apart, by design, so that check belongs upstream.
 * Prioritises ZiG per the TM Pick n Pay requirement.
 */
export async function payout(phone: string, amount: number, currency: VoucherCurrency = 'ZWG'): Promise<EcoCashTransaction> {
  const txn: EcoCashTransaction = {
    id: `ecc_${Date.now()}`,
    direction: 'OFFRAMP',
    phone,
    amount,
    currency,
    status: 'PENDING',
    reference: reference('ECO-OFF'),
    createdAt: new Date().toISOString(),
  };
  transactions.set(txn.id, txn);
  return txn;
}

/** Demo-mode resolver — simulates the async webhook that a real gateway would send. */
export function simulateResolve(txnId: string, outcome: 'SUCCESS' | 'FAILED' = 'SUCCESS'): EcoCashTransaction | null {
  const txn = transactions.get(txnId);
  if (!txn) return null;
  txn.status = outcome;
  return { ...txn };
}

export function getTransaction(txnId: string): EcoCashTransaction | null {
  const t = transactions.get(txnId);
  return t ? { ...t } : null;
}
