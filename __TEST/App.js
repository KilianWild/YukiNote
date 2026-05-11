import { useState } from 'react';
import { getTagsForText } from './services/gemini';

/**
 * NEXT.JS IMPLEMENTATION GUIDE
 * 
 * If you are using Next.js (App Router), follow this pattern:
 * 
 * 1. Create a "Server Action" file (e.g., app/actions.ts):
 * 
 *    'use server';
 *    import { GoogleGenAI } from "@google/genai";
 * 
 *    export async function getTags(text: string) {
 *      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
 *      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
 *      const result = await model.generateContent(`Summarize in 5 tags: ${text}`);
 *      return result.response.text().split(',');
 *    }
 * 
 * 2. Use it in your component:
 * 
 *    const tags = await getTags("Some text...");
 */

export default function App() {
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const result = await getTagsForText(text);
      setTags(result);
    } catch (err) {
      alert("Error reaching Gemini. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Gemini Tag Generator</h1>
      <p style={{ color: '#666' }}>Basic API connection example</p>
      
      <textarea 
        placeholder="Paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%', height: '150px', padding: '12px', marginBottom: '10px' }}
      />

      <button 
        onClick={handleProcess} 
        disabled={loading || !text}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        {loading ? 'Generative AI at work...' : 'Get 5 Tags'}
      </button>

      {tags.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Tags:</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag, i) => (
              <span key={i} style={{ 
                background: '#f0f0f0', 
                padding: '4px 12px', 
                borderRadius: '16px',
                fontSize: '14px' 
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
