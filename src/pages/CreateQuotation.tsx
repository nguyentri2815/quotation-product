import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link, useBlocker, useNavigate } from 'react-router-dom'
import { ApiError, quotationsApi } from '../api/quotations'
import {
  calculatePremium,
  pricingInputsChanged,
  validateAndBuildInput,
  validateDraft,
} from '../quotation/rules'
import type { FieldErrors, Premium, QuotationDraft } from '../quotation/types'
import { emptyDraft, sampleDraft } from '../quotation/types'
import { formatMoney } from '../quotation/format'
import { FixedInformation } from '../components/FixedInformation'
import { PremiumSummary } from '../components/PremiumSummary'
import { Icon } from '../components/Icon'
import styles from '../components/ui.module.css'

function Field({
  id,
  label,
  optional,
  error,
  hint,
  wide,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  error?: string
  hint?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={wide ? styles.wideField : styles.field}>
      <label htmlFor={id}>
        {label}{' '}
        {optional ? (
          <span className={styles.optional}>(không bắt buộc)</span>
        ) : (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.fieldError} id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}

export function CreateQuotation() {
  const [draft, setDraft] = useState<QuotationDraft>({ ...emptyDraft })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [premium, setPremium] = useState<Premium | null>(null)
  const [calculatedBefore, setCalculatedBefore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const saveInFlight = useRef(false)
  const allowLeave = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const dirty = Object.keys(emptyDraft).some((key) => draft[key as keyof QuotationDraft] !== '')
  const blocker = useBlocker(() => dirty && !allowLeave.current)

  useEffect(() => {
    const preventUnload = (event: BeforeUnloadEvent) => {
      if (dirty && !allowLeave.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', preventUnload)
    return () => window.removeEventListener('beforeunload', preventUnload)
  }, [dirty])

  useEffect(() => {
    if (blocker.state === 'blocked' && !dialogRef.current?.open) dialogRef.current?.showModal()
    else if (blocker.state !== 'blocked') dialogRef.current?.close()
  }, [blocker.state])

  function updateDraft(next: QuotationDraft) {
    if (pricingInputsChanged(draft, next)) setPremium(null)
    setDraft(next)
    setMessage('')
    setNotice('')
  }

  function inputProps(key: keyof QuotationDraft) {
    return {
      id: key,
      name: key,
      value: draft[key],
      'aria-invalid': Boolean(errors[key]),
      'aria-describedby':
        [key === 'sumInsured' ? `${key}-hint` : '', errors[key] ? `${key}-error` : '']
          .filter(Boolean)
          .join(' ') || undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateDraft({ ...draft, [key]: event.target.value })
        setErrors((previous) => ({ ...previous, [key]: undefined }))
      },
      onBlur: () => setErrors((previous) => ({ ...previous, [key]: validateDraft(draft)[key] })),
    }
  }

  function validatedInput() {
    const result = validateAndBuildInput(draft)
    if (!result.success) {
      setErrors(result.errors)
      setMessage(result.message)
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      )
      return null
    }
    setErrors({})
    setMessage('')
    return result.data
  }

  function calculate() {
    const input = validatedInput()
    if (!input) return
    setPremium(
      calculatePremium(input.asset.sumInsured, input.period.startDate, input.period.endDate),
    )
    setCalculatedBefore(true)
    setNotice('Đã tính phí. Bạn có thể lưu bản chào.')
  }

  async function save() {
    if (saveInFlight.current) return
    const input = validatedInput()
    if (!input) return
    if (!premium) {
      setMessage('Vui lòng tính phí với số tiền và thời hạn hiện tại trước khi lưu.')
      return
    }
    saveInFlight.current = true
    setSaving(true)
    setNotice('')
    try {
      const quotation = await quotationsApi.create(input)
      allowLeave.current = true
      await navigate(`/quotations/${quotation.id}`, { replace: true, state: { created: true } })
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Chưa lưu được bản chào. Vui lòng thử lại.',
      )
      if (error instanceof ApiError) setErrors(error.errors)
      saveInFlight.current = false
      setSaving(false)
    }
  }

  return (
    <>
      <Link className={styles.backLink} to="/quotations">
        <Icon name="back" size={17} />
        Danh sách bản chào
      </Link>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>BẢN CHÀO MỚI</p>
          <h1>Tạo bản chào bảo hiểm</h1>
          <p className={styles.subtitle}>
            Nhập thông tin khách hàng và tài sản để tính phí, tạo bản chào.
          </p>
        </div>
      </div>
      <FixedInformation />
      <form
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
        aria-busy={saving}
      >
        <fieldset className={styles.formFieldset} disabled={saving}>
          <legend className={styles.srOnly}>Thông tin tạo bản chào</legend>
          <div className={styles.formLayout}>
            <div className={styles.formSections}>
              <section className={styles.card} aria-labelledby="customer-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>01</span>
                  <h2 id="customer-heading">Thông tin khách hàng</h2>
                  <span className={styles.cardHint}>* Bắt buộc</span>
                </div>
                <div className={styles.fields}>
                  <Field id="customerName" label="Tên khách hàng" error={errors.customerName} wide>
                    <input
                      {...inputProps('customerName')}
                      required
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Nhập tên cá nhân hoặc tổ chức"
                    />
                  </Field>
                  <Field id="phone" label="Điện thoại" optional error={errors.phone}>
                    <input
                      {...inputProps('phone')}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Ví dụ: 0901234567"
                    />
                  </Field>
                  <Field id="email" label="Email" optional error={errors.email}>
                    <input
                      {...inputProps('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="ten@example.com"
                    />
                  </Field>
                </div>
              </section>
              <section className={styles.card} aria-labelledby="asset-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>02</span>
                  <h2 id="asset-heading">Thông tin tài sản</h2>
                </div>
                <div className={styles.fields}>
                  <Field id="assetName" label="Tên/mô tả tài sản" error={errors.assetName} wide>
                    <input
                      {...inputProps('assetName')}
                      required
                      maxLength={200}
                      placeholder="Ví dụ: Kho hàng, văn phòng…"
                    />
                  </Field>
                  <Field id="address" label="Địa chỉ tài sản" error={errors.address} wide>
                    <textarea
                      {...inputProps('address')}
                      required
                      rows={2}
                      maxLength={300}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                    />
                  </Field>
                  <Field
                    id="sumInsured"
                    label="Số tiền bảo hiểm"
                    error={errors.sumInsured}
                    hint={
                      /^\d+$/.test(draft.sumInsured) &&
                      Number.isSafeInteger(Number(draft.sumInsured))
                        ? formatMoney(Number(draft.sumInsured))
                        : 'Từ 1.000.000 đến 100.000.000.000 VND.'
                    }
                    wide
                  >
                    <div className={styles.inputWithUnit}>
                      <input
                        {...inputProps('sumInsured')}
                        required
                        inputMode="numeric"
                        placeholder="Ví dụ: 1000000000"
                      />
                      <span aria-hidden="true">VND</span>
                    </div>
                  </Field>
                </div>
              </section>
              <section className={styles.card} aria-labelledby="period-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>03</span>
                  <h2 id="period-heading">Thời hạn bảo hiểm</h2>
                  <span className={styles.cardHint}>Tối đa 365 ngày</span>
                </div>
                <div className={styles.fields}>
                  <Field id="startDate" label="Ngày bắt đầu" error={errors.startDate}>
                    <input {...inputProps('startDate')} type="date" required />
                  </Field>
                  <Field id="endDate" label="Ngày kết thúc" error={errors.endDate}>
                    <input {...inputProps('endDate')} type="date" required />
                  </Field>
                </div>
              </section>
            </div>
            <aside className={styles.premiumAside}>
              <PremiumSummary premium={premium} stale={calculatedBefore && !premium} />
              <div className={styles.sampleCard}>
                <Icon name="spark" />
                <div>
                  <strong>Thử nhanh với dữ liệu mẫu</strong>
                  <p>Điền sẵn một khách hàng, một tài sản và thời hạn 365 ngày.</p>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      updateDraft(sampleDraft())
                      setErrors({})
                      setNotice('Đã điền dữ liệu mẫu. Chọn Tính phí để tiếp tục.')
                    }}
                  >
                    Điền dữ liệu mẫu <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
          {message && (
            <div className={styles.errorBox} role="alert">
              {message}
            </div>
          )}
          <p className={styles.liveNotice} role="status">
            {notice}
          </p>
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void navigate('/quotations')}
            >
              Hủy
            </button>
            <div className={styles.actionGroup}>
              <button type="button" className={styles.secondaryButton} onClick={calculate}>
                Tính phí
              </button>
              <button type="submit" className={styles.primaryButton} disabled={saving || !premium}>
                {saving ? (
                  <>
                    <span className={styles.spinner} />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Icon name="check" size={18} />
                    Lưu bản chào
                  </>
                )}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="discard-title"
        aria-describedby="discard-description"
        onCancel={(event) => {
          event.preventDefault()
          if (blocker.state === 'blocked') blocker.reset()
        }}
      >
        <h2 id="discard-title">Bỏ dữ liệu chưa lưu?</h2>
        <p id="discard-description">
          Thông tin bạn đã nhập chưa được lưu. Nếu rời trang, bạn sẽ mất những thay đổi này.
        </p>
        <div className={styles.dialogActions}>
          <button
            className={styles.secondaryButton}
            autoFocus
            onClick={() => {
              if (blocker.state === 'blocked') blocker.reset()
            }}
          >
            Tiếp tục nhập
          </button>
          <button
            className={styles.dangerButton}
            onClick={() => {
              if (blocker.state === 'blocked') blocker.proceed()
            }}
          >
            Bỏ dữ liệu
          </button>
        </div>
      </dialog>
    </>
  )
}
