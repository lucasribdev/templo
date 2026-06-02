# Templo

Plataforma para encontrar comunidades e pessoas para jogar.

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Environment Variables

Create a `.env` file at the project root with the following values:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
VITE_SITE_URL=https://seu-dominio.com
```

# Database Migrations (Supabase)

This project stores SQL migrations in `supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase db reset
supabase db push
```

Notes:

- `supabase/migrations/20260318130000_initial_schema.sql`
  - Creates the full initial schema in one step: tables, indexes, triggers, RLS policies, RPCs and grants.
  - Represents the initial database shape for fresh local resets. Later migrations transition the backend naming to communities.
  - This is intended for `supabase db reset` / fresh environments, since there is no existing data to preserve.
- `supabase/migrations/20260602183000_rename_listings_to_communities.sql`
  - Renames backend database objects from listings to communities without deleting data.
  - Keeps the backend API and RPC surface on the communities naming only.

Seed data:

- Creates local sample users, profiles, games, communities and likes.
- Gives enough data to test list/detail pages and like counts locally.
- Apply migrations and seed together with:

```bash
supabase db reset
```

Common commands:

```bash
supabase db reset
supabase db pull
supabase migration new <name>
```

# Discord Invite Stats Cache

The app reads Discord invite online/member counts through:

```txt
GET /api/discord-invite-stats?codes=invite-a,invite-b
```

The API caches the latest Discord response in the `discord_invite_stats` table for 5 minutes. This avoids calling Discord again on every page render and reduces the chance of hitting Discord rate limits.

Required migrations:

- `supabase/migrations/20260514172000_create_discord_invite_stats.sql`
  - Creates the `discord_invite_stats` cache table and the `upsert_discord_invite_stats` RPC.
- `supabase/migrations/20260514203500_grant_discord_invite_stats_select.sql`
  - Grants `select` on `discord_invite_stats` to `anon` and `authenticated`.

Apply them with:

```bash
supabase db push
```

Cache response headers:

- `X-Discord-Stats-Cache: hit`
  - All requested invite codes were served from the local Supabase cache.
- `X-Discord-Stats-Cache: miss`
  - No fresh cache was available, so Discord was called and the cache was refreshed.
- `X-Discord-Stats-Cache: partial`
  - Some invite codes came from cache and some were refreshed from Discord.
- `X-Discord-Stats-Cache: unavailable`
  - The cache table could not be read. The API falls back to live Discord calls.

If the response includes this header:

```txt
X-Discord-Stats-Cache-Error: 42501
```

Postgres denied permission to read the cache table. Run the migrations above, or apply the grant manually in Supabase SQL Editor:

```sql
grant select on public.discord_invite_stats to anon, authenticated;
```

After the grant is applied, the first request should usually return `miss` and refresh the rows. A second request with the same invite codes within 5 minutes should return `hit`.

# Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Uninstall the packages: `npm install @tailwindcss/vite tailwindcss -D`

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "My App" },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
});
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from "@tanstack/react-start";

const getServerTime = createServerFn({
  method: "GET",
}).handler(async () => {
  return new Date().toISOString();
});

// Use in a component
function MyComponent() {
  const [time, setTime] = useState("");

  useEffect(() => {
    getServerTime().then(setTime);
  }, []);

  return <div>Server time: {time}</div>;
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/hello")({
  server: {
    handlers: {
      GET: () => json({ message: "Hello, World!" }),
    },
  },
});
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/people")({
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json();
  },
  component: PeopleComponent,
});

function PeopleComponent() {
  const data = Route.useLoaderData();
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  );
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
