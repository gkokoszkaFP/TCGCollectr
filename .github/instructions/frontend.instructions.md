---
applyTo: "**/*.tsx,**/*.jsx,**/*.astro,src/styles/**"
---

# Frontend Guidelines

## General Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

## TAILWIND

- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

## Guidelines for ACCESSIBILITY

### MOBILE_ACCESSIBILITY

- Ensure touch targets are at least 44 by 44 pixels for comfortable interaction on mobile devices
- Implement proper viewport configuration to support pinch-to-zoom and prevent scaling issues
- Design layouts that adapt to both portrait and landscape orientations without loss of content
- Support both touch and keyboard navigation for hybrid devices with {{input_methods}}
- Ensure interactive elements have sufficient spacing to prevent accidental activation
- Test with mobile screen readers like VoiceOver (iOS) and TalkBack (Android)
- Design forms that work efficiently with on-screen keyboards and autocomplete functionality
- Implement alternatives to complex gestures that require fine motor control
- Ensure content is accessible when device orientation is locked for users with fixed devices
- Provide alternatives to motion-based interactions for users with vestibular disorders

### ACCESSIBILITY_TESTING

- Test keyboard navigation to verify all interactive elements are operable without a mouse
- Verify screen reader compatibility with NVDA, JAWS, and VoiceOver for {{critical_user_journeys}}
- Use automated testing tools like Axe, WAVE, or Lighthouse to identify common accessibility issues
- Check color contrast using tools like Colour Contrast Analyzer for all text and UI components
- Test with page zoomed to 200% to ensure content remains usable and visible
- Perform manual accessibility audits using WCAG 2.2 checklist for key user flows
- Test with voice recognition software like Dragon NaturallySpeaking for voice navigation
- Validate form inputs have proper labels, instructions, and error handling mechanisms
- Conduct usability testing with disabled users representing various disability types
- Implement accessibility unit tests for UI components to prevent regression

## Anti-patterns

### Common Frontend Anti-patterns to Avoid

- Don't inline styles when Tailwind utilities are sufficient
- Avoid creating custom CSS files when Tailwind classes can achieve the same result
- Don't use arbitrary values excessively - prefer extending Tailwind config for repeated values
- Avoid missing accessibility attributes (aria-label, alt text, etc.)
- Don't forget semantic HTML - use appropriate elements (button, nav, main, etc.)
