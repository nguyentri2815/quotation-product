import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles.css'

async function start() {
  // This entire app is a demo: MSW runs in both dev and built preview.
  const { worker } = await import('./mocks/browser')
  await worker.start({ quiet: true, onUnhandledFrame: 'bypass' })
  const { router } = await import('./App')
  const root = document.getElementById('root')
  if (!root) throw new Error('Không tìm thấy vùng hiển thị ứng dụng.')
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

start().catch((error: unknown) => {
  console.error('Không khởi động được preview:', error)
  const root = document.getElementById('root')
  if (root) {
    root.replaceChildren()
    const message = document.createElement('p')
    message.className = 'startup-error'
    message.textContent =
      'Không khởi động được API giả lập. Hãy cho phép Service Worker, dùng localhost và tải lại trang.'
    const retry = document.createElement('button')
    retry.textContent = 'Tải lại trang'
    retry.onclick = () => window.location.reload()
    root.append(message, retry)
  }
})
