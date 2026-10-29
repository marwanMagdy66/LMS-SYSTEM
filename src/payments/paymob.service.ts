
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PaymobIntentionResponse {
  id: string;
  client_secret: string;
  intention_order_id: number;
  status: string;
}

@Injectable()
export class PaymobService {
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly integrationId: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .getOrThrow<string>('PAYMOB_BASE_URL')
      .replace(/\/+$/, '');

    this.secretKey =
      this.configService.getOrThrow<string>(
        'PAYMOB_SECRET_KEY',
      );

    this.publicKey =
      this.configService.getOrThrow<string>(
        'PAYMOB_PUBLIC_KEY',
      );

    this.integrationId = Number(
      this.configService.getOrThrow<string>(
        'PAYMOB_INTEGRATION_ID',
      ),
    );

    if (
      !Number.isSafeInteger(this.integrationId) ||
      this.integrationId <= 0
    ) {
      throw new Error(
        'PAYMOB_INTEGRATION_ID must be a valid positive integer',
      );
    }
  }

  async createIntention(params: {
    orderId: string;
    amount: number;
    currency: string;
    courseTitle: string;
    email: string;
    phoneNumber: string;
    notificationUrl: string;
  }) {
    const amountInPiastres = Math.round(params.amount * 100);

    if (
      !Number.isSafeInteger(amountInPiastres) ||
      amountInPiastres <= 0
    ) {
      throw new InternalServerErrorException(
        'Invalid payment amount',
      );
    }

    let notificationUrl: URL;

    try {
      notificationUrl = new URL(params.notificationUrl);
    } catch {
      throw new InternalServerErrorException(
        'PAYMOB_NOTIFICATION_URL must be a valid URL',
      );
    }

    if (notificationUrl.protocol !== 'https:') {
      throw new InternalServerErrorException(
        'PAYMOB_NOTIFICATION_URL must use HTTPS',
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl}/v1/intention/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPiastres,
            currency: params.currency,
            payment_methods: [this.integrationId],
            items: [
              {
                name: params.courseTitle,
                amount: amountInPiastres,
                description: `LMS course order ${params.orderId}`,
                quantity: 1,
              },
            ],
            billing_data: {
              first_name: 'LMS',
              last_name: 'Student',
              email: params.email,
              phone_number: params.phoneNumber,
              apartment: 'NA',
              floor: 'NA',
              street: 'NA',
              building: 'NA',
              city: 'Cairo',
              country: 'EG',
              state: 'Cairo',
            },
            special_reference: params.orderId,
            notification_url: notificationUrl.toString(),
          }),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Could not connect to Paymob',
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();

      console.error('Paymob intention request failed:', {
        status: response.status,
        body: errorBody.slice(0, 500),
      });

      if (response.status >= 500) {
        throw new ServiceUnavailableException(
          'Paymob is temporarily unavailable',
        );
      }

      throw new BadGatewayException(
        'Paymob rejected the payment initialization request',
      );
    }

    let data: PaymobIntentionResponse;

    try {
      data =
        (await response.json()) as PaymobIntentionResponse;
    } catch {
      throw new BadGatewayException(
        'Paymob returned an invalid response',
      );
    }

    if (
      !data.id ||
      !data.client_secret ||
      !Number.isSafeInteger(data.intention_order_id)
    ) {
      throw new BadGatewayException(
        'Paymob returned incomplete intention details',
      );
    }

    return {
      intentionId: data.id,
      paymobOrderId: data.intention_order_id,
      checkoutUrl:
        `${this.baseUrl}/unifiedcheckout/` +
        `?publicKey=${encodeURIComponent(this.publicKey)}` +
        `&clientSecret=${encodeURIComponent(data.client_secret)}`,
    };
  }
}
