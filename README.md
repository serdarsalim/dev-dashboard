# dev-dashboard

A local web dashboard for developers who work across multiple projects. Run, stop, and manage all your npm apps from one place — no more switching terminals or remembering which port is which.

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

```
┌─────────────────────────────────────────────────────────────────┐
│  dev-dashboard                              9 apps              │
├─────────────────────────────────────────────────────────────────┤
│  App                      Git            Port    Status         │
│  ─────────────────────────────────────────────────────────────  │
│  my-app                   ✓ committed   [3001]  ● running       │
│  another-project          ! 3 uncommit  [3002]  [ Run ▶ ]      │
│  side-project             ✓ committed   [3003]  [ Run ▶ ]      │
└─────────────────────────────────────────────────────────────────┘
```

## What it does

- **Auto-detects** every folder in your projects directory that has a `dev` script in `package.json`
- **Run / stop** any app with one click
- **Persistent ports** — assign each app a port once, it remembers
- **Git status** — see which apps have uncommitted changes at a glance
- **Quick actions** per app: open in Terminal, VS Code, Finder, or browser
- **Light and dark mode**
- **Restart button** — kills all running processes and reboots the dashboard cleanly
- **Startup cleanup** — clears stale lock files (Next.js etc.) and frees occupied ports on every start

Works with any framework: Next.js, Vite, Create React App, SvelteKit, Nuxt, or anything else that uses `npm run dev`.

## Who this is for

If you have a folder of independent projects and you're tired of `cd project && npm run dev` in a new terminal every time — this is for you. Freelancers, indie developers, and anyone managing more than a couple of local apps at once.

## Getting started

Clone this repo into the **parent folder** of your projects. Your structure should look like this:

```
my-projects/
  dev-dashboard/     ← this repo
  project-one/
  project-two/
  project-three/
```

Then:

```bash
cd dev-dashboard
npm install
npm start
```

Open `http://localhost:4000`.

That's it. It scans sibling folders automatically — no config file, no setup per project.

## Actions

Each app row has four quick-action buttons:

| Button | Action |
|--------|--------|
| ⌨ | Open project in Terminal |
| ⟨/⟩ | Open in VS Code |
| ⌂ | Reveal in Finder |
| ↗ | Open localhost URL in browser (only when running) |

## Requirements

- Node.js 18+
- macOS (Terminal and Finder actions use AppleScript/`open`)
- VS Code installed at the default `/Applications/Visual Studio Code.app` path

## Stack

Node.js + Express backend (~150 lines). Plain HTML + vanilla JS frontend (~250 lines). No build step, no framework, one dependency.
