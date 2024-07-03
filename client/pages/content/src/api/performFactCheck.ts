import { FactCheckShape } from '@src/types/api';
import { ErrorShape } from '@src/types/error';

export async function performFactCheck(tweet: string, tweetUrl: string): Promise<FactCheckShape | ErrorShape> {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/fact-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetText: tweet,
        tweetUrl: tweetUrl,
      }),
    });

    if (res.status === 429) {
      return { error: true, message: "You've exceeded the limit of 5 requests per day. Please try again tomorrow." };
    }

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
