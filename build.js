import fs from 'fs-extra';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProject() {
    try {
        // 1. Clear dist directory
        await fs.emptyDir('./dist');

        // 2. Build React app
        await new Promise((resolve, reject) => {
            exec('vite build', (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });

        // 3. Copy required PHP files maintaining structure
        await fs.copy('./api', './dist/api');
        await fs.copy('./config', './dist/config');
        await fs.copy('./vendor', './dist/vendor');
        await fs.copy('./.htaccess', './dist/.htaccess');

        console.log('Build completed successfully!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Execute the build
buildProject();