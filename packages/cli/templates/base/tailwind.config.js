/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './ui/**/*.{ts,tsx,html}',
        './modules/**/ui/**/*.{ts,tsx}',
        './node_modules/@merinaa/ui/src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
