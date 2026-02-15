
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createMiftaahUser() {
    const email = 'miftaah@minara.org.in';
    const password = 'Miftaah@1204';

    console.log(`Checking if user ${email} exists...`);

    // Check if user exists (by trying to get by email - admin only)
    // Note: getByEmail is not standard on admin api, usually listUsers
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User ${email} already exists. ID: ${existingUser.id}`);
        console.log('Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, email_confirm: true }
        );
        if (updateError) {
            console.error('Error updating password:', updateError);
        } else {
            console.log('Password updated successfully.');
        }
    } else {
        console.log(`Creating user ${email}...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) {
            console.error('Error creating user:', error);
        } else {
            console.log(`User created successfully. ID: ${data.user.id}`);
        }
    }
}

createMiftaahUser();
