import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        {children}

        <Script
          id="monetag"
          strategy="afterInteractive"
        >
          {`
            (function(s){
              s.dataset.zone='11026170',
              s.src='https://nap5k.com/tag.min.js'
            })(
              [document.documentElement, document.body]
              .filter(Boolean)
              .pop()
              .appendChild(document.createElement('script'))
            )
          `}
        </Script>

      </body>
    </html>
  );
}