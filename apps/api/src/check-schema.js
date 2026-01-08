
import { makeAdminClient } from './lib/supa.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env' });

const supabase = makeAdminClient();

async function checkSchema() {
    console.log('Checking deals table schema...');

    // Just select one row to distinguish columns
    const { data, error } = await supabase.from('deals').select('*').limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data found, cannot infer columns, but query worked.');
    }
}

checkSchema();
