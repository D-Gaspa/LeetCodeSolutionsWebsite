export interface Problem {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    problem_type: 'daily' | 'weekly';
    problem_date: string;
}