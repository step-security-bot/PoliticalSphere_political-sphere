# Economy and Budgets

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-11-19  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

Political Sphere features comprehensive resource management systems covering campaign finance, party budgets, individual MP resources, and national economic simulation. Resource constraints create strategic trade-offs and prevent pay-to-win dynamics while rewarding effective management.

---

## Core Principles

- **No Pay-to-Win:** All resources earned through gameplay, not real-money purchases
- **Strategic Scarcity:** Limited resources create meaningful choices
- **Transparency:** Financial flows are auditable and public
- **Realistic Constraints:** Mirrors real-world political economy
- **Party and Individual:** Dual-layer resource management

---

## Individual MP Resources

### Resource Types

#### 1. Influence Points (IP)

**Description:** Abstract currency representing political capital and favor

**Earning IP:**
- Successful legislation passage
- Effective debate contributions
- Committee work
- Electoral victories
- Cross-party collaboration
- Media appearances
- Constituent service

**Spending IP:**
- Propose amendments to bills
- Call emergency debates
- Introduce private member's bills
- Request speaking slots
- Fund investigations
- Build alliances
- Media campaigns (small scale)

**Regeneration:**
- Passive regeneration over time
- Accelerated by high reputation
- Boosted by party resources (if member)

**Starting Amount:** 100 IP (independents); 150 IP (party members)

---

#### 2. Staff Time

**Description:** Capacity of MP's office staff to support activities

**Staff Allocation:**
- Research (improves debate quality)
- Constituent correspondence
- Committee preparation
- Policy development
- Media relations
- Administrative tasks

**Trade-offs:**
- Cannot do everything simultaneously
- Strategic prioritization required
- Overstretched staff reduces quality
- Can hire additional staff with financial resources

**Starting Capacity:** 40 hours/week

---

#### 3. Time Allocation

**Description:** MP's personal time across activities

**Time Demands:**
- Chamber attendance (debates, votes)
- Committee meetings
- Constituency work
- Party meetings
- Media appearances
- Policy research
- Meetings (ministers, lobbyists, constituents)

**Consequences:**
- Missing votes affects reputation
- Neglecting constituency risks re-election
- Over-commitment causes burnout (temporary debuffs)
- Work-life balance affects long-term performance

**Total Available:** 60-80 hours/week (realistic constraints)

---

#### 4. Financial Budget

**Description:** Personal/office budget for operations

**Income Sources:**
- Base parliamentary salary
- Party contributions (if member)
- Speaking fees (limited, ethical rules)
- Book deals or media (transparency required)

**Expenditures:**
- Additional staff hiring
- Office equipment and technology
- Constituency office rent
- Travel (beyond allowances)
- Campaign contributions (to own or party)
- Charitable giving (reputation boost)

**Oversight:**
- All spending publicly auditable
- Ethical violations punished severely
- Corruption mechanics (if attempted)

**Starting Budget:** £75,000/year baseline

---

## Party Resources

### Party Finance

#### Income Sources

1. **Member Contributions:**
   - Automated % of MP salaries (default 10%)
   - Adjustable by party rules
   - Independents pay nothing

2. **Electoral Funding:**
   - Public funding proportional to vote share (if applicable)
   - Short money (opposition funding)

3. **Fundraising:**
   - Donation drives (player-organized events)
   - Small donor programs
   - Transparent large donations (with caps)

4. **Ancillary Income:**
   - Membership fees (non-MP members)
   - Merchandise (minor)
   - Publications and media

---

#### Expenditures

1. **Campaigning:**
   - Advertisements (traditional and digital)
   - Canvassing operations
   - Rallies and events
   - Candidate support

2. **Operations:**
   - Staff salaries (party HQ)
   - Office rent and facilities
   - Technology and communications
   - Research and policy units

3. **Member Support:**
   - Subsidized resources for MPs
   - Training and development
   - Campaign assistance
   - Legal support

4. **Strategic Spending:**
   - Polling and research
   - Media campaigns
   - Opposition research
   - Coalition negotiations

---

### Party Influence Pool

**Shared Resource:**
- All party members contribute to and benefit from pool
- Spend on strategic party actions
- Larger than individual IP pools

**Earning Party Influence:**
- Electoral success
- Government formation
- Effective governance
- Media prominence
- Legislative achievements

**Spending Party Influence:**
- Major amendments
- Calling confidence votes
- Media campaigns (large scale)
- Policy launches
- Inter-party negotiations
- Emergency powers

**Management:**
- Party leadership controls spending
- Members can request allocations
- Transparent internal accounting

---

### Party Staff and Capacity

**Central Staff:**
- Party leader's office
- Chief Whip's office
- Policy development unit
- Communications team
- Campaign headquarters

**Resources Scale with Party Size:**
- Larger parties have more staff
- Better-funded parties hire specialists
- Smaller parties operate leaner

---

## Campaign Finance

### Electoral Campaigns

**Campaign Phases:**
1. **Pre-Campaign:** Building resources, candidate selection
2. **Active Campaign:** Intensive spending period (4-6 weeks)
3. **GOTV (Get Out The Vote):** Final push before election day

