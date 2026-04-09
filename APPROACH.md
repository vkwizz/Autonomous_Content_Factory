# CYMONIC - Approach Document



## 1. Solution Design & Architecture

CYMONIC is an **Autonomous Multi-Agent Content Generation System** designed to solve the problem of "Hallucination-Prone AI" in marketing. Most AI tools generate creative content but often lose track of technical constraints or unique product facts. 

Our solution implements a **Sequential Multi-Agent Pipeline** with a **Local NLP Validation Layer**:

1.  **NLP Preprocessor (Compromise.js):** Before hitting the LLM, the raw input is parsed locally to extract key entities, metrics, and technical constraints. This creates a "Source of Truth" anchor.
2.  **Lead Research Agent:** An LLM agent that interprets the raw data into a structured JSON Fact Sheet, identifying target audiences and value propositions.
3.  **Creative Copywriter Agent:** Generates diverse marketing assets (Blogs, Social Threads, Emails, LinkedIn posts) using the Fact Sheet as a strict constraint.
4.  **Editor-in-Chief Agent:** A final validation agent that cross-references all generated content against the initial Fact Sheet and NLP-extracted entities to ensure 99% factual accuracy.
5.  **Human-in-the-Loop Dashboard:** A premium React-based interface where users watch agents collaborate in real-time and can approve/edit drafts before exporting.

## 2. Tech Stack Choices & Rationale

*   **Frontend: React + Vite + Vanilla CSS:** Chosen for high performance and total design control. We implemented a **Glassmorphism design system** to give the "Agent Room" a premium, state-of-the-art feel that wows the user.
*   **Backend: Node.js + Express:** Provides a lightweight, scalable environment for managing asynchronous agent calls and streaming logs to the frontend via Server-Sent Events (SSE).
*   **LLM Inference: Groq API (Llama 3.3 70B):** Selected for its **ultra-fast inference speeds**. In a multi-agent system, latency compounds; Groq allows our 4-agent pipeline to complete a 360° campaign in under 10 seconds.
*   **Local NLP: Compromise.js:** Used for rule-based entity extraction. This provides a "deterministic" check that catches errors LLMs might miss, acting as a secondary safety net for factual accuracy.
*   **State Management: React Context API:** Sufficient for the app's scale, ensuring a single source of truth for the campaign data across the Dashboard, History, and Review pages.

## 3. Improvements with More Time

If given more time, we would implement the following:
*   **Dynamic Image Generation:** Integration with DALL-E 3 or Stable Diffusion to automatically generate on-brand social media graphics for the Instagram slides.
*   **SEO Optimization Agent:** A specialized agent that performs real-time keyword volume analysis to optimize the blog posts for search rankings.
*   **Multi-Format File Support:** Native parsing for PDF/DOCX files using OCR (currently supports text/markdown).

## 4. Additional Features Implemented

*   **Real-Time Streaming Logs:** Users can see exactly what each agent is thinking and doing, increasing trust in the autonomous process.
*   **Device Preview Toggles:** Instantly switch between Mobile and Desktop views for all generated content.
*   **One-Click ZIP Export:** Automatically packages all markdown, HTML, and text assets into a single ZIP for immediate deployment.
*   **Persistent History:** Uses LocalStorage to save past successful campaigns for easy retrieval.
*   **Agent Refinement Feedback Loop:** Allows users to give specific feedback to agents (e.g., "Make the tone more professional") and has the agent regenerate only the affected parts with factual validation.
