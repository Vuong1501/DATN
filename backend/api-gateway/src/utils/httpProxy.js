
import httpProxy from "express-http-proxy";
// http://product-service:3002
export const proxyRequest = (serviceUrl) => {
    return httpProxy(serviceUrl, {
        proxyReqPathResolver: (req) => {
            const path = req.originalUrl.replace(/^\/api/, "");
            console.log("path>>", path);

            console.log(`🔁 Proxying ${req.method} ${req.originalUrl} → ${serviceUrl}${path}`);
            return path;
        },
    });
};
