import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover' as any,
});

export async function getStripeCustomer(email: string, fullName: string) {
    const customers = await stripe.customers.list({
        email: email,
        limit: 1,
    });

    if (customers.data.length > 0) {
        return customers.data[0];
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
