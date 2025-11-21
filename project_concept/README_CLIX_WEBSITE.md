# CLI_X WebsiteThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



> Transform natural language into shell commands with AI## Getting Started



A modern web application showcasing and distributing an LLM-powered CLI tool that converts natural language into accurate shell/bash commands. Built with Next.js 14, TypeScript, and Tailwind CSS.First, run the development server:



---```bash

npm run dev

## 🚀 Features# or

yarn dev

- **Interactive Demo**: Live playground to test CLI functionality# or

- **Beautiful Landing Page**: Modern, responsive design with animationspnpm dev

- **Subscription Management**: Stripe integration for Pro tier# or

- **License System**: Secure license key generation and validationbun dev

- **Multi-Provider Support**: OpenAI, Anthropic, Groq, and Ollama```

- **Binary Distribution**: Cross-platform downloads (Windows, macOS, Linux)

- **Authentication**: User accounts with NextAuth.jsOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Database**: PostgreSQL with Prisma ORM

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🛠️ Tech Stack

## Learn More

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)

- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)To learn more about Next.js, take a look at the following resources:

- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)

- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- **Authentication**: [NextAuth.js v5](https://authjs.dev/)- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- **Payments**: [Stripe](https://stripe.com/)

- **Package Manager**: [Yarn](https://yarnpkg.com/)You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!



---## Deploy on Vercel



## 📋 PrerequisitesThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.



Before you begin, ensure you have the following installed:Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


- **Node.js**: v18.17.0 or higher
- **Yarn**: v1.22.0 or higher
- **PostgreSQL**: v14 or higher
- **Git**: Latest version

---

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cli-x-website
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clix_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (for demo)
OPENAI_API_KEY="sk-..."

# Stripe (use test keys for development)
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ... (see .env.example for complete list)
```

### 4. Set Up the Database

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# (Optional) Seed database with sample data
yarn prisma:seed
```

### 5. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript type checking |
| `yarn prisma:generate` | Generate Prisma Client |
| `yarn prisma:migrate` | Run database migrations |
| `yarn prisma:studio` | Open Prisma Studio (database GUI) |
| `yarn prisma:seed` | Seed database with sample data |
| `yarn prisma:reset` | Reset database (caution: deletes all data) |

---

## 📁 Project Structure

```
cli-x-website/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── (marketing)/         # Public marketing pages
│   ├── (dashboard)/         # Protected user routes
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── marketing/           # Marketing page components
│   └── shared/              # Shared components (Nav, Footer)
├── lib/                     # Utility libraries
│   ├── prisma.ts            # Prisma client
│   └── utils.ts             # Helper functions
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── package.json             # Dependencies
└── README.md                # This file
```

---

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts and authentication
- **License**: License keys for Pro users
- **Subscription**: Stripe subscription tracking
- **Download**: Binary download analytics
- **DemoUsage**: Anonymous demo playground usage

View the complete schema in [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 🎨 Design System

### Brand Identity
- **Name**: CLI_X
- **Style**: Modern, minimalistic, dark theme
- **Colors**: Cyan/Blue accents on dark backgrounds
- **Typography**: Inter (UI), JetBrains Mono (code)

### Components
Built with [shadcn/ui](https://ui.shadcn.com/):
- Button, Card, Badge, Input, etc.
- Fully customizable and accessible

---

## 💰 Pricing Tiers

### Free Tier
- Bring your own API keys
- 10 commands/day
- Basic models only
- Local command history

### Pro Tier ($9.99/month or $99/year)
- Pre-configured API keys
- Unlimited commands
- Premium models (GPT-4, Claude 3.5)
- Cloud sync
- Priority support

---

## 🔐 Security

- **Authentication**: Secure password hashing with bcrypt
- **License Validation**: Cryptographically signed license keys
- **Payment Processing**: PCI-compliant via Stripe
- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Implemented on demo and API routes

---

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- AWS (Amplify, EC2, ECS)
- Railway
- Render
- DigitalOcean

---

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run E2E tests
yarn test:e2e
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write meaningful commit messages (Conventional Commits)

---

## 📚 Documentation

### Essential Documentation
- **[README.md](./README.md)** - This file (project overview & setup)
- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Development guidelines and conventions
- **[PROJECT_CONCEPT.md](./PROJECT_CONCEPT.md)** - Complete product specification
- **[PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)** - Current project status

### Reference Documentation (docs/)
- **[docs/README.md](./docs/README.md)** - Documentation index
- **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Admin testing & RBAC quick reference
- **[docs/RBAC_ANALYSIS.md](./docs/RBAC_ANALYSIS.md)** - RBAC evaluation and decision
- **[docs/CLEANUP_SUMMARY.md](./docs/CLEANUP_SUMMARY.md)** - Project structure cleanup (Oct 2025)

### Historical Documentation (docs/archive/)
- **[docs/archive/](./docs/archive/)** - 82 archived implementation documents
  - Phase reports (Phase 2-11 development)
  - Testing documentation
  - Bug fixes and issue resolution
  - Setup guides and audit reports

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

---

## 🐛 Known Issues

No known issues at this time. Please [open an issue](https://github.com/your-repo/issues) if you encounter any problems.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Your Name** - Lead Developer
- **Contributors** - See [Contributors](https://github.com/your-repo/graphs/contributors)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing

---

## 📧 Support

- **Email**: support@cli-x.com
- **Documentation**: [docs.cli-x.com](https://docs.cli-x.com)
- **GitHub Issues**: [Report a bug](https://github.com/your-repo/issues)

---

**Made with ❤️ by the CLI_X Team**
