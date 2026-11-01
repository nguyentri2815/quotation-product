import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { propertyProducts } from '../quotation/products'
import { CreateQuotation } from './CreateQuotation'
import styles from '../components/ui.module.css'
export function SelectProduct() {
  return <><div className={styles.pageHeading}><div><p className={styles.eyebrow}>BẢN CHÀO MỚI</p><h1>Chọn sản phẩm</h1><p className={styles.subtitle}>Chọn sản phẩm phù hợp để bắt đầu bản chào tài sản.</p></div></div><div className={styles.productGrid}>{propertyProducts.map(product => <article key={product.code} className={styles.card}><h2>{product.name}</h2><p>{product.description}</p><Link className={styles.primaryButton} to={`/quotations/new?product=${product.code}`}>Tạo bản chào <span className={styles.srOnly}>{product.name}</span></Link></article>)}</div></>
}
export function QuotationEntry() {
  const [query] = useSearchParams(); const code = query.get('product')
  if (!code) return <Navigate to="/products" replace />
  const product = propertyProducts.find(item => item.code === code)
  if (!product) return <section role="alert"><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm trong đường dẫn không được hỗ trợ.</p><Link to="/products">Chọn sản phẩm</Link></section>
  return <CreateQuotation initialCode={product.code} />
}
