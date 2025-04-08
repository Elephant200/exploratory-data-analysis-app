import base64
import markdown2
from typing import Dict, List
from google.genai import types

def replace_input_file_name(text: str, uploaded_file_name: str | None) -> str:
    if uploaded_file_name:
        return text.replace('input_file_0.csv', uploaded_file_name)
    return text

def highlight_code(code: str) -> str:
    return markdown2.markdown("```python\n" + code + "\n```", extras=['fenced-code-blocks', 'code-friendly'])

def render_html_response(bot_response: Dict[str, str] | List[types.Part], uploaded_file_name: str | None = None) -> str:
    """
    Render bot response to HTML with proper formatting.
    
    Args:
        bot_response: Either a dictionary with error message or list of response parts
        
    Returns:
        str: HTML formatted response
    """
    if type(bot_response) == dict:
        return f"<p><strong>Error:</strong> {bot_response['error']}</p>"

    if type(bot_response) != list:
        return f"<p><strong>Error:</strong> Unparsable response type {type(bot_response)}</p>"

    bot_response_html = ""
    
    for part in bot_response:
        if part.text:
            bot_response_html += markdown2.markdown(
                part.text,
                extras=['fenced-code-blocks', 'code-friendly', 'tables', "latex"]
            )

        elif part.executable_code:
            bot_response_html += f"<br/>Python Code:{highlight_code(replace_input_file_name(part.executable_code.code, uploaded_file_name))}<br/>"
        elif part.code_execution_result:
            bot_response_html += f"<br/>Code Output:<pre>{replace_input_file_name(part.code_execution_result.output, uploaded_file_name)}</pre><br/>"
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