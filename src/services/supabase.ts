import {createClient, SupabaseClient} from '@supabase/supabase-js'

declare global {
    interface ImportMeta {
        env: Record<string, string>
    }
}

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
})