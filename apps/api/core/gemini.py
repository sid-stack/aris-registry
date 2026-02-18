import google.generativeai as genai
import os
import pypdf
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def analyze_rfp(file_path: str, constraints: str = "") -> str:
    """
    Analyzes an RFP PDF using Gemini.
    """
    if not GEMINI_API_KEY:
        return "GEMINI_API_KEY not configured. Mock analysis result."

    # 1. Extract Text from PDF
    text_content = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
    except Exception as e:
        return f"Failed to parse PDF: {str(e)}"

    # 2. Construct Prompt
    # Truncate if too long? Gemini 1.5 has huge context.
    prompt = f"""
    You are an expert government contract analyst. Analyze the following RFP text based on these constraints:
    {constraints}
    
    RFP Content:
    {text_content[:100000]} 
    
    Provide:
    1. Executive Summary
    2. Compliance Matrix (Key requirements)
    3. Win Themes
    4. Risk Assessment
    """
    
    # 3. Call Gemini
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini API Error: {str(e)}"
