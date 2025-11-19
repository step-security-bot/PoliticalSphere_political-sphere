import { expect, test } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

function AccessibleButton(props: { label: string; onClick?: () => void }) {
  return (
    <button type="button" aria-label={props.label} onClick={props.onClick}>
      {props.label}
    </button>
  );
}

test('AccessibleButton has no basic a11y violations', async () => {
  const { container } = render(<AccessibleButton label="Submit" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
