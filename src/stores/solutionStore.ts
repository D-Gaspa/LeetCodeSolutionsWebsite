import {defineStore} from 'pinia'
import {supabase} from '@/services/supabase'
import {Solution} from "@/types/Problem"

export const useSolutionStore = defineStore('solutions', {
    state: () => ({
        solutions: [] as Solution[],
        lastFetchTimestamp: 0,
        cacheExpirationTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    }),
    actions: {
        async fetchSolutionsForProblem(problemId: number): Promise<Solution[]> {
            const {data, error} = await supabase
                .from('solutions')
                .select('*')
                .eq('problem_id', problemId)

            if (error) {
                throw new Error('Error fetching solutions: ' + error.message)
            }

            this.solutions = data as Solution[]
            this.lastFetchTimestamp = Date.now()
            return this.solutions
        },

        isCacheExpired(): boolean {
            return Date.now() - this.lastFetchTimestamp > this.cacheExpirationTime
        },

        async saveSolution(solutionData: Partial<Solution>, isEditing: boolean): Promise<{ data: Solution[] | null }> {
            let result

            if (isEditing) {
                result = await supabase
                    .from('solutions')
                    .update(solutionData)
                    .eq('id', solutionData.id!)
            } else {
                result = await supabase
                    .from('solutions')
                    .insert([solutionData])
            }

            const {data, error} = result

            if (error) {
                throw new Error('Error saving solution: ' + error.message)
            }

            await this.fetchSolutionsForProblem(solutionData.problem_id!) // Refresh the solution list
            return {data: data as Solution[] | null}
        },

        async deleteSolution(id: number, problemId: number): Promise<void> {
            const {error: deleteError} = await supabase
                .from('solutions')
                .delete()
                .eq('id', id)

            if (deleteError) {
                throw new Error(`Error deleting solution from database: ${deleteError.message}`)
            }

            await this.fetchSolutionsForProblem(problemId) // Refresh the solution list
        },

        async updateSolutionCount(problemId: number): Promise<void> {
            const {count, error} = await supabase
                .from('solutions')
                .select('id', {count: 'exact'})
                .eq('problem_id', problemId)

            if (error) {
                throw new Error(`Error counting solutions: ${error.message}`)
            }

            const {error: updateError} = await supabase
                .from('problems')
                .update({solution_count: count})
                .eq('id', problemId)

            if (updateError) {
                throw new Error(`Error updating solution count: ${updateError.message}`)
            }
        }
    }
})