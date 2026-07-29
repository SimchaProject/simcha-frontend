import type { Guest } from '../../types/guests'

// Renders only when the backend cron has flagged this guest as reminder-due.
// Clicking just opens a wa.me link - there is no auto-send, ever.
export function ReminderButton({ guest }: { guest: Guest }) {
  if (!guest.isReminderDue || !guest.reminderWaMeLink) return null

  return (
    <a
      className="btn btn--ghost reminder-button"
      href={guest.reminderWaMeLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      תזכורת
    </a>
  )
}
