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
    console.log('Starting demo users setup...')

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

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
      console.log(`Creating user: ${user.email}`)
      
      // Check if user already exists by checking profiles table (more efficient)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('user_id', (await supabaseAdmin.auth.admin.listUsers()).data?.users?.find(u => u.email === user.email)?.id || '')
        .maybeSingle()
      
      if (existingProfile) {
        console.log(`User ${user.email} already exists, skipping...`)
        results.push({ email: user.email, status: 'already_exists' })
        continue
      }

      // Create user with metadata
      console.log(`Creating auth user for: ${user.email}`)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      })

      if (createError) {
        console.error(`Error creating user ${user.email}:`, createError)
        results.push({ email: user.email, status: 'error', error: createError.message })
        continue
      }

      console.log(`User ${user.email} created successfully with ID: ${newUser.user?.id}`)

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 100))

      // Use UPSERT to ensure profile has correct role (handles both new and existing profiles)
      if (newUser.user) {
        console.log(`Setting up profile for ${user.email} with role: ${user.role}`)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: newUser.user.id,
            name: user.name,
            role: user.role
          })

        if (profileError) {
          console.error(`Error setting up profile for ${user.email}:`, profileError)
          results.push({ email: user.email, status: 'created_with_profile_error', error: profileError.message })
        } else {
          console.log(`Profile set up successfully for ${user.email} with role: ${user.role}`)
          results.push({ email: user.email, status: 'created' })
        }
      } else {
        console.error(`No user object returned for ${user.email}`)
        results.push({ email: user.email, status: 'error', error: 'No user object returned' })
      }
    }

    console.log('Demo users setup completed')

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
    console.error('Error in setup-demo-users function:', error)
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