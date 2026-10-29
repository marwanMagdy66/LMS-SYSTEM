
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface PaymobTransaction {
  amount_cents: number | string;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  id: number | string;
  integration_id: number | string;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  order: {
    id: number | string;
  };
  owner: number | string;
  pending: boolean;
  source_data: {
    pan: string;
    sub_type: string;
    type: string;
  };
  success: boolean;
}

@Injectable()
export class PaymobHmacService {
  private readonly hmacSecret: string;

  constructor(configService: ConfigService) {
    this.hmacSecret = configService.getOrThrow<string>(
      'PAYMOB_HMAC_SECRET',
    );
  }

  verifyTransaction(
    transaction: PaymobTransaction,
    receivedHmac: string,
  ): boolean {
    if (!transaction || !receivedHmac) {
      return false;
    }

    const fields: unknown[] = [
      transaction.amount_cents,
      transaction.created_at,
      transaction.currency,
      transaction.error_occured,
      transaction.has_parent_transaction,
      transaction.id,
      transaction.integration_id,
      transaction.is_3d_secure,
      transaction.is_auth,
      transaction.is_capture,
      transaction.is_refunded,
      transaction.is_standalone_payment,
      transaction.is_voided,
      transaction.order?.id,
      transaction.owner,
      transaction.pending,
      transaction.source_data?.pan,
      transaction.source_data?.sub_type,
      transaction.source_data?.type,
      transaction.success,
    ];

    if (
      fields.some(
        (value) => value === undefined || value === null,
      ) ||
      !/^[a-f0-9]{128}$/i.test(receivedHmac)
    ) {
      return false;
    }

    const message = fields
      .map((value) => String(value))
      .join('');

    const expected = createHmac('sha512', this.hmacSecret)
      .update(message)
      .digest();

    const received = Buffer.from(receivedHmac, 'hex');

    return (
      received.length === expected.length &&
      timingSafeEqual(expected, received)
    );
  }
}
