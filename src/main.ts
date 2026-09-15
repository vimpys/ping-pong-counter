import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@fontsource/anuphan/400.css'
import '@fontsource/anuphan/500.css'
import '@fontsource/anuphan/600.css'
import '@fontsource/chakra-petch/500.css'
import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import './assets/main.css'

import App from './App.vue'
import { installBackButton } from './native/backButton'
import { registerPwa } from './native/pwa'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
installBackButton()
void registerPwa()
