# Marketing Agent with Brave Search

This example demonstrates how to use the Marketing Intelligence Agent with Brave Search capabilities for comprehensive market research and competitive analysis.

## Setup

1. **Get a Brave Search API Key**

   - Visit [Brave Search API](https://api.search.brave.com/)
   - Sign up and get your API key
   - Add it to your `.env` file:

   ```bash
   BRAVE_API_KEY=your_brave_api_key_here
   ```

2. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your API keys:
   BRAVE_API_KEY=your_brave_api_key_here
   OPENAI_API_KEY=your_openai_key_here    # Optional
   GROQ_API_KEY=your_groq_key_here        # Optional
   ANTHROPIC_API_KEY=your_anthropic_key_here  # Optional
   ```

3. **Start the services**

   ```bash
   docker-compose up --build
   ```

4. **Run the marketing agent**
   ```bash
   # In a new terminal
   cd agents/marketing
   npm install
   npm start
   ```

## Features

### 🔍 Brave Search Integration

- **Web Search**: Comprehensive market research using `brave_web_search`
- **News Search**: Real-time news monitoring with `brave_news_search`
- **Marketing Research**: Automated competitive analysis with `marketing_research`

### 📊 Marketing Capabilities

- Market trend analysis
- Competitive intelligence
- Brand monitoring
- Content research
- Sentiment tracking
- Strategic recommendations

### 🧠 Advanced Features

- Memory persistence for research sessions
- Report generation and file saving
- Context7 integration for best practices
- Error recovery and retry mechanisms

## Example Queries

Here are some example queries you can try with the marketing agent:

### Market Research

```
Research the electric vehicle market trends for 2024
```

### Competitive Analysis

```
Compare Tesla vs BMW in the luxury EV segment
```

### Brand Monitoring

```
Find recent news and sentiment about Apple's latest iPhone launch
```

### Content Strategy

```
What are the top marketing trends for SaaS companies in 2024?
```

### Industry Analysis

```
Research the AI startup ecosystem and recent funding rounds
```

## Tool Examples

### Using brave_web_search

```json
{
  "query": "artificial intelligence marketing trends 2024",
  "count": 15,
  "country": "US",
  "safesearch": "moderate",
  "freshness": "pw"
}
```

### Using brave_news_search

```json
{
  "query": "tech startup funding",
  "count": 10,
  "country": "US",
  "freshness": "pd"
}
```

### Using marketing_research

```json
{
  "brand": "Tesla",
  "competitors": ["BMW", "Mercedes", "Audi"],
  "topics": ["reviews", "pricing", "features", "sustainability"],
  "country": "US"
}
```

## Expected Workflow

1. **Initialize**: The agent starts and checks available tools
2. **Research**: User provides a marketing research objective
3. **Analysis**: Agent uses Brave Search to gather comprehensive data
4. **Insights**: Agent provides structured analysis and recommendations
5. **Persistence**: Results are saved to memory and optionally to files

## Troubleshooting

### Brave Search API Issues

- Ensure your API key is valid and not expired
- Check API rate limits if getting 429 errors
- Verify the BRAVE_API_KEY environment variable is set

### Docker Issues

```bash
# Rebuild if there are issues
docker-compose down
docker-compose up --build

# Check logs
docker-compose logs mcp-brave-search
```

### Agent Connection Issues

```bash
# Verify services are running
docker-compose ps

# Check gateway health
curl http://localhost:8080/health
```

## API Documentation

The marketing agent uses the official `mcp/brave-search` Docker image which provides:

- **brave_web_search**: Web search with filtering options
- **brave_news_search**: News search with recency filters
- **marketing_research**: Automated competitive research

For detailed API documentation, see the [Brave Search API docs](https://api.search.brave.com/app/documentation/web-search/get-started).

## Best Practices

1. **Specific Queries**: Use targeted search terms for better results
2. **Country Filtering**: Specify regions for localized insights
3. **Freshness Filters**: Use recent data for trend analysis
4. **Batch Research**: Combine multiple search types for comprehensive analysis
5. **Save Results**: Use memory tools to persist valuable research
