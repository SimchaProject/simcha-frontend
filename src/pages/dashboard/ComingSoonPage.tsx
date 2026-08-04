interface ComingSoonPageProps {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="dash-coming-soon">
      <div className="dash-page-header">
        <p className="dash-page-title">{title}</p>
      </div>
      <div className="dash-coming-soon__card">
        <p className="dash-coming-soon__badge">בקרוב</p>
        <p className="dash-coming-soon__text">{description}</p>
      </div>
    </div>
  )
}
