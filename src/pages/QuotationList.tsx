import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { quotationsApi } from '../api/quotations'
import type { Quotation } from '../quotation/types'
import { formatDateTime, formatMoney } from '../quotation/format'
import { AsyncMessage } from '../components/AsyncMessage'
import { Icon } from '../components/Icon'
import styles from '../components/ui.module.css'

export function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skipped, setSkipped] = useState(0)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    quotationsApi
      .listResult()
      .then((data) => {
        if (active) { setQuotations(data.quotations); setSkipped(data.skipped) }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không tải được danh sách.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt])

  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>QUẢN LÝ BẢN CHÀO</p>
          <h1>Bản chào bảo hiểm</h1>
          <p className={styles.subtitle}>Tạo và theo dõi bản chào bảo hiểm tài sản của bạn.</p>
        </div>
        <Link className={styles.primaryButton} to="/products">
          <Icon name="plus" size={19} />
          Tạo bản chào
        </Link>
      </div>
      <section className={styles.card} aria-labelledby="list-heading">
        <div className={styles.cardHeading}>
          <Icon name="file" />
          <h2 id="list-heading">Danh sách bản chào</h2>
          {!loading && !error && <span className={styles.count}>{quotations.length}</span>}
          <span className={styles.cardHint}>Tài sản · Normal</span>
        </div>
        <AsyncMessage loading={loading} error={error} retry={() => setAttempt(attempt + 1)} />
        {!loading && !error && skipped > 0 && <p role="status" className={styles.errorBox}>Có {skipped} bản chào không đọc được. Các bản hợp lệ vẫn hiển thị; dữ liệu gốc được giữ nguyên.</p>}
        {!loading &&
          !error &&
          (quotations.length ? (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Số bản chào</th>
                    <th scope="col">Khách hàng</th>
                    <th scope="col">Tài sản</th>
                    <th scope="col" className={styles.numeric}>
                      Tổng phí
                    </th>
                    <th scope="col">Ngày tạo</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Chi tiết</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation) => (
                    <tr
                      key={quotation.id}
                      onClick={(event) => {
                        if (!(event.target instanceof Element) || event.target.closest('a')) return
                        event.currentTarget.querySelector('a')?.click()
                      }}
                    >
                      <td>
                        <Link className={styles.numberLink} to={`/quotations/${quotation.id}`}>
                          {quotation.number}
                        </Link>
                        <span className={styles.cellSub}>{quotation.productSnapshot.name} · v{quotation.productVersion}</span>
                      </td>
                      <td className={styles.customerCell}>{quotation.customer.name}</td>
                      <td>{quotation.asset.name}</td>
                      <td className={`${styles.numeric} ${styles.money}`}>
                        {formatMoney(quotation.premium.total)}
                      </td>
                      <td className={styles.dateCell}>{formatDateTime(quotation.createdAt)}</td>
                      <td>
                        <Icon name="arrow" size={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Icon name="file" size={32} />
              </span>
              <h3>Chưa có bản chào nào</h3>
              <p>Tạo bản chào đầu tiên cho khách hàng và tài sản của bạn.</p>
              <Link className={styles.primaryButton} to="/products">
                <Icon name="plus" size={18} />
                Tạo bản chào
              </Link>
            </div>
          ))}
        {!loading && !error && quotations.length > 0 && (
          <div className={styles.tableFooter}>
            Chọn một bản chào để xem thông tin và kết quả phí đã lưu.
          </div>
        )}
      </section>
      <p className={styles.listNote}>
        <Icon name="info" size={16} />
        Dữ liệu demo được lưu riêng trên trình duyệt và địa chỉ preview này.
      </p>
    </>
  )
}
