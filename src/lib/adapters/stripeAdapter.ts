import { PaymentMethod, Payment } from '../types';
import { mockDb } from '../mockDb';

export interface IStripeAdapter {
    getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
    getPayments(userId: string): Promise<Payment[]>;
    getBillingPortalOrSetupUrl(userId: string): Promise<string>;
    deletePaymentMethod(id: string): Promise<void>;
    setDefaultPaymentMethod(userId: string, id: string): Promise<void>;
}

export class StripeMockAdapter implements IStripeAdapter {
    private delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
        await this.delay(500);
        return mockDb.getData().paymentMethods.filter(pm => pm.userId === userId);
    }

    async getPayments(userId: string): Promise<Payment[]> {
        await this.delay(500);
        return mockDb.getData().payments.filter(p => p.userId === userId);
    }

    async getBillingPortalOrSetupUrl(userId: string): Promise<string> {
        await this.delay(300);
        // Simula URL devuelta por el backend que implementa Stripe Checkout / Portal
        // TODO: Conectar esto al backend real que hoy usan desde SendPulse
        return `https://mock-stripe.com/setup?session_id=cs_test_123&user=${userId}`;
    }

    async deletePaymentMethod(id: string): Promise<void> {
        await this.delay(500);
        const db = mockDb.getData();
        db.paymentMethods = db.paymentMethods.filter(pm => pm.id !== id);
        mockDb.updateData({ paymentMethods: db.paymentMethods });
    }

    async setDefaultPaymentMethod(userId: string, id: string): Promise<void> {
        await this.delay(500);
        const db = mockDb.getData();
        db.paymentMethods = db.paymentMethods.map(pm => {
            if (pm.userId !== userId) return pm;
            return { ...pm, isDefault: pm.id === id };
        });
        mockDb.updateData({ paymentMethods: db.paymentMethods });
    }
}

export const stripeAdapter = new StripeMockAdapter();
