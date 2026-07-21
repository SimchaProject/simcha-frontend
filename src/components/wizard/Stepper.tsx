import { Fragment } from 'react'

interface StepperProps {
  current: number
  total: number
}

export function Stepper({ current, total }: StepperProps) {
  return (
    <div className="wizard-stepper">
      <div className="wizard-stepper__dots">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <Fragment key={n}>
            {n > 1 && (
              <span
                className={`wizard-stepper__line${n <= current ? ' wizard-stepper__line--done' : ''}`}
              />
            )}
            <span
              className={`wizard-stepper__dot${n <= current ? ' wizard-stepper__dot--filled' : ''}`}
            />
          </Fragment>
        ))}
      </div>
      <p className="wizard-stepper__label">
        שלב {current} מתוך {total}
      </p>
    </div>
  )
}
