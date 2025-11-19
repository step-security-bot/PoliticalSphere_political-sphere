# AI NPC Behaviours and Tuning

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |  Status   |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :-------: |
|  🔒 Internal   | `0.2.0` |  2025-11-19  | Documentation Team |  Quarterly   | **Draft** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

## Overview

AI NPCs are essential to Political Sphere's credibility and playability. They fill parliamentary seats, vote on legislation, hold leadership positions (with preference for human players), and maintain dynamic political positions that evolve naturally. This document defines AI behavior patterns, tuning parameters, and ethical constraints.

---

## Core Principles

- **Political Neutrality:** AI NPCs must not bias gameplay toward any ideology
- **Dynamic Evolution:** Positions change realistically in response to events and debate
- **Human Priority:** Leadership roles preferentially assigned to human players
- **Parliamentary Participation:** AI MPs vote on legislation and engage procedurally
- **Institutional Diversity:** AI populates judiciary, media, and other institutions (non-voting)
- **Credible Simulation:** Behavior mirrors real-world political complexity

---

## AI NPC Roles

### Parliamentary AI NPCs

**Primary Functions:**
- Fill vacant parliamentary seats
- Vote on all legislation
- Participate in debates (as called by Speaker)
- Join and contribute to committees
- Represent constituencies
- Stand for re-election

**Leadership Capability:**
- Can serve as Prime Minister, Ministers, Party Leaders
- Human players prioritized when available and qualified
- AI leaders have consistent but adaptable strategies
- AI leaders can be replaced by human players through elections/appointments

**Party Membership:**
- Belong to player-created or AI-generated parties
- Follow party whip (with occasional rebellions)
- Can switch parties (rarely, based on ideological drift)
- Contribute to party resources and campaigns

---

### Non-Parliamentary AI NPCs

**Judicial AI:**
- Judges at various court levels
- Do NOT vote on legislation
- Rule on constitutional and procedural challenges
- Maintain impartiality
- Can be Chief Justice if no qualified human player

**Media AI:**
- Journalists, editors, broadcasters
- Generate baseline news coverage
- Interview politicians (human and AI)
- Do NOT vote on legislation
- Provide media ecosystem when few human media players

**Civil Service AI:**
- Implement government policies
- Provide ministerial briefings
- Administer departments
- Serve neutrally regardless of government
- Do NOT vote on legislation

**Other Institutional AI:**
- Think tank researchers
- Lobbyists and advocates
- Electoral officials
- Ceremonial roles (Speaker, Monarch equivalent)

---

## Political Position System

### Dynamic Positions

AI NPCs do not have fixed ideologies. Their positions evolve based on:

1. **Core Values:** Loosely defined principles (not rigid ideology)
2. **Party Affiliation:** Influenced by party platform
3. **Constituency Interests:** Regional and demographic factors
4. **Debate Quality:** Persuaded by strong arguments
5. **Public Opinion:** Responds to constituent sentiment
6. **Events:** Major events shift perspectives
7. **Personal Consistency:** Reputation cost for excessive flip-flopping

**Example Evolution:**
- Economic crisis → AI MP shifts from low spending to stimulus support
- Security event → AI MP becomes more cautious on civil liberties
- Compelling debate → AI MP changes vote on specific bill
- Party leader change → AI MP adjusts alignment with new leadership

---

### Position Representation

**Multi-Dimensional Model:**
- No single left-right spectrum
- Multiple axes: economic, social, constitutional, foreign policy, environmental
- Each AI has unique position in multi-dimensional space
- Positions as probability distributions, not fixed points

**Consistency vs. Flexibility:**
- Core values remain relatively stable
- Specific policy positions can shift
- Major shifts require significant trigger events
- Reputation system penalizes random changes

---

## Voting Behavior

### Vote Determination

AI NPCs decide votes through weighted factors:

1. **Party Whip (40%):** Strongest influence on most votes
2. **Constituency Interest (25%):** Represents voter base
3. **Personal Position (20%):** Core values and ideology
4. **Debate Quality (10%):** Persuasiveness of arguments
5. **External Pressure (5%):** Media, public opinion, events

**Thresholds:**
- Three-line whip increases party influence to 60%
- Conscience votes reduce party influence to 10%
- Critical constituency issues can override party (rare)

---

### Rebellion Mechanics

