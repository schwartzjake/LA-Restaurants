// pages/_app.js
import Head from 'next/head'
import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.png" />
      </Head>
     <Analytics />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
