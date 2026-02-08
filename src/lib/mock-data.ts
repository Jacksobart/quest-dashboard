// ============================================================
// MOCK DATA FOR QUEST SYSTEM DASHBOARD
// ============================================================

export interface Mission {
  id: string;
  agent: string;
  priority: number;
  objective: string;
  timeout: number;
  maxRetries: number;
  files: { own: string[]; read: string[] };
  depends: string[];
  acceptance: { id: string; cmd: string; expect: string }[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  progress: number;
  retryCount: number;
  duration?: number;
  context: string;
}

export interface GapAnalysis {
  requirement_id: string;
  srd_section: string;
  status: 'missing' | 'misaligned' | 'implemented' | 'partial';
  confidence: 'high' | 'medium' | 'low';
  evidence: { type: string; location: string; snippet: string }[];
  testable_assertion: string;
  disposition?: string;
  notes: string;
}

export interface Requirement {
  id: string;
  section: string;
  description: string;
  assertions: { type: string; cmd?: string; pattern?: string; expect_exit?: number }[];
  status: 'verified' | 'unverified' | 'failing' | 'partial' | null;
  coverage: number;
  missionId?: string;
}

export interface QuestPhase {
  id: number;
  name: string;
  command: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  description: string;
  gate: string;
  duration?: number;
}

export interface AgentConfig {
  name: string;
  description: string;
  files_own: string[];
  files_read: string[];
  color: string;
  icon: string;
  missionsAssigned: number;
  missionsCompleted: number;
}

export interface DriftEvent {
  missionId: string;
  file: string;
  type: 'unauthorized_write' | 'scope_violation' | 'clean';
  action: 'reverted' | 'flagged' | 'approved';
  timestamp: number;
}

export interface VerificationGate {
  name: string;
  phase: string;
  checks: { name: string; status: 'pass' | 'fail' | 'running' | 'pending'; duration?: number; details?: string }[];
  status: 'pass' | 'fail' | 'running' | 'pending';
}

// ---- PHASES ----
export const phases: QuestPhase[] = [
  { id: 0, name: 'INIT', command: 'quest init --spec SRD.md', status: 'completed', description: 'Validate spec, create .quest/ directory, generate codebase index', gate: 'validate-spec', duration: 4.2 },
  { id: 1, name: 'ANALYZE', command: 'quest analyze --scope v2', status: 'completed', description: 'Agent Teams produce structured JSON findings with convergence loop', gate: 'validate-analysis', duration: 47.8 },
  { id: 2, name: 'PLAN', command: 'quest plan --max-missions 12', status: 'completed', description: 'Single Opus session generates conflict-free YAML missions', gate: 'validate-plan', duration: 23.1 },
  { id: 3, name: 'EXECUTE', command: 'quest run --backend tmux', status: 'active', description: 'Ralph loops per mission with external acceptance verification', gate: 'per-batch check', duration: undefined },
  { id: 4, name: 'VERIFY + SHIP', command: 'quest review && quest push', status: 'pending', description: 'Agent Teams review, full test suite, SRD re-evaluation, PR generation', gate: 'full review', duration: undefined },
];

// ---- MISSIONS ----
export const missions: Mission[] = [
  {
    id: 'm-01', agent: 'backend', priority: 1,
    objective: 'Implement order state machine transitions with validation',
    timeout: 600, maxRetries: 3,
    files: { own: ['src/api/routes/orders.py', 'src/api/services/order_service.py'], read: ['src/shared/types/order.ts'] },
    depends: [], acceptance: [
      { id: 'ac-01', cmd: 'pytest src/api/tests/test_order_transitions.py -x', expect: 'exit_code_0' },
      { id: 'ac-02', cmd: "curl -s -o /dev/null -w '%{http_code}' -X POST localhost:8000/orders/1/transition -d '{\"status\":\"invalid\"}'", expect: '400' }
    ],
    status: 'completed', progress: 100, retryCount: 0, duration: 142,
    context: 'SPEC Section 6 defines valid order transitions: draft->pending->accepted->in_progress->completed.'
  },
  {
    id: 'm-02', agent: 'frontend', priority: 1,
    objective: 'Build order status dashboard with real-time WebSocket updates',
    timeout: 600, maxRetries: 3,
    files: { own: ['src/app/orders/page.tsx', 'src/components/OrderStatus.tsx', 'src/components/OrderTimeline.tsx'], read: ['src/shared/types/order.ts'] },
    depends: [], acceptance: [
      { id: 'ac-03', cmd: 'npx tsc --noEmit src/app/orders/page.tsx', expect: 'exit_code_0' },
      { id: 'ac-04', cmd: 'npx playwright test tests/e2e/orders.spec.ts', expect: 'exit_code_0' }
    ],
    status: 'completed', progress: 100, retryCount: 1, duration: 298,
    context: 'Build the order tracking dashboard per SPEC Section 8.2 with live status updates.'
  },
  {
    id: 'm-03', agent: 'database', priority: 1,
    objective: 'Add order state transition audit log table and triggers',
    timeout: 480, maxRetries: 3,
    files: { own: ['migrations/0024_order_audit_log.sql', 'src/db/queries/audit.ts'], read: ['src/db/schema.ts'] },
    depends: [], acceptance: [
      { id: 'ac-05', cmd: 'psql -c "SELECT 1 FROM order_audit_log LIMIT 1"', expect: 'exit_code_0' },
      { id: 'ac-06', cmd: 'npm run test:db -- --grep "audit"', expect: 'exit_code_0' }
    ],
    status: 'completed', progress: 100, retryCount: 0, duration: 87,
    context: 'SPEC Section 6.4 requires audit logging for all state transitions.'
  },
  {
    id: 'm-04', agent: 'backend', priority: 2,
    objective: 'Implement payment processing webhook handlers',
    timeout: 600, maxRetries: 3,
    files: { own: ['src/api/routes/webhooks.py', 'src/api/services/payment_service.py', 'src/api/middleware/webhook_auth.py'], read: ['src/shared/types/payment.ts'] },
    depends: ['m-01'], acceptance: [
      { id: 'ac-07', cmd: 'pytest src/api/tests/test_webhooks.py -x', expect: 'exit_code_0' },
      { id: 'ac-08', cmd: 'pytest src/api/tests/test_webhook_auth.py -x', expect: 'exit_code_0' }
    ],
    status: 'running', progress: 73, retryCount: 0,
    context: 'SPEC Section 7.1 defines Stripe webhook handling for payment_intent.succeeded and payment_intent.failed.'
  },
  {
    id: 'm-05', agent: 'frontend', priority: 2,
    objective: 'Create payment checkout flow with Stripe Elements integration',
    timeout: 600, maxRetries: 3,
    files: { own: ['src/app/checkout/page.tsx', 'src/components/PaymentForm.tsx', 'src/components/CheckoutSummary.tsx'], read: ['src/shared/types/payment.ts', 'src/shared/types/order.ts'] },
    depends: ['m-02'], acceptance: [
      { id: 'ac-09', cmd: 'npx tsc --noEmit src/app/checkout/page.tsx', expect: 'exit_code_0' },
      { id: 'ac-10', cmd: 'npx playwright test tests/e2e/checkout.spec.ts', expect: 'exit_code_0' }
    ],
    status: 'running', progress: 45, retryCount: 0,
    context: 'SPEC Section 7.3 defines the checkout UX flow. Must integrate Stripe Elements per SPEC Section 7.2.'
  },
  {
    id: 'm-06', agent: 'backend', priority: 2,
    objective: 'Add inventory reservation system with pessimistic locking',
    timeout: 480, maxRetries: 3,
    files: { own: ['src/api/services/inventory_service.py', 'src/api/routes/inventory.py'], read: ['src/db/schema.ts'] },
    depends: ['m-01', 'm-03'], acceptance: [
      { id: 'ac-11', cmd: 'pytest src/api/tests/test_inventory.py -x', expect: 'exit_code_0' },
      { id: 'ac-12', cmd: 'pytest src/api/tests/test_inventory_concurrent.py -x', expect: 'exit_code_0' }
    ],
    status: 'running', progress: 61, retryCount: 0,
    context: 'SPEC Section 5.3 requires atomic inventory reservation with pessimistic locking to prevent oversells.'
  },
  {
    id: 'm-07', agent: 'testing', priority: 2,
    objective: 'Write integration tests for order-payment-inventory flow',
    timeout: 480, maxRetries: 2,
    files: { own: ['tests/integration/test_order_flow.py', 'tests/integration/test_payment_flow.py', 'tests/fixtures/order_fixtures.py'], read: ['src/api/routes/orders.py', 'src/api/routes/webhooks.py'] },
    depends: ['m-01', 'm-03'], acceptance: [
      { id: 'ac-13', cmd: 'pytest tests/integration/ -x --tb=short', expect: 'exit_code_0' }
    ],
    status: 'running', progress: 88, retryCount: 0,
    context: 'Full integration test coverage for the order lifecycle including payment webhooks.'
  },
  {
    id: 'm-08', agent: 'frontend', priority: 3,
    objective: 'Build admin dashboard with order management and analytics',
    timeout: 600, maxRetries: 3,
    files: { own: ['src/app/admin/page.tsx', 'src/app/admin/orders/page.tsx', 'src/components/AdminChart.tsx', 'src/components/OrderTable.tsx'], read: ['src/shared/types/order.ts', 'src/shared/types/analytics.ts'] },
    depends: ['m-02', 'm-05'], acceptance: [
      { id: 'ac-14', cmd: 'npx tsc --noEmit src/app/admin/page.tsx', expect: 'exit_code_0' },
      { id: 'ac-15', cmd: 'npx playwright test tests/e2e/admin.spec.ts', expect: 'exit_code_0' }
    ],
    status: 'pending', progress: 0, retryCount: 0,
    context: 'SPEC Section 9 defines admin interfaces with order search, filtering, and revenue analytics.'
  },
  {
    id: 'm-09', agent: 'backend', priority: 3,
    objective: 'Implement email notification service for order events',
    timeout: 480, maxRetries: 3,
    files: { own: ['src/api/services/notification_service.py', 'src/api/templates/order_confirmation.html', 'src/api/templates/shipping_update.html'], read: ['src/shared/types/order.ts'] },
    depends: ['m-04'], acceptance: [
      { id: 'ac-16', cmd: 'pytest src/api/tests/test_notifications.py -x', expect: 'exit_code_0' },
      { id: 'ac-17', cmd: 'pytest src/api/tests/test_email_templates.py -x', expect: 'exit_code_0' }
    ],
    status: 'pending', progress: 0, retryCount: 0,
    context: 'SPEC Section 10.1 requires transactional emails for order confirmation, shipping, and delivery.'
  },
  {
    id: 'm-10', agent: 'database', priority: 3,
    objective: 'Add analytics materialized views for revenue and order metrics',
    timeout: 480, maxRetries: 2,
    files: { own: ['migrations/0025_analytics_views.sql', 'src/db/queries/analytics.ts'], read: ['src/db/schema.ts'] },
    depends: ['m-03'], acceptance: [
      { id: 'ac-18', cmd: 'psql -c "SELECT * FROM mv_daily_revenue LIMIT 1"', expect: 'exit_code_0' },
      { id: 'ac-19', cmd: 'npm run test:db -- --grep "analytics"', expect: 'exit_code_0' }
    ],
    status: 'pending', progress: 0, retryCount: 0,
    context: 'SPEC Section 9.4 defines analytics dashboard data requirements.'
  },
  {
    id: 'm-11', agent: 'backend', priority: 4,
    objective: 'Add rate limiting and request validation middleware',
    timeout: 300, maxRetries: 2,
    files: { own: ['src/api/middleware/rate_limiter.py', 'src/api/middleware/request_validator.py'], read: ['src/api/routes/orders.py'] },
    depends: ['m-04'], acceptance: [
      { id: 'ac-20', cmd: 'pytest src/api/tests/test_rate_limiter.py -x', expect: 'exit_code_0' },
      { id: 'ac-21', cmd: "curl -s -o /dev/null -w '%{http_code}' localhost:8000/health", expect: '200' }
    ],
    status: 'pending', progress: 0, retryCount: 0,
    context: 'SPEC Section 11.2 requires rate limiting on all public endpoints.'
  },
  {
    id: 'm-12', agent: 'testing', priority: 4,
    objective: 'Write E2E Playwright tests for complete user journey',
    timeout: 600, maxRetries: 2,
    files: { own: ['tests/e2e/user_journey.spec.ts', 'tests/e2e/checkout_flow.spec.ts', 'tests/e2e/admin_flow.spec.ts'], read: ['src/app/orders/page.tsx', 'src/app/checkout/page.tsx', 'src/app/admin/page.tsx'] },
    depends: ['m-05', 'm-08'], acceptance: [
      { id: 'ac-22', cmd: 'npx playwright test tests/e2e/ --reporter=html', expect: 'exit_code_0' }
    ],
    status: 'pending', progress: 0, retryCount: 0,
    context: 'Full E2E test coverage for the complete user journey from browsing to order completion.'
  },
];

// ---- GAP ANALYSIS ----
export const gaps: GapAnalysis[] = [
  {
    requirement_id: 'REQ-ORDER-001', srd_section: '6.1', status: 'implemented', confidence: 'high',
    evidence: [{ type: 'file_reference', location: 'src/api/routes/orders.py:42', snippet: 'class OrderCreateView(APIView):' }],
    testable_assertion: "curl -s -w '%{http_code}' -X POST localhost:8000/orders -d '{}'", disposition: 'mission: m-01',
    notes: 'Order creation endpoint exists but lacks state machine validation.'
  },
  {
    requirement_id: 'REQ-ORDER-002', srd_section: '6.2', status: 'missing', confidence: 'high',
    evidence: [{ type: 'file_reference', location: 'src/api/routes/orders.py:142', snippet: '# TODO: validate state transitions' }],
    testable_assertion: "curl -s -o /dev/null -w '%{http_code}' -X POST localhost:8000/orders/1/transition -d '{\"status\":\"invalid\"}'", disposition: 'mission: m-01',
    notes: 'No transition validation exists. Direct status update without checking current state.'
  },
  {
    requirement_id: 'REQ-ORDER-003', srd_section: '6.3', status: 'missing', confidence: 'high',
    evidence: [{ type: 'code_search', location: 'src/api/', snippet: 'No audit logging found in order routes' }],
    testable_assertion: 'psql -c "SELECT 1 FROM order_audit_log LIMIT 1"', disposition: 'mission: m-03',
    notes: 'No audit trail for order state changes. Required by SPEC Section 6.4.'
  },
  {
    requirement_id: 'REQ-PAY-001', srd_section: '7.1', status: 'partial', confidence: 'medium',
    evidence: [{ type: 'file_reference', location: 'src/api/routes/webhooks.py:1', snippet: '# Placeholder webhook handler' }],
    testable_assertion: 'pytest src/api/tests/test_webhooks.py -x', disposition: 'mission: m-04',
    notes: 'Webhook route exists but handler is a placeholder. No signature verification.'
  },
  {
    requirement_id: 'REQ-PAY-002', srd_section: '7.2', status: 'missing', confidence: 'high',
    evidence: [{ type: 'code_search', location: 'src/app/checkout/', snippet: 'Directory does not exist' }],
    testable_assertion: 'npx tsc --noEmit src/app/checkout/page.tsx', disposition: 'mission: m-05',
    notes: 'Checkout flow not implemented. No Stripe Elements integration.'
  },
  {
    requirement_id: 'REQ-INV-001', srd_section: '5.3', status: 'misaligned', confidence: 'high',
    evidence: [{ type: 'file_reference', location: 'src/api/services/inventory_service.py:78', snippet: 'def reserve_stock(product_id, qty):  # No locking' }],
    testable_assertion: 'pytest src/api/tests/test_inventory_concurrent.py -x', disposition: 'mission: m-06',
    notes: 'Inventory reservation exists but uses optimistic concurrency. SPEC requires pessimistic locking.'
  },
  {
    requirement_id: 'REQ-NOTIFY-001', srd_section: '10.1', status: 'missing', confidence: 'high',
    evidence: [{ type: 'code_search', location: 'src/api/services/', snippet: 'No notification service found' }],
    testable_assertion: 'pytest src/api/tests/test_notifications.py -x', disposition: 'mission: m-09',
    notes: 'No email notification system. Transactional emails required for order events.'
  },
  {
    requirement_id: 'REQ-ADMIN-001', srd_section: '9.1', status: 'missing', confidence: 'medium',
    evidence: [{ type: 'code_search', location: 'src/app/admin/', snippet: 'Directory exists but only contains placeholder' }],
    testable_assertion: 'npx playwright test tests/e2e/admin.spec.ts', disposition: 'mission: m-08',
    notes: 'Admin dashboard is a placeholder. Needs order management and analytics views.'
  },
  {
    requirement_id: 'REQ-ANALYTICS-001', srd_section: '9.4', status: 'missing', confidence: 'high',
    evidence: [{ type: 'code_search', location: 'src/db/', snippet: 'No analytics views or materialized tables' }],
    testable_assertion: 'psql -c "SELECT * FROM mv_daily_revenue LIMIT 1"', disposition: 'mission: m-10',
    notes: 'No analytics data layer. Materialized views needed for dashboard performance.'
  },
  {
    requirement_id: 'REQ-SEC-001', srd_section: '11.2', status: 'missing', confidence: 'medium',
    evidence: [{ type: 'code_search', location: 'src/api/middleware/', snippet: 'No rate limiting middleware found' }],
    testable_assertion: 'pytest src/api/tests/test_rate_limiter.py -x', disposition: 'mission: m-11',
    notes: 'No rate limiting on public endpoints. Required for production security.'
  },
  {
    requirement_id: 'REQ-UI-001', srd_section: '8.2', status: 'partial', confidence: 'low',
    evidence: [{ type: 'file_reference', location: 'src/app/orders/page.tsx:1', snippet: 'export default function OrdersPage() { return <div>TODO</div> }' }],
    testable_assertion: 'npx playwright test tests/e2e/orders.spec.ts', disposition: 'mission: m-02',
    notes: 'Order page exists but is a placeholder. Needs WebSocket integration for live updates.'
  },
  {
    requirement_id: 'REQ-TEST-001', srd_section: '12.1', status: 'missing', confidence: 'high',
    evidence: [{ type: 'code_search', location: 'tests/', snippet: 'Only unit tests exist. No integration or E2E tests.' }],
    testable_assertion: 'npx playwright test tests/e2e/ --reporter=html', disposition: 'mission: m-12',
    notes: 'No E2E tests. Full user journey testing required before ship.'
  },
];

// ---- REQUIREMENTS ----
export const requirements: Requirement[] = [
  { id: 'REQ-ORDER-001', section: '6.1', description: 'Order creation with required fields validation', assertions: [{ type: 'shell', cmd: "curl -s -w '%{http_code}' -X POST localhost:8000/orders", expect_exit: 0 }], status: 'verified', coverage: 100, missionId: 'm-01' },
  { id: 'REQ-ORDER-002', section: '6.2', description: 'Invalid order transitions return 400', assertions: [{ type: 'shell', cmd: "curl -s -o /dev/null -w '%{http_code}' -X POST localhost:8000/orders/1/transition -d '{\"status\":\"invalid\"}'", expect_exit: 0 }], status: 'verified', coverage: 100, missionId: 'm-01' },
  { id: 'REQ-ORDER-003', section: '6.3', description: 'Order state transitions are audit logged', assertions: [{ type: 'shell', cmd: 'psql -c "SELECT 1 FROM order_audit_log LIMIT 1"', expect_exit: 0 }], status: 'verified', coverage: 100, missionId: 'm-03' },
  { id: 'REQ-PAY-001', section: '7.1', description: 'Stripe webhook signature verification', assertions: [{ type: 'shell', cmd: 'pytest src/api/tests/test_webhook_auth.py -x', expect_exit: 0 }], status: 'partial', coverage: 73, missionId: 'm-04' },
  { id: 'REQ-PAY-002', section: '7.2', description: 'Checkout flow with Stripe Elements', assertions: [{ type: 'shell', cmd: 'npx playwright test tests/e2e/checkout.spec.ts', expect_exit: 0 }], status: 'partial', coverage: 45, missionId: 'm-05' },
  { id: 'REQ-INV-001', section: '5.3', description: 'Pessimistic locking for inventory reservation', assertions: [{ type: 'shell', cmd: 'pytest src/api/tests/test_inventory_concurrent.py -x', expect_exit: 0 }], status: 'partial', coverage: 61, missionId: 'm-06' },
  { id: 'REQ-NOTIFY-001', section: '10.1', description: 'Transactional email notifications', assertions: [{ type: 'shell', cmd: 'pytest src/api/tests/test_notifications.py -x', expect_exit: 0 }], status: null, coverage: 0, missionId: 'm-09' },
  { id: 'REQ-ADMIN-001', section: '9.1', description: 'Admin order management dashboard', assertions: [{ type: 'shell', cmd: 'npx playwright test tests/e2e/admin.spec.ts', expect_exit: 0 }], status: null, coverage: 0, missionId: 'm-08' },
  { id: 'REQ-ANALYTICS-001', section: '9.4', description: 'Analytics materialized views', assertions: [{ type: 'shell', cmd: 'psql -c "SELECT * FROM mv_daily_revenue LIMIT 1"', expect_exit: 0 }], status: null, coverage: 0, missionId: 'm-10' },
  { id: 'REQ-SEC-001', section: '11.2', description: 'Rate limiting on public endpoints', assertions: [{ type: 'shell', cmd: 'pytest src/api/tests/test_rate_limiter.py -x', expect_exit: 0 }], status: null, coverage: 0, missionId: 'm-11' },
  { id: 'REQ-UI-001', section: '8.2', description: 'Order status dashboard with WebSocket', assertions: [{ type: 'shell', cmd: 'npx playwright test tests/e2e/orders.spec.ts', expect_exit: 0 }], status: 'verified', coverage: 100, missionId: 'm-02' },
  { id: 'REQ-TEST-001', section: '12.1', description: 'E2E test coverage for user journey', assertions: [{ type: 'shell', cmd: 'npx playwright test tests/e2e/', expect_exit: 0 }], status: null, coverage: 0, missionId: 'm-12' },
];

// ---- AGENT CONFIGS ----
export const agents: AgentConfig[] = [
  { name: 'backend', description: 'Backend API and services', files_own: ['src/api/**', 'src/services/**'], files_read: ['src/shared/**'], color: '#00e5ff', icon: '⚡', missionsAssigned: 5, missionsCompleted: 1 },
  { name: 'frontend', description: 'React UI components and pages', files_own: ['src/app/**', 'src/components/**'], files_read: ['src/shared/**'], color: '#8b5cf6', icon: '🎨', missionsAssigned: 3, missionsCompleted: 1 },
  { name: 'database', description: 'Schema, migrations, queries', files_own: ['migrations/**', 'src/db/**'], files_read: ['src/shared/**'], color: '#fbbf24', icon: '🗄️', missionsAssigned: 2, missionsCompleted: 1 },
  { name: 'testing', description: 'Test files only', files_own: ['**/*.test.*', '**/tests/**'], files_read: ['src/**'], color: '#34d399', icon: '🧪', missionsAssigned: 2, missionsCompleted: 0 },
];

// ---- DRIFT EVENTS ----
export const driftEvents: DriftEvent[] = [
  { missionId: 'm-02', file: 'src/shared/types/order.ts', type: 'unauthorized_write', action: 'reverted', timestamp: Date.now() - 120000 },
  { missionId: 'm-01', file: 'src/api/routes/orders.py', type: 'clean', action: 'approved', timestamp: Date.now() - 300000 },
  { missionId: 'm-01', file: 'src/api/services/order_service.py', type: 'clean', action: 'approved', timestamp: Date.now() - 298000 },
  { missionId: 'm-03', file: 'migrations/0024_order_audit_log.sql', type: 'clean', action: 'approved', timestamp: Date.now() - 200000 },
  { missionId: 'm-03', file: 'src/db/queries/audit.ts', type: 'clean', action: 'approved', timestamp: Date.now() - 198000 },
  { missionId: 'm-02', file: 'package.json', type: 'scope_violation', action: 'flagged', timestamp: Date.now() - 115000 },
  { missionId: 'm-04', file: 'src/api/routes/webhooks.py', type: 'clean', action: 'approved', timestamp: Date.now() - 60000 },
  { missionId: 'm-06', file: 'src/api/services/inventory_service.py', type: 'clean', action: 'approved', timestamp: Date.now() - 50000 },
];

// ---- VERIFICATION GATES ----
export const verificationGates: VerificationGate[] = [
  {
    name: 'validate-spec', phase: 'INIT', status: 'pass',
    checks: [
      { name: 'Testability check', status: 'pass', duration: 1.2, details: '47/47 requirements have testable assertions' },
      { name: 'State machine completeness', status: 'pass', duration: 0.8, details: 'All 5 order states reachable from initial' },
      { name: 'Enum consistency', status: 'pass', duration: 0.3, details: '12 enums consistent across 34 references' },
      { name: 'Cross-reference integrity', status: 'pass', duration: 0.6, details: 'Data models match API contracts' },
      { name: 'Coverage', status: 'pass', duration: 0.2, details: 'All 14 sections have testable requirements' },
    ]
  },
  {
    name: 'validate-analysis', phase: 'ANALYZE', status: 'pass',
    checks: [
      { name: 'Requirement coverage', status: 'pass', duration: 2.1, details: '12/12 requirements analyzed' },
      { name: 'No contradictions', status: 'pass', duration: 3.4, details: '0 contradictions between 4 analysts' },
      { name: 'Evidence paths exist', status: 'pass', duration: 1.8, details: '24/24 evidence file paths verified' },
      { name: 'Convergence (iteration 2/3)', status: 'pass', duration: 12.3, details: 'All low-confidence items re-examined and upgraded' },
    ]
  },
  {
    name: 'validate-plan', phase: 'PLAN', status: 'pass',
    checks: [
      { name: 'Zero file ownership overlaps', status: 'pass', duration: 0.4, details: '0 conflicts across 12 missions' },
      { name: 'DAG is acyclic', status: 'pass', duration: 0.1, details: 'Topological sort successful' },
      { name: 'Gap coverage', status: 'pass', duration: 0.8, details: '12/12 gaps have dispositions (10 mission, 0 defer, 0 accept-risk, 2 duplicate)' },
      { name: 'Acceptance criteria executable', status: 'pass', duration: 2.3, details: '22/22 commands are syntactically valid shell' },
      { name: 'File budget (<=8)', status: 'pass', duration: 0.1, details: 'Max 4 files per mission' },
    ]
  },
  {
    name: 'per-mission smoke', phase: 'EXECUTE', status: 'running',
    checks: [
      { name: 'm-01 acceptance criteria', status: 'pass', duration: 3.2, details: '2/2 criteria passed' },
      { name: 'm-01 scoped typecheck', status: 'pass', duration: 1.8, details: 'No errors in owned files' },
      { name: 'm-01 drift check', status: 'pass', duration: 0.4, details: '2 files modified, all within scope' },
      { name: 'm-02 acceptance criteria', status: 'pass', duration: 4.1, details: '2/2 criteria passed' },
      { name: 'm-02 drift check', status: 'pass', duration: 0.3, details: '1 unauthorized file reverted' },
      { name: 'm-03 acceptance criteria', status: 'pass', duration: 2.9, details: '2/2 criteria passed' },
      { name: 'm-03 drift check', status: 'pass', duration: 0.2, details: '2 files modified, all within scope' },
      { name: 'm-04 acceptance criteria', status: 'running', details: 'Running...' },
    ]
  },
  {
    name: 'per-batch check', phase: 'EXECUTE', status: 'pending',
    checks: [
      { name: 'Full project typecheck', status: 'pending' },
      { name: 'ESLint', status: 'pending' },
      { name: 'Regression: m-01 criteria', status: 'pending' },
      { name: 'Regression: m-02 criteria', status: 'pending' },
      { name: 'Regression: m-03 criteria', status: 'pending' },
    ]
  },
  {
    name: 'full review', phase: 'VERIFY + SHIP', status: 'pending',
    checks: [
      { name: 'Full test suite', status: 'pending' },
      { name: 'Playwright E2E', status: 'pending' },
      { name: 'SRD re-evaluation', status: 'pending' },
      { name: 'Final drift check', status: 'pending' },
      { name: 'Code quality review', status: 'pending' },
      { name: 'Integration review', status: 'pending' },
    ]
  },
];

// ---- TERMINAL COMMANDS ----
export const terminalHistory = [
  { cmd: 'quest init --spec SRD.md', output: `✓ Spec validated (47 requirements, 14 sections)\n✓ Created .quest/ directory\n✓ Generated codebase index (342 files, 28 routes, 15 tables)\n✓ Gate: validate-spec PASSED (3.1s)`, timing: 4.2 },
  { cmd: 'quest analyze --scope v2', output: `▸ Spawning 4 analyst agents (Opus)...\n  ├─ systems-analyst: analyzing architecture & data flow\n  ├─ api-analyst: analyzing routes & contracts\n  ├─ ui-analyst: analyzing components & pages\n  └─ security-analyst: analyzing auth & validation\n▸ Iteration 1/3: 12 findings, 2 low-confidence\n▸ Iteration 2/3: 12 findings, 0 low-confidence (converged)\n✓ Gate: validate-analysis PASSED (47.8s)\n  ├─ 12/12 requirements covered\n  ├─ 0 contradictions\n  └─ 24/24 evidence paths verified`, timing: 47.8 },
  { cmd: 'quest plan --max-missions 12', output: `▸ Single Opus session with full analysis context...\n▸ Generated 12 missions across 4 agents\n▸ DAG: 4 batches (3→4→3→2)\n✓ Gate: validate-plan PASSED (23.1s)\n  ├─ 0 file ownership overlaps\n  ├─ DAG is acyclic ✓\n  ├─ 12/12 gaps have dispositions\n  ├─ 22/22 acceptance criteria executable\n  └─ Max 4 files/mission (budget: 8)`, timing: 23.1 },
  { cmd: 'quest run --backend tmux', output: `▸ Launching execution backend: tmux\n▸ Batch 1/4: m-01, m-02, m-03 (parallel)\n  ├─ m-01 [backend] ████████████████████ DONE (142s, 0 retries)\n  ├─ m-02 [frontend] ████████████████████ DONE (298s, 1 retry)\n  └─ m-03 [database] ████████████████████ DONE (87s, 0 retries)\n▸ Batch 1 smoke checks: 3/3 passed\n▸ Batch 1 gate: typecheck ✓ | lint ✓ | regression ✓\n▸ Batch 2/4: m-04, m-05, m-06, m-07 (parallel)\n  ├─ m-04 [backend]  ██████████████▒░░░░░ 73%\n  ├─ m-05 [frontend] █████████▒░░░░░░░░░░ 45%\n  ├─ m-06 [backend]  ████████████▒░░░░░░░ 61%\n  └─ m-07 [testing]  █████████████████▒░░ 88%`, timing: undefined },
];

// ---- TELEMETRY STATS ----
export const telemetryStats = {
  totalMissions: 12,
  completedMissions: 3,
  runningMissions: 4,
  pendingMissions: 5,
  totalRetries: 1,
  avgMissionDuration: 175.7,
  totalDriftEvents: 8,
  driftReverts: 1,
  driftFlags: 1,
  acceptanceCriteriaTotal: 22,
  acceptanceCriteriaPassed: 6,
  acceptanceCriteriaRunning: 4,
  filesOwned: 32,
  filesRead: 12,
  dagBatches: 4,
  currentBatch: 2,
  questElapsed: 602,
  estimatedRemaining: 840,
  modelUsed: 'claude-opus-4-6',
  backend: 'tmux',
};
