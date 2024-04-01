package io.javalin.zaptv;
import io.javalin.Javalin;
import io.javalin.community.ssl.SslPlugin;
import io.javalin.http.staticfiles.Location;


public class ZapTvMain {
    public static void main(String[] args) {

        SslPlugin plugin = new SslPlugin(conf -> {
            conf.pemFromPath("/path/to/cert.pem", "/path/to/key.pem");
        });

        Javalin.create(config -> {
            config.staticFiles.add("src/main/resources/public", Location.EXTERNAL);
            config.registerPlugin(plugin);
            config.router.mount(router -> {
                router.ws("/api/matchmaking", Matchmaking::websocket);
            });
        }).start(443);
    }
}