import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";
import jwt from "jsonwebtoken";

export const verifyToken = (event: APIGatewayProxyEventV2) => {
    const authHeader = event.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Token missing or invalid format");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, Resource.JWT_SECRET.value);
        return decoded as { user_id: string };
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};
