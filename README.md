# 🐾 Pawprint

An open-source, self-hosted link-in-bio page that runs entirely on [Cloudflare Workers](https://workers.cloudflare.com). Think Linktree or Carrd, but free, fast, and fully yours.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/furryweekend/Pawprint)

## Features

- **Profile page** with avatar, header image, bio, links, and social media icons
- **10 gradient presets** plus custom colors and background images
- **3 button styles** — filled, outlined, and soft/glassmorphism
- **Click analytics** — track total clicks, clicks over time, top referrers, and countries
- **Password-protected analytics dashboard** at `/analytics`
- **Admin panel** at `/admin` — edit your config live through a web UI (stored in KV)
- **Configuration-driven** — edit `config.json` and push, or use the admin panel
- **Zero cost** — runs on Cloudflare Workers free tier with D1 for analytics
- **One-click deploy** — use the button above

## Quick Start

1. Click the **Deploy to Cloudflare** button above
2. Set your `ANALYTICS_PASSWORD` when prompted
3. Edit `config.json` in your new repository to customize your page
4. Push your changes — your page auto-deploys

## Configuration

There are two ways to configure your Pawprint page:

1. **Admin panel** — visit `/admin` on your deployed worker, log in with the same password as analytics, and edit everything through a web form. Changes are saved to Cloudflare KV and take effect instantly.
2. **`config.json`** — edit the file directly and push. This serves as the default/fallback when KV is empty (e.g. on first deploy).

KV config takes priority over `config.json`. If you've made changes via the admin panel, those will be used.

### config.json

```jsonc
{
  // Profile
  "name": "Your Name",
  "bio": "A short bio about yourself.",
  "avatar": "https://example.com/avatar.jpg",
  "header": "https://example.com/header.jpg",  // optional

  // Links
  "links": [
    { "title": "My Website", "url": "https://example.com", "icon": "globe" },
    { "title": "My Blog", "url": "https://blog.example.com", "icon": "pencil" },
    { "title": "Support Me", "url": "https://ko-fi.com/example", "icon": "heart" }
  ],

  // Social media icons
  "socials": [
    { "platform": "github", "url": "https://github.com/example" },
    { "platform": "twitter", "url": "https://twitter.com/example" },
    { "platform": "bluesky", "url": "https://bsky.app/profile/example" }
  ],

  // Theme
  "theme": {
    "gradient": "sunset",
    "textColor": "#ffffff",
    "buttonStyle": "filled",
    "buttonColor": "#6c63ff",
    "buttonTextColor": "#ffffff",
    "buttonRadius": "12px",
    "font": "Inter"
  }
}
```

### Link Icons

Available icons for links: `globe`, `pencil`, `heart`, `star`, `link`, `music`, `shop`, `coffee`, `camera`, `book`

### Social Platforms

Supported platforms with built-in icons: `twitter`, `github`, `instagram`, `youtube`, `discord`, `twitch`, `mastodon`, `bluesky`, `telegram`, `linkedin`, `tiktok`, `email`

### Theme Options

#### Backgrounds

Pick **one** of these in the `theme` object:

| Option | Example | Description |
|---|---|---|
| `gradient` | `"sunset"` | Use a preset gradient (see below) |
| `color` | `"#1a1a2e"` | Solid background color |
| `backgroundImage` | `"https://..."` | Custom background image URL |

#### Gradient Presets

| Name | Colors |
|---|---|
| `sunset` | Orange → Pink |
| `ocean` | Sky Blue → Indigo |
| `forest` | Green → Teal |
| `midnight` | Deep Navy → Indigo |
| `aurora` | Purple → Cyan |
| `ember` | Red → Amber |
| `lavender` | Light Purple → Pink |
| `cosmic` | Indigo → Pink → Orange |
| `slate` | Dark Gray → Darker Gray |
| `candy` | Pink → Purple → Blue |

#### Custom Fonts

The `font` field in your theme config accepts any [Google Fonts](https://fonts.google.com/) family name:

```jsonc
{
  "theme": {
    "font": "Poppins"       // Clean and modern
    // "font": "Playfair Display"  // Elegant serif
    // "font": "JetBrains Mono"    // Monospace/techy
    // "font": "Nunito"            // Friendly and rounded
  }
}
```

The font is loaded automatically from Google Fonts CDN. If omitted, it defaults to `Inter`.

#### Button Styles

| Style | Description |
|---|---|
| `filled` | Solid background with text color |
| `outlined` | Transparent with colored border |
| `soft` | Translucent background with blur effect |

## Admin Panel

Visit `/admin` on your deployed worker to edit your config through a web UI. Uses the same password as the analytics dashboard.

From the admin panel you can edit:
- Profile info (name, bio, avatar, header)
- Links (add, remove, reorder)
- Social media accounts
- Theme settings (gradient, colors, fonts, button styles)

Changes are saved to Cloudflare KV and take effect immediately — no redeploy needed.

## Analytics

Visit `/analytics` on your deployed worker to access the analytics dashboard. You'll need the password you set during deployment.

The dashboard shows:
- Total clicks per link
- Clicks over time (line chart)
- Filterable by time period (7d, 30d, 90d, 1y)

Analytics data is stored in a [Cloudflare D1](https://developers.cloudflare.com/d1/) database that's automatically provisioned during deployment.

## Local Development

```bash
# Install dependencies
npm install

# Generate types
npx wrangler types

# Create a .dev.vars file with your password
echo "ANALYTICS_PASSWORD=test" > .dev.vars

# Create local D1 database and run migrations
npx wrangler d1 migrations apply DB --local

# Start dev server
npm run dev
```

## Project Structure

```
├── config.json              # Your profile configuration
├── src/
│   ├── index.ts             # Routes and click tracking
│   ├── render.ts            # Profile page HTML renderer
│   ├── admin.ts             # Admin panel HTML renderer
│   ├── config.ts            # Config loading (KV + file fallback)
│   ├── theme.ts             # Gradient presets and CSS generation
│   ├── icons.ts             # SVG social media and link icons
│   ├── auth.ts              # Session cookie auth
│   └── types.ts             # TypeScript type definitions
├── public/
│   └── analytics.html       # Analytics dashboard
├── migrations/
│   └── 0001_create_clicks.sql
├── wrangler.jsonc            # Cloudflare Worker config
└── package.json
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com) — Edge runtime
- [H3](https://h3.dev) — HTTP framework
- [Cloudflare KV](https://developers.cloudflare.com/kv/) — Config storage for admin panel
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite analytics database
- [Chart.js](https://www.chartjs.org) — Analytics charts
- TypeScript

## License

Apache 2.0 — see [LICENSE](LICENSE)
