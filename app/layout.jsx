import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'QuickBasket - 10-Minute Instant Grocery Delivery',
  description: 'Farm fresh fruits, vegetables, dairy, snacks, beverages and daily essentials delivered to your doorstep in 10 minutes.',
  keywords: 'grocery delivery, 10 minute delivery, zepto, blinkit, quickbasket, fresh fruits, vegetables, dairy, snacks',
  icons: {
    icon: '/favicon.ico'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c831f'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
