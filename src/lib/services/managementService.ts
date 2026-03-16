import { ManagementRequest, Invoice } from '../types';
import { airtableAdapter } from '../adapters/airtableAdapter';

class ManagementService {
    async getUserGestiones(_userId: string): Promise<ManagementRequest[]> {
        const res = await fetch('/api/gestiones', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al obtener las gestiones');
        const data = await res.json();

        // Ordenar por fecha descendente
        return data.gestiones.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getGestion(id: string): Promise<ManagementRequest | undefined> {
        const res = await fetch(`/api/gestiones/${id}`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return undefined;
            throw new Error('Error al obtener el detalle de la gestión');
        }
        const data = await res.json();
        return data.gestion;
    }

    async createGestion(userId: string, file: File, notes?: string, dni?: string): Promise<ManagementRequest> {
        if (file.size > 10 * 1024 * 1024) throw new Error('El archivo excede el límite de 10MB');

        const formData = new FormData();
        formData.append('file', file);
        if (notes) formData.append('notes', notes);
        if (dni) formData.append('dni', dni);

        const res = await fetch('/api/gestiones', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al crear la gestión');
        }

        const data = await res.json();
        
        // Retornar un objeto que cumpla con ManagementRequest para la UI
        // Aunque el ID sea de Airtable, el resto lo mapeamos aquí
        return {
            id: data.gestion.id,
            userId,
            status: data.gestion.status as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes,
        };
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
