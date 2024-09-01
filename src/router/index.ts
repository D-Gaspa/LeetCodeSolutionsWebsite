import {createRouter, createWebHistory, NavigationGuardNext, RouteLocationNormalized, RouteRecordRaw} from 'vue-router'
import {checkSupabaseConnection, supabase} from '@/services/supabase'

import Home from '@/views/Home.vue'
import ProblemList from '@/views/ProblemList.vue'
import ProblemDetail from '@/views/ProblemDetail.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import Login from '@/views/Login.vue'

// Define routes
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/problems',
        name: 'ProblemList',
        component: ProblemList
    },
    {
        path: '/problems/:id',
        name: 'ProblemDetail',
        component: ProblemDetail
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {requiresAuth: true}
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    }
]

// Create router instance
const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard
router.beforeEach(async (to: RouteLocationNormalized, _: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // Check Supabase connection first
        const isConnected = await checkSupabaseConnection()
        if (!isConnected) {
            console.error('Unable to connect to Supabase')
            next('/login')
            return
        }

        // Only check authentication for routes that require it
        try {
            const {data: {user}} = await supabase.auth.getUser()
            if (user) {
                next()
            } else {
                next('/login')
            }
        } catch (error) {
            console.error('Error checking authentication:', error)
            next('/login')
        }
    } else {
        // For routes that don't require auth, proceed immediately
        next()
    }
})

export default router