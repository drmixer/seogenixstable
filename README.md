# SEOgenix - AI Visibility Platform

SEOgenix is an AI-focused SEO platform that helps users improve their "AI visibility" — getting cited, summarized, and understood by chatbots and voice assistants.

## Features

- **AI Visibility Audit**: Comprehensive analysis of how well your content performs with AI systems
- **Schema Generator**: Create structured data markup for better AI understanding
- **Citation Tracker**: Monitor when AI systems cite your content
- **Voice Assistant Tester**: Test how voice assistants respond to queries about your content
- **LLM Site Summaries**: Generate AI-friendly summaries of your site
- **Entity Coverage Analyzer**: Identify key entities in your content and ensure comprehensive coverage

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **API Integrations**: OpenAI, SERP API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- SERP API key (optional for full functionality)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/seogemix.git
   cd seogemix
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your API keys.

4. Connect to Supabase:
   - Click the "Connect to Supabase" button in the UI
   - Or set up Supabase connection manually using the environment variables

5. Start the development server:
   ```
   npm run dev
   ```

## Database Setup

The necessary tables and policies will be created automatically when you connect to Supabase. The migration files are in the `supabase/migrations` directory.

## Edge Functions

The Supabase Edge Functions in the `supabase/functions` directory handle various AI operations:

- `analyzeSite`: Analyzes a website for AI visibility factors
- `trackCitations`: Checks for citations of your content in AI systems
- `generateSummary`: Creates LLM-friendly summaries of your site
- `entityCoverage`: Analyzes entity coverage in your content

## Deployment

### Frontend

To deploy the frontend on Vercel or Netlify:

1. Connect your Git repository to your preferred hosting platform
2. Set up the environment variables
3. Deploy the application

### Supabase Edge Functions

To deploy Supabase Edge Functions:

1. Install the Supabase CLI
2. Login to your Supabase account:
   ```
   supabase login
   ```
3. Link your project:
   ```
   supabase link --project-ref your-project-ref
   ```
4. Deploy the Edge Functions:
   ```
   supabase functions deploy --project-ref your-project-ref
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.