export enum ProblemType {
    Daily = 'daily',
    Weekly = 'weekly'
}

export enum ProblemDifficulty {
    Easy = 'Easy',
    Medium = 'Medium',
    Hard = 'Hard'
}

export interface MdImage {
    id: string
    name: string
    url: string
    file?: File | null
}

export interface MdContent {
    text: string
    images?: MdImage[]
}

export type MdContentNoImages = Omit<MdContent, 'images'> & { images?: never }

export interface Problem {
    id: number
    title: string
    difficulty: ProblemDifficulty
    problem_type: ProblemType
    problem_date: string
    content: MdContent
    solution_count: number
}

export type ProblemFormType = {
    id: number
    name?: string
    title?: string
    difficulty: ProblemDifficulty
    problem_type: ProblemType
    problem_date: string
    content: MdContent
}

export interface Solution {
    id: number
    problem_id: number
    approach_name: string
    code: string
    code_idea: MdContentNoImages
    code_breakdown: MdContentNoImages
    time_complexity: string
    space_complexity: string
    time_complexity_explanation: MdContentNoImages
    space_complexity_explanation: MdContentNoImages
    has_example: boolean
}

export type SolutionFormType = Omit<Solution, 'id' | 'has_example'>

export interface Example {
    solution_id: number
    input: string
    steps: ExampleSteps[]
    visualizations: ExampleVisualization[]
}

export interface ExampleVisualization extends MdImage {
    associatedSteps: number[]
}

export interface ExampleSteps {
    step_number: number
    description: string
}