import { User, ManagementRequest, Invoice } from '../types';
import { mockDb } from '../mockDb';

export interface IAirtableAdapter {
    getUsers(): Promise<User[]>;
    getUserByEmail(email: string): Promise<User | undefined>;
    createUser(user: User): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;

    getGestiones(userId: string): Promise<ManagementRequest[]>;
    getGestionById(id: string): Promise<ManagementRequest | undefined>;
    createGestion(request: ManagementRequest): Promise<ManagementRequest>;
    updateGestion(id: string, updates: Partial<ManagementRequest>): Promise<ManagementRequest>;
}

export class AirtableMockAdapter implements IAirtableAdapter {
    private delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    async getUsers(): Promise<User[]> {
        await this.delay(500);
        return mockDb.getData().users;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        await this.delay(500);
        return mockDb.getData().users.find(u => u.email === email);
    }

    async createUser(user: User): Promise<User> {
        await this.delay(500);
        const db = mockDb.getData();
        db.users.push(user);
        mockDb.updateData({ users: db.users });
        return user;
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User> {
        await this.delay(500);
        const db = mockDb.getData();
        const index = db.users.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        db.users[index] = { ...db.users[index], ...updates };
        mockDb.updateData({ users: db.users });
        return db.users[index];
    }

    async getGestiones(userId: string): Promise<ManagementRequest[]> {
        await this.delay(500);
        return mockDb.getData().gestiones.filter(g => g.userId === userId);
    }

    async getGestionById(id: string): Promise<ManagementRequest | undefined> {
        await this.delay(500);
        return mockDb.getData().gestiones.find(g => g.id === id);
    }

    async createGestion(request: ManagementRequest): Promise<ManagementRequest> {
        await this.delay(500);
        const db = mockDb.getData();
        db.gestiones.push(request);
        mockDb.updateData({ gestiones: db.gestiones });
        return request;
    }

    async updateGestion(id: string, updates: Partial<ManagementRequest>): Promise<ManagementRequest> {
        await this.delay(500);
        const db = mockDb.getData();
        const index = db.gestiones.findIndex(g => g.id === id);
        if (index === -1) throw new Error('Management request not found');
        db.gestiones[index] = { ...db.gestiones[index], ...updates };
        mockDb.updateData({ gestiones: db.gestiones });
        return db.gestiones[index];
    }
}

export const airtableAdapter = new AirtableMockAdapter();
