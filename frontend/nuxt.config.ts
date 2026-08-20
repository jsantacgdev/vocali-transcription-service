import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  nitro: {
    preset: "static",
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      cognitoUserPoolId: process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.NUXT_PUBLIC_COGNITO_CLIENT_ID,
    },
  },
});
