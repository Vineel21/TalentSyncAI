# Rules While building the application

Always use TypeScript.

Never use JavaScript.

Use functional React components only.

Never access Supabase directly from React.

Always call Express APIs.

Use TanStack Query for server state.

Use React Hook Form + Zod.

Every API route must have:

- validation
- controller
- service
- repository

Every API response:

{
  "success": true,
  "message": "",
  "data": {}
}

Every page must support:

- Loading state
- Error state
- Empty state

Never duplicate components.

Reuse shared UI.

Use shadcn/ui.

Write production-ready code.

Do not generate placeholder implementations.