"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface WhatsAppInviteBannerProps {
    user: any;
    onRefresh: () => Promise<any>;
}

export function WhatsAppInviteBanner({ user, onRefresh }: WhatsAppInviteBannerProps) {
    const isInactive = user?.subscriptionStatus === 'Inactive';
    const isPending = user?.subscriptionStatus === 'Pending';
    
    const [isExpanding, setIsExpanding] = useState(false);
    const [phone, setPhone] = useState(user?.phone || "");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!user?.updatedAt) return;

        const calculateTimeLeft = () => {
            const lastUpdate = new Date(user.updatedAt).getTime();
            const now = Date.now();
            const diffSeconds = Math.floor((now - lastUpdate) / 1000);
            const remaining = (5 * 60) - diffSeconds;
            return remaining > 0 ? remaining : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [user?.updatedAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // No mostramos nada si el usuario ya está activo
    if (!isInactive && !isPending) return null;

    const handleActivate = async () => {
        if (!phone || phone.length < 10) {
            setMessage({ text: "Por favor carga un teléfono válido con código de país.", type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/auth/profile/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    whatsappOptIn: true,
                    phone: phone
                })
            });

            const json = await res.json();
            if (!res.ok) {
                setMessage({ text: json.error || "Error al activar WhatsApp.", type: 'error' });
                // Si el error es 429, significa que el timer debería estar activo
                if (res.status === 429 && user) {
                    onRefresh();
                }
            } else {
                setMessage({ text: "¡Mensaje de activación enviado! Entrá a WhatsApp y tocá el botón Activar.", type: 'success' });
                setIsExpanding(false);
                
                // Refrescamos los datos del usuario para que el banner pase a estado 'Pending'
                // y capture la nueva fecha de updatedAt para el timer
                await onRefresh();
            }
        } catch (err) {
            setMessage({ text: "Error de conexión al servidor.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${
            isPending ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200 shadow-sm'
        }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${isPending ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <MessageSquare className={`w-5 h-5 ${isPending ? 'text-amber-600' : 'text-green-600'}`} />
                </div>
                
                <div className="flex-1">
                    {isPending ? (
                        <div className="flex flex-col items-start">
                            <h3 className="text-sm font-semibold text-amber-900">Validación de WhatsApp pendiente</h3>
                            <p className="text-sm text-amber-800 mt-0.5">
                                Te enviamos un mensaje de confirmación. Por favor, revísalo y responde.
                            </p>
                            {timeLeft > 0 && (
                                <div className="mt-2 bg-amber-100/50 border border-amber-200/50 rounded-md px-3 py-1.5 inline-flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <p className="text-xs font-medium text-amber-800">
                                        Por seguridad, podrás solicitar un nuevo envío en <strong className="font-bold">{formatTime(timeLeft)}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-green-900">¡Activá las notificaciones por WhatsApp!</h3>
                            <p className="text-sm text-green-800 mt-0.5">Recibí alertas al instante y gestioná tus ahorros más fácil.</p>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    {!isExpanding && isInactive && (
                        <Button 
                            size="sm" 
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setIsExpanding(true)}
                        >
                            Configurar
                        </Button>
                    )}

                    {isPending && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            onClick={handleActivate}
                            isLoading={isLoading}
                            disabled={timeLeft > 0}
                        >
                            {timeLeft > 0 ? `Reenviar en ${formatTime(timeLeft)}` : 'Reenviar mensaje'}
                        </Button>
                    )}
                </div>
            </div>

            {isExpanding && (
                <div className="mt-4 pt-4 border-t border-green-100 animate-in fade-in slide-in-from-top-1">
                    <div className="max-w-md space-y-3">
                        <p className="text-xs font-semibold text-green-800">Confirmá tu número para recibir el mensaje:</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <PhoneInput
                                value={phone}
                                onChange={(val) => setPhone(val || "")}
                                international
                                defaultCountry="AR"
                                limitMaxLength
                                className="flex items-center h-10 flex-1 rounded-lg border bg-white px-3 py-1 text-sm transition-all focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 border-gray-300"
                                numberInputProps={{
                                    className: "flex-1 bg-transparent border-none focus:ring-0 focus:outline-none h-full w-full px-2"
                                }}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleActivate} isLoading={isLoading}>
                                    Activar ahora
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsExpanding(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mt-3 p-3 rounded-lg text-xs flex items-center space-x-2 animate-in zoom-in-95 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                    {message.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}
        </div>
    );
}
