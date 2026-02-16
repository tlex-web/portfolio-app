#!/usr/bin/env node

/**
 * Image Optimization Script for Portfolio App
 *
 * Optimizes source images in public/images/optimized/ for production use.
 * Creates responsive variants (640, 1024, 1920) in WebP, AVIF, and JPEG formats.
 *
 * Features:
 * - Converts to WebP and AVIF formats (superior compression)
 * - Creates responsive sizes: sm (640), md (1024), lg (1920)
 * - Generates optimized JPEGs as fallback
 * - Idempotent: skips processing when outputs are up-to-date
 * - Handles missing source images gracefully (exit 0)
 * - Creates a manifest file for tracking
 *
 * Usage:
 *   npm run optimize-images
 *   node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Input and output are the same directory: source images live alongside optimized variants
  inputDir: path.join(__dirname, '..', 'public', 'images', 'optimized'),
  outputDir: path.join(__dirname, '..', 'public', 'images', 'optimized'),
  quality: {
    webp: 82,
    avif: 50,
    jpeg: 82,
  },
  sizes: {
    sm: { width: 640, suffix: '-sm' },
    md: { width: 1024, suffix: '-md' },
    lg: { width: 1920, suffix: '-lg' },
  },
  formats: ['webp', 'avif', 'jpeg'],
};

// Suffixes used by old and new variants -- used to filter source images
const VARIANT_SUFFIXES = ['-thumb', '-medium', '-large', '-sm', '-md', '-lg'];

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
    } else if (args[i] === '--force') {
      config.force = true;
    }
  }

  return config;
}

// Get source image files from directory (only original-size JPEGs, no variants)
async function getImageFiles(dir) {
  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  return files.filter((file) => {
    // Only JPEG/PNG/TIFF source files
    if (!/\.(jpg|jpeg|png|tiff)$/i.test(file)) return false;

    // Exclude variant files (those with size suffixes before extension)
    const baseName = file.replace(/\.(jpg|jpeg|png|tiff)$/i, '');
    return !VARIANT_SUFFIXES.some((suffix) => baseName.endsWith(suffix));
  });
}

// Build the list of expected output files for a given source image
function getExpectedOutputs(filename, config) {
  const outputs = [];
  for (const sizeConfig of Object.values(config.sizes)) {
    for (const format of config.formats) {
      const ext = format === 'jpeg' ? 'jpg' : format;
      const outputFilename = filename.replace(
        /\.(jpg|jpeg|png|tiff)$/i,
        `${sizeConfig.suffix}.${ext}`
      );
      outputs.push(outputFilename);
    }
  }
  return outputs;
}

// Check if all outputs exist and are newer than the source file
async function isUpToDate(sourceFile, config) {
  const sourcePath = path.join(config.inputDir, sourceFile);
  let sourceStat;
  try {
    sourceStat = await fs.stat(sourcePath);
  } catch {
    return false;
  }

  const expectedOutputs = getExpectedOutputs(sourceFile, config);
  for (const output of expectedOutputs) {
    const outputPath = path.join(config.outputDir, output);
    try {
      const outputStat = await fs.stat(outputPath);
      if (outputStat.mtimeMs < sourceStat.mtimeMs) {
        return false; // Output is older than source
      }
    } catch {
      return false; // Output does not exist
    }
  }
  return true;
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

    console.log(`\nProcessing: ${filename}`);
    console.log(
      `   Original: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB (${metadata.width}x${metadata.height})`
    );

    // Process each size variant
    for (const [sizeName, sizeConfig] of Object.entries(config.sizes)) {
      // Resize
      let resized = image.clone().resize({
        width: sizeConfig.width,
        withoutEnlargement: true,
        fit: 'inside',
      });

      // Process each format
      for (const format of config.formats) {
        const ext = format === 'jpeg' ? 'jpg' : format;
        const outputFilename = filename.replace(
          /\.(jpg|jpeg|png|tiff)$/i,
          `${sizeConfig.suffix}.${ext}`
        );
        const outputPath = path.join(outputDir, outputFilename);

        let processor;
        // Configure format-specific options
        if (format === 'webp') {
          processor = resized.clone().webp({
            quality: config.quality.webp,
            effort: 6,
          });
        } else if (format === 'avif') {
          processor = resized.clone().avif({
            quality: config.quality.avif,
            effort: 4,
          });
        } else if (format === 'jpeg') {
          processor = resized.clone().jpeg({
            quality: config.quality.jpeg,
            progressive: true,
            mozjpeg: true,
          });
        }

        // Save the file
        await processor.toFile(outputPath);

        const outputStats = await fs.stat(outputPath);
        const key = `${sizeName}_${format}`;
        stats.optimizedSizes[key] = {
          path: outputFilename,
          size: outputStats.size,
          sizeMB: (outputStats.size / 1024 / 1024).toFixed(2),
        };

        const saved = (
          (1 - outputStats.size / stats.originalSize) *
          100
        ).toFixed(1);
        console.log(
          `   + ${sizeName} (${format}): ${(outputStats.size / 1024 / 1024).toFixed(2)} MB (${saved}% smaller)`
        );
      }
    }

    return stats;
  } catch (error) {
    console.error(`   x Error processing ${filename}:`, error.message);
    return null;
  }
}

// Generate manifest file
async function generateManifest(optimizationStats, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    images: optimizationStats.filter((s) => s !== null),
  };

  // Calculate totals
  manifest.images.forEach((img) => {
    manifest.totalOriginalSize += img.originalSize;
    Object.values(img.optimizedSizes).forEach((size) => {
      manifest.totalOptimizedSize += size.size;
    });
  });

  const totalSaved = manifest.totalOriginalSize - manifest.totalOptimizedSize;
  const percentSaved = (
    (totalSaved / manifest.totalOriginalSize) *
    100
  ).toFixed(1);

  manifest.summary = {
    totalImages: manifest.images.length,
    totalOriginalSizeMB: (manifest.totalOriginalSize / 1024 / 1024).toFixed(2),
    totalOptimizedSizeMB: (
      manifest.totalOptimizedSize /
      1024 /
      1024
    ).toFixed(2),
    totalSavedMB: (totalSaved / 1024 / 1024).toFixed(2),
    percentSaved: `${percentSaved}%`,
  };

  const manifestPath = path.join(outputDir, 'optimization-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

// Print summary
function printSummary(manifest) {
  console.log('\n' + '='.repeat(70));
  console.log('OPTIMIZATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nProcessed: ${manifest.summary.totalImages} images`);
  console.log(`Original size: ${manifest.summary.totalOriginalSizeMB} MB`);
  console.log(`Optimized size: ${manifest.summary.totalOptimizedSizeMB} MB`);
  console.log(
    `Total saved: ${manifest.summary.totalSavedMB} MB (${manifest.summary.percentSaved})`
  );
  console.log('='.repeat(70) + '\n');
}

// Main execution
async function main() {
  const config = parseArgs();

  console.log('Image Optimization Script');
  console.log('==========================\n');
  console.log(`Input:  ${config.inputDir}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(
    `Quality: webp=${config.quality.webp}, avif=${config.quality.avif}, jpeg=${config.quality.jpeg}\n`
  );

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(config.outputDir, { recursive: true });

    // Get source images (excludes variant files)
    const imageFiles = await getImageFiles(config.inputDir);

    if (imageFiles.length === 0) {
      console.log(
        'No source images found, skipping optimization.'
      );
      process.exit(0);
    }

    console.log(`Found ${imageFiles.length} source images\n`);

    // Idempotency check: skip if all outputs are up-to-date
    if (!config.force) {
      const upToDateChecks = await Promise.all(
        imageFiles.map((file) => isUpToDate(file, config))
      );
      if (upToDateChecks.every(Boolean)) {
        console.log('Images already optimized and up-to-date. Skipping.');
        process.exit(0);
      }
    }

    // Process all images
    const optimizationStats = [];
    for (const file of imageFiles) {
      const inputPath = path.join(config.inputDir, file);
      const stats = await optimizeImage(
        inputPath,
        config.outputDir,
        file,
        config
      );
      optimizationStats.push(stats);
    }

    // Generate manifest
    const manifest = await generateManifest(
      optimizationStats,
      config.outputDir
    );

    // Print summary
    printSummary(manifest);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
