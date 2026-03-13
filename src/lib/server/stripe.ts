import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe() {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            // Durante el build de Next.js, a veces las variables no están.
            // Retornamos un proxy o lanzamos error solo cuando se intente usar.
            throw new Error('STRIPE_SECRET_KEY no configurada');
        }
        stripeInstance = new Stripe(key, {
            apiVersion: '2026-02-25.clover' as any,
        });
    }
    return stripeInstance;
}

export async function getStripeCustomer(email: string, fullName: string) {
    const stripe = getStripe();
    const customers = await stripe.customers.list({
        email: email,
        limit: 10,
    });

    if (customers.data.length > 0) {
        // Si hay varios, buscamos el que tenga medios de pago
        for (const customer of customers.data) {
            const methods = await stripe.paymentMethods.list({
                customer: customer.id,
                type: 'card',
                limit: 1
            });
            if (methods.data.length > 0) {
                return customer;
            }
        }
        // Si ninguno tiene, devolvemos el más reciente
        return customers.data.sort((a, b) => b.created - a.created)[0];
    }

    // Create if not exists
    return await stripe.customers.create({
        email: email,
        name: fullName,
    });
}

export async function getPaymentMethods(customerId: string) {
    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
    });
    return paymentMethods.data;
}

export async function getPaymentHistory(customerId: string) {
    const stripe = getStripe();
    const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
    });
    return paymentIntents.data;
}

export async function deletePaymentMethod(paymentMethodId: string) {
    const stripe = getStripe();
    return await stripe.paymentMethods.detach(paymentMethodId);
}
