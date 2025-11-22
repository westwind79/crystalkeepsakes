// src/app/api/masks/route.ts
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const folderPath = path.join(process.cwd(), 'public', 'img', 'masks');
    const files = fs.readdirSync(folderPath);

    const fileOptions = files.map((file) => ({
      filename: file,
      path: `/img/masks/${file}`,
      displayName: file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }));

    return new Response(JSON.stringify(fileOptions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error reading folder:', error);
    return new Response(JSON.stringify({ error: 'Failed to load files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
