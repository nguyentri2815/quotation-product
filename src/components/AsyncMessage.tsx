import styles from './ui.module.css'

export function AsyncMessage({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => void
}) {
  if (loading)
    return (
      <div className={styles.loading} role="status">
        <span className={styles.spinner} /> Đang tải bản chào…
      </div>
    )
  if (error)
    return (
      <div className={styles.errorBox} role="alert">
        <p>{error}</p>
        <button className={styles.secondaryButton} onClick={retry}>
          Thử lại
        </button>
      </div>
    )
  return null
}
