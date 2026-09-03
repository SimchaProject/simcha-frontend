import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { weddingApi } from '../api/wedding'
import { resizeImage } from '../utils/resizeImage'
import { Stepper } from '../components/wizard/Stepper'
import { StepBasics } from '../components/wizard/StepBasics'
import { StepGuestPage } from '../components/wizard/StepGuestPage'
import { StepEventDetails } from '../components/wizard/StepEventDetails'
import { StepReview } from '../components/wizard/StepReview'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { AppLoader } from '../components/ui/AppLoader'
import { validateBasics, validateEventDetails } from '../components/wizard/validation'
import { clearWizardData, loadWizardData, saveWizardData } from '../components/wizard/storage'
import { initialWizardData, WIZARD_STEP_COUNT, type WizardData } from '../components/wizard/types'
import './WizardPage.css'

export function WizardPage() {
  const { couple, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<WizardData>(() =>
    couple ? (loadWizardData(couple.id) ?? initialWizardData) : initialWizardData,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // A couple only ever gets one wedding (the backend 409s on a second) - a
  // couple who already has one can still land here via the back button or a
  // stale bookmark, and would otherwise fill out the whole wizard just to
  // hit that error on submit.
  const [checkingExisting, setCheckingExisting] = useState(true)
  // A failed check (a flaky request, a backend redeploy mid-request) must
  // not be treated as "no wedding yet" - that would drop a couple who
  // already has one into a blank wizard with nothing on it to undo that.
  const [checkFailed, setCheckFailed] = useState(false)
  const [checkAttempt, setCheckAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    setCheckingExisting(true)
    setCheckFailed(false)
    weddingApi
      .getMine()
      .then((existing) => {
        if (cancelled) return
        if (existing) {
          navigate('/dashboard', { replace: true })
          return
        }
        setCheckingExisting(false)
      })
      .catch(() => {
        if (cancelled) return
        setCheckingExisting(false)
        setCheckFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [navigate, checkAttempt])
  // Not part of WizardData: that gets JSON-stringified into localStorage on
  // every change, which a raw File wouldn't survive. A reload mid-wizard
  // means re-picking the photo - an acceptable tradeoff for not having to
  // work around that.
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null>(null)
  const heroPhotoPreviewUrl = useMemo(
    () => (heroPhotoFile ? URL.createObjectURL(heroPhotoFile) : null),
    [heroPhotoFile],
  )
  useEffect(() => {
    return () => {
      if (heroPhotoPreviewUrl) URL.revokeObjectURL(heroPhotoPreviewUrl)
    }
  }, [heroPhotoPreviewUrl])

  useEffect(() => {
    if (!couple) return
    saveWizardData(couple.id, data)
  }, [couple, data])

  if (!couple || checkingExisting) return <AppLoader />

  if (checkFailed) {
    return (
      <div className="wizard-page">
        <div className="wizard-card wizard-card--error">
          <p className="wizard-step__title">לא הצלחנו לטעון את הנתונים שלכם</p>
          <p className="wizard-step__sub">בדקו את החיבור לאינטרנט ונסו שוב.</p>
          <div className="wizard-error-actions">
            <button
              type="button"
              className="wizard-continue-btn"
              onClick={() => setCheckAttempt((n) => n + 1)}
            >
              נסו שוב
            </button>
            <button type="button" className="wizard-back-link" onClick={logout}>
              התנתקות
            </button>
          </div>
        </div>
      </div>
    )
  }

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
      const wedding = await weddingApi.create({
        coupleNameA: data.coupleNameA.trim(),
        coupleNameB: data.coupleNameB.trim(),
        date: data.date,
        venue: data.venue.trim(),
        slug: data.slug,
        guestPageConfig: {
          theme: data.theme,
          accentColor: data.accentColor ?? undefined,
          welcomeMessage: data.welcomeMessage.trim() || undefined,
          ceremonyTime: data.ceremonyTime || undefined,
          rsvpDeadline: data.rsvpDeadline || undefined,
          dressCode: data.dressCode.trim() || undefined,
          contactPhone: data.contactPhone.replace(/[\s-]/g, '') || undefined,
        },
      })

      // The photo can only be uploaded once the wedding (and its
      // guest-page-config row) exists - a failure here shouldn't block
      // getting into the dashboard, since everything else was created fine.
      if (heroPhotoFile) {
        try {
          const resized = await resizeImage(heroPhotoFile, 960)
          await weddingApi.uploadHeroPhoto(wedding.id, resized)
        } catch {
          // Swallowed on purpose - the couple can retry from Settings.
        }
      }

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
        <div className="wizard-topbar">
          <span className="wizard-topbar__logo">שמחה</span>
          <button type="button" className="wizard-logout-link" onClick={logout}>
            התנתקות
          </button>
        </div>

        <Stepper current={data.step} total={WIZARD_STEP_COUNT} />

        {data.step === 1 && <StepBasics data={data} errors={errors} onChange={updateData} />}
        {data.step === 2 && (
          <StepGuestPage
            data={data}
            onChange={updateData}
            heroPhotoFile={heroPhotoFile}
            heroPhotoPreviewUrl={heroPhotoPreviewUrl}
            onPhotoChange={setHeroPhotoFile}
          />
        )}
        {data.step === 3 && <StepEventDetails data={data} errors={errors} onChange={updateData} />}
        {data.step === 4 && <StepReview data={data} heroPhotoFile={heroPhotoFile} />}

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
