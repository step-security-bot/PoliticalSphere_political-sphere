---
applies_to:
  - '**/*.tsx'
  - '**/*.jsx'
  - '**/components/**'
  - '**/ui/**'
  - '**/pages/**'
---

# Accessibility Instructions for GitHub Copilot

## WCAG 2.2 AA Compliance (Mandatory)

All UI components MUST meet WCAG 2.2 Level AA standards.

### Core Accessibility Principles

1. **Perceivable**: Users must be able to perceive the information
2. **Operable**: Users must be able to operate the interface
3. **Understandable**: Users must be able to understand the information and UI
4. **Robust**: Content must be robust enough for assistive technologies

### Semantic HTML

**Always use semantic HTML elements:**

```tsx
// ✅ Good: Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

// ❌ Bad: Div soup
<div className="nav">
  <div className="link">Home</div>
  <div className="link">About</div>
</div>
```

### Keyboard Navigation

**Ensure full keyboard accessibility:**

```tsx
// ✅ Good: Keyboard accessible custom button
function CustomButton({ onClick, children }: CustomButtonProps) {
  return (
    <button
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      type="button"
    >
      {children}
    </button>
  );
}

// ✅ Good: Keyboard accessible custom component
function DropdownMenu({ items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div role="menu">
      <button aria-expanded={isOpen} aria-haspopup="true" onClick={() => setIsOpen(!isOpen)}>
        Menu
      </button>
      {isOpen && (
        <ul role="menu">
          {items.map((item, index) => (
            <li key={item.id} role="menuitem" tabIndex={0}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ❌ Bad: Not keyboard accessible
function CustomButton({ onClick, children }: CustomButtonProps) {
  return <div onClick={onClick}>{children}</div>; // No keyboard support!
}
```

### ARIA Attributes

**Use ARIA appropriately (when semantic HTML isn't sufficient):**

```tsx
// ✅ Good: Proper ARIA usage
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  return (
    <div role="search">
      <label htmlFor="search-input">Search</label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search site content"
        aria-describedby="search-help"
      />
      <span id="search-help" className="sr-only">
        Enter keywords to search the site
      </span>

      {results.length > 0 && (
        <div role="region" aria-live="polite" aria-atomic="true">
          {results.length} results found
        </div>
      )}
    </div>
  );
}

// ❌ Bad: Redundant ARIA
<button role="button" aria-label="Click me">
  Click me
</button>;
// Button element already has button role; redundant ARIA
```

### Form Accessibility

**Accessible form patterns:**

```tsx
// ✅ Good: Accessible form with validation
function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.includes('@')) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };

  return (
    <form>
      <div>
        <label htmlFor="email">
          Email Address
          <span aria-label="required" className="required">
            *
          </span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            validateEmail(e.target.value);
          }}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        {error && (
          <span id="email-error" role="alert" className="error">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}

// ❌ Bad: Inaccessible form
function RegistrationForm() {
  return (
    <form>
      <div>
        Email: <input type="text" /> {/* No label association */}
        {error && <div>{error}</div>} {/* No ARIA for screen readers */}
      </div>
    </form>
  );
}
```

### Focus Management

**Manage focus appropriately:**

```tsx
// ✅ Good: Focus management in modal
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1}>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
}

// ✅ Good: Skip link
function Layout({ children }: LayoutProps) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav>...</nav>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

### Color & Contrast

**Ensure sufficient color contrast:**

```tsx
// ✅ Good: High contrast (4.5:1 for normal text, 3:1 for large text)
const styles = {
  text: {
    color: '#000000', // Black on white: 21:1 ratio ✓
    backgroundColor: '#FFFFFF',
  },
  button: {
    color: '#FFFFFF',
    backgroundColor: '#0066CC', // Blue: 4.5:1 ratio ✓
  },
};

// ❌ Bad: Insufficient contrast
const styles = {
  text: {
    color: '#999999', // Gray on white: 2.85:1 ratio ✗
    backgroundColor: '#FFFFFF',
  },
};
```

**Don't rely on color alone:**

```tsx
// ✅ Good: Multiple indicators
function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'success':
        return { color: 'green', icon: '✓', text: 'Success' };
      case 'error':
        return { color: 'red', icon: '✗', text: 'Error' };
      case 'warning':
        return { color: 'orange', icon: '⚠', text: 'Warning' };
      default:
        return { color: 'gray', icon: '○', text: 'Unknown' };
    }
  };

  const { color, icon, text } = getStatusInfo(status);

  return (
    <span style={{ color }} aria-label={text}>
      <span aria-hidden="true">{icon}</span>
      {text}
    </span>
  );
}

