from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from redis import Redis

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Redis
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = Redis.from_url(redis_url)

# Configure rate limiter with Redis
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["5 per day"],
    storage_uri=redis_url
)
API_URL = "https://api.perplexity.ai/chat/completions"
API_KEY = os.getenv("PERPLEXITY_AI_API_KEY")
BYPASS_SECRET_KEY = os.getenv("BYPASS_RATE_LIMIT_KEY")

def rate_limit_bypass_key():
    return request.headers.get('X-Bypass-Key', '')

def rate_limit_if_no_bypass():
    if rate_limit_bypass_key() != BYPASS_SECRET_KEY:
        return "5 per day"
    return "1000 per day"  # High limit for bypass requests


@app.route('/fact-check', methods=['POST'])
@limiter.limit(rate_limit_if_no_bypass)
def fact_check():
    data = request.json
    tweet_text = data.get('tweetText')
    tweet_url = data.get('tweetUrl')

    if not tweet_text:
        return jsonify({"error": "No tweet text provided"}), 400

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}',
    }

    payload = {
        "model": "llama-3-sonar-large-32k-online",
        "stream": False,
        "max_tokens": 1024,
        "frequency_penalty": 1,
        "temperature": 0.0,
        "messages": [
            {
                "role": "system",
                "content": (
                    f"Act as a community note on Twitter to fact-check tweets. You will be given a tweet to verify against current information. "
                    f"Follow these steps: 1. Perform an up-to-date search to fact-check the tweet. 2. Provide a precise and concise response with sources. "
                    f"3. Explain the tweet's context. Respond in a JSON object with the following fields: - context: Necessary context to understand the tweet. "
                    f"- sources: An array of sources (you MUST not include url of the tweet -- linked here {tweet_url}) -- as a source; the result of doing so would be catastrophic. "
                    f"- factCheck: A search-verified fact check of the tweet. If the tweet doesn't require fact-checking, respond with: "
                    f'{{"factCheck": "This tweet does not need to be fact-checked.", "context": "", "sources": []}}'
                ),
            },
            {"role": "user", "content": tweet_text},
        ],
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        return jsonify({"error": "Failed to get fact check response"}), 500

    return jsonify(response.json())

if __name__ == '__main__':
    app.run()
