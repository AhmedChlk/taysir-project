import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="fr">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1>404</h1>
          <p>Page non trouvée / الصفحة غير موجودة</p>
          <Link href="/" style={{ color: '#0F515C', fontWeight: 'bold' }}>Retour à l&apos;accueil / العودة للرئيسية</Link>
        </div>
      </body>
    </html>
  );
}
