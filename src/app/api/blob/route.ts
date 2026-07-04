import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const blobUrl = searchParams.get('url');

    if (!blobUrl) return new NextResponse('Missing URL', { status: 400 });

    try {
        const response = await fetch(blobUrl, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });
        
        if (!response.ok) throw new Error('Failed to fetch blob');
        
        const blob = await response.blob();
        const filename = searchParams.get('filename') || blobUrl.split('/').pop() || 'factura.pdf';

        return new NextResponse(blob, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`
            }
        });
    } catch (error) {
        return new NextResponse('Error fetching file', { status: 500 });
    }
}
