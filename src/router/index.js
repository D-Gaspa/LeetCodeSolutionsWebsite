import {createRouter, createWebHistory} from 'vue-router'
import Home from '../views/Home.vue'
import ProblemList from '../views/ProblemList.vue'
import ProblemDetail from '../views/ProblemDetail.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Login from '../views/Login.vue'

const routes = [
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
        component: AdminDashboard
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router