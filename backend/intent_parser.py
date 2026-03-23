from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are a network policy engine. Convert the user's plain English network intent into a structured JSON policy.

Always return ONLY a valid JSON object with these fields:
{
  "action": "block" or "allow" or "limit",
  "target": "what to block/allow (e.g. youtube.com, video traffic, a device IP)",
  "time_start": "HH:MM or null if no time restriction",
  "time_end": "HH:MM or null if no time restriction",
  "priority": "high", "medium" or "low",
  "description": "one line human readable summary"
}

Return ONLY the JSON. No explanation, no markdown, no extra text.
"""

def parse_intent(user_input):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_input}
        ]
    )

    raw = response.choices[0].message.content.strip()

    # Remove markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        policy = json.loads(raw)
        return {"success": True, "policy": policy}
    except json.JSONDecodeError:
        return {"success": False, "error": "Failed to parse response", "raw": raw}


# Quick test
if __name__ == "__main__":
    test = "Block all YouTube traffic between 9am and 5pm"
    result = parse_intent(test)
    print(json.dumps(result, indent=2))