#!/usr/bin/env node

/**
 * Get AAC Category UUIDs
 * Fetches existing category UUIDs and saves them to JSON
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Supabase with service role key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
  console.error('   SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);

async function getCategoryUUIDs() {
  console.log('\n🔍 Fetching AAC Category UUIDs...\n');

  try {
    const { data, error } = await supabase
      .from('aac_master_categories')
      .select('name, id, display_name, icon')
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ No categories found. Please insert them first.');
      process.exit(1);
    }

    // Create mapping object
    const uuidMap = {};
    data.forEach(cat => {
      uuidMap[cat.name] = cat.id;
      console.log(`✅ ${cat.display_name} (${cat.icon}): ${cat.id}`);
    });

    // Save to JSON file
    const outputPath = path.join(__dirname, 'category-uuids.json');
    fs.writeFileSync(outputPath, JSON.stringify(uuidMap, null, 2));

    console.log(`\n💾 UUIDs saved to: ${outputPath}\n`);

    return uuidMap;
  } catch (error) {
    console.error('\n❌ Error fetching categories:', error.message);
    process.exit(1);
  }
}

getCategoryUUIDs()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
