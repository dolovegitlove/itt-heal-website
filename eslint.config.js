import js from '@eslint/js';

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',

        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',

        // Custom project globals
        API_BASE_URL: 'readonly',
        SITE_CONFIG: 'readonly'
      }
    },
    rules: {
      // Critical rules to catch duplicate functions and quality issues
      'no-redeclare': 'error', // Prevents duplicate function definitions
      'no-unreachable': 'error', // Catches dead code after return statements
      'no-unused-vars': 'warn', // Warns about unused variables
      'no-eval': 'error', // Prevents eval() usage (security)
      'no-implied-eval': 'error', // Prevents implied eval (security)
      'no-script-url': 'error', // Prevents javascript: URLs (security)
      'no-global-assign': 'error', // Prevents global variable overwrites
      'no-implicit-globals': 'error', // Prevents implicit global variables
      'no-undef': 'error', // Prevents undefined variables
      'no-console': 'warn', // Warns about console statements
      'consistent-return': 'error', // Requires consistent return statements
      'curly': 'error', // Requires curly braces for all control statements
      'default-case': 'error', // Requires default case in switch statements
      'dot-notation': 'error', // Enforces dot notation when possible
      'eqeqeq': 'error', // Requires strict equality (=== and !==)
      'guard-for-in': 'error', // Requires hasOwnProperty in for-in loops
      'no-alert': 'error', // Disallows alert, confirm, prompt
      'no-caller': 'error', // Disallows arguments.caller/callee
      'no-else-return': 'error', // Disallows else after return in if
      'no-empty-function': 'error', // Disallows empty functions
      'no-eq-null': 'error', // Disallows == null comparisons
      'no-floating-decimal': 'error', // Disallows floating decimals
      'no-implicit-coercion': 'error', // Disallows implicit type conversions
      'no-invalid-this': 'error', // Disallows this outside classes/methods
      'no-lone-blocks': 'error', // Disallows unnecessary nested blocks
      'no-loop-func': 'error', // Disallows function declarations in loops
      'no-multi-spaces': 'error', // Disallows multiple consecutive spaces
      'no-new': 'error', // Disallows new without assignment
      'no-new-func': 'error', // Disallows new Function()
      'no-new-wrappers': 'error', // Disallows new String/Number/Boolean
      'no-octal-escape': 'error', // Disallows octal escape sequences
      'no-param-reassign': 'error', // Disallows reassignment of parameters
      'no-proto': 'error', // Disallows __proto__ usage
      'no-return-assign': 'error', // Disallows assignment in return statements
      'no-self-compare': 'error', // Disallows self-comparison
      'no-sequences': 'error', // Disallows comma operator
      'no-throw-literal': 'error', // Disallows throwing non-Error objects
      'no-unmodified-loop-condition': 'error', // Disallows unmodified loop conditions
      'no-unused-expressions': 'error', // Disallows unused expressions
      'no-useless-call': 'error', // Disallows unnecessary .call()/.apply()
      'no-useless-concat': 'error', // Disallows unnecessary string concatenation
      'no-useless-escape': 'error', // Disallows unnecessary escape characters
      'no-useless-return': 'error', // Disallows unnecessary return statements
      'no-void': 'error', // Disallows void operator
      'no-with': 'error', // Disallows with statements
      'prefer-promise-reject-errors': 'error', // Requires Error objects for Promise rejections
      'radix': 'error', // Requires radix parameter for parseInt()
      'vars-on-top': 'error', // Requires var declarations at function top
      'wrap-iife': 'error', // Requires parentheses around immediately invoked functions
      'yoda': 'error', // Requires literal-first comparisons

      // Style rules for consistency
      'indent': ['error', 2], // 2-space indentation
      'linebreak-style': ['error', 'unix'], // Unix linebreaks
      'quotes': ['error', 'single'], // Single quotes
      'semi': ['error', 'always'], // Semicolons required
      'comma-dangle': ['error', 'never'], // No trailing commas
      'no-trailing-spaces': 'error', // No trailing whitespace
      'eol-last': 'error', // Newline at end of files
      'no-multiple-empty-lines': ['error', { max: 2 }], // Max 2 consecutive empty lines

      // Additional security and quality rules
      'no-buffer-constructor': 'error', // Disallows Buffer() constructor
      'no-mixed-requires': 'error', // Disallows mixed require() calls
      'no-new-require': 'error', // Disallows new require()
      'no-path-concat': 'error', // Disallows path concatenation with __dirname/__filename
      'no-process-env': 'warn', // Warns about process.env usage
      'no-process-exit': 'error', // Disallows process.exit()
      'no-sync': 'warn' // Warns about synchronous methods
    },
    ignores: [
      'node_modules/**',
      'backend/node_modules/**',
      '**/*.min.js',
      'dist/**',
      'build/**'
    ]
  },

  // Override rules for test files
  {
    files: ['**/*.test.js', '**/*test*.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {
      'no-console': 'off', // Allow console in tests
      'no-unused-expressions': 'off' // Allow unused expressions in tests
    }
  },

  // Override rules for script files
  {
    files: ['scripts/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console in scripts
      'no-process-exit': 'off' // Allow process.exit in scripts
    }
  }
];
