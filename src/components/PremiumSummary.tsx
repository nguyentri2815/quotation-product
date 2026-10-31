import type { Premium } from '../quotation/types'
import { formatMoney } from '../quotation/format'
import { Icon } from './Icon'
import styles from './ui.module.css'

export function PremiumSummary({
  premium,
  stale = false,
}: {
  premium: Premium | null
  stale?: boolean
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
            <dl className={styles.premiumRows}>
              <div>
                <dt>Thời hạn bảo hiểm</dt>
                <dd>{premium.days} ngày</dd>
              </div>
              <div>
                <dt>Tỷ lệ phí năm</dt>
                <dd>0,1%</dd>
              </div>
              <div>
                <dt>Phí trước thuế</dt>
                <dd>{formatMoney(premium.net)}</dd>
              </div>
              <div>
                <dt>Thuế (10%)</dt>
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
                <dd>0,1%</dd>
              </div>
              <div>
                <dt>Thuế suất</dt>
                <dd>10%</dd>
              </div>
            </dl>
            <div className={stale ? styles.stale : styles.calculationEmpty}>
              <Icon name={stale ? 'info' : 'file'} size={28} />
              <strong>{stale ? 'Cần tính lại phí' : 'Chưa có kết quả phí'}</strong>
              <p>
                {stale
                  ? 'Số tiền hoặc thời hạn đã thay đổi. Vui lòng tính lại phí trước khi lưu.'
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
