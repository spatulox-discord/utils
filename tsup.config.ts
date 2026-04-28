import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],                    // VOTRE index.ts
        format: ['cjs', 'esm'],                     // CommonJS + ESM
        dts: true,                                  // Génère .d.ts
        sourcemap: false,                           // Pas de .map
        clean: true,                                // Nettoie dist/
        outDir: 'dist'
    }
])