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
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.error('[stripe] Invalid email provided for customer lookup:', email);
        throw new Error('Email de usuario inválido para procesar pagos.');
    }

    const stripe = getStripe();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Intentar buscar por email exacto
    const customers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 5,
    });

    // 2. Filtrar rigurosamente los resultados (por si Stripe devolviera de más o ignorara el filtro)
    const matchingCustomers = customers.data.filter(c => c.email?.toLowerCase() === normalizedEmail);

    if (matchingCustomers.length > 0) {
        // Si hay varios, preferimos el que tenga medios de pago
        for (const customer of matchingCustomers) {
            const methods = await stripe.paymentMethods.list({
                customer: customer.id,
                type: 'card',
                limit: 1
            });
            if (methods.data.length > 0) {
                return customer;
            }
        }
        // Si ninguno tiene, devolvemos el más reciente de los que coinciden
        return matchingCustomers.sort((a, b) => b.created - a.created)[0];
    }

    // 3. Crear el cliente solo si después de la búsqueda rigurosa no existe
    console.log(`[stripe] No matching customer found for ${normalizedEmail}. Creating new one.`);
    return await stripe.customers.create({
        email: normalizedEmail,
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
