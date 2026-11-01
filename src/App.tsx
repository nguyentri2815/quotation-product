import { useEffect } from 'react'
import { createBrowserRouter, Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { QuotationList } from './pages/QuotationList'
import { QuotationEntry, SelectProduct } from './pages/SelectProduct'
import { QuotationDetail } from './pages/QuotationDetail'
import { Icon } from './components/Icon'
import styles from './components/ui.module.css'

function Layout() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const title = location.pathname.endsWith('/new')
      ? 'Tạo bản chào'
      : location.pathname === '/quotations'
        ? 'Bản chào bảo hiểm'
        : 'Chi tiết bản chào'
    document.title = `${title} · Quotation`
    requestAnimationFrame(() => document.querySelector<HTMLElement>('main')?.focus())
  }, [location.pathname])
  return (
    <div className={styles.app}>
      <a className={styles.skipLink} href="#main">
        Đến nội dung chính
      </a>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} to="/quotations">
          <span className={styles.brandMark}>
            <Icon name="shield" size={26} />
          </span>
          <div>
            Quotation<small>BẢO HIỂM TÀI SẢN</small>
          </div>
        </Link>
        <p className={styles.navCaption}>KHÔNG GIAN LÀM VIỆC</p>
        <nav aria-label="Điều hướng chính">
          <NavLink to="/quotations" className={styles.navItem}>
            <Icon name="file" size={20} />
            <span>Bản chào bảo hiểm</span>
          </NavLink>
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.versionDot} />
          Dữ liệu mô phỏng
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <span className={styles.breadcrumb}>
            Nghiệp vụ <span>/</span> <strong>Bản chào bảo hiểm</strong>
          </span>
          <span className={styles.demoBadge}>
            <span />
            Dữ liệu mô phỏng
          </span>
        </header>
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          Quotation <span>·</span> Không gian tạo bản chào bảo hiểm tài sản
        </footer>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className={styles.empty}>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại trong preview.</p>
      <Link className={styles.primaryButton} to="/quotations">
        Về danh sách
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/quotations" replace /> },
      { path: '/quotations', element: <QuotationList /> },
      { path: '/products', element: <SelectProduct /> },
      { path: '/quotations/new', element: <QuotationEntry /> },
      { path: '/quotations/:id', element: <QuotationDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
