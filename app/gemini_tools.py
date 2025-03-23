import tempfile
import subprocess
from typing import Dict
from google.genai import types

def execute_python_code(code: str) -> Dict[str, str]:
    """
    Execute Python code in a temporary file and return the output.

    Args:
        code (str): The python code to execute
    
    Returns:
        dict: The output of the code execution.
    """

    with tempfile.NamedTemporaryFile(suffix=".py", delete=True) as tmp_file:
        print("Created tempfile at", tmp_file.name)
        tmp_file.write(code.encode("utf-8"))
        tmp_file.flush()
        result = subprocess.run(["python3", tmp_file.name], capture_output=True, text=True)
        if result.stderr:
            return {"error": result.stderr}
        return {"result": result.stdout}
    