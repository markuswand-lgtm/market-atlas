import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Market Atlas · Multi-Asset Research',description:'Historische Märkte, Geldmengen und Kaufkraft analysieren. Trends, Zykluskarte und nachvollziehbare Strategietests.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>;}
