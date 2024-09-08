import {Box, Clock, Lightbulb, Split} from 'lucide-vue-next'
import type {Component} from 'vue'

export const getIcon = (field: string): Component => {
    switch (field) {
        case 'code_idea':
            return Lightbulb
        case 'code_breakdown':
            return Split
        case 'time_complexity_explanation':
            return Clock
        case 'space_complexity_explanation':
            return Box
        default:
            return Box
    }
}

export const getLabel = (field: string): string => {
    switch (field) {
        case 'code_idea':
            return 'Code Idea'
        case 'code_breakdown':
            return 'Code Breakdown'
        case 'time_complexity_explanation':
            return 'Time Complexity Explanation'
        case 'space_complexity_explanation':
            return 'Space Complexity Explanation'
        default:
            return 'Content'
    }
}

export const contentFields = ['code_idea', 'code_breakdown', 'time_complexity_explanation', 'space_complexity_explanation'] as const