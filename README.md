# 🐾 Pawprint

An open-source, self-hosted link-in-bio page with click tracking analytics that runs entirely on [Cloudflare Workers](https://workers.cloudflare.com). Think Linktree but free, fast, and fully yours.

**See it in action:** [links.furryweekend.com](https://links.furryweekend.com)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/furryweekend/Pawprint)

## Features

- **Profile page** with avatar, header image, bio, links, and social media icons
- **Font Awesome icons** - use any [Font Awesome Free](https://fontawesome.com/search?o=r&m=free) icon for links and socials
- **10 gradient presets** plus custom colors and background images
- **3 button styles** - filled, outlined, and soft/glassmorphism
- **4 container styles** - none, filled, outlined, and glass
- **Emphasize links** - add a bounce animation to highlight important links
- **Click analytics** - track total clicks, clicks over time, top referrers, and countries
- **Password-protected analytics dashboard** at `/analytics`
- **Admin panel** at `/admin` - edit your config live through a web UI with live preview (stored in KV)
- **Configuration-driven** - edit `config.json` and push, or use the admin panel
- **Google Fonts support** - use any font from the [Google Fonts](https://fonts.google.com/) catalog
- **Zero cost** - runs on Cloudflare Workers free tier with D1 for analytics
- **One-click deploy** - use the button above

## Quick Start

1. Click the **Deploy to Cloudflare** button above
2. Set your `ADMIN_PASSWORD` when prompted
3. Edit `config.json` in your new repository to customize your page
4. Push your changes — your page auto-deploys

## Configuration

There are two ways to configure your Pawprint page:

1. **Admin panel** — visit `/admin` on your deployed worker, log in with the admin password you set, and edit everything through a web form. Changes are saved to Cloudflare KV and take effect instantly.
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
    { "title": "My Website", "url": "https://example.com", "icon": "globe", "emphasize": true },
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
    "font": "Inter",
    "container": "filled",
    "containerColor": "#ffffff",
    "containerRadius": "12px"
  }
}
```

### Icons

Links and socials use [Font Awesome Free](https://fontawesome.com/search?o=r&m=free) icons. You can use **any** icon name from the Font Awesome Free library — just set the `icon` field to the icon name (e.g. `globe`, `paw`, `rocket`, `code`, `dog`).

Social platform names (`twitter`, `github`, `instagram`, `youtube`, `discord`, `twitch`, `mastodon`, `bluesky`, `telegram`, `linkedin`, `tiktok`, `email`) automatically use their brand icons and can be used as link icons too.

Browse all available icons at [fontawesome.com/search](https://fontawesome.com/search?o=r&m=free).

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

#### Button Styles

| Style | Description |
|---|---|
| `filled` | Solid background with text color |
| `outlined` | Transparent with colored border |
| `soft` | Translucent background with blur effect |

#### Fonts

The font field accepts any [Google Font](https://fonts.google.com/) family name. Browse the catalog, find a font you like, and use its exact name:

```jsonc
{
  "theme": {
    "font": "Inter"
    // "font": "Playfair Display"
    // "font": "JetBrains Mono"
    // "font": "Nunito"
  }
}
```

#### Container Styles
| Style | Description |
|---|---|
| `filled` | Solid background |
| `outlined` | Transparent with colored border |
| `glass` | Translucent background with blur effect |


## Admin Panel

Visit `/admin` on your deployed worker to edit your config through a web UI. You'll need the password you set during deployment.

From the admin panel you can edit:
- Profile info (name, bio, avatar, header)
- Links (add, remove, reorder)
- Social media accounts
- Theme settings (gradient, colors, fonts, button styles)

Changes are saved to Cloudflare KV and take effect immediately, no redeploy needed.


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
echo "ADMIN_PASSWORD=test" > .dev.vars

# Create local D1 database and run migrations
npx wrangler d1 migrations apply DB --local

# Start dev server
npm run dev
```

### Manual Deployment

If you're deploying manually instead of using the deploy button:

```bash
# Create KV namespace and update the id in wrangler.jsonc
npx wrangler kv namespace create CONFIG_KV

# Create D1 database
npx wrangler d1 create pawprint-analytics

# Update wrangler.jsonc with the IDs from the commands above, then:
npm run deploy
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
│   ├── icons.ts             # Font Awesome icon mappings
│   ├── auth.ts              # Session cookie auth
│   └── types.ts             # TypeScript type definitions
├── public/
│   └── analytics.html       # Analytics dashboard
├── migrations/
│   └── 0001_create_clicks.sql
├── wrangler.jsonc            # Cloudflare Worker config
└── package.json
```

## License

Apache 2.0 — see [LICENSE](LICENSE)

___

Made by [Furry Weekend Atlanta](https://furryweekend.com)

## Notice

This worker was largely written with the help of [devin.ai](https://devin.ai). As part of my (Gomi's) day job I have been having to evaluate and use AI products, Devin being one of them. This project started as a way to better test its ability to create Cloudflare Workers and handle larger UX tasks.

All code that devin wrote was reviewed by myself.
