import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    {
        ignores: [
            'dist', 
            'vendor', 
            'public', 
            'bootstrap/cache', 
            'storage',
            'resources/js/Components/UI/ConfirmationModal.jsx', // Excluding large UI components for now if needed
        ],
    },
    {
        files: ['resources/js/**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react/prop-types': 'off',
            'react/jsx-no-target-blank': 'off',
            'no-unused-vars': ['warn', { varsIgnorePattern: 'React' }],
        },
        settings: {
            react: {
                version: '18.2',
            },
        },
    },
];
