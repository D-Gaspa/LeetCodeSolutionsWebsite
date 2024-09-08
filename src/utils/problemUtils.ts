import {ProblemDifficulty, ProblemType} from '@/types/Problem'

export const DifficultyOptions = [
    {value: ProblemDifficulty.Easy, label: 'Easy'},
    {value: ProblemDifficulty.Medium, label: 'Medium'},
    {value: ProblemDifficulty.Hard, label: 'Hard'},
]

export const ProblemTypeOptions = [
    {value: ProblemType.Daily, label: 'Daily'},
    {value: ProblemType.Weekly, label: 'Weekly'},
]

export const WeekOptions = Array.from({length: 5}, (_, i) => ({
    value: i + 1,
    label: `Week ${i + 1}`,
}))

export const formatProblemDate = (date: string, type: ProblemType, weekNumber?: number) => {
    if (type === ProblemType.Daily) {
        return new Date(date).toISOString().split('T')[0]
    } else {
        const [year, month] = date.split('-')
        return `${year}-${month}-${weekNumber}`
    }
}