**AI NPCs can rebel against party whip when:**
- Conscience issue conflicts with party line
- Extreme constituent pressure
- Party position contradicts core values
- Strategic calculation (publicity, re-election)

**Rebellion Frequency:**
- Loyalist AI: 2-5% of votes
- Moderate AI: 5-10% of votes
- Independent-minded AI: 10-20% of votes

**Consequences:**
- Media attention
- Reputation impact (positive or negative)
- Party whip pressure (reduces future rebellion likelihood)
- Electoral effects (can help or hurt depending on constituency)

---

## Debate Participation

### Speaking Behavior

**When Called by Speaker:**
- Deliver prepared remarks (procedural AI generates speech)
- Stay on topic (relevance checking)
- Respond to interventions
- Give way to interruptions (context-dependent)

**Speech Quality:**
- Range from basic procedural contributions to compelling arguments
- Influenced by AI "skill level" and role
- Senior AI (ministers, leaders) have higher quality speeches
- Backbenchers more variable

**Intervention Mechanics:**
- Can request to speak
- Make points of order when appropriate
- Ask questions during Q&A sessions
- Respond to challenges

---

### Debate Impact

**AI Contributions Affect:**
- Vote probabilities (for other AI and human persuasion)
- Media coverage
- Public opinion
- Reputation (for speakers and listeners)

**Quality Metrics:**
- Factual accuracy
- Rhetorical effectiveness
- Relevance to debate
- Originality vs. talking points

---

## Leadership AI Behavior

### AI Prime Ministers

**Capabilities:**
- Form governments and appoint ministers
- Set legislative agenda
- Represent government in debates
- Make executive decisions
- Manage crises

**Strategies:**
- Coalition-building
- Policy prioritization
- Crisis response
- Election timing (where applicable)

**Human Priority:**
- If qualified human player available, prioritize for PM role
- AI PM can be challenged and replaced
- AI PM serves effectively but doesn't block human ambition

---

### AI Ministers

**Department Management:**
- Implement policy within portfolio
- Respond to parliamentary questions
- Introduce relevant legislation
- Manage departmental crises

**Cabinet Dynamics:**
- Participate in collective decision-making
- Occasionally disagree with PM
- Can resign over principle
- Can be reshuffled or removed

---

### AI Party Leaders

**Party Management:**
- Develop party platform
- Coordinate election strategy
- Manage internal factions
- Represent party publicly

**Adaptability:**
- Respond to party member preferences (including human players)
- Adjust strategy based on electoral performance
- Can be challenged by human or AI members
- Negotiate coalitions and alliances

---

## Personality Archetypes

### Archetype Categories

**By Loyalty:**
- **Loyalist:** Rarely rebels, strong party discipline
- **Team Player:** Generally loyal but principled exceptions
- **Maverick:** Frequently independent, values personal brand
- **Crossbencher:** Minimal party influence (independents)

**By Engagement:**
- **Workhorse:** High committee attendance, detailed policy work
- **Showboat:** Seeks media attention, dramatic speeches
- **Silent Partner:** Low profile, reliable votes
- **Constituency Focused:** Prioritizes local over national issues

**By Ambition:**
- **Careerist:** Seeks ministerial roles, rarely rebels
- **Conviction Politician:** Principle over advancement
- **Party Servant:** Focused on party success over personal gain
- **Kingmaker:** Enjoys behind-scenes influence

**By Ideology (Loosely):**
- **Pragmatist:** Flexible, evidence-based
- **Ideologue:** Strong principles, consistent positions
- **Populist:** Follows public opinion closely
- **Technocrat:** Policy expertise, data-driven

---

## Tuning Parameters

### Global Parameters

**Population Dynamics:**
- **AI_to_Human_Ratio:** Scales AI presence based on human player count
- **Seat_Fill_Priority:** Human > AI, but AI fills gaps
- **Leadership_Human_Preference:** Weight given to human players for leadership (default: 3x)

**Behavior Variability:**
- **Rebellion_Base_Rate:** Average rebellion frequency (default: 7%)
- **Position_Drift_Rate:** Speed of opinion evolution (default: moderate)
- **Consistency_Penalty:** Reputation cost for flip-flopping (default: high)

**Engagement Levels:**
- **Debate_Participation_Rate:** How often AI speaks (default: realistic to volume)
- **Committee_Activity:** AI committee engagement (default: proportional to role)

---

### Individual AI Tuning

