import {defineStore} from 'pinia'
import {supabase} from '@/services/supabase'
import {deleteImageFromStorage} from '@/utils/imageOperations'
import {Problem} from "@/types/Problem"
import {useSolutionStore} from "@/stores/solutionStore"

export const useProblemStore = defineStore('problems', {
    state: () => ({
        problems: [] as Problem[],
        lastFetchTimestamp: 0,
        cacheExpirationTime: 5 * 60 * 1000, // 5 minutes in milliseconds
        filters: {
            query: '',
            difficulty: '',
            type: '',
            date: ''
        }
    }),
    actions: {
        async fetchAllProblems(): Promise<Problem[]> {
            const {data, error} = await supabase
                .from('problems')
                .select('*')

            if (error) {
                throw new Error('Error fetching problems: ' + error.message)
            }

            this.problems = data as Problem[]
            this.lastFetchTimestamp = Date.now()
            return this.problems
        },

        async getFilteredProblems(): Promise<Problem[]> {
            // Check if the cache is expired or empty
            if (this.isCacheExpired() || this.problems.length === 0) {
                await this.fetchAllProblems()
            }

            return this.problems.filter(problem => {
                let match = true
                if (this.filters.query) {
                    match = match && problem.title.toLowerCase().includes(this.filters.query.toLowerCase())
                }
                if (this.filters.difficulty) {
                    match = match && problem.difficulty === this.filters.difficulty
                }
                if (this.filters.type) {
                    match = match && problem.problem_type === this.filters.type
                }
                if (this.filters.date) {
                    match = match && problem.problem_date === this.filters.date
                }
                return match
            })
        },

        areDefaultFilters(): boolean {
            return Object.values(this.filters).every(value => !value)
        },

        resetFilters() {
            this.filters = {
                query: '',
                difficulty: '',
                type: '',
                date: ''
            }
        },

        isCacheExpired(): boolean {
            return Date.now() - this.lastFetchTimestamp > this.cacheExpirationTime
        },

        async checkProblemIdExists(id: number): Promise<{ id: number } | null> {
            const {data, error} = await supabase
                .from('problems')
                .select('id')
                .eq('id', id)

            if (error) {
                throw new Error('Error checking problem ID: ' + error.message)
            }

            return data && data.length > 0 ? data[0] : null
        },

        async incrementSolutionCount(problemId: number): Promise<void> {
            const {data, error} = await supabase
                .from('problems')
                .select('solution_count')
                .eq('id', problemId)
                .single()

            if (error) {
                throw new Error('Error fetching problem: ' + error.message)
            }

            const currentCount = data.solution_count || 0
            const newCount = currentCount + 1

            const {error: updateError} = await supabase
                .from('problems')
                .update({solution_count: newCount})
                .eq('id', problemId)

            if (updateError) {
                throw new Error('Error incrementing solution count: ' + updateError.message)
            }

            // Update local state
            const problem = this.problems.find(p => p.id === problemId)
            if (problem) {
                problem.solution_count = newCount
            }
        },

        async decrementSolutionCount(problemId: number): Promise<void> {
            const {data, error} = await supabase
                .from('problems')
                .select('solution_count')
                .eq('id', problemId)
                .single()

            if (error) {
                throw new Error('Error fetching problem: ' + error.message)
            }

            const currentCount = data.solution_count || 0
            const newCount = Math.max(currentCount - 1, 0)  // Ensure count doesn't go below 0

            const {error: updateError} = await supabase
                .from('problems')
                .update({solution_count: newCount})
                .eq('id', problemId)

            if (updateError) {
                throw new Error('Error decrementing solution count: ' + updateError.message)
            }

            // Update local state
            const problem = this.problems.find(p => p.id === problemId)
            if (problem) {
                problem.solution_count = newCount
            }
        },

        async saveProblem(problemData: Partial<Problem>, isEditing: boolean): Promise<{ data: Problem[] | null }> {
            let result

            if (isEditing) {
                result = await supabase
                    .from('problems')
                    .update(problemData)
                    .eq('id', problemData.id!)
            } else {
                result = await supabase
                    .from('problems')
                    .insert([problemData])
            }

            const {data, error} = result

            if (error) {
                throw new Error('Error saving problem: ' + error.message)
            }

            await this.fetchAllProblems() // Refresh the problem list
            return {data: data as Problem[] | null}
        },

        async deleteProblem(id: number): Promise<void> {
            // Fetch problem data
            const {data: problemData, error: problemError} = await supabase
                .from('problems')
                .select('content')
                .eq('id', id)
                .single()

            if (problemError) {
                throw new Error(`Error fetching problem data: ${problemError.message}`)
            }

            const content = (problemData as Problem).content
            const imagesToDelete = content.images || []

            const solutionStore = useSolutionStore()
            await solutionStore.deleteAllSolutionsForProblem(id)

            // Delete the problem from the database
            const {error: deleteError} = await supabase
                .from('problems')
                .delete()
                .eq('id', id)

            if (deleteError) {
                throw new Error(`Error deleting problem from database: ${deleteError.message}`)
            }

            // Delete images associated with the problem
            if (imagesToDelete.length > 0) {
                const deleteImageResults = await Promise.all(
                    imagesToDelete.map(image => deleteImageFromStorage(image.name, 'problem-images'))
                )

                const failedDeletes = deleteImageResults.filter(result => !result.success)
                if (failedDeletes.length > 0) {
                    console.error('Failed image deletes:', failedDeletes)
                    throw new Error(`Error deleting ${failedDeletes.length} image(s). Problem deleted, but some images may remain.`)
                }
            }

            await this.fetchAllProblems() // Refresh the problem list
        }
    }
})