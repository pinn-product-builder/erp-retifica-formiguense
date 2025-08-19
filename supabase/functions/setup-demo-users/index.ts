import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error) return false
    return data?.role === 'admin'
  } catch (error) {
    return false
  }
}

interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: string
}

Deno.serve(async (req) => {
  console.log('=== SETUP DEMO USERS FUNCTION START ===');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting demo users setup...')

    // Extract and validate JWT token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validate environment variables with detailed logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment validation:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    
    if (supabaseUrl) {
      console.log('- SUPABASE_URL preview:', supabaseUrl.substring(0, 30) + '...');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found',
          debug: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
          }
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('✅ Environment variables validated')

    // Create user client to verify JWT and check admin status
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify JWT and get user
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid JWT token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(supabaseUser, userData.user.id)
    if (!userIsAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Admin access verified')

    // Create admin client
    console.log('🔧 Creating Supabase admin client...');
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('✅ Supabase admin client created')

    // Test database connection
    console.log('🔍 Testing database connection...');
    try {
      const { data: testQuery, error: testError } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        return new Response(
          JSON.stringify({ 
            error: 'Database connection failed',
            details: testError.message,
            debug: testError
          }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Database connection error',
          details: dbError.message
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Demo users to create
    const demoUsers: CreateUserRequest[] = [
      {
        email: 'admin@retificas.com',
        password: 'admin123',
        name: 'Administrador Sistema',
        role: 'admin'
      },
      {
        email: 'funcionario@retificas.com', 
        password: 'func123',
        name: 'Funcionário Teste',
        role: 'employee'
      }
    ]

    console.log(`📋 Processing ${demoUsers.length} demo users...`);
    const results = []

    for (const user of demoUsers) {
      console.log(`\n--- Processing user: ${user.email} ---`)
      
      try {
        // Check if user already exists first
        console.log('🔍 Checking if user already exists...');
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error(`❌ Error listing users:`, listError)
          results.push({ 
            email: user.email, 
            status: 'list_error', 
            error: `Failed to check existing users: ${listError.message}`,
            debug: listError
          })
          continue
        }

        console.log(`📊 Found ${existingUsers.users.length} total users in auth.users`);
        const existingUser = existingUsers.users.find(u => u.email === user.email)
        
        if (existingUser) {
          console.log(`ℹ️ User ${user.email} already exists (ID: ${existingUser.id}), updating profile...`)
          
          // Check current profile
          const { data: currentProfile, error: profileCheckError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', existingUser.id)
            .single();
          
          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.error('❌ Error checking current profile:', profileCheckError);
          } else {
            console.log('📋 Current profile:', currentProfile);
          }
          
          // Update the profile with correct role
          const { data: updatedProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              user_id: existingUser.id,
              name: user.name,
              role: user.role
            })
            .select();

          if (profileError) {
            console.error(`❌ Error updating profile for ${user.email}:`, profileError)
            results.push({ 
              email: user.email, 
              status: 'profile_update_error', 
              error: profileError.message,
              debug: profileError
            })
          } else {
            console.log(`✅ Profile updated for ${user.email}:`, updatedProfile)
            results.push({ 
              email: user.email, 
              status: 'already_exists_profile_updated',
              userId: existingUser.id,
              profile: updatedProfile
            })
          }
          continue
        }

        // Create new user
        console.log(`🔨 Creating new user: ${user.email}`)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name
          }
        })

        if (createError) {
          console.error(`❌ Error creating user ${user.email}:`, createError)
          results.push({ 
            email: user.email, 
            status: 'create_error', 
            error: createError.message,
            debug: createError
          })
          continue
        }

        if (!newUser.user) {
          console.error(`❌ No user object returned for ${user.email}`)
          results.push({ 
            email: user.email, 
            status: 'no_user_object', 
            error: 'No user object returned',
            debug: newUser
          })
          continue
        }

        console.log(`✅ User ${user.email} created successfully with ID: ${newUser.user.id}`)

        // Wait for trigger to create the profile
        console.log(`⏳ Waiting for profile creation trigger (2 seconds)...`)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Check if profile was created by trigger
        console.log(`🔍 Checking if profile was created by trigger...`);
        const { data: triggerProfile, error: triggerCheckError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', newUser.user.id)
          .single();
        
        if (triggerCheckError && triggerCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking trigger profile:', triggerCheckError);
        } else if (triggerProfile) {
          console.log('✅ Profile was created by trigger:', triggerProfile);
        } else {
          console.log('⚠️ No profile created by trigger, will create manually');
        }

        // Verify and update profile with correct role
        console.log(`🔄 Setting up profile for ${user.email} with role: ${user.role}`)
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: newUser.user.id,
            name: user.name,
            role: user.role
          })
          .select();

        if (profileError) {
          console.error(`❌ Error setting up profile for ${user.email}:`, profileError)
          results.push({ 
            email: user.email, 
            status: 'created_with_profile_error', 
            error: profileError.message,
            userId: newUser.user.id,
            debug: profileError
          })
        } else {
          console.log(`✅ Profile set up successfully for ${user.email}:`, profileData)
          results.push({ 
            email: user.email, 
            status: 'created',
            userId: newUser.user.id,
            profile: profileData
          })
        }

      } catch (userError) {
        console.error(`💥 Unexpected error creating user ${user.email}:`, userError)
        results.push({ 
          email: user.email, 
          status: 'unexpected_error', 
          error: userError.message,
          debug: userError
        })
      }
    }

    console.log('\n🎉 Demo users setup completed!')
    console.log('📊 Final results:', JSON.stringify(results, null, 2));

    // Final verification - check what's actually in the database
    console.log('\n🔍 Final verification - checking database state:');
    
    try {
      const { data: allUsers, error: finalUserCheck } = await supabaseAdmin.auth.admin.listUsers();
      if (!finalUserCheck) {
        console.log(`👥 Total users in auth.users: ${allUsers.users.length}`);
        allUsers.users.forEach(user => {
          console.log(`  - ${user.email} (ID: ${user.id})`);
        });
      }
      
      const { data: allProfiles, error: finalProfileCheck } = await supabaseAdmin
        .from('profiles')
        .select('*');
      
      if (!finalProfileCheck) {
        console.log(`👤 Total profiles: ${allProfiles.length}`);
        allProfiles.forEach(profile => {
          console.log(`  - ${profile.name} (${profile.role}) - User ID: ${profile.user_id}`);
        });
      }
    } catch (verifyError) {
      console.error('❌ Error during final verification:', verifyError);
    }

    console.log('=== SETUP DEMO USERS FUNCTION END ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo users setup completed',
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 CRITICAL ERROR in setup-demo-users function:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        type: typeof error,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})