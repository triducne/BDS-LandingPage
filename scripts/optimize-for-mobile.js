#!/usr/bin/env node
/**
 * Mobile Performance Optimization Script
 * Optimizes images, fonts, and assets for mobile delivery
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const IMAGE_DIR = path.join(WORKSPACE_ROOT, 'images');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, '.reports');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const report = {
    timestamp: new Date().toISOString(),
    optimized: [],
    skipped: [],
    errors: [],
    stats: {
        totalImages: 0,
        optimizedImages: 0,
        totalSizeReduction: 0
    }
};

async function optimizeImagesForMobile() {
    console.log('🚀 Starting mobile optimization...\n');

    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const skipPatterns = ['.bak', '.webp', 'favicon'];

    function getFiles(dir) {
        let files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    files = files.concat(getFiles(fullPath));
                } else if (imageExtensions.includes(path.extname(entry.name).toLowerCase())) {
                    if (!skipPatterns.some(pattern => entry.name.includes(pattern))) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${dir}:`, err.message);
        }
        return files;
    }

    const imageFiles = getFiles(IMAGE_DIR);
    report.stats.totalImages = imageFiles.length;

    console.log(`📷 Found ${imageFiles.length} images to process\n`);

    for (const imagePath of imageFiles) {
        try {
            const fileName = path.basename(imagePath);
            const ext = path.extname(imagePath).toLowerCase();
            const baseName = path.basename(imagePath, ext);
            const dir = path.dirname(imagePath);
            const webpPath = path.join(dir, `${baseName}.webp`);

            // Check if WebP already exists
            if (fs.existsSync(webpPath)) {
                const webpSize = fs.statSync(webpPath).size;
                report.skipped.push({
                    file: fileName,
                    reason: 'WebP version already exists',
                    webpSize
                });
                console.log(`⏭️  ${fileName} → Already optimized`);
                continue;
            }

            const originalStats = fs.statSync(imagePath);
            const originalSize = originalStats.size;

            // Convert to WebP with mobile-optimized quality
            await sharp(imagePath)
                .webp({ quality: 80, effort: 6 })
                .toFile(webpPath);

            const webpStats = fs.statSync(webpPath);
            const webpSize = webpStats.size;
            const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);

            report.optimized.push({
                file: fileName,
                originalPath: imagePath,
                webpPath: webpPath,
                originalSize: originalSize,
                webpSize: webpSize,
                reduction: `${reduction}%`
            });

            report.stats.optimizedImages++;
            report.stats.totalSizeReduction += (originalSize - webpSize);

            console.log(`✅ ${fileName}`);
            console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → WebP: ${(webpSize / 1024).toFixed(1)}KB (${reduction}% smaller)\n`);

        } catch (error) {
            report.errors.push({
                file: path.basename(imagePath),
                error: error.message
            });
            console.error(`❌ Error processing ${path.basename(imagePath)}: ${error.message}\n`);
        }
    }

    // Generate report
    const reportPath = path.join(OUTPUT_DIR, 'mobile-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Optimization Report:');
    console.log(`   Total Images: ${report.stats.totalImages}`);
    console.log(`   Optimized: ${report.stats.optimizedImages}`);
    console.log(`   Skipped: ${report.skipped.length}`);
    console.log(`   Errors: ${report.errors.length}`);
    console.log(`   Total Size Reduction: ${(report.stats.totalSizeReduction / 1024 / 1024).toFixed(2)}MB`);
    console.log(`\n📁 Report saved to: ${reportPath}\n`);
}

optimizeImagesForMobile().catch(console.error);