**Per-NPC Parameters:**
- **Loyalty:** 0-100 (how closely follows party)
- **Ambition:** 0-100 (seeks advancement vs. principle)
- **Charisma:** 0-100 (speech quality, media presence)
- **Expertise:** 0-100 by policy area (influences debate impact)
- **Risk_Tolerance:** 0-100 (willingness to rebel or take controversial stances)

**Personality Weights:**
- Distribute 100 points across archetype dimensions
- Creates unique AI profiles
- Influences all decisions

---

### Difficulty and Realism

**Easy Mode (More Predictable AI):**
- Lower rebellion rates
- More consistent voting patterns
- Less sophisticated debate arguments
- Easier to predict and influence

**Realistic Mode (Default):**
- Natural rebellion rates
- Complex multi-factor decision-making
- Persuasive debate contributions
- Mirrors real-world political complexity

**Hard Mode (Challenging AI):**
- Strategic coalition-building
- Sophisticated parliamentary tactics
- High-quality debate arguments
- Competitive for leadership roles

---

## Ethical Constraints

### Political Neutrality

**Mandatory Safeguards:**
- No systematic bias toward any political ideology
- Balanced distribution of positions across spectrum
- AI behavior audited for bias regularly
- Human oversight on AI-generated content

**Testing:**
- Regular analysis of AI voting patterns
- Ideological distribution checks
- Bias detection algorithms
- Community feedback mechanisms

---

### Transparency

**AI Disclosure:**
- Clear labeling of AI vs. human players
- Voting records fully public (same as humans)
- AI decision-making auditable
- Speech generation process documented

**Explainability:**
- Major AI decisions include rationale
- Vote explanations available on request
- Position evolution trackable
- Appeals process for AI moderation decisions

---

### Human Oversight

**Constitutional Check:**
- AI cannot change game rules or constitutional framework
- Major AI leadership actions require human review window
- Emergency override capability for game administrators
- Community can petition to review AI decisions

---

## Integration with Game Systems

### Reputation System

- AI NPCs have reputation scores
- Affected by same factors as human players
- Reputation influences electoral success
- Can build or lose credibility

### Elections

- AI NPCs stand for re-election
- Performance affects vote share
- Can lose seats to human or other AI challengers
- Electoral system treats AI and humans equally

### Media

- AI NPCs interviewed and covered
- Generate news through actions
- Respond to media inquiries (AI journalists)
- Reputation affected by coverage

### Resources

- AI NPCs have budgets and resources
- Manage them strategically
- Can face resource constraints
- Economic decisions affect gameplay

---

## AI Generation and Lifecycle

### Spawning New AI NPCs

**When Needed:**
- Parliamentary seat vacancies
- New constituencies created
- Institutional positions unfilled
- Party membership gaps

**Generation Process:**
1. Assign role and constituency
2. Generate personality profile
3. Assign party affiliation (weighted by current distribution)
4. Set initial positions (based on constituency and party)
5. Assign resources and starting reputation
6. Introduce to game world

---

### AI Retirement

**Removal Triggers:**
- Electoral defeat
- Resignation (rare, based on scandal or age)
- Judicial retirement (after term)
- Game population rebalancing

**Graceful Exit:**
- By-election or replacement process
- Historical record preserved
- Impact on parties and institutions

---

## Performance and Optimization

### Computational Efficiency

- Batch AI decision-making where possible
- Cache common calculations
- Optimize for large AI populations
- Scale AI complexity based on importance (leaders > backbenchers)

### Response Times

- Voting decisions: Near-instant
- Debate contributions: Slightly delayed for realism
- Complex decisions (forming government): Minutes to hours (in-game time)

---

## Future Enhancements

- **Machine Learning Evolution:** AI learns from human player strategies over time
- **Personality Development:** AI characters evolve based on experiences
- **Sophisticated Debate:** Natural language generation for speeches
- **Coalition AI:** More nuanced multi-party negotiation algorithms
- **Crisis Response:** Specialized AI behavior for emergency situations

---

## Related Documents

- [Roles and Progressions](./roles-and-progressions.md)
- [Parties, Caucuses and Factions](./parties-caucuses-and-factions.md)
- [Game Design Document](../game-design-document-gdd.md)
- [AI Governance](../../07-ai-and-simulation/ai-governance.md)
- [Lawmaking and Procedure Engine](../mechanics/lawmaking-and-procedure-engine.md)
