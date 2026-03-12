import { Payment, PaymentMethod } from '../types';
import { stripeAdapter } from '../adapters/stripeAdapter';

class PaymentService {
    async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
        return stripeAdapter.getPaymentMethods(userId);
    }

    async getPayments(userId: string): Promise<Payment[]> {
        const payments = await stripeAdapter.getPayments(userId);
        return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getSetupUrl(userId: string): Promise<string> {
        return stripeAdapter.getBillingPortalOrSetupUrl(userId);
    }

    async setDefaultMethod(userId: string, id: string): Promise<void> {
        return stripeAdapter.setDefaultPaymentMethod(userId, id);
    }

    async removeMethod(id: string): Promise<void> {
        return stripeAdapter.deletePaymentMethod(id);
    }
}

export const paymentService = new PaymentService();
