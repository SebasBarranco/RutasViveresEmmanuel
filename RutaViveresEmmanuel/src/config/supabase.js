import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://exzneaxfhekpdrklggrq.supabase.co'
const supabaseKey = 'sb_publishable_aB3DeSJKnOXd7DIfAhPZbA_FmG17hQ3'

export const supabase = createClient(supabaseUrl, supabaseKey)