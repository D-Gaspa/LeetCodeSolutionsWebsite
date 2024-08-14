export enum ProblemType {
    Daily = 'daily',
    Weekly = 'weekly'
}

export enum ProblemDifficulty {
    Easy = 'Easy',
    Medium = 'Medium',
    Hard = 'Hard'
}

export interface Problem {
    id: number;
    title: string;
    difficulty: ProblemDifficulty;
    problem_type: ProblemType;
    problem_date: string;
    content: ProblemContent;
}

export interface MdImage {
    id: string
    name: string
    url: string
    file?: File | null
}

export interface ProblemContent {
    text: string
    images: MdImage[]
}