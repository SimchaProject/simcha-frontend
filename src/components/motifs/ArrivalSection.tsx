interface ArrivalSectionProps {
  mapUrl: string | null
  parkingInfo: string | null
}

export function ArrivalSection({ mapUrl, parkingInfo }: ArrivalSectionProps) {
  if (!mapUrl && !parkingInfo) return null

  return (
    <div className="invite-arrival">
      <p className="invite-section-title">הגעה וחניה</p>
      {mapUrl && (
        <a className="invite-map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">
          פתיחת ניווט
        </a>
      )}
      {parkingInfo && <p className="invite-section-sub invite-arrival__parking">{parkingInfo}</p>}
    </div>
  )
}
