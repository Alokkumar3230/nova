# NOVA

**Plan. Collaborate. Deliver.**

NOVA is a full-stack project management app that helps teams plan their work, collaborate on tasks, and deliver results. Inside NOVA you can create projects, add team members, organise work on a Kanban-style task board, leave comments on tasks, and follow everything that happens through an activity log. It is built to feel modern and professional, whether you are running a small team or just keeping your own projects on track.

## What's inside

NOVA is made of two main parts that work together:

- **Frontend** — the part you see and interact with in your browser. It is built with React, TypeScript, and Tailwind CSS, which together give NOVA a fast, responsive, and polished interface.
- **Backend** — the part that stores and manages your data. It is written in Motoko and runs on the Internet Computer, a decentralised cloud platform. This is where projects, tasks, comments, and activity are kept safe.

To sign in, NOVA uses **Internet Identity** — a secure, password-free way to log in. You do not need to remember a username or password; you just approve the sign-in with your Internet Identity and you are in.

## Before you start

To run NOVA on your own machine, you will need a few tools installed. Here is what they are and what they are used for:

| Tool | What it is for |
| --- | --- |
| Node.js with pnpm | Runs the frontend and manages its packages |
| mops | Manages the backend (Motoko) packages |

To check whether a tool is already installed, open a terminal and run the tool's name followed by `--version`. For example, `node --version` or `mops --version`. If the tool is installed, you will see a version number. If not, you will get a "command not found" message, which means you should install it first.

## Setting up the project

Once your tools are ready, set up the project's dependencies in two steps:

1. From the project root, run `pnpm install`. This installs the frontend dependencies.
2. From the `src/backend/` folder, run `mops install`. This installs the backend dependencies.

## Running NOVA locally

With everything installed, you can start NOVA on your own machine:

1. From the `src/frontend/` folder, run `pnpm dev` to start the frontend development server.
2. Open the URL shown in the terminal (usually http://localhost:5173) in your browser.
3. Sign in with your Internet Identity, and NOVA is ready to use.

The backend does not need to be deployed manually. NOVA is a Caffeine platform app: the backend is hosted and deployed through the Caffeine platform, which also fills in the connection details automatically. You only need to run the frontend development server locally.

## Environment variables

NOVA reads a few configuration values from a file called `env.json` in the frontend folder. These tell the app where the backend lives and how to connect to it.

| Variable | Purpose |
| --- | --- |
| `backend_host` | The host address where the backend canister is reachable |
| `backend_canister_id` | The unique identifier of the backend canister |
| `project_id` | The identifier of the project / deployment |
| `ii_derivation_origin` | The origin used for Internet Identity sign-in |
| `storage_gateway_url` | The URL of the storage gateway for file access |

When developing locally, these values are left as placeholders. The platform fills them in automatically when NOVA is deployed, so you normally do not need to change them yourself.

## Useful commands

Here are the commands you will use most often while working with NOVA:

| Command | Where to run it | What it does |
| --- | --- | --- |
| `pnpm dev` | `src/frontend/` | Starts the frontend development server |
| `pnpm build` | project root | Builds the frontend for production |
| `pnpm typecheck` | project root | Type-checks the frontend code |
| `pnpm fix` | project root | Auto-fixes linting and formatting issues |
| `pnpm bindgen` | project root | Regenerates the frontend-backend connection after backend changes |
| `pnpm test` | project root | Runs the automated tests |
| `mops check --fix` | `src/backend/` | Checks and fixes the backend code |
| `mops build` | `src/backend/` | Builds the backend |

## How the pieces fit together

**Frontend** (`src/frontend/`) holds all the user-facing code — the screens, components, and styling that make up the NOVA interface you see in the browser.

**Backend** (`src/backend/`) holds the Motoko code that runs on the Internet Computer. It stores your projects, tasks, comments, and activity, and handles the logic behind the scenes.

**Bindings** connect the two. When the backend changes, you run `pnpm bindgen` to regenerate the connection layer that lets the frontend talk to the backend. This keeps the two sides in sync so the app keeps working smoothly.

## Need help?

If something is not working or you have a question, start by checking the commands above and making sure each step ran without errors. If you are still stuck, reach out to the team — we are happy to help you get NOVA up and running.
