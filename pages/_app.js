// pages/_app.js
import Head from 'next/head'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        {/* you can add PNG or Apple touch icons here too */}
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
