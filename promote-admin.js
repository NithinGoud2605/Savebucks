#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: node promote-admin.js <user_email>
 * 
 * This script connects to the Supabase database and promotes the specified user to admin role.
 * Make sure you have the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables set.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Please set these in your .env file or environment.')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function promoteToAdmin(userEmail) {
  try {
    console.log(`🔍 Looking for user with email: ${userEmail}`)
    
    // First, find the user in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message)
      return false
    }
    
    const user = authUsers.users.find(u => u.email === userEmail)
    
    if (!user) {
      console.error(`❌ User with email ${userEmail} not found`)
      return false
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)
    
    // Update the profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message)
      return false
    }
    
    console.log('✅ Successfully promoted user to admin!')
    console.log('   Profile:', profile)
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

async function listAdmins() {
  try {
    console.log('🔍 Current admin users:')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, handle, role')
      .eq('role', 'admin')
    
    if (error) {
      console.error('❌ Error fetching admin users:', error.message)
      return
    }
    
    if (profiles.length === 0) {
      console.log('   No admin users found')
    } else {
      profiles.forEach(profile => {
        console.log(`   - ${profile.handle || 'No handle'} (ID: ${profile.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error listing admins:', error.message)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: node promote-admin.js <user_email>')
    console.log('   or: node promote-admin.js --list')
    console.log('')
    console.log('Examples:')
    console.log('   node promote-admin.js user@example.com')
    console.log('   node promote-admin.js --list')
    process.exit(1)
  }
  
  if (args[0] === '--list') {
    await listAdmins()
  } else {
    const userEmail = args[0]
    const success = await promoteToAdmin(userEmail)
    process.exit(success ? 0 : 1)
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})
