import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError, quotationsApi } from '../api/quotations'
import type { Quotation } from '../quotation/types'
import { formatDate, formatDateTime, formatMoney } from '../quotation/format'
import { AsyncMessage } from '../components/AsyncMessage'
import { FixedInformation } from '../components/FixedInformation'
import { PremiumSummary } from '../components/PremiumSummary'
import { Icon } from '../components/Icon'
import styles from '../components/ui.module.css'

export function QuotationDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setNotFound(false)
    quotationsApi
      .get(id ?? '')
      .then((data) => {
        if (active) setQuotation(data)
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Không tải được bản chào.')
          setNotFound(reason instanceof ApiError && reason.status === 404)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, attempt])

  return (
    <>
      <Link className={styles.backLink} to="/quotations">
        <Icon name="back" size={17} />
        Về danh sách
      </Link>
      <AsyncMessage loading={loading} error={error} retry={() => setAttempt(attempt + 1)} />
      {notFound && (
        <p className={styles.subtitle}>
          Bản chào có thể nằm trên trình duyệt hoặc địa chỉ preview khác.
        </p>
      )}
      {!loading && !error && quotation && (
        <>
          {location.state &&
            typeof location.state === 'object' &&
            'created' in location.state &&
            location.state.created === true && (
              <p className={styles.successBanner} role="status">
                <Icon name="check" size={18} />
                Đã lưu bản chào thành công.
              </p>
            )}
          <div className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>CHI TIẾT BẢN CHÀO</p>
              <h1>{quotation.number}</h1>
              <p className={styles.subtitle}>
                Ngày tạo: {formatDateTime(quotation.createdAt)}{' '}
                <span className={styles.status}>
                  <span />
                  Đã tạo
                </span>
              </p>
            </div>
            <Link className={styles.primaryButton} to="/quotations/new">
              <Icon name="plus" size={18} />
              Tạo bản chào mới
            </Link>
          </div>
          <FixedInformation productName={`${quotation.productSnapshot.name} · v${quotation.productVersion}`} />
          <div className={styles.formLayout}>
            <div className={styles.formSections}>
              <section className={styles.card} aria-labelledby="detail-customer">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>01</span>
                  <h2 id="detail-customer">Thông tin khách hàng</h2>
                </div>
                <dl className={styles.details}>
                  <div className={styles.wideField}>
                    <dt>Tên khách hàng</dt>
                    <dd>{quotation.customer.name}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{quotation.customer.phone || 'Không cung cấp'}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{quotation.customer.email || 'Không cung cấp'}</dd>
                  </div>
                </dl>
              </section>
              <section className={styles.card} aria-labelledby="detail-asset">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>02</span>
                  <h2 id="detail-asset">Thông tin tài sản</h2>
                </div>
                <dl className={styles.details}>
                  <div className={styles.wideField}>
                    <dt>Tên/mô tả tài sản</dt>
                    <dd>{quotation.asset.name}</dd>
                  </div>
                  <div className={styles.wideField}>
                    <dt>Địa chỉ tài sản</dt>
                    <dd>{quotation.asset.address}</dd>
                  </div>
                  <div className={styles.wideField}>
                    <dt>Số tiền bảo hiểm</dt>
                    <dd className={styles.insuredAmount}>
                      {formatMoney(quotation.asset.sumInsured)}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className={styles.card} aria-labelledby="detail-period">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>03</span>
                  <h2 id="detail-period">Thời hạn bảo hiểm</h2>
                </div>
                <dl className={styles.details}>
                  <div>
                    <dt>Ngày bắt đầu</dt>
                    <dd>{formatDate(quotation.period.startDate)}</dd>
                  </div>
                  <div>
                    <dt>Ngày kết thúc</dt>
                    <dd>{formatDate(quotation.period.endDate)}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <aside className={styles.premiumAside}>
              <PremiumSummary premium={quotation.premium} />
              <div className={styles.disclaimer}>
                <Icon name="info" size={18} />
                <p>Bản chào chưa phải hợp đồng bảo hiểm.</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
