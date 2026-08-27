<div align="center">

# ⚡ WORK MATE

### AI-Powered Career & Productivity Workspace

**Create · Improve · Discover · Work Smarter**

*A modern AI workspace designed to help users with career tools, content creation and job discovery.*

[![🌐 Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Work--Mate-7c3aed?style=for-the-badge)](https://work-mate-five.vercel.app/)
[![📦 GitHub](https://img.shields.io/badge/📦_GitHub-Work--Mate-181717?style=for-the-badge\&logo=github)](https://github.com/Ratondutta12345/Work-Mate)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge\&logo=vite)](https://vite.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-AI-412991?style=for-the-badge\&logo=openai)](https://openai.com/)

**🤖 One workspace. Multiple AI-powered tools.**

</div>

---

## 🚀 About

**Work Mate** is an AI-powered web platform that brings useful career and productivity tools into one workspace.

Instead of switching between different applications, users can access AI-powered tools, manage their profile, explore jobs and work from a centralized dashboard.

The project uses a **React + Vite frontend with a dedicated backend server** and OpenAI-powered functionality.

---

## ✨ Features

| 🤖 AI Tools           | 💼 Career         | ⚡ Workspace         |
| --------------------- | ----------------- | ------------------- |
| AI Content Generation | 🔎 Job Discovery  | 📊 Dashboard        |
| AI-powered Tools      | 👤 User Profile   | 🧰 Tool Workspace   |
| Smart Assistance      | 📄 Career Support | 🎯 Personalized Hub |

### 🔐 Authentication

* User registration & login
* Protected application areas
* User profile management

### 💼 Job Platform

* Job discovery
* Job-related workspace
* Profile-based career experience

### 🧠 AI Workspace

* AI-powered tools
* Dedicated tool workspace
* OpenAI API integration

---

## 🧩 How It Works

```text
                 ⚡ WORK MATE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       🤖 AI         💼 JOBS      👤 PROFILE
          │            │            │
          └────────────┼────────────┘
                       ▼
                 📊 WORKSPACE
                       │
                       ▼
                🎯 GET THINGS DONE
```

---

## 🛠️ Tech Stack

| Layer              | Technology                |
| ------------------ | ------------------------- |
| 🎨 Frontend        | React 19                  |
| ⚡ Build Tool       | Vite 8                    |
| 🧭 Routing         | React Router              |
| 🤖 AI              | OpenAI API                |
| 🔌 Backend         | Node.js server            |
| 🗄️ Database       | SQL                       |
| 🔐 Auth            | Custom authentication API |
| 📦 Package Manager | npm                       |

The repository separates the frontend `src` application from a dedicated `server` application, with API, authentication, jobs and storage services.

---

## 🏗️ Architecture

```text
                    👤 USER
                      │
                      ▼
              ┌───────────────┐
              │ React + Vite  │
              └───────┬───────┘
                      │
                 REST / API
                      │
                      ▼
              ┌───────────────┐
              │    SERVER     │
              └───────┬───────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       🔐 Auth      💼 Jobs     🗄️ Data
                      │
                      ▼
                 🤖 OpenAI
```

---

## 📂 Project Structure

```text
Work-Mate/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   │   ├── jobs/
│   │   ├── Dashboard
│   │   ├── Workspace
│   │   ├── Profile
│   │   └── Authentication
│   │
│   └── services/
│       ├── api.js
│       ├── authApi.js
│       ├── jobsApi.js
│       └── storage.js
│
├── server/
│   ├── src/
│   └── sql/
│
├── public/
├── package.json
└── vite.config.js
```

The current source structure includes dedicated pages for jobs, authentication, dashboard, profile and workspace, plus separate API/service modules.

---

## ⚙️ Run Locally

```bash
# Clone
git clone https://github.com/Ratondutta12345/Work-Mate.git

cd Work-Mate

# Install frontend
npm install

# Install backend
npm run server:install

# Start frontend + backend
npm run dev:all
```

### Useful Commands

| Command              | Purpose              |
| -------------------- | -------------------- |
| `npm run dev`        | Frontend development |
| `npm run dev:server` | Backend development  |
| `npm run dev:all`    | Frontend + backend   |
| `npm run build`      | Production build     |
| `npm run lint`       | ESLint               |
| `npm run db:setup`   | Database setup       |
| `npm run db:migrate` | Database migrations  |
| `npm run db:seed`    | Seed database        |

These scripts are defined in the repository's current `package.json`.

---

## 🎯 What This Project Demonstrates

```text
✓ React Development
✓ Modern Vite Architecture
✓ REST API Integration
✓ Backend Development
✓ Authentication
✓ SQL Database
✓ AI / OpenAI Integration
✓ Job Platform Features
✓ Dashboard Architecture
✓ Reusable Components
✓ Full-Stack Development
```

---

## 🌐 Links

|                    |                                              |
| ------------------ | -------------------------------------------- |
| 🌐 **Live App**    | https://work-mate-five.vercel.app/           |
| 📦 **Source Code** | https://github.com/Ratondutta12345/Work-Mate |

---

<div align="center">

### ⚡ Work smarter. Build faster.

**Built with React · Vite · Node.js · SQL · OpenAI**

### 👨‍💻 Raton Dutta

[GitHub](https://github.com/Ratondutta12345) · [LinkedIn](https://linkedin.com/in/raton-dutta-944370354)

⭐ **Star the repository if you like Work Mate!**

</div>
