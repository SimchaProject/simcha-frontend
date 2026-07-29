interface GiftSectionProps {
  payboxLink: string | null
  bankTransferDetails: string | null
}

// Renders nothing until the couple sets this up - common right after
// signup, must degrade gracefully on the live public page.
export function GiftSection({ payboxLink, bankTransferDetails }: GiftSectionProps) {
  if (!payboxLink && !bankTransferDetails) return null

  return (
    <div className="invite-gift">
      <p className="invite-section-title">מתנה</p>
      {payboxLink && (
        <div className="invite-seal-wrap">
          <a
            className="wax-seal"
            style={{ transform: 'rotate(-3deg)' }}
            href={payboxLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            PayBox
          </a>
        </div>
      )}
      {bankTransferDetails && <pre className="invite-bank-details">{bankTransferDetails}</pre>}
    </div>
  )
}
