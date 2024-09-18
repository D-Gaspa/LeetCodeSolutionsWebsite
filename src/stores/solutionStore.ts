import {defineStore} from 'pinia'
import {supabase} from '@/services/supabase'
import {Solution} from "@/types/Problem"
import {useProblemStore} from "@/stores/problemStore"

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

                // Increment solution count
                const problemStore = useProblemStore()
                await problemStore.incrementSolutionCount(solutionData.problem_id!)
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

            // Decrement solution count
            const problemStore = useProblemStore()
            await problemStore.decrementSolutionCount(problemId)

            await this.fetchSolutionsForProblem(problemId) // Refresh the solution list
        },

        async deleteAllSolutionsForProblem(problemId: number): Promise<void> {
            const {error} = await supabase
                .from('solutions')
                .delete()
                .eq('problem_id', problemId)

            if (error) {
                throw new Error(`Error deleting solutions for problem: ${error.message}`)
            }

            // Clear local solutions for this problem
            this.solutions = this.solutions.filter(s => s.problem_id !== problemId)
        }
    }
})