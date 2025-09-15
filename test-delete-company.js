#!/usr/bin/env node

/**
 * Test script for delete company functionality
 */

const token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjErSkg0cGgvWEVHOWFjbCsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2l4a2hrempoZWx5dW1kcGx1dGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1NDcwNTJkMi03OWIyLTRlZGQtYWZmNi0xMWUzNTljNjkxN2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3NzA4OTkzLCJpYXQiOjE3NTc3MDUzOTMsImVtYWlsIjoic2Fpbml0aGluZ291ZGtAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSThsOWNDUGZrYUYwNGFRNURmMUtEMzBQSTh4Z3NOdUxaWTg0X3lVSUJNVmYydz1zOTYtYyIsImVtYWlsIjoic2Fpbml0aGluZ291ZGtAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlNhaU5pdGhpbkdvdWQgS3VycmVtdWxhIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNhaU5pdGhpbkdvdWQgS3VycmVtdWxhIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSThsOWNDUGZrYUYwNGFRNURmMUtEMzBQSTh4Z3NOdUxaWTg0X3lVSUJNVmYydz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAxODMyNzM1OTI4MTMxODEzODAzIiwic3ViIjoiMTAxODMyNzM1OTI4MTMxODEzODAzIn0sInJvbGUiOiJhZG1pbiIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzU3NzA1MzkzfV0sInNlc3Npb25faWQiOiJiYzBmNzA0OS0xZTQ0LTQ2NWMtOGU3NC0yNzkzNzQwNzJmNWYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.I63u0cDplh4kV7XwAk68nOQu6QpkG2AH6UD08KFe-vI";

async function testDeleteCompany() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing delete company functionality...');
    
    // First, test admin access
    console.log('1️⃣ Testing admin access...');
    const whoamiResponse = await fetch(`${baseUrl}/api/admin/whoami`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!whoamiResponse.ok) {
      throw new Error(`Admin check failed: ${whoamiResponse.status} ${whoamiResponse.statusText}`);
    }
    
    const whoamiData = await whoamiResponse.json();
    console.log('✅ Admin access confirmed:', whoamiData);
    
    // Get companies list first
    console.log('2️⃣ Getting companies list...');
    const companiesResponse = await fetch(`${baseUrl}/api/companies?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!companiesResponse.ok) {
      throw new Error(`Companies fetch failed: ${companiesResponse.status} ${companiesResponse.statusText}`);
    }
    
    const companiesData = await companiesResponse.json();
    console.log('📋 Found companies:', companiesData.length);
    
    if (companiesData.length === 0) {
      console.log('⚠️ No companies found to test deletion');
      return;
    }
    
    // Show first few companies
    companiesData.slice(0, 3).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
    });
    
    // Test delete endpoint (using first company)
    const testCompany = companiesData[0];
    console.log(`3️⃣ Testing delete for company: ${testCompany.name} (ID: ${testCompany.id})`);
    
    const deleteResponse = await fetch(`${baseUrl}/api/admin/companies/${testCompany.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Delete response status: ${deleteResponse.status}`);
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.log('❌ Delete failed:', errorText);
      return;
    }
    
    const deleteData = await deleteResponse.json();
    console.log('✅ Delete successful:', deleteData);
    
    // Verify company was deleted by trying to fetch it again
    console.log('4️⃣ Verifying deletion...');
    const verifyResponse = await fetch(`${baseUrl}/api/admin/companies/${testCompany.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.status === 404) {
      console.log('✅ Company successfully deleted (404 confirmed)');
    } else {
      console.log('⚠️ Company might still exist:', verifyResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDeleteCompany();


