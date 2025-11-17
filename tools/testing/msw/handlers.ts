/**
 * MSW (Mock Service Worker) Request Handlers
 *
 * Comprehensive API endpoint mocking for testing.
 * Includes fixtures for all major API endpoints.
 */

import { http, HttpResponse } from 'msw';

// Import API fixtures
import { authFixtures } from './fixtures/auth.fixtures';
import { userFixtures } from './fixtures/user.fixtures';
import { billFixtures } from './fixtures/bill.fixtures';
import { voteFixtures } from './fixtures/vote.fixtures';
import { partyFixtures } from './fixtures/party.fixtures';
import { newsFixtures } from './fixtures/news.fixtures';

// Base API URL
const API_BASE = 'http://localhost:3001/api';

// Authentication endpoints
export const authHandlers = [
  // POST /api/auth/login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    const user = authFixtures.validUsers.find(u => u.email === body.email);
    if (!user || body.password !== 'password123') {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return HttpResponse.json({
      user: authFixtures.userProfile,
      token: authFixtures.validToken,
      refreshToken: authFixtures.validRefreshToken,
    });
  }),

  // POST /api/auth/register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; username: string };

    // Check if user already exists
    const existingUser = authFixtures.validUsers.find(u => u.email === body.email);
    if (existingUser) {
      return HttpResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    return HttpResponse.json({
      user: { ...authFixtures.userProfile, email: body.email, username: body.username },
      token: authFixtures.validToken,
      refreshToken: authFixtures.validRefreshToken,
    });
  }),

  // POST /api/auth/refresh
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken !== authFixtures.validRefreshToken) {
      return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    return HttpResponse.json({
      token: authFixtures.validToken,
      refreshToken: authFixtures.validRefreshToken,
    });
  }),

  // POST /api/auth/logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // GET /api/auth/me
  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(authFixtures.userProfile);
  }),
];

// User endpoints
export const userHandlers = [
  // GET /api/users
  http.get(`${API_BASE}/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = userFixtures.users.slice(startIndex, endIndex);

    return HttpResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: userFixtures.users.length,
        totalPages: Math.ceil(userFixtures.users.length / limit),
      },
    });
  }),

  // GET /api/users/:id
  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const { id } = params;
    const user = userFixtures.users.find(u => u.id === id);

    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json(user);
  }),

  // PUT /api/users/:id
  http.put(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as Partial<(typeof userFixtures.users)[0]>;

    const userIndex = userFixtures.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    userFixtures.users[userIndex] = { ...userFixtures.users[userIndex], ...updates };
    return HttpResponse.json(userFixtures.users[userIndex]);
  }),
];

// Bill endpoints
export const billHandlers = [
  // GET /api/bills
  http.get(`${API_BASE}/bills`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredBills = billFixtures.bills;

    if (status) {
      filteredBills = filteredBills.filter(bill => bill.status === status);
    }

    if (category) {
      filteredBills = filteredBills.filter(bill => bill.category === category);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBills = filteredBills.slice(startIndex, endIndex);

    return HttpResponse.json({
      bills: paginatedBills,
      pagination: {
        page,
        limit,
        total: filteredBills.length,
        totalPages: Math.ceil(filteredBills.length / limit),
      },
    });
  }),

  // GET /api/bills/:id
  http.get(`${API_BASE}/bills/:id`, ({ params }) => {
    const { id } = params;
    const bill = billFixtures.bills.find(b => b.id === id);

    if (!bill) {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return HttpResponse.json(bill);
  }),

  // POST /api/bills
  http.post(`${API_BASE}/bills`, async ({ request }) => {
    const body = (await request.json()) as Omit<
      (typeof billFixtures.bills)[0],
      'id' | 'createdAt' | 'updatedAt'
    >;

    const newBill = {
      ...body,
      id: `bill-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    billFixtures.bills.push(newBill);
    return HttpResponse.json(newBill, { status: 201 });
  }),
];

// Vote endpoints
export const voteHandlers = [
  // GET /api/votes/bill/:billId
  http.get(`${API_BASE}/votes/bill/:billId`, ({ params }) => {
    const { billId } = params;
    const billVotes = voteFixtures.votes.filter(v => v.billId === billId);

    return HttpResponse.json({
      votes: billVotes,
      summary: voteFixtures.voteSummary,
    });
  }),

  // POST /api/votes
  http.post(`${API_BASE}/votes`, async ({ request }) => {
    const body = (await request.json()) as Omit<(typeof voteFixtures.votes)[0], 'id' | 'createdAt'>;

    const newVote = {
      ...body,
      id: `vote-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    voteFixtures.votes.push(newVote);
    return HttpResponse.json(newVote, { status: 201 });
  }),

  // PUT /api/votes/:id
  http.put(`${API_BASE}/votes/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as Partial<(typeof voteFixtures.votes)[0]>;

    const voteIndex = voteFixtures.votes.findIndex(v => v.id === id);
    if (voteIndex === -1) {
      return HttpResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    voteFixtures.votes[voteIndex] = { ...voteFixtures.votes[voteIndex], ...updates };
    return HttpResponse.json(voteFixtures.votes[voteIndex]);
  }),
];

// Party endpoints
export const partyHandlers = [
  // GET /api/parties
  http.get(`${API_BASE}/parties`, () => {
    return HttpResponse.json(partyFixtures.parties);
  }),

  // GET /api/parties/:id
  http.get(`${API_BASE}/parties/:id`, ({ params }) => {
    const { id } = params;
    const party = partyFixtures.parties.find(p => p.id === id);

    if (!party) {
      return HttpResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    return HttpResponse.json(party);
  }),
];

// News endpoints
export const newsHandlers = [
  // GET /api/news
  http.get(`${API_BASE}/news`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredNews = newsFixtures.newsArticles;

    if (category) {
      filteredNews = filteredNews.filter(article => article.category === category);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNews = filteredNews.slice(startIndex, endIndex);

    return HttpResponse.json({
      articles: paginatedNews,
      pagination: {
        page,
        limit,
        total: filteredNews.length,
        totalPages: Math.ceil(filteredNews.length / limit),
      },
    });
  }),

  // GET /api/news/:id
  http.get(`${API_BASE}/news/:id`, ({ params }) => {
    const { id } = params;
    const article = newsFixtures.newsArticles.find(a => a.id === id);

    if (!article) {
      return HttpResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return HttpResponse.json(article);
  }),
];

// Error simulation handlers
export const errorHandlers = [
  // Simulate network errors
  http.get(`${API_BASE}/error/network`, () => {
    return HttpResponse.error();
  }),

  // Simulate server errors
  http.get(`${API_BASE}/error/server`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  // Simulate timeout
  http.get(`${API_BASE}/error/timeout`, async () => {
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
    return HttpResponse.json({ success: true });
  }),
];

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...billHandlers,
  ...voteHandlers,
  ...partyHandlers,
  ...newsHandlers,
  ...errorHandlers,
];
