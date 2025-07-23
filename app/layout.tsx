import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Nathan Kaffes',
  description: 'Nathan Kaffes Portfolio',
}

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }