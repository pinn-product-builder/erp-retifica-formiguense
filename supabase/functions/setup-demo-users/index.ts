import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting demo users setup...')

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
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

    // Create admin client
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

    const results = []

    for (const user of demoUsers) {
      console.log(`👤 Processing user: ${user.email}`)
      
      try {
        // Check if user already exists first
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error(`❌ Error listing users:`, listError)
          results.push({ email: user.email, status: 'error', error: `Failed to check existing users: ${listError.message}` })
          continue
        }

        const existingUser = existingUsers.users.find(u => u.email === user.email)
        
        if (existingUser) {
          console.log(`ℹ️ User ${user.email} already exists, updating profile...`)
          
          // Update the profile with correct role
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              user_id: existingUser.id,
              name: user.name,
              role: user.role
            })

          if (profileError) {
            console.error(`❌ Error updating profile for ${user.email}:`, profileError)
            results.push({ email: user.email, status: 'profile_update_error', error: profileError.message })
          } else {
            console.log(`✅ Profile updated for ${user.email}`)
            results.push({ email: user.email, status: 'already_exists_profile_updated' })
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
          results.push({ email: user.email, status: 'error', error: createError.message })
          continue
        }

        if (!newUser.user) {
          console.error(`❌ No user object returned for ${user.email}`)
          results.push({ email: user.email, status: 'error', error: 'No user object returned' })
          continue
        }

        console.log(`✅ User ${user.email} created successfully with ID: ${newUser.user.id}`)

        // Wait for trigger to create the profile
        console.log(`⏳ Waiting for profile creation trigger...`)
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verify and update profile with correct role
        console.log(`🔄 Setting up profile for ${user.email} with role: ${user.role}`)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: newUser.user.id,
            name: user.name,
            role: user.role
          })

        if (profileError) {
          console.error(`❌ Error setting up profile for ${user.email}:`, profileError)
          results.push({ email: user.email, status: 'created_with_profile_error', error: profileError.message })
        } else {
          console.log(`✅ Profile set up successfully for ${user.email} with role: ${user.role}`)
          results.push({ email: user.email, status: 'created' })
        }

      } catch (userError) {
        console.error(`💥 Unexpected error creating user ${user.email}:`, userError)
        results.push({ email: user.email, status: 'error', error: userError.message })
      }
    }

    console.log('🎉 Demo users setup completed:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo users setup completed',
        results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 Critical error in setup-demo-users function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
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