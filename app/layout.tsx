import type { Metadata } from 'next';
import { Shippori_Mincho, Noto_Sans_JP, Space_Mono } from 'next/font/google';
import './globals.css';

const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-shippori-mincho',
  display: 'swap',
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI論壇',
  description: '複数のAIに議題を討論させ、討論ログをnote記事のドラフトに変換するWebアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${shipporiMincho.variable} ${notoSansJp.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
