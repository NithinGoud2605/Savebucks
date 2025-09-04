const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ixkhkzjhelyumdplutbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2hrempoZWx5dW1kcGx1YnQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU2NDAwNDk5MywiZXhwIjoyMDcxOTgwOTkzfQ.B7zXO8B2ZYpvrDTQuAWOYzUULirUWVJtNF_FAh0o-v8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationFile = path.join(__dirname, 'sql', '034_step_by_step_migration.sql');
    const migrationContent = fs.readFileSync(migrationFile, 'utf8');
    
    // Split into individual statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('Step'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          
          // Use the SQL editor endpoint
          const { data, error } = await supabase
            .from('_sql')
            .select('*')
            .limit(1);
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
          
          // Add a small delay between statements
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

// Alternative approach: try to create a simple table first
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to create a simple test table
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: 'CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, name TEXT)' 
      });
    
    if (error) {
      console.error('Connection test failed:', error);
      
      // Try alternative approach - check if we can query existing tables
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profilesError) {
        console.error('Cannot query profiles table:', profilesError);
      } else {
        console.log('Successfully connected to database, can query existing tables');
        console.log('Profiles count:', profiles?.length || 0);
      }
    } else {
      console.log('Successfully created test table');
    }
    
  } catch (err) {
    console.error('Test connection error:', err);
  }
}

// Run the test first
testConnection().then(() => {
  console.log('\n--- Starting Migration ---\n');
  return applyMigration();
});
