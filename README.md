# DS Tracker Order · NOVA DS

> El ciclo de vida de nuestros componentes, bajo control.

Plataforma interna de gestión de evolutivos y bugs de componentes del Design System NOVA DS.

## Stack

- **React 18** + **Vite**
- **Supabase** — base de datos y API REST
- CSS-in-JS con variables de tema (dark / light mode)

## Instalación local

```bash
# 1. Clonar el repo
git clone https://github.com/Corinet/ds-tracker-order.git
cd ds-tracker-order

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# → Editá .env.local con tus credenciales de Supabase

# 4. Correr en desarrollo
npm run dev
```

## Variables de entorno

Copiá `.env.example` como `.env.local` y completá los valores:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ Nunca subas `.env.local` al repositorio. Ya está en `.gitignore`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `localhost:5173` |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Preview del build de producción |

## Estructura

```
ds-tracker-order/
├── src/
│   ├── App.jsx        # Componente principal
│   └── main.jsx       # Entry point
├── .env.example       # Template de variables de entorno
├── .env.local         # Variables locales (no se sube al repo)
├── index.html
├── vite.config.js
└── package.json
```

## Deploy

Recomendado: **Vercel**

1. Importar el repo desde vercel.com
2. Agregar las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push a `main`
