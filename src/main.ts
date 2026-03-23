import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { OverlayScrollbars, ClickScrollPlugin } from 'overlayscrollbars';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css';
import './style.css'
import './assets/main.scss'

// Register plugins if needed, though ClickScrollPlugin is optional/included often
OverlayScrollbars.plugin(ClickScrollPlugin);

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Initialize OverlayScrollbars on body
OverlayScrollbars(document.body, {
    scrollbars: {
        theme: 'os-theme-light', // Using light theme (dark scrollbars) for better blend on dark mode
        autoHide: 'move',
        clickScroll: true,
    },
});

