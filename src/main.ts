import { createApp, type DirectiveBinding } from 'vue'
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

// 滚动入场动效：元素进入视口时淡入上移；v-reveal="120" 可设延迟(ms) 做错落
app.directive('reveal', {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const delay = Number(binding.value) || 0;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity .7s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,.61,.36,1) ${delay}ms`;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
  },
});

app.mount('#app')

// Initialize OverlayScrollbars on body
OverlayScrollbars(document.body, {
    scrollbars: {
        theme: 'os-theme-light', // Using light theme (dark scrollbars) for better blend on dark mode
        autoHide: 'move',
        clickScroll: true,
    },
});

