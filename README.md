# Exploratory Data Analysis Agent

An agentic AI system that turns data exploration into a conversation. Upload your dataset, ask questions in plain English, and watch as an autonomous AI agent analyzes your data, writes Python code, and generates visualizations in real time.

**Live Demo:** https://exploratory-data-analysis-app.vercel.app

## What It Does

This agentic chatbot makes exploratory data analysis accessible to everyone. You don't need to write code—just upload your data and talk to the AI agent. It autonomously examines your dataset, identifies patterns, generates statistics, and creates meaningful visualizations to help you understand what your data is telling you.

## Features

**Smart File Upload**
- Supports CSV, TSV, JSON, Excel (.xlsx, .xls), and plain text files
- Automatic conversion to CSV in the browser before anything is sent
- Files up to 2MB
- One-click demo dataset to try it instantly

**Agentic AI Analysis**
- Autonomous exploratory analysis the moment you upload—the agent takes initiative
- Natural language queries—ask anything about your dataset
- Real-time Python code execution in Gemini's secure sandbox
- Agent has access to pandas, numpy, matplotlib, seaborn, scikit-learn, and scipy

**Live Streaming Agent Actions**
- Watch the agent write code and execute it in real time
- Collapsible code and output blocks; charts appear inline as they're generated
- Full conversation history maintained throughout your session

**Rich Content Display**
- Markdown with syntax highlighting
- LaTeX math rendering (KaTeX) for statistical formulas
- Data tables and charts

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript) + Tailwind CSS
- [Vercel AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- Google Gemini with the native code-execution tool
- Deployed on Vercel

### Architecture

The server is fully stateless: conversation history lives in the browser, and each request posts the full message history to a single streaming API route (`app/api/chat`). The uploaded dataset is converted to CSV client-side and attached to the first message as a file part, so it travels with the history on every turn—no server-side sessions, no database, and every visitor gets an isolated conversation by construction.

## Getting Started

### Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Elephant200/exploratory-data-analysis-app.git
cd exploratory-data-analysis-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your key:
```
GOOGLE_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
pnpm dev
```

5. Open your browser to `http://localhost:3000`

### Deployment

Deploy to Vercel with zero configuration—just set the `GOOGLE_API_KEY` environment variable in your project settings.

## How It Works

1. **Upload**: Drop your dataset into the chat (or hit "Try the demo")
2. **Agentic Analysis**: The agent immediately starts exploring—structure, statistics, patterns
3. **Ask Questions**: Chat naturally; request specific analyses or visualizations
4. **Get Insights**: Explanations, Python code, execution results, and charts stream in live

## Project Structure

```
exploratory-data-analysis-app/
├── app/
│   ├── page.tsx             # Landing page
│   ├── chat/                # Chat UI
│   └── api/chat/route.ts    # Stateless streaming endpoint (Gemini + code execution)
├── components/chat/         # Message rendering, code blocks, upload, suggestions
├── lib/                     # System prompt, file→CSV conversion, helpers
└── public/demo/             # Demo dataset
```

## Contributing

This is an open source project. Contributions, issues, and feature requests are welcome!

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Powered by Google Gemini
- Built with Next.js and the Vercel AI SDK