// ❌ Bad: Color only
function StatusBadge({ status }: StatusBadgeProps) {
  return <span style={{ color: status === 'success' ? 'green' : 'red' }} />;
  // No text, icon, or other indicator
}
```

### Text Alternatives

**Provide text alternatives for non-text content:**

```tsx
// ✅ Good: Descriptive alt text
<img
  src="/logo.png"
  alt="Political Sphere - Democratic simulation platform"
/>

// ✅ Good: Decorative images
<img src="/decorative-pattern.png" alt="" role="presentation" />

// ✅ Good: Complex images with long descriptions
<figure>
  <img
    src="/election-results.png"
    alt="Bar chart showing election results"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    Election results show Party A with 45%, Party B with 35%, and Party C with 20%
  </figcaption>
</figure>

// ❌ Bad: Missing or generic alt text
<img src="/logo.png" alt="image" />
<img src="/logo.png" /> {/* No alt attribute */}
```

### Headings & Landmarks

**Use proper heading hierarchy:**

```tsx
// ✅ Good: Logical heading structure
<main>
  <h1>Main Page Title</h1>
  <section>
    <h2>Section 1</h2>
    <h3>Subsection 1.1</h3>
    <h3>Subsection 1.2</h3>
  </section>
  <section>
    <h2>Section 2</h2>
  </section>
</main>

// ❌ Bad: Skipping heading levels
<main>
  <h1>Main Title</h1>
  <h4>Subsection</h4> {/* Skipped h2 and h3 */}
</main>
```

**Use landmark regions:**

```tsx
// ✅ Good: Semantic landmarks
<body>
  <header>
    <nav aria-label="Main navigation">...</nav>
  </header>
  <main>
    <article>...</article>
    <aside aria-label="Related content">...</aside>
  </main>
  <footer>...</footer>
</body>
```

### Motion & Animation

**Respect user preferences:**

```tsx
// ✅ Good: Respect prefers-reduced-motion
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return reducedMotion;
};

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={reducedMotion ? 'no-animation' : 'animated'}
    >
      Content
    </div>
  );
}

// CSS
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

**Ensure adequate touch target sizes:**

```tsx
// ✅ Good: Large enough touch targets (minimum 44x44px)
const buttonStyle = {
  minWidth: '44px',
  minHeight: '44px',
  padding: '12px 24px',
};

<button style={buttonStyle}>Click me</button>

// ❌ Bad: Too small
<button style={{ padding: '2px 4px' }}>X</button> // Too small to tap
```

### Screen Reader Only Content

**Provide additional context for screen readers:**

```tsx
// ✅ Good: Screen reader only text
<button>
  <span aria-hidden="true">×</span>
  <span className="sr-only">Close modal</span>
</button>

// CSS for .sr-only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Live Regions

**Announce dynamic content:**

```tsx
// ✅ Good: Announce status updates
function SaveStatus({ status }: SaveStatusProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {status === 'saving' && 'Saving...'}
      {status === 'saved' && 'Saved successfully'}
      {status === 'error' && 'Error saving changes'}
    </div>
  );
}

// ✅ Good: Urgent announcements
function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div role="alert" aria-live="assertive">
      {message}
    </div>
  );
}
```

### Accessibility Testing

**Always include accessibility tests:**

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('MyComponent accessibility', () => {
  it('should have no WCAG violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    const { getByRole } = render(<MyComponent />);
    const button = getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

### Accessibility Checklist

Before submitting UI code:

- [ ] Semantic HTML used appropriately
- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA attributes (only when needed)
- [ ] All forms have associated labels
- [ ] Sufficient color contrast (4.5:1 or 3:1)
- [ ] Not relying on color alone for information
- [ ] Text alternatives for non-text content
- [ ] Logical heading hierarchy
- [ ] Landmark regions defined
- [ ] Respects prefers-reduced-motion
- [ ] Touch targets ≥ 44×44px
- [ ] Focus indicators visible
- [ ] Error messages announced to screen readers
- [ ] Dynamic content updates announced
- [ ] Tested with axe-core
- [ ] Manually tested with keyboard
- [ ] Tested with screen reader (NVDA/JAWS/VoiceOver)

### Common Accessibility Anti-Patterns

1. ❌ Using `<div>` or `<span>` for interactive elements
2. ❌ Missing form labels
3. ❌ Low color contrast
4. ❌ Keyboard traps
5. ❌ Missing or poor alt text
6. ❌ Redundant or incorrect ARIA
7. ❌ Skipping heading levels
8. ❌ Relying on color alone
9. ❌ Auto-playing media without controls
10. ❌ Time limits without option to extend

### Resources

- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Articles: https://webaim.org/articles/
- axe DevTools: https://www.deque.com/axe/devtools/
