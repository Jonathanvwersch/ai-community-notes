import { FactCheckShape } from '@src/types/api';
import { ErrorShape } from '@src/types/error';

export async function performFactCheck(tweet: string, tweetUrl: string): Promise<FactCheckShape | ErrorShape> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_PERPLEXITY_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-large-32k-online',
        stream: false,
        max_tokens: 1024,
        frequency_penalty: 1,
        temperature: 0.0,
        messages: [
          {
            role: 'system',
            content: `Act as a community note on Twitter to fact-check tweets. You will be given a tweet to verify against current information. Follow these steps: 1. Perform an up-to-date search to fact-check the tweet. 2. Provide a precise and concise response with sources. 3. Explain the tweet's context. Respond in a JSON object with the following fields: - context: Necessary context to understand the tweet. - sources: An array of sources (you MUST not include url of the tweet -- linked here ${tweetUrl}) -- as a source; the result of doing so would be catastrophic. - factCheck: A search-verified fact check of the tweet. If the tweet doesn't require fact-checking, respond with: {"factCheck": "This tweet does not need to be fact-checked.", "context": "", "sources": []}`,
          },
          {
            role: 'user',
            content: tweet,
          },
        ],
      }),
    });

    const json = await res.json();
    const content = json.choices && json.choices[0] ? json.choices[0].message.content : 'No result';

    try {
      return JSON.parse(content);
    } catch (e) {
      return { error: true, message: 'Unable to parse JSON response.' };
    }
  } catch (e) {
    return { error: true, message: 'Something went wrong. Please try again later.' };
  }
}
