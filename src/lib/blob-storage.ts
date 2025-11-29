import { put } from '@vercel/blob';

export async function uploadFile(file: File, filename: string): Promise<string> {
    const blob = await put(filename, file, {
        access: 'public',
    });

    return blob.url;
}