**Spending Categories:**
- Advertising (local and national)
- Canvassing and door-knocking
- Rallies and events
- Candidate travel
- Campaign materials
- Digital marketing

**Spending Limits:**
- Constituency spending caps (prevent buying elections)
- National spending caps (party-wide)
- Transparency requirements
- Violation penalties (fines, disqualification)

---

### Fundraising Mechanics

**Player-Organized Events:**
- Dinners, rallies, online drives
- Require planning and promotion
- Success depends on popularity and outreach

**Ethical Constraints:**
- Donation limits (no mega-donors)
- Corporate donations restricted
- Foreign donations prohibited
- Transparency required (public disclosure)

**In-Kind Contributions:**
- Volunteer time
- Free media coverage
- Endorsements
- Facility loans

---

## National Economy (Simulated)

### Economic Indicators

**Tracked Metrics:**
- GDP growth rate
- Unemployment rate
- Inflation rate
- Public debt
- Trade balance
- Inequality indices

**Impact on Gameplay:**
- Economic performance affects government popularity
- Budget constraints tighten in recession
- Prosperity enables expansionary policy

---

### Government Budget

**Revenue Sources:**
- Income tax
- Corporate tax
- Sales tax (VAT)
- Tariffs and duties
- Asset sales

**Expenditure Categories:**
- Healthcare
- Education
- Defense
- Social welfare
- Infrastructure
- Debt servicing

**Budget Process:**
- Chancellor/Finance Minister proposes
- Parliamentary debate and amendments
- Vote required for passage
- Failure triggers crisis (potentially government collapse)

---

### Economic Policy Levers

**Available to Government:**
- Tax rates (requires legislation)
- Spending levels (requires budget approval)
- Regulatory changes
- Trade agreements
- Monetary policy (if central bank independent)

**Consequences:**
- Policy choices affect economic indicators
- Lagged effects (realism)
- External shocks (events)
- Balanced budget not required but debt matters

---

## Resource Management Strategies

### For Individual MPs

**Independents:**
- Carefully allocate limited IP
- Build cross-party alliances for resource pooling
- Focus on niche issues with high impact
- Leverage media for influence

**Party Members:**
- Coordinate with party resources
- Request party support for initiatives
- Contribute to party pool
- Balance personal and party priorities

---

### For Parties

**Governing Parties:**
- Allocate government resources strategically
- Balance fiscal responsibility with promises
- Manage coalition partner demands
- Prepare for next election

**Opposition Parties:**
- Build alternative platforms
- Criticize government effectively
- Prepare for government (shadow cabinet)
- Fundraise for next election

---

## Transparency and Accountability

### Financial Disclosure

**Required Reporting:**
- All donations above threshold
- Spending by category
- Assets and potential conflicts
- Party finances (annual)

**Public Access:**
- Searchable databases
- Media can investigate
- Watchdog organizations (AI and player-run)

---

### Corruption Mechanics

**Attempted Violations:**
- Bribery
- Embezzlement
- Undisclosed conflicts
- Money laundering

**Detection:**
- Audit systems
- Media investigations
- Whistleblowers
- Random checks

**Consequences:**
- Reputation collapse
- Legal prosecution (in-game)
- Electoral defeat
- Criminal penalties (removal from office)

**Deterrence:**
- High risk, low reward
- Severe penalties
- Permanent record

---

## Economic Simulation Depth

### Levels of Abstraction

**Simple (Default):**
- High-level indicators
- Direct policy → outcome relationships
- Manageable complexity
- Focus on political strategy over economic modeling

**Detailed (Advanced Option):**
- Sector-specific economics
- Regional variations
- Complex interdependencies
- External global economy

---

## Integration with Game Systems

### Elections

- Economic performance affects vote share
- Campaign spending influences outcomes (diminishing returns)
- Party resources determine competitiveness

### Reputation

- Fiscal responsibility affects reputation
- Corruption destroys reputation
- Effective economic management builds credibility

### Legislation

- Budgets require passage
- Economic bills require debate and votes
- Amendments can redistribute resources

---

## Balance and Tuning

### Preventing Dominance

**Caps and Limits:**
- Maximum IP accumulation
- Spending limits in campaigns
- Wealth concentration prevention

**Catch-Up Mechanisms:**
- New parties receive startup resources
- Opposition funding
- Media attention for challengers

---

### Reward Structures

**Effective Management Rewarded:**
- Well-run parties gain reputation
- Fiscal responsibility boosts approval
- Strategic resource use wins elections

**Mismanagement Punished:**
- Bankruptcy is possible
- Waste hurts reputation
- Corruption ends careers

---

## Future Enhancements

- **Stock Market Simulation:** Economic fluctuations with political impacts
- **Trade Negotiations:** International economic diplomacy
- **Local Government Budgets:** Devolved fiscal management
- **Pension and Long-Term Planning:** Inter-generational economics
- **Cryptocurrency Regulation:** Modern economic challenges

---

## Related Documents

- [Parties, Caucuses and Factions](../systems/parties-caucuses-and-factions.md)
- [Roles and Progressions](../systems/roles-and-progressions.md)
- [Elections, Policy and Mechanics](./elections-policy-and-mechanics.md)
- [Game Design Document](../game-design-document-gdd.md)
