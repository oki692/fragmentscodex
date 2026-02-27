export function getTemplateIdSuffix(id: string) {
  return id
}

export function getTemplateId(id: string) {
  return id.replace(/-dev$/, '')
}

const templates = {
  [getTemplateIdSuffix('nextjs-developer')]: {
    name: 'Next.js',
    lib: [
      'nextjs@14.2.5',
      'typescript',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'postcss',
      'tailwindcss',
      'shadcn',
    ],
    file: null,
    instructions:
      'A Next.js 13+ app that reloads automatically. Using the pages router. Supports multi-file applications with components, pages, and styles.',
    port: 3000,
    enabled: true,
  },

  [getTemplateIdSuffix('svg')]: {
    name: 'SVG',
    lib: [],
    file: 'image.svg',
    instructions: 'A pure SVG template. Generates only SVG code with local browser preview. No E2B sandbox needed.',
    port: null,
    enabled: true,
  },
  [getTemplateIdSuffix('vue-developer')]: {
    name: 'Vue.js',
    lib: ['vue@latest', 'nuxt@3.13.0', 'tailwindcss'],
    file: null,
    instructions:
      'A Vue.js 3+ app that reloads automatically. Using Nuxt 3. Supports multi-file applications with components, pages, and layouts.',
    port: 3000,
    enabled: true,
  },
  [getTemplateIdSuffix('streamlit-developer')]: {
    name: 'Streamlit',
    lib: [
      'streamlit',
      'pandas',
      'numpy',
      'matplotlib',
      'requests',
      'seaborn',
      'plotly',
    ],
    file: 'app.py',
    instructions: 'A streamlit app that reloads automatically.',
    port: 8501,
    enabled: false,
  },
  [getTemplateIdSuffix('gradio-developer')]: {
    name: 'Gradio',
    lib: [
      'gradio',
      'pandas',
      'numpy',
      'matplotlib',
      'requests',
      'seaborn',
      'plotly',
    ],
    file: 'app.py',
    instructions:
      'A gradio app. Gradio Blocks/Interface should be called demo.',
    port: 7860,
    enabled: false,
  },
  'code-interpreter-v1': {
    name: 'Python data analyst',
    lib: [
      'python',
      'jupyter',
      'numpy',
      'pandas',
      'matplotlib',
      'seaborn',
      'plotly',
    ],
    file: 'script.py',
    instructions:
      'Runs code as a Jupyter notebook cell. Strong data analysis angle. Can use complex visualisation to explain results.',
    port: null,
    enabled: false,
  },
}

export type Templates = typeof templates
export default templates

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates)
    .filter(([, t]) => t.enabled)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'multiple files'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`,
    )
    .join('\n')}`
}
