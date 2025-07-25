import Head from 'next/head'
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        {/* PNG alternative: */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" /> */}
        {/* Apple touch icon: */}
        {/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
      </Head>
      <Component {...pageProps} />
    </>
  )
}
