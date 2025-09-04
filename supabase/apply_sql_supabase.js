const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ixkhkzjhelyumdplutbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2hrempoZWx5dW1kcGx1YnQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU2NDAwNDk5MywiZXhwIjoyMDcxOTgwOTkzfQ.B7zXO8B2ZYpvrDTQuAWOYzUULirUWVJtNF_FAh0o-v8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQL() {
  try {
    console.log('Reading SQL file...');
    const sqlFile = path.join(__dirname, 'sql', '033_company_enhancements.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Applying SQL file using Supabase RPC...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
            // Continue with next statement
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('SQL file application completed!');
    
  } catch (error) {
    console.error('Error applying SQL:', error);
  }
}

applySQL();
