import pluginJest from 'eslint-plugin-jest';

export default [
  {
    // Global ignores
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      '.nyc_output/**',
      'src/js/vendor/**',
      'src/js/vendors.js',
      '**/*.min.js'
    ]
  },
  {
    // Configuration for all JavaScript files
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        
        // Third-party libraries
        App: 'writable',
        Backbone: 'readonly',
        _: 'readonly',
        ich: 'readonly',
        FB: 'readonly',
        Sentry: 'readonly',
        flowplayer: 'readonly',
        ga: 'readonly',
        moment: 'readonly',
        YT: 'readonly',
        Vimeo: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
        
        // Application-specific globals
        app: 'writable',
        $log: 'writable',
        $error: 'writable',
        disqus_shortname: 'writable',
        DISQUS: 'writable',
        url: 'writable',
        tr: 'readonly',
        Swiper: 'readonly',
        Option: 'readonly',
        alert: 'readonly',
        frontnavSwiper: 'writable',
        mySwiper: 'writable',
        myMovieSwiper: 'writable',
        filmnavSwiper: 'writable',
        Snap: 'readonly',
        initDisqus: 'writable',
        resetDisqus: 'writable',
        Image: 'readonly',
        screen: 'readonly',
        ActiveXObject: 'readonly',
        player: 'writable',
        $noop: 'readonly',
        split: 'writable',
        session: 'writable',
        NotificationFx: 'readonly',
        L: 'readonly',
        $f: 'readonly',
        BackbonePolling: 'readonly',
        Blazy: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        
        // Webpack DefinePlugin injected globals
        // 'process.env.*' variables are replaced at build time by webpack
        process: 'readonly'
      }
    },
    rules: {
      // Error prevention
      'no-undef': 'error',
      'no-unused-vars': ['warn', { 
        vars: 'all', 
        args: 'after-used',
        ignoreRestSiblings: false 
      }],
      'no-implicit-globals': 'error',
      'no-global-assign': 'error',
      
      // Legacy code support (turn off modern JS rules)
      'prefer-const': 'off',
      'no-var': 'off',
      
      // Code quality
      'no-console': 'warn',
      'eqeqeq': ['warn', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-proto': 'error',
      'no-script-url': 'error',
      'no-with': 'error',
      'guard-for-in': 'warn',
      'no-extend-native': 'error',
      'no-iterator': 'error',
      'no-loop-func': 'warn',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'off',
      'no-return-assign': ['error', 'except-parens'],
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'warn',
      'no-useless-call': 'warn',
      'no-useless-concat': 'warn',
      'no-void': 'error',
      'radix': 'warn',
      'wrap-iife': ['error', 'any'],
      'yoda': 'warn'
    }
  },
  {
    // Configuration for test files
    files: ['tests/**/*.js'],
    ...pluginJest.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...pluginJest.configs['flat/recommended'].languageOptions.globals,
        global: 'writable',
        require: 'readonly'
      }
    }
  }
];
