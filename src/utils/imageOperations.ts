import {supabase} from "@/services/supabase"

interface OperationResult {
    success: boolean
    error?: string
    url?: string
}

export const deleteImageFromStorage = async (imageName: string, bucket: string): Promise<OperationResult> => {
    try {
        const {error} = await supabase.storage
            .from(bucket)
            .remove([imageName])

        if (error) {
            console.error(`Error deleting image ${imageName}:`, error)
            return {success: false, error: `Error deleting image ${imageName}: ${error.message}`}
        }
        return {success: true}
    } catch (error) {
        console.error(`Unexpected error deleting image ${imageName}:`, error)
        return {success: false, error: (error as Error).message}
    }
}

export const uploadNewImage = async (file: File, fileName: string, bucket: string): Promise<OperationResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const {error} = await supabase.storage
            .from(bucket)
            .upload(fileName, arrayBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: true
            })

        if (error) {
            return {success: false, error: `Error uploading image ${fileName}: ${error.message}`}
        }
        return {success: true}
    } catch (error) {
        return {success: false, error: `Error uploading image ${fileName}: ${(error as Error).message}`}
    }
}

export const renameExistingImage = async (oldName: string, newName: string): Promise<OperationResult> => {
    try {
        const {error} = await supabase.storage
            .from('problem-images')
            .move(oldName, newName)

        if (error) {
            return {success: false, error: 'Error renaming image'}
        }
        return {success: true}
    } catch (error) {
        return {success: false, error: 'Error renaming image'}
    }
}

export const getPublicUrl = async (fileName: string): Promise<OperationResult> => {
    try {
        const {data} = supabase.storage
            .from('problem-images')
            .getPublicUrl(fileName)

        if (!data || !data.publicUrl) {
            return {success: false, error: 'Error getting public URL'}
        }
        return {success: true, url: data.publicUrl}
    } catch (error) {
        return {success: false, error: 'Error getting public URL'}
    }
}