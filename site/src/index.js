import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { ThemeProvider } from 'styled-components';
import { MeetingProvider, lightTheme } from 'amazon-chime-sdk-component-library-react';

ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={lightTheme}>
            <MeetingProvider>
                <App />
            </MeetingProvider>
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
