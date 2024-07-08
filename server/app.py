from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from dotenv import load_dotenv
import aiohttp
import os
import logging
import redis.asyncio as redis
from contextlib import asynccontextmanager
from fastapi.responses import Response
import json


load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Configure Redis
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = redis.from_url(redis_url)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize FastAPILimiter
    await FastAPILimiter.init(redis_client)
    yield
    # Shutdown: Close Redis connection
    await redis_client.close()

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://api.perplexity.ai/chat/completions"
API_KEY = os.getenv("PERPLEXITY_AI_API_KEY")
BYPASS_SECRET_KEY = os.getenv("BYPASS_RATE_LIMIT_KEY")

def get_rate_limit_key(request: Request):
    return request.headers.get('X-Bypass-Key', '')

async def rate_limit_if_no_bypass(request: Request):
    if get_rate_limit_key(request) != BYPASS_SECRET_KEY:
        return RateLimiter(times=5, seconds=60)
    return RateLimiter(times=1000, seconds=86400)  # High limit for bypass requests

@app.post("/fact-check")
async def fact_check(request: Request, response: Response, limiter: RateLimiter = Depends(rate_limit_if_no_bypass)):
    await limiter(request, response)
    try:
        data = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    tweet_text = data.get('tweetText')
    tweet_url = data.get('tweetUrl')
    tweet_date = data.get('tweetDate')

    if not tweet_text or not tweet_url or not tweet_date:
        raise HTTPException(status_code=400, detail="Missing required tweet information")

    logging.debug(f"Processing fact check for tweet URL: {tweet_url}")

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
                    f"Act as a community note on Twitter to fact-check tweets. You will be given a tweet, which is dated {tweet_date}, to verify against current information. "
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

    async with aiohttp.ClientSession() as session:
        async with session.post(API_URL, headers=headers, json=payload) as response:
            if response.status != 200:
                logging.error(f"Failed to get fact check response: {response.status}")
                raise HTTPException(status_code=500, detail="Failed to get fact check response")

            json_content = await response.json()
            json_message = json_content['choices'][0]['message']['content']

    return JSONResponse(content=json_message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)