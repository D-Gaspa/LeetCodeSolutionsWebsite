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

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export async function checkSupabaseConnection(): Promise<boolean> {
    let retries = 0
    while (retries < MAX_RETRIES) {
        try {
            // Test the connection
            await supabase.from('problems').select('*').limit(1)
            return true
        } catch (error) {
            console.error(`Supabase connection attempt ${retries + 1} failed:`, error)
            retries++
            if (retries >= MAX_RETRIES) {
                console.error('Max retries reached. Unable to connect to Supabase.')
                return false
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        }
    }
    return false
}