# Análisis Técnico: Procesamiento de Facturas con IA (Open Source)

Este documento detalla la estrategia propuesta para automatizar la extracción de datos de facturas en la plataforma de Ahorro Inteligente, priorizando la soberanía de datos y la reducción de costos mediante modelos de código abierto.

## 1. Objetivo
Automatizar la extracción de datos clave (Nombre del Servicio, Domicilio, Monto Total) de las facturas subidas por los usuarios para reducir el tiempo de carga manual de los operadores (actualmente 15s por invoice).

## 2. Estrategia: Modelos de Lenguaje de Visión (VLM)
A diferencia del OCR tradicional, los VLMs permiten realizar consultas en lenguaje natural sobre una imagen, eliminando la necesidad de programar reglas por cada proveedor de servicio.

### Modelos Recomendados
- **Moondream2**: Modelo pequeño y ultrarrápido. Ideal para despliegues de bajo costo. Puede procesar facturas en < 1s en hardware modesto.
- **Llama 3.2-Vision**: Mayor precisión en documentos con tipografía compleja o fotos de baja calidad.
- **Donut (Document Understanding Transformer)**: Modelo especializado en convertir imágenes de documentos directamente a JSON estructurado.

## 3. Arquitectura Propuesta

1.  **Subida**: El usuario sube la factura a Vercel Blob (Flujo actual).
2.  **Cola de Procesamiento**: La URL de la factura se envía a un worker (vía Upstash o similar).
3.  **Inferencia**: Un microservicio en Python (desplegable en Hugging Face Endpoints o un VPS con GPU) recibe la imagen y ejecuta el modelo.
    - *Prompt Ejemplo*: "Extract the company name, total amount, and customer address from this invoice in JSON format."
4.  **Actualización**: El resultado se guarda en campos de "Pre-llenado" en Airtable.
5.  **Validación**: El operador revisa los datos sugeridos por la IA, reduciendo el error humano y acelerando el cierre de la gestión.

## 4. Beneficios
- **Costo Fijo**: Se paga por el servidor de inferencia, no por cada factura procesada.
- **Privacidad**: Los datos sensibles no salen de nuestro ecosistema hacia APIs de terceros.
- **Escalabilidad**: El sistema puede procesar miles de facturas mensuales sin aumentar el equipo de operaciones.

---
*Documento generado el 15 de Marzo, 2026 para el equipo de Ahorro Inteligente.*
