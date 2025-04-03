import base64
import markdown2
from typing import Dict, List
from google.genai import types

def render_html_response(bot_response: Dict[str, str] | List[types.Part]) -> str:
    """
    Render bot response to HTML with proper formatting.
    
    Args:
        bot_response: Either a dictionary with error message or list of response parts
        
    Returns:
        str: HTML formatted response
    """
    if type(bot_response) == dict:
        return f"<p><strong>Error:</strong> {bot_response['error']}</p>"
    
    bot_response_html = ""
    for part in bot_response:
        if part.text:
            bot_response_html += markdown2.markdown(
                part.text,
                extras=['fenced-code-blocks', 'code-friendly', 'tables'])
        elif part.executable_code:
            bot_response_html += f"<br/>Python Code:<pre><code>{part.executable_code.code}</code></pre><br/>"
        elif part.code_execution_result:
            bot_response_html += f"<br/>Code Output:<pre><code>{part.code_execution_result.output}</code></pre><br/>"
        elif part.inline_data:
            try:
                base64_data = base64.b64encode(
                    part.inline_data.data).decode("utf-8") if isinstance(
                        part.inline_data.data,
                        bytes) else part.inline_data.data
                bot_response_html += f'<img src="data:image/png;base64,{base64_data}" alt="Generated Image" style="max-width: 100%; height: auto;"/>'
            except Exception as e:
                bot_response_html += f"<p><strong>Error:</strong> {part.inline_data}<br/>{e}</p>"
        else:
            bot_response_html += f"<p><strong>Error:</strong> Unknown part type {part}</p>"
    return bot_response_html 