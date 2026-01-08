# replit.md

## Overview

This is an Exploratory Data Analysis (EDA) web application that allows users to upload CSV datasets and interact with Google Gemini AI to get insights, visualizations, and statistical analysis. Users can chat naturally with the AI assistant which performs automated data analysis, generates Python code, executes it, and returns visualizations and insights.

The application is hosted at https://exploratory-data-analysis.replit.app

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Framework
- **Django** serves as the web framework with a modular settings structure (base/development/production)
- The project follows Django conventions with separate apps (`chat` for main functionality)
- Settings are split into environment-specific files under `eda_project/settings/`

### AI Integration
- **Google Gemini API** (model: gemini-3-flash-preview) handles all AI interactions
- The `GeminiChatSession` class in `chat/services/gemini.py` manages conversation state
- Code execution is enabled through Gemini's native code_execution tool - the AI can write and run Python code
- A global chat session object maintains conversation context (stateless between page refreshes)

### File Processing
- Supports multiple data formats: CSV, TSV, JSON, XLSX, XLS, TXT
- All formats are converted to CSV before being sent to Gemini
- File conversion uses pandas and openpyxl for Excel support

### Frontend Architecture
- Server-side rendered templates using Django's template engine
- **HTMX** for dynamic chat interactions without full page reloads
- **Bootstrap 5** for UI styling with dark theme
- **DOMPurify** for sanitizing user input in messages
- Markdown responses are rendered to HTML using markdown2 with support for code blocks, tables, and LaTeX

### Response Rendering
- `chat/utils/markdown.py` converts Gemini response parts (text, code, execution results, images) to HTML
- Code syntax highlighting via Pygments (Monokai theme)
- Base64-encoded images from Gemini are embedded directly in responses
- LaTeX math expressions are supported with $ and $$ delimiters

### Static Files
- WhiteNoise middleware serves static files in production
- Static assets include CSS (styles, Pygments theme) and JavaScript (chat handling)

### Deployment
- Gunicorn as the WSGI server for production
- Environment detection via `DJANGO_ENVIRONMENT` variable
- CSRF protection configured for Replit domains

## External Dependencies

### APIs and Services
- **Google Gemini API** - Core AI functionality requiring `GOOGLE_API_KEY` environment variable
- Model used: `gemini-3-flash-preview` with code execution capabilities

### Python Packages
- `google-genai` - Official Google Generative AI SDK
- `django` - Web framework
- `pandas` - Data manipulation (used by Gemini's code execution)
- `openpyxl` - Excel file support
- `markdown2` - Markdown to HTML conversion
- `pygments` - Code syntax highlighting
- `gunicorn` - Production WSGI server
- `whitenoise` - Static file serving

### Frontend CDN Dependencies
- Bootstrap 5.3 (CSS and JS)
- Bootstrap Icons
- Font Awesome 6.5
- HTMX (for dynamic interactions)
- DOMPurify (XSS protection)
- MathJax (LaTeX rendering, referenced in templates)