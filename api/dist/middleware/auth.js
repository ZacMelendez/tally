"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
const firebase_1 = require("../config/firebase");
async function authenticateUser(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                success: false,
                error: 'Missing or invalid authorization header'
            });
        }
        const token = authHeader.substring(7);
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        request.userId = decodedToken.uid;
    }
    catch (error) {
        console.error('Authentication error:', error);
        return reply.status(401).send({
            success: false,
            error: 'Invalid authentication token'
        });
    }
}
//# sourceMappingURL=auth.js.map