# Political Sphere - Game Setup & Launch Guide

## 🎮 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- PostgreSQL (optional - SQLite used by default for development)

### One-Command Setup

```bash
./scripts/setup-game.sh
```

This will:
1. Install all dependencies
2. Set up the database
3. Generate Prisma client
4. Run migrations
5. Build all applications

---

## 🚀 Running the Game

### Option 1: Development Mode (Recommended)

**Terminal 1 - API Server:**
```bash
cd apps/api
npm start
```

**Terminal 2 - Web Application:**
```bash
cd apps/web
npm run dev
```

**Terminal 3 - Game Server (WebSocket):**
```bash
cd apps/game-server
npm start
```

### Option 2: Production Mode

```bash
npm run build
npm run start:prod
```

---

## 🎯 Accessing the Game

- **Web Application**: http://localhost:5173
- **API Server**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api
- **Health Check**: http://localhost:4000/health

---

## 🏛️ Game Systems

Political Sphere includes 8 complete game systems:

### 1. **Parliament System** ⚖️
- Create chambers (Commons, Lords)
- Propose motions
- Schedule debates
- Cast votes
- View results

**Access**: Main Game → Parliament

### 2. **Government System** 🏢
- Form government
- Appoint ministers
- Issue executive actions
- Hold cabinet meetings
- Confidence votes

**Access**: Main Game → Government

### 3. **Judiciary System** ⚖️
- File legal cases
- Appoint judges
- Issue rulings
- Constitutional review
- Legal precedents

**Access**: Main Game → Judiciary

### 4. **Media System** 📰
- Publish press releases
- Create opinion polls
- Track media coverage
- Monitor public opinion
- Approval ratings

**Access**: Main Game → Media

### 5. **Elections System** 🗳️
- Create elections
- Manage constituencies
- Register candidates
- Cast votes
- View results

**Access**: Main Game → Elections

### 6. **Profile & Settings** 👤
- Update profile
- View statistics
- Configure preferences
- Accessibility settings
- Notification preferences

**Access**: Main Game → Profile

### 7. **Party System** 🎭
- Create parties
- Manage members
- Form coalitions
- Party discipline

**Access**: Integrated throughout

### 8. **Bills & Voting** 📜
- Propose legislation
- Debate bills
- Vote on proposals
- Track outcomes

**Access**: Integrated throughout

---

## 🗄️ Database Setup

### Development (SQLite - Default)

No additional setup required. The setup script creates a local SQLite database.

### Production (PostgreSQL)

1. Create a PostgreSQL database:
```sql
CREATE DATABASE political_sphere;
```

2. Set environment variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/political_sphere"
```

3. Run migrations:
```bash
cd apps/api
npx prisma migrate deploy
```

---

## 🔧 Configuration

### Environment Variables

Create `apps/api/.env`:

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:password@localhost:5432/political_sphere"  # PostgreSQL for production

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Server
NODE_ENV="development"
PORT=4000
HOST="0.0.0.0"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Rate Limiting
API_RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL="info"
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 📊 Database Management

### View Database
```bash
cd apps/api
npx prisma studio
```

### Reset Database
```bash
cd apps/api
npx prisma migrate reset
```

### Seed Database
```bash
cd apps/api
npx prisma db seed
```

---

## 🐛 Troubleshooting

### Port Already in Use

If ports 4000 or 5173 are in use:

```bash
# Find process using port
lsof -i :4000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Check DATABASE_URL in `.env`
2. Ensure PostgreSQL is running (if using PostgreSQL)
3. Run migrations: `npx prisma migrate deploy`

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### TypeScript Errors

```bash
# Regenerate types
npm run type-check
```

---

## 📚 Documentation

- **Project Documentation**: `./docs/`
- **API Documentation**: `./docs/05-engineering-and-devops/development/backend.md`
- **Architecture**: `./docs/04-architecture/`
- **Game Design**: `./docs/08-game-design-and-mechanics/`

---

## 🔒 Security

### Development
- Default JWT secrets are for development only
- SQLite database is not encrypted
- CORS allows localhost origins

### Production Checklist
- [ ] Change all JWT secrets
- [ ] Use PostgreSQL with encryption
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure monitoring
- [ ] Enable audit logging
- [ ] Review security headers

---

## 🎨 Accessibility

Political Sphere is WCAG 2.2 AA compliant:

- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Reduced motion support
- ✅ Semantic HTML
- ✅ ARIA labels

Configure accessibility in: **Profile → Settings → Accessibility**

---

## 🤝 Contributing

See `CONTRIBUTING.md` for development guidelines.

---

## 📝 License

See `LICENSE` file for details.

---

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: `./docs/`
- **Email**: support@politicalsphere.game

---

## 🎉 You're Ready!

Political Sphere is now set up and ready to play. Enjoy the simulation!

```
🏛️ Political Sphere - UK Political Simulation Game
