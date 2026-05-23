import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.3,
      resizeOptions: { background: '#4F5EE6' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.3,
      resizeOptions: { background: '#4F5EE6' },
    },
    transparent: {
      ...minimal2023Preset.transparent,
      sizes: [64, 192, 512],
    },
  },
  images: ['public/icon-source.svg'],
})
