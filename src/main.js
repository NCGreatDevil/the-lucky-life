import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.css'

import 'wired-elements/lib/wired-button.js'
import 'wired-elements/lib/wired-card.js'
import 'wired-elements/lib/wired-input.js'
import 'wired-elements/lib/wired-textarea.js'
import 'wired-elements/lib/wired-checkbox.js'
import 'wired-elements/lib/wired-radio.js'
import 'wired-elements/lib/wired-combo.js'
import 'wired-elements/lib/wired-progress.js'
import 'wired-elements/lib/wired-divider.js'
import 'wired-elements/lib/wired-toggle.js'
import 'wired-elements/lib/wired-slider.js'
import 'wired-elements/lib/wired-tabs.js'
import 'wired-elements/lib/wired-tab.js'
import 'wired-elements/lib/wired-dialog.js'
import 'wired-elements/lib/wired-spinner.js'
import 'wired-elements/lib/wired-fab.js'
import 'wired-elements/lib/wired-icon-button.js'
import 'wired-elements/lib/wired-link.js'
import 'wired-elements/lib/wired-image.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
