import '@mantine/core/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/globals.css';

import type { AppProps } from 'next/app';
import { MantineProvider, createTheme, Modal } from '@mantine/core';
import { ToastContainer } from 'react-toastify';

const FONT_STACK = "'Segoe UI Light', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: FONT_STACK,
  headings: { fontFamily: FONT_STACK },
  defaultRadius: 0,
  colors: {
    orange: [
      '#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078',
      '#ffa94d', '#ff922b', '#fd7e14', '#f76707',
      '#e8590c', '#d9480f',
    ],
  },
  components: {
    Modal: Modal.extend({
      defaultProps: { centered: true },
      styles: {
        title: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3 },
      },
    }),
    // All inputs default to the filled variant app-wide.
    TextInput: { defaultProps: { variant: 'filled' } },
    Textarea: { defaultProps: { variant: 'filled' } },
    Select: { defaultProps: { variant: 'filled' } },
    MultiSelect: { defaultProps: { variant: 'filled' } },
    NativeSelect: { defaultProps: { variant: 'filled' } },
    NumberInput: { defaultProps: { variant: 'filled' } },
    PasswordInput: { defaultProps: { variant: 'filled' } },
    Autocomplete: { defaultProps: { variant: 'filled' } },
    TagsInput: { defaultProps: { variant: 'filled' } },
    DateInput: { defaultProps: { variant: 'filled' } },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </MantineProvider>
  );
}
