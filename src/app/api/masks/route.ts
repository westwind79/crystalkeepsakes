// app/api/masks/route.ts
// Returns list of available mask images for the admin panel

import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const masksDir = join(process.cwd(), 'public', 'img', 'masks');
    
    // Check if masks directory exists
    if (!existsSync(masksDir)) {
      console.warn('⚠️ Masks directory does not exist:', masksDir);
      return NextResponse.json([]);
    }

    // Read all files in masks directory
    const files = await readdir(masksDir);
    
    // Filter for image files only
    const maskFiles = files
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `/img/masks/${file}`,
        displayName: file
          .replace(/-mask\.(png|jpg|jpeg|webp)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\.(png|jpg|jpeg|webp)$/i, '')
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    console.log(`✅ Found ${maskFiles.length} mask files`);
    
    return NextResponse.json(maskFiles);

  } catch (error) {
    console.error('❌ Error reading masks directory:', error);
    return NextResponse.json([], { status: 500 });
  }
}