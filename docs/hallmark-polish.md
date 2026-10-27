# Portfolio polish with Hallmark

Scope: preserve the original portfolio, dark/light palette, navigation, interactive terminal, project selector, AI project accordions, GitHub contributions, analytics, résumé and legal routes. No wholesale redesign.

Applied Nutlope/hallmark in polish mode. Removed decorative glow, fake keyboard shortcut, gradient heading text, repetitive uppercase labels, broad shadows and hover lifts from noninteractive cards. Preserved project data, links and product claims.

## Copy changes

| Before | After |
| --- | --- |
| Projects with a purpose | Selected projects |
| Building ahead of the curve | Building with AI |
| Journey | What I’m learning |
| Skills | Tools I use |
| Contact | Get in touch |

Hero: “I build Python apps and machine learning projects.” Descriptions now state what projects do and what the author contributes, using shorter sentences.

## Responsive and accessibility changes

Smaller fluid hero typography, earlier navigation collapse, stacked layouts on narrow screens, larger touch controls, visible focus, Escape to close the mobile menu, reduced-motion support, a skip link and project-detail scrolling on phones. Contribution fetch failures now show an unavailable state rather than fabricated zero activity.

## Validation

TypeScript 5.9 no-emit check passed. Hallmark static scan improved from 55 FAIL / 175 REFLEX / 10 WARN to 1 FAIL / 0 REFLEX / 8 WARN. The remaining FAIL54 is a false positive on the résumé’s semantic Projects section heading preceding project entries; it is retained. Remaining warnings concern the existing stylesheet structure, deliberately preserved under polish scope. Static notes are not a render pass. Browser and deployment validation is recorded in the delivery message.

Hallmark’s automated render tier was not available in the local environment. Do not interpret the static result as a complete automated visual audit.
