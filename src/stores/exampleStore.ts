import {defineStore} from 'pinia'
import {supabase} from '@/services/supabase'
import {Example} from "@/types/Problem"

export const useExampleStore = defineStore('examples', {
    state: () => ({
        examples: [] as Example[],
        lastFetchTimestamp: 0,
        cacheExpirationTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    }),
    actions: {
        async fetchExampleBySolutionId(solutionId: number): Promise<Example | null> {
            const {data, error} = await supabase
                .from('examples')
                .select('*')
                .eq('solution_id', solutionId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No example found for this solution
                    return null
                }
                throw new Error('Error fetching example: ' + error.message)
            }

            return data as Example
        },

        async saveExample(example: Example): Promise<Example> {
            const {data, error} = await supabase
                .from('examples')
                .upsert(example, {onConflict: 'solution_id'})
                .single()

            if (error) {
                throw new Error('Error saving example: ' + error.message)
            }

            return data as Example
        },

        async deleteExample(solutionId: number): Promise<void> {
            const {error} = await supabase
                .from('examples')
                .delete()
                .eq('solution_id', solutionId)

            if (error) {
                throw new Error('Error deleting example: ' + error.message)
            }
        },

        isCacheExpired(): boolean {
            return Date.now() - this.lastFetchTimestamp > this.cacheExpirationTime
        },
    }
})