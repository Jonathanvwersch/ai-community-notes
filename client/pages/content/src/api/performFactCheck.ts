import { FactCheckShape } from '@src/types/api';
import { ErrorShape } from '@src/types/error';

export async function performFactCheck(tweet: string, tweetUrl: string): Promise<FactCheckShape | ErrorShape> {
  try {
    const res = await fetch('http://127.0.0.1:5000/fact-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetText: tweet,
        tweetUrl: tweetUrl,
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
