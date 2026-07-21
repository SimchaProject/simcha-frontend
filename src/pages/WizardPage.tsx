import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { weddingApi } from '../api/wedding'
import { Stepper } from '../components/wizard/Stepper'
import { StepBasics } from '../components/wizard/StepBasics'
import { StepGuestPage } from '../components/wizard/StepGuestPage'
import { StepEventDetails } from '../components/wizard/StepEventDetails'
import { StepReview } from '../components/wizard/StepReview'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { validateBasics, validateEventDetails } from '../components/wizard/validation'
import { clearWizardData, loadWizardData, saveWizardData } from '../components/wizard/storage'
import { initialWizardData, WIZARD_STEP_COUNT, type WizardData } from '../components/wizard/types'
import './WizardPage.css'

export function WizardPage() {
  const { couple } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<WizardData>(() =>
    couple ? (loadWizardData(couple.id) ?? initialWizardData) : initialWizardData,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!couple) return
    saveWizardData(couple.id, data)
  }, [couple, data])

  if (!couple) return null

  const updateData = (patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }

  const goToStep = (step: number) => {
    setErrors({})
    updateData({ step })
  }

  const handleBack = () => {
    if (data.step > 1) goToStep(data.step - 1)
  }

  const handleContinue = () => {
    if (data.step === 1) {
      const stepErrors = validateBasics(data)
      setErrors(stepErrors)
      if (Object.keys(stepErrors).length > 0) return
    }
    if (data.step === 3) {
      const stepErrors = validateEventDetails(data)
      setErrors(stepErrors)
      if (Object.keys(stepErrors).length > 0) return
    }
    goToStep(data.step + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await weddingApi.create({
        coupleNameA: data.coupleNameA.trim(),
        coupleNameB: data.coupleNameB.trim(),
        date: data.date,
        venue: data.venue.trim(),
        slug: data.slug,
        guestPageConfig: {
          theme: data.theme,
          welcomeMessage: data.welcomeMessage.trim() || undefined,
          ceremonyTime: data.ceremonyTime || undefined,
          rsvpDeadline: data.rsvpDeadline || undefined,
          dressCode: data.dressCode.trim() || undefined,
          contactPhone: data.contactPhone.replace(/[\s-]/g, '') || undefined,
        },
      })

      clearWizardData(couple.id)
      navigate('/dashboard', { replace: true })
    } catch {
      setSubmitError('משהו השתבש ביצירת החתונה. נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="wizard-page">
      <div className="wizard-card">
        <Stepper current={data.step} total={WIZARD_STEP_COUNT} />

        {data.step === 1 && <StepBasics data={data} errors={errors} onChange={updateData} />}
        {data.step === 2 && <StepGuestPage data={data} onChange={updateData} />}
        {data.step === 3 && <StepEventDetails data={data} errors={errors} onChange={updateData} />}
        {data.step === 4 && <StepReview data={data} />}

        {submitError && <p className="wizard-page__error">{submitError}</p>}

        <div className="wizard-footer">
          {data.step > 1 ? (
            <button type="button" className="wizard-back-link" onClick={handleBack}>
              חזרה
            </button>
          ) : (
            <span />
          )}

          {data.step < WIZARD_STEP_COUNT ? (
            <button type="button" className="wizard-continue-btn" onClick={handleContinue}>
              המשך
            </button>
          ) : (
            <WaxSealButton onClick={handleSubmit} loading={submitting} rotation={-5}>
              צרו את
              <br />
              החתונה
            </WaxSealButton>
          )}
        </div>
      </div>
    </div>
  )
}
