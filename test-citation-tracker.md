# Testing Citation Tracker with Google API

## ✅ What Should Now Work

With your Google API credentials configured, the Citation Tracker should now:

1. **Search Google** for actual mentions of your website
2. **Search News** for press coverage and articles
3. **Search Reddit** for community discussions
4. **Generate AI responses** using real search data

## 🔍 How to Test

1. **Go to Citation Tracker**: Navigate to `/citation-tracker` in your app
2. **Click "Check for Citations"**: This will trigger the real API searches
3. **Check the browser console**: Look for these log messages:
   - `✅ Google API check - API Key: PRESENT, Search Engine ID: PRESENT`
   - `🔍 Performing Google search for: "yourdomain.com"`
   - `✅ Google search returned X results`

## 📊 Expected Results

### With Real APIs Working:
- **Google Search**: Should find actual web mentions of your domain
- **News Search**: Should find news articles mentioning your site
- **Reddit Search**: Should find Reddit discussions
- **Higher Quality**: More accurate and relevant citations

### Log Messages to Look For:
```
🔑 Environment Variables Check:
   - GEMINI_API_KEY: SET
   - GOOGLE_API_KEY: SET ✅
   - GOOGLE_SEARCH_ENGINE_ID: SET ✅
   - NEWSAPI_KEY: SET
   - REDDIT_CLIENT_ID: SET
   - REDDIT_CLIENT_SECRET: SET
```

## 🚨 If Still Not Working

If you still see "Google API credentials not available", check:

1. **Spelling**: Ensure exact variable names:
   - `GOOGLE_API_KEY` (not `GOOGLE_API_KEY_`)
   - `GOOGLE_SEARCH_ENGINE_ID` (not `GOOGLE_CSE_ID`)

2. **Supabase Location**: Variables should be in:
   - Project Settings → Edge Functions → Environment Variables

3. **Restart**: After adding variables, the edge functions may need a moment to pick up the new environment variables

## 🎯 Testing Different Sites

Try testing with:
- **Well-known sites**: Should find many real citations
- **Your own site**: May find fewer but more targeted results
- **New sites**: May rely more on intelligent fallback data

The system is designed to work well regardless of how many real citations are found!