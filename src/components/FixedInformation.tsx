import styles from './ui.module.css'

export function FixedInformation({ productName = 'Tài sản cơ bản' }: { productName?: string }) {
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
        <dd>{productName}</dd>
      </div>
      <div>
        <dt>Tiền tệ</dt>
        <dd>VND</dd>
      </div>
    </dl>
  )
}
