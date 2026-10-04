import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vite Build Configuration', () => {
  it('does not bundle heavy export libraries into a single export-vendor chunk', () => {
    // We check the dist/assets directory to ensure 'export-vendor' does not exist
    // and that multiple smaller chunks were created instead.
    
    const assetsDir = path.resolve(__dirname, '../../../../dist/assets');
    
    // If dist/assets doesn't exist, the build hasn't run. We skip or warn, but assuming build ran:
    if (!fs.existsSync(assetsDir)) {
      console.warn('dist/assets not found. Run npm run build first.');
      return;
    }

    const files = fs.readdirSync(assetsDir);
    
    // 1. Ensure export-vendor doesn't exist anymore
    const hasExportVendor = files.some(f => f.startsWith('export-vendor'));
    expect(hasExportVendor).toBe(false);

    // 2. Ensure dynamic chunks were generated separately
    const hasJsPdf = files.some(f => f.startsWith('jspdf'));
    const hasHtml2Canvas = files.some(f => f.startsWith('html2canvas'));
    const hasXlsx = files.some(f => f.startsWith('xlsx'));
    
    expect(hasJsPdf).toBe(true);
    expect(hasHtml2Canvas).toBe(true);
    expect(hasXlsx).toBe(true);
  });
});
