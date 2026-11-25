# Nursing Queen visual direction

## Current reference — 25 November 2026

The latest Home screen is the visual reference for every route, including forms, meals, photo analysis, profile and settings. Preserve its existing plum/lilac palette, softly tinted activity tiles, compact pill actions and restrained depth. Earlier dated directions below document the evolution; this section takes precedence when they differ.

Use the shared `Button` for primary, secondary and destructive actions, `IconButton` / `ScreenBack` for navigation, `SelectField` for dropdowns and `ListRow` for selectable lists. Use `Icon` for utility symbols and `ActivityArtwork` consistently for activity illustrations. Do not substitute emoji or a different icon family on secondary screens.

Keep action pills and circular utility controls in the same family as Home. Size them for their role: primary actions use the shared 52-point / 26-radius geometry, compact actions keep a minimum 44-point target, navigation uses 48-point circles. Keep pressed, selected and disabled feedback consistent. Quantity presets may be circular, with the same accent and contrast colors. Shared colors and metrics belong in theme tokens rather than independent screen-specific palettes.

For meal entry, keep search first, reveal suggestions only after typing, allow multiple selections, and keep the shared Save action in the keyboard-safe bottom footer. Check long French labels, English and Arabic RTL without clipping.

Reference: Airbnb's redesigned app and its clear category hierarchy, readable labels and restrained navigation: https://news.airbnb.com/airbnb-2025-summer-release/ . These are product design principles, not copied brand assets or proprietary font files.

Keep Nursing Queen's lilac/plum palette and activity colors. Use a single system font, a 34/26/20/16/13 type hierarchy with moderate weights, 24-point screen gutters, consistent 12/16-point component radii and generous spacing. White action tiles carry a small tinted icon surface; avoid a colored box inside another colored box. Keep a visible plus sign and text label for logging. Active timers stay immediately beside their action and in the shared session dock.

Use a plain fixed bottom navigation with outline icons and a color-selected label. Primary buttons remain generously sized, with subtle press feedback. Cards have a light border and no blanket shadow; elevation is reserved for raised content. Preserve dark/night modes and screen-reader labels. Test at a narrow mobile width and with the keyboard open.

Navigation controls: 48-point circular icon targets, a clean chevron for full screens and a close icon at the trailing edge for dismissible logging flows. Keep their screen-reader labels; mirror the back chevron for RTL. No bordered rectangular “Back” buttons. Entry headings use a compact tinted activity icon and a quiet timestamp without another boxed surface.

## Approved reference — 23 November 2026

Use the supplied sixth screenshot as the Home layout reference: a real baby-profile banner, two action cards per row and explicit Start/Add/Finish buttons. Use consistent outline icons rather than emoji; no invented baby photo, weight, timer target or decorative controls. White cards, plum/raspberry accents and soft lilac surfaces share 18/24/28-point radii. Keep the plain bottom navigation. Active timers show tabular elapsed time above the finish button and in the persistent dock. Long labels wrap; cards grow vertically. History combines activity filters with title/note search. Empty forecasts invite logging; correction actions appear when results exist. Zero chart values have no visible bars.
