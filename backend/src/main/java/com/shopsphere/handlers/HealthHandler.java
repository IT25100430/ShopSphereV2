package com.shopsphere.handlers;

import com.shopsphere.utils.CorsUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;

public class HealthHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String response = "{\"status\":\"UP\",\"system\":\"Shop Sphere Java REST Backend\",\"port\":5000,\"engine\":\"Java 24 SE\"}";
        CorsUtil.sendJson(exchange, 200, response);
    }
}
