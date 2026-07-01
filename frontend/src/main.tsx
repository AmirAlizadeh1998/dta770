import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {LoadingProvider} from "./components/LoadingComponent.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LoadingProvider>
            <App />
        </LoadingProvider>
    </React.StrictMode>,
)