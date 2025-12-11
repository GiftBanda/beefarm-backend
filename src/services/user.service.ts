import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { User } from '../generated/prisma';
import crypto from 'crypto';

export const createUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  role?: 'Farmer' | 'Agronomist' | 'Manager';
}): Promise<Omit<User, 'password'>> => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: 'Farmer' // default role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      passwordResetExpires: true,
      passwordResetToken: true
    }
  });

  return user;
};

export const findUserByEmail = async (email: string, includePassword = false) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: includePassword,
      createdAt: true,
      updatedAt: true,
    }
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      name: true,
    }
  });
};

// Add to user.service.ts
export const setPasswordResetToken = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  return resetToken;
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) return null;

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  });

  return updatedUser;
};