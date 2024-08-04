import {supabase} from "@/services/supabase.js"

export const deleteImageFromStorage = async (imageName) => {
    try {
        const {error} = await supabase.storage
            .from('problem-images')
            .remove([imageName])

        if (error) {
            console.error(`Error deleting image ${imageName}:`, error)
            return {success: false, error: `Error deleting image ${imageName}: ${error.message}`}
        }
        return {success: true}
    } catch (error) {
        console.error(`Unexpected error deleting image ${imageName}:`, error)
        return {success: false, error: error.message}
    }
}

export const uploadNewImage = async (file, fileName) => {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const {error} = await supabase.storage
            .from('problem-images')
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
        return {success: false, error: `Error uploading image ${fileName}: ${error.message}`}
    }
}

export const renameExistingImage = async (oldName, newName) => {
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

export const getPublicUrl = async (fileName) => {
    try {
        const {data: urlData, error} = supabase.storage
            .from('problem-images')
            .getPublicUrl(fileName)
        if (error) {
            return {success: false, error: 'Error getting public URL'}
        }
        return {success: true, url: urlData.publicUrl}
    } catch (error) {
        return {success: false, error: 'Error getting public URL'}
    }
}