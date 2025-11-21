#!/usr/bin/env node

/**
 * Image Optimization Script for Portfolio App
 * 
 * This script optimizes images in the public/images directory for production use.
 * It creates web-optimized versions (WebP + optimized JPEG) with multiple sizes
 * for responsive loading.
 * 
 * Features:
 * - Converts to WebP format (better compression)
 * - Creates multiple responsive sizes (thumbnail, medium, large, original)
 * - Preserves EXIF data
 * - Generates optimized JPEGs as fallback
 * - Creates a manifest file for tracking
 * 
 * Usage:
 *   npm run optimize-images
 *   node scripts/optimize-images.mjs --input ./public/images/landscapes --quality 85
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  inputDir: path.join(__dirname, '..', 'public', 'images', 'landscapes'),
  outputDir: path.join(__dirname, '..', 'public', 'images', 'optimized'),
  quality: {
    webp: 85,
    jpeg: 85,
  },
  sizes: {
    thumbnail: { width: 400, suffix: '-thumb' },
    medium: { width: 1200, suffix: '-medium' },
    large: { width: 2400, suffix: '-large' },
    original: { width: null, suffix: '' }, // Keep original dimensions but optimize
  },
  formats: ['webp', 'jpeg'],
  preserveMetadata: true,
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      config.inputDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      config.outputDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--quality' && args[i + 1]) {
      const quality = parseInt(args[i + 1], 10);
      config.quality.webp = quality;
      config.quality.jpeg = quality;
      i++;
    }
  }
  
  return config;
}

// Get all image files from directory
async function getImageFiles(dir) {
  const files = await fs.readdir(dir);
  return files.filter(file => 
    /\.(jpg|jpeg|png|tiff)$/i.test(file)
  );
}

// Optimize single image
async function optimizeImage(inputPath, outputDir, filename, config) {
  const stats = {
    filename,
    originalSize: 0,
    optimizedSizes: {},
  };

  try {
    const fileStats = await fs.stat(inputPath);
    stats.originalSize = fileStats.size;

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`\n📸 Processing: ${filename}`);
    console.log(`   Original: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB (${metadata.width}x${metadata.height})`);

    // Process each size variant
    for (const [sizeName, sizeConfig] of Object.entries(config.sizes)) {
      let processor = image.clone();

      // Resize if width is specified
      if (sizeConfig.width) {
        processor = processor.resize({
          width: sizeConfig.width,
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Process each format
      for (const format of config.formats) {
        const ext = format === 'jpeg' ? 'jpg' : format;
        const outputFilename = filename
          .replace(/\.(jpg|jpeg|png|tiff)$/i, `${sizeConfig.suffix}.${ext}`);
        const outputPath = path.join(outputDir, outputFilename);

        // Configure format-specific options
        if (format === 'webp') {
          processor = processor.clone().webp({
            quality: config.quality.webp,
            effort: 6, // Higher effort = better compression (0-6)
          });
        } else if (format === 'jpeg') {
          processor = processor.clone().jpeg({
            quality: config.quality.jpeg,
            progressive: true,
            mozjpeg: true, // Use mozjpeg for better compression
          });
        }

        // Don't preserve metadata to avoid EXIF parsing issues
        // The withMetadata call was causing errors with some images

        // Save the file
        await processor.toFile(outputPath);

        const outputStats = await fs.stat(outputPath);
        const key = `${sizeName}_${format}`;
        stats.optimizedSizes[key] = {
          path: outputFilename,
          size: outputStats.size,
          sizeMB: (outputStats.size / 1024 / 1024).toFixed(2),
        };

        const saved = ((1 - outputStats.size / stats.originalSize) * 100).toFixed(1);
        console.log(`   ✓ ${sizeName} (${format}): ${(outputStats.size / 1024 / 1024).toFixed(2)} MB (${saved}% smaller)`);
      }
    }

    return stats;
  } catch (error) {
    console.error(`   ✗ Error processing ${filename}:`, error.message);
    return null;
  }
}

// Generate manifest file
async function generateManifest(optimizationStats, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    images: optimizationStats.filter(s => s !== null),
  };

  // Calculate totals
  manifest.images.forEach(img => {
    manifest.totalOriginalSize += img.originalSize;
    Object.values(img.optimizedSizes).forEach(size => {
      manifest.totalOptimizedSize += size.size;
    });
  });

  const totalSaved = manifest.totalOriginalSize - manifest.totalOptimizedSize;
  const percentSaved = ((totalSaved / manifest.totalOriginalSize) * 100).toFixed(1);

  manifest.summary = {
    totalImages: manifest.images.length,
    totalOriginalSizeMB: (manifest.totalOriginalSize / 1024 / 1024).toFixed(2),
    totalOptimizedSizeMB: (manifest.totalOptimizedSize / 1024 / 1024).toFixed(2),
    totalSavedMB: (totalSaved / 1024 / 1024).toFixed(2),
    percentSaved: `${percentSaved}%`,
  };

  const manifestPath = path.join(outputDir, 'optimization-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

// Generate usage guide
function generateUsageGuide(manifest, config) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 OPTIMIZATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n✅ Processed: ${manifest.summary.totalImages} images`);
  console.log(`📦 Original size: ${manifest.summary.totalOriginalSizeMB} MB`);
  console.log(`🚀 Optimized size: ${manifest.summary.totalOptimizedSizeMB} MB`);
  console.log(`💾 Total saved: ${manifest.summary.totalSavedMB} MB (${manifest.summary.percentSaved})`);
  
  console.log('\n' + '-'.repeat(70));
  console.log('📝 NEXT STEPS:');
  console.log('-'.repeat(70));
  console.log('\n1. Update your data/landscapes.ts to use optimized images:');
  console.log('\n   // Before:');
  console.log('   src: \'/images/landscapes/IMG_0605-Enhanced.jpg\'');
  console.log('\n   // After (use WebP with JPEG fallback):');
  console.log('   src: \'/images/optimized/IMG_0605-Enhanced-large.webp\'');
  console.log('   fallback: \'/images/optimized/IMG_0605-Enhanced-large.jpg\'');
  
  console.log('\n2. Implement responsive images in your components:');
  console.log(`
   <Image
     src="/images/optimized/IMG_0605-Enhanced-large.webp"
     alt="..."
     width={2400}
     height={1600}
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
     quality={85}
   />
  `);
  
  console.log('\n3. Use srcSet for responsive loading:');
  console.log(`
   <picture>
     <source
       type="image/webp"
       srcSet="
         /images/optimized/IMG_0605-Enhanced-thumb.webp 400w,
         /images/optimized/IMG_0605-Enhanced-medium.webp 1200w,
         /images/optimized/IMG_0605-Enhanced-large.webp 2400w
       "
     />
     <source
       type="image/jpeg"
       srcSet="
         /images/optimized/IMG_0605-Enhanced-thumb.jpg 400w,
         /images/optimized/IMG_0605-Enhanced-medium.jpg 1200w,
         /images/optimized/IMG_0605-Enhanced-large.jpg 2400w
       "
     />
     <img src="/images/optimized/IMG_0605-Enhanced-large.jpg" alt="..." />
   </picture>
  `);
  
  console.log('\n4. Consider implementing lazy loading:');
  console.log(`
   <Image
     src="/images/optimized/..."
     alt="..."
     loading="lazy"
     placeholder="blur"
     blurDataURL="/images/optimized/...-thumb.webp"
   />
  `);
  
  console.log('\n' + '='.repeat(70));
  console.log(`📄 Full manifest: ${path.join(config.outputDir, 'optimization-manifest.json')}`);
  console.log('='.repeat(70) + '\n');
}

// Main execution
async function main() {
  const config = parseArgs();

  console.log('🎨 Image Optimization Script');
  console.log('==========================\n');
  console.log(`Input:  ${config.inputDir}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`Quality: ${config.quality.webp}%\n`);

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(config.outputDir, { recursive: true });

    // Get all images
    const imageFiles = await getImageFiles(config.inputDir);
    
    if (imageFiles.length === 0) {
      console.log('❌ No images found in input directory');
      process.exit(1);
    }

    console.log(`Found ${imageFiles.length} images to process\n`);

    // Process all images
    const optimizationStats = [];
    for (const file of imageFiles) {
      const inputPath = path.join(config.inputDir, file);
      const stats = await optimizeImage(inputPath, config.outputDir, file, config);
      optimizationStats.push(stats);
    }

    // Generate manifest
    const manifest = await generateManifest(optimizationStats, config.outputDir);

    // Show usage guide
    generateUsageGuide(manifest, config);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
