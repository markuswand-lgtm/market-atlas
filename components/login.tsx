import {useEffect,useState,type ReactNode,type FormEvent} from 'react';
import {createUserWithEmailAndPassword,onIdTokenChanged,reload,sendEmailVerification,sendPasswordResetEmail,setPersistence,browserSessionPersistence,signInWithEmailAndPassword,signOut,type User} from 'firebase/auth';
import {ChartNoAxesCombined,LockKeyhole,LogOut} from 'lucide-react';
import {AUTH_ENABLED,browserAuth} from '../lib/browser-auth';

function messageFor(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found')return 'Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.';
 if(code==='auth/weak-password'||code==='auth/password-does-not-meet-requirements')return 'Bitte ein stärkeres Passwort verwenden (mindestens 12 Zeichen).';
 if(code==='auth/email-already-in-use')return 'Registrierung nicht möglich. Bitte anmelden oder das Passwort zurücksetzen.';
 if(code==='auth/too-many-requests')return 'Zu viele Versuche. Bitte etwas warten und erneut versuchen.';
 if(code==='auth/network-request-failed')return 'Der Anmeldedienst ist nicht erreichbar. Bitte die Verbindung prüfen.';
 return 'Der Vorgang konnte nicht abgeschlossen werden. Bitte später erneut versuchen.';
}
export default function LoginGate({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(!AUTH_ENABLED),[mode,setMode]=useState<'login'|'register'|'reset'>('login');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!AUTH_ENABLED)return;return onIdTokenChanged(browserAuth(),u=>{setUser(u);setReady(true);},()=>{setError('Anmeldung derzeit nicht erreichbar.');setReady(true);});},[]);
 if(!AUTH_ENABLED)return children;
 async function action(run:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await run();}catch(e){setError(messageFor(e));}finally{setBusy(false);}}
 async function submit(e:FormEvent){e.preventDefault();if(mode==='register'&&(password.length<12||password!==repeat)){setError(password.length<12?'Bitte mindestens 12 Zeichen verwenden.':'Die Passwörter stimmen nicht überein.');return;}
  await action(async()=>{const auth=browserAuth();await setPersistence(auth,browserSessionPersistence);
   if(mode==='reset'){await sendPasswordResetEmail(auth,email);setNotice('Falls für diese Adresse ein Konto besteht, erhältst du eine E-Mail zum Zurücksetzen.');return;}
   if(mode==='register'){const result=await createUserWithEmailAndPassword(auth,email,password);setPassword('');setRepeat('');await sendEmailVerification(result.user);setNotice('Bitte bestätige deine E-Mail-Adresse über den zugesandten Link.');}
   else{await signInWithEmailAndPassword(auth,email,password);setPassword('');}
  });
 }
 if(ready&&user?.emailVerified)return <div key={user.uid}>{children}</div>;
 return <main className="login-page"><section className="login-card"><a className="brand" href="./"><span className="brand-mark"><ChartNoAxesCombined size={25}/></span><span>market<span className="brand-light">atlas</span><small>DEIN RESEARCH-ARBEITSPLATZ</small></span></a><div className="login-icon"><LockKeyhole size={27}/></div>
 {!ready?<p role="status">Anmeldung wird geprüft …</p>:user?<><h1>E-Mail bestätigen</h1><p>Wir schützen deinen Zugang mit einer bestätigten E-Mail-Adresse. Öffne den Bestätigungslink für <b>{user.email}</b>.</p><button className="primary-button full" disabled={busy} onClick={()=>action(async()=>{await reload(user);await user.getIdToken(true);if(user.emailVerified)window.location.reload();else setNotice('Noch nicht bestätigt. Bitte den Link in deiner E-Mail öffnen.');})}>Ich habe meine E-Mail bestätigt</button><button className="quiet-button" disabled={busy} onClick={()=>action(async()=>{await sendEmailVerification(user);setNotice('Bestätigungs-E-Mail wurde angefordert. Bitte auch im Spamordner prüfen.');})}>Bestätigungslink erneut senden</button><button className="quiet-button" disabled={busy} onClick={()=>action(async()=>{await signOut(browserAuth());})}><LogOut size={15}/> Mit anderem Konto anmelden</button></>:<><h1>{mode==='register'?'Konto erstellen':mode==='reset'?'Passwort vergessen?':'Willkommen zurück.'}</h1><p>{mode==='register'?'Jeder kann sich registrieren. Nach Bestätigung deiner E-Mail-Adresse steht dir der Research-Arbeitsplatz zur Verfügung.':mode==='reset'?'Du erhältst einen Link, mit dem du ein neues Passwort festlegen kannst.':'Melde dich an, um Märkte, Geldmengen und Staatsschulden zu vergleichen.'}</p><form onSubmit={submit}><label>E-Mail-Adresse<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>{mode!=='reset'&&<label>Passwort<input type="password" autoComplete={mode==='register'?'new-password':'current-password'} required minLength={mode==='register'?12:undefined} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>}{mode==='register'&&<label>Passwort wiederholen<input type="password" autoComplete="new-password" required minLength={12} value={repeat} onChange={e=>setRepeat(e.target.value)} disabled={busy}/><small>Mindestens 12 Zeichen; verwende ein eigenes Passwort für diese App.</small></label>}<button className="primary-button full" type="submit" disabled={busy}>{busy?'Bitte warten …':mode==='register'?'Registrieren':mode==='reset'?'Link anfordern':'Anmelden'}</button></form><div className="login-links">{(['login','register','reset'] as const).filter(m=>m!==mode).map(m=><button key={m} disabled={busy} onClick={()=>{setMode(m);setError('');setNotice('');setPassword('');setRepeat('');}}>{m==='login'?'Zur Anmeldung':m==='register'?'Neues Konto erstellen':'Passwort vergessen'}</button>)}</div></>}
 {error&&<p className="notice warning" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}<p className="login-note">Eigenständiges Market-Atlas-Konto · keine ChatGPT-Anmeldung. Die Sitzung endet beim Schließen des Tabs. Anmeldung und E-Mail-Versand über Firebase Authentication.</p></section></main>;
}
