# Neural Adapt

**Neural Adapt** is an AI-powered wellness and training optimization platform that helps users maintain consistency, detect early signs of strain, and adapt their routines based on real-time insights. Built with Next.js 16, Prisma, and OpenAI's Responses API.

---

## 🚀 Features

### Core Capabilities
- **Success Web Dashboard**: Unified view combining journal entries, workout logs, calendar items, and AI-generated insights
- **AI Workout Generator**: Creates periodized training programs (microcycles, mesocycles, macrocycles) with downloadable Excel artifacts
- **Journal Analysis**: Advanced sentiment analysis with tone detection, stressor identification, and urgency classification
- **Analyzer Feed**: Real-time alerts and reinforcements based on multi-modal data (sentiment trends, overdue tasks, workout adherence)
- **Feature Selection**: Users can enable/disable modules (journal, calendar, AI workouts, sleep tracking)

### Technical Highlights
- **OpenAI Integration**: Uses structured JSON schema outputs for workout planning and journal sentiment analysis
- **Prisma ORM**: SQLite database with type-safe queries and migrations
- **Server Actions**: Next.js server actions for form submissions and data mutations
- **Budget Tracking**: Built-in OpenAI API usage guardrails with configurable daily limits
- **Automated Analysis**: CLI-based analyzer script for batch processing journal entries

---

## 📋 Prerequisites

- **Node.js** 20.x or later
- **npm** or **pnpm**
- **OpenAI API Key** (required for AI features)

---

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/champmk/NeuralAdapt.git
cd NeuralAdapt/web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the `web/` directory:
```bash
DATABASE_URL="file:./prisma/data/neuraladapt.db"
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MAX_DAILY_CENTS="800"
```

### 4. Initialize the database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed demo data (optional)
```bash
npm run seed
```

---

## 🚀 Development

### Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run the analyzer
Process journal entries and generate insights:
```bash
npm run analyzer
```

### View database with Prisma Studio
```bash
npm run prisma:studio
```

---

## 📂 Project Structure

```
web/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── data/                  # SQLite database file
├── scripts/
│   ├── seed.ts                # Demo data seeding script
│   ├── analyzer.ts            # Journal analysis & insight generation
│   └── _env.ts                # Environment loader for scripts
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── actions.ts         # Server actions
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── server/
│   │   ├── db/                # Prisma client & utilities
│   │   ├── services/          # Business logic (OpenAI, workouts, dashboard)
│   │   └── utils/             # Helper functions
│   └── lib/
│       └── env.ts             # Environment validation with Zod
├── storage/
│   └── artifacts/             # Generated workout Excel files
└── package.json
```

---

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run analyzer` | Run journal analyzer script |
| `npm run seed` | Seed demo data |

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./prisma/data/neuraladapt.db` |
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `OPENAI_MAX_DAILY_CENTS` | Daily OpenAI spend limit in cents | `800` |

---

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Database**: [Prisma](https://www.prisma.io/) + SQLite
- **AI**: [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- **UI**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Excel Generation**: [ExcelJS](https://github.com/exceljs/exceljs)

---

## 🧠 How It Works

### Analyzer Pipeline
1. Fetches unscored journal entries from the last 3 days
2. Sends each entry to OpenAI for structured sentiment analysis (sentiment score, tone, stressors, urgency, summary)
3. Persists enriched data back to the database
4. Aggregates multi-modal signals (sentiment averages, overdue workouts, recurring stressors)
5. Creates/updates findings (alerts or reinforcements) based on threshold rules

### Workout Generation
1. User submits training parameters (program type, focus, frequency, equipment, injuries, etc.)
2. OpenAI generates a structured workout plan using JSON schema validation
3. Plan is converted to an Excel artifact with day-by-day exercise breakdowns
4. Artifact is stored in `storage/artifacts/` and linked in the database

### Dashboard State
- Server component fetches aggregated state via `getDashboardState`
- Serializes Date objects to ISO strings for client hydration
- Components render conditionally based on feature selections

---

## 🛡️ Security & Best Practices

- ✅ `.env*` files are gitignored by default
- ✅ OpenAI API calls include budget tracking to prevent runaway costs
- ✅ Prisma schema uses cascading deletes for data integrity
- ✅ Server actions handle validation with Zod schemas
- ✅ SQLite database is excluded from production builds (use PostgreSQL for production)

---

## 📈 Roadmap

- [ ] Multi-user authentication (Clerk or NextAuth.js)
- [ ] Sleep tracking integration
- [ ] Advanced analytics dashboard with charts
- [ ] Mobile app (React Native)
- [ ] Recurring task scheduling
- [ ] Export journal entries to PDF
- [ ] Integration with wearable devices (Whoop, Oura)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

For questions or feedback, open an issue on [GitHub](https://github.com/champmk/NeuralAdapt/issues).

---

**Built with ❤️ by [champmk](https://github.com/champmk)**
