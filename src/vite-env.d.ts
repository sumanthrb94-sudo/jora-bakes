/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_ADMIN_EMAILS: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
