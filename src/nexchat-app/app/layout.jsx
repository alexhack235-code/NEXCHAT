import './globals.css';

export const metadata = {
  title: 'NEXCHAT — Chat Beyond',
  description: 'Next-gen secure messaging app with a built-in Hacker Terminal. End-to-End Encrypted messaging and live CLI control.',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@500;700;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[#0A0E13] text-[#F8FAFC] antialiased overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
