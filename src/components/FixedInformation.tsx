import styles from './ui.module.css'

export function FixedInformation() {
  return (
    <dl className={styles.fixedInfo}>
      <div>
        <dt>Loại bản chào</dt>
        <dd>
          Thông thường <span>Normal</span>
        </dd>
      </div>
      <div>
        <dt>Nghiệp vụ</dt>
        <dd>Tài sản</dd>
      </div>
      <div>
        <dt>Sản phẩm</dt>
        <dd>Tài sản cơ bản</dd>
      </div>
      <div>
        <dt>Tiền tệ</dt>
        <dd>VND</dd>
      </div>
    </dl>
  )
}
