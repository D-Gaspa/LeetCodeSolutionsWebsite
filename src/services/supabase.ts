import {createClient, SupabaseClient} from '@supabase/supabase-js'

declare global {
    interface ImportMeta {
        env: Record<string, string>
    }
}

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
})