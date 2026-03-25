import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MainLayout from '../layout/MainLayout.vue'
import WorkbenchLayout from '../layout/WorkbenchLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/RegisterView.vue')
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('../views/ForgotPasswordView.vue')
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: () => import('../views/ResetPasswordView.vue')
        },
        {
            path: '/upload',
            name: 'upload',
            component: () => import('../views/UploadPage.vue')
        },
        {
            path: '/mobile-upload',
            name: 'mobile-upload',
            component: () => import('../views/UploadPage.vue')
        },
        // 统一 MainLayout 路由组
        {
            path: '/',
            component: MainLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/DashboardView.vue')
                },
                {
                    path: 'tools',
                    name: 'tools',
                    component: () => import('../views/ToolsView.vue')
                },
                {
                    path: 'workbench',
                    name: 'workbench',
                    component: () => import('../views/WorkbenchView.vue')
                },
                {
                    path: 'templates',
                    name: 'templates',
                    component: () => import('../views/tools/TemplatesView.vue')
                },
                {
                    path: 'assets',
                    name: 'assets',
                    component: () => import('../views/tools/AssetsView.vue')
                },
                {
                    path: 'history',
                    name: 'history',
                    component: () => import('../views/tools/HistoryView.vue')
                },
                {
                    path: 'tools/virtual-try-on',
                    name: 'tools-virtual-tryon',
                    component: () => import('../views/tools/SimplifiedTryOnView.vue')
                },
                {
                    path: 'tools/scene-generation',
                    name: 'tools-scene-generation',
                    component: () => import('../views/tools/SceneGenerationView.vue')
                },
                {
                    path: 'tools/face-swap',
                    name: 'tools-face-swap',
                    component: () => import('../views/tools/FaceSwapView.vue')
                },
                {
                    path: 'tools/detail-enhance',
                    name: 'tools-detail-enhance',
                    component: () => import('../views/tools/DetailEnhanceView.vue')
                },
                {
                    path: 'tools/background-replace',
                    name: 'tools-background-replace',
                    component: () => import('../views/tools/BackgroundReplaceView.vue')
                },
                {
                    path: 'tools/shoe-try-on',
                    name: 'tools-shoe-tryon',
                    component: () => import('../views/tools/ShoeTryOnView.vue')
                },
                {
                    path: 'tools/hand-product',
                    name: 'tools-hand-product',
                    component: () => import('../views/tools/HandProductView.vue')
                },
                {
                    path: 'tools/model-bg-replace',
                    name: 'tools-model-bg-replace',
                    component: () => import('../views/tools/ModelBgReplaceView.vue')
                },
                {
                    path: 'tools/cutout-white-bg',
                    name: 'tools-cutout-white-bg',
                    component: () => import('../views/tools/CutoutWhiteBgView.vue')
                },
                {
                    path: 'tools/upscale',
                    name: 'tools-upscale',
                    component: () => import('../views/tools/UpscaleView.vue')
                },
                {
                    path: 'tools/ai-shadow',
                    name: 'tools-ai-shadow',
                    component: () => import('../views/tools/AiShadowView.vue')
                },
                {
                    path: 'tools/listing',
                    name: 'tools-listing',
                    component: () => import('../views/tools/listing/ListingEntryView.vue')
                },
                {
                    path: 'tools/listing/create',
                    name: 'tools-listing-create',
                    component: () => import('../views/tools/listing/ListingCreateView.vue')
                },
                {
                    path: 'tools/listing/optimize',
                    name: 'tools-listing-optimize',
                    component: () => import('../views/tools/listing/ListingOptimizeView.vue')
                },
                {
                    path: 'tools/aplus-wizard',
                    name: 'tools-aplus-wizard',
                    component: () => import('../views/tools/aplus/APlusWizardView.vue')
                },
                {
                    path: 'tools/:toolId',
                    name: 'tools-tool',
                    component: () => import('../views/tools/ToolComingSoonView.vue')
                },
                {
                    path: 'recharge',
                    name: 'recharge',
                    component: () => import('../views/RechargeView.vue')
                }
            ]
        },
        // Workflow routes
        {
            path: '/workflow',
            redirect: '/workflow/try-on'
        },
        {
            path: '/workflow/try-on',
            name: 'workflow-tryon',
            component: () => import('../views/WorkflowView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/workflow/:workflowType',
            name: 'workflow',
            component: () => import('../views/GenericWorkflowView.vue'),
            props: true,
            meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach((to, _from, next) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
        next()
    }
})

export default router
