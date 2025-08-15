import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../config/firebase';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decodedToken = await auth.verifyIdToken(token);
    request.userId = decodedToken.uid;
    
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({
      success: false,
      error: 'Invalid authentication token'
    });
  }
}
