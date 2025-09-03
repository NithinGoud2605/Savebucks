import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://ixkhkzjhelyumdplutbz.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2hrempoZWx5dW1kcGx1dGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQwNDk5MywiZXhwIjoyMDcxOTgwOTkzfQ.B7zXO8B2ZYpvrDTQuAWOYzUULirUWVJtNF_FAh0o-v8';

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkDatabase() {
  console.log('🔍 Checking database schema and data...\n');

  try {
    // 1. Check what columns actually exist in profiles table
    console.log('1. Checking profiles table schema...');
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
      } else {
        console.log('✅ Profiles table exists');
        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          console.log('📊 Sample profile:', profile);
          console.log('🔍 Available columns:', Object.keys(profile));
          
          // Check if role column exists
          if (profile.hasOwnProperty('role')) {
            console.log('✅ Role column exists in profiles table');
          } else {
            console.log('❌ Role column missing from profiles table');
          }
        }
      }
    } catch (e) {
      console.log('❌ Profiles table check failed:', e.message);
    }

    // 2. Check what columns actually exist in deals table
    console.log('\n2. Checking deals table schema...');
    try {
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .limit(1);
      
      if (dealsError) {
        console.error('❌ Error fetching deals:', dealsError);
      } else {
        console.log('✅ Deals table exists');
        if (deals && deals.length > 0) {
          const deal = deals[0];
          console.log('📊 Sample deal:', deal);
          console.log('🔍 Available columns:', Object.keys(deal));
          
          // Check if status column exists
          if (deal.hasOwnProperty('status')) {
            console.log('✅ Status column exists in deals table');
          } else {
            console.log('❌ Status column missing from deals table');
          }
        }
      }
    } catch (e) {
      console.log('❌ Deals table check failed:', e.message);
    }

    // 3. Check if role_enum type exists by trying to create a test query
    console.log('\n3. Checking role_enum type...');
    try {
      // Try to query with role filter to see if enum works
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(3);
      
      if (adminError) {
        console.error('❌ Error querying admin users:', adminError);
        if (adminError.message.includes('does not exist')) {
          console.log('❌ role_enum type does not exist');
        }
      } else {
        console.log('✅ role_enum type exists and works');
        console.log('👑 Admin users found:', adminUsers);
      }
    } catch (e) {
      console.log('❌ role_enum check failed:', e.message);
    }

    // 4. Check is_admin function
    console.log('\n4. Checking is_admin function...');
    try {
      const { data: isAdminCheck, error: isAdminError } = await supabase
        .rpc('is_admin');
      
      if (isAdminError) {
        console.error('❌ Error calling is_admin function:', isAdminError);
      } else {
        console.log('✅ is_admin function works, result:', isAdminCheck);
      }
    } catch (e) {
      console.log('❌ is_admin function failed:', e.message);
    }

    // 5. Check votes table and triggers
    console.log('\n5. Checking votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(5);

    if (votesError) {
      console.error('❌ Error fetching votes:', votesError);
    } else {
      console.log('✅ Votes table exists');
      console.log('📊 Sample votes:', votes);
      if (votes && votes.length > 0) {
        console.log('🔍 Votes table columns:', Object.keys(votes[0]));
      }
    }

    // 6. Check if there are any admin users (using available columns)
    console.log('\n6. Checking for admin users...');
    try {
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

      if (adminError) {
        console.error('❌ Error fetching admin users:', adminError);
      } else {
        console.log(`✅ Found ${adminUsers.length} admin users`);
        if (adminUsers.length > 0) {
          console.log('👑 Admin users:', adminUsers);
        } else {
          console.log('⚠️ No admin users found - this explains the access denied errors');
        }
      }
    } catch (e) {
      console.log('❌ Admin users check failed:', e.message);
    }

    // 7. Check database functions and triggers
    console.log('\n7. Checking database functions...');
    try {
      const { data: functions, error: funcError } = await supabase
        .rpc('get_votes_for_deal', { p_deal_id: 1 });
      
      if (funcError) {
        console.error('❌ Error calling get_votes_for_deal:', funcError);
      } else {
        console.log('✅ get_votes_for_deal function works');
      }
    } catch (e) {
      console.log('❌ get_votes_for_deal function failed:', e.message);
    }

    // 8. Check RLS policies
    console.log('\n8. Checking RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (policyError) {
        console.error('❌ RLS policy error:', policyError);
      } else {
        console.log('✅ RLS policies allow reading profiles');
      }
    } catch (e) {
      console.log('❌ RLS policy check failed:', e.message);
    }

    // 9. Check if we can see any users at all
    console.log('\n9. Checking if we can see any users...');
    try {
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);
      
      if (allUsersError) {
        console.error('❌ Error fetching all users:', allUsersError);
      } else {
        console.log(`✅ Found ${allUsers.length} total users`);
        if (allUsers.length > 0) {
          console.log('👥 Sample users:', allUsers.map(u => ({ id: u.id, handle: u.handle, role: u.role })));
        }
      }
    } catch (e) {
      console.log('❌ All users check failed:', e.message);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkDatabase().then(() => {
  console.log('\n✅ Database check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Database check failed:', error);
  process.exit(1);
});
