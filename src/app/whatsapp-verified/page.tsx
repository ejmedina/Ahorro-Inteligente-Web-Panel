import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppVerifiedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¡WhatsApp Activado!</h1>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Tus notificaciones han sido activadas exitosamente. Ya podés cerrar esta ventana de forma segura.
                </p>
                
                <Link 
                    href="/login" 
                    className="inline-block w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Ir al inicio
                </Link>
            </div>
        </div>
    );
}
