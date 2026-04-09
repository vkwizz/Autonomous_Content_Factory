# Autonomous Content Factory (CYMONIC)

**Live Demo:** https://vkwizz.github.io/Autonomous_Content_Factory/#/

Autonomous Content Factory is an intelligent, multi-agent system designed to automatically transform raw source materials (like technical documents, product specs, or transcripts) into production-ready marketing campaigns. 

It uses a pipeline of AI agents (Lead Researcher, Creative Copywriter, Editor-in-Chief) and a local NLP validation layer to ensure high accuracy, adherence to facts, and zero hallucinations.

## Features

- **Multi-Agent Workflow:** Extracts facts, generates diverse content, and rigorously reviews for hallucinations and missing information.
- **Support for Multiple Formats:** Generates outputs including Blog Posts, Social Threads, Email Teasers, LinkedIn posts, Instagram captions, Flashcards, and Key Insights.
- **Strict Fact-Checking:** Integrates `compromise` (a local NLP engine) and an Editor-in-Chief LLM agent to enforce strict adherence to the provided fact sheet.
- **Agent Refinement Loops:** Direct human-in-the-loop feedback allows you to fine-tune specific campaign assets with precise instructions.
- **One-Click Export:** Download the entire AI-generated campaign as a `.zip` kit.
- **Modern UI:** Built with React and Vite for a seamless, glassmorphism-styled dashboard experience.

## Project Structure

This repository contains both the frontend and the backend for the Autonomous Content Factory.

- **Frontend:** React application powered by Vite (`App.jsx`, `index.css`, `main.jsx`).
- **Backend:** Express API server using Node.js, integrating with the Groq API for LLM inference (`server.js`).

## Prerequisites

- Node.js (v18 or higher recommended)
- Standard package manager (`npm`)
- A valid Groq API key

## Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vkwizz/Autonomous_Content_Factory.git
   cd Autonomous_Content_Factory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` (or create a new `.env` file) and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MODEL_NAME=llama-3.3-70b-versatile
   ```

4. **Start the Backend Server:**
   The backend handles the multi-agent LLM workflow and NLP processing.
   ```bash
   node server.js
   ```
   *(The backend server will run on `http://localhost:3000`)*

5. **Start the Frontend Development Server:**
   Open a new terminal window/tab:
   ```bash
   npm run dev
   ```
   *(The Vite development server will run on `http://localhost:5173` or similar port)*

6. Open your browser and navigate to the frontend URL to start building campaigns!

## Deployment Options

### Frontend (GitHub Pages / Vercel / Netlify)
The frontend uses Vite, which can be easily built and deployed. 
Make sure you set the `VITE_API_URL` environment variable during deployment to point to your live backend URL (e.g., your Render URL).
```bash
# Example build command for production
npm run build
```

### Backend Server (Render / Heroku / Fly.io)
The Express backend (`server.js`) can be hosted on a service like Render as a Node.js web service.
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- Make sure to set `GROQ_API_KEY` in the environment variables on Render.

## Built With
- **React & Vite** - Frontend architecture
- **Node.js & Express** - Backend API server
- **Groq API** - Ultra-fast LLM inference
- **Compromise NLP** - Local syntax and keyword validation
- **JSZip & FileSaver** - On-the-fly zip packaging
