import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = 'https://uzacuhjqyrteavwtwqll.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ZQG35mwyBvW3ZZlo1mTn_g_GQabTA5T'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
