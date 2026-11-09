# TASKFLOW

A premium, full-stack personal task management application.

## 🌐 Live Demo
[Taskflow Live Link](https://taskflow-752q.vercel.app/)

## 🛠 Tech Stack
- React + Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- PostgreSQL (with Row Level Security)
- Vercel (Deployment)

## ✨ Features
- User signup and secure login
- Personal dashboard with task statistics
- Create, read, update, and delete (CRUD) tasks
- Mark tasks as completed
- Search and filter tasks
- Priority and due dates
- User-specific data security (RLS)

## 🚀 Local Setup
1. Clone the repository: `git clone <your-repo-link>`
2. Install dependencies: `npm install`
3. Create a `.env.local` file and add:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key