export interface Problem {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    problem_type: 'daily' | 'weekly';
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