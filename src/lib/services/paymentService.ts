import { Payment, PaymentMethod } from '../types';
import { stripeAdapter } from '../adapters/stripeAdapter';

class PaymentService {
    async getPaymentMethods(_userId: string): Promise<PaymentMethod[]> {
        const res = await fetch('/api/stripe/data', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al obtener medios de pago');
        const data = await res.json();
        return data.methods.map((m: any) => ({
            id: m.id,
            brand: m.brand,
            last4: m.last4,
            issuerName: m.brand.toUpperCase(),
            isDefault: m.isDefault
        }));
    }

    async getPayments(_userId: string): Promise<Payment[]> {
        const res = await fetch('/api/stripe/data', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al obtener historial de pagos');
        const data = await res.json();
        return data.payments.map((p: any) => ({
            id: p.id,
            amount: p.amount,
            status: p.status === 'succeeded' ? 'completed' : p.status,
            createdAt: p.createdAt,
            description: p.description || 'Ahorro Inteligente'
        }));
    }

    async getSetupUrl(_userId: string, negotiationId?: string, returnUrl?: string): Promise<string> {
        const res = await fetch('/api/stripe/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ negotiationId, returnUrl })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al obtener URL de validación');
        }
        const data = await res.json();
        return data.url;
    }

    async setDefaultMethod(_userId: string, id: string): Promise<void> {
        const res = await fetch(`/api/stripe/methods/${id}`, {
            method: 'PATCH'
        });
        if (!res.ok) throw new Error('Error al establecer medio de pago principal');
    }

    async removeMethod(id: string): Promise<void> {
        const res = await fetch(`/api/stripe/methods/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar medio de pago');
    }
}

export const paymentService = new PaymentService();
