# --- Étape 1 : Installation des Dépendances ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copie uniquement les fichiers de dépendances pour optimiser le cache de couche Docker
COPY package.json package-lock.json ./
RUN npm ci

# --- Étape 2 : Construction de l'Application (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génération du client Prisma (Crucial pour le multi-tenancy)
# On désactive la télémétrie Next.js pendant le build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# --- Étape 3 : Exécution de l'Application (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Création d'un utilisateur non-privilégié pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie des fichiers nécessaires depuis le builder (Standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# On utilise localhost par défaut si non spécifié via docker-compose
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
