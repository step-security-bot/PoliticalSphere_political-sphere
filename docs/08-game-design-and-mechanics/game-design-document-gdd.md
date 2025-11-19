# Game Design Document (GDD)

> **High-level vision and features for Political Sphere**

<div align="center">

| Classification | Version | Last Updated |        Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :-----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.3.0` |  2025-11-19  | Game Design Council |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## 🎯 Vision

Political Sphere is a persistent, multiplayer parliamentary simulation where players engage in credible, respectful political gameplay. It rewards strategy, procedure, and conduct in a fictional world free from real-world ideologies or persuasion.

---

## 🎮 Game Overview

### Genre

- Strategy Simulation
- Multiplayer Role-Playing
- Procedural Politics

### Platform

- Web-based (PWA)
- Cross-platform compatibility

### Target Audience

- Age: 17-35
- Interests: Strategy games, debate, governance, long-form narratives
- Mindset: Thoughtful, competitive but respectful

### Unique Selling Points

- Fair, procedure-driven gameplay
- Persistent worlds with real consequences
- Ethical AI for NPC behaviors
- Zero-budget, no pay-to-win model

---

## 📖 Story and Setting

### Fictional Universe

- **World Name:** [TBD - e.g., "Republica"]
- **Government:** Parliamentary democracy with proportional representation
- **Institutions:** Parliament, Executive, Judiciary, Media
- **Themes:** Governance, alliances, reform, accountability

### Player Narrative

Players join as Members of Parliament (MPs) in a persistent world. Through debate, voting, and coalition-building, they shape laws, policies, and the political landscape. Success comes from reputation, strategic alliances, and procedural mastery—not volume or aggression.

---

## 🎯 Core Objectives

- **Player Goals:** Pass laws, win elections, build lasting influence
- **Game Goals:** Simulate credible politics; foster respectful discourse
- **Success Metrics:** Player retention, engagement, positive feedback

---

## 🔧 Core Mechanics

### Game Flow

- **Real-Time Continuous:** The game runs continuously, not in discrete turns
- **Flexible Sessions:** Parliamentary sessions have no fixed duration; players can join in progress
- **Persistent World:** Actions and decisions have lasting consequences across the game world

### Parliamentary Sessions

- **Debates:** Structured speaking order managed by the Speaker; time limits enforced procedurally
- **Interruptions:** Members can interrupt if the speaker gives way; points of order system for procedural challenges
- **Voting:** Public, auditable votes on motions and bills (voting records are transparent)
  - **Vote Types:** Simple majority by default; supermajority or unanimous consent when required by legislation
  - **Abstention:** Players can abstain but may face reputation or political consequences
- **Procedure:** Rules of order prevent chaos; Speaker and moderators enforce

### Progression Systems

- **Reputation:** Earned through conduct, consistency, and achievements
- **Merit-Based Advancement:** All role progression based on reputation and performance, not time or payment
- **Role Flexibility:** Players can advance or lose positions based on elections and performance
- **Starting Roles:** Players can begin as MPs, Judges, Media personnel, or other institutional roles

### Social Systems

- **Parties/Factions:** Form groups with shared goals
  - **Independence:** Players can operate as independents but benefit from party membership (resources, influence, support)
  - **Party Creation:** Players can create their own parties after meeting requirements
  - **Ideological Drift:** Parties not constrained by rigid ideology, but diverging from core values affects reputation and media perception
- **Alliances:** Binding agreements with consequences for breach
- **Diplomacy:** Negotiate privately or publicly

### Resource Management

- **Campaign Finance:** Parties manage budgets and campaign resources
- **Individual Resources:** MPs allocate time, staff, and influence points strategically
- **Economic Constraints:** Resource limitations create strategic trade-offs

### AI Integration

- **NPC MPs:** Parliamentary AI NPCs vote on legislation and participate procedurally
- **NPC Leadership:** AI NPCs can hold leadership positions (PM, Ministers) but preference given to human players
- **Dynamic Positions:** AI NPCs maintain evolving political positions that shift naturally as in real politics
- **Non-Parliamentary NPCs:** AI characters in judiciary, media, and other institutions (do not vote)
- **Moderation:** AI assists in content filtering
- **World Events:** AI generates scenarios and reactions

---

## 🎨 Art and Audio

### Visual Style

- Clean, professional UI
- Minimalist icons for institutions
- Accessible color schemes

### Audio

- Subtle ambient sounds
- Notification tones
- No music to maintain focus

---

## 🧪 User Experience

### Onboarding

- Tutorial world for new players
- Guided first session
- Progressive disclosure of mechanics

### Accessibility

- WCAG compliance
- Keyboard navigation
- Screen reader support

### Safety

- Content moderation
- Harassment reporting
- Ethical boundaries

---

## 📊 Monetization

- **Model:** Free-to-play, no ads, no microtransactions
- **Sustainability:** Community support, donations, sponsorships (ethical only)

---

## 🗓️ Development Roadmap

### Phase 1: Core Loop (3-6 months)

- Basic parliament, debate, voting
- Simple worlds, reputation system

### Phase 2: Depth (6-12 months)

- Parties, elections, AI NPCs
- Media system, advanced roles

### Phase 3: Polish (12-18 months)

- Balancing, accessibility, large worlds
- Advanced features, community tools

---

## 📈 Success Criteria

- **Engagement:** Average session >30 minutes
- **Retention:** 70% return within 7 days
- **Satisfaction:** >4/5 player ratings
- **Fairness:** <5% reports of unfair mechanics

---

## 📎 Related Documents

- [World and Institutions Blueprint](world-and-institutions-blueprint.md)
- [Roles and Progressions](roles-and-progressions.md)
- [Product Strategy](../../01-strategy/product-strategy.md)

This GDD guides Political Sphere’s development toward a credible, engaging political simulation.
