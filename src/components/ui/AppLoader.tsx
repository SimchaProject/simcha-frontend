import './AppLoader.css'

/** Full-viewport paper-background spinner - what every route shows while it
 * blocks on an auth check or an initial data fetch, instead of a blank
 * white flash. */
export function AppLoader() {
  return (
    <div className="app-loader">
      <span className="app-loader__spinner" aria-hidden="true" />
    </div>
  )
}
