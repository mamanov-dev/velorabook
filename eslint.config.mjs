import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Базовые конфигурации Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Prettier интеграция
  ...compat.extends("prettier"),
  
  // TypeScript конфигурации
  ...compat.extends("@typescript-eslint/recommended"),
  
  // Настройки для всех файлов
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      security,
    },
    rules: {
      // =====================================
      // Правила безопасности
      // =====================================
      
      // Предотвращение XSS
      "security/detect-object-injection": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",
      
      // =====================================
      // TypeScript специфичные правила
      // =====================================
      
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "warn",
      
      // =====================================
      // React специфичные правила  
      // =====================================
      
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-unescaped-entities": "error",
      "react/jsx-no-script-url": "error",
      "react/jsx-no-target-blank": ["error", { 
        allowReferrer: false,
        enforceDynamicLinks: "always"
      }],
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-boolean-value": ["warn", "never"],
      
      // Хуки
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // =====================================
      // Общие правила качества кода
      // =====================================
      
      // Предотвращение ошибок
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-prototype-builtins": "error",
      "no-extend-native": "error",
      "no-global-assign": "error",
      "no-implicit-globals": "error",
      
      // Качество кода
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-expressions": "error",
      "no-unreachable": "error",
      "no-duplicate-imports": "error",
      "no-useless-return": "warn",
      "no-useless-concat": "warn",
      "no-template-curly-in-string": "warn",
      
      // Стиль кода
      "prefer-template": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      "prefer-arrow-callback": "warn",
      "object-shorthand": "warn",
      "quote-props": ["warn", "as-needed"],
      
      // Именование
      "camelcase": ["warn", { 
        properties: "never",
        ignoreDestructuring: true,
        ignoreImports: true
      }],
      
      // =====================================
      // Next.js специфичные правила
      // =====================================
      
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-unwanted-polyfillio": "error",
      "@next/next/no-page-custom-font": "error",
      "@next/next/no-css-tags": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-document-import-in-page": "error",
      "@next/next/no-head-import-in-document": "error",
      
      // =====================================
      // Производительность
      // =====================================
      
      "no-await-in-loop": "warn",
      "prefer-promise-reject-errors": "error",
      "no-return-await": "error",
      
      // =====================================
      // Доступность
      // =====================================
      
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },
  
  // Настройки для серверного кода
  {
    files: ["src/app/api/**/*.ts", "src/lib/**/*.ts", "scripts/**/*.ts"],
    rules: {
      // Дополнительные правила безопасности для серверного кода
      "security/detect-child-process": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",
      
      // Разрешаем console.log в серверном коде
      "no-console": "off",
      
      // Более строгие правила для API
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  
  // Настройки для тестовых файлов
  {
    files: ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}", "scripts/test-*.ts"],
    rules: {
      // Разрешения для тестов
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
  
  // Настройки для конфигурационных файлов
  {
    files: ["*.config.{js,ts,mjs}", "tailwind.config.js", "postcss.config.mjs"],
    rules: {
      // Разрешения для конфигов
      "security/detect-non-literal-require": "off",
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off",
    },
  },
  
  // Настройки для Prisma схемы
  {
    files: ["prisma/**/*"],
    rules: {
      // Отключаем большинство правил для Prisma
      "security/detect-non-literal-fs-filename": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  
  // Глобальные настройки
  {
    languageOptions: {
      globals: {
        // Node.js глобальные переменные
        "process": "readonly",
        "Buffer": "readonly",
        "__dirname": "readonly",
        "__filename": "readonly",
        "global": "readonly",
        
        // Browser глобальные переменные
        "window": "readonly",
        "document": "readonly",
        "navigator": "readonly",
        "console": "readonly",
        "fetch": "readonly",
        
        // Next.js глобальные переменные
        "__BUILD_ID__": "readonly",
        "__BUILD_DATE__": "readonly",
        "__IS_DEV__": "readonly",
        "__IS_SERVER__": "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
  },
  
  // Игнорирование определенных файлов и папок
  {
    ignores: [
      ".next/**/*",
      "out/**/*",
      "dist/**/*",
      "build/**/*",
      "node_modules/**/*",
      "public/**/*",
      "*.min.js",
      "coverage/**/*",
      ".vercel/**/*",
      ".env*",
      "*.log",
      "src/generated/**/*",
    ],
  },
];

export default eslintConfig;