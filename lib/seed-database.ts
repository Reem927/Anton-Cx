#!/usr/bin/env node

/**
 * Database seeder for Anton Cx
 * Populates Supabase with seed policy data
 * 
 * Usage: npm run db:seed
 */

import { createClient } from '@supabase/supabase-js';
import { SEED_POLICIES } from './seed-data.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Seeding Anton Cx database...\n');

  try {
    // Clear existing seed data (optional)
    console.log('🧹 Clearing existing seed data...');
    const { error: deleteError } = await supabase
      .from('policy_documents')
      .delete()
      .like('id', 'seed-%');

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn('⚠️  Warning clearing data:', deleteError.message);
    }

    // Insert seed policies
    console.log(`📄 Inserting ${SEED_POLICIES.length} policy documents...`);
    
    const { data, error } = await supabase
      .from('policy_documents')
      .insert(SEED_POLICIES)
      .select('id, drug_name, payer_id');

    if (error) {
      console.error('❌ Insert error:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} policy documents`);
    
    // Show summary
    const drugCounts = SEED_POLICIES.reduce((acc, policy) => {
      acc[policy.drug_name] = (acc[policy.drug_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Seed Summary:');
    Object.entries(drugCounts).forEach(([drug, count]) => {
      console.log(`   ${drug}: ${count} policies`);
    });

    console.log('\n🎉 Database seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();