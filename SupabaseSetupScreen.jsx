export default function SupabaseSetupScreen() {
  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Supabase setup required</h1>
          <p>Connect your real project keys before opening the auth flow.</p>
        </div>
        <div className="setup-code">
          <code>VITE_SUPABASE_URL=https://your-project-id.supabase.co</code>
          <code>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</code>
        </div>
      </div>
    </div>
  )
}
