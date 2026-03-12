import { User, ManagementRequest, PaymentMethod, Payment } from './types';

export interface DatabaseSchema {
    users: User[];
    gestiones: ManagementRequest[];
    paymentMethods: PaymentMethod[];
    payments: Payment[];
}

const STORAGE_KEY = 'ahorro_inteligente_db';

const initialSeed: DatabaseSchema = {
    users: [
        {
            id: "usr_123",
            name: "Juan Pérez",
            email: "juan@example.com",
            phone: "+54 11 1234-5678",
            createdAt: new Date().toISOString()
        }
    ],
    gestiones: [
        {
            id: "req_1",
            userId: "usr_123",
            status: "in_review",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            serviceName: "Edesur",
            notes: "Por favor revisar mi factura del mes pasado.",
            invoice: {
                id: "inv_1",
                managementId: "req_1",
                filename: "factura_edesur_oct.pdf",
                size: 2500000,
                mime: "application/pdf",
                uploadedAt: new Date(Date.now() - 86400000).toISOString(),
                fileUrl: "mock_url",
                total: 12500.50
            }
        },
        {
            id: "req_2",
            userId: "usr_123",
            status: "resolved",
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
            serviceName: "Metrogas",
            invoice: {
                id: "inv_2",
                managementId: "req_2",
                filename: "metrogas_sept.png",
                size: 1500000,
                mime: "image/png",
                uploadedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
                fileUrl: "mock_url",
                total: 5400
            }
        }
    ],
    paymentMethods: [
        {
            id: "pm_1",
            userId: "usr_123",
            brand: "Visa",
            last4: "4242",
            issuerName: "Banco Galicia",
            isDefault: true,
            createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        }
    ],
    payments: [
        {
            id: "pay_1",
            userId: "usr_123",
            managementId: "req_2",
            installmentNumber: 1,
            amount: 1500,
            currency: "ARS",
            status: "paid",
            paidAt: new Date(Date.now() - 15 * 86400000).toISOString(),
            paymentMethodSnapshot: { brand: "Visa", last4: "4242", issuerName: "Banco Galicia" },
            createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
        },
        {
            id: "pay_2",
            userId: "usr_123",
            managementId: "req_2",
            installmentNumber: 2,
            amount: 1500,
            currency: "ARS",
            status: "pending",
            createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
        }
    ],
};

class MockDatabase {
    private inMemoryDb: DatabaseSchema;

    constructor() {
        this.inMemoryDb = initialSeed;
        this.loadFromStorage();
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.inMemoryDb = JSON.parse(stored);
            } else {
                this.persist();
            }
        } catch (e) {
            console.error("Failed to load DB from localStorage", e);
        }
    }

    private persist() {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryDb));
        } catch (e) {
            console.error("Failed to save DB to localStorage", e);
        }
    }

    // Generic getter/setter
    getData(): DatabaseSchema {
        return this.inMemoryDb;
    }

    updateData(newData: Partial<DatabaseSchema>) {
        this.inMemoryDb = { ...this.inMemoryDb, ...newData };
        this.persist();
    }
}

export const mockDb = new MockDatabase();
