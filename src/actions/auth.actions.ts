'use server';

import { redirect } from 'next/navigation';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { setSession, clearSession } from '@/lib/auth';
import { loginSchema, LoginInput } from '@/lib/validations/auth';

export async function loginAction(data: LoginInput) {
  try {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid input' };
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    await setSession({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}
