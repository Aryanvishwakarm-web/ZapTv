package io.javalin.zaptv;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

public class ZapTvMain {
    public static void main(String[] args) {
        Javalin.create(config -> {
            config.staticFiles.add("src/main/resources/public", Location.EXTERNAL);
            config.router.mount(router -> {
                router.ws("/api/matchmaking", Matchmaking::websocket);
            });
        }).start(443);
    }
}
