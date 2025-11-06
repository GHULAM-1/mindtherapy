#!/usr/bin/env node

/**
 * Gemini to Supabase AAC Image Generation Pipeline
 *
 * This script generates AAC card images using Google's Gemini 2.5 Flash Image API
 * and stores them in Supabase for the AAC master cards system.
 *
 * Features:
 * - Uses local base images as input
 * - Generates variations using Gemini AI
 * - Uploads to Supabase Storage
 * - Inserts into aac_master_cards table
 *
 * Usage:
 *   node scripts/generate-aac-images.js <path-to-prompts.json>
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
import dotenv from 'dotenv';
const envPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Initialize Supabase with service role key (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);

const BUCKET_NAME = 'emotion-emojis';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const LOCAL_IMAGE_DIR = './generated-images';

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisified question function for readline
 */
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Ensure local image directory exists
 */
function ensureLocalImageDir() {
  if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
    fs.mkdirSync(LOCAL_IMAGE_DIR, { recursive: true });
    console.log(`📁 Created directory: ${LOCAL_IMAGE_DIR}`);
  }
}

/**
 * Insert card record into database and get UUID
 */
async function insertCardRecord(keyword, categoryId, orderIndex, tags) {
  console.log(`💾 Inserting card record for "${keyword}" into database...`);

  try {
    const { data, error } = await supabase
      .from('aac_master_cards')
      .insert([
        {
          category_id: categoryId,
          text: keyword,
          image_url: 'PENDING', // Temporary placeholder
          tags: tags,
          order_index: orderIndex,
          is_active: false, // Will be activated after image is generated
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Card record created with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error(`❌ Error inserting card record: ${error.message}`);
    throw error;
  }
}

/**
 * Update card record with final image URL and activate
 */
async function updateCardRecord(cardId, imageUrl) {
  console.log(`💾 Updating card ${cardId} with image URL...`);

  try {
    const { error } = await supabase
      .from('aac_master_cards')
      .update({
        image_url: imageUrl,
        is_active: true,
      })
      .eq('id', cardId);

    if (error) {
      throw error;
    }

    console.log(`✅ Card record updated and activated`);
  } catch (error) {
    console.error(`❌ Error updating card record: ${error.message}`);
    throw error;
  }
}

/**
 * Read and convert image file to base64
 */
function readImageAsBase64(imagePath) {
  const absolutePath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found: ${absolutePath}`);
  }

  const imageBuffer = fs.readFileSync(absolutePath);
  const base64Image = imageBuffer.toString('base64');

  // Determine mime type from extension
  const ext = path.extname(absolutePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };

  const mimeType = mimeTypes[ext] || 'image/png';

  return { base64Image, mimeType };
}

/**
 * Generate image using Gemini 2.5 Flash Image
 */
async function generateImage(prompt, keyword, imagePath) {
  console.log(`\n🎨 Generating image for keyword: "${keyword}"`);
  console.log(`   Prompt: "${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"`);

  if (imagePath) {
    console.log(`   Base image: ${imagePath}`);
  }

  try {
    let contents = [{ text: prompt }];

    // Add base image if provided
    if (imagePath) {
      const { base64Image, mimeType } = readImageAsBase64(imagePath);
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      });
    }

    // Generate image variation using Gemini 2.5 Flash Image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    // Extract the generated image from response
    let generatedImageBase64 = null;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error('No image generated in response');
    }

    console.log(`✅ Image generated successfully`);

    return {
      imageBase64: generatedImageBase64,
    };
  } catch (error) {
    console.error(`❌ Error generating image: ${error.message}`);
    throw error;
  }
}

/**
 * Save generated image to local directory
 */
function saveImageLocally(imageBase64, cardId) {
  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const localPath = path.join(LOCAL_IMAGE_DIR, `${cardId}.png`);

    fs.writeFileSync(localPath, imageBuffer);
    console.log(`💾 Image saved locally: ${localPath}`);

    return localPath;
  } catch (error) {
    console.error(`❌ Error saving image locally: ${error.message}`);
    throw error;
  }
}

/**
 * Upload image to Supabase Storage (using card ID as filename)
 */
async function uploadToSupabase(imageBase64, cardId) {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Use card ID as filename
    const filename = `${cardId}.png`;

    console.log(`📤 Uploading to Supabase Storage as ${filename}...`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true, // Allow overwrite if exists
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log(`✅ Image uploaded to Supabase Storage`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading to Supabase: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single prompt with retry logic
 */
async function processPromptWithRetry(item, index, total, batchName, itemIndex, batchTotal) {
  const { keyword, prompt, category_id, image_path, order_index = 0, tags = [] } = item;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Batch: ${batchName} | Item ${itemIndex + 1} of ${batchTotal} | Overall ${index + 1} of ${total}`);
  console.log(`Keyword: ${keyword}`);
  console.log(`Category ID: ${category_id}`);
  console.log(`${'='.repeat(60)}`);

  let cardId = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`\n🔄 Retry attempt ${attempt} of ${MAX_RETRIES}...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }

      // Step 1: Insert card record and get UUID (only on first attempt)
      if (!cardId) {
        cardId = await insertCardRecord(keyword, category_id, order_index, tags);
      }

      // Step 2: Generate image with Gemini
      const { imageBase64 } = await generateImage(prompt, keyword, image_path);

      // Step 3: Save image locally with card ID as filename
      const localPath = saveImageLocally(imageBase64, cardId);

      // Step 4: Upload to Supabase Storage
      const publicUrl = await uploadToSupabase(imageBase64, cardId);

      // Step 5: Update card record with final image URL and activate
      await updateCardRecord(cardId, publicUrl);

      console.log(`\n🎉 Success! Card created with ID: ${cardId}`);
      console.log(`   Local: ${localPath}`);
      console.log(`   Remote: ${publicUrl}`);

      return {
        success: true,
        keyword,
        prompt,
        cardId,
        localPath,
        publicUrl,
        attempts: attempt,
        batchName,
      };
    } catch (error) {
      lastError = error;
      console.error(`\n💥 Attempt ${attempt} failed: ${error.message}`);

      if (attempt === MAX_RETRIES) {
        console.error(`❌ All ${MAX_RETRIES} attempts failed for keyword: ${keyword}`);
        // Card record exists but is marked as inactive (is_active = false)
        if (cardId) {
          console.log(`⚠️  Card record ${cardId} remains in database as inactive`);
        }
      }
    }
  }

  return {
    success: false,
    keyword,
    prompt,
    cardId,
    error: lastError.message,
    attempts: MAX_RETRIES,
    batchName,
  };
}

/**
 * Validate JSON structure
 */
function validateJSON(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) {
    errors.push('JSON must be an object');
    return errors;
  }

  const batchKeys = Object.keys(data).filter(key => key.startsWith('batch_'));

  if (batchKeys.length === 0) {
    errors.push('No batches found. Batches should be named batch_1, batch_2, etc.');
    return errors;
  }

  batchKeys.forEach(batchName => {
    const batch = data[batchName];

    if (!Array.isArray(batch)) {
      errors.push(`${batchName} must be an array`);
      return;
    }

    if (batch.length === 0) {
      errors.push(`${batchName} is empty`);
      return;
    }

    batch.forEach((item, index) => {
      if (!item.keyword) {
        errors.push(`${batchName}[${index}] is missing 'keyword' field`);
      }
      if (!item.prompt) {
        errors.push(`${batchName}[${index}] is missing 'prompt' field`);
      }
      if (!item.category_id) {
        errors.push(`${batchName}[${index}] is missing 'category_id' field`);
      }
      if (typeof item.keyword !== 'string') {
        errors.push(`${batchName}[${index}].keyword must be a string`);
      }
      if (typeof item.prompt !== 'string') {
        errors.push(`${batchName}[${index}].prompt must be a string`);
      }
      if (typeof item.category_id !== 'string') {
        errors.push(`${batchName}[${index}].category_id must be a string (UUID)`);
      }
      if (item.image_path && !fs.existsSync(path.isAbsolute(item.image_path) ? item.image_path : path.join(process.cwd(), item.image_path))) {
        errors.push(`${batchName}[${index}].image_path file not found: ${item.image_path}`);
      }
      if (item.tags && !Array.isArray(item.tags)) {
        errors.push(`${batchName}[${index}].tags must be an array`);
      }
    });
  });

  return errors;
}

/**
 * Load and validate JSON file
 */
function loadJSONFile(filePath) {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(content);

    const errors = validateJSON(data);
    if (errors.length > 0) {
      throw new Error(`Invalid JSON structure:\n  - ${errors.join('\n  - ')}`);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Process batches from JSON file
 */
async function processBatches(jsonData) {
  // Extract and sort batch names
  const batchNames = Object.keys(jsonData)
    .filter(key => key.startsWith('batch_'))
    .sort((a, b) => {
      const numA = parseInt(a.split('_')[1]);
      const numB = parseInt(b.split('_')[1]);
      return numA - numB;
    });

  console.log(`\n📦 Found ${batchNames.length} batch(es): ${batchNames.join(', ')}`);

  // Calculate total items
  const totalItems = batchNames.reduce((sum, batchName) => {
    return sum + jsonData[batchName].length;
  }, 0);

  console.log(`📝 Total items to process: ${totalItems}\n`);

  const allResults = [];
  const batchResults = {};
  let overallIndex = 0;

  for (let batchIdx = 0; batchIdx < batchNames.length; batchIdx++) {
    const batchName = batchNames[batchIdx];
    const batch = jsonData[batchName];

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 Processing ${batchName} (${batchIdx + 1}/${batchNames.length})`);
    console.log(`   Items in this batch: ${batch.length}`);
    console.log(`${'═'.repeat(60)}`);

    const batchStartTime = Date.now();
    const results = [];

    for (let i = 0; i < batch.length; i++) {
      const result = await processPromptWithRetry(
        batch[i],
        overallIndex,
        totalItems,
        batchName,
        i,
        batch.length
      );
      results.push(result);
      allResults.push(result);
      overallIndex++;

      // Add delay between requests (except for last item in last batch)
      if (!(batchIdx === batchNames.length - 1 && i === batch.length - 1)) {
        console.log(`\n⏳ Waiting 2 seconds before next generation...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const batchTime = ((Date.now() - batchStartTime) / 1000).toFixed(1);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    batchResults[batchName] = {
      total: batch.length,
      successful,
      failed,
      time: batchTime,
    };

    console.log(`\n✅ ${batchName} completed in ${batchTime}s (${successful}/${batch.length} successful)`);
  }

  return { allResults, batchResults };
}

/**
 * Display final summary
 */
function displaySummary(allResults, batchResults) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 FINAL SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);

  // Batch-level summary
  console.log(`📦 Batch Results:\n`);
  Object.entries(batchResults).forEach(([batchName, stats]) => {
    const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
    console.log(`   ${batchName}:`);
    console.log(`     ✅ Successful: ${stats.successful}/${stats.total} (${successRate}%)`);
    console.log(`     ⏱️  Time: ${stats.time}s`);
    console.log();
  });

  // Overall summary
  const totalSuccessful = allResults.filter(r => r.success).length;
  const totalFailed = allResults.filter(r => !r.success).length;
  const overallSuccessRate = ((totalSuccessful / allResults.length) * 100).toFixed(1);

  console.log(`📈 Overall Results:\n`);
  console.log(`   ✅ Successful: ${totalSuccessful}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📝 Total: ${allResults.length}`);
  console.log(`   📊 Success Rate: ${overallSuccessRate}%\n`);

  // Successful generations
  if (totalSuccessful > 0) {
    console.log(`✅ Successful Generations:\n`);
    allResults
      .filter(r => r.success)
      .forEach((r, i) => {
        const retryInfo = r.attempts > 1 ? ` (after ${r.attempts} attempts)` : '';
        console.log(`   ${i + 1}. [${r.batchName}] ${r.keyword}${retryInfo}`);
        console.log(`      ID: ${r.cardId}`);
        console.log(`      Local: ${r.localPath}`);
        console.log(`      Remote: ${r.publicUrl}\n`);
      });
  }

  // Failed generations
  if (totalFailed > 0) {
    console.log(`❌ Failed Generations:\n`);
    allResults
      .filter(r => !r.success)
      .forEach((r, i) => {
        console.log(`   ${i + 1}. [${r.batchName}] ${r.keyword}`);
        console.log(`      Prompt: ${r.prompt.substring(0, 60)}...`);
        console.log(`      Error: ${r.error}\n`);
      });
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 Gemini to Supabase AAC Image Generation Pipeline`);
  console.log(`${'═'.repeat(60)}\n`);

  // Verify environment variables
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error('❌ Error: GOOGLE_GENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase credentials not found in .env.local');
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Ensure local image directory exists
  ensureLocalImageDir();

  // Check for JSON file argument
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show help
    console.log(`Usage:`);
    console.log(`  node scripts/generate-aac-images.js <path-to-prompts.json>\n`);
    console.log(`Example:`);
    console.log(`  node scripts/generate-aac-images.js scripts/aac-prompts.json\n`);
    console.log(`JSON Format:`);
    console.log(`  {`);
    console.log(`    "batch_1": [`);
    console.log(`      {`);
    console.log(`        "keyword": "happy",`);
    console.log(`        "prompt": "Create a warm, child-friendly image...",`);
    console.log(`        "category_id": "uuid-from-aac_master_categories",`);
    console.log(`        "image_path": "./images/base.png",`);
    console.log(`        "order_index": 0,`);
    console.log(`        "tags": ["emotion", "positive"]`);
    console.log(`      }`);
    console.log(`    ]`);
    console.log(`  }\n`);
    process.exit(0);
  } else if (args[0] === '--help' || args[0] === '-h') {
    // Show help
    console.log(`Usage:`);
    console.log(`  node scripts/generate-aac-images.js <path-to-prompts.json>\n`);
    process.exit(0);
  } else {
    // Batch processing mode
    const jsonFilePath = args[0];

    try {
      console.log(`📂 Loading JSON file: ${jsonFilePath}\n`);
      const jsonData = loadJSONFile(jsonFilePath);
      console.log(`✅ JSON file loaded and validated successfully`);

      const { allResults, batchResults } = await processBatches(jsonData);
      displaySummary(allResults, batchResults);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`\n✨ Pipeline completed!\n`);
  rl.close();
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  rl.close();
  process.exit(1);
});
