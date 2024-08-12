import type {Problem} from '@/types/Problem'

export const formatDate = (problem: Problem): string => {
    if (problem.problem_type === 'daily') {
        return formatDailyDate(problem.problem_date)
    } else {
        return formatWeeklyDate(problem.problem_date)
    }
}

const formatDailyDate = (date: string): string => {
    // date is in the format 'YYYY-MM-DD'
    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return dateObj.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
}

const formatWeeklyDate = (date: string): string => {
    // date is in the format 'YYYY-MM-WW'
    const [year, month, week] = date.split('-').map(Number)

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = monthNames[month - 1]

    return `${monthName} W${week}, ${year}`
}