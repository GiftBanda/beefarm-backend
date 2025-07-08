import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/environment';

interface TokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload,JWT_SECRET);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};