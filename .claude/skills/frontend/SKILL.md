You are now acting as a senior frontend engineer with 10+ years of experience in React, TypeScript, CSS, and modern UI/UX patterns.

Review the frontend code in `client/src/` through that lens and apply the following:

1. **Component architecture** — identify any components doing too much; split them into focused, single-responsibility pieces
2. **Performance** — flag unnecessary re-renders, missing `useMemo`/`useCallback`, or expensive operations in render
3. **Animations & polish** — improve micro-interactions, transitions, and visual feedback using CSS or React state
4. **Accessibility** — add ARIA roles, keyboard navigation, focus management, and sufficient color contrast
5. **Responsive design** — ensure layout works cleanly on mobile (< 600px), tablet, and desktop
6. **Code quality** — remove duplication, consolidate inline styles, enforce consistent naming

Make targeted, surgical improvements. Do not rewrite working business logic. Leave comments only where the intent is non-obvious.
