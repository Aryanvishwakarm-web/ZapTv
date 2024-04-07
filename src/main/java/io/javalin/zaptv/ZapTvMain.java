package io.javalin.zaptv;
import io.javalin.Javalin;
import io.javalin.community.ssl.SslPlugin;
import io.javalin.http.staticfiles.Location;


public class ZapTvMain {
    public static void main(String[] args) {


        Javalin.create(config -> {

            SslPlugin plugin = new SslPlugin(conf -> {
                conf.pemFromPath("/live/zaptv.site/fullchain.pem", "/live/zaptv.site/privkey.pem");
                conf.http2=false;
                conf.insecure=true;    
                conf.secure=true;                                                                                                                                                               
                conf.securePort=443;                                                       
               
            });
            config.registerPlugin(plugin);
            config.router.mount(router -> {
                router.ws("/api/matchmaking", Matchmaking::websocket);
            });
        }).start("0.0.0.0", 443);
    }
}
