import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  external: [],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['> 1%', 'last 2 versions', 'not dead']
          }
        }]
      ]
    }),
    isProduction && terser({
      compress: {
        drop_console: true
      }
    })
  ].filter(Boolean)
};

export default [
  // Main component - UMD build
  {
    ...baseConfig,
    input: 'markdown-editor-component.js',
    output: {
      file: 'dist/markdown-editor-component.js',
      format: 'umd',
      name: 'MarkdownEditorComponent',
      sourcemap: !isProduction
    }
  },
  
  // Main component - ES module build
  {
    ...baseConfig,
    input: 'markdown-editor-component.js',
    output: {
      file: 'dist/markdown-editor-component.esm.js',
      format: 'es',
      sourcemap: !isProduction
    }
  },
  
  // Integration layer - UMD build
  {
    ...baseConfig,
    input: 'markdown-editor-integration.js',
    output: {
      file: 'dist/markdown-editor-integration.js',
      format: 'umd',
      name: 'MarkdownEditorIntegration',
      sourcemap: !isProduction
    }
  },
  
  // Integration layer - ES module build
  {
    ...baseConfig,
    input: 'markdown-editor-integration.js',
    output: {
      file: 'dist/markdown-editor-integration.esm.js',
      format: 'es',
      sourcemap: !isProduction
    }
  },
  
  // Minified versions for CDN
  isProduction && {
    ...baseConfig,
    input: 'markdown-editor-component.js',
    output: {
      file: 'dist/markdown-editor-component.min.js',
      format: 'umd',
      name: 'MarkdownEditorComponent'
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: true
      })
    ]
  }
].filter(Boolean);