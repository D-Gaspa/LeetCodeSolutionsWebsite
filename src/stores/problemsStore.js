import {defineStore} from 'pinia'
import {supabase} from '../services/supabase'
import {deleteImageFromStorage} from "@/utils/imageOperations.js";

export const useProblemStore = defineStore('problems', {
    state: () => ({
        problems: []
    }),
    actions: {
        async fetchProblems(filters = {}) {
            let query = supabase
                .from('problems')
                .select('*')
                .order('created_at', {ascending: false})

            if (filters.query) {
                query = query.ilike('title', `%${filters.query}%`)
            }
            if (filters.difficulty) {
                query = query.eq('difficulty', filters.difficulty)
            }
            if (filters.type) {
                query = query.eq('problem_type', filters.type)
            }
            if (filters.date) {
                query = query.eq('problem_date', filters.date)
            }

            const {data, error} = await query

            if (error) {
                throw new Error('Error fetching problems: ' + error.message)
            }

            this.problems = data
            return data
        },

        async checkProblemIdExists(id) {
            const {data, error} = await supabase
                .from('problems')
                .select('id')
                .eq('id', id)

            if (error) {
                throw new Error('Error checking problem ID: ' + error.message)
            }

            return data && data.length > 0 ? data[0] : null
        },

        async saveProblem(problemData, isEditing) {
            let result;

            if (isEditing) {
                result = await supabase
                    .from('problems')
                    .update(problemData)
                    .eq('id', problemData.id)
            } else {
                result = await supabase
                    .from('problems')
                    .insert([problemData])
            }

            const {data, error} = result

            if (error) {
                throw new Error('Error saving problem: ' + error.message)
            }

            await this.fetchProblems() // Refresh the problem list
            return {data}
        },

        async deleteProblem(id) {
            // Fetch problem data
            const {data: problemData, error: problemError} = await supabase
                .from('problems')
                .select('content')
                .eq('id', id)
                .single()

            if (problemError) {
                throw new Error(`Error fetching problem data: ${problemError.message}`)
            }

            const content = problemData.content
            const imagesToDelete = content.images || []

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
                    imagesToDelete.map(image => deleteImageFromStorage(image.name))
                )

                const failedDeletes = deleteImageResults.filter(result => !result.success)
                if (failedDeletes.length > 0) {
                    console.error('Failed image deletes:', failedDeletes)
                    throw new Error(`Error deleting ${failedDeletes.length} image(s). Problem deleted, but some images may remain.`)
                }
            }
        }
    }
})