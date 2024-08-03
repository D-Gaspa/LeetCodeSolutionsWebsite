export const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
}