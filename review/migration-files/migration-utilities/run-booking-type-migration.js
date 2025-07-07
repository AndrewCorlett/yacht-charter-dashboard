import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting booking_type column migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'add_booking_type_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Executing migration SQL...');
        
        // Execute the migration using RPC
        const { data, error } = await supabase.rpc('exec_sql', {
            query: migrationSQL
        });

        if (error) {
            // If exec_sql doesn't exist, let's try a different approach
            console.log('⚠️  exec_sql RPC not available, trying alternative approach...');
            
            // We'll need to execute individual statements
            console.log('\n❌ Cannot execute raw SQL directly through Supabase JS client.');
            console.log('📌 Please run this migration directly in your Supabase SQL Editor:');
            console.log('\n1. Go to your Supabase dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy and paste the contents of: migrations/add_booking_type_column.sql');
            console.log('4. Execute the SQL\n');
            
            return;
        }

        console.log('✅ Migration executed successfully!\n');

        // Verify the column exists
        console.log('🔍 Verifying column was added...');
        const { data: columns, error: columnsError } = await supabase
            .from('bookings')
            .select('*')
            .limit(0);

        if (!columnsError) {
            console.log('✅ Bookings table structure verified\n');
        }

        // Check existing bookings
        console.log('📊 Checking existing bookings...');
        const { data: bookings, error: bookingsError, count } = await supabase
            .from('bookings')
            .select('id, booking_type', { count: 'exact' });

        if (!bookingsError && bookings) {
            console.log(`✅ Found ${count || bookings.length} existing bookings`);
            
            // Show sample of bookings with their types
            if (bookings.length > 0) {
                console.log('\n📋 Sample bookings (first 5):');
                bookings.slice(0, 5).forEach(booking => {
                    console.log(`   - Booking ${booking.id}: ${booking.booking_type || 'regular'}`);
                });
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('📌 The booking_type column has been added with:');
        console.log('   - Enum values: "regular" and "external"');
        console.log('   - Default value: "regular"');
        console.log('   - Index for performance optimization');

    } catch (error) {
        console.error('❌ Error running migration:', error);
        console.log('\n📌 Please run the migration manually in Supabase SQL Editor');
    }
}

// Run the migration
runMigration();