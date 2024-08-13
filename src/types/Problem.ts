export interface Problem {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    problem_type: 'daily' | 'weekly';
    problem_date: string;
    content: ProblemContent;
}

export interface ProblemContent {
    text?: string
    images?: Array<{
        id: string
        name: string
        url: string
        file?: File
    }>
}