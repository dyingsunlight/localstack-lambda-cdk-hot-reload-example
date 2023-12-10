FROM node:18.17.0-alpine
WORKDIR /var/workspaces/
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g aws-cdk-local aws-cdk
COPY cdk/package.json cdk/pnpm-lock.yaml ./
RUN pnpm i
WORKDIR /var/workspaces/cdk
CMD [ "npm", "run", "dev"]
