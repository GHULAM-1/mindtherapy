#!/usr/bin/env node

/**
 * Insert AAC Master Categories
 *
 * This script inserts the 5 AAC categories into the database
 * and saves their UUIDs to a JSON file for use in prompts.
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

// Initialize Supabase with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: 'food', display_name: 'Food', icon: '🍽️', order_index: 0 },
  { name: 'activities', display_name: 'Activities', icon: '⚽', order_index: 1 },
  { name: 'emotions', display_name: 'Emotions', icon: '😊', order_index: 2 },
  { name: 'people', display_name: 'People', icon: '👥', order_index: 3 },
  { name: 'objects', display_name: 'Objects', icon: '📦', order_index: 4 },
];

async function insertCategories() {
  console.log('\n🚀 Inserting AAC Master Categories...\n');

  try {
    const results = {};

    for (const category of categories) {
      console.log(`📦 Inserting category: ${category.display_name}...`);

      // Try to insert, or get existing
      const { data, error } = await supabase
        .from('aac_master_categories')
        .upsert([
          {
            name: category.name,
            display_name: category.display_name,
            icon: category.icon,
            order_index: category.order_index,
            is_active: true,
          },
        ], {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        // If upsert fails due to conflict, try to get existing
        if (error.code === '23505') {
          console.log(`   ⚠️  Category already exists, fetching...`);
          const { data: existing, error: fetchError } = await supabase
            .from('aac_master_categories')
            .select('*')
            .eq('name', category.name)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          results[category.name] = existing.id;
          console.log(`   ✅ ${category.display_name}: ${existing.id}`);
        } else {
          throw error;
        }
      } else {
        results[category.name] = data.id;
        console.log(`   ✅ ${category.display_name}: ${data.id}`);
      }
    }

    // Save UUIDs to JSON file
    const outputPath = path.join(__dirname, 'category-uuids.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n💾 Category UUIDs saved to: ${outputPath}`);
    console.log('\n📊 Category Mapping:');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n✅ All categories inserted successfully!\n');

    return results;
  } catch (error) {
    console.error('\n❌ Error inserting categories:', error.message);
    process.exit(1);
  }
}

// Run the script
insertCategories()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
