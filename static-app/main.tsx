import React from 'react';
import {createRoot} from 'react-dom/client';
import Atlas from '../app/atlas';
import LoginGate from '../components/login';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><LoginGate><Atlas/></LoginGate></React.StrictMode>);
