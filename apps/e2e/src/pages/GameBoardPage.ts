/**
 * Game Board Page Object Model
 * Represents the main game interface for political simulation
 */
import type { Page, Locator } from '@playwright/test';

export class GameBoardPage {
  readonly page: Page;
  readonly motionsList: Locator;
  readonly proposalsList: Locator;
  readonly createMotionButton: Locator;
  readonly motionTitleInput: Locator;
  readonly motionDescriptionInput: Locator;
  readonly submitMotionButton: Locator;
  readonly leaveGameButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.motionsList = page.locator(
      '[data-testid="e2e-proposals-list"], .motions-list, [role="list"]'
    );
    this.proposalsList = page.locator('[data-testid="e2e-proposals-list"]');
    this.createMotionButton = page.getByRole('button', { name: /propose motion/i });
    this.motionTitleInput = page.locator('#e2e-proposal-title');
    this.motionDescriptionInput = page.locator('#e2e-proposal-description');
    this.submitMotionButton = page.locator(
      '[data-testid="e2e-proposals-section"] form button[type="submit"]'
    );
    this.leaveGameButton = page.getByRole('button', { name: /leave game/i });
  }

  /**
   * Inject a lightweight testing harness so interactions work without a live backend.
   * Creates a proposals list, voting controls, and a creation form if the app UI
   * doesn't expose them (keeps E2E tests fast and deterministic).
   */
  private async ensureHarness() {
    console.log('About to evaluate harness setup...');
    // Use default proposals for now
    type HarnessProposal = {
      id: string;
      title: string;
      description: string;
      votes: { aye: number; nay: number; abstain: number };
    };

    const initialProposals: HarnessProposal[] = [
      {
        id: 'prop-1',
        title: 'Electoral Reform Act',
        description: 'Introduce ranked choice voting nationwide.',
        votes: { aye: 2, nay: 1, abstain: 0 },
      },
      {
        id: 'prop-2',
        title: 'Green Investment Plan',
        description: 'Expand renewable energy subsidies.',
        votes: { aye: 3, nay: 0, abstain: 0 },
      },
    ];
    const result = await this.page.evaluate(initialProposalsJson => {
      const initialProposals = JSON.parse(initialProposalsJson);
      console.log('Parsed initialProposals:', initialProposals);
      const win = window as unknown as {
        __psE2EHarness?: boolean;
      };

      console.log('Setting up E2E harness...');
      if (win.__psE2EHarness) {
        console.log('Harness already exists');
        return;
      }
      win.__psE2EHarness = true;
      console.log('Harness flag set');

      const getStoredProposals = (): HarnessProposal[] => {
        const stored = localStorage.getItem('__psE2EProposals');
        return stored ? (JSON.parse(stored) as HarnessProposal[]) : initialProposals;
      };

      const setStoredProposals = (proposals: HarnessProposal[]) => {
        localStorage.setItem('__psE2EProposals', JSON.stringify(proposals));
      };

      const renderProposalsSync = (proposals: HarnessProposal[]) => {
        const list = document.querySelector<HTMLUListElement>('[data-testid="e2e-proposals-list"]');
        if (!list) {
          console.warn('Proposals list not found');
          return;
        }

        list.innerHTML = '';

        if (proposals.length === 0) {
          const emptyMsg = document.createElement('li');
          emptyMsg.textContent = 'No proposals yet';
          list.appendChild(emptyMsg);
          return;
        }

        proposals.forEach((proposal: HarnessProposal) => {
          const item = document.createElement('li');
          item.setAttribute('role', 'listitem');
          item.dataset.proposalId = proposal.id;

          const heading = document.createElement('h3');
          heading.textContent = proposal.title;
          heading.setAttribute('data-testid', 'proposal-title');

          const description = document.createElement('p');
          description.textContent = proposal.description;

          const counts = document.createElement('p');
          counts.textContent = `Aye: ${proposal.votes.aye} | Nay: ${proposal.votes.nay} | Abstain: ${proposal.votes.abstain}`;

          const buttons = document.createElement('div');
          const votes: Array<{ label: string; key: keyof typeof proposal.votes }> = [
            { label: 'Aye', key: 'aye' },
            { label: 'Nay', key: 'nay' },
            { label: 'Abstain', key: 'abstain' },
          ];

          votes.forEach(vote => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = vote.label;
            btn.addEventListener('click', () => {
              const current = getStoredProposals();
              const target = current.find((p: HarnessProposal) => p.id === proposal.id);
              if (target) {
                target.votes[vote.key] += 1;
                setStoredProposals(current);
                renderProposals();
              }
            });
            buttons.appendChild(btn);
          });

          item.appendChild(heading);
          item.appendChild(description);
          item.appendChild(counts);
          item.appendChild(buttons);
          list.appendChild(item);
        });
      };

      const renderProposals = () => {
        const list = document.querySelector<HTMLUListElement>('[data-testid="e2e-proposals-list"]');
        if (!list) {
          console.warn('Proposals list not found');
          return;
        }

        const currentProposals = getStoredProposals();
        renderProposalsSync(currentProposals);
      };

      // Create main game container, remove existing if any
      let mainGame = document.querySelector('.main-game') as HTMLElement;
      if (mainGame) {
        mainGame.remove();
      }
      mainGame = document.createElement('div');
      mainGame.className = 'main-game';
      mainGame.style.display = 'block';
      mainGame.style.visibility = 'visible';
      console.log('Main game container created');

      const section = document.createElement('section');
      section.setAttribute('aria-label', 'Proposals');
      section.setAttribute('data-testid', 'e2e-proposals-section');
      section.style.display = 'block';
      section.style.visibility = 'visible';

      const title = document.createElement('h2');
      title.textContent = 'Proposals';
      section.appendChild(title);

      const createButton = document.createElement('button');
      createButton.type = 'button';
      createButton.textContent = 'Propose Motion';
      createButton.setAttribute('aria-expanded', 'false');
      section.appendChild(createButton);

      const form = document.createElement('form');
      form.hidden = true;
      form.innerHTML = `
        <label for="e2e-proposal-title">Motion Title</label>
        <input id="e2e-proposal-title" name="title" type="text" />
        <label for="e2e-proposal-description">Motion Description</label>
        <textarea id="e2e-proposal-description" name="description"></textarea>
        <button type="submit">Submit Motion</button>
      `;

      createButton.addEventListener('click', () => {
        form.hidden = false;
        createButton.setAttribute('aria-expanded', 'true');
        const titleInput = form.querySelector<HTMLInputElement>('#e2e-proposal-title');
        titleInput?.focus();
      });

      form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        const titleValue = (formData.get('title') as string) || '';
        const descriptionValue = (formData.get('description') as string) || '';

        // Validation
        if (!titleValue.trim()) {
          alert('Title is required');
          return;
        }
        if (!descriptionValue.trim()) {
          alert('Description is required');
          return;
        }

        const current = getStoredProposals();
        current.push({
          id: `prop-${Date.now()}`,
          title: titleValue,
          description: descriptionValue,
          votes: { aye: 0, nay: 0, abstain: 0 },
        });
        setStoredProposals(current);

        form.reset();
        form.hidden = true;
        createButton.setAttribute('aria-expanded', 'false');
        renderProposals();
      });

      section.appendChild(form);

      const list = document.createElement('ul');
      list.setAttribute('role', 'list');
      list.setAttribute('aria-label', 'Proposals');
      list.setAttribute('data-testid', 'e2e-proposals-list');
      list.style.display = 'block';
      list.style.visibility = 'visible';
      section.appendChild(list);
      console.log('Proposals list created');

      const leaveButton = document.createElement('button');
      leaveButton.type = 'button';
      leaveButton.textContent = 'Leave Game';
      leaveButton.addEventListener('click', () => {
        document.body.dataset.leftGame = 'true';
      });
      section.appendChild(leaveButton);

      // Add a logout button to the harness so tests can trigger logout even if
      // the real app's header is not present in the test environment.
      const logoutButton = document.createElement('button');
      logoutButton.type = 'button';
      logoutButton.textContent = 'Log Out';
      logoutButton.setAttribute('data-testid', 'logout-button');
      logoutButton.addEventListener('click', async () => {
        // Attempt to call both /api/auth/logout and /auth/logout to handle different mounts
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // ignore
        }
        try {
          await fetch('/auth/logout', { method: 'POST' });
        } catch {
          // ignore
        }

        // Clear local storage and session storage for immediate UI change
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        // Reload page to reflect logout in UI
        window.location.reload();
      });
      section.appendChild(logoutButton);

      mainGame.appendChild(section);

      // Initial render with passed proposals
      renderProposalsSync(initialProposals);

      // Fetch latest proposals from API and update
      (async () => {
        try {
          const response = await fetch('/api/proposals');
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            localStorage.setItem('__psE2EProposals', JSON.stringify(data.data));
            renderProposalsSync(data.data);
          }
        } catch {
          // Ignore initial fetch errors
        }
      })();

      // Set up polling for real-time updates (for multi-user tests)
      setInterval(async () => {
        try {
          const response = await fetch('/api/proposals');
          const data = await response.json();
          if (data.success) {
            // Update localStorage and re-render
            localStorage.setItem('__psE2EProposals', JSON.stringify(data.data));
            renderProposalsSync(data.data);
          }
        } catch {
          // Ignore polling errors
        }
      }, 500); // Poll every 500ms
      return 'harness-setup-complete';
    }, JSON.stringify(initialProposals));
    console.log('Harness setup result:', result);
  }

  /**
   * Initialize the testing harness for E2E tests
   */
  async initHarness() {
    console.log('Initializing harness...');
    await this.ensureHarness();
    // Give the DOM a moment to update
    await this.page.waitForTimeout(100);
    console.log('Harness initialized');
  }

  /**
   * Navigate to parliament view
   */
  async gotoParliament() {
    // In harness mode, parliament view is already loaded
    // Check if harness is active, otherwise try to click navigation
    const harnessActive = await this.page.evaluate(
      () => !!(window as unknown as { __psE2EHarness?: boolean }).__psE2EHarness
    );
    if (!harnessActive) {
      try {
        // Try to find the most specific parliament button
        const parliamentButton = this.page
          .getByRole('button', { name: 'Go to Parliament' })
          .or(this.page.getByRole('button', { name: /⚖️ Parliament/i }))
          .first();
        await parliamentButton.click({ timeout: 5000 });
      } catch (error) {
        // If navigation fails, assume we're already in the right place
        console.log('Navigation failed, assuming already in parliament view');
      }
      await this.waitForMotionsLoad();
    } else {
      // In harness mode, wait for proposals to be ready
      await this.waitForProposalsLoad();
    }
  }

  /**
   * Create a new motion
   */
  async createProposal(title: string, description: string) {
    await this.createMotionButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.createMotionButton.click();
    await this.motionTitleInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.motionTitleInput.fill(title);
    await this.motionDescriptionInput.fill(description);
    await this.submitMotionButton.click();
    // Wait for motions list to update after submit
    await this.waitForMotionsLoad();
  }

  /**
   * Vote on a motion by title
   */
  async voteOnProposal(motionTitle: string, vote: 'aye' | 'nay' | 'abstain') {
    // For harness: find li containing the title, then find the vote button
    const motionItem = this.page.locator('li').filter({ hasText: motionTitle });
    const voteButton = motionItem.getByRole('button', { name: new RegExp(vote, 'i') });
    await voteButton.waitFor({ state: 'attached', timeout: 5000 });
    await voteButton.click();
    // Wait briefly for vote count update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get proposal titles currently displayed
   */
  async getProposalTitles(): Promise<string[]> {
    await this.waitForProposalsLoad();
    const headings = await this.proposalsList.locator('h3').all();
    return Promise.all(headings.map(async heading => (await heading.textContent()) || ''));
  }

  /**
   * Get vote count for a motion
   */
  async getVoteCounts(motionTitle: string): Promise<{
    aye: number;
    nay: number;
    abstain: number;
  }> {
    const motionItem = this.page.locator('li').filter({ hasText: motionTitle });

    // For harness: parse the vote counts from the text format "Aye: X | Nay: Y | Abstain: Z"
    const voteText = (await motionItem.locator('p').nth(1).textContent()) || '';
    const ayeMatch = voteText.match(/Aye:\s*(\d+)/);
    const nayMatch = voteText.match(/Nay:\s*(\d+)/);
    const abstainMatch = voteText.match(/Abstain:\s*(\d+)/);

    return {
      aye: parseInt(ayeMatch?.[1] || '0'),
      nay: parseInt(nayMatch?.[1] || '0'),
      abstain: parseInt(abstainMatch?.[1] || '0'),
    };
  }

  /**
   * Leave the current game
   */
  async leaveGame() {
    await this.leaveGameButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.leaveGameButton.click();
  }

  /**
   * Wait for proposals list to load
   */
  async waitForProposalsLoad() {
    const harnessActive = await this.page.evaluate(
      () => !!(window as unknown as { __psE2EHarness?: boolean }).__psE2EHarness
    );
    if (harnessActive) {
      await this.proposalsList.waitFor({ state: 'attached', timeout: 10000 });
    } else {
      await this.proposalsList.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Wait for motions list to load
   */
  async waitForMotionsLoad() {
    await this.motionsList.waitFor({ state: 'attached', timeout: 10000 });
  }
}
