import { ManagementRequest, Invoice } from '../types';
import { airtableAdapter } from '../adapters/airtableAdapter';

class ManagementService {
    async getUserGestiones(userId: string): Promise<ManagementRequest[]> {
        const gestiones = await airtableAdapter.getGestiones(userId);
        // Sort descending by createdAt
        return gestiones.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getGestion(id: string): Promise<ManagementRequest | undefined> {
        return airtableAdapter.getGestionById(id);
    }

    async createGestion(userId: string, file: File, notes?: string): Promise<ManagementRequest> {
        // Simular upload
        if (file.size > 10 * 1024 * 1024) throw new Error('File exceeds 10MB limit');

        const newReqId = "req_" + Date.now();
        const invoice: Invoice = {
            id: "inv_" + Date.now(),
            managementId: newReqId,
            filename: file.name,
            size: file.size,
            mime: file.type,
            uploadedAt: new Date().toISOString(),
            fileUrl: URL.createObjectURL(file) // Mock temporary URL
        };

        const newGestion: ManagementRequest = {
            id: newReqId,
            userId,
            status: "draft",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes,
            invoice
        };

        return airtableAdapter.createGestion(newGestion);
    }

    async cancelGestion(id: string): Promise<ManagementRequest> {
        const gestion = await airtableAdapter.getGestionById(id);
        if (!gestion) throw new Error('Not found');
        if (gestion.status !== 'draft' && gestion.status !== 'submitted') {
            throw new Error('Only draft or submitted requests can be canceled');
        }
        return airtableAdapter.updateGestion(id, { status: 'canceled', updatedAt: new Date().toISOString() });
    }
}

export const managementService = new ManagementService();
