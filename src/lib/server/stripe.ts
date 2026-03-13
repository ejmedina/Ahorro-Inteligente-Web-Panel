import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover' as any,
});

export async function getStripeCustomer(email: string, fullName: string) {
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
    const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
    });
    return paymentMethods.data;
}

export async function getPaymentHistory(customerId: string) {
    const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
    });
    return paymentIntents.data;
}

export async function deletePaymentMethod(paymentMethodId: string) {
    return await stripe.paymentMethods.detach(paymentMethodId);
}
