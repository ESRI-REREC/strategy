import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextInput, PasswordInput, Button, Text, Title, Paper } from '@mantine/core';
import { IconLock, IconUser } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/auth';
import type { ArcGISUser } from '@/types';

const schema = Yup.object({
  username: Yup.string().trim().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || 'Login failed'); return; }
        setAuth(data.token as string, data.user as ArcGISUser);
        toast.success(`Welcome, ${(data.user as ArcGISUser).fullName || values.username}!`);
        router.push('/');
      } catch {
        toast.error('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #1c1a17 0%, #2d1a0e 50%, #431407 100%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="REREC logo" className="h-16 w-auto" />
        </div>

        <Paper shadow="xl" radius="lg" p={40}>
          <div className="mb-7">
            <Title order={2} style={{ fontWeight: 700, color: '#1c1a17' }}>Welcome back</Title>
            <Text c="dimmed" size="sm" mt={4}>Sign in to the REREC Strategy & Planning Portal</Text>
          </div>

          <form onSubmit={formik.handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              <TextInput
                label="Username"
                placeholder="Your ArcGIS username"
                leftSection={<IconUser size={16} />}
                size="md"
                {...formik.getFieldProps('username')}
                error={formik.touched.username && formik.errors.username}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                leftSection={<IconLock size={16} />}
                size="md"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && formik.errors.password}
              />
              <Button
                type="submit"
                loading={formik.isSubmitting}
                fullWidth
                size="md"
                mt={8}
                style={{ background: 'linear-gradient(135deg, #e8590c 0%, #fd7e14 100%)' }}
              >
                Sign in
              </Button>
            </div>
          </form>
        </Paper>

        <Text ta="center" size="xs" c="rgba(255,255,255,0.4)" mt={20}>
          Access restricted to authorized Strategy & Planning team members
        </Text>
      </div>
    </div>
  );
}
