# RetroMSTeams Frontend

Frontend for a Microsoft Teams tab application built with React + TypeScript + Vite and packaged/deployed with Microsoft 365 Agents Toolkit.

## Tech Stack

- React 19
- TypeScript
- Vite
- Microsoft Teams JavaScript SDK
- Microsoft 365 Agents Toolkit (`m365agents.yml`)

## Prerequisites

Before you start, install and configure:

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm (comes with Node.js)
- A Microsoft 365 developer tenant/account
- Azure subscription (for cloud deployment)
- One of:
  - [Microsoft 365 Agents Toolkit extension](https://aka.ms/teams-toolkit) in VS Code, or
  - [Microsoft 365 Agents Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)

## Project Structure

- `src/` - frontend source code and server entrypoint
- `appPackage/` - Teams app manifest and package assets
- `env/` - environment files for local/dev/prod
- `infra/` - Azure infrastructure templates (Bicep)
- `m365agents.yml` - main provision/deploy/publish pipeline
- `m365agents.local.yml` - local environment overrides

## Installation

```bash
npm install
```

## Environment Configuration

The app reads backend URLs from Vite env variables:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

For local development, update `env/.env.local` (or `env/.env.dev`) values:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

For production build/deployment, set values in `.env.production` (example in this repo):

```env
VITE_API_URL=https://your-backend/api
VITE_SOCKET_URL=https://your-backend
```

## Run the Project Locally

### Recommended: Run in Teams (Toolkit flow)

1. Open the project in VS Code with Microsoft 365 Agents Toolkit.
2. Sign in to Microsoft 365 (and Azure if prompted).
3. Start debug (`F5`) with **Debug in Teams (Edge/Chrome)**.
4. Toolkit provisions local settings, generates certs, and launches the app in Teams web.

### CLI-based local flow (Toolkit)

Use Microsoft 365 Agents Toolkit CLI to run the lifecycle for local environment:

```bash
teamsapp provision --env local
teamsapp deploy --env local
```

Then run the app:

```bash
npm run dev
```

## Available npm Scripts

- `npm run dev` - build and run the local server with `nodemon`
- `npm run build` - build server and frontend into `dist/`
- `npm run build:frontend` - build frontend assets only
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode
- `npm run test:integration` - run integration tests
- `npm run lint` - run ESLint
- `npm run lint:fix` - run ESLint with auto-fixes
- `npm run format` - format code with Prettier

## Build for Production

```bash
npm run build
```

Build output:

- Server bundle: `dist/`
- Frontend static assets: `dist/client/`

## Deploy to Azure (Teams Toolkit Pipeline)

This repo is configured to deploy via `m365agents.yml`.

### 1. Provision cloud resources

```bash
teamsapp provision --env dev
```

What this does:

- Creates/updates Teams app registration
- Deploys Azure resources from `infra/azure.bicep`
- Updates environment variables in `env/.env.dev`

### 2. Deploy application code

```bash
teamsapp deploy --env dev
```

What this does:

- Runs `npm install`
- Runs `npm run build`
- Deploys the app to Azure App Service (zip deploy)

### 3. (Optional) Publish app package

```bash
teamsapp publish --env dev
```

This submits the generated app package to Teams Admin Center for review/approval.

## Post-Deployment Checklist

- Verify app URL and domain values in generated environment files (`TAB_ENDPOINT`, `TAB_DOMAIN`)
- Ensure backend URLs (`VITE_API_URL`, `VITE_SOCKET_URL`) point to reachable production services
- Install/update the app in Teams and test tab loading in personal/team scopes

## Troubleshooting

- **App does not load in Teams:** check `TAB_ENDPOINT` and `TAB_DOMAIN` in `env/.env.<env>`.
- **HTTPS/certificate issues locally:** rerun local deploy/provision so Toolkit regenerates trusted certs.
- **Frontend cannot reach backend:** verify `VITE_API_URL` and `VITE_SOCKET_URL` values for the active environment.
- **Deployment fails in Azure step:** make sure you are logged into the correct Azure subscription and resource group.
