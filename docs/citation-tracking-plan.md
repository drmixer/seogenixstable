# Free Citation Tracking Implementation Plan

## Phase 1: Free APIs Setup

### Google Custom Search API
- **Cost**: 100 queries/day FREE
- **Setup**: 
  1. Create Google Cloud Project
  2. Enable Custom Search API
  3. Create Custom Search Engine
- **Queries**:
  - `site:yourdomain.com` (find all your pages)
  - `"yourdomain.com"` (find mentions)
  - `"your brand name"` (brand mentions)

### News API
- **Cost**: 1,000 requests/month FREE
- **Setup**: Sign up at newsapi.org
- **Queries**:
  - Search for your domain in news articles
  - Track industry publications
  - Monitor press mentions

### Reddit API
- **Cost**: FREE
- **Setup**: Reddit app registration
- **Queries**:
  - Search for domain mentions
  - Track subreddit discussions
  - Monitor tech communities

## Phase 2: Citation Sources Priority

### High-Value Sources (AI Training Data)
1. **Wikipedia** - Check for citations/references
2. **Academic Papers** - Google Scholar mentions
3. **News Articles** - Major publications
4. **Tech Blogs** - Industry authorities
5. **Government Sites** - .gov domain mentions
6. **Educational Sites** - .edu domain mentions

### Medium-Value Sources
1. **Reddit Discussions**
2. **Stack Overflow**
3. **Quora Answers**
4. **Medium Articles**
5. **LinkedIn Posts**

## Phase 3: Implementation Strategy

### Week 1: Basic Search
```javascript
// Free daily quota usage:
- 50 Google searches for domain mentions
- 25 Google searches for brand mentions  
- 25 Google searches for competitor analysis
- 100 news API calls for recent mentions
- Unlimited Reddit/HN searches
```

### Week 2: Enhanced Tracking
```javascript
// Add tracking for:
- Featured snippets containing your content
- "People Also Ask" sections
- Knowledge panels
- News carousels
```

### Week 3: AI Citation Simulation
```javascript
// Manual testing approach:
- Test 10 key queries daily against ChatGPT
- Test same queries against Perplexity
- Document which ones mention your site
- Build pattern recognition
```

## Phase 4: Scaling Options

### If You Need More Volume:
1. **Google Custom Search**: $5/1,000 queries
2. **News API Pro**: $449/month for 1M requests
3. **Bing Search**: $7/1,000 transactions
4. **SerpAPI**: $50/month for 5,000 searches

### ROI Calculation:
```
If tracking finds 1 new citation opportunity = $X value
Monthly API costs = $Y
ROI = X/Y ratio
```

## Implementation Code Structure

### Edge Function: `searchCitations`
```typescript
// Free tier daily limits:
const DAILY_LIMITS = {
  google: 100,
  news: 33, // 1000/month ÷ 30 days
  reddit: 1000, // No real limit
  bing: 33 // 1000/month ÷ 30 days
};

// Rotate between APIs to maximize coverage
```

### Database Schema:
```sql
-- Track API usage to stay within limits
CREATE TABLE api_usage (
  date DATE,
  provider TEXT,
  queries_used INTEGER,
  queries_limit INTEGER
);

-- Store found citations
CREATE TABLE found_citations (
  id UUID PRIMARY KEY,
  site_id UUID,
  source_url TEXT,
  source_type TEXT, -- 'news', 'reddit', 'google'
  snippet TEXT,
  authority_score INTEGER,
  found_at TIMESTAMP
);
```

## Expected Results

### With Free Tier:
- **Daily**: 200+ searches across platforms
- **Monthly**: 6,000+ citation checks
- **Coverage**: News, Reddit, basic web search
- **Cost**: $0

### With Paid Tier ($50/month):
- **Daily**: 1,000+ searches
- **Monthly**: 30,000+ citation checks  
- **Coverage**: Comprehensive web + news + social
- **ROI**: High if you find citation opportunities

## Next Steps

1. **Start with free APIs** - prove the concept
2. **Track citation discovery rate** - measure value
3. **Scale up if ROI is positive** - add paid tiers
4. **Focus on high-authority sources** - quality over quantity