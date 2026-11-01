import type { Premium, CalculatedPremium } from '../quotation/types'
import { formatMoney, formatRate } from '../quotation/format'
import { Icon } from './Icon'
import styles from './ui.module.css'

export function PremiumSummary({
  premium,
  stale = false,
  annualRate = 0.001,
  taxRate = 0.1,
}: {
  premium: Premium | CalculatedPremium | null
  stale?: boolean
  annualRate?: number
  taxRate?: number
}) {
  return (
    <section className={`${styles.card} ${styles.premiumCard}`} aria-labelledby="premium-heading">
      <div className={styles.cardHeading}>
        <span className={styles.iconTile}>
          <Icon name="file" />
        </span>
        <h2 id="premium-heading">Kết quả phí</h2>
      </div>
      <div className={styles.premiumBody} aria-live="polite">
        {premium ? (
          <>
            <span className={styles.calculated}>
              <Icon name="check" size={15} /> Đã tính phí
            </span>
            {'productCode' in premium && <p data-priced-product={premium.productCode}>{premium.productName} · {premium.productCode} / v{premium.productVersion}<br />{premium.inputs.startDate} → {premium.inputs.endDate} · {formatMoney(Number(premium.inputs.sumInsured))}</p>}
            <dl className={styles.premiumRows}>
              <div>
                <dt>Thời hạn bảo hiểm</dt>
                <dd>{premium.days} ngày</dd>
              </div>
              <div>
                <dt>Tỷ lệ phí năm</dt>
                <dd>{formatRate(premium.annualRate)}</dd>
              </div>
              <div>
                <dt>Phí trước thuế</dt>
                <dd>{formatMoney(premium.net)}</dd>
              </div>
              <div>
                <dt>Thuế ({formatRate(premium.taxRate)})</dt>
                <dd>{formatMoney(premium.tax)}</dd>
              </div>
            </dl>
            <div className={styles.total}>
              <span>Tổng phí bảo hiểm</span>
              <strong>{formatMoney(premium.total)}</strong>
            </div>
            <div className={styles.installment}>
              <Icon name="check" size={17} />
              <div>
                <span>Thanh toán một kỳ</span>
                <strong>{formatMoney(premium.installmentAmount)}</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <dl className={styles.premiumRows}>
              <div>
                <dt>Tỷ lệ phí năm</dt>
                <dd>{formatRate(annualRate)}</dd>
              </div>
              <div>
                <dt>Thuế suất</dt>
                <dd>{formatRate(taxRate)}</dd>
              </div>
            </dl>
            <div className={stale ? styles.stale : styles.calculationEmpty}>
              <Icon name={stale ? 'info' : 'file'} size={28} />
              <strong>{stale ? 'Cần tính lại phí' : 'Chưa có kết quả phí'}</strong>
              <p>
                {stale
                  ? 'Sản phẩm, số tiền hoặc thời hạn đã thay đổi. Vui lòng tính lại phí trước khi lưu.'
                  : 'Nhập thông tin và chọn “Tính phí” để xem tổng phí bảo hiểm.'}
              </p>
            </div>
          </>
        )}
        <p className={styles.formulaNote}>
          Phí được tính theo số ngày thực tế trên cơ sở 365 ngày/năm.
        </p>
      </div>
    </section>
  )
}
