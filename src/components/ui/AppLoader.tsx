import { useSlowConnection } from '../../hooks/useSlowConnection'
import './AppLoader.css'

/** Full-viewport paper-background spinner - what every route shows while it
 * blocks on an auth check or an initial data fetch, instead of a blank
 * white flash. */
export function AppLoader() {
  const slow = useSlowConnection(true)

  return (
    <div className="app-loader">
      <span className="app-loader__spinner" aria-hidden="true" />
      <p className="app-loader__text">
        {slow ? 'השרת מתעורר משינה, זה עלול לקחת כמה שניות...' : 'מתחברים לשרת...'}
      </p>
    </div>
  )
}
