# Exploratory Data Analysis Agent

An agentic AI system that turns data exploration into a conversation. Upload your dataset, ask questions in plain English, and watch as an autonomous AI agent analyzes your data, writes Python code, and generates visualizations in real-time.

**Live Demo:** https://exploratory-data-analysis.replit.app

## What It Does

This agentic chatbot makes exploratory data analysis accessible to everyone. You don't need to write code—just upload your data and talk to the AI agent. It autonomously examines your dataset, identifies patterns, generates statistics, and creates meaningful visualizations to help you understand what your data is telling you.

## Features

**Smart File Upload**
- Supports CSV, TSV, JSON, Excel (.xlsx, .xls), and plain text files
- Automatic format conversion to work seamlessly with any file type
- Files up to 2MB

**Agentic AI Analysis**
- Autonomous exploratory analysis when you upload data—the agent takes initiative
- Natural language queries—ask anything about your dataset
- Real-time Python code execution in a secure sandbox
- Agent has access to pandas, numpy, matplotlib, seaborn, scikit-learn, and scipy

**Live Streaming Agent Actions**
- See the agent's reasoning process as it happens
- Watch the agent write code and execute it in real-time
- Visualizations appear instantly as the agent generates them
- Full conversation history maintained throughout your agentic session

**Rich Content Display**
- Markdown formatting with syntax highlighting
- LaTeX math rendering for statistical formulas
- Interactive tables and charts
- Code blocks with proper formatting

## Tech Stack

**Backend**
- Django web framework
- Google Gemini 3.0 Flash (agentic AI with code execution capabilities)
- pandas for data manipulation
- Server-Sent Events (SSE) for streaming agent responses

**Frontend**
- Bootstrap 5 (dark theme)
- Vanilla JavaScript
- Marked.js for markdown rendering
- Highlight.js for code syntax highlighting
- KaTeX for math rendering
- DOMPurify for security

**Deployment**
- Hosted on Replit
- Gunicorn WSGI server
- WhiteNoise for static files

## Getting Started

### Prerequisites

- Python 3.8+
- Google API key for Gemini

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Elephant200/exploratory-data-analysis-app.git
cd exploratory-data-analysis-app
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```
GOOGLE_API_KEY=your_api_key_here
DJANGO_SECRET_KEY=your_secret_key_here
```

4. Run the development server:
```bash
python manage.py runserver
```

5. Open your browser to `http://localhost:8000`

### Production Deployment

Set the environment variable:
```bash
export DJANGO_ENVIRONMENT=production
```

Then run with Gunicorn:
```bash
gunicorn eda_project.wsgi:application
```

## How It Works

1. **Upload**: Drop your dataset into the chat interface
2. **Agentic Analysis**: The AI agent immediately starts exploring your data—autonomously examining structure, generating statistics, and identifying interesting patterns
3. **Ask Questions**: Chat naturally about your data. Ask for specific analyses, request visualizations, or explore relationships between variables
4. **Get Insights**: Receive detailed explanations, Python code, execution results, and visualizations—all streamed to you in real-time as the agent works

The uploaded file persists throughout your entire agentic conversation, so the agent maintains context and you can ask follow-up questions without re-uploading.

## Project Structure

```
exploratory-data-analysis-app/
├── chat/                    # Main Django app
│   ├── services/           # Agentic AI (Gemini) integration
│   ├── utils/              # Markdown and content rendering
│   └── views.py            # Agent endpoints and streaming
├── eda_project/            # Django project settings
│   └── settings/           # Split configs for dev/production
├── static/                 # CSS, JavaScript, and assets
├── templates/              # HTML templates
└── requirements.txt        # Python dependencies
```

## Contributing

This is an open source project. Contributions, issues, and feature requests are welcome! Feel free to check out the issues page or submit a pull request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Powered by Google Gemini 3.0 Flash
- Built with Django and Bootstrap
- Hosted on Replit