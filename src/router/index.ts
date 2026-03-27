import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MainLayout from '../layout/MainLayout.vue'
import WorkbenchLayout from '../layout/WorkbenchLayout.vue'
import ToolsLayout from '../layout/ToolsLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: MainLayout,
            children: [
                {
                    path: '',
                    name: 'home',
                    component: HomeView
                }
            ]
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
        {
            path: '/tools',
            component: ToolsLayout,
            children: [
                {
                    path: '',
                    name: 'tools',
                    component: () => import('../views/ToolsView.vue')
                },
                {
                    path: 'templates',
                    name: 'tools-templates',
                    component: () => import('../views/tools/TemplatesView.vue')
                },
                {
                    path: 'assets',
                    name: 'tools-assets',
                    component: () => import('../views/tools/AssetsView.vue')
                },
                {
                    path: 'history',
                    name: 'tools-history',
                    component: () => import('../views/tools/HistoryView.vue')
                },
                {
                    path: 'virtual-try-on',
                    name: 'tools-virtual-tryon',
                    component: () => import('../views/tools/SimplifiedTryOnView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'scene-generation',
                    name: 'tools-scene-generation',
                    component: () => import('../views/tools/SceneGenerationView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'face-swap',
                    name: 'tools-face-swap',
                    component: () => import('../views/tools/FaceSwapView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'detail-enhance',
                    name: 'tools-detail-enhance',
                    component: () => import('../views/tools/DetailEnhanceView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'background-replace',
                    name: 'tools-background-replace',
                    component: () => import('../views/tools/BackgroundReplaceView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'shoe-try-on',
                    name: 'tools-shoe-tryon',
                    component: () => import('../views/tools/ShoeTryOnView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'hand-product',
                    name: 'tools-hand-product',
                    component: () => import('../views/tools/HandProductView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'model-bg-replace',
                    name: 'tools-model-bg-replace',
                    component: () => import('../views/tools/ModelBgReplaceView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'cutout-white-bg',
                    name: 'tools-cutout-white-bg',
                    component: () => import('../views/tools/CutoutWhiteBgView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'upscale',
                    name: 'tools-upscale',
                    component: () => import('../views/tools/UpscaleView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'ai-shadow',
                    name: 'tools-ai-shadow',
                    component: () => import('../views/tools/AiShadowView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'omni-model',
                    name: 'tools-omni-model',
                    component: () => import('../views/tools/OmniModelView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'listing',
                    name: 'tools-listing',
                    component: () => import('../views/tools/listing/ListingEntryView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'listing/create',
                    name: 'tools-listing-create',
                    component: () => import('../views/tools/listing/ListingCreateView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'listing/optimize',
                    name: 'tools-listing-optimize',
                    component: () => import('../views/tools/listing/ListingOptimizeView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'aplus-wizard',
                    name: 'tools-aplus-wizard',
                    component: () => import('../views/tools/aplus/APlusWizardView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'jewelry-promo-video',
                    name: 'tools-jewelry-promo-video',
                    component: () => import('../views/tools/JewelryPromoVideoView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: ':toolId',
                    name: 'tools-tool',
                    component: () => import('../views/tools/ToolComingSoonView.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
            path: '/recharge',
            name: 'recharge',
            component: () => import('../views/RechargeView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/workbench',
            component: WorkbenchLayout,
            children: [
                {
                    path: '',
                    name: 'workbench',
                    component: () => import('../views/WorkbenchView.vue')
                }
            ],
            meta: { requiresAuth: true }
        },
        // Workflow routes - hybrid architecture
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
            path: '/workflow/jewelry',
            name: 'workflow-jewelry',
            component: () => import('../views/JewelryVideoView.vue'),
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
